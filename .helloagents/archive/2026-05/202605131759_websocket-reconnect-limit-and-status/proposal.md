# 变更提案: WebSocket 重连次数限制与前端状态显示

## 元信息
```yaml
类型: 优化
方案类型: implementation
优先级: P1
状态: 已确定
创建: 2026-05-13
```

---

## 1. 需求

### 背景
当前 `packages/frontend/src/composables/useWebSocketConnection.ts` 已有自动重连逻辑，但最大次数为 5 次，延迟为指数退避（2s/4s/8s/16s/32s），不符合“连接失败不要无限重连，最多三次，第一次 10 秒，第二次 30 秒”的要求。终端、文件管理、Docker 管理、进程管理等功能共用同一个 `wsManager`，因此应优先在共享连接管理器中统一收敛重连策略和状态。

### 目标
- 所有复用 `createWebSocketConnectionManager()` 的前端 WebSocket 功能在非主动断开后最多自动重连 3 次。
- 第 1 次重连等待 10 秒，第 2 次等待 30 秒，第 3 次不再使用指数增长，采用固定的最后一次短退避以完成“最多三次”的完整语义。
- 重连等待中、正在重连、重连耗尽都通过 `connectionStatus` 和 `statusMessage` 暴露到前端。
- 工作区终端区域提供统一、持续可见的连接状态条，让终端、文件管理、Docker、进程管理等依赖同一会话的功能共享可见状态。

### 约束条件
```yaml
时间约束: 无
性能约束: 不新增轮询；仅复用现有响应式状态
兼容性约束: 不改变后端 WebSocket 协议，不改变业务消息结构
业务约束: 用户主动断开或标记挂起时不得触发自动重连
```

### 验收标准
- [ ] WebSocket 非主动断开后最多触发 3 次自动重连，不再出现 5 次指数退避。
- [ ] 第 1 次重连提示等待 10 秒，第 2 次提示等待 30 秒。
- [ ] 重连中状态能在工作区前端持续显示，用户能看到当前第几次、最多几次和等待秒数。
- [ ] 重连次数耗尽后状态变为 `error`，显示明确失败文案，不再继续自动重连。
- [ ] `npm run build --workspace @nexus-terminal/frontend` 至少完成类型检查阶段；若被既有错误阻塞，记录阻塞点。

---

## 2. 方案

### 技术方案
在共享 `createWebSocketConnectionManager()` 中替换重连配置：使用 `MAX_RECONNECT_ATTEMPTS = 3` 和显式延迟表，调度前更新 `statusMessage`。补充只读 `reconnectState`，包含 `attempt`、`maxAttempts`、`nextDelaySeconds`、`isScheduled`，让 UI 不必解析文案。随后在 `WorkspaceView.vue` 的工作区顶部增加紧凑状态条，读取当前活动会话的 `wsManager.connectionStatus/statusMessage/reconnectState` 展示重连状态。同步更新 `zh-CN/en-US/ja-JP` 文案。

### 影响范围
```yaml
涉及模块:
  - frontend: WebSocket 连接管理器、工作区顶部状态条、国际化文案
预计变更文件: 5-7
```

### 风险评估
| 风险 | 等级 | 应对 |
|------|------|------|
| `onerror` 和 `onclose` 可能重复调度重连 | 中 | 保留并强化 `reconnectTimeoutId` 去重，已排程时不重复增加尝试次数 |
| 工作区状态条过度占用终端空间 | 低 | 仅在连接非稳定状态或存在状态文案时显示，使用紧凑一行布局 |
| 第 3 次延迟需求未明确 | 低 | 采用保守固定 30 秒作为第 3 次延迟，避免重新引入指数增长 |

### 方案取舍
```yaml
唯一方案理由: 共享 WebSocket 管理器是终端、文件、Docker、进程等功能的共同依赖，在这里收敛重连策略可以一次覆盖用户选择的范围，并减少各组件重复实现。
放弃的替代路径:
  - 分别修改每个功能组件: 容易漏改，状态文案不一致，后续维护成本高。
  - 后端控制重连次数: 浏览器端 WebSocket 重建由前端发起，后端无法可靠控制前端排程。
  - 新增全局通知弹窗: 容易打断终端操作；本次只需要前端可见状态，不需要侵入式提醒。
回滚边界: 可独立回退 `useWebSocketConnection.ts` 的策略和 `WorkspaceView.vue` 状态条；不涉及后端协议或数据迁移。
```

---

## 3. 技术设计

### 状态模型
```yaml
connectionStatus:
  connecting: 初次连接或重连等待/发起中
  connected: WebSocket/SSH 已可用
  disconnected: 主动断开、正常关闭或挂起不重连
  error: 重连次数耗尽或明确连接错误
reconnectState:
  attempt: 当前自动重连次数
  maxAttempts: 3
  nextDelaySeconds: 下一次重连等待秒数，未排程时为 0
  isScheduled: 是否已有重连定时器
```

### 重连延迟
```yaml
maxAttempts: 3
delays:
  attempt1: 10s
  attempt2: 30s
  attempt3: 30s
```

---

## 4. 核心场景

### 场景: 共享 WebSocket 自动重连
**模块**: frontend  
**条件**: 终端会话已建立，WebSocket 非主动断开且未标记挂起。  
**行为**: 前端进入 `connecting` 状态，按 10s、30s、30s 最多调度 3 次自动重连。  
**结果**: 成功连接后重置计数；失败耗尽后进入 `error`，停止自动重连。

### 场景: 工作区显示重连状态
**模块**: frontend  
**条件**: 当前活动会话的 `wsManager` 处于连接中、错误或存在状态消息。  
**行为**: 工作区顶部显示连接状态和 `statusMessage`，重连等待时显示当前次数、最大次数和等待秒数。  
**结果**: 用户在使用终端、文件管理、Docker 或进程管理时能看到共享连接的重连进度。

---

## 5. 技术决策

### websocket-reconnect-limit-and-status#D001: 在共享 WebSocket 管理器中统一限制重连
**日期**: 2026-05-13  
**状态**: ✅采纳  
**背景**: 多个前端功能复用同一 `wsManager`，重连策略散落会导致次数、延迟和提示不一致。  
**选项分析**:
| 选项 | 优点 | 缺点 |
|------|------|------|
| A: 修改共享 `createWebSocketConnectionManager()` | 一处覆盖所有复用 WebSocket 功能，状态统一 | 需要确认 UI 读取状态不会破坏现有组件 |
| B: 各业务组件自行限制重连 | 可按组件定制 | 容易漏改，用户看到的状态不一致 |
| C: 后端控制重连 | 前端改动少 | 浏览器重连排程不由后端控制，不可靠 |
**决策**: 选择方案 A。  
**理由**: 该路径与现有架构边界一致，能满足“所有复用 WebSocket 的功能”范围，且不改变协议。  
**影响**: 前端所有通过 `createWebSocketConnectionManager()` 创建的 SSH/WebSocket 会话。

---

## 6. 验证策略

```yaml
verifyMode: review-first
reviewerFocus:
  - packages/frontend/src/composables/useWebSocketConnection.ts 的重连去重、计数重置和主动断开分支
  - packages/frontend/src/views/WorkspaceView.vue 的状态条显示条件和响应式读取
testerFocus:
  - npm run build --workspace @nexus-terminal/frontend
  - 检查重连延迟配置为 10/30/30 秒且最大次数为 3
  - 检查 locale JSON 语法有效
uiValidation: optional
riskBoundary:
  - 不修改后端协议
  - 不改变用户主动断开和挂起会话的行为
```

---

## 7. 成果设计

### 设计方向
- **美学基调**: 工业实用型状态仪表，遵循现有工作区深色/浅色主题变量，强调清晰状态而不是装饰。
- **记忆点**: 工作区顶部出现一条紧凑的连接状态条，用脉冲圆点和短句显示“第 N/3 次重连，等待 X 秒”。
- **参考**: 项目现有 `TerminalTabBar.vue`、`DockerManager.vue` 状态提示风格。

### 视觉要素
- **配色**: 复用主题变量；连接中使用黄/琥珀提示，错误使用红色，成功不显示额外条。
- **字体**: 复用项目既有字体栈，不引入新字体。
- **布局**: 位于 `TerminalTabBar` 下方，单行紧凑展示，避免遮挡终端内容。
- **动效**: 连接中圆点使用已有 `animate-pulse` 语义，错误态静止。
- **氛围**: 无额外背景装饰，仅使用半透明主题背景和细边界。

### 技术约束
- **可访问性**: 状态文本必须可读；图标仅作辅助。
- **响应式**: 文案允许截断，但核心次数和状态保留在 `title` 中。
