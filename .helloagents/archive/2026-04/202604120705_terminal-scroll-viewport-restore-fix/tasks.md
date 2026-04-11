# 任务清单: terminal-scroll-viewport-restore-fix

> **@status:** completed | 2026-04-12 07:18

```yaml
@feature: terminal-scroll-viewport-restore-fix
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

### 1. 方案与问题定位
- [√] 1.1 创建“终端滚动恢复修复”方案包，并确认问题根因是 `Terminal.vue` 使用绝对 viewport 行号恢复滚动位置 | depends_on: []

### 2. 终端滚动修复
- [√] 2.1 在 `packages/frontend/src/components/Terminal.vue` 中把 viewport 快照改为记录“距底部偏移 + 是否贴底”，修复会话切换后的滚动恢复异常 | depends_on: [1.1]
- [√] 2.2 复核激活切换、`fit()` 与 `ResizeObserver` 路径，确保修复不改变现有贴底策略 | depends_on: [2.1]

### 3. 验证与知识库同步
- [√] 3.1 执行 `packages/frontend` 构建校验，确认本次修改未引入 TypeScript / Vite 构建错误 | depends_on: [2.2]
- [√] 3.2 同步 frontend 模块文档与 `.helloagents/CHANGELOG.md`，记录本次终端滚动修复结果 | depends_on: [3.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-04-12 07:05 | 1.1 | 完成 | 已创建 implementation 方案包，并确认问题集中在 `Terminal.vue` 的 viewport 绝对行号恢复逻辑 |
| 2026-04-12 07:07 | 2.1 | 完成 | 已将 viewport 快照改为记录距底部偏移，并同步更新激活恢复逻辑 |
| 2026-04-12 07:08 | 2.2 | 完成 | 已复核 `fit()`、`ResizeObserver` 与标签激活路径，确认贴底语义未改动 |
| 2026-04-12 07:09 | 3.1 | 完成 | `packages/frontend` 执行 `npm run build` 通过，仅存在既有 dynamic import 与 chunk size 警告 |
| 2026-04-12 07:10 | 3.2 | 完成 | 已同步 frontend 模块文档与 `.helloagents/CHANGELOG.md` |

---

## 执行备注

> 记录执行过程中的重要说明、决策变更、风险提示等

- 本轮仅修复终端切换后的滚动恢复异常，不额外新增“切换服务器后强制跳底”的行为。
- 当前静态验收为 `packages/frontend` 构建通过；运行态仍建议按“持续输出日志 -> 切换服务器 -> 切回后滚轮上/下验证”做一次手工确认。
