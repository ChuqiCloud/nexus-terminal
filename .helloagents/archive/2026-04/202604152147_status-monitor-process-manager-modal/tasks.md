# 任务清单: status-monitor-process-manager-modal

> **@status:** completed | 2026-04-15 22:12

```yaml
@feature: status-monitor-process-manager-modal
@created: 2026-04-15
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 7 | 0 | 0 | 7 |

---

## 任务列表

### 1. 需求与链路确认

- [√] 1.1 确认时区、运行时间和进程管理应分别挂载到状态轮询链路与 SSH 会话 WebSocket 链路 | depends_on: []

### 2. 后端能力补充

- [√] 2.1 在 `packages/backend/src/services/status-monitor.service.ts` 中新增时区与运行时间采集并扩展状态返回结构 | depends_on: [1.1]
- [√] 2.2 在 `packages/backend/src/websocket/types.ts` 与 `packages/backend/src/websocket/connection.ts` 中新增进程列表和进程信号操作消息 | depends_on: [1.1]

### 3. 前端类型与默认视图

- [√] 3.1 在 `packages/frontend/src/types/server.types.ts` 中补充时区/运行时间/进程相关类型 | depends_on: [2.1, 2.2]
- [√] 3.2 在 `packages/frontend/src/components/StatusMonitor.vue` 中继续收紧默认视图，并新增时区、运行时间和进程概览区 | depends_on: [3.1]

### 4. 独立进程管理页面

- [√] 4.1 新增进程管理 modal 组件，支持搜索、刷新、自动刷新和结束/强制结束操作 | depends_on: [2.2, 3.1]

### 5. 文案、验证与同步

- [√] 5.1 更新中英文状态监控和进程管理文案 | depends_on: [3.2, 4.1]
- [√] 5.2 执行前后端相关构建验证并同步知识库、CHANGELOG、方案包 | depends_on: [2.1, 2.2, 3.2, 4.1, 5.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-15 21:47 | 1.1 | completed | 已确认默认视图和完整进程管理页分层交付，后端需补状态字段与进程 WebSocket 消息 |
| 2026-04-15 21:56 | 2.1 / 2.2 | completed | 后端状态监控已补时区、运行时间、进程摘要，并新增进程列表 / 信号操作 WebSocket handler |
| 2026-04-15 22:02 | 3.1 / 3.2 | completed | 前端状态类型已扩展，默认状态视图已新增时区、运行时间和进程概览入口 |
| 2026-04-15 22:06 | 4.1 | completed | 已新增独立 `ProcessManagerModal.vue`，支持搜索、自动刷新、刷新和结束/强制结束进程 |
| 2026-04-15 22:08 | 5.1 / 5.2 | completed | `packages/backend` 与 `packages/frontend` 构建通过；文案和知识库已同步 |

---

## 执行备注

- 默认视图继续贴近监控小屏，不直接承载完整进程表格
- 完整进程管理通过 modal 打开，避免破坏右侧状态监控的侧栏职责
- 前端构建仍保留仓库既有的 Vite 动态导入与大 chunk 警告，但本次改动未引入新的阻断性错误
