<template>
  <div ref="chartHostRef" class="network-history-chart">
    <div class="network-history-chart__header">
      <div>
        <p class="network-history-chart__subtitle">{{ t('statusMonitor.networkHistoryRecentPoints', { count: displayPointCount }) }}</p>
        <h6 class="network-history-chart__title">
          {{ t('statusMonitor.networkSpeedTitleUnit', { unit: networkRateUnitIsMB ? 'MB/s' : 'KB/s' }) }}
        </h6>
      </div>

      <div class="network-history-chart__legend">
        <span class="network-history-chart__legend-item">
          <span class="network-history-chart__legend-dot network-history-chart__legend-dot--download"></span>
          {{ t('statusMonitor.downloadLabel') }}
        </span>
        <span class="network-history-chart__legend-item">
          <span class="network-history-chart__legend-dot network-history-chart__legend-dot--upload"></span>
          {{ t('statusMonitor.uploadLabel') }}
        </span>
      </div>
    </div>

    <div class="network-history-chart__canvas">
      <Line :data="networkChartData" :options="networkChartOptions" :key="chartKey" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import {
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type TooltipItem,
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
);

const DISPLAY_POINTS = 24;
const KB_TO_MB_THRESHOLD = 1024;

const props = defineProps({
  downloadHistory: {
    type: Array as PropType<readonly (number | null)[]>,
    required: true,
  },
  uploadHistory: {
    type: Array as PropType<readonly (number | null)[]>,
    required: true,
  },
});

const { t } = useI18n();

const chartHostRef = ref<HTMLElement | null>(null);
const chartKey = ref(0);
let chartResizeObserver: ResizeObserver | null = null;
let lastChartHostWidth = 0;

const recentDownloadHistory = computed(() => props.downloadHistory.slice(-DISPLAY_POINTS));
const recentUploadHistory = computed(() => props.uploadHistory.slice(-DISPLAY_POINTS));
const displayPointCount = computed(() => Math.max(recentDownloadHistory.value.length, recentUploadHistory.value.length, DISPLAY_POINTS));

const peakHistoryRateKB = computed(() => {
  const values = [
    ...recentDownloadHistory.value.map(value => (value ?? 0) / 1024),
    ...recentUploadHistory.value.map(value => (value ?? 0) / 1024),
  ];
  return Math.max(...values, 0);
});

const networkRateUnitIsMB = computed(() => peakHistoryRateKB.value >= KB_TO_MB_THRESHOLD);

const chartDivisor = computed(() => (networkRateUnitIsMB.value ? 1024 * 1024 : 1024));

const chartPrecision = computed(() => (networkRateUnitIsMB.value ? 2 : 1));

const chartLabels = computed(() =>
  Array.from({ length: displayPointCount.value }, (_, index) => `${index + 1}`),
);

const networkChartData = computed(() => ({
  labels: chartLabels.value,
  datasets: [
    {
      label: t('statusMonitor.networkDownloadLabelUnit', { unit: networkRateUnitIsMB.value ? 'MB/s' : 'KB/s' }),
      data: recentDownloadHistory.value.map(value =>
        value === null || value === undefined ? null : Number((value / chartDivisor.value).toFixed(chartPrecision.value)),
      ),
      borderColor: 'rgba(96, 165, 250, 1)',
      backgroundColor: 'rgba(96, 165, 250, 0.18)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.24,
      spanGaps: true,
    },
    {
      label: t('statusMonitor.networkUploadLabelUnit', { unit: networkRateUnitIsMB.value ? 'MB/s' : 'KB/s' }),
      data: recentUploadHistory.value.map(value =>
        value === null || value === undefined ? null : Number((value / chartDivisor.value).toFixed(chartPrecision.value)),
      ),
      borderColor: 'rgba(52, 211, 153, 1)',
      backgroundColor: 'rgba(52, 211, 153, 0.16)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.24,
      spanGaps: true,
    },
  ],
}));

const suggestedYAxisMax = computed(() => {
  const allValues = [
    ...recentDownloadHistory.value,
    ...recentUploadHistory.value,
  ].filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value))
    .map(value => value / chartDivisor.value);

  const currentMax = Math.max(...allValues, 0);
  if (currentMax === 0) {
    return networkRateUnitIsMB.value ? 1 : 100;
  }

  if (networkRateUnitIsMB.value) {
    return Math.max(1, Math.ceil(currentMax * 1.2));
  }

  if (currentMax <= 100) {
    return Math.max(10, Math.ceil((currentMax * 1.2) / 10) * 10);
  }

  if (currentMax <= 500) {
    return Math.ceil((currentMax * 1.2) / 50) * 50;
  }

  return Math.ceil((currentMax * 1.2) / 100) * 100;
});

const networkChartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      displayColors: true,
      callbacks: {
        title: () => '',
        label: (context: TooltipItem<'line'>) => {
          const label = context.dataset.label ?? '';
          const value = context.parsed.y;
          if (value === null) {
            return label;
          }

          return `${label}: ${Number(value).toFixed(chartPrecision.value)} ${networkRateUnitIsMB.value ? 'MB/s' : 'KB/s'}`;
        },
      },
    },
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      min: 0,
      max: suggestedYAxisMax.value,
      ticks: {
        color: '#8fa0b3',
        callback: value => {
          const numericValue = Number(value);
          return Number.isFinite(numericValue) ? numericValue.toFixed(networkRateUnitIsMB.value ? 2 : 0) : '';
        },
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.12)',
      },
    },
  },
}));

const rerenderChart = (): void => {
  chartKey.value += 1;
};

watch(
  () => [recentDownloadHistory.value, recentUploadHistory.value, suggestedYAxisMax.value],
  () => {
    rerenderChart();
  },
  { deep: true },
);

onMounted(() => {
  const host = chartHostRef.value;
  if (!host || typeof ResizeObserver === 'undefined') {
    return;
  }

  lastChartHostWidth = Math.round(host.getBoundingClientRect().width);
  chartResizeObserver = new ResizeObserver(entries => {
    const entry = entries[0];
    if (!entry) {
      return;
    }

    const nextWidth = Math.round(entry.contentRect.width);
    if (!nextWidth || Math.abs(nextWidth - lastChartHostWidth) < 2) {
      return;
    }

    lastChartHostWidth = nextWidth;
    nextTick(() => {
      rerenderChart();
    });
  });

  chartResizeObserver.observe(host);
});

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect();
  chartResizeObserver = null;
});
</script>

<style scoped>
.network-history-chart {
  display: grid;
  gap: 8px;
  min-width: 0;
  height: auto;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.02)),
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.06), transparent 62%);
  padding: 10px;
}

.network-history-chart__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.network-history-chart__subtitle {
  margin: 0;
  color: #8fa0b3;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.network-history-chart__title {
  margin: 6px 0 0;
  color: #f8fbff;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
}

.network-history-chart__legend {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.network-history-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #d9e5f1;
  font-size: 11px;
  font-weight: 700;
}

.network-history-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.network-history-chart__legend-dot--download {
  background: rgba(96, 165, 250, 1);
}

.network-history-chart__legend-dot--upload {
  background: rgba(52, 211, 153, 1);
}

.network-history-chart__canvas {
  min-width: 0;
  width: 100%;
  height: 108px;
  overflow: hidden;
}

.network-history-chart__canvas :deep(canvas) {
  width: 100% !important;
  max-width: 100% !important;
}

@container (max-width: 300px) {
  .network-history-chart__header {
    flex-direction: column;
  }

  .network-history-chart__legend {
    justify-content: flex-start;
  }
}
</style>
