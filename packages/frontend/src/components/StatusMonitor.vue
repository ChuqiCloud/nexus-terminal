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
        <div class="monitor-header__title-group">
          <span class="monitor-header__eyebrow">{{ t('statusMonitor.title') }}</span>
          <div class="monitor-header__title-line">
            <h4 class="monitor-header__title">{{ displayOsName }}</h4>
            <span class="monitor-header__badge">{{ networkInterfaceDisplay }}</span>
          </div>
        </div>

        <div class="monitor-header__actions">
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
      </header>

      <div class="monitor-meta-grid">
        <template v-for="item in monitorMetaItems" :key="item.key">
          <button
            v-if="item.clickable"
            type="button"
            class="monitor-meta-card monitor-meta-card--interactive"
            :title="item.value"
            @click="copyIpToClipboard(sessionIpAddress)"
          >
            <span class="monitor-meta-card__label">{{ item.label }}</span>
            <span class="monitor-meta-card__value">{{ item.value }}</span>
          </button>

          <article v-else class="monitor-meta-card" :title="item.value">
            <span class="monitor-meta-card__label">{{ item.label }}</span>
            <span class="monitor-meta-card__value">{{ item.value }}</span>
          </article>
        </template>
      </div>

      <div class="monitor-rail">
        <article
          v-for="item in resourceRailItems"
          :key="item.key"
          :class="['metric-strip', `metric-strip--${item.tone}`]"
        >
          <div class="metric-strip__top">
            <span class="metric-strip__label">{{ item.label }}</span>
            <span class="metric-strip__value">{{ item.value }}</span>
          </div>

          <div class="metric-strip__track">
            <span class="metric-strip__fill" :style="{ width: `${item.percent}%` }"></span>
          </div>

          <span class="metric-strip__helper">{{ item.helper }}</span>
        </article>
      </div>

      <div class="monitor-panels">
        <section class="monitor-card monitor-card--memory">
          <div class="monitor-card__header">
            <div class="monitor-card__title-group">
              <span class="monitor-card__icon monitor-card__icon--memory">
                <i class="fas fa-memory"></i>
              </span>
              <div>
                <h5 class="monitor-card__title">{{ t('statusMonitor.memoryCardTitle') }}</h5>
                <p class="monitor-card__subtitle">{{ t('statusMonitor.memoryUsedStat') }} / {{ t('statusMonitor.memoryFreeStat') }}</p>
              </div>
            </div>
            <span class="monitor-card__badge">{{ memoryTotalDisplay }}</span>
          </div>

          <div class="memory-card__content">
            <div class="memory-ring" :style="memoryRingStyle">
              <div class="memory-ring__center">{{ memoryPercentDisplay }}</div>
            </div>

            <div class="memory-stats-grid">
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

        <section class="monitor-card monitor-card--network">
          <div class="monitor-card__header">
            <div class="monitor-card__title-group">
              <span class="monitor-card__icon monitor-card__icon--network">
                <i class="fas fa-network-wired"></i>
              </span>
              <div>
                <h5 class="monitor-card__title">{{ t('statusMonitor.networkLabel') }}</h5>
                <p class="monitor-card__subtitle">{{ networkInterfaceDisplay }}</p>
              </div>
            </div>
            <span class="monitor-card__badge">{{ totalTrafficDisplay }}</span>
          </div>

          <div class="network-stream-list">
            <article
              v-for="item in networkFlowItems"
              :key="item.key"
              :class="['network-stream', `network-stream--${item.tone}`]"
            >
              <div class="network-stream__top">
                <span class="network-stream__label">
                  <i :class="['fas', item.icon]"></i>
                  <span>{{ item.label }}</span>
                </span>
                <span class="network-stream__value">{{ item.value }}</span>
              </div>

              <div class="network-stream__track">
                <span class="network-stream__fill" :style="{ width: `${item.percent}%` }"></span>
              </div>

              <div class="network-stream__footer">
                <span>{{ item.totalLabel }}</span>
                <span>{{ item.totalValue }}</span>
              </div>
            </article>
          </div>
        </section>

        <section class="monitor-card monitor-card--disk">
          <div class="monitor-card__header">
            <div class="monitor-card__title-group">
              <span class="monitor-card__icon monitor-card__icon--disk">
                <i class="fas fa-hdd"></i>
              </span>
              <div>
                <h5 class="monitor-card__title">{{ t('statusMonitor.diskCardTitle') }}</h5>
                <p class="monitor-card__subtitle">{{ diskDeviceDisplay }}</p>
              </div>
            </div>
            <span class="monitor-card__badge">{{ diskUsageDisplay }}</span>
          </div>

          <div class="disk-meta-row">
            <span class="disk-meta-pill">{{ diskFsTypeDisplay }}</span>
            <span class="disk-meta-pill">{{ diskMountPointDisplay }}</span>
          </div>

          <div class="disk-card__body">
            <div class="disk-usage-tube">
              <div class="disk-usage-tube__inner">
                <div class="disk-usage-tube__fill" :style="diskUsageFillStyle"></div>
              </div>
              <span class="disk-usage-tube__value">{{ diskPercentDisplay }}</span>
            </div>

            <div class="disk-rate-grid">
              <div class="disk-rate-card">
                <span class="disk-rate-card__label">{{ t('statusMonitor.diskReadRateLabel') }}</span>
                <span class="disk-rate-card__value">{{ diskReadRateDisplay }}</span>
              </div>
              <div class="disk-rate-card">
                <span class="disk-rate-card__label">{{ t('statusMonitor.diskWriteRateLabel') }}</span>
                <span class="disk-rate-card__value">{{ diskWriteRateDisplay }}</span>
              </div>
            </div>
          </div>

          <div class="disk-info-grid">
            <div v-for="item in diskInfoItems" :key="item.key" class="disk-info-item">
              <span class="disk-info-item__label">{{ item.label }}</span>
              <span class="disk-info-item__value">{{ item.value }}</span>
            </div>
          </div>
        </section>
      </div>

      <StatusCharts
        v-if="activeSessionId && currentServerStatus"
        :server-status="currentServerStatus"
        :active-session-id="activeSessionId"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import StatusCharts from './StatusCharts.vue';
import { useSessionStore } from '../stores/session.store';
import { useSettingsStore } from '../stores/settings.store';
import { useConnectionsStore } from '../stores/connections.store';
import { useUiNotificationsStore } from '../stores/uiNotifications.store';
import type { ServerStatus } from '../types/server.types';

interface MonitorMetaItem {
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

const displayCpuPercent = computed(() => clampPercent(currentServerStatus.value?.cpuPercent));
const displaySwapPercent = computed(() => clampPercent(currentServerStatus.value?.swapPercent));
const displayMemoryPercent = computed(() => clampPercent(currentServerStatus.value?.memPercent));
const displayDiskPercent = computed(() => clampPercent(currentServerStatus.value?.diskPercent));
const currentStatusError = computed<string | null>(() => currentSessionState.value?.statusMonitorManager?.statusError?.value ?? null);

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

const swapDisplay = computed(() => {
  const total = currentServerStatus.value?.swapTotal ?? 0;
  const used = currentServerStatus.value?.swapUsed ?? 0;
  if (total === 0) {
    return t('statusMonitor.swapNotAvailable');
  }
  return `${formatMemorySize(used)} / ${formatMemorySize(total)}`;
});

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

const diskUsageFillStyle = computed<CSSProperties>(() => ({
  height: `${Math.max(8, displayDiskPercent.value)}%`,
}));

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

const totalTrafficDisplay = computed(() => {
  const totalDown = formatBytes(currentServerStatus.value?.netRxTotalBytes);
  const totalUp = formatBytes(currentServerStatus.value?.netTxTotalBytes);
  if (totalDown === t('statusMonitor.notAvailable') && totalUp === t('statusMonitor.notAvailable')) {
    return t('statusMonitor.notAvailable');
  }
  return `${totalDown} / ${totalUp}`;
});

const maxCurrentNetworkRate = computed(() => {
  const rxRate = currentServerStatus.value?.netRxRate ?? 0;
  const txRate = currentServerStatus.value?.netTxRate ?? 0;
  return Math.max(rxRate, txRate, 1);
});

const toRatePercent = (rate?: number): number => {
  if (!rate || rate <= 0) {
    return 8;
  }
  return Math.max(8, Math.min(100, (rate / maxCurrentNetworkRate.value) * 100));
};

const monitorMetaItems = computed<MonitorMetaItem[]>(() => {
  const items: MonitorMetaItem[] = [
    { key: 'cpu-model', label: t('statusMonitor.cpuModelLabel'), value: displayCpuModel.value },
    { key: 'cpu-cores', label: t('statusMonitor.cpuLabel'), value: displayCpuCores.value },
    { key: 'memory-total', label: t('statusMonitor.memoryCardTitle'), value: memoryTotalDisplay.value },
    { key: 'disk-mount', label: t('statusMonitor.diskMountLabel'), value: diskMountPointDisplay.value },
  ];

  if (statusMonitorShowIpBoolean.value && sessionIpAddress.value) {
    items.unshift({ key: 'session-ip', label: 'IP', value: sessionIpAddress.value, clickable: true });
  }

  return items;
});

const resourceRailItems = computed(() => [
  {
    key: 'cpu',
    label: t('statusMonitor.cpuLabel'),
    value: `${Math.round(displayCpuPercent.value)}%`,
    helper: displayCpuCores.value,
    percent: displayCpuPercent.value,
    tone: 'cpu',
  },
  {
    key: 'memory',
    label: t('statusMonitor.memoryCardTitle'),
    value: memoryPercentDisplay.value,
    helper: `${formatMemorySize(memoryUsedValue.value)} / ${memoryTotalDisplay.value}`,
    percent: displayMemoryPercent.value,
    tone: 'memory',
  },
  {
    key: 'swap',
    label: t('statusMonitor.swapLabel'),
    value: `${Math.round(displaySwapPercent.value)}%`,
    helper: swapDisplay.value,
    percent: displaySwapPercent.value,
    tone: 'swap',
  },
  {
    key: 'disk',
    label: t('statusMonitor.diskCardTitle'),
    value: diskPercentDisplay.value,
    helper: `${t('statusMonitor.diskAvailableLabel')} ${diskAvailableDisplay.value}`,
    percent: displayDiskPercent.value,
    tone: 'disk',
  },
]);

const networkFlowItems = computed(() => [
  {
    key: 'download',
    label: t('statusMonitor.downloadLabel'),
    value: formatBytesPerSecond(currentServerStatus.value?.netRxRate),
    totalLabel: t('statusMonitor.totalTrafficLabel'),
    totalValue: formatBytes(currentServerStatus.value?.netRxTotalBytes),
    percent: toRatePercent(currentServerStatus.value?.netRxRate),
    tone: 'down',
    icon: 'fa-arrow-down',
  },
  {
    key: 'upload',
    label: t('statusMonitor.uploadLabel'),
    value: formatBytesPerSecond(currentServerStatus.value?.netTxRate),
    totalLabel: t('statusMonitor.totalTrafficLabel'),
    totalValue: formatBytes(currentServerStatus.value?.netTxTotalBytes),
    percent: toRatePercent(currentServerStatus.value?.netTxRate),
    tone: 'up',
    icon: 'fa-arrow-up',
  },
]);

const diskInfoItems = computed(() => [
  { key: 'size', label: t('statusMonitor.diskSizeLabel'), value: diskSizeDisplay.value },
  { key: 'available', label: t('statusMonitor.diskAvailableLabel'), value: diskAvailableDisplay.value },
  { key: 'mount', label: t('statusMonitor.diskMountLabel'), value: diskMountPointDisplay.value },
  { key: 'used', label: t('statusMonitor.diskUsedPercentLabel'), value: diskPercentDisplay.value },
]);

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
.monitor-card,
.monitor-meta-card,
.metric-strip {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: linear-gradient(180deg, rgba(18, 24, 31, 0.92), rgba(14, 18, 24, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 24px rgba(0, 0, 0, 0.18);
}

.monitor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-radius: 18px;
  padding: 14px;
}

.monitor-header__title-group {
  min-width: 0;
}

.monitor-header__eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: #7dd3a5;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.monitor-header__title-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.monitor-header__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.monitor-header__badge,
.monitor-card__badge,
.disk-meta-pill,
.monitor-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  color: #e2fbe9;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.1;
}

.monitor-header__badge,
.monitor-card__badge {
  border: 1px solid rgba(74, 222, 128, 0.2);
  background: rgba(24, 79, 51, 0.38);
}

.monitor-chip {
  border: 1px solid rgba(96, 165, 250, 0.18);
  background: rgba(30, 64, 175, 0.2);
}

.monitor-chip--interactive {
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, color 0.2s ease;
}

.monitor-chip--interactive:hover {
  border-color: rgba(96, 165, 250, 0.38);
  color: #ffffff;
  transform: translateY(-1px);
}

.monitor-chip__label {
  color: #bfdbfe;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.monitor-chip__value {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monitor-header__actions {
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

.monitor-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.monitor-meta-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  border-radius: 14px;
  padding: 12px;
  text-align: left;
}

.monitor-meta-card--interactive {
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.monitor-meta-card--interactive:hover {
  border-color: rgba(96, 165, 250, 0.32);
  transform: translateY(-1px);
}

.monitor-meta-card__label {
  color: #8fa0b3;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.monitor-meta-card__value {
  overflow: hidden;
  color: #f7fbff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.monitor-rail {
  display: grid;
  gap: 8px;
}

.metric-strip {
  display: grid;
  gap: 8px;
  border-radius: 14px;
  padding: 12px;
}

.metric-strip__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-strip__label,
.metric-strip__helper {
  color: #91a0b1;
  font-size: 12px;
}

.metric-strip__label {
  font-weight: 600;
}

.metric-strip__value {
  color: #f8fbff;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

.metric-strip__track,
.network-stream__track {
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.65);
}

.metric-strip__fill,
.network-stream__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
}

.metric-strip__helper {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-strip--cpu .metric-strip__fill {
  background: linear-gradient(90deg, #38bdf8, #2563eb);
}

.metric-strip--memory .metric-strip__fill {
  background: linear-gradient(90deg, #fb7185, #ef4444);
}

.metric-strip--swap .metric-strip__fill {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.metric-strip--disk .metric-strip__fill {
  background: linear-gradient(90deg, #86efac, #22c55e);
}

.monitor-panels {
  display: grid;
  gap: 12px;
}

.monitor-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  border-radius: 18px;
  padding: 14px;
  container-type: inline-size;
}

.monitor-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.monitor-card__title-group {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.monitor-card__icon {
  display: inline-flex;
  height: 30px;
  width: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
}

.monitor-card__icon--memory {
  color: #f87171;
}

.monitor-card__icon--network {
  color: #60a5fa;
}

.monitor-card__icon--disk {
  color: #fbbf24;
}

.monitor-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.monitor-card__subtitle {
  margin: 4px 0 0;
  color: #8fa0b3;
  font-size: 12px;
}

.memory-card__content {
  display: grid;
  gap: 12px;
}

.memory-ring {
  position: relative;
  justify-self: center;
  width: 84px;
  height: 84px;
  border-radius: 999px;
  padding: 3px;
}

.memory-ring::after {
  content: '';
  position: absolute;
  inset: 14px;
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
  font-size: 14px;
  font-weight: 800;
}

.memory-stats-grid,
.disk-rate-grid,
.disk-info-grid {
  display: grid;
  gap: 8px;
}

.memory-stat,
.disk-rate-card,
.disk-info-item,
.network-stream {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  min-width: 0;
}

.memory-stat__label,
.disk-rate-card__label,
.disk-info-item__label,
.network-stream__footer,
.network-stream__label {
  color: #8fa0b3;
  font-size: 12px;
}

.memory-stat__label,
.network-stream__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.memory-stat__value,
.disk-rate-card__value,
.disk-info-item__value,
.network-stream__value {
  display: block;
  margin-top: 6px;
  overflow-wrap: anywhere;
  color: #f8fbff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.15;
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

.network-stream-list {
  display: grid;
  gap: 8px;
}

.network-stream__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.network-stream__label i {
  width: 12px;
  text-align: center;
}

.network-stream--down .network-stream__fill {
  background: linear-gradient(90deg, #34d399, #10b981);
}

.network-stream--up .network-stream__fill {
  background: linear-gradient(90deg, #60a5fa, #2563eb);
}

.network-stream__footer {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.disk-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.disk-meta-pill {
  border: 1px solid rgba(251, 191, 36, 0.14);
  background: rgba(120, 53, 15, 0.25);
  color: #fde68a;
}

.disk-card__body {
  display: grid;
  gap: 12px;
}

.disk-usage-tube {
  display: grid;
  justify-items: center;
  gap: 8px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
}

.disk-usage-tube__inner {
  position: relative;
  width: 26px;
  height: 90px;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(203, 213, 225, 0.9));
}

.disk-usage-tube__fill {
  position: absolute;
  inset: auto 0 0;
  background: linear-gradient(180deg, rgba(134, 239, 172, 0.9), rgba(34, 197, 94, 1));
}

.disk-usage-tube__value {
  color: #f8fbff;
  font-size: 14px;
  font-weight: 800;
}

.disk-info-item__label {
  display: block;
}

.disk-info-item__value {
  margin-top: 4px;
}

@container (min-width: 560px) {
  .monitor-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .memory-card__content,
  .disk-card__body {
    grid-template-columns: minmax(90px, 112px) minmax(0, 1fr);
    align-items: center;
  }

  .memory-stats-grid,
  .disk-rate-grid,
  .disk-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (min-width: 760px) {
  .monitor-panels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .monitor-card--memory {
    grid-column: 1 / -1;
  }

  .memory-stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@container (min-width: 1040px) {
  .monitor-panels {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .monitor-card--memory {
    grid-column: auto;
  }

  .disk-info-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@container (max-width: 420px) {
  .monitor-header {
    flex-direction: column;
  }

  .monitor-header__actions {
    width: 100%;
    justify-content: space-between;
  }

  .monitor-chip {
    max-width: 100%;
  }

  .monitor-chip__value,
  .monitor-meta-card__value,
  .metric-strip__helper,
  .disk-info-item__value {
    white-space: normal;
  }

  .metric-strip__top,
  .monitor-card__header,
  .network-stream__top,
  .network-stream__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .memory-stats-grid,
  .disk-rate-grid,
  .disk-info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .status-monitor {
    padding: 12px;
  }
}
</style>
