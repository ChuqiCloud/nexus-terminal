# 任务清单: global-connection-search-sort-pinyin

> **@status:** completed | 2026-05-04 21:37

```yaml
@feature: global-connection-search-sort-pinyin
@created: 2026-05-04
@status: completed
@mode: R2
```

## LIVE_STATUS

```json
{"status":"completed","completed":4,"failed":0,"pending":0,"total":4,"percent":100,"current":"全局检索排序与拼音搜索已完成","updated_at":"2026-05-04 21:34:00"}
```

## 进度概览

| 完成 | 失败 | 跳过 | 总数 |
|------|------|------|------|
| 4 | 0 | 0 | 4 |

---

## 任务列表

### 1. 搜索工具

- [√] 1.1 修改 `packages/frontend/src/utils/connectionSearch.ts`
  - 预期变更: 增加 `recent/name` 排序模式，抽取统一排序逻辑，并为中文字段生成拼音全拼和首字母搜索索引。
  - 完成标准: `searchConnections()` 可通过选项控制排序；“标准型”能通过 `biaoz` 命中；原有名称、主机、用户名、类型、标签搜索继续可用。
  - 验证方式: 前端构建与最小 TypeScript/Node 逻辑检查。
  - depends_on: []

### 2. 搜索弹窗 UI

- [√] 2.1 修改 `packages/frontend/src/components/GlobalConnectionQuickSearch.vue`
  - 预期变更: 新增“最近连接 / 名称”分段控件，默认最近连接，并将排序选项传入 `searchConnections()`。
  - 完成标准: 点击排序按钮会即时重排结果；方向键、Enter、Esc、鼠标选择不回归。
  - 验证方式: 代码审查、前端构建，必要时本地浏览器冒烟。
  - depends_on: [1.1]

### 3. 多语言文案

- [√] 3.1 修改 `packages/frontend/src/locales/zh-CN.json`、`packages/frontend/src/locales/en-US.json`、`packages/frontend/src/locales/ja-JP.json`
  - 预期变更: 为全局检索新增排序标签文案和拼音搜索提示文案。
  - 完成标准: 三个语言包 JSON 语法有效，组件引用的键均存在。
  - 验证方式: `npm run build --workspace packages/frontend`。
  - depends_on: [2.1]

### 4. 知识库与验收

- [√] 4.1 同步 ` .helloagents/modules/frontend.md ` 与运行验证
  - 预期变更: 更新前端模块文档中的全局服务器检索行为说明，并运行前端构建验证。
  - 完成标准: 文档反映排序与拼音搜索；构建通过或明确记录失败原因。
  - 验证方式: `npm run build --workspace packages/frontend`。
  - depends_on: [3.1]

---

## 执行日志

| 时间 | 任务 | 状态 | 备注 |
|------|------|------|------|
| 2026-05-04 21:26:09 | DESIGN | completed | 已创建方案包并完成唯一方案规划 |
| 2026-05-04 21:30:00 | 1.1 | completed | 已扩展连接搜索排序模式，并新增中文拼音全拼/首字母索引 |
| 2026-05-04 21:31:00 | 2.1 | completed | 已在全局检索弹窗加入“最近连接 / 名称”分段控件，默认最近连接 |
| 2026-05-04 21:32:00 | 3.1 | completed | 已补齐中英日三份全局检索排序与拼音提示文案 |
| 2026-05-04 21:34:00 | 4.1 | completed | 已同步前端模块知识库，并通过前端构建与拼音样例验证 |

---

## 执行备注

本次不修改后端接口、不引入新依赖、不改变连接数据模型。

验收摘要:
- `npm run build --workspace packages/frontend` 通过。
- JSON 语言包语法检查通过。
- “标准型”拼音索引验证结果为 `biaozhunxing` / `bzx`，`biaoz` 可命中。
- Vite 输出的大 chunk 和动态/静态导入提示为项目既有构建提示，本次未新增阻断错误。
