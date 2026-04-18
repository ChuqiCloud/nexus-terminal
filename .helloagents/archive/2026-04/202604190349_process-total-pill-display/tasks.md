# 任务清单: process-total-pill-display

> **@status:** completed | 2026-04-19 03:54

```yaml
@feature: process-total-pill-display
@created: 2026-04-19
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 3 | 0 | 0 | 3 |

---

## 任务列表

### 1. frontend 组件调整

- [√] 1.1 在 `packages/frontend/src/components/StatusMonitor.vue` 中把进程总数从摘要列表中拆分出来，并挂到模块标题区域
- [√] 1.2 在 `packages/frontend/src/components/StatusMonitor.vue` 中调整进程摘要区布局，使“运行中 / 休眠中”保持紧凑展示
  - 依赖: 1.1

### 2. 验证

- [√] 2.1 执行前端构建验证，确认 `StatusMonitor.vue` 改动未引入编译错误
  - 依赖: 1.2

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 03:49 | 创建方案包 | 已完成 | `create_package.py` 已生成 proposal/tasks 模板 |
| 2026-04-19 03:58 | 完成组件改动 | 已完成 | `StatusMonitor.vue` 已将总数提升到标题区胶囊，并将摘要区收敛为两项 |
| 2026-04-19 04:00 | 前端构建验证 | 已完成 | `npm --prefix "E:/code/vue/nexus-terminal/packages/frontend" run build` 通过 |

---

## 执行备注

> 本次为局部 UI 优化，目标是减少“进程管理”默认卡片的纵向占用，不改变进程数据来源、刷新机制和 modal 行为。
