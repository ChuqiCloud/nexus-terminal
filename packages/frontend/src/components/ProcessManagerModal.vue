<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useSessionStore } from '../stores/session.store';
import { useUiNotificationsStore } from '../stores/uiNotifications.store';
import type { ProcessListItem } from '../types/server.types';
import type { ProcessListResponsePayload, ProcessSignalResponsePayload, WebSocketMessage } from '../types/websocket.types';

type ProcessSortKey = 'pid' | 'user' | 'state' | 'cpu' | 'mem' | 'startedAt' | 'command';
type ProcessSortDirection = 'asc' | 'desc';

const props = defineProps<{
  isVisible: boolean;
  sessionId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const sessionStore = useSessionStore();
const uiNotificationsStore = useUiNotificationsStore();
const { sessions } = storeToRefs(sessionStore);

const searchQuery = ref('');
const autoRefresh = ref(true);
const isLoading = ref(false);
const processItems = ref<ProcessListItem[]>([]);
const totalProcesses = ref(0);
const runningProcesses = ref(0);
const sleepingProcesses = ref(0);
const lastUpdatedAt = ref<number | null>(null);
const processError = ref<string | null>(null);
const sortKey = ref<ProcessSortKey | null>(null);
const sortDirection = ref<ProcessSortDirection>('asc');

let unregisterListResponse: (() => void) | null = null;
let unregisterListError: (() => void) | null = null;
let unregisterSignalResponse: (() => void) | null = null;
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

const currentSession = computed(() => (props.sessionId ? sessions.value.get(props.sessionId) ?? null : null));
const currentWsManager = computed(() => currentSession.value?.wsManager ?? null);

const filteredProcesses = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) {
    return processItems.value;
  }

  return processItems.value.filter(item => {
    return (
      String(item.pid).includes(keyword) ||
      item.user.toLowerCase().includes(keyword) ||
      item.command.toLowerCase().includes(keyword)
    );
  });
});

const defaultSortDirections: Record<ProcessSortKey, ProcessSortDirection> = {
  pid: 'asc',
  user: 'asc',
  state: 'asc',
  cpu: 'desc',
  mem: 'desc',
  startedAt: 'desc',
  command: 'asc',
};

const compareText = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true });

const sortedProcesses = computed(() => {
  const currentSortKey = sortKey.value;
  if (!currentSortKey) {
    return filteredProcesses.value;
  }

  const directionFactor = sortDirection.value === 'asc' ? 1 : -1;

  return filteredProcesses.value
    .map((item, index) => ({ item, index }))
    .sort((leftEntry, rightEntry) => {
      const left = leftEntry.item;
      const right = rightEntry.item;

      let result = 0;
      switch (currentSortKey) {
        case 'pid':
          result = left.pid - right.pid;
          break;
        case 'cpu':
          result = left.cpu - right.cpu;
          break;
        case 'mem':
          result = left.memMb - right.memMb;
          break;
        case 'user':
          result = compareText(left.user, right.user);
          break;
        case 'state':
          result = compareText(left.state, right.state);
          break;
        case 'startedAt':
          result = compareText(left.startedAt, right.startedAt);
          break;
        case 'command':
          result = compareText(left.command, right.command);
          break;
      }

      if (result !== 0) {
        return result * directionFactor;
      }

      return leftEntry.index - rightEntry.index;
    })
    .map(({ item }) => item);
});

const formatMemoryMb = (value: number): string => {
  if (!Number.isFinite(value)) {
    return t('statusMonitor.notAvailable');
  }
  if (value < 1024) {
    return `${value.toFixed(1)} M`;
  }
  return `${(value / 1024).toFixed(1)} G`;
};

const lastUpdatedText = computed(() => {
  if (!lastUpdatedAt.value) {
    return t('statusMonitor.notAvailable');
  }
  return new Date(lastUpdatedAt.value).toLocaleTimeString();
});

const toggleSort = (key: ProcessSortKey) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }

  sortKey.value = key;
  sortDirection.value = defaultSortDirections[key];
};

const isSortedBy = (key: ProcessSortKey) => sortKey.value === key;

const getSortIcon = (key: ProcessSortKey) => {
  if (!isSortedBy(key)) {
    return 'fas fa-sort';
  }

  return sortDirection.value === 'asc' ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
};

const getSortLabel = (key: ProcessSortKey, label: string) => {
  if (!isSortedBy(key)) {
    return label;
  }

  return `${label} - ${
    sortDirection.value === 'asc'
      ? t('common.sortAscending', '升序')
      : t('common.sortDescending', '降序')
  }`;
};

const stateTone = (state: string) => {
  switch (state) {
    case 'R':
      return 'process-state--running';
    case 'S':
    case 'D':
    case 'I':
      return 'process-state--sleeping';
    default:
      return 'process-state--other';
  }
};

const cleanupHandlers = () => {
  unregisterListResponse?.();
  unregisterListError?.();
  unregisterSignalResponse?.();
  unregisterListResponse = null;
  unregisterListError = null;
  unregisterSignalResponse = null;
};

const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
};

const closeModal = () => {
  emit('close');
};

const requestProcessList = () => {
  if (!props.isVisible || !props.sessionId || !currentWsManager.value?.isConnected.value) {
    return;
  }

  isLoading.value = true;
  currentWsManager.value.sendMessage({
    type: 'process:list',
    sessionId: props.sessionId,
    payload: { limit: 200 },
  });
};

const handleSignal = (pid: number, signal: 'TERM' | 'KILL') => {
  if (!props.sessionId || !currentWsManager.value?.isConnected.value) {
    return;
  }

  currentWsManager.value.sendMessage({
    type: 'process:signal',
    sessionId: props.sessionId,
    payload: { pid, signal },
  });
};

const attachHandlers = () => {
  cleanupHandlers();
  if (!currentWsManager.value) {
    return;
  }

  unregisterListResponse = currentWsManager.value.onMessage('process:list:response', (payload: ProcessListResponsePayload, message?: WebSocketMessage) => {
    if (message?.sessionId && message.sessionId !== props.sessionId) {
      return;
    }

    processItems.value = payload.processes ?? [];
    totalProcesses.value = payload.total ?? processItems.value.length;
    runningProcesses.value = payload.running ?? 0;
    sleepingProcesses.value = payload.sleeping ?? 0;
    lastUpdatedAt.value = payload.requestedAt ?? Date.now();
    processError.value = null;
    isLoading.value = false;
  });

  unregisterListError = currentWsManager.value.onMessage('process:list:error', (payload: { message?: string }, message?: WebSocketMessage) => {
    if (message?.sessionId && message.sessionId !== props.sessionId) {
      return;
    }

    isLoading.value = false;
    processError.value = payload?.message || t('statusMonitor.processManager.loadFailed');
  });

  unregisterSignalResponse = currentWsManager.value.onMessage('process:signal:response', (payload: ProcessSignalResponsePayload, message?: WebSocketMessage) => {
    if (message?.sessionId && message.sessionId !== props.sessionId) {
      return;
    }

    if (payload.success) {
      uiNotificationsStore.showSuccess(
        payload.signal === 'KILL'
          ? t('statusMonitor.processManager.forceKillSuccess', { pid: payload.pid })
          : t('statusMonitor.processManager.terminateSuccess', { pid: payload.pid }),
      );
      requestProcessList();
      return;
    }

    uiNotificationsStore.showError(payload.error || t('statusMonitor.processManager.signalFailed', { pid: payload.pid }));
  });
};

const syncAutoRefresh = () => {
  stopAutoRefresh();
  if (!props.isVisible || !autoRefresh.value) {
    return;
  }

  autoRefreshTimer = setInterval(() => {
    requestProcessList();
  }, 5000);
};

watch(
  () => [props.isVisible, props.sessionId, currentWsManager.value] as const,
  ([visible, sessionId, wsManager]) => {
    stopAutoRefresh();
    cleanupHandlers();

    if (!visible || !sessionId || !wsManager) {
      return;
    }

    attachHandlers();
    requestProcessList();
    syncAutoRefresh();
  },
  { immediate: true },
);

watch(autoRefresh, () => {
  syncAutoRefresh();
});

watch(
  () => props.isVisible,
  visible => {
    if (!visible) {
      stopAutoRefresh();
    }
  },
);

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

watch(
  () => props.isVisible,
  visible => {
    if (visible) {
      document.addEventListener('keydown', handleKeydown);
    } else {
      document.removeEventListener('keydown', handleKeydown);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  stopAutoRefresh();
  cleanupHandlers();
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div v-if="isVisible" class="process-modal-overlay" @click.self="closeModal">
    <div class="process-modal-shell">
      <button class="process-modal-close" type="button" @click="closeModal" :title="t('common.close', '关闭')">
        <i class="fas fa-times"></i>
      </button>

      <div class="process-modal-handle"></div>

      <header class="process-modal-toolbar">
        <input
          v-model="searchQuery"
          class="process-modal-search"
          type="text"
          :placeholder="t('statusMonitor.processManager.searchPlaceholder')"
        />

        <div class="process-modal-controls">
          <label class="process-auto-refresh">
            <span>{{ t('statusMonitor.processManager.autoRefresh') }}</span>
            <input v-model="autoRefresh" type="checkbox" />
          </label>

          <button class="process-refresh-button" type="button" @click="requestProcessList">
            <i class="fas fa-rotate-right"></i>
            <span>{{ t('statusMonitor.processManager.refresh') }}</span>
          </button>
        </div>
      </header>

      <div class="process-modal-summary">
        <span class="process-summary-pill">{{ t('statusMonitor.processManager.total') }} {{ totalProcesses }}</span>
        <span class="process-summary-pill process-summary-pill--running">{{ t('statusMonitor.processManager.running') }} {{ runningProcesses }}</span>
        <span class="process-summary-pill">{{ t('statusMonitor.processManager.sleeping') }} {{ sleepingProcesses }}</span>
        <span class="process-summary-pill">{{ t('statusMonitor.processManager.updatedAt') }} {{ lastUpdatedText }}</span>
      </div>

      <div v-if="processError" class="process-state process-state--error">
        {{ processError }}
      </div>

      <div v-else class="process-table-wrap">
        <div v-if="!isLoading && sortedProcesses.length === 0" class="process-state">
          {{ t('statusMonitor.processManager.empty') }}
        </div>

        <table v-else class="process-table">
          <thead>
            <tr>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('pid', t('statusMonitor.processManager.columns.pid'))"
                  :title="getSortLabel('pid', t('statusMonitor.processManager.columns.pid'))"
                  @click="toggleSort('pid')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.pid') }}</span>
                  <i :class="[getSortIcon('pid'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('pid') }]"></i>
                </button>
              </th>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('user', t('statusMonitor.processManager.columns.user'))"
                  :title="getSortLabel('user', t('statusMonitor.processManager.columns.user'))"
                  @click="toggleSort('user')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.user') }}</span>
                  <i :class="[getSortIcon('user'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('user') }]"></i>
                </button>
              </th>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('state', t('statusMonitor.processManager.columns.state'))"
                  :title="getSortLabel('state', t('statusMonitor.processManager.columns.state'))"
                  @click="toggleSort('state')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.state') }}</span>
                  <i :class="[getSortIcon('state'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('state') }]"></i>
                </button>
              </th>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('cpu', t('statusMonitor.processManager.columns.cpu'))"
                  :title="getSortLabel('cpu', t('statusMonitor.processManager.columns.cpu'))"
                  @click="toggleSort('cpu')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.cpu') }}</span>
                  <i :class="[getSortIcon('cpu'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('cpu') }]"></i>
                </button>
              </th>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('mem', t('statusMonitor.processManager.columns.mem'))"
                  :title="getSortLabel('mem', t('statusMonitor.processManager.columns.mem'))"
                  @click="toggleSort('mem')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.mem') }}</span>
                  <i :class="[getSortIcon('mem'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('mem') }]"></i>
                </button>
              </th>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('startedAt', t('statusMonitor.processManager.columns.start'))"
                  :title="getSortLabel('startedAt', t('statusMonitor.processManager.columns.start'))"
                  @click="toggleSort('startedAt')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.start') }}</span>
                  <i :class="[getSortIcon('startedAt'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('startedAt') }]"></i>
                </button>
              </th>
              <th>
                <button
                  class="process-sort-button"
                  type="button"
                  :aria-label="getSortLabel('command', t('statusMonitor.processManager.columns.command'))"
                  :title="getSortLabel('command', t('statusMonitor.processManager.columns.command'))"
                  @click="toggleSort('command')"
                >
                  <span>{{ t('statusMonitor.processManager.columns.command') }}</span>
                  <i :class="[getSortIcon('command'), 'process-sort-button__icon', { 'process-sort-button__icon--active': isSortedBy('command') }]"></i>
                </button>
              </th>
              <th>{{ t('statusMonitor.processManager.columns.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedProcesses" :key="item.pid">
              <td class="process-table__mono">{{ item.pid }}</td>
              <td>{{ item.user }}</td>
              <td>
                <span :class="['process-state-pill', stateTone(item.state)]">{{ item.state }}</span>
              </td>
              <td class="process-table__mono">{{ item.cpu.toFixed(1) }}%</td>
              <td class="process-table__mono">{{ formatMemoryMb(item.memMb) }}</td>
              <td class="process-table__mono">{{ item.startedAt }}</td>
              <td class="process-table__command" :title="item.command">{{ item.command }}</td>
              <td>
                <div class="process-actions">
                  <button class="process-action-button" type="button" @click="handleSignal(item.pid, 'TERM')">
                    {{ t('statusMonitor.processManager.terminate') }}
                  </button>
                  <button class="process-action-button process-action-button--danger" type="button" @click="handleSignal(item.pid, 'KILL')">
                    {{ t('statusMonitor.processManager.forceKill') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.process-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.68);
  backdrop-filter: blur(3px);
}

.process-modal-shell {
  position: relative;
  display: flex;
  max-height: min(88vh, 760px);
  width: min(96vw, 1160px);
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(12, 12, 12, 0.98));
  padding: 16px;
  color: #f8fbff;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
}

.process-modal-handle {
  align-self: center;
  width: 52px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.process-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #cbd5e1;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.process-modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fbff;
}

.process-modal-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-right: 52px;
}

.process-modal-search {
  min-width: 0;
  flex: 1;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.03);
  padding: 0 14px;
  color: #f8fbff;
  font-size: 14px;
}

.process-modal-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.process-auto-refresh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #d8e2ea;
  font-size: 13px;
}

.process-refresh-button,
.process-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: #f8fbff;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.process-refresh-button {
  height: 40px;
  padding: 0 14px;
}

.process-action-button {
  min-width: 58px;
  height: 32px;
  padding: 0 10px;
}

.process-refresh-button:hover,
.process-action-button:hover {
  border-color: rgba(148, 163, 184, 0.38);
  background: rgba(255, 255, 255, 0.08);
}

.process-action-button--danger {
  color: #fca5a5;
}

.process-modal-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.process-summary-pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.03);
  padding: 0 10px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
}

.process-summary-pill--running {
  color: #bbf7d0;
}

.process-table-wrap {
  min-height: 0;
  flex: 1;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.process-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
  background: rgba(12, 12, 12, 0.96);
}

.process-table th,
.process-table td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  padding: 12px 10px;
  text-align: left;
  font-size: 13px;
}

.process-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(22, 22, 22, 0.98);
  color: #9fb0bf;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.process-sort-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.process-sort-button__icon {
  color: rgba(159, 176, 191, 0.56);
  font-size: 11px;
}

.process-sort-button__icon--active {
  color: #f8fbff;
}

.process-table__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.process-table__command {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.process-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.process-state,
.process-state-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.process-state {
  min-height: 180px;
  color: #9fb0bf;
}

.process-state--error {
  color: #fca5a5;
}

.process-state-pill {
  min-width: 36px;
  padding: 4px 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.process-state--running {
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(22, 101, 52, 0.26);
  color: #bbf7d0;
}

.process-state--sleeping {
  border-color: rgba(37, 99, 235, 0.24);
  background: rgba(30, 64, 175, 0.22);
  color: #bfdbfe;
}

.process-state--other {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(51, 65, 85, 0.28);
  color: #cbd5e1;
}

@media (max-width: 860px) {
  .process-modal-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding-right: 52px;
  }

  .process-modal-controls {
    justify-content: space-between;
  }
}
</style>
