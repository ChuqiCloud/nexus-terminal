<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFavoritePathsStore, type FavoritePathItem } from '../stores/favoritePaths.store';
import { useSessionStore } from '../stores/session.store';
import AddEditFavoritePathForm from './AddEditFavoritePathForm.vue';
import { useWorkspaceEventEmitter } from '../composables/workspaceEvents';
import { useConfirmDialog } from '../composables/useConfirmDialog';

const PADDING = 8;

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
  triggerElement: {
    type: Object as PropType<HTMLElement | null>,
    default: null,
  },
});

const emit = defineEmits(['close', 'navigateToPath']);

const { t } = useI18n();
const favoritePathsStore = useFavoritePathsStore();
const sessionStore = useSessionStore();
const emitWorkspaceEvent = useWorkspaceEventEmitter();
const { showConfirmDialog } = useConfirmDialog();

const searchTerm = ref('');
const showAddEditModal = ref(false);
const editingPathItem = ref<FavoritePathItem | null>(null);
const modalContentRef = ref<HTMLElement | null>(null);
const modalStyle = ref<Record<string, string>>({});

const scopeTabs = computed(() => [
  { key: 'all' as const, label: t('favoritePaths.scopeAll', '全部') },
  { key: 'local' as const, label: t('favoritePaths.scopeLocal', '本地') },
  { key: 'global' as const, label: t('favoritePaths.scopeGlobal', '云端') },
]);

const filteredPaths = computed(() => {
  return favoritePathsStore.filteredFavoritePaths.filter(p => {
    if (!searchTerm.value) return true;
    const lowerSearchTerm = searchTerm.value.toLowerCase();
    return p.path.toLowerCase().includes(lowerSearchTerm) ||
      (p.name && p.name.toLowerCase().includes(lowerSearchTerm));
  });
});

const currentSortBy = computed(() => favoritePathsStore.currentSortBy);

const sortButtonIcon = computed(() => {
  return currentSortBy.value === 'name' ? 'fas fa-sort-alpha-down' : 'fas fa-clock';
});

const toggleSort = () => {
  const newSortBy = currentSortBy.value === 'name' ? 'last_used_at' : 'name';
  favoritePathsStore.setSortBy(newSortBy);
};

const handleItemClick = async (pathItem: FavoritePathItem) => {
  try {
    await favoritePathsStore.markPathAsUsed(pathItem.id, t);
  } catch (error) {
    console.error('Failed to mark path as used:', error);
  }
  emit('navigateToPath', pathItem.path);
  closeModal();
};

const openAddModal = () => {
  editingPathItem.value = null;
  showAddEditModal.value = true;
};

const openEditModal = (pathItem: FavoritePathItem) => {
  editingPathItem.value = { ...pathItem };
  showAddEditModal.value = true;
};

const handleDelete = async (pathItem: FavoritePathItem) => {
  const confirmed = await showConfirmDialog({
    message: t('favoritePaths.confirmDelete', { name: pathItem.name || pathItem.path })
  });
  if (confirmed) {
    try {
      await favoritePathsStore.deleteFavoritePath(pathItem.id, t);
    } catch (error) {
      console.error('Failed to delete favorite path from modal:', error);
    }
  }
};

const handleSendToTerminal = (pathItem: FavoritePathItem) => {
  const activeSession = sessionStore.activeSession;
  if (activeSession && activeSession.terminalManager) {
    const escapedPath = `"${pathItem.path.replace(/"/g, '\\"')}"`;
    const command = `cd ${escapedPath}\n`;
    try {
      activeSession.terminalManager.sendData(command);
    } catch (error) {
      console.error('[FavoritePathsModal] Failed to send command to active terminal:', error);
    }
  } else {
    console.warn('[FavoritePathsModal] No active session with a terminal manager found to send path to.');
  }
  closeModal();
};

const closeModal = () => {
  emit('close');
};

const updatePosition = () => {
  if (!props.isVisible || !props.triggerElement || !modalContentRef.value) {
    return;
  }

  const triggerRect = props.triggerElement.getBoundingClientRect();
  const modalWidth = modalContentRef.value.offsetWidth;
  const modalHeight = modalContentRef.value.offsetHeight;

  if (modalWidth === 0 && modalHeight === 0 && props.isVisible) {
    nextTick(updatePosition);
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = triggerRect.bottom + 2;
  let left = triggerRect.left;

  if (top + modalHeight + PADDING > viewportHeight) {
    top = triggerRect.top - modalHeight - 2;
  }

  if (top < PADDING) {
    top = PADDING;
  }

  if (left + modalWidth + PADDING > viewportWidth) {
    left = viewportWidth - modalWidth - PADDING;
  }

  if (left < PADDING) {
    left = PADDING;
  }

  modalStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
  };
};

const handleClickOutside = (event: MouseEvent) => {
  if (props.triggerElement && props.triggerElement.contains(event.target as Node)) {
    return;
  }

  if (modalContentRef.value && !modalContentRef.value.contains(event.target as Node)) {
    if (!showAddEditModal.value) {
      closeModal();
    }
  }
};

watch(() => props.isVisible, (newValue: boolean) => {
  if (newValue) {
    searchTerm.value = '';
    document.addEventListener('mousedown', handleClickOutside);
    nextTick(() => {
      updatePosition();
      window.addEventListener('resize', updatePosition);
    });
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
    window.removeEventListener('resize', updatePosition);
  }
});

onMounted(() => {
  if (props.isVisible) {
    searchTerm.value = '';
    document.addEventListener('mousedown', handleClickOutside);
    nextTick(() => {
      updatePosition();
      window.addEventListener('resize', updatePosition);
    });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', updatePosition);
});

</script>

<template>
  <div>
    <div
      v-if="isVisible"
      ref="modalContentRef"
      :style="modalStyle"
      class="z-50 w-72 md:w-80 rounded-md bg-background shadow-lg border border-border/50 max-h-80 flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-border/40 flex-shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-foreground">{{ t('favoritePaths.title', '书签列表') }}</span>
          <span class="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">{{ favoritePathsStore.favoritePaths.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            @click="toggleSort"
            class="flex items-center justify-center w-6 h-6 text-text-secondary rounded hover:text-primary hover:bg-white/5 transition-colors"
            :title="currentSortBy === 'name' ? t('favoritePaths.sortByUsage', '按使用排序') : t('favoritePaths.sortByName', '按名称排序')"
          >
            <i :class="sortButtonIcon" class="text-[11px]"></i>
          </button>
          <button
            @click="openAddModal"
            class="flex items-center justify-center w-6 h-6 text-primary rounded hover:bg-primary/10 transition-colors"
            :title="t('favoritePaths.addNew', '添加书签')"
          >
            <i class="fas fa-plus text-[11px]"></i>
          </button>
        </div>
      </div>

      <!-- Scope Tabs -->
      <div class="flex items-center gap-0.5 px-2 py-1 border-b border-border/30 flex-shrink-0">
        <button
          v-for="tab in scopeTabs"
          :key="tab.key"
          @click="favoritePathsStore.setActiveScope(tab.key)"
          :class="[
            'px-2 py-0.5 text-[11px] rounded transition-colors',
            favoritePathsStore.activeScope === tab.key
              ? 'bg-primary/15 text-primary font-medium'
              : 'text-text-secondary hover:text-foreground hover:bg-white/5'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="px-2 py-1.5 flex-shrink-0">
        <input
          type="text"
          v-model="searchTerm"
          :placeholder="t('favoritePaths.searchPlaceholder', '搜索书签...')"
          class="w-full bg-input border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      <!-- Path List -->
      <div class="overflow-y-auto flex-grow px-1 pb-1 text-xs">
        <div v-if="favoritePathsStore.isLoading && filteredPaths.length === 0" class="p-3 text-center text-text-secondary">
          <i class="fas fa-spinner fa-spin mr-1"></i>
          {{ t('favoritePaths.loading', 'Loading favorites...') }}
        </div>
        <div v-else-if="!favoritePathsStore.isLoading && filteredPaths.length === 0" class="py-6 text-center text-text-secondary">
          <i class="fas fa-bookmark text-lg mb-1 block opacity-40"></i>
          {{ searchTerm ? t('favoritePaths.noResults', '未找到匹配的书签') : t('favoritePaths.noFavorites', '暂无书签') }}
        </div>
        <div v-else class="space-y-0.5">
          <div
            v-for="favPath in filteredPaths"
            :key="favPath.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group transition-colors"
            @click="handleItemClick(favPath)"
            :title="favPath.path"
          >
            <i class="fas fa-bookmark text-[10px] text-primary/60 flex-shrink-0"></i>
            <div class="flex-1 overflow-hidden min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="truncate text-foreground text-[13px]">{{ favPath.name || favPath.path }}</span>
                <span v-if="favPath.scope === 'local'" class="text-[9px] px-1 rounded bg-blue-500/15 text-blue-400 flex-shrink-0">{{ t('favoritePaths.scopeLocal', '本地') }}</span>
                <span v-else class="text-[9px] px-1 rounded bg-emerald-500/15 text-emerald-400 flex-shrink-0">{{ t('favoritePaths.scopeGlobal', '云端') }}</span>
              </div>
              <p v-if="favPath.name" class="text-[11px] text-text-secondary/70 truncate mt-0.5">{{ favPath.path }}</p>
            </div>
            <div class="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="handleSendToTerminal(favPath)"
                class="p-1 rounded text-text-secondary hover:text-primary hover:bg-white/10 transition-colors"
                :title="t('favoritePaths.sendToTerminal', '发送到终端')">
                <i class="fas fa-terminal text-[10px]"></i>
              </button>
              <button
                @click.stop="openEditModal(favPath)"
                class="p-1 rounded text-text-secondary hover:text-primary hover:bg-white/10 transition-colors"
                :title="t('common.edit')">
                <i class="fas fa-pencil-alt text-[10px]"></i>
              </button>
              <button
                @click.stop="handleDelete(favPath)"
                class="p-1 rounded text-text-secondary hover:text-red-400 hover:bg-white/10 transition-colors"
                :title="t('common.delete')">
                <i class="fas fa-trash-alt text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <AddEditFavoritePathForm
      v-if="showAddEditModal"
      :is-visible="showAddEditModal"
      :path-data="editingPathItem"
      @close="showAddEditModal = false"
      @save-success="() => { favoritePathsStore.fetchFavoritePaths(t); showAddEditModal = false; }"
    />
  </div>
</template>