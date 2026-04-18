# 任务清单: process-manager-table-sort-and-close-spacing

> **@status:** completed | 2026-04-19 04:03

```yaml
@feature: process-manager-table-sort-and-close-spacing
@created: 2026-04-19
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 6 | 0 | 0 | 6 |

---

## 任务列表

### 1. 方案与现状确认

- [√] 1.1 确认 `packages/frontend/src/components/ProcessManagerModal.vue` 当前仅支持搜索与刷新，不支持表头排序，并定位关闭按钮与刷新区的布局关系 | depends_on: []

### 2. 前端实现

- [√] 2.1 在 `packages/frontend/src/components/ProcessManagerModal.vue` 中新增本地排序状态与排序计算逻辑，支持主要数据列点击排序 | depends_on: [1.1]
- [√] 2.2 在 `packages/frontend/src/components/ProcessManagerModal.vue` 中把静态表头改为可点击排序按钮，并显示升降序方向标记 | depends_on: [2.1]
- [√] 2.3 在 `packages/frontend/src/components/ProcessManagerModal.vue` 中调整 toolbar 与关闭按钮的安全间距，避免关闭按钮与刷新区过近 | depends_on: [1.1]

### 3. 验证与同步

- [√] 3.1 执行 `npm run build --workspace @nexus-terminal/frontend`，确认类型检查和构建通过 | depends_on: [2.2, 2.3]
- [√] 3.2 同步更新 `.helloagents/modules/frontend.md` 与 `.helloagents/CHANGELOG.md`，记录进程管理表头排序与顶部间距优化 | depends_on: [3.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 03:51 | EVALUATE | completed | 已按 R2 确认进程管理表需支持全量主要列排序，用户选择所有主要数据列可排序 |
| 2026-04-19 03:52 | DESIGN | completed | 已将用户补充的“关闭按钮与刷新区过近”并入同一方案包处理 |
| 2026-04-19 03:54 | 2.1 / 2.2 / 2.3 | completed | `ProcessManagerModal.vue` 已补齐本地排序状态、可点击表头方向标记和 toolbar 安全间距 |
| 2026-04-19 03:55 | validate_package | completed | `validate_package.py 202604190352_process-manager-table-sort-and-close-spacing --path E:/code/vue/nexus-terminal` 通过 |
| 2026-04-19 04:01 | 3.1 | completed | `npm run build --workspace @nexus-terminal/frontend` 通过；期间顺手将 `server.types.ts` 中 `cpuCorePercents` 放宽为只读数组以匹配当前 StatusMonitor 用法 |
| 2026-04-19 04:03 | 3.2 | completed | 已同步 frontend 模块文档与 CHANGELOG，准备归档方案包 |

---

## 执行备注

> 默认顺序保持当前后端返回结果，只在点击表头后进入排序态，以避免进程表的初始展示语义回归；为打通前端构建，还顺手把现有 `ServerStatus.cpuCorePercents` 类型从可变数组放宽为只读数组，但不改变任何运行时行为。
