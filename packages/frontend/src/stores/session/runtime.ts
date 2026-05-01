export const SSH_COMMAND_RUNTIME_MIN_VISIBLE_MS = 350;

export type SshCommandRuntimePhase =
  | 'idle'
  | 'typing'
  | 'pending'
  | 'running'
  | 'disconnected'
  | 'error';

export type SshCommandRuntimeReason =
  | 'init'
  | 'connected'
  | 'input'
  | 'submit'
  | 'output'
  | 'prompt'
  | 'interrupt'
  | 'disconnect'
  | 'error';

export interface SshCommandRuntimeSnapshot {
  phase: SshCommandRuntimePhase;
  reason: SshCommandRuntimeReason;
  lastTransitionAt: number;
  visibleUntil: number;
}

export const createSshCommandRuntimeSnapshot = (
  overrides: Partial<SshCommandRuntimeSnapshot> = {},
): SshCommandRuntimeSnapshot => ({
  phase: 'idle',
  reason: 'init',
  lastTransitionAt: 0,
  visibleUntil: 0,
  ...overrides,
});

export const isSshCommandRuntimeActive = (phase: SshCommandRuntimePhase): boolean =>
  phase === 'pending' || phase === 'running';
