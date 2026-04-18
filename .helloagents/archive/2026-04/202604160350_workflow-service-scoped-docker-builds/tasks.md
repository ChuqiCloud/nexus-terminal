# 任务清单: workflow-service-scoped-docker-builds

> **@status:** completed | 2026-04-16 04:02

```yaml
@feature: workflow-service-scoped-docker-builds
@created: 2026-04-16
@status: completed
@mode: R2
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 方案设计

- [√] 1.1 收敛 GitHub Actions 路径触发规则，确认共享根文件改动时全量构建，单服务目录改动时只构建对应服务 | depends_on: []

### 2. Workflow 实现

- [√] 2.1 在 `.github/workflows/docker-publish.yml` 中增加路径变更检测作业，并定义 `shared/frontend/backend/remote-gateway` 过滤器 | depends_on: [1.1]
- [√] 2.2 在同一 workflow 中按矩阵服务与检测结果添加 job 级执行条件，只构建受影响镜像 | depends_on: [2.1]

### 3. 验证与知识同步

- [√] 3.1 验证 workflow YAML 结构与关键触发规则，确认不会再对无关改动执行三个镜像完整构建 | depends_on: [2.2]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-16 03:50 | DESIGN | completed | 已确认当前仓只有 `docker-publish.yml` 一个镜像发布 workflow，本次按路径检测 + 条件矩阵优化 |
| 2026-04-16 03:55 | 2.1-2.2 | completed | 已新增 `detect-changes` 作业，按共享根文件与各服务目录生成动态构建矩阵 |
| 2026-04-16 03:58 | 3.1 | completed | 已完成 workflow 结构复核；本机缺少 YAML 解析库，未做真正语法解析，但手工检查确认手动触发、共享改动和单服务改动三条路径均已覆盖 |

---

## 执行备注

> 本次范围仅限 GitHub Actions 镜像发布链路，不调整 Dockerfile、包构建脚本或 compose 编排本身。
>
> 本机缺少 `PyYAML` 与 `ruby`，因此本轮未执行本地 YAML 解析器校验；当前验证基于 workflow 成品审阅与触发路径逻辑复核。
