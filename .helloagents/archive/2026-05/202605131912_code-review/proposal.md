# 变更提案: code-review

## 元信息
```yaml
类型: 修复
方案类型: implementation
优先级: P1
状态: 已确定
创建: 2026-05-13
```

---

## 1. 审查范围

本次 `~review` 仅审查 WebSocket 重连限制与前端状态显示相关改动，排除此前已存在的批量凭证相关改动。

```yaml
审查文件:
  - packages/frontend/src/composables/useWebSocketConnection.ts
  - packages/frontend/src/views/WorkspaceView.vue
  - packages/frontend/src/locales/zh-CN.json
  - packages/frontend/src/locales/en-US.json
  - packages/frontend/src/locales/ja-JP.json
  - .helloagents/archive/2026-05/202605131759_websocket-reconnect-limit-and-status/
  - .helloagents/archive/_index.md
  - .helloagents/CHANGELOG.md
  - .helloagents/INDEX.md
  - .helloagents/modules/frontend.md
排除文件:
  - packages/frontend/src/views/ConnectionsView.vue
  - packages/frontend/src/components/BatchCredentialShortcutModal.vue
  - .helloagents/archive/2026-05/202605131758_bulk-credential-shortcut/
```

---

## 2. 审查结果摘要

### high
- `packages/frontend/src/composables/useWebSocketConnection.ts`: `resetReconnectState()` 在 WebSocket `onopen` 时立即清零重连次数。普通 SSH 会话此时还未收到 `ssh:connected`，如果后端先接受 WebSocket 后在 SSH 握手前关闭连接，每轮都会重新从第 1 次开始，仍可能无限重连。

### medium
- `packages/frontend/src/composables/useWebSocketConnection.ts`: `connect(url)` 没有区分手动/外部连接与自动排程重连。重连耗尽后外部显式重连可能继续显示第 3/3 次，并且不重新获得 3 次自动重连机会。
- `packages/frontend/src/views/WorkspaceView.vue`: 所有 `connecting` 状态都显示为“重连中”，首次连接时标签与详情文案语义冲突。
- `packages/frontend/src/views/WorkspaceView.vue`: 状态条缺少 `role="status"`、`aria-live` 和 `aria-atomic`，屏幕阅读器用户无法稳定感知动态重连反馈。
- `packages/frontend/src/locales/*.json`: 三套 locale 文件存在重复顶层 `workspace` 键，当前新增文案写在运行时有效对象中，但重复结构会让后续维护者容易写到无效对象。

### low
- `packages/frontend/src/views/WorkspaceView.vue`: 重连圆点动画缺少 `prefers-reduced-motion` 兜底。
- `packages/frontend/src/composables/useWebSocketConnection.ts`: 挂起不重连分支注释已过时。
- `.helloagents/archive/2026-05/202605131759_websocket-reconnect-limit-and-status/proposal.md`: 方案包仍写 `LayoutRenderer.vue`，实际落点是 `WorkspaceView.vue`。
- `.helloagents/archive/_index.md`: WebSocket 方案归档索引行未补齐类型、模块与决策。
- `.helloagents/modules/frontend.md`: 本次清理行尾空格造成知识库 diff 扩大；后续同步应尽量保持局部 patch。

---

## 3. 修复方案

### conservative_plan

默认执行保守方案，修复阻断需求和直接相关的可访问性/文档一致性问题：

- 将自动重连执行入口与手动/外部连接入口区分开。自动排程使用内部 `connect(url, { retry: true })` 延续计数；手动或外部调用 `connect(url)` 会重置自动重连计数，重新获得 3 次机会。
- 普通 SSH 连接只在收到 `ssh:connected` 后清零重连计数；恢复会话保留 WebSocket 打开后可发送恢复请求的行为，并在后端随后发送的 `ssh:connected` 上清零。
- 工作区状态条区分“连接中”和“重连中”，并补充状态区域的 ARIA 语义与减少动态效果偏好。
- 增补 `workspace.statusBar.connecting` 的中英日文案。
- 修正本次归档方案包中 `LayoutRenderer.vue` 的错误落点描述，并补齐归档索引元数据。

### aggressive_plan

备选方案，不默认执行：

- 重构 locale 文件，合并重复顶层 `workspace` 对象，消除重复键风险。
- 将 `connect()` 拆成明确的公开 `connect()` 与私有 `runScheduledReconnect()`，并为 WebSocket 传输层状态与 SSH 业务层状态建立更细分的状态模型。
- 补充自动化单元测试或模拟 WebSocket 状态机测试，覆盖 `onopen` 后 SSH 握手失败、恢复流程成功、手动重连和重连耗尽后再手动连接等场景。

### selected_plan

conservative

### 方案取舍

保守方案直接修复“最多三次”失效的根因，并提升状态条语义准确性和可访问性，不改变后端协议、不重构 locale 结构、不触碰旁路批量凭证改动。激进方案涉及更大范围的 i18n 结构整理和测试基建扩展，风险与范围不适合作为本次默认修复。

---

## 4. 验证策略

```yaml
verifyMode: fix-and-build
testerFocus:
  - npm run build --workspace @nexus-terminal/frontend
  - node 解析 zh-CN/en-US/ja-JP locale JSON
  - git diff --check
  - 代码审查确认 resetReconnectState 不再发生在普通 WebSocket onopen
riskBoundary:
  - 不修改后端 WebSocket 协议
  - 不修改批量凭证相关文件
  - 不合并重复 workspace locale 对象
```
