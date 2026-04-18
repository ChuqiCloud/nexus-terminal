<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      class="cpu-core-modal__overlay"
      @click.self="emit('close')"
    >
      <section class="cpu-core-modal">
        <header class="cpu-core-modal__header">
          <div>
            <h4 class="cpu-core-modal__title">{{ t('statusMonitor.cpuCoreModalTitle') }}</h4>
            <p class="cpu-core-modal__subtitle">{{ t('statusMonitor.cpuCoreModalSubtitle') }}</p>
          </div>
          <button
            type="button"
            class="cpu-core-modal__close"
            @click="emit('close')"
          >
            {{ t('common.close', '关闭') }}
          </button>
        </header>

        <div class="cpu-core-modal__summary">
          <span class="cpu-core-modal__pill">{{ t('statusMonitor.cpuCoresValue', { count: sortedItems.length }) }}</span>
          <span class="cpu-core-modal__pill">{{ t('statusMonitor.cpuCurrentStat') }} {{ `${totalCpuPercent.toFixed(1)}%` }}</span>
          <span class="cpu-core-modal__pill">{{ t('statusMonitor.cpuAverageStat') }} {{ averagePercentDisplay }}</span>
          <span v-if="busiestCore" class="cpu-core-modal__pill">
            {{ t('statusMonitor.cpuBusiestCoreStat') }} {{ busiestCore.label }} / {{ busiestCore.value }}
          </span>
        </div>

        <div v-if="sortedItems.length > 0" class="cpu-core-modal__grid">
          <article
            v-for="item in sortedItems"
            :key="item.key"
            class="cpu-core-card"
          >
            <div class="cpu-core-card__meta">
              <span class="cpu-core-card__label">{{ item.label }}</span>
              <span class="cpu-core-card__value">{{ item.value }}</span>
            </div>
            <div class="cpu-core-card__track">
              <span class="cpu-core-card__fill" :style="{ width: `${item.percent}%` }"></span>
            </div>
          </article>
        </div>
        <div v-else class="cpu-core-modal__empty">
          {{ t('statusMonitor.cpuCoreModalEmpty', '暂无核心数据') }}
        </div>
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface CpuCoreDisplayItem {
  key: string;
  label: string;
  value: string;
  percent: number;
}

const props = defineProps<{
  isVisible: boolean;
  cpuCoreItems: CpuCoreDisplayItem[];
  totalCpuPercent: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();

const sortedItems = computed(() => [...props.cpuCoreItems].sort((left, right) => right.percent - left.percent));

const averagePercentDisplay = computed(() => {
  if (sortedItems.value.length === 0) {
    return `${props.totalCpuPercent.toFixed(1)}%`;
  }

  const total = sortedItems.value.reduce((sum, item) => sum + item.percent, 0);
  return `${(total / sortedItems.value.length).toFixed(1)}%`;
});

const busiestCore = computed(() => sortedItems.value[0] ?? null);
</script>

<style scoped>
.cpu-core-modal__overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 12, 0.72);
  backdrop-filter: blur(10px);
  padding: 20px;
}

.cpu-core-modal {
  width: min(840px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  overflow: auto;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(17, 24, 32, 0.98), rgba(11, 16, 22, 0.98)),
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 56%);
  padding: 20px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 28px 80px rgba(0, 0, 0, 0.42);
}

.cpu-core-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.cpu-core-modal__title {
  margin: 0;
  color: #f8fbff;
  font-size: 22px;
  font-weight: 800;
}

.cpu-core-modal__subtitle {
  margin: 8px 0 0;
  color: #8ea0b1;
  font-size: 13px;
}

.cpu-core-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(30, 41, 59, 0.58);
  padding: 0 12px;
  color: #dce6f3;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.cpu-core-modal__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.cpu-core-modal__pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  background: rgba(30, 64, 175, 0.18);
  padding: 0 12px;
  color: #dbeafe;
  font-size: 12px;
  font-weight: 700;
}

.cpu-core-modal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.cpu-core-card {
  display: grid;
  gap: 8px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
}

.cpu-core-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cpu-core-card__label {
  color: #d9e5f1;
  font-size: 12px;
  font-weight: 700;
}

.cpu-core-card__value {
  color: #f8fbff;
  font-size: 14px;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.cpu-core-card__track {
  position: relative;
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.6);
}

.cpu-core-card__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #7dd3fc, #2563eb);
}

.cpu-core-modal__empty {
  margin-top: 18px;
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.16);
  padding: 16px;
  color: #8ea0b1;
  text-align: center;
}

@media (max-width: 640px) {
  .cpu-core-modal {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    padding: 16px;
  }

  .cpu-core-modal__header {
    flex-direction: column;
    align-items: stretch;
  }

  .cpu-core-modal__close {
    width: 100%;
  }
}
</style>
