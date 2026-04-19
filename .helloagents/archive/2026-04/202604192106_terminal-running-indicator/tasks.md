# 任务清单: terminal-running-indicator

> **@status:** completed | 2026-04-19 21:31

```yaml
@feature: terminal-running-indicator
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

### 1. 运行态链路补齐

- [√] 1.1 在 `packages/frontend/src/stores/session/types.ts` 与 `packages/frontend/src/stores/session/actions/sessionActions.ts` 中为 SSH 会话补充命令运行态与终端输入缓存字段，并完成新会话初始化 | depends_on: []
- [√] 1.2 在 `packages/frontend/src/stores/session/getters.ts` 与 `packages/frontend/src/composables/useSshTerminal.ts` 中接入“发送非空命令置位、prompt/中断/断连清除”的派生逻辑 | depends_on: [1.1]

### 2. 标签 UI 展示

- [√] 2.1 在 `packages/frontend/src/components/TerminalTabBar.vue` 中为 SSH 顶部服务器标签补充按连接聚合的 `%` 运行中提示 | depends_on: [1.2]
- [√] 2.2 在 `packages/frontend/src/components/LayoutRenderer.vue` 中为当前服务器内部终端标签补充逐终端 `%` 运行中提示 | depends_on: [1.2]
- [√] 2.3 在 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json` 与 `packages/frontend/src/locales/ja-JP.json` 中补充运行态 tooltip 文案 | depends_on: [2.1, 2.2]

### 3. 验证与同步

- [√] 3.1 运行 `npm --workspace @nexus-terminal/frontend run build` 验证编译通过，并同步知识库与方案状态 | depends_on: [2.3]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 21:06 | 方案包创建 | 完成 | 已创建 `202604192106_terminal-running-indicator`，按 R2 流程进入开发实施 |
| 2026-04-19 21:19 | 1.1 / 1.2 | 完成 | 已为 SSH 会话补充 `isCommandRunning` 与 `terminalInputBuffer`，并在 `useSshTerminal.ts` 中接入发送置位、prompt/中断/断连清除逻辑 |
| 2026-04-19 21:23 | 2.1 / 2.2 / 2.3 | 完成 | 顶部服务器标签与服务器内终端标签已显示 `%` 运行态提示，并补齐中英日 tooltip 文案 |
| 2026-04-19 21:30 | 3.1 | 完成 | `npm --workspace @nexus-terminal/frontend run build` 通过，并同步 `frontend.md` 与 `CHANGELOG.md` |

---

## 执行备注

- 本轮范围限制在 `packages/frontend`，不改 backend WebSocket 协议与 SSH session 模型。
- 运行态以前端派生值为准，允许在无法识别 prompt 的极少数 shell 场景中退化为“中断/新输入/断连清除”。
- 顶部服务器标签只做按连接聚合展示，内部终端标签负责表达具体哪一个终端仍在运行。
- 方案设计时预估会在 `WorkspaceView.vue` 接入运行态，但最终为了覆盖文件管理器等直接调用 `terminalManager.sendData()` 的链路，将输入跟踪统一收口到了 `useSshTerminal.ts`。
