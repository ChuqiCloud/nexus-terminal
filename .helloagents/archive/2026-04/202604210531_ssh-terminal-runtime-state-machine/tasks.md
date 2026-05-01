# 任务清单: ssh-terminal-runtime-state-machine

> **@status:** completed | 2026-04-21 05:47

```yaml
@feature: ssh-terminal-runtime-state-machine
@created: 2026-04-21
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 5 | 0 | 0 | 5 |

---

## 任务列表

### 1. 运行态模型重构

- [√] 1.1 在 `packages/frontend/src/stores/session/types.ts` 与 `packages/frontend/src/stores/session/actions/sessionActions.ts` 中引入 SSH 显式运行态字段，并移除旧的主布尔状态入口 | depends_on: []
- [√] 1.2 在 `packages/frontend/src/composables/useSshTerminal.ts` 中收口发送、prompt、断连、错误与中断链路，改为统一状态机转移逻辑 | depends_on: [1.1]

### 2. 标签派生与可见性修复

- [√] 2.1 在 `packages/frontend/src/stores/session/getters.ts` 中改为从 `commandRuntimePhase` 派生活动态，并保持 `TerminalTabBar.vue` 与 `LayoutRenderer.vue` 继续复用现有 `%` 模板显示一致 | depends_on: [1.2]
- [√] 2.2 为极短命令加入最短可见窗口，确保 `%` 不会只闪烁一个渲染帧 | depends_on: [1.2]

### 3. 验证与知识库同步

- [√] 3.1 运行 `npm --workspace @nexus-terminal/frontend run build` 验证前端编译通过，并同步 `.helloagents/modules/frontend.md` 与 `.helloagents/CHANGELOG.md` | depends_on: [2.1, 2.2]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-21 05:31 | 方案包创建 | 完成 | 已创建 `202604210531_ssh-terminal-runtime-state-machine`，准备进入开发实施 |
| 2026-04-21 05:40 | 1.1 / 1.2 | 完成 | 已引入 `commandRuntimePhase` 显式状态，并将发送、prompt、断连、错误与中断链路统一收口到状态转移逻辑 |
| 2026-04-21 05:41 | 2.1 / 2.2 | 完成 | getter 现已从 `commandRuntimePhase` 派生活动态，并为极短命令补上最短可见窗口，保持两层 `%` 继续复用现有模板 |
| 2026-04-21 05:43 | 3.1 | 完成 | `npm --workspace @nexus-terminal/frontend run build` 通过，并同步 `frontend.md` 与 `CHANGELOG.md` |

---

## 执行备注

- 本轮为前端单包修复，不修改 backend WebSocket 协议。
- 历史方案 `202604192106_terminal-running-indicator` 已完成，但现场反馈显示旧布尔模型体感无效，本轮在其基础上做显式状态机收敛。
- 顶部服务器标签与内部终端标签继续保留 `%` 设计，不新增新的运行态 UI 组件。
