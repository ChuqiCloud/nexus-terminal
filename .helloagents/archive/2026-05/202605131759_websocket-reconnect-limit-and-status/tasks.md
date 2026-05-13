# 任务清单: WebSocket 重连次数限制与前端状态显示

> **@status:** completed | 2026-05-13 18:31

```yaml
@feature: websocket reconnect limit and status
@created: 2026-05-13
@status: completed
@mode: R2
```

## LIVE_STATUS
```json
{"status":"completed","completed":4,"failed":0,"pending":0,"total":4,"percent":100,"current":"已归档到 archive/2026-05","updated_at":"2026-05-13 18:31:35","skipped":0,"uncertain":0,"done":4}
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 共享 WebSocket 重连策略

- [√] 1.1 修改 `packages/frontend/src/composables/useWebSocketConnection.ts`
  - 预期变更: 将自动重连上限改为 3 次，按 10s、30s、30s 显式延迟表排程；避免 `onerror` 与 `onclose` 重复排程；暴露只读 `reconnectState`。
  - 完成标准: 非主动断开最多自动调度 3 次重连；连接成功、主动断开、挂起不重连分支能正确清理状态。
  - 验证方式: 代码审查常量、状态流和去重逻辑；运行前端类型检查。
  - depends_on: []

### 2. 工作区前端状态展示

- [√] 2.1 修改 `packages/frontend/src/views/WorkspaceView.vue`
  - 预期变更: 在工作区顶部为当前活动会话显示共享 WebSocket 连接状态条，展示状态文案、重连次数和等待秒数。
  - 完成标准: `connecting/error/disconnected` 等非稳定状态可见；`connected` 稳定状态不额外占用空间；长文案不撑破布局。
  - 验证方式: 代码审查计算属性和模板显示条件；构建检查模板类型。
  - depends_on: [1.1]

### 3. 国际化文案

- [√] 3.1 修改 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json`
  - 预期变更: 更新 `workspace.status.reconnecting`、`reconnectFailed` 等文案，并新增状态条需要的简短标签。
  - 完成标准: 三个 locale JSON 均语法有效；现有翻译键不被误删。
  - 验证方式: 使用 Node/TypeScript 构建解析 JSON；人工检查关键文案。
  - depends_on: [1.1, 2.1]

### 4. 知识库与验证

- [√] 4.1 同步知识库并运行验证
  - 预期变更: 更新 `.helloagents/modules/frontend.md` 与 `.helloagents/CHANGELOG.md` 中与 WebSocket 重连状态相关的记录；运行 `npm run build --workspace @nexus-terminal/frontend`。
  - 完成标准: 知识库反映代码行为；构建通过或明确记录既有阻塞错误。
  - 验证方式: `npm run build --workspace @nexus-terminal/frontend`；方案包任务状态更新。
  - depends_on: [1.1, 2.1, 3.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-05-13 17:59 | DESIGN | completed | 完成方案设计，确定共享 WebSocket 管理器统一收敛方案 |
| 2026-05-13 18:08 | 1.1 | completed | WebSocket 非主动断开最多重连 3 次，按 10s/30s/30s 排程并暴露 reconnectState |
| 2026-05-13 18:10 | 2.1 | completed | WorkspaceView 增加活动会话连接状态条，重连中展示次数和等待秒数 |
| 2026-05-13 18:12 | 3.1 | completed | 中英日 locale 补齐重连状态和状态条文案 |
| 2026-05-13 18:18 | 4.1 | completed | 前端构建通过，仅保留既有 Vite 分包警告 |

---

## 执行备注

- 用户确认范围为“所有复用 WebSocket 的功能”，执行模式为交互式执行。
- 当前仓库另有未跟踪方案目录 `.helloagents/plan/202605131758_bulk-credential-shortcut/`，本任务不触碰。
