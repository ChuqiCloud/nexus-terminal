import { ref, readonly, ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { sessions as globalSessionsRef } from '../stores/session/state';
import type { Terminal } from 'xterm';
import type { SearchAddon, ISearchOptions } from '@xterm/addon-search';
import type { WebSocketMessage, MessagePayload } from '../types/websocket.types';

export interface SshTerminalDependencies {
    sendMessage: (message: WebSocketMessage) => void;
    onMessage: (type: string, handler: (payload: any, fullMessage?: WebSocketMessage) => void) => () => void;
    isConnected: ComputedRef<boolean>;
}

const OSC_SEQUENCE_RE = /\x1B\][^\x07]*(?:\x07|\x1B\\)/g;
const CSI_SEQUENCE_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const SINGLE_ESC_RE = /\x1B[@-Z\\-_]/g;
const INPUT_ESCAPE_RE = /(?:\x1B\[[0-?]*[ -/]*[@-~])|(?:\x1B[@-Z\\-_])/g;
const SHELL_PROMPT_PATTERNS = [
    /^(?:\[[^\]]+\]\s*)?[\w.-]+@[\w.-]+(?::[^\r\n]*)?[#$%>] ?$/,
    /^(?:[A-Za-z]:)?[\\/][^>\r\n]*> ?$/,
    /^PS [^>\r\n]+> ?$/,
    /^(?:~|\/)[^#$%>\r\n]*[#$%>] ?$/,
    /^[\w.-]+\s[%#] ?$/,
    /^[#$%>] ?$/,
];

const stripTerminalControlSequences = (text: string): string =>
    text
        .replace(OSC_SEQUENCE_RE, '')
        .replace(CSI_SEQUENCE_RE, '')
        .replace(SINGLE_ESC_RE, '');

const getSessionState = (sessionId: string) => globalSessionsRef.value.get(sessionId);

const resetSessionCommandRuntime = (sessionId: string) => {
    const session = getSessionState(sessionId);
    if (!session) {
        return;
    }

    session.isCommandRunning.value = false;
    session.terminalInputBuffer.value = '';
};

const syncSessionCommandRuntimeFromInput = (sessionId: string, data: string) => {
    const session = getSessionState(sessionId);
    if (!session) {
        return { submittedCommand: false, interrupted: false };
    }

    const normalizedData = data.replace(INPUT_ESCAPE_RE, '');
    if (!normalizedData) {
        return { submittedCommand: false, interrupted: false };
    }

    let nextBuffer = session.terminalInputBuffer.value;
    let submittedCommand = false;
    let interrupted = false;

    for (const char of normalizedData) {
        if (char === '\x03') {
            session.isCommandRunning.value = false;
            nextBuffer = '';
            interrupted = true;
            continue;
        }

        if (char === '\r' || char === '\n') {
            if (nextBuffer.trim().length > 0) {
                session.isCommandRunning.value = true;
                submittedCommand = true;
            }
            nextBuffer = '';
            continue;
        }

        if (char === '\b' || char === '\u007f') {
            nextBuffer = nextBuffer.slice(0, -1);
            continue;
        }

        if (char < ' ') {
            continue;
        }

        if (nextBuffer.length === 0 && session.isCommandRunning.value) {
            session.isCommandRunning.value = false;
        }

        nextBuffer += char;
    }

    session.terminalInputBuffer.value = nextBuffer;
    return { submittedCommand, interrupted };
};

const getPromptProbeText = (outputData: string | Uint8Array): string => {
    if (typeof outputData === 'string') {
        return outputData;
    }

    try {
        return new TextDecoder().decode(outputData);
    } catch {
        return '';
    }
};

const isPromptTail = (tail: string): boolean => {
    const normalizedTail = stripTerminalControlSequences(tail);
    const lines = normalizedTail
        .split(/\r?\n/)
        .map((line) => line.replace(/\r/g, '').trimEnd());

    for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index].trim();
        if (!line) {
            continue;
        }

        return SHELL_PROMPT_PATTERNS.some((pattern) => pattern.test(line));
    }

    return false;
};

/**
 * 创建一个 SSH 终端管理器实例
 * @param sessionId 会话唯一标识符
 * @param wsDeps WebSocket 依赖对象
 * @param t i18n 翻译函数，从父组件传入
 * @returns SSH 终端管理器实例
 */
export function createSshTerminalManager(sessionId: string, wsDeps: SshTerminalDependencies, t: ReturnType<typeof useI18n>['t']) {
    const { sendMessage, onMessage, isConnected } = wsDeps;

    const terminalInstance = ref<Terminal | null>(null);
    const searchAddon = ref<SearchAddon | null>(null);
    const terminalOutputBuffer = ref<(string | Uint8Array)[]>([]);
    const isSshConnected = ref(false);
    const promptProbeBuffer = ref('');

    const getTerminalText = (key: string, params?: Record<string, unknown>): string => {
        const translationKey = `workspace.terminal.${key}`;
        const translated = t(translationKey, params || {});
        return translated === translationKey ? key : translated;
    };

    const handleTerminalReady = (payload: { terminal: Terminal; searchAddon: SearchAddon | null }) => {
        const { terminal: term, searchAddon: addon } = payload;
        console.log(`[会话 ${sessionId}][SSH终端模块] 终端实例已就绪。SearchAddon 实例:`, addon ? '存在' : '不存在');
        terminalInstance.value = term;
        searchAddon.value = addon;

        const currentSessionState = globalSessionsRef.value.get(sessionId);
        if (currentSessionState?.pendingOutput?.length) {
            currentSessionState.pendingOutput.forEach((data) => {
                term.write(data);
            });
            currentSessionState.pendingOutput = [];

            if (currentSessionState.isResuming) {
                currentSessionState.isResuming = false;
            }
        }

        if (terminalOutputBuffer.value.length > 0) {
            terminalOutputBuffer.value.forEach((data) => {
                term.write(data);
            });
            terminalOutputBuffer.value = [];
        }
    };

    const handleTerminalData = (data: string) => {
        const runtimeUpdate = syncSessionCommandRuntimeFromInput(sessionId, data);
        if (runtimeUpdate.submittedCommand || runtimeUpdate.interrupted) {
            promptProbeBuffer.value = '';
        }
        sendMessage({ type: 'ssh:input', sessionId, payload: { data } });
    };

    const handleTerminalResize = (dimensions: { cols: number; rows: number }) => {
        console.log(`[SSH ${sessionId}] handleTerminalResize called with:`, dimensions);
        if (isConnected.value) {
            sendMessage({ type: 'ssh:resize', sessionId, payload: dimensions });
        } else {
            console.log(`[SSH ${sessionId}] WebSocket not connected, skipping ssh:resize.`);
        }
    };

    const handleSshOutput = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        let outputData = payload;
        if (message?.encoding === 'base64' && typeof outputData === 'string') {
            try {
                const binaryString = atob(outputData);
                const bytes = new Uint8Array(binaryString.length);
                for (let index = 0; index < binaryString.length; index += 1) {
                    bytes[index] = binaryString.charCodeAt(index);
                }
                outputData = bytes;
            } catch (error) {
                console.error(`[会话 ${sessionId}][SSH终端模块] Base64 解码失败:`, error, '原始数据:', message.payload);
                outputData = `\r\n[解码错误: ${error}]\r\n`;
            }
        } else if (typeof outputData !== 'string') {
            console.warn(`[会话 ${sessionId}][SSH终端模块] 收到非字符串 ssh:output payload:`, outputData);
            try {
                outputData = JSON.stringify(outputData);
            } catch {
                outputData = String(outputData);
            }
        }

        if (terminalInstance.value) {
            terminalInstance.value.write(outputData);
        } else {
            terminalOutputBuffer.value.push(outputData);
        }

        if (getSessionState(sessionId)?.isCommandRunning.value) {
            const promptProbeText = getPromptProbeText(outputData);
            if (promptProbeText) {
                promptProbeBuffer.value = `${promptProbeBuffer.value}${promptProbeText}`.slice(-320);
                if (isPromptTail(promptProbeBuffer.value)) {
                    resetSessionCommandRuntime(sessionId);
                }
            }
        }
    };

    const handleSshConnected = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        console.log(`[会话 ${sessionId}][SSH终端模块] SSH 会话已连接。 Payload:`, payload, 'Full message:', message);
        isSshConnected.value = true;
        promptProbeBuffer.value = '';
        terminalInstance.value?.focus();

        if (terminalInstance.value) {
            const currentDimensions = { cols: terminalInstance.value.cols, rows: terminalInstance.value.rows };
            if (currentDimensions.cols > 0 && currentDimensions.rows > 0) {
                console.log(`[会话 ${sessionId}][SSH终端模块] SSH 连接成功，主动发送初始尺寸:`, currentDimensions);
                sendMessage({ type: 'ssh:resize', sessionId, payload: currentDimensions });
            } else {
                console.warn(`[会话 ${sessionId}][SSH终端模块] SSH 连接成功，但获取到的初始尺寸无效，跳过发送 resize:`, currentDimensions);
            }
        } else {
            console.warn(`[会话 ${sessionId}][SSH终端模块] SSH 连接成功，但 terminalInstance 不可用，无法发送初始 resize。`);
        }

        if (terminalOutputBuffer.value.length > 0) {
            console.warn(`[会话 ${sessionId}][SSH终端模块] SSH 连接时仍有缓冲数据，正在写入...`);
            terminalOutputBuffer.value.forEach((data) => terminalInstance.value?.write(data));
            terminalOutputBuffer.value = [];
        }
    };

    const handleSshDisconnected = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        const reason = payload || t('workspace.terminal.unknownReason');
        console.log(`[会话 ${sessionId}][SSH终端模块] SSH 会话已断开:`, reason);
        isSshConnected.value = false;
        promptProbeBuffer.value = '';
        resetSessionCommandRuntime(sessionId);
        terminalInstance.value?.writeln(`\r\n\x1b[31m${getTerminalText('disconnectMsg', { reason })}\x1b[0m`);
    };

    const handleSshError = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        const errorMsg = payload || t('workspace.terminal.unknownSshError');
        console.error(`[会话 ${sessionId}][SSH终端模块] SSH 错误:`, errorMsg);
        isSshConnected.value = false;
        promptProbeBuffer.value = '';
        resetSessionCommandRuntime(sessionId);
        terminalInstance.value?.writeln(`\r\n\x1b[31m${getTerminalText('genericErrorMsg', { message: errorMsg })}\x1b[0m`);
    };

    const handleSshStatus = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        const statusKey = payload?.key || 'unknown';
        const statusParams = payload?.params || {};
        console.log(`[会话 ${sessionId}][SSH终端模块] 收到 SSH 状态更新:`, statusKey, statusParams);
    };

    const handleInfoMessage = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        console.log(`[会话 ${sessionId}][SSH终端模块] 收到后端信息:`, payload);
        terminalInstance.value?.writeln(`\r\n\x1b[34m${getTerminalText('infoPrefix')} ${payload}\x1b[0m`);
    };

    const handleErrorMessage = (payload: MessagePayload, message?: WebSocketMessage) => {
        if (message?.sessionId && message.sessionId !== sessionId) {
            return;
        }

        const errorMsg = payload || t('workspace.terminal.unknownGenericError');
        console.error(`[会话 ${sessionId}][SSH终端模块] 收到后端通用错误:`, errorMsg);
        terminalInstance.value?.writeln(`\r\n\x1b[31m${getTerminalText('errorPrefix')} ${errorMsg}\x1b[0m`);
    };

    const unregisterHandlers: (() => void)[] = [];

    const registerSshHandlers = () => {
        unregisterHandlers.push(onMessage('ssh:output', handleSshOutput));
        unregisterHandlers.push(onMessage('ssh:connected', handleSshConnected));
        unregisterHandlers.push(onMessage('ssh:disconnected', handleSshDisconnected));
        unregisterHandlers.push(onMessage('ssh:error', handleSshError));
        unregisterHandlers.push(onMessage('ssh:status', handleSshStatus));
        unregisterHandlers.push(onMessage('info', handleInfoMessage));
        unregisterHandlers.push(onMessage('error', handleErrorMessage));
        console.log(`[会话 ${sessionId}][SSH终端模块] 已注册 SSH 相关消息处理器。`);
    };

    const unregisterAllSshHandlers = () => {
        console.log(`[会话 ${sessionId}][SSH终端模块] 注销 SSH 相关消息处理器...`);
        unregisterHandlers.forEach((unregister) => unregister?.());
        unregisterHandlers.length = 0;
    };

    registerSshHandlers();

    const cleanup = () => {
        unregisterAllSshHandlers();
        terminalInstance.value = null;
        console.log(`[会话 ${sessionId}][SSH终端模块] 已清理。`);
    };

    /**
     * 直接发送数据到 SSH 会话（例如，从命令输入栏）
     * @param data 要发送的字符串数据
     */
    const sendData = (data: string) => {
        const runtimeUpdate = syncSessionCommandRuntimeFromInput(sessionId, data);
        if (runtimeUpdate.submittedCommand || runtimeUpdate.interrupted) {
            promptProbeBuffer.value = '';
        }
        sendMessage({ type: 'ssh:input', sessionId, payload: { data } });
    };

    const searchNext = (term: string, options?: ISearchOptions): boolean => {
        if (searchAddon.value) {
            console.log(`[会话 ${sessionId}][SSH终端模块] 执行 searchNext: "${term}"`);
            return searchAddon.value.findNext(term, options);
        }

        console.warn(`[会话 ${sessionId}][SSH终端模块] searchNext 调用失败，searchAddon 不可用。`);
        return false;
    };

    const searchPrevious = (term: string, options?: ISearchOptions): boolean => {
        if (searchAddon.value) {
            console.log(`[会话 ${sessionId}][SSH终端模块] 执行 searchPrevious: "${term}"`);
            return searchAddon.value.findPrevious(term, options);
        }

        console.warn(`[会话 ${sessionId}][SSH终端模块] searchPrevious 调用失败，searchAddon 不可用。`);
        return false;
    };

    const clearTerminalSearch = () => {
        if (searchAddon.value) {
            console.log(`[会话 ${sessionId}][SSH终端模块] 清除搜索高亮。`);
            searchAddon.value.clearDecorations();
        }

        console.log(`[会话 ${sessionId}][SSH终端模块] 搜索高亮已清除（状态不再管理）。`);
    };

    return {
        handleTerminalReady,
        handleTerminalData,
        handleTerminalResize,
        sendData,
        cleanup,
        searchNext,
        searchPrevious,
        clearTerminalSearch,
        isSshConnected: readonly(isSshConnected),
        terminalInstance,
    };
}

export function useSshTerminal() {
    console.warn('⚠️ 使用已弃用的 useSshTerminal() 全局单例。请迁移到 createSshTerminalManager() 工厂函数。');

    const terminalInstance = ref<Terminal | null>(null);

    const handleTerminalReady = (term: Terminal) => {
        console.log('[SSH终端模块][旧] 终端实例已就绪，但使用了已弃用的单例模式。');
        terminalInstance.value = term;
    };

    const handleTerminalData = () => {
        console.warn('[SSH终端模块][旧] 收到终端数据，但使用了已弃用的单例模式，无法发送。');
    };

    const handleTerminalResize = () => {
        console.warn('[SSH终端模块][旧] 收到终端大小调整，但使用了已弃用的单例模式，无法发送。');
    };

    return {
        terminalInstance,
        handleTerminalReady,
        handleTerminalData,
        handleTerminalResize,
        registerSshHandlers: () => console.warn('[SSH终端模块][旧] 调用了已弃用的 registerSshHandlers'),
        unregisterAllSshHandlers: () => console.warn('[SSH终端模块][旧] 调用了已弃用的 unregisterAllSshHandlers'),
    };
}
