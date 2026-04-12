# 任务清单: connections-tag-batch-management

> **@status:** completed | 2026-04-12 23:03

```yaml
@feature: connections-tag-batch-management
@created: 2026-04-12
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 6 | 0 | 0 | 6 |

---

## 任务列表

### 1. 方案与数据流确认

- [√] 1.1 创建并验证 `connections-tag-batch-management` 方案包，明确批量标签删除策略与接口契约 | depends_on: []

### 2. 后端标签批量处理

- [√] 2.1 在 `packages/backend/src/tags/tag.repository.ts` 中实现批量删除标签事务，支持“仅删标签”与“标签+连接一起删”两种策略，并返回摘要 | depends_on: [1.1]
- [√] 2.2 在 `packages/backend/src/tags/tag.service.ts`、`packages/backend/src/tags/tags.controller.ts`、`packages/backend/src/tags/tags.routes.ts` 中暴露批量删除接口并补齐参数校验 | depends_on: [2.1]

### 3. 前端连接页标签管理

- [√] 3.1 新增连接页标签管理弹窗组件，在 `packages/frontend/src/views/ConnectionsView.vue` 接入顶部入口与删除后范围刷新逻辑 | depends_on: [1.1]
- [√] 3.2 扩展 `packages/frontend/src/stores/tags.store.ts`，支持批量删除标签并联动刷新标签/连接缓存 | depends_on: [2.2, 3.1]
- [√] 3.3 补齐 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json` 的新文案 | depends_on: [3.1]

### 4. 验证与知识库同步

- [√] 4.1 运行可用构建验证，修正编译问题并同步 `.helloagents` 文档/变更记录 | depends_on: [2.2, 3.2, 3.3]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-12 22:48 | 1.1 | 完成 | 已创建 implementation 方案包，并通过 `validate_package.py` 校验 |
| 2026-04-12 22:52 | 2.1 / 2.2 | 完成 | 后端新增 `/api/v1/tags/bulk-delete`，并将单标签删除复用到同一事务逻辑 |
| 2026-04-12 22:55 | 3.1 / 3.2 / 3.3 | 完成 | 连接页已接入标签管理弹窗、批量删除策略开关与中英日文案 |
| 2026-04-12 22:58 | 4.1 | 完成 | `npm --prefix packages/backend run build` 与 `npm --prefix packages/frontend run build` 通过；本地浏览器预览因后端未启动仅完成挂载检查 |

---

## 执行备注

> 记录执行过程中的重要说明、决策变更、风险提示等

- 本轮优先覆盖用户明确提出的批量标签处理与删除策略，不额外扩展标签重命名批量能力。
- “删除关联服务器”按标签命中的唯一连接集合执行，避免多标签重叠时重复删除。
- Playwright 仅完成本地前端预览挂载检查；由于 `vite preview` 代理的 `/api/v1/*` 在当前环境下连接被拒绝，未能继续验证登录后的 `/connections` 实际交互。
