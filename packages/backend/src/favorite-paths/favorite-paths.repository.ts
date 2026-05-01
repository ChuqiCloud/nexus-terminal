import { getDbInstance, runDb, getDb as getDbRow, allDb } from '../database/connection';

// 定义收藏路径接口
export interface FavoritePath {
    id: number;
    name: string | null;
    path: string;
    scope: string;
    connection_id: number | null;
    last_used_at?: number | null;
    created_at: number;
    updated_at: number;
}

/**
 * 添加一条新的收藏路径
 * @param name - 路径名称 (可选)
 * @param path - 路径内容
 * @returns 返回插入记录的 ID
 */
export const addFavoritePath = async (name: string | null, path: string, scope: string = 'global', connectionId: number | null = null): Promise<number> => {
    const sql = `INSERT INTO favorite_paths (name, path, scope, connection_id, created_at, updated_at) VALUES (?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))`;
    try {
        const db = await getDbInstance();
        const result = await runDb(db, sql, [name, path, scope, connectionId]);
        if (typeof result.lastID !== 'number' || result.lastID <= 0) {
             throw new Error('添加收藏路径后未能获取有效的 lastID');
        }
        return result.lastID;
    } catch (err: any) {
        console.error('添加收藏路径时出错:', err.message);
        throw new Error('无法添加收藏路径');
    }
};

/**
 * 更新指定的收藏路径
 * @param id - 要更新的记录 ID
 * @param name - 新的路径名称 (可选)
 * @param path - 新的路径内容
 * @returns 返回是否成功更新 (true/false)
 */
export const updateFavoritePath = async (id: number, name: string | null, path: string, scope?: string, connectionId?: number | null): Promise<boolean> => {
    const fields = ['name = ?', 'path = ?', "updated_at = strftime('%s', 'now')"];
    const params: any[] = [name, path];
    if (scope !== undefined) {
        fields.push('scope = ?');
        params.push(scope);
    }
    if (connectionId !== undefined) {
        fields.push('connection_id = ?');
        params.push(connectionId);
    }
    params.push(id);
    const sql = `UPDATE favorite_paths SET ${fields.join(', ')} WHERE id = ?`;
    try {
        const db = await getDbInstance();
        const result = await runDb(db, sql, params);
        return result.changes > 0;
    } catch (err: any) {
        console.error('更新收藏路径时出错:', err.message);
        throw new Error('无法更新收藏路径');
    }
};

/**
 * 根据 ID 删除指定的收藏路径
 * @param id - 要删除的记录 ID
 * @returns 返回是否成功删除 (true/false)
 */
export const deleteFavoritePath = async (id: number): Promise<boolean> => {
    const sql = `DELETE FROM favorite_paths WHERE id = ?`;
    try {
        const db = await getDbInstance();
        const result = await runDb(db, sql, [id]);
        return result.changes > 0;
    } catch (err: any) {
        console.error('删除收藏路径时出错:', err.message);
        throw new Error('无法删除收藏路径');
    }
};

/**
 * 获取所有收藏路径
 * @param sortBy - 排序字段 ('name' 或 'usage_count')
 * @returns 返回包含所有收藏路径条目的数组
 */
export const getAllFavoritePaths = async (sortBy: 'name' | 'last_used_at' = 'name', scope?: string, connectionId?: number): Promise<FavoritePath[]> => {
    let orderByClause = 'ORDER BY name ASC';
    if (sortBy === 'last_used_at') {
        orderByClause = 'ORDER BY last_used_at DESC, name ASC';
    }
    const conditions: string[] = [];
    const params: any[] = [];
    if (scope) {
        conditions.push('scope = ?');
        params.push(scope);
    }
    if (connectionId !== undefined) {
        conditions.push('connection_id = ?');
        params.push(connectionId);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT id, name, path, scope, connection_id, last_used_at, created_at, updated_at FROM favorite_paths ${whereClause} ${orderByClause}`;
    try {
        const db = await getDbInstance();
        const rows = await allDb<FavoritePath>(db, sql, params);
        return rows;
    } catch (err: any) {
        console.error('获取收藏路径时出错:', err.message);
        throw new Error('无法获取收藏路径');
    }
};

/**
 * 更新指定收藏路径的上次使用时间
 * @param id - 要更新的记录 ID
 * @returns 返回是否成功更新 (true/false)
 */
export const updateFavoritePathLastUsedAt = async (id: number): Promise<boolean> => {
    const sql = `UPDATE favorite_paths SET last_used_at = strftime('%s', 'now'), updated_at = strftime('%s', 'now') WHERE id = ?`;
    try {
        const db = await getDbInstance();
        const result = await runDb(db, sql, [id]);
        return result.changes > 0;
    } catch (err: any) {
        console.error('更新收藏路径上次使用时间时出错:', err.message);
        throw new Error('无法更新收藏路径上次使用时间');
    }
};

/**
 * 根据 ID 查找收藏路径
 * @param id - 要查找的记录 ID
 * @returns 返回找到的收藏路径条目，如果未找到则返回 undefined
 */
export const findFavoritePathById = async (id: number): Promise<FavoritePath | undefined> => {
    const sql = `SELECT id, name, path, last_used_at, created_at, updated_at FROM favorite_paths WHERE id = ?`;
    try {
        const db = await getDbInstance();
        const row = await getDbRow<FavoritePath>(db, sql, [id]);
        return row;
    } catch (err: any) {
        console.error('查找收藏路径时出错:', err.message);
        throw new Error('无法查找收藏路径');
    }
};