import * as QuickCommandsRepository from '../quick-commands/quick-commands.repository';
import { QuickCommandWithTags } from '../quick-commands/quick-commands.repository';
import * as QuickCommandTagRepository from '../quick-command-tags/quick-command-tag.repository';

export type QuickCommandSortBy = 'manual' | 'name' | 'usage_count';

export const addQuickCommand = async (
    name: string | null,
    command: string,
    tagIds?: number[],
    variables?: Record<string, string>,
): Promise<number> => {
    if (!command || command.trim().length === 0) {
        throw new Error('指令内容不能为空');
    }

    const finalName = name && name.trim().length > 0 ? name.trim() : null;
    const commandId = await QuickCommandsRepository.addQuickCommand(finalName, command.trim(), variables);

    if (commandId > 0 && tagIds && Array.isArray(tagIds)) {
        try {
            await QuickCommandTagRepository.setCommandTagAssociations(commandId, tagIds);
        } catch (tagError: any) {
            console.warn(`[QuickCommandsService] 快捷指令 ${commandId} 已创建，但设置标签关联失败:`, tagError.message);
        }
    }

    return commandId;
};

export const updateQuickCommand = async (
    id: number,
    name: string | null,
    command: string,
    tagIds?: number[],
    variables?: Record<string, string>,
): Promise<boolean> => {
    if (!command || command.trim().length === 0) {
        throw new Error('指令内容不能为空');
    }

    const finalName = name && name.trim().length > 0 ? name.trim() : null;
    const commandUpdated = await QuickCommandsRepository.updateQuickCommand(id, finalName, command.trim(), variables);

    if (commandUpdated && typeof tagIds !== 'undefined') {
        try {
            await QuickCommandTagRepository.setCommandTagAssociations(id, tagIds);
        } catch (tagError: any) {
            console.warn(`[QuickCommandsService] 快捷指令 ${id} 已更新，但更新标签关联失败:`, tagError.message);
        }
    }

    return commandUpdated;
};

export const deleteQuickCommand = async (id: number): Promise<boolean> => {
    return QuickCommandsRepository.deleteQuickCommand(id);
};

export const getAllQuickCommands = async (sortBy: QuickCommandSortBy = 'manual'): Promise<QuickCommandWithTags[]> => {
    return QuickCommandsRepository.getAllQuickCommands(sortBy);
};

export const incrementUsageCount = async (id: number): Promise<boolean> => {
    return QuickCommandsRepository.incrementUsageCount(id);
};

export const getQuickCommandById = async (id: number): Promise<QuickCommandWithTags | undefined> => {
    return QuickCommandsRepository.findQuickCommandById(id);
};

export const assignTagToCommands = async (commandIds: number[], tagId: number): Promise<void> => {
    if (!Array.isArray(commandIds) || commandIds.some((id) => typeof id !== 'number' || Number.isNaN(id))) {
        throw new Error('无效的指令 ID 列表');
    }

    if (typeof tagId !== 'number' || Number.isNaN(tagId)) {
        throw new Error('无效的标签 ID');
    }

    await QuickCommandTagRepository.addTagToCommands(commandIds, tagId);
};

export const reorderQuickCommands = async (commandIds: number[]): Promise<void> => {
    if (!Array.isArray(commandIds) || commandIds.some((id) => typeof id !== 'number' || Number.isNaN(id))) {
        throw new Error('commandIds 必须是数字数组');
    }

    await QuickCommandsRepository.reorderQuickCommands(commandIds);
};

export const reorderCommandsByTag = async (tagId: number, commandIds: number[]): Promise<void> => {
    if (typeof tagId !== 'number' || Number.isNaN(tagId)) {
        throw new Error('tagId 必须是数字');
    }

    if (!Array.isArray(commandIds) || commandIds.some((id) => typeof id !== 'number' || Number.isNaN(id))) {
        throw new Error('commandIds 必须是数字数组');
    }

    await QuickCommandTagRepository.reorderCommandsInTag(tagId, commandIds);
};
