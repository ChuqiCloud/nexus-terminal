# 任务清单: quickcommands-cross-group-drag-move

> **@status:** completed | 2026-04-19 03:34

```yaml
@feature: quickcommands-cross-group-drag-move
@created: 2026-04-19
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 7 | 0 | 0 | 7 |

---

## 任务列表

### 1. 方案与范围收敛

- [√] 1.1 确认 `packages/frontend/src/views/QuickCommandsView.vue` 当前只支持同组命令拖拽，并梳理可复用的 `updateQuickCommand` / `reorderCommandsInTag` 能力 | depends_on: []
- [√] 1.2 明确跨组移动语义为“移除源标签、加入目标标签”，并将“拖入未标记”限定为本轮不支持路径 | depends_on: [1.1]

### 2. 前端交互实现

- [√] 2.1 在 `packages/frontend/src/views/QuickCommandsView.vue` 中补充支持跨组插入的列表工具函数，并放开跨组拖放命中判断 | depends_on: [1.2]
- [√] 2.2 在 `packages/frontend/src/views/QuickCommandsView.vue` 中实现“已标记 -> 已标记”和“未标记 -> 已标记”的跨组移动编排，同时为“已标记 -> 未标记”提供提示保护 | depends_on: [2.1]
- [√] 2.3 在 `packages/frontend/src/views/QuickCommandsView.vue` 中修正 `manual / name / last_used` 三态排序按钮文案与图标 | depends_on: [2.1]

### 3. 验证与同步

- [√] 3.1 执行 `npm run build --workspace @nexus-terminal/backend` 与 `npm run build --workspace @nexus-terminal/frontend`，确认现有后端与前端构建通过 | depends_on: [2.2, 2.3]
- [√] 3.2 同步更新 `.helloagents/modules/frontend.md`、`.helloagents/modules/backend.md` 与 `.helloagents/CHANGELOG.md`，记录跨分组拖放能力并归档方案包 | depends_on: [3.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 03:22 | EVALUATE | completed | 已按 R2 确认“跨组拖拽 = 移除原分组标签并加入目标分组标签” |
| 2026-04-19 03:24 | DESIGN | completed | 已确认优先复用现有快捷指令更新与标签内重排接口，不新增后端路由 |
| 2026-04-19 03:27 | 2.1 / 2.2 / 2.3 | completed | `QuickCommandsView.vue` 已补齐跨分组插入 helper、跨组移动分支、未标记保护提示与 manual 排序按钮映射 |
| 2026-04-19 03:31 | validate_package | completed | `validate_package.py 202604190322_quickcommands-cross-group-drag-move --path E:/code/vue/nexus-terminal` 通过 |
| 2026-04-19 03:34 | 3.1 | completed | `npm run build --workspace @nexus-terminal/backend` 与 `npm run build --workspace @nexus-terminal/frontend` 通过；前端仅保留既有 vite chunk warnings |
| 2026-04-19 03:34 | 3.2 | completed | 已同步 frontend/backend 模块文档与 CHANGELOG，准备归档方案包 |

---

## 执行备注

> 本轮实现以前端编排为主：同组拖拽保持原有重排路径，跨组拖拽则拆成“静默更新 tagIds”与“固定目标组顺序”两步，以最小改动复用现有后端能力，同时避免在拖放操作中弹出编辑成功提示。
