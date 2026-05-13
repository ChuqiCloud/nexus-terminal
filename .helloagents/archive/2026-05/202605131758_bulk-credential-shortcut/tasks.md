# 任务清单: bulk credential shortcut

> **@status:** completed | 2026-05-13 18:18

```yaml
@feature: bulk credential shortcut
@created: 2026-05-13
@status: completed
@mode: R2
```

## LIVE_STATUS
```json
{"status":"completed","completed":4,"failed":0,"pending":0,"total":4,"percent":100,"current":"已归档到 archive/2026-05","updated_at":"2026-05-13 18:18:19","skipped":0,"uncertain":0,"done":4}
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 前端快捷入口

- [√] 1.1 修改 `packages/frontend/src/views/ConnectionsView.vue`
  - 预期变更: 在批量工具条增加“更改凭证”按钮、快捷凭证弹层、同类型凭证过滤和批量提交逻辑。
  - 完成标准: 选中连接后可直接选择已保存凭证或清空凭证，并批量更新 `login_credential_id`。
  - 验证方式: 代码检查 + 前端构建。
  - depends_on: []

### 2. 多语言文案

- [√] 2.1 修改 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json`
  - 预期变更: 补充快捷更改凭证弹层、按钮、提示、成功/失败文案。
  - 完成标准: 新增 UI 文案均通过 i18n key 引用，JSON 格式有效。
  - 验证方式: `node -e` 解析 locale JSON + 前端构建。
  - depends_on: [1.1]

### 3. 知识库同步

- [√] 3.1 修改 `.helloagents/modules/frontend.md` 和 `.helloagents/CHANGELOG.md`
  - 预期变更: 记录连接管理页新增批量快捷更改登录凭证入口。
  - 完成标准: 文档描述与代码行为一致，CHANGELOG 按知识库格式追加新功能记录。
  - 验证方式: 人工检查相关段落。
  - depends_on: [1.1, 2.1]

### 4. 验证

- [√] 4.1 运行前端构建或等效校验
  - 预期变更: 验证 TypeScript/Vue 模板和 JSON 文案没有语法错误。
  - 完成标准: `npm run build --workspace packages/frontend` 成功；若失败，记录阻断原因。
  - 验证方式: 命令输出。
  - depends_on: [1.1, 2.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-05-13 17:59:16 | DESIGN | completed | 已确认唯一方案：连接页批量工具条新增快捷凭证弹层 |
| 2026-05-13 18:08:00 | 1.1 | completed | 已新增批量工具条快捷入口与 `BatchCredentialShortcutModal.vue` |
| 2026-05-13 18:08:00 | 2.1 | completed | 已补齐 zh-CN/en-US/ja-JP 批量更改凭证文案并通过 JSON 解析 |
| 2026-05-13 18:08:00 | 3.1 | completed | 已同步 frontend 模块文档和 CHANGELOG |
| 2026-05-13 18:08:00 | 4.1 | completed | `npm run build --workspace packages/frontend` 通过 |

---

## 执行备注

> 本方案不新增后端接口，复用现有 `connectionsStore.updateConnection()` 与 `PUT /api/v1/connections/:id`。
