import { Request, Response } from 'express';
import * as QuickCommandTagService from './quick-command-tag.service';

const isNumberArray = (value: unknown): value is number[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item));

export const getAllQuickCommandTags = async (req: Request, res: Response): Promise<void> => {
    try {
        const tags = await QuickCommandTagService.getAllQuickCommandTags();
        res.status(200).json(tags);
    } catch (error: any) {
        console.error('[QuickCommandTagController] 获取快捷指令标签列表失败:', error.message);
        res.status(500).json({ message: error.message || '无法获取快捷指令标签列表' });
    }
};

export const addQuickCommandTag = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ message: '标签名称不能为空且必须是字符串' });
        return;
    }

    try {
        const newId = await QuickCommandTagService.addQuickCommandTag(name);
        const newTag = await QuickCommandTagService.getQuickCommandTagById(newId);

        if (newTag) {
            res.status(201).json({ message: '快捷指令标签已添加', tag: newTag });
            return;
        }

        res.status(201).json({ message: '快捷指令标签已添加，但无法检索新记录', id: newId });
    } catch (error: any) {
        console.error('[QuickCommandTagController] 添加快捷指令标签失败:', error.message);
        if (error.message?.includes('已存在')) {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: error.message || '无法添加快捷指令标签' });
    }
};

export const updateQuickCommandTag = async (req: Request, res: Response): Promise<void> => {
    const id = Number.parseInt(req.params.id, 10);
    const { name } = req.body;

    if (Number.isNaN(id)) {
        res.status(400).json({ message: '无效的标签 ID' });
        return;
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ message: '标签名称不能为空且必须是字符串' });
        return;
    }

    try {
        const success = await QuickCommandTagService.updateQuickCommandTag(id, name);
        if (!success) {
            const tagExists = await QuickCommandTagService.getQuickCommandTagById(id);
            res.status(tagExists ? 500 : 404).json({
                message: tagExists ? '更新快捷指令标签时发生未知错误' : '未找到要更新的快捷指令标签',
            });
            return;
        }

        const updatedTag = await QuickCommandTagService.getQuickCommandTagById(id);
        if (updatedTag) {
            res.status(200).json({ message: '快捷指令标签已更新', tag: updatedTag });
            return;
        }

        res.status(200).json({ message: '快捷指令标签已更新，但无法检索更新后的记录' });
    } catch (error: any) {
        console.error('[QuickCommandTagController] 更新快捷指令标签失败:', error.message);
        if (error.message?.includes('已存在')) {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: error.message || '无法更新快捷指令标签' });
    }
};

export const deleteQuickCommandTag = async (req: Request, res: Response): Promise<void> => {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ message: '无效的标签 ID' });
        return;
    }

    try {
        const tagExists = await QuickCommandTagService.getQuickCommandTagById(id);
        if (!tagExists) {
            res.status(404).json({ message: '未找到要删除的快捷指令标签' });
            return;
        }

        const success = await QuickCommandTagService.deleteQuickCommandTag(id);
        res.status(success ? 200 : 500).json({
            message: success ? '快捷指令标签已删除' : '删除快捷指令标签时发生未知错误',
        });
    } catch (error: any) {
        console.error('[QuickCommandTagController] 删除快捷指令标签失败:', error.message);
        res.status(500).json({ message: error.message || '无法删除快捷指令标签' });
    }
};

export const reorderQuickCommandTags = async (req: Request, res: Response): Promise<void> => {
    const { tagIds } = req.body;
    if (!isNumberArray(tagIds) || tagIds.length === 0) {
        res.status(400).json({ message: 'tagIds 必须是非空数字数组' });
        return;
    }

    try {
        await QuickCommandTagService.reorderQuickCommandTags(tagIds);
        res.status(200).json({ message: '快捷指令标签顺序已更新' });
    } catch (error: any) {
        console.error('[QuickCommandTagController] 更新快捷指令标签顺序失败:', error.message);
        res.status(500).json({ message: error.message || '无法更新快捷指令标签顺序' });
    }
};
