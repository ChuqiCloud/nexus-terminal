<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { UploadItem } from '../types/upload.types';

interface TransferTask {
  taskId: string;
  status: string;
  sourceItemName?: string;
  progress?: number;
  type: 'upload' | 'download' | 'transfer';
}

const props = defineProps<{
  uploads: Record<string, UploadItem>;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'cancel-upload', uploadId: string): void;
}>();

const { t } = useI18n();
const activeTab = ref<'all' | 'upload' | 'download'>('all');

const normalizedUploadTasks = computed<TransferTask[]>(() => {
  return Object.values(props.uploads)
    .filter(u => u.status !== 'success' && u.status !== 'cancelled')
    .map(u => ({
      taskId: u.id,
      status: u.status,
      sourceItemName: u.filename,
      progress: u.progress,
      type: 'upload' as const,
    }));
});

const filteredTasks = computed(() => {
  const all = normalizedUploadTasks.value;
  if (activeTab.value === 'upload') return all.filter(t => t.type === 'upload');
  if (activeTab.value === 'download') return all.filter(t => t.type === 'download');
  return all;
});

const tabs = computed(() => [
  { key: 'all' as const, label: t('transferPanel.tabs.all', '全部'), count: normalizedUploadTasks.value.length },
  { key: 'upload' as const, label: t('transferPanel.tabs.upload', '上传'), count: normalizedUploadTasks.value.filter(t => t.type === 'upload').length },
  { key: 'download' as const, label: t('transferPanel.tabs.download', '下载'), count: normalizedUploadTasks.value.filter(t => t.type === 'download').length },
]);

const statusLabel = (status: string) => {
  return t(`fileManager.uploadStatus.${status}`, status);
};

const handleCancel = (taskId: string) => {
  emit('cancel-upload', taskId);
};

const togglePanel = () => {
  emit('update:visible', !props.visible);
};
</script>

<template>
  <div class="border-t border-border/60 flex-shrink-0 bg-header/30">
    <div
      class="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-white/5 transition-colors"
      @click="togglePanel"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-exchange-alt text-xs text-text-secondary"></i>
        <span class="text-[11px] uppercase tracking-wider text-text-secondary font-medium">{{ t('transferPanel.title', '传输') }}</span>
        <span v-if="normalizedUploadTasks.length > 0" class="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">{{ normalizedUploadTasks.length }}</span>
      </div>
      <i :class="visible ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" class="text-[10px] text-text-secondary"></i>
    </div>

    <div v-if="visible" class="max-h-[180px] flex flex-col">
      <div class="flex items-center gap-0.5 px-2 py-1 border-t border-border/40">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-2 py-0.5 text-[11px] rounded transition-colors',
            activeTab === tab.key
              ? 'bg-primary/15 text-primary font-medium'
              : 'text-text-secondary hover:text-foreground hover:bg-white/5'
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ml-1 text-[10px] opacity-70">{{ tab.count }}</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-2 py-1">
        <div v-if="filteredTasks.length === 0" class="text-center py-6 text-text-secondary text-xs">
          <i class="fas fa-inbox text-lg mb-1 block opacity-40"></i>
          {{ t('transferPanel.empty', '暂无传输任务') }}
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="task in filteredTasks"
            :key="task.taskId"
            class="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 text-xs group"
          >
            <i :class="task.type === 'upload' ? 'fas fa-arrow-up text-emerald-400' : 'fas fa-arrow-down text-blue-400'" class="w-3 text-center flex-shrink-0 text-[10px]"></i>
            <span class="truncate flex-1 text-foreground" :title="task.sourceItemName">{{ task.sourceItemName }}</span>
            <span class="text-text-secondary text-[10px] flex-shrink-0">{{ statusLabel(task.status) }}</span>
            <div v-if="task.progress !== undefined && task.progress < 100" class="w-12 h-1 bg-border rounded-full flex-shrink-0 overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" :style="{ width: task.progress + '%' }"></div>
            </div>
            <span v-if="task.progress !== undefined" class="text-[10px] text-text-secondary w-8 text-right flex-shrink-0">{{ task.progress }}%</span>
            <button
              v-if="['pending', 'uploading', 'compressing'].includes(task.status)"
              @click.stop="handleCancel(task.taskId)"
              class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 transition-all flex-shrink-0"
              :title="t('fileManager.actions.cancel')"
            >
              <i class="fas fa-times text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
