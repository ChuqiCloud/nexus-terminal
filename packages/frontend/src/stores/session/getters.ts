import { computed } from 'vue';
import { sessions, activeSessionId } from './state';
import type { SessionState, SessionTabInfoWithStatus } from './types';
import { isSshCommandRuntimeActive } from './runtime';

export const sessionTabs = computed(() => {
  return Array.from(sessions.value.values()).map((session) => ({
    sessionId: session.sessionId,
    connectionId: session.connectionId,
    connectionName: session.connectionName,
    terminalIndex: session.terminalIndex,
  }));
});

export const sessionTabsWithStatus = computed((): SessionTabInfoWithStatus[] => {
  const sessionOrderStr = localStorage.getItem('sessionOrder');
  let sessionOrder: string[] = [];

  if (sessionOrderStr) {
    try {
      sessionOrder = JSON.parse(sessionOrderStr);
      console.log('[SessionGetters] 使用本地存储的用户自定义标签页顺序');
    } catch (error) {
      console.error('[SessionGetters] 解析本地存储的标签页顺序失败', error);
      sessionOrder = [];
    }
  }

  const sessionList = Array.from(sessions.value.values());
  const orderedSessions = sessionOrder.length > 0
    ? sessionList.sort((left, right) => {
        const leftIndex = sessionOrder.indexOf(left.sessionId);
        const rightIndex = sessionOrder.indexOf(right.sessionId);

        if (leftIndex === -1 && rightIndex === -1) {
          return left.createdAt - right.createdAt;
        }

        if (leftIndex === -1) {
          return 1;
        }

        if (rightIndex === -1) {
          return -1;
        }

        return leftIndex - rightIndex;
      })
    : sessionList.sort((left, right) => left.createdAt - right.createdAt);

  return orderedSessions.map((session) => ({
    sessionId: session.sessionId,
    connectionId: session.connectionId,
    connectionName: session.connectionName,
    terminalIndex: session.terminalIndex,
    status: session.wsManager.connectionStatus.value,
    isMarkedForSuspend: session.isMarkedForSuspend,
    commandRuntimePhase: session.commandRuntime.value.phase,
    isCommandRunning: isSshCommandRuntimeActive(session.commandRuntime.value.phase),
  }));
});

export const activeSession = computed((): SessionState | null => {
  if (!activeSessionId.value) {
    return null;
  }

  return sessions.value.get(activeSessionId.value) || null;
});
