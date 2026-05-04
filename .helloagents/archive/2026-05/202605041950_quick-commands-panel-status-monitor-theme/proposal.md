# 变更提案: quick commands panel status monitor theme

## 元信息
```yaml
类型: 优化
方案类型: implementation
优先级: P1
状态: 已确认
创建: 2026-05-04
```

---

## 1. 需求

### 背景
快捷指令列表当前使用通用 Tailwind 背景、边框和 hover 样式，和同一工作区里的服务器状态面板视觉密度、颜色层级不一致。用户要求把快捷指令区域的布局颜色调整到与 `StatusMonitor.vue` 的 `sm-shell` / `sm-section` 风格一致，并按 `DESIGN.md` 与 `nvidia/DESIGN.md` 区分浅色、深色主题取色。

### 目标
- 将快捷指令搜索栏、标签组、指令行、操作按钮改为与服务器状态面板一致的紧凑分区式布局。
- 深色主题使用 NVIDIA 设计文档的黑底、灰阶文本、绿色交互强调；浅色主题使用 Apple 设计文档的浅灰背景、近黑文本、蓝色交互强调。
- 保留现有快捷指令功能逻辑，包括搜索、排序、紧凑模式、标签展开、拖拽、复制、编辑、删除、双击执行和右键菜单。

### 约束条件
```yaml
时间约束: 本轮完成代码改动与验证
性能约束: 仅样式与模板类名调整，不增加运行时重计算或新依赖
兼容性约束: 保持 Vue 3 + Tailwind 现有工程结构；不改 store/API/数据结构
业务约束: 不修改用户现有快捷指令内容，不触碰无关的 CommandInputBar.vue 本地改动
```

### 验收标准
- [ ] 快捷指令面板视觉与 `StatusMonitor.vue` 的分区、间距、低对比分隔线和紧凑信息层级一致。
- [ ] 深色主题符合 `nvidia/DESIGN.md` 的黑底、灰阶、`#76b900` 交互强调；浅色主题符合 `DESIGN.md` 的 `#f5f5f7` / `#1d1d1f` / `#0071e3` 逻辑。
- [ ] 搜索、排序、紧凑模式、标签展开、拖拽、复制、编辑、删除、右键菜单入口不因样式改造丢失。
- [ ] `npm run build` 或等价前端验证通过；若被既有问题阻塞，记录阻塞点与本次改动关系。

---

## 2. 方案

### 技术方案
在 `QuickCommandsView.vue` 内引入 scoped CSS 的 `qc-*` 语义类，替换当前列表区域过多依赖通用 Tailwind 色彩类的做法。模板继续使用原有数据循环与事件处理，仅调整容器、控制栏、组头、列表项、按钮、状态页、右键菜单的类名和必要结构。`QuickCommandsModal.vue` 外层改为更贴合嵌入式面板的薄边界和深色透明遮罩，使模态框内的快捷指令列表不再呈现孤立白底卡片感。

### 影响范围
```yaml
涉及模块:
  - packages/frontend/src/views/QuickCommandsView.vue: 快捷指令主列表视觉结构和状态样式
  - packages/frontend/src/components/QuickCommandsModal.vue: 快捷指令弹窗外层视觉统一
预计变更文件: 2
```

### 风险评估
| 风险 | 等级 | 应对 |
|------|------|------|
| 模板类名调整影响拖拽/选择状态可见性 | 中 | 保留所有事件、data-command-id 和状态判断，仅改变样式类；为选中、拖拽目标提供明确样式 |
| scoped CSS 与全局主题变量不匹配 | 中 | 使用现有 CSS 变量作为基础，并为 `html.light` / `html.dark` 提供明确覆盖 |
| 构建受既有无关文件错误阻塞 | 中 | 运行验证并区分本次改动错误与既有工作区错误 |

### 方案取舍
```yaml
唯一方案理由: 以组件 scoped CSS 建立快捷指令专属 qc-* 外观层，能最大限度保留现有逻辑，同时精确复刻状态监控面板的布局节奏和主题差异。
放弃的替代路径:
  - 修改全局 Tailwind/theme 变量: 影响范围过大，可能改变全站视觉。
  - 直接复用 StatusMonitor.vue 的 sm-* 类名: scoped 样式无法跨组件复用，且语义不匹配。
  - 重构为新的子组件树: 对本次视觉统一不是必需，会扩大风险。
回滚边界: 回退 QuickCommandsView.vue 与 QuickCommandsModal.vue 的模板/CSS 改动即可，不涉及后端、store、数据库或用户数据。
```

---

## 3. 核心场景

### 场景: 快捷指令面板浏览与执行
**模块**: QuickCommands
**条件**: 用户打开快捷指令面板，存在已分组或未分组的快捷指令。  
**行为**: 用户搜索、展开标签、选择指令、复制/编辑/删除或双击执行。  
**结果**: 功能行为与改造前一致，视觉呈现与服务器状态面板保持统一的紧凑分区布局。

---

## 4. 验证策略

```yaml
verifyMode: review-first
reviewerFocus:
  - QuickCommandsView.vue 模板事件和 data 属性是否完整保留
  - QuickCommandsModal.vue 是否只做外观层调整
  - scoped CSS 是否覆盖深浅主题、hover、focus、selected、drag target、empty/loading 状态
testerFocus:
  - npm run build
  - 人工核对快捷指令弹窗/面板在深色和浅色主题下的颜色层级
uiValidation: required
riskBoundary:
  - 不修改快捷指令 store、后端 API 或数据库 schema
  - 不改动用户已有快捷指令数据
  - 不触碰无关本地改动 packages/frontend/src/components/CommandInputBar.vue
```

---

## 5. 成果设计

### 设计方向
- **美学基调**: 工业状态面板式密集列表。快捷指令不做卡片堆叠，而是像服务器状态面板一样通过薄分隔线、压缩标题、单行操作按钮和低对比文本形成可扫描的工具面板。
- **记忆点**: 标签组像状态监控的 section header，展开后命令行沿着同一条暗色/浅色信息轨道排列，交互强调只在选中、hover 和操作图标上出现。
- **参考**: `StatusMonitor.vue` 的 `sm-shell`、`sm-section`、`sm-link-btn`、`sm-badge`、表格行密度；浅色取 `DESIGN.md`，深色取 `nvidia/DESIGN.md`。

### 视觉要素
- **配色**: 深色为 `#000000` / `#1a1a1a` / `#a7a7a7` / `#76b900`；浅色为 `#f5f5f7` / `#ffffff` / `#1d1d1f` / `#0071e3`。
- **字体**: 沿用项目字体变量；深色主题按 NVIDIA 文档保持工业实用的 Arial/Helvetica fallback，浅色主题利用系统 SF Pro fallback，不额外引入字体依赖。
- **布局**: 外层 `qc-shell` 纵向排布，控制栏作为 header，标签组作为 section，命令行作为无卡片列表项；紧凑模式减少行高但保留操作按钮命中区。
- **动效**: 保留短时 hover/focus/drag target transition；不增加复杂动画，避免影响工具面板效率。
- **氛围**: 使用轻微的边框、底部分隔线和低透明强调底色，不使用渐变装饰或漂浮卡片。

### 技术约束
- **可访问性**: 保持按钮 title、输入框 focus、键盘列表导航；新增样式需保留可见 hover/selected/focus 状态。
- **响应式**: 控制栏在窄宽度下仍使用固定图标按钮和可伸缩搜索框；列表文本继续 ellipsis。
