# 任务清单: quickcommands-double-click-tooltip

> **@status:** completed | 2026-04-12 07:22

```yaml
@feature: quickcommands-double-click-tooltip
@created: 2026-04-12
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 快捷命令交互改造

- [√] 1.1 在 `packages/frontend/src/views/QuickCommandsView.vue` 中将快捷命令列表项交互改为单击选中、双击执行 | depends_on: []
- [√] 1.2 在 `packages/frontend/src/views/QuickCommandsView.vue` 中为命令项补充完整命令 hover 标签，并确保分组/扁平列表两种渲染路径一致 | depends_on: [1.1]

### 2. 联动验证

- [√] 2.1 检查键盘 `Enter` 与右键菜单“立即执行”链路，确保仍复用原有执行逻辑 | depends_on: [1.2]
- [√] 2.2 执行 `npm run build --workspace @nexus-terminal/frontend`，确认类型检查与构建通过 | depends_on: [2.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-12 07:09 | DESIGN | completed | 已确认只收紧鼠标列表项执行方式，保留键盘 Enter 与右键“立即执行” |
| 2026-04-12 07:10 | 1.1 / 1.2 | 完成 | `QuickCommandsView.vue` 已改为单击选中、双击执行，并为命令项增加完整命令 title |
| 2026-04-12 07:11 | 2.1 | 完成 | 代码检查确认 `executeCommand()`、键盘 Enter 与右键菜单执行链路未改动，仅更换鼠标触发入口 |
| 2026-04-12 07:12 | 2.2 | 完成 | `npm run build --workspace @nexus-terminal/frontend` 通过 |

---

## 执行备注

> 本轮未新增 locale 文案，完整命令提示直接复用浏览器原生 `title` tooltip。该方案满足“hover 查看完整命令”需求，同时避免引入额外浮层状态和主题样式维护成本。
