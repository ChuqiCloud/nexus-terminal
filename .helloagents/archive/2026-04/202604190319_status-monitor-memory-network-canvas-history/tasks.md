# 任务清单: status-monitor-memory-network-canvas-history

> **@status:** completed | 2026-04-19 03:32

```yaml
@feature: status-monitor-memory-network-canvas-history
@created: 2026-04-19
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 5 | 0 | 0 | 5 |

---

## 任务列表

### 1. 状态监控卡片实现

- [√] 1.1 在 `packages/frontend/src/components/StatusMonitor.vue` 中把内存卡片的横向布局阈值调整为低于 250px 才切竖排 | depends_on: []
- [√] 1.2 新增 `packages/frontend/src/components/StatusMonitorNetworkHistoryChart.vue`，用 canvas 折线图展示最近 24 个网络历史采样点并支持 hover 查看值 | depends_on: [1.1]
- [√] 1.3 在 `packages/frontend/src/components/StatusMonitor.vue` 中接入网络历史图组件，并让网络模块在 250px 以下才切竖排 | depends_on: [1.2]

### 2. 文案与验证

- [√] 2.1 在 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json` 中补充网络历史采样提示文案 | depends_on: [1.3]
- [√] 2.2 运行 `packages/frontend` 构建校验并记录结果 | depends_on: [2.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 03:20 | design | completed | 已创建 implementation 方案包，范围锁定为状态监控内存/网络卡片的 250px 响应式阈值与网络 canvas 历史图 |
| 2026-04-19 03:26 | 1.1 | completed | 已将内存卡片默认布局改为高密度横排，仅在容器宽度低于 250px 时切竖排 |
| 2026-04-19 03:29 | 1.2 | completed | 已新增网络历史图子组件，复用 Chart.js canvas 展示最近 24 个采样点并支持 hover 查看上下行值 |
| 2026-04-19 03:31 | 1.3 | completed | 已在 StatusMonitor 中接入网络历史图，并让网络模块与内存模块共用 250px 竖排阈值 |
| 2026-04-19 03:32 | 2.1 | completed | 已补充中英日三套“最近历史采样点”文案 |
| 2026-04-19 03:33 | 2.2 | completed | `npm --workspace @nexus-terminal/frontend run build` 通过，仅保留既有 chunk 警告 |

---

## 执行备注

> 记录执行过程中的重要说明、决策变更、风险提示等

- 当前需求只涉及前端卡片布局与图表渲染，现有 websocket 历史采样数据链路保持不变。
- 运行态限制: 本轮未拉起完整登录后工作区环境，因此“hover 查看网络历史值”的最终交互仍建议在你的实际 `/workspace` 环境手动确认一次。
