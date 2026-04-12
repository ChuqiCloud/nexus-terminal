<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useTagsStore } from '../stores/tags.store';
import { useConnectionsStore } from '../stores/connections.store';
import { useUiNotificationsStore } from '../stores/uiNotifications.store';
import { useConfirmDialog } from '../composables/useConfirmDialog';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'deleted']);

const { t } = useI18n();
const tagsStore = useTagsStore();
const connectionsStore = useConnectionsStore();
const uiNotificationsStore = useUiNotificationsStore();
const { showConfirmDialog } = useConfirmDialog();

const { tags, isLoading: isTagsLoading } = storeToRefs(tagsStore);
const { connections, isLoading: isConnectionsLoading } = storeToRefs(connectionsStore);

const internalVisible = ref(props.visible);
const searchQuery = ref('');
const selectedTagIds = ref<number[]>([]);
const deleteConnectionsTogether = ref(false);
const isSubmitting = ref(false);

const isBusy = computed(() => isTagsLoading.value || isConnectionsLoading.value || isSubmitting.value);
const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase());
const selectedTagIdSet = computed(() => new Set(selectedTagIds.value));

const tagConnectionCountMap = computed(() => {
  const counts = new Map<number, number>();
  tags.value.forEach((tag) => counts.set(tag.id, 0));

  connections.value.forEach((connection) => {
    connection.tag_ids?.forEach((tagId) => {
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    });
  });

  return counts;
});

const filteredTags = computed(() => {
  return tags.value
    .filter((tag) => {
      if (!normalizedSearchQuery.value) {
        return true;
      }
      return tag.name.toLowerCase().includes(normalizedSearchQuery.value);
    })
    .map((tag) => ({
      ...tag,
      connectionCount: tagConnectionCountMap.value.get(tag.id) ?? 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
});

const selectedTagCount = computed(() => selectedTagIds.value.length);
const affectedConnectionIds = computed(() => {
  const affectedIds = new Set<number>();

  connections.value.forEach((connection) => {
    if (connection.tag_ids?.some((tagId) => selectedTagIdSet.value.has(tagId))) {
      affectedIds.add(connection.id);
    }
  });

  return Array.from(affectedIds);
});

const resetState = () => {
  searchQuery.value = '';
  selectedTagIds.value = [];
  deleteConnectionsTogether.value = false;
};

const ensureDataLoaded = async () => {
  if (!tags.value.length && !tagsStore.isLoading) {
    await tagsStore.fetchTags();
  }
  if (!connections.value.length && !connectionsStore.isLoading) {
    await connectionsStore.fetchConnections();
  }
};

watch(() => props.visible, async (newValue) => {
  internalVisible.value = newValue;
  if (newValue) {
    resetState();
    await ensureDataLoaded();
  }
});

watch(internalVisible, (newValue) => {
  if (newValue !== props.visible) {
    emit('update:visible', newValue);
  }
});

const handleClose = () => {
  internalVisible.value = false;
};

const isTagSelected = (tagId: number) => {
  return selectedTagIdSet.value.has(tagId);
};

const toggleTagSelection = (tagId: number) => {
  if (selectedTagIdSet.value.has(tagId)) {
    selectedTagIds.value = selectedTagIds.value.filter((id) => id !== tagId);
    return;
  }

  selectedTagIds.value = [...selectedTagIds.value, tagId];
};

const selectAllFilteredTags = () => {
  selectedTagIds.value = Array.from(new Set([...selectedTagIds.value, ...filteredTags.value.map((tag) => tag.id)]));
};

const deselectAllFilteredTags = () => {
  const filteredTagIds = new Set(filteredTags.value.map((tag) => tag.id));
  selectedTagIds.value = selectedTagIds.value.filter((tagId) => !filteredTagIds.has(tagId));
};

const invertFilteredTagSelection = () => {
  const nextSelection = new Set(selectedTagIds.value);
  filteredTags.value.forEach((tag) => {
    if (nextSelection.has(tag.id)) {
      nextSelection.delete(tag.id);
    } else {
      nextSelection.add(tag.id);
    }
  });
  selectedTagIds.value = Array.from(nextSelection);
};

const handleDeleteSelectedTags = async () => {
  if (selectedTagCount.value === 0) {
    uiNotificationsStore.addNotification({
      type: 'warning',
      message: t('connections.tagManagement.noSelection', '请先选择至少一个标签。'),
    });
    return;
  }

  const confirmed = await showConfirmDialog({
    message: deleteConnectionsTogether.value
      ? t('connections.tagManagement.confirmDeleteWithConnections', {
          tagCount: selectedTagCount.value,
          connectionCount: affectedConnectionIds.value.length,
        })
      : t('connections.tagManagement.confirmDeleteKeepConnections', {
          tagCount: selectedTagCount.value,
        }),
  });

  if (!confirmed) {
    return;
  }

  isSubmitting.value = true;
  try {
    const summary = await tagsStore.deleteTagsBatch(selectedTagIds.value, deleteConnectionsTogether.value);
    if (!summary) {
      uiNotificationsStore.addNotification({
        type: 'error',
        message: t('connections.tagManagement.errorDelete', { error: tagsStore.error || 'Unknown error' }),
      });
      return;
    }

    uiNotificationsStore.addNotification({
      type: 'success',
      message: deleteConnectionsTogether.value
        ? t('connections.tagManagement.successWithConnections', {
            tagCount: summary.deleted_tags_count,
            deletedConnectionsCount: summary.deleted_connections_count,
          })
        : t('connections.tagManagement.successKeepConnections', {
            tagCount: summary.deleted_tags_count,
            connectionCount: summary.affected_connections_count,
          }),
    });
    emit('deleted');
    handleClose();
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="internalVisible"
      class="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <div class="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background text-foreground shadow-xl overflow-hidden">
        <div class="px-5 py-4 border-b border-border/60 bg-header/30">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-xl font-semibold">{{ t('connections.tagManagement.title', '批量标签管理') }}</h3>
                <p class="mt-1 text-sm text-text-secondary">
                  {{ t('connections.tagManagement.selectionSummary', { tagCount: selectedTagCount, connectionCount: affectedConnectionIds.length }) }}
                </p>
              </div>
              <button
                class="h-10 px-4 rounded-xl border border-border bg-background text-foreground hover:bg-border transition-colors"
                @click="handleClose"
              >
                {{ t('common.cancel', '取消') }}
              </button>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <div class="relative flex-1">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="t('connections.tagManagement.searchPlaceholder', '搜索标签名称...')"
                  class="w-full h-11 pl-10 pr-4 rounded-xl border border-border/60 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                />
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  class="h-11 px-4 rounded-xl border border-border bg-background text-foreground hover:bg-border transition-colors"
                  @click="selectAllFilteredTags"
                >
                  {{ t('connections.tagManagement.selectAll', '全选') }}
                </button>
                <button
                  class="h-11 px-4 rounded-xl border border-border bg-background text-foreground hover:bg-border transition-colors"
                  @click="deselectAllFilteredTags"
                >
                  {{ t('connections.tagManagement.deselectAll', '取消全选') }}
                </button>
                <button
                  class="h-11 px-4 rounded-xl border border-border bg-background text-foreground hover:bg-border transition-colors"
                  @click="invertFilteredTagSelection"
                >
                  {{ t('connections.tagManagement.invertSelection', '反选') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <div v-if="isBusy && filteredTags.length === 0" class="flex items-center justify-center h-full text-text-secondary">
            <i class="fas fa-spinner fa-spin mr-2"></i>{{ t('common.loading', '加载中') }}
          </div>

          <div
            v-else-if="filteredTags.length === 0"
            class="h-full min-h-[260px] rounded-2xl border border-dashed border-border/70 bg-card/40 flex flex-col items-center justify-center text-center px-6"
          >
            <i class="fas fa-tags text-2xl text-text-secondary mb-3"></i>
            <p class="text-base font-medium text-foreground">
              {{
                tags.length === 0
                  ? t('connections.tagManagement.emptyTitle', '暂无可管理标签')
                  : t('connections.tagManagement.emptySearch', '没有匹配的标签。')
              }}
            </p>
            <p class="mt-2 text-sm text-text-secondary">
              {{ t('connections.tagManagement.emptyDescription', '创建标签后即可在这里批量删除或清理。') }}
            </p>
          </div>

          <ul v-else class="space-y-2">
            <li v-for="tag in filteredTags" :key="tag.id">
              <button
                type="button"
                class="w-full rounded-2xl border px-4 py-3 text-left transition-colors flex items-center gap-3"
                :class="isTagSelected(tag.id)
                  ? 'border-primary/35 bg-primary/10 text-foreground'
                  : 'border-border bg-card/50 text-foreground hover:bg-header/35'"
                @click="toggleTagSelection(tag.id)"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                  :checked="isTagSelected(tag.id)"
                  @click.stop="toggleTagSelection(tag.id)"
                  @change.stop
                />
                <div class="min-w-0 flex-1">
                  <div class="truncate font-medium" :title="tag.name">{{ tag.name }}</div>
                  <div class="mt-1 text-sm text-text-secondary">
                    {{ t('connections.tagManagement.affectedConnections', { count: tag.connectionCount }) }}
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs border border-current/15 bg-black/10">
                  {{ tag.connectionCount }}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div class="px-5 py-4 border-t border-border/60 bg-background/90">
          <label class="flex items-start gap-3 rounded-2xl border border-error/20 bg-error/5 px-4 py-3">
            <input
              v-model="deleteConnectionsTogether"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-border bg-background text-error focus:ring-error"
            />
            <span>
              <span class="block text-sm font-medium text-foreground">
                {{ t('connections.tagManagement.deleteConnectionsLabel', '删除标签时一并删除标签下的所有服务器') }}
              </span>
              <span class="mt-1 block text-xs text-text-secondary">
                {{ t('connections.tagManagement.deleteConnectionsHint', '关闭后仅删除标签本身，原服务器会保留并归入“未标记”。') }}
              </span>
            </span>
          </label>

          <div class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="text-sm text-text-secondary">
              {{ t('connections.tagManagement.selectionSummary', { tagCount: selectedTagCount, connectionCount: affectedConnectionIds.length }) }}
            </div>
            <div class="flex items-center justify-end gap-2">
              <button
                class="h-11 px-4 rounded-xl border border-border bg-background text-foreground hover:bg-border transition-colors"
                :disabled="isSubmitting"
                @click="handleClose"
              >
                {{ t('common.cancel', '取消') }}
              </button>
              <button
                class="h-11 px-4 rounded-xl border border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                :disabled="selectedTagCount === 0 || isSubmitting"
                @click="handleDeleteSelectedTags"
              >
                <i :class="['fas', isSubmitting ? 'fa-spinner fa-spin' : 'fa-trash-alt']"></i>
                <span>{{ t('connections.tagManagement.deleteButton', '删除选中标签') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
