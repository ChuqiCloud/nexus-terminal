 <template>
  <div class="qc-view">
    <div class="qc-shell">
      <div class="qc-toolbar">
        <input
          type="text"
          :placeholder="$t('quickCommands.searchPlaceholder', '搜索名称或指令...')"
          :value="searchTerm"
          data-focus-id="quickCommandsSearch"
          @input="updateSearchTerm($event)"
          @keydown="handleSearchInputKeydown"
          @blur="handleSearchInputBlur"
          ref="searchInputRef"
          class="qc-search-input"
        />

        <button @click="toggleSortBy" class="qc-icon-btn" :title="sortButtonTitle">
          <i :class="sortButtonIcon"></i>
        </button>

        <button @click="toggleCompactMode"
                class="qc-icon-btn"
                :class="{ 'qc-icon-btn--active': isCompactMode }">
          <i :class="['fas', isCompactMode ? 'fa-compress-alt' : 'fa-expand-alt']"></i>
        </button>

        <button @click="openAddForm" class="qc-icon-btn qc-icon-btn--primary" :title="$t('quickCommands.add', '添加快捷指令')">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      <div class="qc-list-area">
        <div v-if="isLoading && quickCommandsStore.quickCommandsList.length === 0" class="qc-state">
            <i class="fas fa-spinner fa-spin qc-state__icon"></i>
            <p class="qc-state__text">{{ t('common.loading', '加载中...') }}</p>
        </div>

        <div v-else-if="!isLoading && quickCommandsStore.quickCommandsList.length === 0" class="qc-state">
            <i class="fas fa-bolt qc-state__icon"></i>
            <p class="qc-state__text">{{ $t('quickCommands.empty', '没有快捷指令。') }}</p>
            <button @click="openAddForm" class="qc-state__action">
             {{ $t('quickCommands.addFirst', '创建第一个快捷指令') }}
           </button>
       </div>

        <div v-else-if="!isLoading && ((showQuickCommandTagsBoolean && filteredAndGroupedCommands.length === 0) || (!showQuickCommandTagsBoolean && flatFilteredCommands.length === 0)) && searchTerm" class="qc-state">
            <i class="fas fa-search qc-state__icon"></i>
            <p class="qc-state__text">{{ t('quickCommands.noResults', '没有找到匹配的指令') }} "{{ searchTerm }}"</p>
        </div>

       <div
        v-else
        class="qc-command-list"
        ref="commandListContainerRef"
        tabindex="0"
        @wheel.ctrl.prevent="handleWheel"
        :style="{ '--qc-row-size-multiplier': quickCommandRowSizeMultiplier }"
        @keydown="handleSearchInputKeydown"
       >
            <div v-if="showQuickCommandTagsBoolean">
                <div v-for="groupData in filteredAndGroupedCommands" :key="groupData.groupName" class="qc-group">
                    <div
                        class="qc-group__header"
                        :style="{ padding: isCompactMode ? `calc(0.25rem * var(--qc-row-size-multiplier)) calc(0.75rem * var(--qc-row-size-multiplier))` : `calc(0.5rem * var(--qc-row-size-multiplier)) calc(0.75rem * var(--qc-row-size-multiplier))` }"
                        :draggable="groupData.tagId !== null && !dragDisabledBySearch"
                        :class="{
                            'cursor-pointer': editingTagId !== (groupData.tagId === null ? 'untagged' : groupData.tagId),
                            'cursor-grab': groupData.tagId !== null && !dragDisabledBySearch,
                            'qc-drop-target': isGroupDropTarget(groupData.tagId),
                        }"
                        @click="editingTagId !== (groupData.tagId === null ? 'untagged' : groupData.tagId) ? toggleGroup(groupData.groupName) : null"
                        @dragstart="handleGroupDragStart($event, groupData.tagId)"
                        @dragover.prevent="handleGroupDragOver(groupData.tagId)"
                        @drop.prevent="handleGroupDrop(groupData.tagId)"
                        @dragend="resetDragState"
                    >
                        <i
                            :class="['fas', expandedGroups[groupData.groupName] ? 'fa-chevron-down' : 'fa-chevron-right', 'qc-group__chevron', {'transform rotate-0': !expandedGroups[groupData.groupName]}]"
                            :style="{ fontSize: `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"
                            @click.stop="toggleGroup(groupData.groupName)"
                        ></i>

                        <input
                            v-if="editingTagId === (groupData.tagId === null ? 'untagged' : groupData.tagId)"
                            :key="groupData.tagId === null ? 'untagged-input' : `tag-input-${groupData.tagId}`"
                            :ref="(el) => setTagInputRef(el, groupData.tagId === null ? 'untagged' : groupData.tagId)"
                            type="text"
                            v-model="editedTagName"
                            class="qc-tag-input"
                            :style="{ fontSize: `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"
                            @blur="finishEditingTag"
                            @keydown.enter.prevent="finishEditingTag"
                            @keydown.esc.prevent="cancelEditingTag"
                            @click.stop
                        />

                        <span
                            v-else
                            class="qc-group__name"
                            :style="{ fontSize: `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"
                            :title="t('quickCommands.tags.clickToEditTag', '点击编辑标签')"
                            @click.stop="startEditingTag(groupData.tagId, groupData.groupName)"
                        >
                            {{ groupData.groupName }}
                        </span>
                    </div>

                    <ul v-show="quickCommandsStore.expandedGroups[groupData.groupName]" class="qc-group__list">
                        <li
                            v-for="(cmd) in groupData.commands"
                            :key="cmd.id"
                            :data-command-id="cmd.id"
                            :title="cmd.command"
                            class="qc-command-row group"
                            :style="{ padding: isCompactMode ? `calc(0.1rem * var(--qc-row-size-multiplier)) calc(0.75rem * var(--qc-row-size-multiplier))` : `calc(0.625rem * var(--qc-row-size-multiplier)) calc(0.75rem * var(--qc-row-size-multiplier))` }"
                            :draggable="!dragDisabledBySearch"
                            :class="{
                                'qc-command-row--selected': isCommandSelected(cmd.id),
                                'cursor-grab': !dragDisabledBySearch,
                                'qc-drop-target': isCommandDropTarget(cmd.id, groupData.tagId),
                                'qc-command-row--dragging': isDraggingCommand(cmd.id, groupData.tagId),
                            }"
                            @click="selectCommand(cmd.id)"
                            @dblclick="executeCommand(cmd)"
                            @contextmenu.prevent="showQuickCommandContextMenu($event, cmd)"
                            @dragstart="handleCommandDragStart($event, cmd.id, groupData.tagId)"
                            @dragover.prevent="handleCommandDragOver(cmd.id, groupData.tagId)"
                            @drop.prevent="handleCommandDrop(cmd.id, groupData.tagId)"
                            @dragend="resetDragState"
                        >
                            <div class="qc-command__content">
                                <span v-if="cmd.name"
                                      class="qc-command__name"
                                      :class="{'mb-0.5': !isCompactMode, 'leading-tight': isCompactMode}"
                                      :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }">{{ cmd.name }}</span>
                                <span v-if="!isCompactMode && cmd.command"
                                      class="qc-command__text"
                                      :class="{ 'qc-command__text--solo': !cmd.name }"
                                      :style="{ fontSize: `calc(0.75em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }">{{ cmd.command }}</span>
                                <span v-else-if="isCompactMode && !cmd.name && cmd.command"
                                      class="qc-command__text qc-command__text--compact"
                                      :style="{ fontSize: `calc(0.65em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` }">{{ cmd.command }}</span>
                            </div>

                            <div class="qc-command__actions"
                                 :class="{
                                    'qc-command__actions--compact': isCompactMode,
                                    'qc-command__actions--visible': !isCompactMode
                                 }">
                                <button @click.stop="copyCommand(cmd.command)" class="qc-action-btn" :title="$t('commandHistory.copy', '复制')">
                                    <i class="fas fa-copy" :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"></i>
                                </button>
                                <button @click.stop="openEditForm(cmd)" class="qc-action-btn" :title="$t('common.edit', '编辑')">
                                    <i class="fas fa-edit" :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"></i>
                                </button>
                                <button @click.stop="confirmDelete(cmd)" class="qc-action-btn qc-action-btn--danger" :title="$t('common.delete', '删除')">
                                    <i class="fas fa-times" :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"></i>
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <ul v-else class="qc-flat-list">
                <li
                    v-for="(cmd) in flatFilteredCommands"
                    :key="cmd.id"
                    :data-command-id="cmd.id"
                    :title="cmd.command"
                    class="qc-command-row group"
                    :style="{ padding: isCompactMode ? `calc(0.1rem * var(--qc-row-size-multiplier)) calc(0.75rem * var(--qc-row-size-multiplier))` : `calc(0.625rem * var(--qc-row-size-multiplier)) calc(0.75rem * var(--qc-row-size-multiplier))` }"
                    :draggable="!dragDisabledBySearch"
                    :class="{
                        'qc-command-row--selected': isCommandSelected(cmd.id),
                        'cursor-grab': !dragDisabledBySearch,
                        'qc-drop-target': isCommandDropTarget(cmd.id, null),
                        'qc-command-row--dragging': isDraggingCommand(cmd.id, null),
                    }"
                    @click="selectCommand(cmd.id)"
                    @dblclick="executeCommand(cmd)"
                    @contextmenu.prevent="showQuickCommandContextMenu($event, cmd)"
                    @dragstart="handleCommandDragStart($event, cmd.id, null)"
                    @dragover.prevent="handleCommandDragOver(cmd.id, null)"
                    @drop.prevent="handleCommandDrop(cmd.id, null)"
                    @dragend="resetDragState"
                >
                    <div class="qc-command__content">
                        <span v-if="cmd.name"
                              class="qc-command__name"
                              :class="{'mb-0.5': !isCompactMode, 'leading-tight': isCompactMode}"
                              :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }">{{ cmd.name }}</span>
                        <span v-if="!isCompactMode && cmd.command"
                              class="qc-command__text"
                              :class="{ 'qc-command__text--solo': !cmd.name }"
                              :style="{ fontSize: `calc(0.75em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }">{{ cmd.command }}</span>
                        <span v-else-if="isCompactMode && !cmd.name && cmd.command"
                              class="qc-command__text qc-command__text--compact"
                              :style="{ fontSize: `calc(0.65em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` }">{{ cmd.command }}</span>
                    </div>

                    <div class="qc-command__actions"
                         :class="{
                            'qc-command__actions--compact': isCompactMode,
                            'qc-command__actions--visible': !isCompactMode
                         }">
                        <button @click.stop="copyCommand(cmd.command)" class="qc-action-btn" :title="$t('commandHistory.copy', '复制')">
                            <i class="fas fa-copy" :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"></i>
                        </button>
                        <button @click.stop="openEditForm(cmd)" class="qc-action-btn" :title="$t('common.edit', '编辑')">
                            <i class="fas fa-edit" :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"></i>
                        </button>
                        <button @click.stop="confirmDelete(cmd)" class="qc-action-btn qc-action-btn--danger" :title="$t('common.delete', '删除')">
                            <i class="fas fa-times" :style="{ fontSize: isCompactMode ? `calc(0.8em * max(0.8, var(--qc-row-size-multiplier) * 0.5 + 0.5))` : `calc(0.875em * max(0.85, var(--qc-row-size-multiplier) * 0.6 + 0.4))` }"></i>
                        </button>
                    </div>
                </li>
            </ul>
       </div>
      </div>
    </div>

    <AddEditQuickCommandForm
      v-if="isFormVisible"
      :command-to-edit="commandToEdit"
      @close="closeForm"
    />

    <div
      v-if="quickCommandContextMenuVisible"
      class="qc-context-menu quick-command-context-menu"
      :style="{ top: `${quickCommandContextMenuPosition.y}px`, left: `${quickCommandContextMenuPosition.x}px` }"
      @click.stop
    >
      <ul class="qc-context-menu__list">
        <li
          v-if="quickCommandContextTargetCommand"
          class="qc-context-menu__item"
          @click="handleQuickCommandMenuAction('runNow', quickCommandContextTargetCommand!)"
        >
          <i class="fas fa-play-circle qc-context-menu__icon"></i>
          <span>{{ t('quickCommands.actions.runNow', '立即执行') }}</span>
        </li>
        <li
          v-if="quickCommandContextTargetCommand"
          class="qc-context-menu__item"
          @click="handleQuickCommandMenuAction('pasteToCommandInput', quickCommandContextTargetCommand!)"
        >
          <i class="fas fa-terminal qc-context-menu__icon"></i>
          <span>{{ t('quickCommands.actions.pasteToCommandInput', '粘贴到命令输入框') }}</span>
        </li>
        <li
          v-if="quickCommandContextTargetCommand"
          class="qc-context-menu__item"
          @click="handleQuickCommandMenuAction('copyCommand', quickCommandContextTargetCommand!)"
        >
          <i class="fas fa-copy qc-context-menu__icon"></i>
          <span>{{ t('quickCommands.actions.copyCommand', '复制命令') }}</span>
        </li>
        <li
          v-if="quickCommandContextTargetCommand"
          class="qc-context-menu__item"
          @click="handleQuickCommandMenuAction('sendToAllSessions', quickCommandContextTargetCommand!)"
        >
          <i class="fas fa-server qc-context-menu__icon"></i>
          <span>{{ t('quickCommands.actions.sendToAllSessions', '发送到全部服务器') }}</span>
        </li>
        <li
          v-if="quickCommandContextTargetCommand"
          class="qc-context-menu__item qc-context-menu__item--separated"
          @click="handleQuickCommandMenuAction('edit', quickCommandContextTargetCommand!)"
        >
          <i class="fas fa-pen qc-context-menu__icon"></i>
          <span>{{ t('quickCommands.actions.edit', '编辑') }}</span>
        </li>
        <li
          v-if="quickCommandContextTargetCommand"
          class="qc-context-menu__item qc-context-menu__item--danger"
          @click="handleQuickCommandMenuAction('delete', quickCommandContextTargetCommand!)"
        >
          <i class="fas fa-trash-alt qc-context-menu__icon"></i>
          <span>{{ t('quickCommands.actions.delete', '删除') }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, defineExpose, watch, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuickCommandsStore, type QuickCommandFE, type QuickCommandSortByType, type GroupedQuickCommands } from '../stores/quickCommands.store';
import { useQuickCommandTagsStore } from '../stores/quickCommandTags.store'; 
import { useUiNotificationsStore } from '../stores/uiNotifications.store';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import AddEditQuickCommandForm from '../components/AddEditQuickCommandForm.vue';
import { useFocusSwitcherStore } from '../stores/focusSwitcher.store'; 
import { useSettingsStore } from '../stores/settings.store';
import { useWorkspaceEventEmitter } from '../composables/workspaceEvents';
import { useSessionStore } from '../stores/session.store';
import type { SessionState } from '../stores/session/types'; 
import { useConnectionsStore } from '../stores/connections.store';
import { useLoginCredentialsStore } from '../stores/loginCredentials.store';
import { getUniqueConnectedSshSessions } from '../utils/sessionSelection';
import { resolveQuickCommandTemplate, type QuickCommandTemplateWarning } from '../utils/quickCommandTemplate';

const quickCommandsStore = useQuickCommandsStore();
const quickCommandTagsStore = useQuickCommandTagsStore(); 
const uiNotificationsStore = useUiNotificationsStore();
const { t } = useI18n();
const { showConfirmDialog } = useConfirmDialog();
const focusSwitcherStore = useFocusSwitcherStore();
const settingsStore = useSettingsStore();
const emitWorkspaceEvent = useWorkspaceEventEmitter();
const sessionStore = useSessionStore(); 
const connectionsStore = useConnectionsStore(); 
const loginCredentialsStore = useLoginCredentialsStore();

const hoveredItemId = ref<number | null>(null);
const isFormVisible = ref(false);
const commandToEdit = ref<QuickCommandFE | null>(null);
const commandListContainerRef = ref<HTMLDivElement | null>(null); // Changed ref name to match template
const searchInputRef = ref<HTMLInputElement | null>(null); // +++ Ref for the search input +++
let unregisterFocus: (() => void) | null = null; // +++ 保存注销函数 +++

// +++ State for inline tag editing +++
const editingTagId = ref<number | null | 'untagged'>(null);
const editedTagName = ref('');
const tagInputRefs = ref(new Map<string | number, HTMLInputElement | null>());

// +++ 右键菜单状态 +++
const quickCommandContextMenuVisible = ref(false);
const quickCommandContextMenuPosition = ref({ x: 0, y: 0 });
const quickCommandContextTargetCommand = ref<QuickCommandFE | null>(null);
type QuickCommandContextAction =
  | 'runNow'
  | 'pasteToCommandInput'
  | 'copyCommand'
  | 'edit'
  | 'delete'
  | 'sendToAllSessions';

// --- 从 Store 获取状态和 Getter ---
const searchTerm = computed(() => quickCommandsStore.searchTerm);
const sortBy = computed(() => quickCommandsStore.sortBy);
// Use the new grouped getter
const filteredAndGroupedCommands = computed(() => quickCommandsStore.filteredAndGroupedCommands);
const isLoading = computed(() => quickCommandsStore.isLoading);


const { selectedIndex: storeSelectedIndex, flatVisibleCommands, expandedGroups } = storeToRefs(quickCommandsStore);
const {
  showQuickCommandTagsBoolean,
  quickCommandRowSizeMultiplierNumber: qcRowSizeMultiplierFromStore,
  quickCommandsCompactModeBoolean, // +++ 引入紧凑模式状态 +++
} = storeToRefs(settingsStore);

const quickCommandRowSizeMultiplier = ref(1.0);

watchEffect(() => {
  const storeVal = qcRowSizeMultiplierFromStore.value;
  if (storeVal && typeof storeVal === 'number' && storeVal > 0) {
    if (quickCommandRowSizeMultiplier.value !== storeVal) {
      quickCommandRowSizeMultiplier.value = storeVal;
      // console.log(`[QuickCmdView] Row size multiplier loaded from store: ${storeVal}`);
    }
  } else {
    // console.log(`[QuickCmdView] No valid row size multiplier in store for QuickCommands, using default: ${quickCommandRowSizeMultiplier.value}`);
  }
});

const handleWheel = (event: WheelEvent) => {
    // event.ctrlKey 和 event.preventDefault() 将由模板中的 .ctrl.prevent 修饰符处理
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    const newMultiplier = Math.max(0.5, Math.min(2.5, quickCommandRowSizeMultiplier.value + delta));
    const oldMultiplier = quickCommandRowSizeMultiplier.value;
    quickCommandRowSizeMultiplier.value = parseFloat(newMultiplier.toFixed(2));

    if (quickCommandRowSizeMultiplier.value !== oldMultiplier) {
      // console.log(`[QuickCmdView] Row size multiplier changed: ${quickCommandRowSizeMultiplier.value}. Saving to store...`);
      // 假设 settingsStore 有一个名为 updateQuickCommandRowSizeMultiplier 的 action
      if (settingsStore.updateQuickCommandRowSizeMultiplier) {
        settingsStore.updateQuickCommandRowSizeMultiplier(quickCommandRowSizeMultiplier.value);
      } else {
        console.warn('[QuickCmdView] settingsStore.updateQuickCommandRowSizeMultiplier action not found.');
      }
    }
};

// 计算属性，仅过滤和排序，不分组
const flatFilteredCommands = computed(() => {
    // 直接使用 store 中的 flatVisibleCommands，因为它已经处理了过滤和排序
    return quickCommandsStore.flatVisibleCommands;
});

const dragDisabledBySearch = computed(() => searchTerm.value.trim().length > 0);
const draggingGroupTagId = ref<number | null>(null);
const groupDropTargetTagId = ref<number | null>(null);
const draggingCommand = ref<{ commandId: number; groupTagId: number | null } | null>(null);
const commandDropTarget = ref<{ commandId: number; groupTagId: number | null } | null>(null);
const dragDisabledTitle = computed(() =>
  dragDisabledBySearch.value
    ? t('quickCommands.dragDisabledBySearch', '搜索结果中不可拖动排序')
    : t('quickCommands.dragCommand', '拖动排序快捷指令')
);

// --- Compact Mode ---
const isCompactMode = computed(() => quickCommandsCompactModeBoolean.value);

const toggleCompactMode = () => {
  const currentMode = quickCommandsCompactModeBoolean.value;
  settingsStore.updateSetting('quickCommandsCompactMode', String(!currentMode));
};

// --- Helper function for selection check ---
const isCommandSelected = (commandId: number): boolean => {
    // 使用 store 的 flatVisibleCommands 和 storeSelectedIndex
    if (storeSelectedIndex.value < 0 || !flatVisibleCommands.value[storeSelectedIndex.value]) {
        return false;
    }
    return flatVisibleCommands.value[storeSelectedIndex.value].id === commandId;
};

const selectCommand = (commandId: number) => {
    storeSelectedIndex.value = flatVisibleCommands.value.findIndex((cmd) => cmd.id === commandId);
};



// --- 生命周期钩子 ---
const resetDragState = () => {
  draggingGroupTagId.value = null;
  groupDropTargetTagId.value = null;
  draggingCommand.value = null;
  commandDropTarget.value = null;
};

const moveById = <T extends { id: number }>(items: T[], sourceId: number, targetId: number): T[] => {
  const clonedItems = [...items];
  const sourceIndex = clonedItems.findIndex((item) => item.id === sourceId);
  const targetIndex = clonedItems.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return clonedItems;
  }

  const [sourceItem] = clonedItems.splice(sourceIndex, 1);
  clonedItems.splice(targetIndex, 0, sourceItem);
  return clonedItems;
};

const insertOrMoveById = <T extends { id: number }>(
  items: T[],
  sourceId: number,
  targetId: number,
  getSourceItem?: () => T | undefined,
): T[] => {
  const clonedItems = [...items];
  const sourceIndex = clonedItems.findIndex((item) => item.id === sourceId);
  const targetIndex = clonedItems.findIndex((item) => item.id === targetId);

  if (targetIndex === -1) {
    return clonedItems;
  }

  const sourceItem = sourceIndex === -1 ? getSourceItem?.() : clonedItems.splice(sourceIndex, 1)[0];
  if (!sourceItem) {
    return clonedItems;
  }

  const nextTargetIndex = clonedItems.findIndex((item) => item.id === targetId);
  clonedItems.splice(nextTargetIndex === -1 ? clonedItems.length : nextTargetIndex, 0, sourceItem);
  return clonedItems;
};

const isGroupDropTarget = (tagId: number | null): boolean =>
  tagId !== null && groupDropTargetTagId.value === tagId;

const isDraggingCommand = (commandId: number, groupTagId: number | null): boolean =>
  draggingCommand.value?.commandId === commandId && draggingCommand.value?.groupTagId === groupTagId;

const isCommandDropTarget = (commandId: number, groupTagId: number | null): boolean =>
  commandDropTarget.value?.commandId === commandId && commandDropTarget.value?.groupTagId === groupTagId;

const handleGroupDragStart = (event: DragEvent, tagId: number | null) => {
  if (dragDisabledBySearch.value || tagId === null) {
    event.preventDefault();
    return;
  }

  draggingGroupTagId.value = tagId;
  groupDropTargetTagId.value = null;
  event.dataTransfer?.setData('text/plain', String(tagId));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleGroupDragOver = (tagId: number | null) => {
  if (draggingGroupTagId.value === null || dragDisabledBySearch.value || tagId === null || tagId === draggingGroupTagId.value) {
    return;
  }

  groupDropTargetTagId.value = tagId;
};

const handleGroupDrop = async (tagId: number | null) => {
  if (draggingGroupTagId.value === null || dragDisabledBySearch.value || tagId === null || tagId === draggingGroupTagId.value) {
    resetDragState();
    return;
  }

  const taggedGroups = filteredAndGroupedCommands.value
    .filter((group) => group.tagId !== null)
    .map((group) => ({ ...group, id: group.tagId as number }));
  const reorderedGroups = moveById(taggedGroups, draggingGroupTagId.value, tagId);
  const reorderedVisibleTagIds = reorderedGroups.map((group) => group.id);
  const globalTagIds = [...quickCommandTagsStore.tags]
    .sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
    .map((tag) => tag.id);
  const visibleTagIdSet = new Set(reorderedVisibleTagIds);
  let visibleIndex = 0;
  const mergedTagIds = globalTagIds.map((existingTagId) => {
    if (!visibleTagIdSet.has(existingTagId)) {
      return existingTagId;
    }

    const nextVisibleTagId = reorderedVisibleTagIds[visibleIndex];
    visibleIndex += 1;
    return nextVisibleTagId ?? existingTagId;
  });

  await quickCommandTagsStore.reorderTags(mergedTagIds);
  resetDragState();
};

const handleCommandDragStart = (event: DragEvent, commandId: number, groupTagId: number | null) => {
  if (dragDisabledBySearch.value) {
    event.preventDefault();
    return;
  }

  draggingCommand.value = { commandId, groupTagId };
  commandDropTarget.value = null;
  event.dataTransfer?.setData('text/plain', String(commandId));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleCommandDragOver = (commandId: number, groupTagId: number | null) => {
  if (!draggingCommand.value || dragDisabledBySearch.value) {
    return;
  }

  if (draggingCommand.value.commandId === commandId) {
    return;
  }

  if (
    showQuickCommandTagsBoolean.value
    && draggingCommand.value.groupTagId !== groupTagId
    && groupTagId === null
  ) {
    return;
  }

  commandDropTarget.value = { commandId, groupTagId };
};

const handleCommandDrop = async (commandId: number, groupTagId: number | null) => {
  const activeDraggingCommand = draggingCommand.value;

  if (!activeDraggingCommand || dragDisabledBySearch.value) {
    resetDragState();
    return;
  }

  if (activeDraggingCommand.commandId === commandId) {
    resetDragState();
    return;
  }

  const sourceGroupTagId = activeDraggingCommand.groupTagId;

  if (
    showQuickCommandTagsBoolean.value
    && sourceGroupTagId !== groupTagId
    && groupTagId === null
  ) {
    uiNotificationsStore.showInfo(t('quickCommands.dragMoveToUntaggedUnsupported', '暂不支持把已标记命令拖入“未标记”分组。'));
    resetDragState();
    return;
  }

  let currentCommands: QuickCommandFE[] = [];
  if (!showQuickCommandTagsBoolean.value || sourceGroupTagId === groupTagId) {
    if (showQuickCommandTagsBoolean.value) {
      currentCommands = filteredAndGroupedCommands.value.find((group) => group.tagId === groupTagId)?.commands ?? [];
    } else {
      currentCommands = flatFilteredCommands.value;
    }

    const reorderedCommands = moveById(currentCommands, activeDraggingCommand.commandId, commandId);

    if (showQuickCommandTagsBoolean.value) {
      if (groupTagId !== null) {
        await quickCommandsStore.reorderCommandsInTag(groupTagId, reorderedCommands.map((item) => item.id));
      } else {
        const reorderedUntaggedIds = reorderedCommands.map((item) => item.id);
        const globalCommandIds = [...quickCommandsStore.quickCommandsList]
          .sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
          .map((command) => command.id);

        let untaggedIndex = 0;
        const mergedCommandIds = globalCommandIds.map((existingCommandId) => {
          const command = quickCommandsStore.quickCommandsList.find((item) => item.id === existingCommandId);
          if (!command || command.tagIds.length > 0) {
            return existingCommandId;
          }

          const nextUntaggedId = reorderedUntaggedIds[untaggedIndex];
          untaggedIndex += 1;
          return nextUntaggedId ?? existingCommandId;
        });

        await quickCommandsStore.reorderQuickCommands(mergedCommandIds);
      }
    } else {
      await quickCommandsStore.reorderQuickCommands(reorderedCommands.map((item) => item.id));
    }

    resetDragState();
    return;
  }

  if (groupTagId === null) {
    resetDragState();
    return;
  }

  const sourceCommand = quickCommandsStore.quickCommandsList.find((item) => item.id === activeDraggingCommand.commandId);
  if (!sourceCommand) {
    resetDragState();
    return;
  }

  const nextTagIds = Array.from(
    new Set([
      ...sourceCommand.tagIds.filter((tagId) => tagId !== sourceGroupTagId),
      groupTagId,
    ]),
  );

  const updateSuccess = await quickCommandsStore.updateQuickCommand(
    sourceCommand.id,
    sourceCommand.name,
    sourceCommand.command,
    nextTagIds,
    sourceCommand.variables ?? undefined,
    false,
  );

  if (!updateSuccess) {
    resetDragState();
    return;
  }

  const refreshedSourceCommand =
    quickCommandsStore.quickCommandsList.find((item) => item.id === sourceCommand.id)
    ?? { ...sourceCommand, tagIds: nextTagIds };
  const targetCommands = filteredAndGroupedCommands.value.find((group) => group.tagId === groupTagId)?.commands ?? [];
  const reorderedTargetCommands = insertOrMoveById(
    targetCommands,
    refreshedSourceCommand.id,
    commandId,
    () => refreshedSourceCommand,
  );

  await quickCommandsStore.reorderCommandsInTag(groupTagId, reorderedTargetCommands.map((item) => item.id));
  resetDragState();
};

onMounted(async () => { // Make onMounted async
    // Load expanded groups state first
    quickCommandsStore.loadExpandedGroups();
    // Then fetch commands (which might initialize expandedGroups for new groups)
    await quickCommandsStore.fetchQuickCommands();
    // Also fetch the quick command tags using the correct store instance
    await quickCommandTagsStore.fetchTags();
    // +++ 注册自定义聚焦动作 +++
    unregisterFocus = focusSwitcherStore.registerFocusAction('quickCommandsSearch', focusSearchInput);
});

onBeforeUnmount(() => {
  // +++ 调用保存的注销函数 +++
  if (unregisterFocus) {
    unregisterFocus();
  }
});


// +++ Watcher to focus input when editing starts +++
watch(editingTagId, async (newId) => {
    if (newId !== null) {
        await nextTick();
        const inputRef = tagInputRefs.value.get(newId);
        if (inputRef) {
            inputRef.focus();
            inputRef.select();
        } else {
             console.error(`[QuickCmdView] Watcher: Input ref for ID ${newId} not found.`);
        }
    }
});

// 监听显示模式变化，重置选择
watch(showQuickCommandTagsBoolean, () => {
    quickCommandsStore.resetSelection();
});


// --- 事件处理 ---

const updateSearchTerm = (event: Event) => {
  const target = event.target as HTMLInputElement;
  quickCommandsStore.setSearchTerm(target.value);
  // selectedIndex.value = -1; // REMOVED: Store handles resetting index
};

// +++ 重构滚动逻辑 +++
const scrollToSelected = async (index: number) => {
    await nextTick(); // 等待 DOM 更新
    // 使用 store 的 flatVisibleCommands
    if (index < 0 || !commandListContainerRef.value || !flatVisibleCommands.value[index]) return;

    const selectedCommandId = flatVisibleCommands.value[index].id;
    const listContainer = commandListContainerRef.value;

    // Find the element using the data attribute (works for both views)
    const selectedElement = listContainer.querySelector(`li[data-command-id="${selectedCommandId}"]`) as HTMLLIElement;

    if (selectedElement) {
        selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    } else {
        console.warn(`[QuickCmdView] scrollToSelected: Could not find element for command ID ${selectedCommandId}`);
    }
};

// Watch for changes in the store's selectedIndex and scroll
watch(storeSelectedIndex, (newIndex) => {
  scrollToSelected(newIndex);
});

// Keyboard navigation now operates on the flat visible list from the store
const handleSearchInputKeydown = (event: KeyboardEvent) => {
    // 使用 store 的 flatVisibleCommands
    const commands = flatVisibleCommands.value;
    if (!commands.length) return;

    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      quickCommandsStore.selectNextCommand(); // Use store action
      // scrollToSelected is handled by watcher
      break;
    case 'ArrowUp':
      event.preventDefault();
      quickCommandsStore.selectPreviousCommand(); // Use store action
      // scrollToSelected is handled by watcher
      break;
    case 'Enter':
      event.preventDefault();
      // 使用 store 的 storeSelectedIndex
      if (storeSelectedIndex.value >= 0 && storeSelectedIndex.value < commands.length) {
        executeCommand(commands[storeSelectedIndex.value]);
      }
      break;
  }
};

// 处理搜索框失焦事件
const handleSearchInputBlur = () => {
  // 延迟执行，以允许点击列表项事件先触发
  setTimeout(() => {
    // 检查焦点是否还在组件内部的其他可聚焦元素上（例如按钮）
    // 如果焦点移出整个组件区域，则重置选择
    if (document.activeElement !== searchInputRef.value && !commandListContainerRef.value?.contains(document.activeElement)) {
        quickCommandsStore.resetSelection();
    }
}, 100); // 短暂延迟
};

// 切换排序方式 (Action remains the same, store handles the logic change)
const toggleSortBy = () => {
    const sortModes: QuickCommandSortByType[] = ['manual', 'name', 'last_used'];
    const currentIndex = sortModes.indexOf(sortBy.value);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % sortModes.length;
    quickCommandsStore.setSortBy(sortModes[nextIndex]);
};

// +++ Action to toggle group expansion +++
const toggleGroup = (groupName: string) => {
    quickCommandsStore.toggleGroup(groupName);
    // After toggling, selection might become invalid if the selected item is now hidden
    // Reset selection or check if the selected item is still visible
    nextTick(() => { // Wait for DOM update potentially caused by v-show
         // 使用 store 的 flatVisibleCommands 和 storeSelectedIndex
         const selectedCmdId = storeSelectedIndex.value >= 0 && flatVisibleCommands.value[storeSelectedIndex.value]
             ? flatVisibleCommands.value[storeSelectedIndex.value].id
             : null;
         if (selectedCmdId !== null) {
             const newIndex = flatVisibleCommands.value.findIndex(cmd => cmd.id === selectedCmdId);
             if (newIndex === -1) { // Selected item is no longer visible
                 quickCommandsStore.resetSelection();
             } else {
                 // Update index if it shifted, though usually reset is safer/simpler
                 // storeSelectedIndex.value = newIndex;
             }
         }
    });
};

// 计算排序按钮的 title 和 icon
const sortButtonTitle = computed(() => {
  if (sortBy.value === 'manual') {
    return t('quickCommands.sortByManual', '按手动顺序排序');
  }

  return sortBy.value === 'name'
    ? t('quickCommands.sortByName', '按名称排序')
    : t('quickCommands.sortByLastUsed', '按最近使用排序');
});

const sortButtonIcon = computed(() => {
  if (sortBy.value === 'manual') {
    return 'fas fa-grip-lines';
  }

  return sortBy.value === 'name' ? 'fas fa-sort-alpha-down' : 'fas fa-clock';
});


const openAddForm = () => {
  commandToEdit.value = null;
  isFormVisible.value = true;
};

const openEditForm = (command: QuickCommandFE) => {
  commandToEdit.value = command;
  isFormVisible.value = true;
};

const closeForm = () => {
  isFormVisible.value = false;
  commandToEdit.value = null;
};

const confirmDelete = async (command: QuickCommandFE) => {
  const confirmed = await showConfirmDialog({
    message: t('quickCommands.confirmDelete', { name: command.name || command.command })
  });
  if (confirmed) {
    quickCommandsStore.deleteQuickCommand(command.id);
  }
};

// 复制命令到剪贴板
const copyCommand = async (command: string) => {
  try {
    await navigator.clipboard.writeText(command);
    uiNotificationsStore.showSuccess(t('commandHistory.copied', '已复制到剪贴板'));
  } catch (err) {
    console.error('使用Clipboard API复制命令失败:', err);
    // 备用方案：使用临时文本区域和execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = command;
      textarea.style.position = 'fixed'; // 避免滚动到页面底部
      textarea.style.opacity = '0'; // 隐藏文本区域
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        uiNotificationsStore.showSuccess(t('commandHistory.copied', '已复制到剪贴板'));
      } else {
        uiNotificationsStore.showError(t('commandHistory.copyFailed', '复制失败'));
      }
    } catch (fallbackErr) {
      console.error('备用复制方法也失败:', fallbackErr);
      uiNotificationsStore.showError(t('commandHistory.copyFailed', '复制失败'));
    }
  }
};

const notifyTemplateWarnings = (undefinedVariables: string[], warnings: QuickCommandTemplateWarning[]) => {
  if (undefinedVariables.length > 0) {
    uiNotificationsStore.showWarning(
      t('quickCommands.form.warningUndefinedVariables', { variables: undefinedVariables.join(', ') })
    );
  }

  warnings.forEach((warning) => {
    if (warning.code === 'clipboardUnavailable') {
      uiNotificationsStore.showWarning(t('quickCommands.form.dynamicVariables.warnings.clipboardUnavailable', '无法读取剪贴板内容，已按空文本处理。'));
    } else if (warning.code === 'passwordUnavailable') {
      uiNotificationsStore.showWarning(t('quickCommands.form.dynamicVariables.warnings.passwordUnavailable', '当前活动连接没有可用的登录密码，已按空文本处理。'));
    } else if (warning.code === 'unknownDynamicVariable') {
      uiNotificationsStore.showWarning(t('quickCommands.form.dynamicVariables.warnings.unknownVariable', { variable: warning.variable }));
    }
  });
};

const resolveProcessedCommand = async (cmd: QuickCommandFE, sessionId?: string | null) => {
  const result = await resolveQuickCommandTemplate(cmd.command, {
    customVariables: cmd.variables || {},
    sessionId,
    sessions: sessionStore.sessions,
    connections: connectionsStore.connections,
    fetchLoginCredentialDetails: loginCredentialsStore.fetchLoginCredentialDetails,
  });

  notifyTemplateWarnings(result.undefinedVariables, result.warnings);
  return result.command;
};

const getActiveSessionIdOrNotify = () => {
  const activeSessionId = sessionStore.activeSessionId;
  if (!activeSessionId) {
    uiNotificationsStore.showError(t('quickCommands.form.errorNoActiveSession', '没有活动的SSH会话可执行指令。'));
    return null;
  }
  return activeSessionId;
};

// 执行命令
const executeCommand = async (cmd: QuickCommandFE) => {
  const activeSessionId = getActiveSessionIdOrNotify();
  if (!activeSessionId) {
    return;
  }

  void quickCommandsStore.incrementUsage(cmd.id);
  const processedCommand = await resolveProcessedCommand(cmd, activeSessionId);

  emitWorkspaceEvent('quickCommand:executeProcessed', {
    command: processedCommand,
    sessionId: activeSessionId
  });
};

const pasteCommandToTerminalInput = async (cmd: QuickCommandFE) => {
  const activeSessionId = getActiveSessionIdOrNotify();
  if (!activeSessionId) {
    return;
  }

  sessionStore.updateSessionCommandInput(activeSessionId, await resolveProcessedCommand(cmd, activeSessionId));
  uiNotificationsStore.showSuccess(t('quickCommands.notifications.pastedToCommandInput', '已粘贴到命令输入框'));
};

// +++ 聚焦搜索框的方法 +++
const focusSearchInput = (): boolean => {
  if (searchInputRef.value) {
    searchInputRef.value.focus();
    return true;
  }
  return false;
};
defineExpose({ focusSearchInput });

// +++ Methods for inline tag editing +++
const setTagInputRef = (el: any, id: string | number) => {
  if (el) {
    tagInputRefs.value.set(id, el as HTMLInputElement);
  } else {
    tagInputRefs.value.delete(id);
  }
};

const startEditingTag = (tagId: number | null, currentName: string) => {
  editingTagId.value = tagId === null ? 'untagged' : tagId;
  editedTagName.value = tagId === null ? '' : currentName; // Clear input for "Untagged"
  // Focus logic is handled by the watcher
};

const finishEditingTag = async () => {
  const currentEditingId = editingTagId.value;
  const newName = editedTagName.value.trim();
  const originalGroup = filteredAndGroupedCommands.value.find(g => g.tagId === currentEditingId); // Find original group data

  // Basic validation
  if (newName === '' && currentEditingId !== 'untagged') {
    cancelEditingTag();
    return;
  }
   if (newName === '' && currentEditingId === 'untagged') {
     cancelEditingTag();
     return;
   }

  let operationSuccess = false;

  try {
    if (currentEditingId === 'untagged') {
      // --- Create new tag and assign commands ---
      console.log(`[QuickCmdView] Creating new tag: ${newName}`);
      const newTag = await quickCommandTagsStore.addTag(newName);
      if (newTag) {
        operationSuccess = true;
        uiNotificationsStore.showSuccess(t('quickCommands.tags.createSuccess')); // Use specific translation key
        const untaggedGroup = filteredAndGroupedCommands.value.find(g => g.tagId === null);
        const commandIdsToAssign = untaggedGroup ? untaggedGroup.commands.map(c => c.id) : [];

        if (commandIdsToAssign.length > 0) {
          console.log(`[QuickCmdView] Assigning ${commandIdsToAssign.length} commands to new tag ID: ${newTag.id}`);
          console.log(`[QuickCmdView] Command IDs to assign: ${JSON.stringify(commandIdsToAssign)}`); 
          // Call the store action to assign commands to the new tag
          const assignSuccess = await quickCommandsStore.assignCommandsToTagAction(commandIdsToAssign, newTag.id);
          if (assignSuccess) {
            // Success/Error Notifications and list refresh are handled within the store action
            console.log(`[QuickCmdView] assignCommandsToTagAction reported success.`);
          } else {
             console.error(`[QuickCmdView] assignCommandsToTagAction reported failure.`);
             // Optionally show a specific error here if the store action doesn't cover all cases
          }
          // Remove TODO and temporary warning/refresh
          // console.warn("TODO: Implement assignCommandsToTagAction in quickCommands.store and backend");
          // uiNotificationsStore.showWarning("标签已创建，但指令分配功能尚未实现");
          // await quickCommandsStore.fetchQuickCommands(); // Store action handles refresh
        } else {
          uiNotificationsStore.showInfo(t('quickCommands.tags.noCommandsToAssign'));
        }

        // Update expanded group state
        const untaggedGroupName = t('quickCommands.untagged', '未标记');
        if (expandedGroups.value[untaggedGroupName] !== undefined) {
          const currentState = expandedGroups.value[untaggedGroupName];
          delete expandedGroups.value[untaggedGroupName]; // Remove old key
          expandedGroups.value[newName] = currentState; // Add new key
        }
      }
      // addTag failure handled in store
    } else if (typeof currentEditingId === 'number') {
      // --- Update existing tag ---
      const originalTagName = originalGroup?.groupName;
      if (!originalTagName) {
         console.error(`[QuickCmdView] Cannot find original group name for tag ID ${currentEditingId}`);
         cancelEditingTag();
         return;
      }
      if (originalTagName === newName) {
        operationSuccess = true; // No change needed
      } else {
        console.log(`[QuickCmdView] Updating tag ID ${currentEditingId} from "${originalTagName}" to "${newName}"`);
        const updateResult = await quickCommandTagsStore.updateTag(currentEditingId, newName);
        if (updateResult) {
          operationSuccess = true;
          // uiNotificationsStore.showSuccess(t('quickCommands.tags.updateSuccess'));
          // Update expanded group state
          if (expandedGroups.value[originalTagName] !== undefined) {
            const currentState = expandedGroups.value[originalTagName];
            delete expandedGroups.value[originalTagName];
            expandedGroups.value[newName] = currentState;
          }
           // Refresh commands to reflect potential grouping changes if names clashed etc.
           await quickCommandsStore.fetchQuickCommands();
        }
        // updateTag failure handled in store
      }
    }
  } catch (error: any) {
    console.error("[QuickCmdView] Error during finishEditingTag:", error);
    uiNotificationsStore.showError(t('common.unexpectedError'));
  } finally {
    editingTagId.value = null; // Exit edit mode regardless of success
  }
};

const cancelEditingTag = () => {
  editingTagId.value = null;
};

// +++ 右键菜单方法 +++
const showQuickCommandContextMenu = (event: MouseEvent, command: QuickCommandFE) => {
event.preventDefault();
quickCommandContextTargetCommand.value = command;
quickCommandContextMenuPosition.value = { x: event.clientX, y: event.clientY };
quickCommandContextMenuVisible.value = true;
document.addEventListener('click', closeQuickCommandContextMenu, { once: true });

// 使用 nextTick 获取菜单尺寸并调整位置以防止超出屏幕
nextTick(() => {
  const menuElement = document.querySelector('.quick-command-context-menu') as HTMLElement;
  if (menuElement) {
    const menuRect = menuElement.getBoundingClientRect();
    let finalX = quickCommandContextMenuPosition.value.x;
    let finalY = quickCommandContextMenuPosition.value.y;
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    // 调整水平位置
    if (finalX + menuWidth > window.innerWidth) {
      finalX = window.innerWidth - menuWidth - 5;
    }

    // 调整垂直位置
    if (finalY + menuHeight > window.innerHeight) {
      finalY = window.innerHeight - menuHeight - 5;
    }

    // 确保菜单不超出屏幕左上角
    finalX = Math.max(5, finalX);
    finalY = Math.max(5, finalY);

    // 更新位置
    if (finalX !== quickCommandContextMenuPosition.value.x || finalY !== quickCommandContextMenuPosition.value.y) {
      console.log(`[QuickCmdView] Adjusting quick command context menu position: (${quickCommandContextMenuPosition.value.x}, ${quickCommandContextMenuPosition.value.y}) -> (${finalX}, ${finalY})`);
      quickCommandContextMenuPosition.value = { x: finalX, y: finalY };
    }
  }
});
};

const closeQuickCommandContextMenu = () => {
  quickCommandContextMenuVisible.value = false;
  quickCommandContextTargetCommand.value = null;
  document.removeEventListener('click', closeQuickCommandContextMenu);
};

const handleQuickCommandMenuAction = async (action: QuickCommandContextAction, command: QuickCommandFE) => {
  closeQuickCommandContextMenu();

  if (action === 'runNow') {
    await executeCommand(command);
    return;
  }

  if (action === 'pasteToCommandInput') {
    await pasteCommandToTerminalInput(command);
    return;
  }

  if (action === 'copyCommand') {
    void copyCommand(command.command);
    return;
  }

  if (action === 'edit') {
    openEditForm(command);
    return;
  }

  if (action === 'delete') {
    void confirmDelete(command);
    return;
  }

  if (action === 'sendToAllSessions') {
    const activeSshSessions = getUniqueConnectedSshSessions(sessionStore.sessions, connectionsStore.connections);

    if (activeSshSessions.length > 0) {
      for (const session of activeSshSessions) {
        const processedCommand = await resolveProcessedCommand(command, session.sessionId);
        emitWorkspaceEvent('terminal:sendCommand', { sessionId: session.sessionId, command: processedCommand });
      }
      uiNotificationsStore.addNotification({
        message: t('quickCommands.notifications.sentToAllSessions', { count: activeSshSessions.length }),
        type: 'success',
      });
    } else {
      uiNotificationsStore.addNotification({
        message: t('quickCommands.notifications.noActiveSshSessions'),
        type: 'info',
      });
    }
  }
};

</script>

<style scoped>
.qc-view {
  --qc-bg: #000000;
  --qc-surface: #0b0b0b;
  --qc-surface-muted: #1a1a1a;
  --qc-border: rgba(94, 94, 94, 0.5);
  --qc-border-soft: rgba(167, 167, 167, 0.1);
  --qc-text: #ffffff;
  --qc-text-muted: #a7a7a7;
  --qc-text-dim: #757575;
  --qc-accent: #76b900;
  --qc-accent-soft: rgba(118, 185, 0, 0.12);
  --qc-danger: #e52020;
  --qc-danger-soft: rgba(229, 32, 32, 0.12);
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: var(--qc-bg);
  color: var(--qc-text);
  font-family: var(--font-family-sans-serif, Arial, Helvetica, sans-serif);
}

.qc-shell {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  background: var(--qc-bg);
}

.qc-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--qc-border-soft);
  background: var(--qc-bg);
}

.qc-search-input {
  min-width: 0;
  height: 32px;
  flex: 1;
  border: 1px solid var(--qc-border);
  border-radius: 2px;
  background: var(--qc-surface-muted);
  color: var(--qc-text);
  padding: 0 11px;
  font-size: 13px;
  line-height: 1.4;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.qc-search-input::placeholder {
  color: var(--qc-text-dim);
}

.qc-search-input:focus {
  border-color: var(--qc-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--qc-accent) 24%, transparent);
  outline: none;
}

.qc-icon-btn {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--qc-border);
  border-radius: 2px;
  background: transparent;
  color: var(--qc-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.qc-icon-btn i,
.qc-icon-btn .fas {
  color: currentColor;
  font-size: 13px;
}

.qc-icon-btn:hover,
.qc-icon-btn--active {
  border-color: var(--qc-accent);
  background: var(--qc-accent-soft);
  color: var(--qc-accent);
}

.qc-icon-btn--primary {
  border-color: var(--qc-accent);
  background: var(--qc-accent);
  color: #000000;
}

.qc-icon-btn--primary:hover {
  border-color: #1eaedb;
  background: #1eaedb;
  color: #ffffff;
}

.qc-list-area {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: var(--qc-bg);
}

.qc-state {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  color: var(--qc-text-muted);
}

.qc-state__icon {
  color: var(--qc-text-dim);
  font-size: 24px;
}

.qc-state__text {
  margin: 0;
  color: var(--qc-text-muted);
  font-size: 13px;
}

.qc-state__action {
  border: 2px solid var(--qc-accent);
  border-radius: 2px;
  background: transparent;
  color: var(--qc-text);
  padding: 8px 13px;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.qc-state__action:hover {
  border-color: #1eaedb;
  background: #1eaedb;
  color: #ffffff;
}

.qc-command-list {
  margin: 0;
  padding: 0;
  outline: none;
}

.qc-group {
  border-bottom: 1px solid var(--qc-border-soft);
}

.qc-group:last-child {
  border-bottom: none;
}

.qc-group__header {
  display: flex;
  align-items: center;
  gap: 0;
  color: var(--qc-text);
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease;
}

.qc-group__header:hover {
  background: var(--qc-surface-muted);
}

.qc-group__chevron {
  width: 16px;
  flex-shrink: 0;
  margin-right: 8px;
  cursor: pointer;
  color: var(--qc-text-dim);
  text-align: center;
  transition: color 0.15s ease, transform 0.2s ease;
}

.qc-group__header:hover .qc-group__chevron {
  color: var(--qc-accent);
}

.qc-group__name {
  display: inline-block;
  min-width: 0;
  overflow: hidden;
  color: var(--qc-text);
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qc-group__name:hover {
  color: var(--qc-accent);
}

.qc-tag-input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--qc-accent);
  border-radius: 2px;
  background: var(--qc-surface-muted);
  color: var(--qc-text);
  padding: 1px 6px;
}

.qc-group__list,
.qc-flat-list,
.qc-context-menu__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.qc-group__list {
  padding-left: 12px;
}

.qc-command-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
  border-radius: 2px;
  cursor: pointer;
  color: var(--qc-text);
  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.qc-command-row:hover {
  background: var(--qc-surface-muted);
}

.qc-command-row--selected {
  background: var(--qc-accent-soft);
  color: var(--qc-text);
  font-weight: 700;
  box-shadow: inset 2px 0 0 var(--qc-accent);
}

.qc-command-row--dragging {
  opacity: 0.7;
}

.qc-command__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  margin-right: 8px;
}

.qc-command__name,
.qc-command__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qc-command__name {
  color: var(--qc-text);
  font-weight: 700;
}

.qc-command__text {
  color: var(--qc-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.25;
}

.qc-command__text--solo {
  color: var(--qc-text-muted);
}

.qc-command__text--compact {
  color: var(--qc-text-dim);
}

.qc-command__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  transition: opacity 0.15s ease;
}

.qc-command__actions--compact {
  opacity: 0;
}

.qc-command-row:hover .qc-command__actions--compact,
.qc-command__actions--compact:focus-within {
  opacity: 1;
}

.qc-command__actions--visible {
  opacity: 1;
}

.qc-action-btn {
  display: inline-flex;
  min-width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: var(--qc-text-muted);
  transition: background 0.15s ease, color 0.15s ease;
}

.qc-action-btn i,
.qc-action-btn .fas {
  color: currentColor;
}

.qc-action-btn:hover {
  background: var(--qc-accent-soft);
  color: var(--qc-accent);
}

.qc-action-btn--danger:hover {
  background: var(--qc-danger-soft);
  color: var(--qc-danger);
}

.qc-drop-target {
  outline: 1px dashed color-mix(in srgb, var(--qc-accent) 72%, transparent);
  outline-offset: -2px;
}

.qc-context-menu {
  --qc-menu-bg: #1a1a1a;
  --qc-menu-bg-edge: #0b0b0b;
  --qc-menu-border: #5e5e5e;
  --qc-menu-border-soft: rgba(167, 167, 167, 0.14);
  --qc-menu-text: #ffffff;
  --qc-menu-muted: #a7a7a7;
  --qc-menu-accent: #76b900;
  --qc-menu-accent-soft: rgba(118, 185, 0, 0.14);
  --qc-menu-danger: #e52020;
  --qc-menu-danger-soft: rgba(229, 32, 32, 0.14);
  position: fixed;
  z-index: 50;
  min-width: 220px;
  border: 1px solid var(--qc-menu-border);
  border-radius: 2px;
  background-color: var(--qc-menu-bg);
  background-image: linear-gradient(180deg, var(--qc-menu-bg) 0%, var(--qc-menu-bg-edge) 100%);
  box-shadow: rgba(0, 0, 0, 0.3) 0 0 5px 0;
  color: var(--qc-menu-text);
  overflow: hidden;
  padding: 6px;
}

.qc-context-menu__list {
  border-radius: 1px;
  background: var(--qc-menu-bg);
}

.qc-context-menu__item {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 12px;
  border-radius: 2px;
  color: var(--qc-menu-text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 7px 10px;
  transition: background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
}

.qc-context-menu__item:hover {
  background: var(--qc-menu-accent-soft);
  color: var(--qc-menu-accent);
  box-shadow: inset 2px 0 0 var(--qc-menu-accent);
}

.qc-context-menu__item--separated {
  margin-top: 6px;
  border-top: 1px solid var(--qc-menu-border-soft);
  padding-top: 9px;
}

.qc-context-menu__item--danger {
  color: var(--qc-menu-danger);
}

.qc-context-menu__item--danger:hover {
  background: var(--qc-menu-danger-soft);
  color: var(--qc-menu-danger);
  box-shadow: inset 2px 0 0 var(--qc-menu-danger);
}

.qc-context-menu__icon {
  width: 16px;
  color: var(--qc-menu-muted);
  text-align: center;
}

.qc-context-menu__item:hover .qc-context-menu__icon,
.qc-context-menu__item--danger .qc-context-menu__icon {
  color: currentColor;
}

@media (max-width: 420px) {
  .qc-toolbar {
    gap: 6px;
    padding: 8px;
  }

  .qc-icon-btn {
    width: 30px;
    height: 30px;
  }

  .qc-group__list {
    padding-left: 8px;
  }
}

:global(html.light) .qc-view,
:global(body.light) .qc-view,
:global([data-theme="light"]) .qc-view {
  --qc-bg: #f5f5f7;
  --qc-surface: #ffffff;
  --qc-surface-muted: #ffffff;
  --qc-border: rgba(0, 0, 0, 0.12);
  --qc-border-soft: rgba(0, 0, 0, 0.08);
  --qc-text: #1d1d1f;
  --qc-text-muted: rgba(0, 0, 0, 0.58);
  --qc-text-dim: rgba(0, 0, 0, 0.42);
  --qc-accent: #0071e3;
  --qc-accent-soft: rgba(0, 113, 227, 0.1);
  --qc-danger: #e52020;
  --qc-danger-soft: rgba(229, 32, 32, 0.1);
}

:global(html.light) .qc-icon-btn--primary,
:global(body.light) .qc-icon-btn--primary,
:global([data-theme="light"]) .qc-icon-btn--primary {
  color: #ffffff;
}

:global(html.light) .qc-icon-btn--primary:hover,
:global(body.light) .qc-icon-btn--primary:hover,
:global([data-theme="light"]) .qc-icon-btn--primary:hover {
  border-color: #0066cc;
  background: #0066cc;
  color: #ffffff;
}

:global(html.light) .qc-context-menu,
:global(body.light) .qc-context-menu,
:global([data-theme="light"]) .qc-context-menu {
  --qc-menu-bg: #ffffff;
  --qc-menu-bg-edge: #f5f5f7;
  --qc-menu-border: rgba(94, 94, 94, 0.42);
  --qc-menu-border-soft: rgba(0, 0, 0, 0.12);
  --qc-menu-text: #000000;
  --qc-menu-muted: #757575;
  --qc-menu-accent: #76b900;
  --qc-menu-accent-soft: rgba(118, 185, 0, 0.12);
  --qc-menu-danger: #e52020;
  --qc-menu-danger-soft: rgba(229, 32, 32, 0.1);
  box-shadow: rgba(0, 0, 0, 0.22) 0 4px 18px 0;
}
</style>
