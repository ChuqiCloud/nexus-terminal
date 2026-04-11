# 任务清单: ssh-group-close-and-script-input-sanitize

> **@status:** completed | 2026-04-12 07:09

```yaml
@feature: ssh-group-close-and-script-input-sanitize
@created: 2026-04-12
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 5 | 0 | 0 | 5 |

---

## 任务列表

### 1. 方案与边界确认

- [√] 1.1 创建“SSH 组头整组关闭 + 脚本值引号清洗”实施方案包，并确认沿用现有前端关闭链路与解析链路 | depends_on: []

### 2. 终端组头整组关闭

- [√] 2.1 在 `packages/frontend/src/components/TerminalTabBar.vue` 中为 SSH 服务器组头加入关闭整组终端的 `X` 按钮，并处理 hover/冒泡细节 | depends_on: [1.1]
- [√] 2.2 补充组头关闭入口所需的 locale 文案，确保 tooltip 语义明确 | depends_on: [2.1]

### 3. 脚本模式值清洗

- [√] 3.1 在 `packages/frontend/src/composables/useAddConnectionForm.ts` 中扩展脚本参数切分与值解析，支持单引号包裹值并统一去掉外层成对引号 | depends_on: [1.1]

### 4. 验证与同步

- [√] 4.1 执行 `packages/frontend` 构建验证，并同步 `.helloagents` 知识库与 CHANGELOG 记录本次落地结果 | depends_on: [2.2, 3.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-12 06:56 | 1.1 | 完成 | 已创建 implementation 方案包，并确认“组头关闭复用现有 session:close 链路 + 脚本值统一去外层引号”方向 |
| 2026-04-12 07:01 | 2.1 / 2.2 | 完成 | 已为 SSH 服务器组头补充整组关闭按钮，并同步中英日 tooltip 文案 |
| 2026-04-12 07:02 | 3.1 | 完成 | 脚本模式参数切分已支持单引号/双引号包裹值，`'$Moka1998A'` 可解析为 `$Moka1998A` |
| 2026-04-12 07:03 | 4.1 | 完成 | `packages/frontend` 构建通过，并完成登录页浏览器冒烟；组头 X 的完整交互仍需已登录且存在 SSH 会话的运行态确认 |

---

## 执行备注

> 记录执行过程中的重要说明、决策变更、风险提示等

- 本轮只做前端交互与解析层增强，不改后端接口。
- 服务器组头关闭按钮按用户选择采用“直接关闭，不再二次确认”。
