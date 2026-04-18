# 任务清单: connection-password-visibility-toggle

> **@status:** completed | 2026-04-19 02:08

```yaml
@feature: connection-password-visibility-toggle
@created: 2026-04-19
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 前端表单实现

- [√] 1.1 在 `packages/frontend/src/components/AddConnectionFormAuth.vue` 中为直填 SSH / RDP / VNC 密码输入增加本地显隐切换 | depends_on: []
- [√] 1.2 在 `packages/frontend/src/components/LoginCredentialManagementModal.vue` 中为登录凭证密码输入增加同样的显隐切换与重置逻辑 | depends_on: [1.1]

### 2. 文案与验证

- [√] 2.1 在 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json` 中补充显隐密码文案 | depends_on: [1.1]
- [√] 2.2 运行 `packages/frontend` 构建校验并记录结果 | depends_on: [1.2, 2.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 02:03 | design | completed | 已创建 implementation 方案包，范围锁定为连接新增/编辑表单与登录凭证管理弹窗的密码显隐切换 |
| 2026-04-19 02:06 | 1.1 | completed | 已为连接表单中的 SSH、RDP、VNC 直填密码输入增加显隐切换按钮与本地显示状态 |
| 2026-04-19 02:07 | 1.2 | completed | 已为登录凭证管理弹窗中的密码输入增加显隐切换，并在表单重置/切换时恢复默认隐藏 |
| 2026-04-19 02:07 | 2.1 | completed | 已补充连接表单显隐密码按钮的中英日文案 |
| 2026-04-19 02:08 | 2.2 | completed | `npm --workspace @nexus-terminal/frontend run build` 通过，仅保留既有 chunk size 警告 |

---

## 执行备注

> 记录执行过程中的重要说明、决策变更、风险提示等

- 仓库中存在历史遗留的未完成方案包 `202603252311_terminal-group-and-broadcast-dedupe`，其备注指向 `ConnectionsView.vue duplicate attribute` 既有验证问题；若本轮构建再次命中，按既有问题记录，不视为本次功能回归。
- 运行态补充验证: 已启动 `vite` 前端并通过 Playwright 访问到 `http://127.0.0.1:4173/login`；但本地 `localhost:3001` 后端未运行，浏览器端出现代理拒绝连接，无法自动进入登录后的连接管理页，因此“点击小眼睛切换明文”仍建议在你的已登录环境手动确认一次。
