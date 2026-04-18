import * as QuickCommandTagRepository from '../quick-command-tags/quick-command-tag.repository';
import { QuickCommandTag } from '../quick-command-tags/quick-command-tag.repository';

export const getAllQuickCommandTags = async (): Promise<QuickCommandTag[]> => {
    return QuickCommandTagRepository.findAllQuickCommandTags();
};

export const getQuickCommandTagById = async (id: number): Promise<QuickCommandTag | null> => {
    return QuickCommandTagRepository.findQuickCommandTagById(id);
};

export const addQuickCommandTag = async (name: string): Promise<number> => {
    if (!name || name.trim().length === 0) {
        throw new Error('标签名称不能为空');
    }

    return QuickCommandTagRepository.createQuickCommandTag(name.trim());
};

export const updateQuickCommandTag = async (id: number, name: string): Promise<boolean> => {
    if (!name || name.trim().length === 0) {
        throw new Error('标签名称不能为空');
    }

    return QuickCommandTagRepository.updateQuickCommandTag(id, name.trim());
};

export const deleteQuickCommandTag = async (id: number): Promise<boolean> => {
    return QuickCommandTagRepository.deleteQuickCommandTag(id);
};

export const setCommandTags = async (commandId: number, tagIds: number[]): Promise<void> => {
    if (!Array.isArray(tagIds) || !tagIds.every((id) => typeof id === 'number')) {
        throw new Error('标签 ID 列表必须是数字数组');
    }

    await QuickCommandTagRepository.setCommandTagAssociations(commandId, tagIds);
};

export const getTagsForCommand = async (commandId: number): Promise<QuickCommandTag[]> => {
    return QuickCommandTagRepository.findTagsByCommandId(commandId);
};

export const reorderQuickCommandTags = async (tagIds: number[]): Promise<void> => {
    if (!Array.isArray(tagIds) || !tagIds.every((id) => typeof id === 'number')) {
        throw new Error('tagIds 必须是数字数组');
    }

    await QuickCommandTagRepository.reorderQuickCommandTags(tagIds);
};
