# 变更提案: workflow-service-scoped-docker-builds

## 元信息
```yaml
类型: 优化
方案类型: implementation
优先级: P1
状态: 草稿
创建: 2026-04-16
```

---

## 1. 需求

### 背景
当前仓库只有一个镜像发布 workflow [`docker-publish.yml`](../../../../.github/workflows/docker-publish.yml)。它在 `main` 分支每次 push 时都会构建并推送 `frontend`、`backend`、`remote-gateway` 三个镜像，即使本次提交只修改了单个服务目录或仅是文档类改动，也会触发完整构建，导致 GitHub Actions 耗时和资源浪费。

### 目标
- 仅在受影响的服务发生改动时构建对应镜像。
- 根目录共享构建文件发生改动时，仍然允许三个服务全量构建。
- 文档、知识库等与镜像构建无关的改动不再触发完整镜像构建。

### 约束条件
```yaml
时间约束: 本轮内完成 workflow 改造与语法级验证
性能约束: 检测逻辑应先于 Docker 构建执行，避免无意义 buildx 初始化
兼容性约束: 保留 push main 与 workflow_dispatch 两种触发方式
业务约束: 根目录共享构建文件改动时仍需构建全部服务
```

### 验收标准
- [ ] 仅改动 `packages/frontend/**` 时，只触发 frontend 镜像构建。
- [ ] 仅改动 `packages/backend/**` 或 `packages/remote-gateway/**` 时，只触发对应服务镜像构建。
- [ ] 改动根目录共享构建文件时，三个服务镜像都继续构建。
- [ ] 仅改动 `.helloagents/`、README 等非构建相关文件时，不再执行三个镜像的完整构建。

---

## 2. 方案

### 技术方案
在现有 workflow 前增加一个 `detect-changes` 作业，使用 `dorny/paths-filter` 识别本次 push 涉及的路径范围，输出 `shared`、`frontend`、`backend`、`remote-gateway` 四类布尔结果。发布作业保留矩阵结构，但在 job 级根据矩阵服务名和变更输出决定是否执行，从而只让受影响的服务进入 Docker Buildx / login / build-push 流程。

### 影响范围
```yaml
涉及模块:
  - workspace-root: GitHub Actions 镜像发布链路按路径分流
  - knowledge-base: 记录本次 CI 发布策略优化
预计变更文件: 4
```

### 风险评估
| 风险 | 等级 | 应对 |
|------|------|------|
| 共享路径定义过窄，导致实际需要全量构建的改动被漏掉 | 中 | 将根 `package.json`、`package-lock.json`、`docker-compose.yml`、`patches/**`、workflow 自身纳入 shared |
| 共享路径定义过宽，仍然频繁触发全量构建 | 中 | 不把 README、`.helloagents/**`、普通文档纳入 shared |
| push 事件比较范围获取不完整，导致变更检测失真 | 低 | checkout 使用 `fetch-depth: 0`，保证路径过滤能对比完整提交范围 |

---

## 3. 技术设计（可选）

> 本次不涉及 API 或数据模型变更，N/A。

---

## 4. 核心场景

### 场景: 单服务目录改动
**模块**: workspace-root
**条件**: 用户仅修改某个 `packages/<service>/` 目录
**行为**: workflow 只执行对应矩阵服务的镜像构建
**结果**: GitHub Actions 不再全量构建三个服务

### 场景: 共享构建文件改动
**模块**: workspace-root
**条件**: 用户修改根 `package.json`、`package-lock.json`、`patches/**`、`docker-compose.yml` 或 workflow 文件
**行为**: workflow 将三个服务都视为受影响并全量构建
**结果**: 共享依赖或发布逻辑变化不会漏掉任何镜像

### 场景: 非构建相关文件改动
**模块**: workspace-root
**条件**: 用户仅修改 `.helloagents/**`、README 或其他未纳入过滤器的文件
**行为**: 检测作业完成后，所有矩阵发布 job 都被跳过
**结果**: Action 不再为纯文档或知识同步改动浪费镜像构建资源

---

## 5. 技术决策

### workflow-service-scoped-docker-builds#D001: 采用路径过滤 + 条件矩阵，而不是拆成三个独立 workflow
**日期**: 2026-04-16
**状态**: ✅采纳
**背景**: 需求是“按改动范围只编译受影响部分”，同时保持现有发布链路清晰可维护。
**选项分析**:
| 选项 | 优点 | 缺点 |
|------|------|------|
| A: 拆成三个独立 workflow | 服务边界最清楚 | 文件更多、重复配置多、共享规则难统一 |
| B: 保留一个 workflow，前置路径检测后按矩阵条件执行 | 结构集中、改动最小、共享规则统一维护 | 需要多一个检测 job |
**决策**: 选择方案 B
**理由**: 当前仓只有一个发布 workflow，直接在现有矩阵上增加路径检测成本最低，也更符合“局部优化而非重写发布链路”的目标。
**影响**: workspace-root

---

## 6. 成果设计

### 设计方向
- **美学基调**: N/A
- **记忆点**: N/A
- **参考**: N/A

### 视觉要素
- **配色**: N/A
- **字体**: N/A
- **布局**: N/A
- **动效**: N/A
- **氛围**: N/A

### 技术约束
- **可访问性**: N/A
- **响应式**: N/A
