import { defineStore } from 'pinia';
import apiClient from '../utils/apiClient';
import { ref, computed, watch } from 'vue';
import { useUiNotificationsStore } from './uiNotifications.store';
import { useQuickCommandTagsStore } from './quickCommandTags.store';
import { useSettingsStore } from './settings.store';
import { useI18n } from 'vue-i18n';

export interface QuickCommandFE {
    id: number;
    name: string | null;
    command: string;
    usage_count: number;
    sort_order: number;
    created_at: number;
    updated_at: number;
    tagIds: number[];
    tagOrders: Record<number, number>;
    variables?: Record<string, string> | null;
}

export type QuickCommandSortByType = 'manual' | 'name' | 'usage_count' | 'last_used';

export interface GroupedQuickCommands {
    groupName: string;
    tagId: number | null;
    commands: QuickCommandFE[];
}

const EXPANDED_GROUPS_STORAGE_KEY = 'quickCommandsExpandedGroups';
const QUICK_COMMANDS_CACHE_KEY = 'quickCommandsListCache';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeTagOrders = (tagOrders: unknown): Record<number, number> => {
    if (!isRecord(tagOrders)) {
        return {};
    }

    return Object.entries(tagOrders).reduce<Record<number, number>>((result, [tagId, sortOrder]) => {
        const numericTagId = Number(tagId);
        const numericSortOrder = Number(sortOrder);
        if (Number.isInteger(numericTagId) && Number.isFinite(numericSortOrder)) {
            result[numericTagId] = numericSortOrder;
        }
        return result;
    }, {});
};

const normalizeQuickCommand = (command: any): QuickCommandFE => ({
    id: Number(command.id),
    name: typeof command.name === 'string' ? command.name : null,
    command: typeof command.command === 'string' ? command.command : '',
    usage_count: Number(command.usage_count ?? 0),
    sort_order: Number(command.sort_order ?? 0),
    created_at: Number(command.created_at ?? 0),
    updated_at: Number(command.updated_at ?? 0),
    tagIds: Array.isArray(command.tagIds)
        ? Array.from(new Set(command.tagIds.filter((tagId: unknown) => Number.isInteger(tagId) && Number(tagId) > 0)))
        : [],
    tagOrders: normalizeTagOrders(command.tagOrders),
    variables: isRecord(command.variables) ? (command.variables as Record<string, string>) : undefined,
});

const compareByLabel = (a: QuickCommandFE, b: QuickCommandFE): number => {
    const labelA = a.name ?? a.command;
    const labelB = b.name ?? b.command;
    return labelA.localeCompare(labelB);
};

const compareCommands = (
    a: QuickCommandFE,
    b: QuickCommandFE,
    sortBy: QuickCommandSortByType,
    tagId?: number | null,
): number => {
    if (sortBy === 'manual') {
        if (typeof tagId === 'number') {
            const tagOrderA = a.tagOrders[tagId];
            const tagOrderB = b.tagOrders[tagId];

            if (typeof tagOrderA === 'number' && typeof tagOrderB === 'number' && tagOrderA !== tagOrderB) {
                return tagOrderA - tagOrderB;
            }

            if (typeof tagOrderA === 'number' && typeof tagOrderB !== 'number') {
                return -1;
            }

            if (typeof tagOrderA !== 'number' && typeof tagOrderB === 'number') {
                return 1;
            }
        }

        if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
        }
    }

    if (sortBy === 'usage_count' && a.usage_count !== b.usage_count) {
        return b.usage_count - a.usage_count;
    }

    if (sortBy === 'last_used' && a.updated_at !== b.updated_at) {
        return b.updated_at - a.updated_at;
    }

    return compareByLabel(a, b);
};

export const useQuickCommandsStore = defineStore('quickCommands', () => {
    const quickCommandsList = ref<QuickCommandFE[]>([]);
    const searchTerm = ref('');
    const sortBy = ref<QuickCommandSortByType>('manual');
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const selectedIndex = ref<number>(-1);
    const expandedGroups = ref<Record<string, boolean>>({});

    const uiNotificationsStore = useUiNotificationsStore();
    const quickCommandTagsStore = useQuickCommandTagsStore();
    const settingsStore = useSettingsStore();
    const { t } = useI18n();

    const filteredCommands = computed(() => {
        const term = searchTerm.value.toLowerCase().trim();
        if (!term) {
            return quickCommandsList.value;
        }

        const tagMap = new Map(quickCommandTagsStore.tags.map((tag) => [tag.id, tag.name]));
        return quickCommandsList.value.filter((command) => {
            if (command.name && command.name.toLowerCase().includes(term)) {
                return true;
            }

            if (command.command.toLowerCase().includes(term)) {
                return true;
            }

            return command.tagIds.some((tagId) => {
                const tagName = tagMap.get(tagId);
                return typeof tagName === 'string' && tagName.toLowerCase().includes(term);
            });
        });
    });

    const sortedFlatCommands = computed(() => {
        return [...filteredCommands.value].sort((a, b) => compareCommands(a, b, sortBy.value));
    });

    const filteredAndGroupedCommands = computed((): GroupedQuickCommands[] => {
        const untaggedGroupName = t('quickCommands.untagged', '未标记');
        const sortedTags = [...quickCommandTagsStore.tags].sort((a, b) => {
            if (a.sort_order !== b.sort_order) {
                return a.sort_order - b.sort_order;
            }
            return a.name.localeCompare(b.name);
        });

        const groups = new Map<number, GroupedQuickCommands>();
        const untaggedCommands: QuickCommandFE[] = [];

        for (const tag of sortedTags) {
            if (expandedGroups.value[tag.name] === undefined) {
                expandedGroups.value[tag.name] = true;
            }
            groups.set(tag.id, {
                groupName: tag.name,
                tagId: tag.id,
                commands: [],
            });
        }

        for (const command of filteredCommands.value) {
            const validTagIds = command.tagIds.filter((tagId) => groups.has(tagId));
            if (validTagIds.length === 0) {
                untaggedCommands.push(command);
                continue;
            }

            for (const tagId of validTagIds) {
                groups.get(tagId)!.commands.push(command);
            }
        }

        const result: GroupedQuickCommands[] = [];
        for (const tag of sortedTags) {
            const group = groups.get(tag.id);
            if (!group || group.commands.length === 0) {
                continue;
            }
            group.commands.sort((a, b) => compareCommands(a, b, sortBy.value, tag.id));
            result.push(group);
        }

        if (untaggedCommands.length > 0) {
            if (expandedGroups.value[untaggedGroupName] === undefined) {
                expandedGroups.value[untaggedGroupName] = true;
            }
            result.push({
                groupName: untaggedGroupName,
                tagId: null,
                commands: [...untaggedCommands].sort((a, b) => compareCommands(a, b, sortBy.value, null)),
            });
        }

        return result;
    });

    const flatVisibleCommands = computed((): QuickCommandFE[] => {
        if (!settingsStore.showQuickCommandTagsBoolean) {
            return sortedFlatCommands.value;
        }

        const flatList: QuickCommandFE[] = [];
        filteredAndGroupedCommands.value.forEach((group) => {
            if (expandedGroups.value[group.groupName]) {
                flatList.push(...group.commands);
            }
        });
        return flatList;
    });

    const loadExpandedGroups = () => {
        try {
            const storedState = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY);
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                if (isRecord(parsedState)) {
                    expandedGroups.value = Object.entries(parsedState).reduce<Record<string, boolean>>((result, [key, value]) => {
                        result[key] = Boolean(value);
                        return result;
                    }, {});
                    return;
                }
            }
        } catch (cacheError) {
            console.error('[QuickCommandsStore] 读取分组展开状态失败:', cacheError);
            localStorage.removeItem(EXPANDED_GROUPS_STORAGE_KEY);
        }

        expandedGroups.value = {};
    };

    const saveExpandedGroups = () => {
        try {
            localStorage.setItem(EXPANDED_GROUPS_STORAGE_KEY, JSON.stringify(expandedGroups.value));
        } catch (cacheError) {
            console.error('[QuickCommandsStore] 保存分组展开状态失败:', cacheError);
        }
    };

    watch(expandedGroups, saveExpandedGroups, { deep: true });

    const toggleGroup = (groupName: string) => {
        expandedGroups.value[groupName] = expandedGroups.value[groupName] === undefined
            ? false
            : !expandedGroups.value[groupName];
    };

    const selectNextCommand = () => {
        const commands = flatVisibleCommands.value;
        if (commands.length === 0) {
            selectedIndex.value = -1;
            return;
        }

        selectedIndex.value = (selectedIndex.value + 1) % commands.length;
    };

    const selectPreviousCommand = () => {
        const commands = flatVisibleCommands.value;
        if (commands.length === 0) {
            selectedIndex.value = -1;
            return;
        }

        selectedIndex.value = (selectedIndex.value - 1 + commands.length) % commands.length;
    };

    const clearQuickCommandsCache = () => {
        localStorage.removeItem(QUICK_COMMANDS_CACHE_KEY);
    };

    const fetchQuickCommands = async () => {
        error.value = null;

        try {
            const cachedData = localStorage.getItem(QUICK_COMMANDS_CACHE_KEY);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                if (Array.isArray(parsedData)) {
                    quickCommandsList.value = parsedData.map(normalizeQuickCommand);
                }
            }
        } catch (cacheError) {
            console.error('[QuickCommandsStore] 读取快捷指令缓存失败:', cacheError);
            clearQuickCommandsCache();
        }

        isLoading.value = true;
        try {
            const response = await apiClient.get<QuickCommandFE[]>('/quick-commands');
            const freshData = Array.isArray(response.data) ? response.data.map(normalizeQuickCommand) : [];
            quickCommandsList.value = freshData;
            localStorage.setItem(QUICK_COMMANDS_CACHE_KEY, JSON.stringify(freshData));
        } catch (err: any) {
            console.error('[QuickCommandsStore] 获取快捷指令失败:', err);
            error.value = err.response?.data?.message || '获取快捷指令时发生错误';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
        } finally {
            isLoading.value = false;
        }
    };

    const addQuickCommand = async (
        name: string | null,
        command: string,
        tagIds?: number[],
        variables?: Record<string, string>,
    ): Promise<boolean> => {
        try {
            await apiClient.post('/quick-commands', { name, command, tagIds, variables });
            clearQuickCommandsCache();
            await fetchQuickCommands();
            uiNotificationsStore.showSuccess('快捷指令已添加');
            return true;
        } catch (err: any) {
            console.error('[QuickCommandsStore] 添加快捷指令失败:', err);
            const message = err.response?.data?.message || '添加快捷指令时发生错误';
            uiNotificationsStore.showError(message);
            return false;
        }
    };

    const updateQuickCommand = async (
        id: number,
        name: string | null,
        command: string,
        tagIds?: number[],
        variables?: Record<string, string>,
    ): Promise<boolean> => {
        try {
            await apiClient.put(`/quick-commands/${id}`, { name, command, tagIds, variables });
            clearQuickCommandsCache();
            await fetchQuickCommands();
            uiNotificationsStore.showSuccess('快捷指令已更新');
            return true;
        } catch (err: any) {
            console.error('[QuickCommandsStore] 更新快捷指令失败:', err);
            const message = err.response?.data?.message || '更新快捷指令时发生错误';
            uiNotificationsStore.showError(message);
            return false;
        }
    };

    const deleteQuickCommand = async (id: number) => {
        try {
            await apiClient.delete(`/quick-commands/${id}`);
            quickCommandsList.value = quickCommandsList.value.filter((command) => command.id !== id);
            clearQuickCommandsCache();
            uiNotificationsStore.showSuccess('快捷指令已删除');
        } catch (err: any) {
            console.error('[QuickCommandsStore] 删除快捷指令失败:', err);
            const message = err.response?.data?.message || '删除快捷指令时发生错误';
            uiNotificationsStore.showError(message);
        }
    };

    const incrementUsage = async (id: number) => {
        try {
            await apiClient.post(`/quick-commands/${id}/increment-usage`);
            const command = quickCommandsList.value.find((item) => item.id === id);
            if (command) {
                command.usage_count += 1;
                command.updated_at = Math.floor(Date.now() / 1000);
            }
        } catch (err) {
            console.error('[QuickCommandsStore] 增加快捷指令使用次数失败:', err);
        }
    };

    const setSearchTerm = (term: string) => {
        searchTerm.value = term;
        selectedIndex.value = -1;
    };

    const setSortBy = (newSortBy: QuickCommandSortByType) => {
        if (sortBy.value !== newSortBy) {
            sortBy.value = newSortBy;
            selectedIndex.value = -1;
        }
    };

    const resetSelection = () => {
        selectedIndex.value = -1;
    };

    const reorderQuickCommands = async (commandIds: number[]): Promise<boolean> => {
        if (!Array.isArray(commandIds) || commandIds.length === 0) {
            return false;
        }

        try {
            setSortBy('manual');
            await apiClient.put('/quick-commands/reorder', { commandIds });
            clearQuickCommandsCache();
            await fetchQuickCommands();
            return true;
        } catch (err: any) {
            console.error('[QuickCommandsStore] 更新快捷指令顺序失败:', err);
            const message = err.response?.data?.message || '更新快捷指令顺序失败';
            uiNotificationsStore.showError(message);
            return false;
        }
    };

    const reorderCommandsInTag = async (tagId: number, commandIds: number[]): Promise<boolean> => {
        if (!Number.isInteger(tagId) || !Array.isArray(commandIds) || commandIds.length === 0) {
            return false;
        }

        try {
            setSortBy('manual');
            await apiClient.put('/quick-commands/reorder-by-tag', { tagId, commandIds });
            clearQuickCommandsCache();
            await fetchQuickCommands();
            return true;
        } catch (err: any) {
            console.error('[QuickCommandsStore] 更新标签内快捷指令顺序失败:', err);
            const message = err.response?.data?.message || '更新标签内快捷指令顺序失败';
            uiNotificationsStore.showError(message);
            return false;
        }
    };

    const assignCommandsToTagAction = async (commandIds: number[], tagId: number): Promise<boolean> => {
        if (!Array.isArray(commandIds) || commandIds.length === 0) {
            return false;
        }

        isLoading.value = true;
        error.value = null;
        try {
            const response = await apiClient.post('/quick-commands/bulk-assign-tag', { commandIds, tagId });
            if (!response.data?.success) {
                throw new Error(response.data?.message || '批量分配标签失败');
            }

            clearQuickCommandsCache();
            await fetchQuickCommands();
            return true;
        } catch (err: any) {
            console.error('[QuickCommandsStore] 批量分配标签失败:', err);
            error.value = err.response?.data?.message || err.message || '批量分配标签失败';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
            return false;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        quickCommandsList,
        searchTerm,
        sortBy,
        isLoading,
        error,
        filteredAndGroupedCommands,
        flatVisibleCommands,
        selectedIndex,
        expandedGroups,
        fetchQuickCommands,
        addQuickCommand,
        updateQuickCommand,
        deleteQuickCommand,
        incrementUsage,
        setSearchTerm,
        setSortBy,
        selectNextCommand,
        selectPreviousCommand,
        resetSelection,
        toggleGroup,
        loadExpandedGroups,
        clearQuickCommandsCache,
        reorderQuickCommands,
        reorderCommandsInTag,
        assignCommandsToTagAction,
    };
});
