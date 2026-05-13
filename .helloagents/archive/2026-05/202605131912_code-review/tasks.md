# 任务清单: code-review

> **@status:** completed | 2026-05-13 19:26

```yaml
@feature: code-review
@created: 2026-05-13
@status: completed
@mode: R2
```

## LIVE_STATUS
```json
{"status":"completed","completed":5,"failed":0,"pending":0,"total":5,"percent":100,"current":"已归档到 archive/2026-05","updated_at":"2026-05-13 19:26:02","skipped":0,"uncertain":0,"done":5}
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 5 | 0 | 0 | 5 |

---

## 任务列表

### 1. WebSocket 重连状态修复

- [√] 1.1 修改 `packages/frontend/src/composables/useWebSocketConnection.ts`
  - 预期变更: 区分自动重连与手动/外部连接，自动重连延续计数，外部显式连接重置计数；普通 SSH 只在 `ssh:connected` 后清零重连状态，恢复流程继续允许 WebSocket 打开后发送恢复请求。
  - 完成标准: WebSocket 打开但 SSH 握手失败时不会把重连次数清零；重连耗尽后用户再次显式连接能重新获得 3 次机会。
  - 验证方式: 代码审查状态流；运行前端构建。
  - depends_on: []

### 2. 状态条语义与可访问性

- [√] 2.1 修改 `packages/frontend/src/views/WorkspaceView.vue`
  - 预期变更: 区分首次连接和自动重连标签；状态条增加 `role="status"`、`aria-live="polite"`、`aria-atomic="true"` 与合并后的 `aria-label`；为减少动态效果偏好禁用重连圆点动画。
  - 完成标准: 首次连接显示“连接中”，自动重连显示“重连中”；动态状态对辅助技术可感知；减少动态效果时不持续闪动。
  - 验证方式: 构建检查模板类型；代码审查模板和 CSS。
  - depends_on: [1.1]

### 3. 国际化补充

- [√] 3.1 修改 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json`
  - 预期变更: 为 `workspace.statusBar.connecting` 补齐中英日文案。
  - 完成标准: 三套 JSON 可解析；状态条新增键在运行时有效的 `workspace` 对象中。
  - 验证方式: Node 解析 JSON；构建检查 i18n 引用。
  - depends_on: [2.1]

### 4. 归档元数据一致性

- [√] 4.1 修改 `.helloagents/archive/2026-05/202605131759_websocket-reconnect-limit-and-status/proposal.md` 与 `.helloagents/archive/_index.md`
  - 预期变更: 将状态条落点从 `LayoutRenderer.vue` 修正为 `WorkspaceView.vue`；补齐 WebSocket 方案归档索引的类型、模块和决策列。
  - 完成标准: 归档方案与实际代码落点一致；索引可按 frontend 和决策 ID 检索。
  - 验证方式: 搜索 `LayoutRenderer.vue` 残留引用；人工核对索引行。
  - depends_on: []

### 5. 验证与归档

- [√] 5.1 运行验证并归档本 code-review 方案包
  - 预期变更: 运行构建、locale 解析与 diff 检查；更新任务状态并迁移方案包到 archive。
  - 完成标准: 验证通过或明确记录非本次阻断；方案包归档完成。
  - 验证方式: `npm run build --workspace @nexus-terminal/frontend`、Node JSON parse、`git diff --check`。
  - depends_on: [1.1, 2.1, 3.1, 4.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-05-13 19:12 | REVIEW | completed | 完成只读审查，确定默认保守修复方案 |
| 2026-05-13 19:18 | 1.1 | completed | 自动重连计数改为业务连接成功后清零，外部显式连接会重置计数 |
| 2026-05-13 19:20 | 2.1 | completed | 状态条区分连接中/重连中，并补充 aria-live 与减少动态效果兜底 |
| 2026-05-13 19:21 | 3.1 | completed | 中英日状态条补齐 connecting 文案 |
| 2026-05-13 19:22 | 4.1 | completed | 归档方案落点改为 WorkspaceView，并补齐 archive 索引元数据 |
| 2026-05-13 19:25 | 5.1 | completed | 构建、locale JSON 解析、diff 检查均通过 |

---

## 执行备注

- 本方案包由 `~review` 自动创建，默认执行 `selected_plan=conservative`。
- 审查和修复均排除批量凭证相关旁路改动。
