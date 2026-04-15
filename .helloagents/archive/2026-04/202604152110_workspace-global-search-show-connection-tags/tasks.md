# 任务清单: workspace-global-search-show-connection-tags

> **@status:** completed | 2026-04-15 21:34

```yaml
@feature: workspace-global-search-show-connection-tags
@created: 2026-04-15
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 方案设计

- [√] 1.1 完成全局服务器检索入口定位，确认实际组件为 `packages/frontend/src/components/GlobalConnectionQuickSearch.vue` | depends_on: []

### 2. 前端实现

- [√] 2.1 在 `packages/frontend/src/components/GlobalConnectionQuickSearch.vue` 中接入 `tags.store.ts`，建立标签名称映射并为结果项提供标签数据 | depends_on: [1.1]
- [√] 2.2 在 `packages/frontend/src/components/GlobalConnectionQuickSearch.vue` 中为搜索结果卡片增加标签 chips 展示，并保持现有信息布局稳定 | depends_on: [2.1]

### 3. 验证与知识同步

- [√] 3.1 执行前端构建或等价校验，确认全局服务器检索标签展示改动未引入编译错误 | depends_on: [2.2]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-15 21:10 | DESIGN | completed | 已确认“全局服务器检索”实际入口为 `GlobalConnectionQuickSearch.vue`，并收敛为单组件展示增强 |
| 2026-04-15 21:15 | 2.1-2.2 | completed | 已在 `GlobalConnectionQuickSearch.vue` 内接入 `tags.store.ts` 并为结果卡片新增标签 chips |
| 2026-04-15 21:19 | 3.1 | completed | `npm --workspace @nexus-terminal/frontend run build` 被仓库现有 `StatusMonitor.vue` 类型错误阻断；`npm --workspace @nexus-terminal/frontend exec vite build` 通过，确认本次组件改动可正常打包 |

---

## 执行备注

> 本次范围限定为“全局服务器检索”弹层，不扩展到 `WorkspaceConnectionList.vue` 或其他连接列表入口。若后续需要统一所有搜索/列表入口的标签展示，再单独起方案包处理。
>
> 当前仓库存在与本次改动无关的前端类型问题：`packages/frontend/src/components/StatusMonitor.vue` 缺少若干模板引用属性定义，导致全量 `vue-tsc --noEmit` 失败。
