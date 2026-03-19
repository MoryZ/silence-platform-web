# 项目未使用代码扫描报告

## 📊 扫描时间
Report generated on: 2026年3月18日

---

## 1️⃣ 未使用的 Components (src/components/)

### 完全未被使用 ❌

| 组件名称 | 文件路径 | 原因 | 建议 |
|--------|--------|------|------|
| **FormGrid** | `src/components/FormGrid.vue` | 无任何导入或使用记录 | 除非有计划使用，建议删除 |
| **TabsView** | `src/components/TabsView.vue` | 无任何导入或使用记录 | 除非有计划使用，建议删除 |
| **ChangeAnalysis** | `src/components/ChangeAnalysis.vue` | 作为组件从未被导入；项目使用 `analyzeChanges()` 函数替代 | 删除或保留作为参考 |

### 已被使用的组件 ✅

以下组件均有正常的导入和使用：
- AllProductsDrawer.vue
- AuthWrapper.vue  
- CodeEditor.vue
- ColumnSettings.vue
- CommonPagination.vue
- DetailCell.vue
- DetailDrawer.vue
- EnvSelector.vue
- NamespaceSelector.vue
- NotificationPopover.vue
- Permission.vue
- SearchHistoryPopover.vue
- SearchPanel.vue
- SettingsDrawer.vue
- SideMenu.vue
- SlideVerify.vue
- SystemComponentSelector.vue
- UserDropdown.vue
- common/ 下所有组件 (dynamic-input, editable-input, job-trigger-interval, label-list, svg-icon, system-user)
- workflow/ 下所有组件

---

## 2️⃣ 未使用的 Constants (src/constants/)

### business.ts 中的未使用常量

| 常量名称 | 类型 | 原因 | 建议 |
|--------|------|------|------|
| **podsType** | Record | 定义于line 21，无导入记录 | 删除，如需要可恢复 |
| **roleTypeRecord** | Record | 定义于line 16，无导入记录 | 删除，roleRecord 已实现替代功能 |
| **groupConfigIdModeOptions** | Transformed | 定义于line 84，无外部导入 | 删除，仅在定义处出现 |
| **groupConfigIdModeRecord** | Record | 定义于line 80，无外部导入 | 删除 |

### app.ts 中的未使用常量

| 常量名称 | 类型 | 原因 | 建议 |
|--------|------|------|------|
| **themeScrollModeOptions** | Transformed | 定义于line 33，无导入记录 | 删除（themeScrollModeRecord 仅定义，未使用） |
| **loginModuleRecord** | Record | 定义于line 15，仅定义一个模块 'pwd-login'，无使用 | 删除或用于未来扩展 |

### reg.ts 中的完全未使用的正则表达式

| 常量名称 | 原因 | 建议 |
|---------|------|------|
| **REG_USER_NAME** | 无导入或使用记录 | 删除或保留作为工具库 |
| **REG_PHONE** | 无导入或使用记录 | 删除或保留作为工具库 |
| **REG_PWD** | 无导入或使用记录 | 删除或保留作为工具库 |
| **REG_EMAIL** | 无导入或使用记录 | 删除或保留作为工具库 |
| **REG_CODE_SIX** | 无导入或使用记录 | 删除或保留作为工具库 |
| **REG_CODE_FOUR** | 无导入或使用记录 | 删除或保留作为工具库 |
| **REG_URL** | 无导入或使用记录 | 删除或保留作为工具库 |

### business.ts 中已确认被使用的常量 ✅

以下常量都有正常的导入和使用，不需要删除：
- `enableStatusNumberRecord` - 使用于 retrySceneView.vue
- `cbTriggerTypeRecord` - 使用于 retrySceneView.vue
- `alarmWebhookTypeRecordOptions` - 使用于 webhook-form.vue
- `retryStatusTypeRecord` - 使用于 retryTaskView.vue, retryInfoView.vue
- `retryTaskStatusTypeRecord` - 使用于 retryTaskView.vue
- `retryTaskTypeRecord` - 使用于 retryTaskView.vue, retryInfoView.vue
- `backOffRecord` - 使用于 retrySceneView.vue
- `blockStrategyRecord` 及 Options - 使用于 workflow 模块和 retrySceneView.vue
- `failStrategyRecord` 及 Options - 使用于 workflow 模块
- `expressionRecord` 及 Options - 使用于 branch 模块
- `contentTypeRecord` 及 Options - 使用于 callback 模块
- `DelayLevel` - 使用于 retrySceneView.vue
- `triggerTypeRecord` - 使用于 workflow 模块和 workflowTaskView.vue
- `taskBatchStatusEnum`, `jobStatusEnum`, `jobOperationReasonEnum`, `jobExecutorEnum` - 使用于 detail-card.vue
- `workFlowNodeStatusRecord` 及 Options - 使用于 workflow 模块
- 其他 notify scene 相关常量（在定义处使用）

### app.ts 中已被使用的常量 ✅

- `themeSchemaOptions`, `themeLayoutModeOptions`, `themeTabModeOptions`
- `themePageAnimationModeOptions`, `resetCacheStrategyOptions`
- `GLOBAL_HEADER_MENU_ID`, `GLOBAL_SIDER_MENU_ID`

---

## 3️⃣ Assets (src/assets/) 检查

### 图标文件 (icons/)
- ✅ bilibili.svg - 可能被使用
- ✅ flowlong.svg - 可能被使用

### 图片文件 (images/)
- ✅ bubble.png, cute.png, doraemon.png, girl.png, work.png - 可能被使用于登录或其他页面

### CSS 文件
- ✅ main.css - 在 main.ts 中被正式导入

**注意**: 图片和图标通常通过字符串路径引用，不易追踪。建议通过搜索文件名来确认是否使用。

---

## 📝 建议清理清单

### 高优先级删除（确认完全未使用）
1. `src/components/FormGrid.vue` 
2. `src/components/TabsView.vue`
3. `src/components/ChangeAnalysis.vue` (如果不是参考文件)
4. `src/constants/business.ts` 中的：
   - `podsType`
   - `roleTypeRecord`
   - `groupConfigIdModeOptions`
   - `groupConfigIdModeRecord`
5. `src/constants/app.ts` 中的：
   - `themeScrollModeOptions`
   - `loginModuleRecord`

### 中优先级处理（可选删除）
- `src/constants/reg.ts` 中的所有正则表达式（如非备用工具库）

### 保留（已确认使用）
- 所有其他组件和常量

---

## 🔍 注意事项

1. **动态导入**: 某些文件可能通过动态导入或字符串路径被引用，本扫描可能无法捕获
2. **第三方库**: 某些导出可能被第三方库或插件使用
3. **锁定版本**: 在删除前，建议检查 Git 历史确认是否有意留下
4. **正则表达式**: reg.ts 中的正则表达式可以作为工具库保留

---

## ✅ 验证方法

删除前建议验证：
```bash
# 确保没有其他引用
grep -r "FormGrid" src/
grep -r "TabsView" src/
grep -r "podsType" src/
grep -r "REG_EMAIL" src/
```
