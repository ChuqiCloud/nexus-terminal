# 任务清单: quickcommands-drag-reorder

> **@status:** completed | 2026-04-19 02:49

```yaml
@feature: quickcommands-drag-reorder
@created: 2026-04-19
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 8 | 0 | 0 | 8 |

---

## 任务列表

### 1. 数据层与迁移

- [√] 1.1 在 `packages/backend/src/database/schema.ts` 与 `packages/backend/src/database/migrations.ts` 中为快捷指令、快捷指令标签和标签关联表增加 `sort_order` 字段，并为历史数据回填稳定初始顺序 | depends_on: []
- [√] 1.2 在 `packages/backend/src/quick-commands/quick-commands.repository.ts` 与 `packages/backend/src/quick-command-tags/quick-command-tag.repository.ts` 中扩展顺序读取、写入和标签关联保序逻辑 | depends_on: [1.1]

### 2. 后端重排接口

- [√] 2.1 在 `packages/backend/src/quick-commands/` 业务域中新增全局命令重排和标签内命令重排接口 | depends_on: [1.2]
- [√] 2.2 在 `packages/backend/src/quick-command-tags/` 业务域中新增标签分组重排接口，并让新增标签默认追加到末尾 | depends_on: [1.2]

### 3. 前端状态与交互

- [√] 3.1 在 `packages/frontend/src/stores/quickCommands.store.ts` 中新增手动排序模式、顺序元数据解析和命令重排 action | depends_on: [2.1]
- [√] 3.2 在 `packages/frontend/src/stores/quickCommandTags.store.ts` 中支持标签顺序元数据和分组重排 action | depends_on: [2.2]
- [√] 3.3 在 `packages/frontend/src/views/QuickCommandsView.vue` 中接入分组拖拽、组内命令拖拽、扁平列表拖拽与搜索态禁用逻辑 | depends_on: [3.1, 3.2]

### 4. 验证与同步

- [√] 4.1 执行 `npm run build --workspace @nexus-terminal/backend` 与 `npm run build --workspace @nexus-terminal/frontend`，验证类型检查和构建通过 | depends_on: [3.3]
- [√] 4.2 同步更新 `.helloagents/modules/frontend.md`、`.helloagents/modules/backend.md` 与 `.helloagents/CHANGELOG.md`，记录本次拖拽排序能力 | depends_on: [4.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 02:08 | DESIGN | completed | 已确认采用“标签顺序 + 全局命令顺序 + 标签内命令顺序”三层持久化方案 |
| 2026-04-19 02:28 | 1.1 / 1.2 | completed | 已为三张快捷指令相关表补齐 `sort_order` 字段，并完成 repository 层顺序读写与标签关联保序改造 |
| 2026-04-19 02:39 | 2.1 / 2.2 | completed | 已补齐快捷指令与快捷指令标签的重排接口和路由，新增标签默认追加到末尾 |
| 2026-04-19 02:58 | 3.1 / 3.2 | completed | 前端 store 已支持 `manual / name / last_used` 排序模式、顺序元数据解析与重排 action |
| 2026-04-19 03:06 | 3.3 | completed | `QuickCommandsView.vue` 已支持分组拖拽、组内命令拖拽、扁平列表拖拽，并在搜索态禁用重排 |
| 2026-04-19 03:09 | 4.1 | completed | `npm run build --workspace @nexus-terminal/backend` 与 `npm run build --workspace @nexus-terminal/frontend` 均通过；前端仅保留既有 chunk size warnings |
| 2026-04-19 03:12 | 4.2 | completed | 已同步 frontend/backend 模块文档与 CHANGELOG，记录快捷指令拖拽排序能力 |

---

## 执行备注

> 本次实现对多标签命令采用“关联表局部顺序 + 命令表全局顺序”的双层建模：标签组内拖拽只影响该标签关联顺序，未标记分组和扁平列表拖拽则回写全局命令顺序，从而避免多标签命令在不同分组中的排序语义互相覆盖。
