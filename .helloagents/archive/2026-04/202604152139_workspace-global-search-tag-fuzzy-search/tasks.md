# 任务清单: workspace-global-search-tag-fuzzy-search

> **@status:** completed | 2026-04-15 21:51

```yaml
@feature: workspace-global-search-tag-fuzzy-search
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

- [√] 1.1 确认标签搜索权重策略为“低于名称和主机，高于类型”，并收敛到全局搜索工具与调用组件 | depends_on: []

### 2. 前端实现

- [√] 2.1 在 `packages/frontend/src/utils/connectionSearch.ts` 中为搜索函数增加附加搜索字段能力，并设置标签字段权重 | depends_on: [1.1]
- [√] 2.2 在 `packages/frontend/src/components/GlobalConnectionQuickSearch.vue` 中将连接标签名传入搜索函数，接通按标签模糊搜索 | depends_on: [2.1]

### 3. 验证与知识同步

- [√] 3.1 执行前端构建或等价校验，确认标签加入模糊搜索后未引入新的打包错误 | depends_on: [2.2]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-15 21:39 | DESIGN | completed | 已确认本次为现有全局检索的搜索增强，标签匹配权重低于名称与主机、高于类型 |
| 2026-04-15 21:42 | 2.1-2.2 | completed | 已扩展 `searchConnections()` 的附加搜索字段能力，并在 `GlobalConnectionQuickSearch.vue` 中接通标签名搜索 |
| 2026-04-15 21:44 | 3.1 | completed | `npm --workspace @nexus-terminal/frontend exec vite build` 通过，确认标签搜索接入未引入新的打包错误 |

---

## 执行备注

> 本次只增强“标签参与搜索”，不调整空搜索排序，不扩展到其他连接列表或筛选器。
