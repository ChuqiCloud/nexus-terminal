@feature: file-manager-ui-redesign
@created: 2026-05-01 21:11
@status: pending
@mode: implementation

## 进度概览

- 完成: 0 / 失败: 0 / 跳过: 0 / 总数: 9

## 任务列表

### 阶段1: 目录树与工具栏 UI 重设计

- [ ] 1.1 重设计目录树样式 — 紧凑树视图
  - 文件: `packages/frontend/src/components/FileManager.vue` (模板 lines 2476-2530)
  - 预期变更: 移除卡片边框和圆角，改为紧凑行布局；文件夹图标改为黄色；活动行改为绿色高亮；调整缩进和行高；优化树头部样式
  - 完成标准: 目录树视觉匹配目标截图（紧凑行、黄色文件夹、绿色活动高亮、无卡片边框）
  - 验证方式: 视觉对比目标截图
  - depends_on: []

- [ ] 1.2 重设计工具栏 — 紧凑纯图标按钮
  - 文件: `packages/frontend/src/components/FileManager.vue` (模板 lines 2371-2441)
  - 预期变更: 移除按钮文字标签，保留纯图标；统一按钮尺寸 `w-7 h-7`；上传文件和上传文件夹合并为下拉菜单按钮
  - 完成标准: 工具栏为纯图标按钮行，上传为下拉菜单
  - 验证方式: 视觉对比目标截图，检查 tooltip 显示
  - depends_on: []

### 阶段2: 传输管理面板

- [ ] 2.1 创建 TransferPanel.vue 组件
  - 文件: `packages/frontend/src/components/TransferPanel.vue` (新建)
  - 预期变更: 底部抽屉面板组件，含"全部/上传/下载"tab，统一展示上传和传输任务，空态"暂无传输任务"
  - 完成标准: 组件独立运行，支持 tab 切换和空态展示
  - 验证方式: 组件接收 props 正确渲染
  - depends_on: []

- [ ] 2.2 集成 TransferPanel 到 FileManager
  - 文件: `packages/frontend/src/components/FileManager.vue`
  - 预期变更: 在文件管理器底部集成 TransferPanel，替代原 FileUploadPopup 的固定定位弹窗；添加传输面板展开/收起切换
  - 完成标准: 传输面板在文件管理器底部正确展示，上传任务和传输任务统一显示
  - 验证方式: 触发上传后传输面板展示任务
  - depends_on: [2.1]

### 阶段3: 书签系统重构

- [ ] 3.1 后端数据库 migration — 添加 scope 字段
  - 文件: `packages/backend/src/database/schema.ts`, `packages/backend/src/database/migrations/`
  - 预期变更: `favorite_paths` 表新增 `scope` TEXT 字段（默认 'global'）和 `connection_id` INTEGER 字段（nullable）；编写 migration 脚本确保现有数据兼容
  - 完成标准: 数据库表结构包含新字段，现有数据 scope 默认为 'global'
  - 验证方式: 检查 schema 定义和 migration 逻辑
  - depends_on: []

- [ ] 3.2 后端 API 扩展 — scope 查询支持
  - 文件: `packages/backend/src/favorite-paths/favorite-paths.routes.ts`, `packages/backend/src/favorite-paths/favorite-paths.repository.ts`
  - 预期变更: GET /favorite-paths 支持 `?scope=local&connectionId=X` 查询参数；POST/PUT 支持 scope 和 connection_id 字段
  - 完成标准: API 正确按 scope 和 connectionId 过滤/保存书签
  - 验证方式: API 请求测试
  - depends_on: [3.1]

- [ ] 3.3 前端 store 扩展 — scope 支持
  - 文件: `packages/frontend/src/stores/favoritePaths.store.ts`
  - 预期变更: `FavoritePathItem` 类型添加 `scope` 和 `connectionId` 字段；CRUD 方法传递 scope 参数；新增 `activeTab` 状态和 `fetchByScope` 方法
  - 完成标准: Store 支持按 scope 筛选和保存书签
  - 验证方式: Store 方法调用正确传参
  - depends_on: [3.2]

- [ ] 3.4 重设计 FavoritePathsModal — 书签列表 UI
  - 文件: `packages/frontend/src/components/FavoritePathsModal.vue`
  - 预期变更: 头部显示"书签列表 N"；添加"本地"/"云端"tab 切换；每个书签卡片显示 scope 标签和操作按钮
  - 完成标准: 书签列表 UI 匹配目标截图，支持 tab 切换筛选
  - 验证方式: 视觉对比目标截图
  - depends_on: [3.3]

- [ ] 3.5 重设计 AddEditFavoritePathForm — 添加 scope 选择器
  - 文件: `packages/frontend/src/components/AddEditFavoritePathForm.vue`
  - 预期变更: 在表单中新增"记录位置"scope 选择器（仅当前服务器/全局共享），保存时传递 scope 和 connectionId
  - 完成标准: 表单支持选择书签 scope
  - 验证方式: 创建书签时 scope 正确保存
  - depends_on: [3.3]

### 阶段4: i18n 与收尾

- [ ] 4.1 添加 i18n 键
  - 文件: `packages/frontend/src/locales/zh-CN.json`, `en-US.json`, `ja-JP.json`
  - 预期变更: 添加传输面板、书签 scope、工具栏 tooltip 相关的所有新 i18n 键
  - 完成标准: 所有新增 UI 文本均使用 i18n 键，三种语言文件同步更新
  - 验证方式: 搜索硬编码字符串
  - depends_on: [1.1, 1.2, 2.1, 3.4, 3.5]

## 执行日志

| 时间 | 事件 | 详情 |
|------|------|------|
| 2026-05-01 21:27:46 | 进度快照(自动) | 完成:0 失败:0 跳过:0 待做:10 (0%) |
| 2026-05-01 21:28:56 | 进度快照(自动) | 完成:0 失败:0 跳过:0 待做:10 (0%) |
| 2026-05-01 21:33:06 | 进度快照(自动) | 完成:0 失败:0 跳过:0 待做:10 (0%) |
| 2026-05-01 21:35:15 | 进度快照(自动) | 完成:0 失败:0 跳过:0 待做:10 (0%) |
| 2026-05-01 23:06:29 | PreCompact快照 | 完成:0 失败:0 跳过:0 待做:10 (0%) |

## 执行备注

- FileManager.vue 约 2570 行，修改时需精确定位模板区域避免副作用
- 数据库 migration 需确保 SQLite 兼容（ALTER TABLE ADD COLUMN）
- 传输面板需同时消费 uploads（本地 ref）和 transferTasks（API 轮询）两个数据源
