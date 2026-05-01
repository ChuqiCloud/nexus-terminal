# 方案包: file-manager-ui-redesign

- 创建日期: 2026-05-01 21:11
- 类型: implementation
- 决策ID: file-manager-ui-redesign#D001

## 1. 需求

### 背景
用户提供了 5 张目标截图，要求重新设计工作台文件管理器的 UI，涵盖目录树、工具栏、书签系统、新增书签弹窗、传输管理面板五个区域。当前实现使用卡片式行布局和文字+图标按钮，与目标的紧凑树视图和纯图标工具栏存在较大差异。

### 目标
- 目录树：从卡片行布局转为紧凑传统文件树（黄色文件夹图标、绿色高亮活动目录、符号链接显示目标、更紧密间距、无卡片边框）
- 工具栏：从文字+图标按钮转为紧凑纯图标工具栏（tooltip 提示），上传按钮合并为下拉菜单（"上传文件"/"上传文件夹"）
- 书签系统：重新设计为"书签列表 N"头部、"本地"/"云端"标签切换（本地=仅当前服务器、云端=全局共享）、scope 标签、更丰富的卡片布局和操作按钮
- 新增书签弹窗：新增"记录位置"scope 选择器（仅当前服务器/全局共享）
- 传输管理面板：新增底部抽屉面板，含"全部/上传/下载"标签，统一展示上传和传输任务，空态"暂无传输任务"

### 约束条件
- 使用项目现有技术栈：Vue 3 + Composition API、Pinia、Tailwind CSS、vue-i18n
- 书签 scope 功能需要后端数据库 migration（新增 scope 和 connection_id 字段）
- 保持所有现有功能不变，仅改变 UI 呈现和增加 scope 功能
- 遵循项目现有主题变量系统

### 验收标准
- 目录树视觉效果匹配目标截图：紧凑行高、黄色文件夹图标、绿色活动行高亮
- 工具栏为纯图标按钮，上传按钮为下拉菜单
- 书签支持本地/云端 scope 切换和筛选
- 传输面板在底部以抽屉形式展开，支持三个 tab 筛选
- 所有 i18n 键已添加（zh-CN、en-US、ja-JP）

## 2. 方案

### 技术方案

#### 任务1：目录树 UI 重设计
- 修改 `FileManager.vue` 模板中的 `explorerTreeRows` 渲染区域
- 移除卡片样式（`rounded-lg border`），改为紧凑行（`py-0.5`）
- 图标颜色：目录用 `text-yellow-500`（黄色文件夹），文件保持现有图标
- 活动行：使用 `bg-green-600/20 text-green-400` 高亮
- 符号链接：在文件名后显示 `→ target`
- 调整树头部样式使其更紧凑

#### 任务2：工具栏重设计
- 将工具栏区域的文字+图标按钮改为纯图标按钮（统一 `w-7 h-7`）
- 为每个按钮添加 `title` tooltip
- 上传文件和上传文件夹合并为单个按钮 + 下拉菜单
- 新增 `uploadMenuOpen` ref 控制下拉菜单显隐

#### 任务3：书签系统重构
- 后端：`favorite_paths` 表新增 `scope` (TEXT, DEFAULT 'global') 和 `connection_id` (INTEGER, NULLABLE) 字段
- 后端：API 支持 `?scope=local&connectionId=X` 查询参数
- 前端 store：扩展 `FavoritePathItem` 类型，添加 scope 和 connectionId 字段
- 前端 `FavoritePathsModal.vue`：重设计为含头部计数、本地/云端 tab、scope 标签的布局
- 前端 `AddEditFavoritePathForm.vue`：新增 scope 选择器

#### 任务4：传输管理面板
- 新建 `TransferPanel.vue` 组件：底部抽屉面板
- 含"全部/上传/下载"标签切换
- 统一展示 `uploads`（来自 FileUploadPopup）和 `transferTasks`（来自 TransferProgressModal）
- 空态显示"暂无传输任务"
- 集成到 `FileManager.vue` 底部

### 影响范围
- `packages/frontend/src/components/FileManager.vue` — 目录树+工具栏+传输面板集成
- `packages/frontend/src/components/FavoritePathsModal.vue` — 书签列表重设计
- `packages/frontend/src/components/AddEditFavoritePathForm.vue` — 新增 scope 选择器
- `packages/frontend/src/components/TransferPanel.vue` — 新组件
- `packages/frontend/src/stores/favoritePaths.store.ts` — scope 支持
- `packages/backend/src/database/schema.ts` — 数据库 migration
- `packages/backend/src/favorite-paths/` — API 扩展
- `packages/frontend/src/locales/` — i18n 键

### 风险评估
- 数据库 migration 需谨慎处理现有数据兼容性（现有书签默认 scope='global'）
- FileManager.vue 文件较大（~2570 行），修改需精确定位避免副作用
- 传输面板需同时消费两个不同数据源（uploads + transferTasks）

### 方案取舍
- 选择在 `FileManager.vue` 内直接修改而非拆分子组件，因为目录树渲染与父组件状态紧密耦合，拆分成本高于收益
- 书签 scope 选择直接内联到现有表单而非独立组件，保持简单
- 传输面板选择新建独立组件，因为它的数据源和生命周期独立于文件管理器其他部分

### 验证策略
- verifyMode: review-first
- reviewerFocus: UI 视觉匹配目标截图、样式一致性、响应式表现
- testerFocus: 书签 CRUD 功能完整性、scope 筛选正确性、传输面板数据展示
- 风险边界: 数据库 migration 回滚方案为手动删除新增字段

## 成果设计

### 美学基调
延续项目现有的暗色终端风格，紧凑高信息密度，使用项目主题变量系统保持一致性。

### 视觉要素
- 配色：遵循项目现有 `--color-*` CSS 变量体系；目录树活动行使用绿色系，文件夹图标使用黄色系
- 布局：紧凑垂直排列，减少 padding 和 margin，提升信息密度
- 交互：hover 状态使用 `bg-background` 微弱高亮，保持轻量
