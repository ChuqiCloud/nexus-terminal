import type { Ref } from 'vue';
import type { FileTab as OriginalFileTab } from '../fileEditor.store';
import type { WsConnectionStatus } from '../../composables/useWebSocketConnection';
import type { DockerManagerInstance as OriginalDockerManagerInstance } from '../../composables/useDockerManager';
import type { createWebSocketConnectionManager } from '../../composables/useWebSocketConnection';
import type { createSftpActionsManager } from '../../composables/useSftpActions';
import type { createSshTerminalManager } from '../../composables/useSshTerminal';
import type { createStatusMonitorManager } from '../../composables/useStatusMonitor';
import type { SshCommandRuntimePhase, SshCommandRuntimeSnapshot } from './runtime';

export type WsManagerInstance = ReturnType<typeof createWebSocketConnectionManager>;
export type SftpManagerInstance = ReturnType<typeof createSftpActionsManager>;
export type SshTerminalInstance = ReturnType<typeof createSshTerminalManager>;
export type StatusMonitorInstance = ReturnType<typeof createStatusMonitorManager>;
export type DockerManagerInstance = OriginalDockerManagerInstance;
export type FileTab = OriginalFileTab;

export interface SessionState {
  sessionId: string;
  connectionId: string;
  connectionName: string;
  terminalIndex: number;
  wsManager: WsManagerInstance;
  sftpManagers: Map<string, SftpManagerInstance>;
  terminalManager: SshTerminalInstance;
  statusMonitorManager: StatusMonitorInstance;
  dockerManager: DockerManagerInstance;
  editorTabs: Ref<FileTab[]>;
  activeEditorTabId: Ref<string | null>;
  commandInputContent: Ref<string>;
  commandRuntime: Ref<SshCommandRuntimeSnapshot>;
  terminalInputBuffer: Ref<string>;
  isResuming?: boolean;
  isMarkedForSuspend?: boolean;
  createdAt: number;
  disposables?: (() => void)[];
  pendingOutput?: string[];
}

export interface SessionTabInfoWithStatus {
  sessionId: string;
  connectionId: string;
  connectionName: string;
  terminalIndex: number;
  status: WsConnectionStatus;
  isMarkedForSuspend?: boolean;
  commandRuntimePhase: SshCommandRuntimePhase;
  isCommandRunning: boolean;
}
