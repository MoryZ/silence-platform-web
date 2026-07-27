# CODE_STYLE.md — silence-platform-web

> Vue 3 + TypeScript 项目编码规范。适用于 RAG 知识库精准切片（Heading Chunking）。
> 最后更新：2026-06-23

---

## 1. 工程基础化配置 (Project Configuration)

<!-- RAG 锚点：项目配置、技术栈版本、ESLint 规则、代码格式化、tsconfig 配置、TypeScript 严格模式、路径别名、@ 别名、prettier、缩进、单引号、分号、依赖包管理、vite、vue3 版本、pinia、ant-design、naive-ui、axios -->

### 1.1 技术栈版本锁定

| 依赖 | 版本约束 |
|---|---|
| vue | ^3.3.4 |
| typescript | ^5.2.2 |
| vite | ^8.0.0 |
| vue-router | ^4.5.0 |
| pinia | ^2.1.6 |
| ant-design-vue | ^4.2.6 |
| naive-ui | ^2.43.2 |
| @vueuse/core | ^13.0.0 |
| axios | ^1.13.6 |
| vue-i18n | ^11.3.0 |

### 1.2 格式化规范

项目**未使用 Prettier**，以 ESLint 作为唯一 Lint 工具，无独立 `.prettierrc` / `.editorconfig`。代码风格约定如下（以实际源码为准）：

- **缩进**：2 个空格
- **引号**：单引号（`'`）
- **分号**：无分号（语句末尾不写 `;`）
- **换行**：Unix LF
- **模块**：ESM（`"type": "module"`）

### 1.3 ESLint 配置（`.eslintrc.js`）

```javascript
module.exports = {
  root: true,
  env: { node: true },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-explicit-any': 'warn',         // any 触发警告，不阻断编译
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}
```

**关键规则摘要**：
- `any` 类型：允许使用，但触发 `warn`，须有意使用并注释原因
- 函数返回类型：无需显式声明（`explicit-module-boundary-types: off`）
- `console`：生产构建中为 `warn`，开发环境不限制

### 1.4 TypeScript 配置（`tsconfig.json`）

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "skipLibCheck": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

**校验严谨度总结**：

| 选项 | 状态 | 说明 |
|---|---|---|
| `strict` | ❌ 关闭 | 不强制全量严格模式 |
| `noImplicitAny` | ❌ 关闭 | 允许隐式 any |
| `strictNullChecks` | ❌ 关闭 | 不强制 null 检查 |
| `allowJs` | ✅ 开启 | 允许混入 JS 文件 |
| `resolveJsonModule` | ✅ 开启 | 可直接 import JSON |
| 路径别名 | `@` → `src/` | 全局统一使用 `@/` 前缀 |

> **重度警告（面向知识库生成）**：
> 虽然项目历史原因导致 TS 配置为 "宽松模式"（`strict: false`），但**这绝不是放任类型丢失的理由**。
> 新提交的代码、Composables 以及 API 接口，**必须**显式标注完整的类型定义，禁止依赖隐式 `any`。大模型在参考此库生成代码时，必须以高标准 TS 规范输出。
### 1.5 路径别名规范

所有 `src/` 内的跨目录引用，**必须使用 `@/` 别名**，禁止使用相对路径 `../../`。

```typescript
// ✅ 正确
import { useUserStore } from '@/stores/user'
import type { UserInfo } from '@/types/auth'

// ❌ 禁止
import { useUserStore } from '../../stores/user'
```

---

## 2. Vue3 组件开发规范 (Vue3 Component Standards)

<!-- RAG 锚点：Vue 组件写法、script setup、组合式 API、SFC 单文件组件、template script style 顺序、Props 定义、Emits 声明、withDefaults、defineProps、defineEmits、ref reactive computed watch、生命周期钩子、onMounted、scoped 样式、:deep 穿透、Ant Design Vue 样式覆盖、组件命名、vue3 最佳实践 -->

### 2.1 编写范式

**统一使用 `<script setup lang="ts">`**，禁止使用 Options API 和 `export default defineComponent()`。

```vue
<script setup lang="ts">
// 所有逻辑在此编写
</script>
```

### 2.2 单文件组件（SFC）结构顺序

```
<template>   ← 模板在最上方
<script setup lang="ts">   ← 逻辑居中
<style scoped>   ← 样式在最下方（默认加 scoped）
```

### 2.3 `<script setup>` 内代码组织顺序

```typescript
// 1. Imports（外部库 → 内部 store → 内部 composable → 内部类型）
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useXxxHook } from '@/hooks/xxx'
import type { XxxType } from '@/types/xxx'

// 2. Props & Emits
const props = withDefaults(defineProps<Props>(), { ... })
const emit = defineEmits<Emits>()

// 3. Store / Composable 实例化
const userStore = useUserStore()
const router = useRouter()

// 4. 响应式状态（ref / reactive）
const loading = ref(false)
const list = ref<Item[]>([])

// 5. Computed
const isAdmin = computed(() => userStore.roles.includes('admin'))

// 6. Methods / Functions
function handleSubmit() { ... }

// 7. Watch
watch(loading, (val) => { ... })

// 8. Lifecycle Hooks
onMounted(() => { ... })
```

### 2.4 Props & Emits 声明规范

使用 **TS 泛型接口**定义，通过 `withDefaults` 提供默认值，禁止使用运行时 `defineProps({ type: ..., default: ... })` 写法。

```typescript
// Props 接口定义（在 script setup 内或同文件顶部定义）
interface Props {
  title: string
  visible?: boolean
  size?: 'small' | 'medium' | 'large'
}

// Emits 接口定义
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: SomeType): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  size: 'medium',
})

const emit = defineEmits<Emits>()
```

### 2.5 样式规范

- 组件内样式默认使用 `<style scoped>`
- 覆盖第三方组件（Ant Design Vue）样式使用 `:deep()` 选择器
- 全局样式写入 `src/assets/main.css` 或 `App.vue` 的非 scoped `<style>`
- 支持 SCSS（`sass`）和 Less，SCSS 使用 modern-compiler API

```vue
<style scoped>
/* 组件私有样式 */
.env-button {
  display: flex;
  align-items: center;
}

/* 穿透覆盖 Ant Design 样式 */
:deep(.ant-modal-content) {
  border-radius: 8px;
}
</style>
```

### 2.6 CSS 变量使用规范（第十批：两套系统合并）

本项目存在**两套 CSS 变量注入系统**，各司其职、互补而非竞争：

#### System A — `stores/app.ts`（布局/菜单/背景色）

| 属性 | 说明 |
|------|------|
| 注入方式 | `root.style.setProperty()` (inline style) |
| 值格式 | hex (`#141414`) 或 `rgba()` — 可直接用于 `color: var(--xxx)` |
| 暗色模式 | `data-theme='dark'` 属性 + `.dark` 类 |
| 静态 fallback | `main.css` `:root` / `:root[data-theme='dark']` |
| 变量清单 | `--bg-color` `--text-color` `--border-color` `--component-background` `--menu-*` `--layout-*` (共 14 个) |
| SCSS 映射 | `src/styles/_theme-map.scss` → `$bg-color` `$text-color` 等 |

#### System B — `stores/theme/`（色板/Naive UI/语义色）

| 属性 | 说明 |
|------|------|
| 注入方式 | `<style id="theme-vars">` 标签 (`:root` + `html.dark`) |
| 值格式 | `'r g b'` 三元组 (如 `22 119 255`) — 用于 `rgb(var(--xxx))` 和 `rgba(var(--xxx), alpha)` |
| 暗色模式 | `html.dark` 类 (`toggleCssDarkMode`) |
| 变量清单 | `--primary-color` `--info-color` `--success-color` ... + 色阶 `--primary-50-color` ~ `--primary-950-color` + `--container-bg-color` `--base-text-color` `--layout-bg-color` + box-shadow 变量 |

#### 选用规则

```css
/* ✅ 需要透明度 → 用 System B (RGB 三元组格式) */
.overlay {
  background: rgba(var(--primary-color), 0.1);
}

/* ✅ 直接引用背景/文字色 → 用 System A (更简洁) */
.card {
  background: var(--component-background);
  color: var(--text-color);
}

/* ✅ 需要色阶（hover/active） → 用 System B */
.btn:hover {
  background: rgb(var(--primary-400-color));
}

/* ✅ SCSS 中使用 → @use '@/styles/theme-map' as *; 然后用 $bg-color 等 */
@use '@/styles/theme-map' as *;
.panel {
  background: $component-bg;
  border: 1px solid $border-color;
}
```

#### 命名对照（语义相同但格式不同，不能合并）

| System A (直接值) | System B (RGB 三元组) | 语义 |
|-------------------|----------------------|------|
| `--component-background` | `--container-bg-color` | 卡片/面板背景 |
| `--text-color` | `--base-text-color` | 基础文字色 |
| `--layout-body-background` | `--layout-bg-color` | 布局层背景 |

> **不能简单合并命名**：值格式不同（直接值 vs RGB 三元组），合并会导致 `rgba(var(--xxx), 0.1)` 语法失效。

---

## 3. TypeScript 最佳实践 (TypeScript Best Practices)

<!-- RAG 锚点：TypeScript 类型定义、Interface 接口、Type 类型别名、Enum 枚举、类型声明文件、泛型、as 类型断言、非空断言、unknown vs any、类型收窄、d.ts、namespace、请求参数类型、响应体类型、XxxQuery XxxResponse、I 前缀命名规范、类型导出 re-export -->

### 3.1 Interface / Type / Enum 命名与存放规范

| 类型 | 命名规则 | 存放位置 |
|---|---|---|
| `interface` | PascalCase，无 `I` 前缀 | `src/types/<模块>/` |
| `type` | PascalCase | `src/types/<模块>/` 或组件内 |
| `enum` | PascalCase，值用 PascalCase | `src/enum/index.ts` |
| 请求参数类型 | `XxxQuery` / `XxxParams` | `src/types/<模块>/` |
| 响应体类型 | `XxxResponse` / `XxxResult` | `src/types/<模块>/` |
| Store 内部状态 | `XxxState`（仅在 store 文件内使用时） | store 文件内 |

```typescript
// src/types/auth/user.ts
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email?: string
  roles?: string[]
  permissions?: string[]
}

export interface UserQuery {
  pageNo: number
  pageSize: number
  username?: string
  status?: boolean
}

export interface UserListResponse {
  data: UserInfo[]
  total: number
}

// src/enum/index.ts
export enum SetupStoreId {
  App = 'app-store',
  Theme = 'theme-store',
  Auth = 'auth-store',
}
```

### 3.2 类型导出规范

类型文件使用 `index.ts` 统一 re-export，调用方通过目录路径导入。

```typescript
// src/types/auth/index.ts
export * from './user'
export * from './login'
export * from './menu'

// 调用方
import type { UserInfo, UserQuery } from '@/types/auth'
```

### 3.3 类型断言（`as`）与非空断言（`!`）使用边界

**`as` 类型断言**：
- 仅用于 TS 无法自动推断、但开发者确认类型正确的场景
- 常见合法场景：Axios 泛型响应解包、DOM 操作、第三方库返回值收窄

```typescript
// ✅ 合法：API 响应强制收窄
const menuItems = menus as unknown as MenuItem[]

// ✅ 合法：环境变量
const API_BASE = import.meta.env.VITE_API_BASE_URL as string

// ❌ 禁止：用 as 绕过类型错误
const foo = bar as any as SomeType  // 不可接受
```

**`!` 非空断言**：
- 仅在明确知道值不为 null/undefined 的情况下使用
- 推荐优先使用可选链 `?.` 或条件判断代替

```typescript
// ✅ 合法：已在上方做了 null 检查
if (!domRef.value) return
chartRef.value!.setOption(options)

// ❌ 禁止：无防护直接断言
someRef.value!.doSomething()  // 若值为 null 则运行时崩溃
```

### 3.4 `any` 的使用规范

- 项目 ESLint 配置为 `warn` 级别，不阻断编译
- 实际业务代码中，优先使用 `unknown` + 类型收窄替代 `any`
- 工具函数、通用封装中可有条件使用 `any`，须附注释说明

```typescript
// ✅ 可接受：工具函数中有说明
interface ApiPayload {
  code?: number
  data?: any  // 业务数据结构不固定，由调用方约束泛型
}

// ✅ 推荐：收窄 unknown
function processResponse(data: unknown): string {
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}
```

---

## 4. 典型代码范本 (Best Practice & Anti-Pattern)

<!-- RAG 锚点：代码示例、正确写法、错误写法、最佳实践、反模式、Vue3 组件模板、Pinia Store 状态管理、API 接口调用、axios 封装、request 工具函数、Composable 自定义 Hook、useEcharts 图表封装、use 前缀钩子函数、类型定义规范、Options API vs Composition API、代码对比、接口调用示例、后端请求写法 -->

### 4.1 Vue3 组件写法

#### ❌ 错误示范 (Anti-Pattern)

```vue
<script>
// 使用 Options API
export default {
  data() {
    return {
      loading: false,
      userInfo: null
    }
  },
  methods: {
    async fetchUser() {
      this.loading = true
      const res = await fetch('/api/user')
      this.userInfo = await res.json()
      this.loading = false
    }
  },
  mounted() {
    this.fetchUser()
  }
}
</script>
```

#### ✅ 正确示范 (Best Practice)

```vue
<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="userInfo">{{ userInfo.nickname }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserInfo } from '@/api/auth/user'
import type { UserInfo } from '@/types/auth'

const loading = ref(false)
const userInfo = ref<UserInfo | null>(null)

async function fetchUser() {
  loading.value = true
  try {
    userInfo.value = await getUserInfo()
  } finally {
    loading.value = false
  }
}

onMounted(fetchUser)
</script>
```

---

### 4.2 Pinia Store 写法

#### ❌ 错误示范 (Anti-Pattern)

```typescript
// 使用 Options Store，状态管理混乱
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('TOKEN') || '',
  }),
  actions: {
    login(params: any) {
      // 直接操作 localStorage，无封装
      localStorage.setItem('TOKEN', params.token)
    }
  }
})
```

#### ✅ 正确示范 (Best Practice)

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ls } from '@/utils/stoarge'
import { TOKEN } from '@/utils/constant'
import type { UserInfo } from '@/types/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(ls.get(TOKEN) || '')
  const userInfo = ref<UserInfo | null>(null)

  // Actions
  function setToken(value: string) {
    token.value = value
    ls.set(TOKEN, value)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  return { token, userInfo, setToken, setUserInfo }
})
```

---

### 4.3 API 层写法

<!-- RAG 锚点：接口调用、后端请求、HTTP 请求封装、axios 实例、request.get、request.post、request.delete、authRequest、actionCode 权限码、API 封装示例、如何调用后端接口、接口请求写法 -->

#### ❌ 错误示范 (Anti-Pattern)

```typescript
// 在组件内直接调用 axios，无封装
import axios from 'axios'

const res = await axios.get('/api/v1/users', {
  headers: { Authorization: `Bearer ${token}` }
})
```

#### ✅ 正确示范 (Best Practice)

```typescript
// src/api/auth/user.ts
// 通过封装的 request 实例调用，自动附加 token 和错误处理
import { authRequest as request } from '@/utils/request'
// 修正：统一使用 UserInfo 
import type { UserInfo, UserQuery, UserListResponse } from '@/types/auth'

export function getUserList(query: UserQuery): Promise<UserListResponse> {
  return request.get('/api/v1/users', { params: query })
}

export function addUser(data: Partial<UserInfo>): Promise<UserInfo> {
  return request.post('/api/v1/users', data, { actionCode: 'system:user:add' })
}

export function deleteUser(id: number): Promise<void> {
  return request.delete(`/api/v1/users/${id}`, { actionCode: 'system:user:delete' })
}
```

---

### 4.4 Composable（自定义 Hook）写法

#### ❌ 错误示范 (Anti-Pattern)

```typescript
// 将图表初始化逻辑写在组件内，无法复用
onMounted(() => {
  const chart = echarts.init(document.getElementById('chart'))
  chart.setOption({ ... })
})
```

#### ✅ 正确示范 (Best Practice)

```typescript
// src/hooks/common/echarts.ts
import { nextTick, onUnmounted, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { ECharts, EChartsOption } from 'echarts'
import * as echarts from 'echarts/core'

export function useEcharts(domRef: Ref<HTMLElement | null>, theme?: 'light' | 'dark') {
  const chartRef = shallowRef<ECharts | null>(null)
  let resizeObserver: ResizeObserver | null = null

  const initChart = () => {
    if (!domRef.value) return
    chartRef.value?.dispose()
    chartRef.value = echarts.init(domRef.value, theme) as unknown as ECharts
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => chartRef.value?.resize())
    resizeObserver.observe(domRef.value)
  }

  const setOptions = (options: EChartsOption) => {
    nextTick(() => {
      if (!domRef.value) return
      if (!chartRef.value) initChart()
      chartRef.value?.setOption(options, true)
    })
  }

  onUnmounted(() => {
    resizeObserver?.disconnect()
    chartRef.value?.dispose()
    chartRef.value = null
  })

  return { setOptions, getInstance: () => chartRef.value }
}
```

---

### 4.5 类型定义写法

#### ❌ 错误示范 (Anti-Pattern)

```typescript
// 在组件内内联定义类型，无法复用
const userInfo: { id: number; name: string; roles: any[] } = { ... }

// 使用 I 前缀命名接口（不符合本项目规范）
interface IUserInfo { ... }
```

#### ✅ 正确示范 (Best Practice)

```typescript
// src/types/auth/user.ts — 集中定义，统一导出
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email?: string
  roles?: string[]
  permissions?: string[]
}

export interface UserQuery {
  pageNo: number
  pageSize: number
  username?: string
  status?: boolean
}

export interface UserListResponse {
  data: UserInfo[]
  total: number
}
```

---

## 5. 目录结构规范 (Directory Structure)

<!-- RAG 锚点：项目目录、src 结构、文件夹组织、api 目录、stores 目录、types 目录、hooks 目录、components 组件、utils 工具函数、views 页面、文件命名规则、PascalCase camelCase、路径别名 @、代码分层架构 -->

```
├── api/            # API 调用层（按业务模块分目录）
│   └── auth/
│       ├── user.ts
│       └── menu.ts
├── assets/         # 静态资源（图片、全局 CSS）
├── components/     # 全局复用组件（PascalCase 命名）
├── constants/      # 业务常量（非 TS 枚举，用 const 导出）
├── directives/     # 自定义指令
├── enum/           # TypeScript 枚举（集中在 index.ts）
├── hooks/          # Composables（use 前缀命名）
│   └── common/
├── layout/         # 布局组件
├── locales/        # i18n 语言包
├── plugins/        # 第三方库初始化（Naive UI 等）
├── router/         # 路由配置
├── stores/         # Pinia Store（use 前缀 + Store 后缀）
├── theme/          # 主题配置
├── types/          # 全局 TS 类型（按模块分目录 + index.ts re-export）
├── utils/          # 工具函数（request、storage、constant 等）
└── views/          # 页面级组件
```

**命名约定**：

| 类型 | 命名规则 | 示例 |
|---|---|---|
| 组件文件 | PascalCase | `UserDropdown.vue` |
| Composable 文件 | camelCase，use 前缀 | `useEcharts.ts` |
| Store 文件 | camelCase | `user.ts`，导出函数 `useUserStore` |
| API 文件 | camelCase | `user.ts` |
| 类型文件 | camelCase | `user.ts`，内部 PascalCase interface |
| 枚举 | PascalCase | `SetupStoreId` |

---

## 6. Pinia Store 规范 (Pinia Store Standards)

<!-- RAG 锚点：Pinia、defineStore、Setup 风格、Options 风格、状态管理、getter、action、use 前缀、命名空间、SetupStoreId、$reset、持久化、localStorage、ls 工具、composable、响应式 ref、computed、watch、副作用隔离、effectScope -->

### 6.1 风格选择：必须使用 Setup 风格

项目**统一使用 Setup 风格**（组合式 API），**禁止使用 Options 风格**（state/getters/actions 三段式）。

```typescript
// ✅ 正确（Setup 风格）
export const useUserStore = defineStore(SetupStoreId.User, () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  const isLogin = computed(() => !!token.value)

  function setToken(value: string) { token.value = value }
  async function fetchUserInfo() { /* ... */ }

  return { token, userInfo, isLogin, setToken, fetchUserInfo }
})

// ❌ 禁止（Options 风格）
export const useUserStore = defineStore('user', {
  state: () => ({ token: '' }),
  getters: { isLogin: (s) => !!s.token },
  actions: { setToken(v) { this.token = v } }
})
```

### 6.2 Store ID 注册：必须从 `enum/SetupStoreId` 取

所有 Store ID 在 `src/enum/index.ts` 集中定义，**禁止在文件里写裸字符串 ID**。

```typescript
// src/enum/index.ts
export enum SetupStoreId {
  App = 'app',
  User = 'user',
  Theme = 'theme',
  Permission = 'permission',
  // ...
}

// ✅ 正确
export const useUserStore = defineStore(SetupStoreId.User, () => { ... })

// ❌ 禁止
export const useUserStore = defineStore('user', () => { ... })
```

### 6.3 文件命名与导出

- 文件名：`camelCase`，**不带 `Store` 后缀**（如 `user.ts`，不是 `userStore.ts`）
- 导出函数：`useXxxStore` 格式（camelCase + `use` 前缀 + `Store` 后缀）
- 内部状态接口：`XxxState`，仅在文件内使用，**不需要 export**

```typescript
// src/stores/user.ts
interface UserState {  // 文件内私有，不导出
  token: string | null
  userInfo: UserInfo | null
}

export const useUserStore = defineStore(SetupStoreId.User, () => { ... })
```

### 6.4 持久化规范

**禁止**在 Store 内部写 `localStorage.setItem / getItem`，**统一通过 `src/utils/stoarge.ts` 的 `ls` 工具**。

```typescript
import { ls } from '@/utils/stoarge'
import { TOKEN, USER_INFO } from '@/utils/constant'

// ✅ 正确
const token = ref<string>(ls.get(TOKEN) || '')
function setToken(value: string) {
  token.value = value
  ls.set(TOKEN, value)
}

// ❌ 禁止
function setToken(value: string) {
  token.value = value
  localStorage.setItem('token', value)  // 绕过 ls 工具，key 散落
}
```

**Key 常量统一在 `src/utils/constant.ts` 定义**，禁止在 store 文件里写裸字符串 key。

### 6.5 跨 Store 调用

跨 Store 调用**必须在函数内部 `useXxxStore()`**，**禁止在 setup 顶层直接调用**（避免 SSR/测试场景的副作用泄漏）。

```typescript
// ✅ 正确
export const useUserStore = defineStore(SetupStoreId.User, () => {
  function logout() {
    const permissionStore = usePermissionStore()  // 函数内部调用
    permissionStore.reset()
  }
  return { logout }
})

// ❌ 禁止
export const useUserStore = defineStore(SetupStoreId.User, () => {
  const permissionStore = usePermissionStore()  // 顶层调用，可能拿到未初始化的实例
})
```

### 6.6 复杂副作用：使用 `effectScope` 隔离

当 Store 内部需要注册 `watch` / `useEventListener` 等副作用，**用 `effectScope()` 包裹**并在 `onScopeDispose` 中清理。

```typescript
// src/stores/theme/index.ts
export const useThemeStore = defineStore(SetupStoreId.Theme, () => {
  const scope = effectScope()  // 隔离副作用
  const osTheme = usePreferredColorScheme()

  scope.run(() => {
    watch(darkMode, val => { /* ... */ }, { immediate: true })
    watch(themeColors, val => { /* ... */ }, { immediate: true })
  })

  onScopeDispose(() => { scope.stop() })  // 清理

  return { /* ... */ }
})
```

### 6.7 Return 顺序约定

Setup 风格 Store 内部 `return` 时按以下顺序：

1. **状态**（ref / reactive）
2. **计算属性**（computed）
3. **方法**（function）
4. **衍生值**（settingsJson 等序列化值）

```typescript
return {
  // 状态
  token, userInfo,
  // 计算
  isLogin, userMenus,
  // 方法
  setToken, setUserInfo, login, logout,
  // 衍生
  settingsJson,
}
```

---

## 7. Naive UI 使用规范 (Naive UI Standards)

<!-- RAG 锚点：Naive UI、naive-ui、n-config-provider、naiveTheme、create、局部注册、setupNaive、n-drawer、n-form、n-input、n-select、n-radio、n-tabs、n-descriptions、n-tag、n-badge、n-popover、n-tooltip、n-ellipsis、n-divider、n-pagination、n-spin、n-button、DAG workflow 节点、节点渲染、节点详情、节点配置、DAG 主题统一 -->

### 7.1 使用范围：**仅 DAG/Workflow 模块**

项目内 Naive UI **100% 集中在 `src/components/workflow/`**，用于 DAG 节点的渲染、配置 Drawer、详情面板。**禁止**在非 workflow 模块引入 Naive UI 组件，避免与 antd-vue 混用造成视觉割裂。

```typescript
// ✅ 正确：DAG 节点用 Naive UI
// src/components/workflow/modules/nodes/task-node.vue
<NPopover>...</NPopover>

// ❌ 禁止：普通业务页面用 Naive UI
// src/views/system/role.vue
<NInput />  // 应用 <a-input>
```

### 7.2 主题注入：必须 `n-config-provider` 包裹

App.vue 根级已注入 `themeStore.naiveTheme`（位于 `a-config-provider` 内层）。**所有 Naive UI 组件必须在该 provider 子树内使用**（即 App.vue 下的所有路由页面天然满足）。

```vue
<!-- App.vue 已有结构，不要修改 -->
<a-config-provider :locale="locale">
  <n-config-provider :theme="naiveTheme">
    <router-view />
  </n-config-provider>
</a-config-provider>
```

### 7.3 Provider 组件的注册

`src/plugins/naive.ts` 中 `create({ components: [...] })` 必须**显式列出 provider 组件**才能在模板里用：

```typescript
// src/plugins/naive.ts
import {
  NConfigProvider,           // ← 必须注册
  NLoadingBarProvider,       // ← 必须注册
  NMessageProvider,          // ← 必须注册
  NDialogProvider,           // ← 必须注册
  NNotificationProvider,     // ← 必须注册
  // 业务组件
  NButton, NDrawer, NForm, ...
} from 'naive-ui'

const naive = create({
  components: [NConfigProvider, NLoadingBarProvider, NMessageProvider,
               NDialogProvider, NNotificationProvider, /* 业务组件 */]
})
```

### 7.4 业务组件使用清单

**允许使用**的 Naive UI 组件（已注册）：

| 组件 | 用途 | 典型场景 |
|---|---|---|
| `NConfigProvider` / `NLoadingBarProvider` / `NMessageProvider` / `NDialogProvider` / `NNotificationProvider` | 主题注入 + 上下文 | App.vue |
| `NButton` | 按钮 | Drawer 底部操作 |
| `NDrawer` / `NDrawerContent` | 抽屉 | 节点配置面板 |
| `NForm` / `NFormItem` | 表单 | 节点配置 |
| `NInput` / `NSelect` / `NRadio` / `NRadioGroup` / `NInputNumber` | 表单控件 | 节点配置 |
| `NSpace` / `NGi` / `NGrid` | 布局 | 抽屉内布局 |
| `NTabs` / `NTabPane` | 标签页 | 节点详情切换 |
| `NDescriptions` / `NDescriptionsItem` | 描述列表 | 节点详情 |
| `NTag` / `NBadge` | 标签 / 徽标 | 节点状态 |
| `NPopover` / `NTooltip` | 气泡 / 提示 | 节点 hover |
| `NEllipsis` / `NDivider` | 省略 / 分割 | 节点信息 |
| `NPagination` / `NSpin` | 分页 / 加载 | 节点历史列表 |

**禁止使用**未注册的 Naive UI 组件（如 `NDataTable`、`NMessage` —— 后者必须用 composable 形式）。

### 7.5 Composable 的使用约束

`useDialog / useMessage / useNotification / useLoadingBar` 必须在 `n-*-provider` 子树内调用。当前项目**不存在这些调用**（grep 结果 0 匹配），**禁止**自行引入。

```typescript
// ❌ 禁止（如果未来需要，先确认 provider 已包裹 + composable 已在 setup 阶段调用）
import { useMessage } from 'naive-ui'
const message = useMessage()
message.success('xxx')  // 若不在 n-message-provider 子树内会抛错
```

### 7.6 样式覆盖

Naive UI 组件内部样式通过 `:deep()` 覆盖：

```vue
<style scoped>
.task-node :deep(.n-popover__trigger) {
  border-radius: 6px;
}
</style>
```

**禁止**用 `<style>`（非 scoped）覆盖 Naive UI 样式，会污染全局。

---

## 8. API 调用层规范 (API Call Layer Standards)

<!-- RAG 锚点：API 调用层、axios、request 工具、authRequest、actionCode、权限码、权限控制、HTTP 方法、URL 拼接、参数类型、响应类型、get post put delete、参数序列化、错误处理、auth 鉴权、TypeScript Promise、泛型、response data 包装 -->

### 8.1 文件组织

按**业务模块**分子目录，文件命名 `camelCase`：

```
src/api/
├── auth/          # 鉴权模块
│   ├── user.ts
│   ├── menu.ts
│   └── login.ts
├── job/           # 任务模块
├── mq/            # 消息队列模块
└── config.ts      # 通用配置接口
```

### 8.2 函数签名

**必须**显式标注参数类型和返回类型（虽然 ESLint 关闭了 `explicit-module-boundary-types`，但 API 层是项目规范中**强制要求**显式类型的少数场景之一）。

```typescript
// ✅ 正确
export function getUserList(query: UserQuery): Promise<UserListResponse> {
  return request.get('/api/v1/users', { params: query })
}

export function addUser(data: Partial<User>): Promise<User> {
  return request.post('/api/v1/users', data, { actionCode: 'system:user:add' })
}

// ❌ 禁止
export function getUserList(query) {  // 缺类型
  return request.get('/api/v1/users', { params: query })
}
```

### 8.3 Request 实例选择

根据是否需要鉴权选择实例：

| 实例 | 来源 | 用途 |
|---|---|---|
| `request` | `@/utils/request` | 通用接口 |
| `authRequest` | `@/utils/request` | 需要鉴权（业务模块默认用这个） |

```typescript
// ✅ 默认用 authRequest（自动带 token）
import { authRequest as request } from '@/utils/request'
export function getUserList(query: UserQuery): Promise<UserListResponse> {
  return request.get('/api/v1/users', { params: query })
}
```

### 8.4 权限码（actionCode）

**写操作**（POST/PUT/DELETE）必须传 `actionCode`，由后端鉴权。从 `usePermission` / 路由 meta 中获取，**禁止在 API 文件里硬编码**（除非是公开接口）。

```typescript
// ✅ 正确：从 permission 工具或常量取
request.post('/api/v1/users', data, { actionCode: 'system:user:add' })

// ⚠️ 例外：公开接口（登录、注册、忘记密码）不传 actionCode
request.post('/api/v1/auth/login', data)
```

### 8.5 类型导入

请求参数 / 响应类型从 `src/types/<模块>/` 导入，**禁止**在 API 文件中直接定义 interface：

```typescript
// ✅ 正确
import type { User, UserQuery, UserListResponse, LoginParams } from '@/types/auth'
import { authRequest as request } from '@/utils/request'

// ❌ 禁止
export function getUserList(query: any) { /* ... */ }  // 用 any 绕开类型
```

### 8.6 错误处理

**禁止**在 API 函数内部 `try/catch` —— 统一由 `request` 拦截器处理（自动弹 `message.error`）。API 函数只负责发请求。

```typescript
// ✅ 正确
export function deleteUser(id: number): Promise<void> {
  return request.delete(`/api/v1/users/${id}`)
}

// ❌ 禁止
export function deleteUser(id: number) {
  try {
    return request.delete(`/api/v1/users/${id}`)
  } catch (e) {
    message.error('删除失败')  // 拦截器已处理
  }
}
```

### 8.7 命名约定

| 操作 | 前缀 | HTTP 方法 | 示例 |
|---|---|---|---|
| 查询列表 | `getXxxList` | GET | `getUserList` |
| 查询单个 | `getXxxById` | GET | `getUserById` |
| 新增 | `addXxx` | POST | `addUser` |
| 更新 | `updateXxx` | PUT | `updateUser` |
| 删除 | `deleteXxx` | DELETE | `deleteUser` |
| 鉴权 | `login` / `logout` | POST | `login` |
| 自定义 | 业务动词 | 任意 | `registerUser` |
