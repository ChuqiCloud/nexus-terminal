# 任务清单: status-monitor-cpu-total-and-per-core

> **@status:** completed | 2026-04-19 04:08

```yaml
@feature: status-monitor-cpu-total-and-per-core
@created: 2026-04-19
@status: completed
@mode: R3
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 6 | 0 | 0 | 6 |

---

## 任务列表

### 1. 后端 CPU 状态扩展

- [√] 1.1 在 `packages/backend/src/services/status-monitor.service.ts` 中扩展 `/proc/stat` 解析，计算每核心 CPU 百分比并写入状态 payload | depends_on: []
- [√] 1.2 运行 `@nexus-terminal/backend` 构建校验，确认每核心 CPU 字段扩展未破坏现有服务端类型与编译 | depends_on: [1.1]

### 2. 前端 CPU 卡片重构

- [√] 2.1 在 `packages/frontend/src/types/server.types.ts` 与 `packages/frontend/src/composables/useStatusMonitor.ts` 中接入每核心 CPU 状态字段 | depends_on: [1.1]
- [√] 2.2 新增 `packages/frontend/src/components/StatusMonitorCpuHistoryChart.vue`，显示总 CPU canvas 历史图 | depends_on: [2.1]
- [√] 2.3 在 `packages/frontend/src/components/StatusMonitor.vue` 中将 CPU 卡片改为“总历史图 + 每核心实时条卡”布局 | depends_on: [2.2]
- [√] 2.4 在 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json` 中补充 CPU 历史与核心标签文案，并运行 `@nexus-terminal/frontend` 构建校验 | depends_on: [2.3]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-19 03:57 | design | completed | 已创建 implementation 方案包，范围锁定为总 CPU 历史图与每核心实时条卡的前后端联动实现 |
| 2026-04-19 04:00 | 1.1 | completed | 已扩展 `/proc/stat` 解析为总 CPU + `cpuN` 每核心快照，并将 `cpuCorePercents` 一并写入状态 payload |
| 2026-04-19 04:01 | 1.2 | completed | `npm --workspace @nexus-terminal/backend run build` 通过 |
| 2026-04-19 04:02 | 2.1 | completed | 已在前端状态类型与状态监控 composable 中接入 `cpuCorePercents` 并做数组归一化 |
| 2026-04-19 04:03 | 2.2 | completed | 已新增 `StatusMonitorCpuHistoryChart.vue`，用 canvas 展示最近 24 个总 CPU 历史采样点 |
| 2026-04-19 04:04 | 2.3 | completed | 已将 CPU 卡片改为“总历史图 + 每核心实时条卡”布局，并在极窄宽度下切换为单列 |
| 2026-04-19 04:06 | 2.4 | completed | 已补充中英日 CPU 文案；`npm --workspace @nexus-terminal/frontend run build` 通过，并额外确认 `npm --workspace @nexus-terminal/frontend run preview -- --host 127.0.0.1 --port 4173` 可返回 HTTP 200 |

---

## 执行备注

> 记录执行过程中的重要说明、决策变更、风险提示等

- 本轮选择方案 A：保留总 CPU 历史图，但每核心仅展示当前实时值，不额外缓存每核心历史数组。
- CPU 差值计算中的空闲时间按 `idle + iowait` 处理，避免高负载判断偏高。
- 运行态限制: 已确认前端预览服务能正常启动并返回首页，但未在本地接入真实活动 SSH 会话，因此“带真实 CPU 数据的分核条卡与 tooltip 最终观感”仍建议在你的 `/workspace` 环境手动看一遍。
