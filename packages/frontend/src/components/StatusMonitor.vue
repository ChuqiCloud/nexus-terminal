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

    <section v-else class="status-monitor-shell">
      <header class="monitor-header">
        <div class="monitor-header__top">
          <div class="monitor-header__identity">
            <span class="monitor-header__eyebrow">{{ t('statusMonitor.title') }}</span>
            <h4 class="monitor-header__title">{{ displayOsName }}</h4>
          </div>

          <div class="monitor-header__status">
            <button
              v-if="statusMonitorShowIpBoolean && activeSessionId && sessionIpAddress"
              class="monitor-chip monitor-chip--interactive"
              type="button"
              :title="sessionIpAddress"
              @click="copyIpToClipboard(sessionIpAddress)"
            >
              <span class="monitor-chip__label">IP</span>
              <span class="monitor-chip__value">{{ sessionIpAddress }}</span>
            </button>

            <span class="monitor-live-pill">
              <span class="monitor-live-pill__dot"></span>
              LIVE
            </span>
          </div>
        </div>

        <div class="monitor-header__chip-row">
          <span class="monitor-header__badge">{{ networkInterfaceDisplay }}</span>
          <span class="monitor-header__badge monitor-header__badge--subtle">{{ displayCpuCores }}</span>
        </div>

        <p class="monitor-header__subtitle">{{ displayCpuModel }}</p>

        <div class="monitor-header__meta-line">
          <div v-for="item in systemCardMetaItems" :key="item.key" class="monitor-header__meta-item">
            <span class="monitor-header__meta-label">{{ item.label }}</span>
            <span class="monitor-header__meta-value">{{ item.value }}</span>
          </div>
        </div>
      </header>

      <section class="monitor-module monitor-module--usage">
        <div class="monitor-module__heading">
          <div>
            <span class="monitor-module__eyebrow">{{ t('statusMonitor.cpuLabel') }}</span>
            <h5 class="monitor-module__title">{{ t('statusMonitor.cpuUsageTitle') }}</h5>
          </div>
          <span class="monitor-module__pill">{{ displayCpuCores }}</span>
        </div>

        <div class="module-split module-split--cpu">
          <StatusMonitorCpuHistoryChart :cpu-history="currentCpuHistory" />

          <div class="cpu-core-panel">
            <div class="cpu-core-grid">
              <article
                v-for="item in cpuCoreItems"
                :key="item.key"
                class="usage-lane usage-lane--cpu"
              >
                <div class="usage-lane__content">
                  <div class="usage-lane__meta">
                    <span class="usage-lane__label">{{ item.label }}</span>
                    <span class="usage-lane__value-inline">{{ item.value }}</span>
                  </div>
                  <div class="usage-lane__track">
                    <span class="usage-lane__fill" :style="{ width: `${item.percent}%` }"></span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div class="monitor-module-grid">
        <section class="monitor-module monitor-module--memory">
          <div class="monitor-module__heading">
            <div>
              <span class="monitor-module__eyebrow">{{ t('statusMonitor.memoryCardTitle') }}</span>
              <h5 class="monitor-module__title">{{ t('statusMonitor.memoryUsedStat') }} / {{ t('statusMonitor.memoryFreeStat') }}</h5>
            </div>
            <span class="monitor-module__pill">{{ memoryTotalDisplay }}</span>
          </div>

          <div class="module-split module-split--memory">
            <div class="memory-ring-panel">
              <div class="memory-ring" :style="memoryRingStyle">
                <div class="memory-ring__center">{{ memoryPercentDisplay }}</div>
              </div>
              <span class="memory-ring-panel__caption">{{ t('statusMonitor.memoryCardTitle') }}</span>
            </div>

            <div class="memory-stat-stack">
              <div
                v-for="item in memoryStatItems"
                :key="item.key"
                class="memory-stat"
              >
                <div class="memory-stat__label">
                  <span class="memory-stat__dot" :class="`memory-stat__dot--${item.key}`"></span>
                  <span>{{ item.label }}</span>
                </div>
                <div class="memory-stat__value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="monitor-module monitor-module--network">
          <div class="monitor-module__heading">
            <div>
              <span class="monitor-module__eyebrow">{{ t('statusMonitor.networkLabel') }}</span>
              <h5 class="monitor-module__title">{{ t('statusMonitor.networkLabel') }}</h5>
            </div>
            <span class="monitor-module__pill">{{ t('statusMonitor.networkSpeedTitleUnit', { unit: networkRateUnitLabel }) }}</span>
          </div>

          <div class="module-split module-split--network">
            <StatusMonitorNetworkHistoryChart
              :download-history="currentNetRxHistory"
              :upload-history="currentNetTxHistory"
            />

            <div class="network-table">
              <div class="network-table__header">
                <span>{{ networkInterfaceDisplay }}</span>
                <span>{{ t('statusMonitor.downloadLabel') }} / {{ t('statusMonitor.uploadLabel') }}</span>
              </div>
              <div class="network-table__columns">
                <span></span>
                <span>{{ t('statusMonitor.networkSpeedTitleUnit', { unit: networkRateUnitLabel }) }}</span>
                <span>{{ t('statusMonitor.totalTrafficLabel') }}</span>
              </div>

              <div class="network-stat-stack">
                <article
                  v-for="item in networkFlowItems"
                  :key="item.key"
                  :class="['network-stat', `network-stat--${item.tone}`]"
                >
                  <span class="network-stat__label">
                    <i :class="['fas', item.icon]"></i>
                    <span>{{ item.label }}</span>
                  </span>
                  <span class="network-stat__value">{{ item.value }}</span>
                  <span class="network-stat__total">{{ item.totalValue }}</span>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section class="monitor-module monitor-module--disk">
          <div class="monitor-module__heading">
            <div>
              <span class="monitor-module__eyebrow">{{ t('statusMonitor.diskCardTitle') }}</span>
              <h5 class="monitor-module__title">{{ diskUsageDisplay }}</h5>
            </div>
            <span class="monitor-module__pill">{{ diskPercentDisplay }}</span>
          </div>

          <div class="disk-compact-top">
            <div class="disk-device-card">
              <div class="disk-device-card__head">
                <span class="disk-device-card__mount">{{ diskMountPointDisplay }}</span>
                <span class="disk-device-card__type">{{ diskFsTypeDisplay }}</span>
              </div>
              <div class="disk-device-card__body">
                <div class="disk-device-card__icon">
                  <div class="disk-device-card__icon-fill" :style="{ height: `${Math.max(10, displayDiskPercent)}%` }"></div>
                </div>
                <div class="disk-device-card__device">{{ diskDeviceAccent }}</div>
              </div>
            </div>

            <div class="disk-io-card">
              <span class="disk-io-card__label">{{ t('statusMonitor.diskReadRateLabel') }}</span>
              <span class="disk-io-card__value">{{ diskReadRateDisplay }}</span>
            </div>

            <div class="disk-io-card">
              <span class="disk-io-card__label">{{ t('statusMonitor.diskWriteRateLabel') }}</span>
              <span class="disk-io-card__value">{{ diskWriteRateDisplay }}</span>
            </div>
          </div>

          <div class="disk-summary-table">
            <div class="disk-summary-table__head">
              <span>{{ t('statusMonitor.diskMountLabel') }}</span>
              <span>{{ t('statusMonitor.diskSizeLabel') }}</span>
              <span>{{ t('statusMonitor.diskAvailableLabel') }}</span>
              <span>{{ t('statusMonitor.diskUsedPercentLabel') }}</span>
            </div>
            <div class="disk-summary-table__row">
              <span class="disk-summary-table__mount">{{ diskMountPointDisplay }}</span>
              <span>{{ diskSizeDisplay }}</span>
              <span>{{ diskAvailableDisplay }}</span>
              <span class="disk-summary-table__used">{{ diskPercentDisplay }}</span>
            </div>
          </div>
        </section>

        <section class="monitor-module monitor-module--process">
          <div class="monitor-module__heading">
            <div>
              <span class="monitor-module__eyebrow">{{ t('statusMonitor.processManager.title') }}</span>
            </div>
            <div class="monitor-module__heading-actions">
              <div class="process-summary-pills">
                <span v-for="item in processSummaryItems" :key="item.key" class="monitor-module__pill">
                  {{ item.label }} {{ item.value }}
                </span>
              </div>
              <button class="monitor-action-button" type="button" @click="isProcessManagerVisible = true">
                {{ t('statusMonitor.processManager.viewAll') }}
              </button>
            </div>
          </div>

          <div v-if="processPreviewItems.length > 0" class="process-preview-list">
            <article v-for="item in processPreviewItems" :key="item.pid" class="process-preview-item">
              <div class="process-preview-item__rail">
                <span class="process-preview-item__pid">PID {{ item.pid }}</span>
                <span class="process-preview-item__user">{{ item.user }}</span>
                <span class="process-preview-item__state">{{ item.state }}</span>
              </div>
              <div class="process-preview-item__main">
                <div class="process-preview-item__command" :title="item.command">{{ item.command }}</div>
                <div class="process-preview-item__stats">
                  <span class="process-preview-item__cpu">{{ item.cpu.toFixed(1) }}%</span>
                  <span class="process-preview-item__mem">{{ formatProcessMemory(item.memMb) }}</span>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="process-preview-empty">
            {{ t('statusMonitor.processManager.empty') }}
          </div>
        </section>
      </div>

    </section>

    <ProcessManagerModal
      :is-visible="isProcessManagerVisible"
      :session-id="activeSessionId"
      @close="isProcessManagerVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import ProcessManagerModal from './ProcessManagerModal.vue';
import StatusMonitorCpuHistoryChart from './StatusMonitorCpuHistoryChart.vue';
import StatusMonitorNetworkHistoryChart from './StatusMonitorNetworkHistoryChart.vue';
import { useSessionStore } from '../stores/session.store';
import { useSettingsStore } from '../stores/settings.store';
import { useConnectionsStore } from '../stores/connections.store';
import { useUiNotificationsStore } from '../stores/uiNotifications.store';
import type { ProcessListItem, ServerStatus } from '../types/server.types';

interface MonitorOverviewItem {
  key: string;
  label: string;
  value: string;
  clickable?: boolean;
}

const { t } = useI18n();
const sessionStore = useSessionStore();
const settingsStore = useSettingsStore();
const connectionsStore = useConnectionsStore();
const uiNotificationsStore = useUiNotificationsStore();
const { sessions } = storeToRefs(sessionStore);
const { statusMonitorShowIpBoolean } = storeToRefs(settingsStore);
const isProcessManagerVisible = ref(false);

const props = defineProps({
  activeSessionId: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },
});

const clampPercent = (value?: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

const currentSessionState = computed(() => (props.activeSessionId ? sessions.value.get(props.activeSessionId) : null));
const currentServerStatus = computed<ServerStatus | null>(() => currentSessionState.value?.statusMonitorManager?.serverStatus?.value ?? null);
const currentCpuHistory = computed<readonly (number | null)[]>(() => currentSessionState.value?.statusMonitorManager?.cpuHistory?.value ?? Array(24).fill(null));
const currentNetRxHistory = computed<readonly (number | null)[]>(() => currentSessionState.value?.statusMonitorManager?.netRxHistory?.value ?? Array(24).fill(null));
const currentNetTxHistory = computed<readonly (number | null)[]>(() => currentSessionState.value?.statusMonitorManager?.netTxHistory?.value ?? Array(24).fill(null));

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
  if (newData.cpuModel) {
    cachedCpuModel.value = newData.cpuModel;
  }
  if (typeof newData.cpuCores === 'number' && Number.isFinite(newData.cpuCores)) {
    cachedCpuCores.value = newData.cpuCores;
  }
  if (newData.osName) {
    cachedOsName.value = newData.osName;
  }
}, { immediate: true });

const displayCpuModel = computed(() => (currentServerStatus.value?.cpuModel ?? cachedCpuModel.value) || t('statusMonitor.notAvailable'));
const displayCpuCores = computed(() => {
  const cpuCores = currentServerStatus.value?.cpuCores ?? cachedCpuCores.value;
  if (typeof cpuCores !== 'number' || !Number.isFinite(cpuCores)) {
    return t('statusMonitor.notAvailable');
  }

  return t('statusMonitor.cpuCoresValue', { count: Math.round(cpuCores) });
});
const displayOsName = computed(() => (currentServerStatus.value?.osName ?? cachedOsName.value) || t('statusMonitor.notAvailable'));
const networkInterfaceDisplay = computed(() => currentServerStatus.value?.netInterface || t('statusMonitor.notAvailable'));

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
  if (mb < 1024) {
    return `${mb.toFixed(1)} ${t('statusMonitor.megaBytes')}`;
  }
  return `${(mb / 1024).toFixed(1)} ${t('statusMonitor.gigaBytes')}`;
};

const formatUptime = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return t('statusMonitor.notAvailable');
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}${t('statusMonitor.uptimeDaySuffix')} ${hours}${t('statusMonitor.uptimeHourSuffix')}`;
  }
  if (hours > 0) {
    return `${hours}${t('statusMonitor.uptimeHourSuffix')} ${minutes}${t('statusMonitor.uptimeMinuteSuffix')}`;
  }
  return `${minutes}${t('statusMonitor.uptimeMinuteSuffix')}`;
};

const formatProcessMemory = (mb?: number): string => {
  if (mb === undefined || mb === null || !Number.isFinite(mb)) {
    return t('statusMonitor.notAvailable');
  }
  if (mb < 1024) {
    return `${mb.toFixed(1)} M`;
  }
  return `${(mb / 1024).toFixed(1)} G`;
};

const memoryTotalValue = computed(() => currentServerStatus.value?.memTotal ?? 0);
const memoryUsedValue = computed(() => currentServerStatus.value?.memUsed ?? 0);
const memoryCachedValue = computed(() => currentServerStatus.value?.memCached ?? 0);
const memoryFreeValue = computed(() => {
  const data = currentServerStatus.value;
  if (data?.memFree !== undefined) {
    return data.memFree;
  }
  if (data?.memTotal !== undefined && data?.memUsed !== undefined) {
    return Math.max(data.memTotal - data.memUsed - (data.memCached ?? 0), 0);
  }
  return 0;
});

const memoryTotalDisplay = computed(() => formatMemorySize(currentServerStatus.value?.memTotal));
const memoryPercentDisplay = computed(() => `${Math.round(displayMemoryPercent.value)}%`);

const memoryRingStyle = computed<CSSProperties>(() => {
  const total = memoryTotalValue.value;
  if (total <= 0) {
    return { background: 'conic-gradient(#334155 0% 100%)' };
  }

  const usedPercent = Math.min(100, (memoryUsedValue.value / total) * 100);
  const cachedPercent = Math.min(100 - usedPercent, (memoryCachedValue.value / total) * 100);
  const usedEnd = usedPercent;
  const cacheEnd = usedPercent + cachedPercent;

  return {
    background: `conic-gradient(#ef5350 0 ${usedEnd}%, #8f96a3 ${usedEnd}% ${cacheEnd}%, #4ade80 ${cacheEnd}% 100%)`,
  };
});

const memoryStatItems = computed(() => [
  { key: 'used', label: t('statusMonitor.memoryUsedStat'), value: formatMemorySize(memoryUsedValue.value) },
  { key: 'cached', label: t('statusMonitor.memoryCachedStat'), value: formatMemorySize(memoryCachedValue.value) },
  { key: 'free', label: t('statusMonitor.memoryFreeStat'), value: formatMemorySize(memoryFreeValue.value) },
]);

const diskUsageDisplay = computed(() => {
  const data = currentServerStatus.value;
  if (!data || data.diskUsed === undefined || data.diskTotal === undefined) {
    return t('statusMonitor.notAvailable');
  }
  return `${formatStorageSizeFromKb(data.diskUsed, true)} / ${formatStorageSizeFromKb(data.diskTotal, true)}`;
});

const diskDeviceDisplay = computed(() => currentServerStatus.value?.diskDevice || t('statusMonitor.notAvailable'));
const diskFsTypeDisplay = computed(() => currentServerStatus.value?.diskFsType || t('statusMonitor.notAvailable'));
const diskReadRateDisplay = computed(() => formatCompactBytes(currentServerStatus.value?.diskReadRate));
const diskWriteRateDisplay = computed(() => formatCompactBytes(currentServerStatus.value?.diskWriteRate));
const diskMountPointDisplay = computed(() => currentServerStatus.value?.diskMountPoint || t('statusMonitor.notAvailable'));
const diskSizeDisplay = computed(() => formatStorageSizeFromKb(currentServerStatus.value?.diskTotal, true));
const diskAvailableDisplay = computed(() => formatStorageSizeFromKb(currentServerStatus.value?.diskAvailable, true));
const diskPercentDisplay = computed(() => `${Math.round(displayDiskPercent.value)}%`);

const sessionIpAddress = computed(() => {
  const sessionState = currentSessionState.value;
  if (!sessionState?.connectionId) {
    return null;
  }

  const connectionIdAsNumber = parseInt(sessionState.connectionId, 10);
  if (isNaN(connectionIdAsNumber)) {
    return null;
  }

  const connectionInfo = connectionsStore.connections.find(conn => conn.id === connectionIdAsNumber);
  return connectionInfo?.host || null;
});

const uptimeDisplay = computed(() => formatUptime(currentServerStatus.value?.uptimeSeconds));
const topProcessPreview = computed<readonly ProcessListItem[]>(() => currentServerStatus.value?.topProcesses ?? []);

const systemCardMetaItems = computed<MonitorOverviewItem[]>(() => [
  { key: 'timezone', label: t('statusMonitor.timezoneLabel'), value: timezoneDisplay.value },
  { key: 'uptime', label: t('statusMonitor.uptimeLabel'), value: uptimeDisplay.value },
]);

const cpuCoreItems = computed(() => {
  const rawPercents = currentServerStatus.value?.cpuCorePercents;
  const fallbackCoreCount = (() => {
    const currentCores = currentServerStatus.value?.cpuCores;
    if (typeof currentCores !== 'number' || !Number.isFinite(currentCores) || currentCores <= 0) {
      return 0;
    }
    return Math.round(currentCores);
  })();

  const normalizedPercents = Array.isArray(rawPercents) && rawPercents.length > 0
    ? rawPercents
    : Array.from({ length: fallbackCoreCount }, () => 0);

  return normalizedPercents.map((percent, index) => {
    const clampedPercent = clampPercent(percent);
    return {
      key: `cpu-core-${index + 1}`,
      label: t('statusMonitor.cpuCoreLabel', { index: index + 1 }),
      value: `${Math.round(clampedPercent)}%`,
      percent: clampedPercent,
    };
  });
});

const networkFlowItems = computed(() => [
  {
    key: 'download',
    label: t('statusMonitor.downloadLabel'),
    value: formatBytesPerSecond(currentServerStatus.value?.netRxRate),
    totalValue: formatBytes(currentServerStatus.value?.netRxTotalBytes),
    tone: 'down',
    icon: 'fa-arrow-down',
  },
  {
    key: 'upload',
    label: t('statusMonitor.uploadLabel'),
    value: formatBytesPerSecond(currentServerStatus.value?.netTxRate),
    totalValue: formatBytes(currentServerStatus.value?.netTxTotalBytes),
    tone: 'up',
    icon: 'fa-arrow-up',
  },
]);

const networkRateUnitLabel = computed(() => {
  const maxRate = Math.max(currentServerStatus.value?.netRxRate ?? 0, currentServerStatus.value?.netTxRate ?? 0);
  return maxRate >= 1024 * 1024 ? 'MB/s' : 'KB/s';
});

const diskDeviceAccent = computed(() => {
  const raw = currentServerStatus.value?.diskDevice;

  if (!raw) {
    return 'N/A';
  }

  const normalized = raw.replace(/^\/dev\//, '').split('/').pop() || raw;
  return normalized.toUpperCase();
});

const processSummaryItems = computed(() => [
  { key: 'total', label: t('statusMonitor.processManager.total'), value: String(processTotalDisplay.value) },
  { key: 'running', label: t('statusMonitor.processManager.running'), value: String(processRunningDisplay.value) },
  { key: 'sleeping', label: t('statusMonitor.processManager.sleeping'), value: String(processSleepingDisplay.value) },
]);

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
  padding: 14px;
  background:
    radial-gradient(circle at top right, rgba(52, 211, 153, 0.08), transparent 28%),
    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(16, 21, 27, 0.98), rgba(13, 17, 23, 0.98));
  color: #ecf3f7;
}

.status-monitor--inactive {
  background:
    radial-gradient(circle at top right, rgba(148, 163, 184, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.96));
}

.status-monitor-shell {
  display: grid;
  gap: 12px;
  container-type: inline-size;
}

.status-state {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--text-secondary-color, #9ca3af);
}

.status-state--error {
  color: #f87171;
}

.status-state__icon {
  font-size: 28px;
}

.status-state__title {
  font-size: 14px;
  font-weight: 600;
}

.monitor-header,
.monitor-module,
.status-monitor__charts {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(180deg, rgba(19, 26, 33, 0.96), rgba(11, 16, 22, 0.96)),
    linear-gradient(90deg, rgba(52, 211, 153, 0.04), transparent 35%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 30px rgba(0, 0, 0, 0.24);
}

.monitor-header {
  display: grid;
  gap: 12px;
  border-radius: 20px;
  padding: 14px;
}

.monitor-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.monitor-header__identity {
  min-width: 0;
}

.monitor-header__eyebrow,
.monitor-module__eyebrow {
  display: inline-block;
  color: #7dd3a5;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.monitor-header__title {
  margin: 10px 0 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.15;
}

.monitor-header__chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.monitor-header__subtitle {
  margin: 0;
  color: #8fa0b3;
  font-size: 12px;
  line-height: 1.4;
}

.monitor-header__badge,
.monitor-module__pill,
.monitor-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
}

.monitor-header__badge,
.monitor-module__pill {
  border: 1px solid rgba(74, 222, 128, 0.18);
  background: rgba(26, 92, 62, 0.34);
  color: #d7ffe6;
}

.monitor-header__badge--subtle {
  border-color: rgba(96, 165, 250, 0.16);
  background: rgba(30, 64, 175, 0.14);
  color: #dbeafe;
}

.monitor-chip {
  border: 1px solid rgba(96, 165, 250, 0.18);
  background: rgba(30, 64, 175, 0.2);
  color: #dbeafe;
}

.monitor-chip--interactive,
.monitor-action-button {
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}

.monitor-chip--interactive:hover,
.monitor-action-button:hover {
  transform: translateY(-1px);
}

.monitor-chip--interactive:hover {
  border-color: rgba(96, 165, 250, 0.38);
  color: #ffffff;
}

.monitor-chip__label {
  color: #bfdbfe;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.monitor-chip__value {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monitor-header__status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.monitor-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(74, 222, 128, 0.18);
  background: rgba(15, 118, 110, 0.16);
  padding: 0 10px;
  color: #dcfce7;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.monitor-live-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #4ade80;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.7);
}

.monitor-header__meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.monitor-header__meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.monitor-header__meta-label,
.usage-lane__helper,
.memory-stat__label,
.network-table__header,
.network-table__columns,
.disk-io-card__label,
.disk-summary-table__head,
.process-summary-item__label {
  color: #8ea0b1;
  font-size: 11px;
}

.monitor-header__meta-label {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.monitor-header__meta-value {
  overflow: hidden;
  color: #f7fbff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.monitor-module-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}

.monitor-module {
  display: grid;
  gap: 10px;
  min-width: 0;
  border-radius: 18px;
  padding: 12px;
  container-type: inline-size;
}

.monitor-module--usage,
.monitor-module--memory,
.monitor-module--network,
.monitor-module--disk {
  min-height: clamp(188px, 62cqw, 220px);
}

.monitor-module--usage {
  grid-template-rows: auto minmax(0, 1fr);
  max-height: 320px;
  gap: 8px;
  overflow: hidden;
}

.monitor-module--process {
  min-height: clamp(340px, 116cqw, 420px);
}

.monitor-module__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.monitor-module__heading-actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
}

.process-summary-pills {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.monitor-module__title {
  margin: 6px 0 0;
  color: #f8fbff;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.3;
}

.memory-stat-stack,
.network-stat-stack,
.disk-stat-stack,
.process-preview-list {
  display: grid;
  gap: 8px;
}

.usage-lane {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 10px 8px;
}

.usage-lane__index,
.usage-lane__value,
.memory-stat__value,
.process-summary-item__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.usage-lane__index {
  color: rgba(226, 232, 240, 0.52);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.usage-lane__content {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.usage-lane__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.usage-lane__label,
.network-stat__label,
.process-preview-item__rail {
  color: #d9e5f1;
  font-size: 12px;
  font-weight: 700;
}

.usage-lane__helper {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-lane__value-inline {
  color: #f8fbff;
  font-size: 17px;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.usage-lane__track,
.disk-device-card__icon {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: rgba(51, 65, 85, 0.6);
}

.usage-lane__track {
  height: 8px;
  border-radius: 999px;
}

.usage-lane__fill,
.disk-device-card__icon-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
}

.usage-lane--cpu .usage-lane__fill {
  background: linear-gradient(90deg, #7dd3fc, #2563eb);
}

.usage-lane--cpu {
  gap: 6px;
  border-radius: 10px;
  padding: 6px 8px;
}

.usage-lane--cpu .usage-lane__content {
  gap: 6px;
}

.usage-lane--cpu .usage-lane__label {
  font-size: 11px;
}

.usage-lane--cpu .usage-lane__value-inline {
  font-size: 14px;
}

.usage-lane--cpu .usage-lane__track {
  height: 6px;
}

.cpu-core-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
  align-content: start;
  gap: 6px;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  padding-right: 2px;
}

.cpu-core-panel {
  min-height: 0;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.02)),
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.04), transparent 60%);
  padding: 8px 10px;
  overflow: hidden;
}

.module-split {
  display: grid;
  gap: 12px;
}

.module-split--memory {
  grid-template-columns: minmax(110px, 0.88fr) minmax(0, 1.12fr);
  align-items: stretch;
}

.module-split--cpu {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 126px) minmax(0, 112px);
  min-height: 0;
  align-content: start;
  gap: 8px;
  overflow: hidden;
}

.module-split--network {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 146px) minmax(0, 1fr);
  min-height: 0;
  align-content: start;
  gap: 8px;
  overflow: hidden;
}

.monitor-module--network {
  grid-template-rows: auto minmax(0, 1fr);
  max-height: 350px;
  gap: 8px;
  overflow: hidden;
}

.memory-ring-panel,
.disk-device-card,
.disk-io-card,
.network-table {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.02)),
    radial-gradient(circle at top left, rgba(52, 211, 153, 0.04), transparent 58%);
  padding: 12px;
}

.memory-ring-panel {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 6px;
  padding: 10px;
}

.memory-ring {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 999px;
  padding: 3px;
}

.memory-ring::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 999px;
  background: rgba(9, 14, 20, 0.96);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.memory-ring__center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fbff;
  font-size: 13px;
  font-weight: 800;
}

.memory-ring-panel__caption {
  color: #9cb0c2;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.memory-stat,
.network-stat,
.process-summary-item,
.process-preview-item {
  min-width: 0;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.memory-stat {
  padding: 8px 9px;
  border-radius: 10px;
}

.memory-stat-stack {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: center;
  gap: 6px;
}

.memory-stat__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.memory-stat__dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.memory-stat__dot--used {
  background: #ef5350;
}

.memory-stat__dot--cached {
  background: #9ca3af;
}

.memory-stat__dot--free {
  background: #4ade80;
}

.memory-stat__value,
.disk-summary-table__row span,
.disk-io-card__value {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: #f8fbff;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.15;
}

.network-table {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 4px;
  min-height: 0;
  height: 100%;
  padding: 8px 10px;
  overflow: hidden;
}

.disk-summary-table__head,
.disk-summary-table__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.network-table__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.network-table__columns {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) repeat(2, minmax(0, 0.61fr));
  align-items: center;
  gap: 6px;
  padding-top: 0;
  color: #9cb0c2;
  font-size: 10px;
  font-weight: 700;
}

.network-stat-stack {
  min-height: 0;
  align-content: start;
  gap: 4px;
}

.network-table__columns span,
.network-stat span,
.disk-summary-table__head span,
.disk-summary-table__row span {
  min-width: 0;
}

.network-table__header span:first-child,
.network-table__columns span:first-child,
.network-stat__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.network-table__header span:last-child,
.network-table__columns span:not(:first-child),
.network-stat__value,
.network-stat__total {
  justify-self: end;
  text-align: right;
}

.network-stat {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) repeat(2, minmax(0, 0.61fr));
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.06);
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 8px;
}

.network-stat__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #d9e5f1;
  font-size: 11px;
}

.network-stat__label i {
  width: 12px;
  text-align: center;
}

.network-stat__value,
.network-stat__total {
  color: #f8fbff;
  font-size: 12px;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.network-stat--up .network-stat__label i {
  color: #34d399;
}

.network-stat--down .network-stat__label i {
  color: #3b82f6;
}

.disk-compact-top {
  display: grid;
  grid-template-columns: minmax(108px, 0.92fr) repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.disk-device-card {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.disk-device-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.disk-device-card__mount {
  color: #d9e5f1;
  font-size: 14px;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.disk-device-card__type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  border-radius: 8px;
  padding: 0 8px;
  background: rgba(111, 76, 15, 0.32);
  color: #facc15;
  font-size: 11px;
  font-weight: 800;
}

.disk-device-card__body {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.disk-device-card__icon {
  flex: 0 0 24px;
  width: 24px;
  height: 54px;
  border: 1px solid rgba(203, 213, 225, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.88));
}

.disk-device-card__icon-fill {
  inset: auto 0 0;
  background: linear-gradient(180deg, rgba(134, 239, 172, 0.95), rgba(34, 197, 94, 1));
}

.disk-device-card__device {
  color: #9db0c1;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  overflow-wrap: anywhere;
}

.disk-io-card {
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 10px;
}

.disk-io-card__value {
  margin-top: 0;
  font-size: 15px;
}

.disk-summary-table {
  display: grid;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(255, 255, 255, 0.025);
  padding: 10px;
}

.disk-summary-table__head {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-weight: 700;
}

.disk-summary-table__row {
  color: #f8fbff;
  font-size: 14px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.disk-summary-table__mount {
  color: #86efac;
}

.disk-summary-table__used {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid rgba(74, 222, 128, 0.2);
  background: rgba(26, 92, 62, 0.34);
  color: #d7ffe6;
}

.monitor-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  background: rgba(37, 99, 235, 0.18);
  padding: 0 12px;
  color: #dbeafe;
  font-size: 12px;
  font-weight: 700;
}

.monitor-action-button:hover {
  border-color: rgba(96, 165, 250, 0.42);
  color: #ffffff;
}

.process-preview-item {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
}

.process-preview-item__rail {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #9fb0bf;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.process-preview-item__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.process-preview-item__command {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f8fbff;
  font-size: 13px;
}

.process-preview-item__stats {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
}

.process-preview-item__cpu {
  color: #bfdbfe;
}

.process-preview-item__mem {
  color: #fde68a;
}

.process-preview-empty {
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.16);
  padding: 14px;
  color: #8fa0b3;
  font-size: 13px;
  text-align: center;
}

.status-monitor__charts {
  overflow: hidden;
  border-radius: 20px;
}

@container (min-width: 520px) {
  .monitor-header {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .monitor-header__status {
    justify-content: flex-end;
  }

  .module-split--memory {
    grid-template-columns: minmax(150px, 0.92fr) minmax(0, 1.08fr);
    align-items: stretch;
  }

  .disk-summary-table__head span,
  .disk-summary-table__row span {
    text-align: left;
  }
}

@container (max-width: 250px) {
  .module-split--memory,
  .module-split--cpu,
  .module-split--network,
  .disk-compact-top {
    grid-template-columns: 1fr;
  }

  .memory-stat-stack {
    grid-template-columns: 1fr;
  }

  .cpu-core-grid {
    grid-template-columns: 1fr;
  }

  .network-table__header,
  .network-table__columns,
  .network-stat,
  .disk-summary-table__head,
  .disk-summary-table__row,
  .process-preview-item__main {
    flex-direction: column;
    align-items: flex-start;
  }

  .network-table__columns span,
  .network-stat span,
  .disk-summary-table__head span,
  .disk-summary-table__row span {
    width: 100%;
    flex: none;
  }

  .monitor-module--network .network-table__header,
  .monitor-module--network .network-table__columns,
  .monitor-module--network .network-stat {
    align-items: center;
  }

  .monitor-module--network .network-table__columns span,
  .monitor-module--network .network-stat span {
    width: auto;
  }
}

@container (max-width: 440px) {
  .monitor-chip {
    max-width: 100%;
  }

  .monitor-chip__value,
  .usage-lane__helper,
  .disk-summary-table__row span {
    white-space: normal;
  }

}

@container (max-width: 360px) {
  .process-summary-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .status-monitor {
    padding: 12px;
  }
}
</style>
