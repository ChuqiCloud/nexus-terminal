import { Request, Response } from 'express';
import * as QuickCommandsService from './quick-commands.service';
import { QuickCommandSortBy } from './quick-commands.service';

const isNumberArray = (value: unknown): value is number[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item));

export const addQuickCommand = async (req: Request, res: Response): Promise<void> => {
    const { name, command, tagIds, variables } = req.body;

    if (!command || typeof command !== 'string' || command.trim().length === 0) {
        res.status(400).json({ message: '指令内容不能为空' });
        return;
    }

    if (name !== null && typeof name !== 'string') {
        res.status(400).json({ message: '名称必须是字符串或 null' });
        return;
    }

    if (tagIds !== undefined && !isNumberArray(tagIds)) {
        res.status(400).json({ message: 'tagIds 必须是数字数组' });
        return;
    }

    if (variables !== undefined && (typeof variables !== 'object' || variables === null || Array.isArray(variables))) {
        res.status(400).json({ message: 'variables 必须是对象' });
        return;
    }

    try {
        const newId = await QuickCommandsService.addQuickCommand(name, command, tagIds, variables);
        const newCommand = await QuickCommandsService.getQuickCommandById(newId);

        if (newCommand) {
            res.status(201).json({ message: '快捷指令已添加', command: newCommand });
            return;
        }

        res.status(201).json({ message: '快捷指令已添加，但无法检索新记录', id: newId });
    } catch (error: any) {
        console.error('[QuickCommandsController] 添加快捷指令失败:', error.message);
        res.status(500).json({ message: error.message || '无法添加快捷指令' });
    }
};

export const getAllQuickCommands = async (req: Request, res: Response): Promise<void> => {
    const sortBy = req.query.sortBy as QuickCommandSortBy | undefined;
    const validSortBy: QuickCommandSortBy =
        sortBy === 'name' || sortBy === 'usage_count' || sortBy === 'manual' ? sortBy : 'manual';

    try {
        const commands = await QuickCommandsService.getAllQuickCommands(validSortBy);
        res.status(200).json(commands);
    } catch (error: any) {
        console.error('[QuickCommandsController] 获取快捷指令失败:', error.message);
        res.status(500).json({ message: error.message || '无法获取快捷指令' });
    }
};

export const updateQuickCommand = async (req: Request, res: Response): Promise<void> => {
    const id = Number.parseInt(req.params.id, 10);
    const { name, command, tagIds, variables } = req.body;

    if (Number.isNaN(id)) {
        res.status(400).json({ message: '无效的 ID' });
        return;
    }

    if (!command || typeof command !== 'string' || command.trim().length === 0) {
        res.status(400).json({ message: '指令内容不能为空' });
        return;
    }

    if (name !== null && typeof name !== 'string') {
        res.status(400).json({ message: '名称必须是字符串或 null' });
        return;
    }

    if (tagIds !== undefined && !isNumberArray(tagIds)) {
        res.status(400).json({ message: 'tagIds 必须是数字数组' });
        return;
    }

    if (
        variables !== undefined &&
        variables !== null &&
        (typeof variables !== 'object' || Array.isArray(variables))
    ) {
        res.status(400).json({ message: 'variables 必须是对象或 null' });
        return;
    }

    try {
        const success = await QuickCommandsService.updateQuickCommand(id, name, command, tagIds, variables);
        if (!success) {
            const commandExists = await QuickCommandsService.getQuickCommandById(id);
            res.status(commandExists ? 500 : 404).json({
                message: commandExists ? '更新快捷指令时发生未知错误' : '未找到要更新的快捷指令',
            });
            return;
        }

        const updatedCommand = await QuickCommandsService.getQuickCommandById(id);
        if (updatedCommand) {
            res.status(200).json({ message: '快捷指令已更新', command: updatedCommand });
            return;
        }

        res.status(200).json({ message: '快捷指令已更新，但无法检索更新后的记录' });
    } catch (error: any) {
        console.error('[QuickCommandsController] 更新快捷指令失败:', error.message);
        res.status(500).json({ message: error.message || '无法更新快捷指令' });
    }
};

export const deleteQuickCommand = async (req: Request, res: Response): Promise<void> => {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ message: '无效的 ID' });
        return;
    }

    try {
        const success = await QuickCommandsService.deleteQuickCommand(id);
        res.status(success ? 200 : 404).json({
            message: success ? '快捷指令已删除' : '未找到要删除的快捷指令',
        });
    } catch (error: any) {
        console.error('[QuickCommandsController] 删除快捷指令失败:', error.message);
        res.status(500).json({ message: error.message || '无法删除快捷指令' });
    }
};

export const incrementUsage = async (req: Request, res: Response): Promise<void> => {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ message: '无效的 ID' });
        return;
    }

    try {
        const success = await QuickCommandsService.incrementUsageCount(id);
        res.status(200).json({
            message: success ? '使用次数已增加' : '使用次数已记录(或指令不存在)',
        });
    } catch (error: any) {
        console.error('[QuickCommandsController] 增加快捷指令使用次数失败:', error.message);
        res.status(500).json({ message: error.message || '无法增加使用次数' });
    }
};

export const assignTagToCommands = async (req: Request, res: Response): Promise<void> => {
    const { commandIds, tagId } = req.body;

    if (!isNumberArray(commandIds) || commandIds.length === 0 || typeof tagId !== 'number') {
        res.status(400).json({ success: false, message: '请求体必须包含 commandIds 和 tagId' });
        return;
    }

    try {
        await QuickCommandsService.assignTagToCommands(commandIds, tagId);
        res.status(200).json({
            success: true,
            message: `标签 ${tagId} 已成功关联到 ${commandIds.length} 个指令`,
        });
    } catch (error: any) {
        console.error('[QuickCommandsController] 批量分配标签失败:', error.message);
        res.status(500).json({ success: false, message: error.message || '批量分配标签失败' });
    }
};

export const reorderQuickCommands = async (req: Request, res: Response): Promise<void> => {
    const { commandIds } = req.body;
    if (!isNumberArray(commandIds) || commandIds.length === 0) {
        res.status(400).json({ message: 'commandIds 必须是非空数字数组' });
        return;
    }

    try {
        await QuickCommandsService.reorderQuickCommands(commandIds);
        res.status(200).json({ message: '快捷指令顺序已更新' });
    } catch (error: any) {
        console.error('[QuickCommandsController] 更新快捷指令顺序失败:', error.message);
        res.status(500).json({ message: error.message || '无法更新快捷指令顺序' });
    }
};

export const reorderCommandsByTag = async (req: Request, res: Response): Promise<void> => {
    const { tagId, commandIds } = req.body;
    if (typeof tagId !== 'number' || !isNumberArray(commandIds) || commandIds.length === 0) {
        res.status(400).json({ message: 'tagId 和 commandIds 必须有效' });
        return;
    }

    try {
        await QuickCommandsService.reorderCommandsByTag(tagId, commandIds);
        res.status(200).json({ message: '标签内快捷指令顺序已更新' });
    } catch (error: any) {
        console.error('[QuickCommandsController] 更新标签内快捷指令顺序失败:', error.message);
        res.status(500).json({ message: error.message || '无法更新标签内快捷指令顺序' });
    }
};
