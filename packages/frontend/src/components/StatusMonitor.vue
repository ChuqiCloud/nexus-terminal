<template>
  <div class="status-monitor" :class="{ 'status-monitor--inactive': !activeSessionId }">
    <div v-if="!activeSessionId" class="status-state">
      <i class="fas fa-plug status-state__icon"></i>
      <span class="status-state__title">{{ t('layout.noActiveSession.title') }}</span>
    </div>

    <div v-else-if="currentStatusError" class="status-state status-state--error">
      <i class="fas fa-exclamation-triangle status-state__icon"></i>
      <span class="status-state__title">{{ t('statusMonitor.errorPrefix') }} {{ currentStatusError }}</span>
    </div>

    <div v-else-if="!currentServerStatus" class="status-state">
      <i class="fas fa-spinner fa-spin status-state__icon"></i>
      <span class="status-state__title">{{ t('statusMonitor.loading') }}</span>
    </div>

    <section v-else class="sm-shell">
      <!-- System Header -->
      <header class="sm-header">
        <div class="sm-header__row">
          <div class="sm-header__left">
            <i class="fas fa-desktop sm-header__icon"></i>
            <span class="sm-header__label">{{ t('statusMonitor.title') }}</span>
          </div>
          <div class="sm-header__right">
            <button
              v-if="statusMonitorShowIpBoolean && activeSessionId && sessionIpAddress"
              class="sm-chip sm-chip--interactive"
              type="button"
              :title="sessionIpAddress"
              @click="copyIpToClipboard(sessionIpAddress)"
            >
              {{ sessionIpAddress }}
            </button>
            <span class="sm-live-dot"></span>
          </div>
        </div>

        <div class="sm-header__tags">
          <span class="sm-tag">{{ displayOsName }}</span>
        </div>

        <div class="sm-header__meta">
          <span class="sm-meta">{{ t('statusMonitor.timezoneLabel') }} {{ timezoneDisplay }}</span>
          <span class="sm-meta">{{ t('statusMonitor.uptimeLabel') }} {{ uptimeDisplay }}</span>
        </div>
      </header>

      <!-- CPU Module -->
      <section class="sm-section">
        <div class="sm-section__head">
          <div class="sm-section__title-row">
            <i class="fas fa-microchip sm-section__icon"></i>
            <span class="sm-section__title">CPU</span>
          </div>
          <StatusMonitorCpuHistoryChart :cpu-history="currentCpuHistory" :compact="true" class="sm-mini-chart" />
        </div>

        <div class="sm-cpu-cores">
          <div
            v-for="item in cpuCoreItems"
            :key="item.key"
            class="sm-cpu-core"
          >
            <span class="sm-cpu-core__index">{{ item.index }}</span>
            <div class="sm-cpu-core__bar">
              <div
                class="sm-cpu-core__fill"
                :class="getCpuFillClass(item.percent)"
                :style="{ width: `${item.percent}%` }"
              ></div>
            </div>
            <span class="sm-cpu-core__val">{{ item.value }}</span>
          </div>
        </div>

        <button
          type="button"
          class="sm-link-btn"
          @click="isCpuCoreModalVisible = true"
        >
          {{ t('statusMonitor.cpuViewAllCores') }}
        </button>
      </section>

      <!-- Memory Module -->
      <section class="sm-section">
        <div class="sm-section__head">
          <div class="sm-section__title-row">
            <i class="fas fa-memory sm-section__icon"></i>
            <span class="sm-section__title">{{ t('statusMonitor.memoryCardTitle') }}</span>
          </div>
          <span class="sm-badge">{{ memoryTotalDisplay }}</span>
        </div>

        <div class="sm-memory-row">
          <div class="sm-memory-ring" :style="memoryRingStyle">
            <div class="sm-memory-ring__center">{{ memoryPercentDisplay }}</div>
          </div>

          <div class="sm-memory-stats">
            <div v-for="item in memoryStatItems" :key="item.key" class="sm-memory-stat">
              <span class="sm-dot" :class="`sm-dot--${item.key}`"></span>
              <span class="sm-memory-stat__label">{{ item.label }}</span>
              <span class="sm-memory-stat__value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Network Module -->
      <section class="sm-section">
        <div class="sm-section__head">
          <div class="sm-section__title-row">
            <i class="fas fa-network-wired sm-section__icon"></i>
            <span class="sm-section__title">{{ t('statusMonitor.networkLabel') }}</span>
          </div>
          <StatusMonitorNetworkHistoryChart
            :download-history="currentNetRxHistory"
            :upload-history="currentNetTxHistory"
            :compact="true"
            class="sm-mini-chart"
          />
        </div>

        <div class="sm-net-table">
          <div class="sm-net-table__head">
            <span></span>
            <span>{{ t('statusMonitor.networkSpeedTitleUnit', { unit: '' }).replace(/[()]/g, '').trim() }}</span>
            <span>{{ t('statusMonitor.totalTrafficLabel') }}</span>
          </div>
          <div
            v-for="item in networkFlowItems"
            :key="item.key"
            class="sm-net-row"
          >
            <span class="sm-net-row__label" :class="`sm-net-row__label--${item.tone}`">
              <i :class="['fas', item.icon]"></i>
              {{ item.label }}
            </span>
            <span class="sm-net-row__val">{{ item.value }}</span>
            <span class="sm-net-row__total">{{ item.totalValue }}</span>
          </div>
        </div>
      </section>

      <!-- Process Module -->
      <section class="sm-section">
        <div class="sm-section__head">
          <div class="sm-section__title-row">
            <i class="fas fa-list-ul sm-section__icon"></i>
            <span class="sm-section__title">{{ t('statusMonitor.processManager.title') }}</span>
          </div>
          <button class="sm-link-btn sm-link-btn--icon" type="button" @click="isProcessManagerVisible = true">
            <i class="fas fa-th-list"></i>
            {{ t('statusMonitor.processManager.viewAll') }}
          </button>
        </div>

        <div class="sm-proc-table" v-if="processPreviewItems.length > 0">
          <div class="sm-proc-head">
            <span>CPU</span>
            <span>MEM</span>
            <span>CMD</span>
          </div>
          <div
            v-for="item in processPreviewItems"
            :key="item.pid"
            class="sm-proc-row"
          >
            <span class="sm-proc-row__cpu" :class="{ 'sm-proc-row__cpu--hot': item.cpu > 50 }">{{ item.cpu.toFixed(1) }}%</span>
            <span class="sm-proc-row__mem">{{ item.memPercent !== undefined ? item.memPercent.toFixed(1) + '%' : formatProcessMemory(item.memMb) }}</span>
            <span class="sm-proc-row__cmd">
              <span class="sm-proc-row__cmd-text" :title="item.command">{{ truncateCommand(item.command) }}</span>
              <span class="sm-proc-row__pid">PID {{ item.pid }}</span>
            </span>
          </div>
        </div>
        <div v-else class="sm-empty">
          {{ t('statusMonitor.processManager.empty') }}
        </div>
      </section>

      <!-- Disk Module -->
      <section class="sm-section">
        <div class="sm-section__head">
          <div class="sm-section__title-row">
            <i class="fas fa-hdd sm-section__icon"></i>
            <span class="sm-section__title">{{ t('statusMonitor.diskCardTitle') }}</span>
          </div>
          <span class="sm-badge">{{ diskUsageDisplay }}</span>
        </div>

        <div class="sm-disk-device">
          <span class="sm-disk-device__mount">{{ diskMountPointDisplay }}</span>
          <span class="sm-disk-device__type">{{ t('statusMonitor.diskTypeLabel') }} {{ diskFsTypeDisplay }}</span>
        </div>

        <div class="sm-disk-io">
          <div class="sm-disk-io__item">
            <div class="sm-disk-io__icon"></div>
            <div class="sm-disk-io__col">
              <span class="sm-disk-io__label">{{ t('statusMonitor.diskReadRateLabel') }}</span>
              <span class="sm-disk-io__val">{{ diskReadRateDisplay }}</span>
            </div>
          </div>
          <div class="sm-disk-io__item">
            <div class="sm-disk-io__icon"></div>
            <div class="sm-disk-io__col">
              <span class="sm-disk-io__label">{{ t('statusMonitor.diskWriteRateLabel') }}</span>
              <span class="sm-disk-io__val">{{ diskWriteRateDisplay }}</span>
            </div>
          </div>
        </div>

        <div class="sm-disk-summary">
          <div class="sm-disk-summary__head">
            <span>{{ t('statusMonitor.diskMountLabel') }}</span>
            <span>{{ t('statusMonitor.diskSizeLabel') }}</span>
            <span>{{ t('statusMonitor.diskAvailableLabel') }}</span>
            <span>{{ t('statusMonitor.diskUsedPercentLabel') }}</span>
          </div>
          <div class="sm-disk-summary__row">
            <span class="sm-disk-summary__mount">{{ diskMountPointDisplay }}</span>
            <span>{{ diskSizeDisplay }}</span>
            <span>{{ diskAvailableDisplay }}</span>
            <span class="sm-disk-summary__pct">{{ diskPercentDisplay }}</span>
          </div>
        </div>
      </section>
    </section>

    <ProcessManagerModal
      :is-visible="isProcessManagerVisible"
      :session-id="activeSessionId"
      @close="isProcessManagerVisible = false"
    />
    <StatusMonitorCpuCoreModal
      :is-visible="isCpuCoreModalVisible"
      :cpu-core-items="cpuCoreItems"
      :total-cpu-percent="displayCpuPercent"
      @close="isCpuCoreModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import ProcessManagerModal from './ProcessManagerModal.vue';
import StatusMonitorCpuCoreModal from './StatusMonitorCpuCoreModal.vue';
import StatusMonitorCpuHistoryChart from './StatusMonitorCpuHistoryChart.vue';
import StatusMonitorNetworkHistoryChart from './StatusMonitorNetworkHistoryChart.vue';
import { useSessionStore } from '../stores/session.store';
import { useSettingsStore } from '../stores/settings.store';
import { useConnectionsStore } from '../stores/connections.store';
import { useUiNotificationsStore } from '../stores/uiNotifications.store';
import type { ProcessListItem, ServerStatus } from '../types/server.types';

const { t } = useI18n();
const sessionStore = useSessionStore();
const settingsStore = useSettingsStore();
const connectionsStore = useConnectionsStore();
const uiNotificationsStore = useUiNotificationsStore();
const { sessions } = storeToRefs(sessionStore);
const { statusMonitorShowIpBoolean } = storeToRefs(settingsStore);
const isCpuCoreModalVisible = ref(false);
const isProcessManagerVisible = ref(false);

const props = defineProps({
  activeSessionId: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },
});

const clampPercent = (value?: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const currentSessionState = computed(() => (props.activeSessionId ? sessions.value.get(props.activeSessionId) : null));
const currentServerStatus = computed<ServerStatus | null>(() => currentSessionState.value?.statusMonitorManager?.serverStatus?.value ?? null);
const currentCpuHistory = computed<readonly (number | null)[]>(() => currentSessionState.value?.statusMonitorManager?.cpuHistory?.value ?? Array(24).fill(null));
const currentNetRxHistory = computed<readonly (number | null)[]>(() => currentSessionState.value?.statusMonitorManager?.netRxHistory?.value ?? Array(24).fill(null));
const currentNetTxHistory = computed<readonly (number | null)[]>(() => currentSessionState.value?.statusMonitorManager?.netTxHistory?.value ?? Array(24).fill(null));

const displayCpuPercent = computed(() => clampPercent(currentServerStatus.value?.cpuPercent));
const displayMemoryPercent = computed(() => clampPercent(currentServerStatus.value?.memPercent));
const displayDiskPercent = computed(() => clampPercent(currentServerStatus.value?.diskPercent));
const currentStatusError = computed<string | null>(() => currentSessionState.value?.statusMonitorManager?.statusError?.value ?? null);
const timezoneDisplay = computed(() => currentServerStatus.value?.timezone || t('statusMonitor.notAvailable'));
const processTotalDisplay = computed(() => currentServerStatus.value?.processTotal ?? 0);
const processRunningDisplay = computed(() => currentServerStatus.value?.processRunning ?? 0);
const processSleepingDisplay = computed(() => currentServerStatus.value?.processSleeping ?? 0);

const cachedCpuModel = ref<string | null>(null);
const cachedCpuCores = ref<number | null>(null);
const cachedOsName = ref<string | null>(null);

watch(currentServerStatus, newData => {
  if (!newData) return;
  if (newData.cpuModel) cachedCpuModel.value = newData.cpuModel;
  if (typeof newData.cpuCores === 'number' && Number.isFinite(newData.cpuCores)) cachedCpuCores.value = newData.cpuCores;
  if (newData.osName) cachedOsName.value = newData.osName;
}, { immediate: true });

const displayOsName = computed(() => (currentServerStatus.value?.osName ?? cachedOsName.value) || t('statusMonitor.notAvailable'));

const formatBytesPerSecond = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return t('statusMonitor.notAvailable');
  if (bytes < 1024) return `${bytes} ${t('statusMonitor.bytesPerSecond')}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${t('statusMonitor.kiloBytesPerSecond')}`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ${t('statusMonitor.megaBytesPerSecond')}`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} ${t('statusMonitor.gigaBytesPerSecond')}`;
};

const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return t('statusMonitor.notAvailable');
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ${t('statusMonitor.megaBytes')}`;
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} ${t('statusMonitor.gigaBytes')}`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
};

const formatCompactBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return t('statusMonitor.notAvailable');
  if (bytes < 1024) return `${bytes.toFixed(1)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatStorageSizeFromKb = (kb?: number, compact = false): string => {
  if (kb === undefined || kb === null || isNaN(kb)) return t('statusMonitor.notAvailable');
  const units = compact ? ['KB', 'M', 'G', 'T'] : ['KB', t('statusMonitor.megaBytes'), t('statusMonitor.gigaBytes'), 'TB'];
  let value = kb;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatMemorySize = (mb?: number): string => {
  if (mb === undefined || mb === null || isNaN(mb)) return t('statusMonitor.notAvailable');
  if (mb < 1024) return `${mb.toFixed(1)} ${t('statusMonitor.megaBytes')}`;
  return `${(mb / 1024).toFixed(1)} ${t('statusMonitor.gigaBytes')}`;
};

const formatUptime = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds) || seconds < 0) return t('statusMonitor.notAvailable');
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}${t('statusMonitor.uptimeDaySuffix')} ${hours}${t('statusMonitor.uptimeHourSuffix')}`;
  if (hours > 0) return `${hours}${t('statusMonitor.uptimeHourSuffix')} ${minutes}${t('statusMonitor.uptimeMinuteSuffix')}`;
  return `${minutes}${t('statusMonitor.uptimeMinuteSuffix')}`;
};

const formatProcessMemory = (mb?: number): string => {
  if (mb === undefined || mb === null || !Number.isFinite(mb)) return t('statusMonitor.notAvailable');
  if (mb < 1024) return `${mb.toFixed(1)} M`;
  return `${(mb / 1024).toFixed(1)} G`;
};

const truncateCommand = (cmd: string): string => {
  if (!cmd) return '';
  const parts = cmd.split('/');
  const basename = parts[parts.length - 1] || cmd;
  return basename.length > 24 ? basename.slice(0, 22) + '...' : basename;
};

const getCpuFillClass = (percent: number): string => {
  if (percent >= 90) return 'sm-cpu-core__fill--critical';
  if (percent >= 60) return 'sm-cpu-core__fill--warn';
  return 'sm-cpu-core__fill--normal';
};

const memoryTotalValue = computed(() => currentServerStatus.value?.memTotal ?? 0);
const memoryUsedValue = computed(() => currentServerStatus.value?.memUsed ?? 0);
const memoryCachedValue = computed(() => currentServerStatus.value?.memCached ?? 0);
const memoryFreeValue = computed(() => {
  const data = currentServerStatus.value;
  if (data?.memFree !== undefined) return data.memFree;
  if (data?.memTotal !== undefined && data?.memUsed !== undefined) return Math.max(data.memTotal - data.memUsed - (data.memCached ?? 0), 0);
  return 0;
});

const memoryTotalDisplay = computed(() => formatMemorySize(currentServerStatus.value?.memTotal));
const memoryPercentDisplay = computed(() => `${Math.round(displayMemoryPercent.value)}%`);

const memoryRingStyle = computed<CSSProperties>(() => {
  const total = memoryTotalValue.value;
  if (total <= 0) return { background: 'conic-gradient(#334155 0% 100%)' };
  const usedPercent = Math.min(100, (memoryUsedValue.value / total) * 100);
  const cachedPercent = Math.min(100 - usedPercent, (memoryCachedValue.value / total) * 100);
  const usedEnd = usedPercent;
  const cacheEnd = usedPercent + cachedPercent;
  return { background: `conic-gradient(#ef5350 0 ${usedEnd}%, #8f96a3 ${usedEnd}% ${cacheEnd}%, #4ade80 ${cacheEnd}% 100%)` };
});

const memoryStatItems = computed(() => [
  { key: 'used', label: t('statusMonitor.memoryUsedStat'), value: formatMemorySize(memoryUsedValue.value) },
  { key: 'cached', label: t('statusMonitor.memoryCachedStat'), value: formatMemorySize(memoryCachedValue.value) },
  { key: 'free', label: t('statusMonitor.memoryFreeStat'), value: formatMemorySize(memoryFreeValue.value) },
]);

const diskUsageDisplay = computed(() => {
  const data = currentServerStatus.value;
  if (!data || data.diskUsed === undefined || data.diskTotal === undefined) return t('statusMonitor.notAvailable');
  return `${formatStorageSizeFromKb(data.diskUsed, true)} / ${formatStorageSizeFromKb(data.diskTotal, true)}`;
});

const diskFsTypeDisplay = computed(() => currentServerStatus.value?.diskFsType || t('statusMonitor.notAvailable'));
const diskReadRateDisplay = computed(() => formatCompactBytes(currentServerStatus.value?.diskReadRate));
const diskWriteRateDisplay = computed(() => formatCompactBytes(currentServerStatus.value?.diskWriteRate));
const diskMountPointDisplay = computed(() => currentServerStatus.value?.diskMountPoint || t('statusMonitor.notAvailable'));
const diskSizeDisplay = computed(() => formatStorageSizeFromKb(currentServerStatus.value?.diskTotal, true));
const diskAvailableDisplay = computed(() => formatStorageSizeFromKb(currentServerStatus.value?.diskAvailable, true));
const diskPercentDisplay = computed(() => `${Math.round(displayDiskPercent.value)}%`);

const sessionIpAddress = computed(() => {
  const sessionState = currentSessionState.value;
  if (!sessionState?.connectionId) return null;
  const connectionIdAsNumber = parseInt(sessionState.connectionId, 10);
  if (isNaN(connectionIdAsNumber)) return null;
  const connectionInfo = connectionsStore.connections.find(conn => conn.id === connectionIdAsNumber);
  return connectionInfo?.host || null;
});

const uptimeDisplay = computed(() => formatUptime(currentServerStatus.value?.uptimeSeconds));
const topProcessPreview = computed<readonly ProcessListItem[]>(() => currentServerStatus.value?.topProcesses ?? []);

const cpuCoreItems = computed(() => {
  const rawPercents = currentServerStatus.value?.cpuCorePercents;
  const fallbackCoreCount = (() => {
    const currentCores = currentServerStatus.value?.cpuCores;
    if (typeof currentCores !== 'number' || !Number.isFinite(currentCores) || currentCores <= 0) return 0;
    return Math.round(currentCores);
  })();
  const normalizedPercents = Array.isArray(rawPercents) && rawPercents.length > 0
    ? rawPercents
    : Array.from({ length: fallbackCoreCount }, () => 0);

  return normalizedPercents.map((percent, idx) => {
    const clampedPercent = clampPercent(percent);
    return {
      key: `cpu-core-${idx}`,
      index: idx,
      label: t('statusMonitor.cpuCoreLabel', { index: idx + 1 }),
      value: `${Math.round(clampedPercent)}%`,
      percent: clampedPercent,
    };
  });
});

const networkFlowItems = computed(() => [
  {
    key: 'upload',
    label: t('statusMonitor.uploadLabel'),
    value: formatBytesPerSecond(currentServerStatus.value?.netTxRate),
    totalValue: formatBytes(currentServerStatus.value?.netTxTotalBytes),
    tone: 'up',
    icon: 'fa-arrow-up',
  },
  {
    key: 'download',
    label: t('statusMonitor.downloadLabel'),
    value: formatBytesPerSecond(currentServerStatus.value?.netRxRate),
    totalValue: formatBytes(currentServerStatus.value?.netRxTotalBytes),
    tone: 'down',
    icon: 'fa-arrow-down',
  },
]);

const networkRateUnitLabel = computed(() => {
  const maxRate = Math.max(currentServerStatus.value?.netRxRate ?? 0, currentServerStatus.value?.netTxRate ?? 0);
  return maxRate >= 1024 * 1024 ? 'MB/s' : 'KB/s';
});

const processPreviewItems = computed<readonly ProcessListItem[]>(() => topProcessPreview.value.slice(0, 4));

const copyIpToClipboard = async (ipAddress: string | null) => {
  if (!ipAddress) return;
  try {
    await navigator.clipboard.writeText(ipAddress);
    uiNotificationsStore.showSuccess(t('common.copied', '已复制'));
  } catch (err) {
    console.error('Failed to copy IP address: ', err);
    uiNotificationsStore.showError(t('statusMonitor.copyIpError', '复制 IP 失败'));
  }
};
</script>

<style scoped>
.status-monitor {
  height: 100%;
  overflow-y: auto;
  padding: 10px;
  background: linear-gradient(180deg, #0f1419 0%, #0b1015 100%);
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
}

.status-monitor--inactive {
  background: linear-gradient(180deg, #111827, #0f172a);
}

.sm-shell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-state {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: #9ca3af;
}

.status-state--error { color: #f87171; }
.status-state__icon { font-size: 28px; }
.status-state__title { font-size: 14px; font-weight: 600; }

/* ── Header ── */
.sm-header {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.sm-header__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sm-header__left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sm-header__icon {
  color: #64748b;
  font-size: 12px;
}

.sm-header__label {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.sm-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sm-chip {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  border: none;
}

.sm-chip--interactive {
  cursor: pointer;
  transition: color 0.15s;
}

.sm-chip--interactive:hover { color: #e2e8f0; }

.sm-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
  flex-shrink: 0;
}

.sm-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.sm-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(148, 163, 184, 0.06);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 500;
}

.sm-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
  color: #64748b;
  font-size: 11px;
}

.sm-meta {
  white-space: nowrap;
}

/* ── Section (shared) ── */
.sm-section {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.sm-section:last-child { border-bottom: none; }

.sm-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.sm-section__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.sm-section__icon {
  color: #64748b;
  font-size: 11px;
}

.sm-section__title {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
}

.sm-badge {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
}

.sm-mini-chart {
  flex: 1;
  min-width: 0;
  max-width: 160px;
  height: 28px;
  overflow: hidden;
}

.sm-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  margin-top: 6px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.15s;
}

.sm-link-btn:hover { color: #94a3b8; }

.sm-link-btn--icon i { font-size: 10px; }

/* ── CPU ── */
.sm-cpu-cores {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sm-cpu-core {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sm-cpu-core__index {
  width: 12px;
  color: #64748b;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: right;
  flex-shrink: 0;
}

.sm-cpu-core__bar {
  flex: 1;
  height: 10px;
  border-radius: 2px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.sm-cpu-core__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
  min-width: 1px;
}

.sm-cpu-core__fill--normal { background: #22c55e; }
.sm-cpu-core__fill--warn { background: #f59e0b; }
.sm-cpu-core__fill--critical { background: #ef4444; }

.sm-cpu-core__val {
  width: 36px;
  color: #cbd5e1;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: right;
  flex-shrink: 0;
}

/* ── Memory ── */
.sm-memory-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sm-memory-ring {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sm-memory-ring::after {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: #0f1419;
}

.sm-memory-ring__center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  font-size: 11px;
  font-weight: 700;
}

.sm-memory-stats {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.sm-memory-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.sm-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sm-dot--used { background: #ef5350; }
.sm-dot--cached { background: #9ca3af; }
.sm-dot--free { background: #4ade80; }

.sm-memory-stat__label {
  color: #94a3b8;
  font-size: 10px;
}

.sm-memory-stat__value {
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* ── Network ── */
.sm-net-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sm-net-table__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px;
  padding: 0 0 4px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  color: #64748b;
  font-size: 10px;
}

.sm-net-table__head span:not(:first-child) { text-align: right; }

.sm-net-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px;
  padding: 4px 0;
  align-items: center;
}

.sm-net-row__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #cbd5e1;
}

.sm-net-row__label i { width: 10px; text-align: center; font-size: 10px; }
.sm-net-row__label--up i { color: #34d399; }
.sm-net-row__label--down i { color: #60a5fa; }

.sm-net-row__val,
.sm-net-row__total {
  text-align: right;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #e2e8f0;
  font-weight: 600;
}

.sm-net-row__total { color: #94a3b8; font-weight: 400; }

/* ── Process ── */
.sm-proc-table { display: flex; flex-direction: column; gap: 0; }

.sm-proc-head {
  display: grid;
  grid-template-columns: 60px 52px minmax(0, 1fr);
  gap: 6px;
  padding: 0 0 4px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
}

.sm-proc-row {
  display: grid;
  grid-template-columns: 60px 52px minmax(0, 1fr);
  gap: 6px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.04);
  align-items: center;
  font-size: 11px;
}

.sm-proc-row:last-child { border-bottom: none; }

.sm-proc-row__cpu {
  color: #e2e8f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.sm-proc-row__cpu--hot { color: #f87171; }

.sm-proc-row__mem {
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.sm-proc-row__cmd {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sm-proc-row__cmd-text {
  color: #cbd5e1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.sm-proc-row__pid {
  color: #475569;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.sm-empty {
  padding: 10px;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}

/* ── Disk ── */
.sm-disk-device {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sm-disk-device__mount {
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.sm-disk-device__type {
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
}

.sm-disk-io {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.sm-disk-io__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sm-disk-io__icon {
  width: 16px;
  height: 24px;
  border-radius: 2px;
  background: rgba(148, 163, 184, 0.12);
  flex-shrink: 0;
}

.sm-disk-io__col { display: flex; flex-direction: column; }

.sm-disk-io__label {
  color: #64748b;
  font-size: 10px;
}

.sm-disk-io__val {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.sm-disk-summary {
  border-top: 1px solid rgba(148, 163, 184, 0.06);
  padding-top: 8px;
}

.sm-disk-summary__head {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding-bottom: 4px;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
}

.sm-disk-summary__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) repeat(3, minmax(0, 1fr));
  gap: 6px;
  color: #e2e8f0;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
}

.sm-disk-summary__mount { color: #86efac; }

.sm-disk-summary__pct {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(74, 222, 128, 0.12);
  color: #86efac;
  font-size: 10px;
  width: fit-content;
}

/* ── Responsive ── */
@container (max-width: 220px) {
  .sm-memory-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .sm-memory-stats { flex-wrap: wrap; }
  .sm-disk-io { flex-direction: column; gap: 8px; }
}

@media (max-width: 640px) {
  .status-monitor { padding: 8px; }
}
</style>
