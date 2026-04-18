import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../utils/apiClient';
import { useUiNotificationsStore } from './uiNotifications.store';

export interface QuickCommandTag {
    id: number;
    name: string;
    sort_order: number;
    created_at: number;
    updated_at: number;
}

const TAG_CACHE_KEY = 'quickCommandTagsCache';

const normalizeTag = (tag: any): QuickCommandTag => ({
    id: Number(tag.id),
    name: typeof tag.name === 'string' ? tag.name : '',
    sort_order: Number.isFinite(tag.sort_order) ? Number(tag.sort_order) : 0,
    created_at: Number(tag.created_at ?? 0),
    updated_at: Number(tag.updated_at ?? 0),
});

export const useQuickCommandTagsStore = defineStore('quickCommandTags', () => {
    const tags = ref<QuickCommandTag[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const uiNotificationsStore = useUiNotificationsStore();

    async function fetchTags() {
        error.value = null;

        try {
            const cachedData = localStorage.getItem(TAG_CACHE_KEY);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                if (Array.isArray(parsedData)) {
                    tags.value = parsedData.map(normalizeTag);
                }
            }
        } catch (cacheError) {
            console.error('[QuickCommandTagsStore] 读取标签缓存失败:', cacheError);
            localStorage.removeItem(TAG_CACHE_KEY);
        }

        isLoading.value = true;
        try {
            const response = await apiClient.get<QuickCommandTag[]>('/quick-command-tags');
            const freshTags = Array.isArray(response.data) ? response.data.map(normalizeTag) : [];
            tags.value = freshTags;
            localStorage.setItem(TAG_CACHE_KEY, JSON.stringify(freshTags));
            return true;
        } catch (err: any) {
            console.error('[QuickCommandTagsStore] 获取标签失败:', err);
            error.value = err.response?.data?.message || err.message || '获取快捷指令标签列表失败';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function addTag(name: string): Promise<QuickCommandTag | null> {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await apiClient.post<{ message: string; tag: QuickCommandTag }>('/quick-command-tags', { name });
            localStorage.removeItem(TAG_CACHE_KEY);
            await fetchTags();
            uiNotificationsStore.showSuccess('快捷指令标签已添加');
            return response.data.tag ? normalizeTag(response.data.tag) : null;
        } catch (err: any) {
            console.error('[QuickCommandTagsStore] 添加标签失败:', err);
            error.value = err.response?.data?.message || err.message || '添加快捷指令标签失败';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateTag(id: number, name: string): Promise<boolean> {
        isLoading.value = true;
        error.value = null;
        try {
            await apiClient.put(`/quick-command-tags/${id}`, { name });
            localStorage.removeItem(TAG_CACHE_KEY);
            await fetchTags();
            uiNotificationsStore.showSuccess('快捷指令标签已更新');
            return true;
        } catch (err: any) {
            console.error('[QuickCommandTagsStore] 更新标签失败:', err);
            error.value = err.response?.data?.message || err.message || '更新快捷指令标签失败';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteTag(id: number): Promise<boolean> {
        isLoading.value = true;
        error.value = null;
        try {
            await apiClient.delete(`/quick-command-tags/${id}`);
            localStorage.removeItem(TAG_CACHE_KEY);
            await fetchTags();
            uiNotificationsStore.showSuccess('快捷指令标签已删除');
            return true;
        } catch (err: any) {
            console.error('[QuickCommandTagsStore] 删除标签失败:', err);
            error.value = err.response?.data?.message || err.message || '删除快捷指令标签失败';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function reorderTags(tagIds: number[]): Promise<boolean> {
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
            return false;
        }

        isLoading.value = true;
        error.value = null;
        try {
            await apiClient.put('/quick-command-tags/reorder', { tagIds });
            localStorage.removeItem(TAG_CACHE_KEY);
            await fetchTags();
            return true;
        } catch (err: any) {
            console.error('[QuickCommandTagsStore] 更新标签顺序失败:', err);
            error.value = err.response?.data?.message || err.message || '更新快捷指令标签顺序失败';
            if (error.value) {
                uiNotificationsStore.showError(error.value);
            }
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        tags,
        isLoading,
        error,
        fetchTags,
        addTag,
        updateTag,
        deleteTag,
        reorderTags,
    };
});
