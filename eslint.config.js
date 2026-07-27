// ESLint v9 flat config
// 规范详见 CODE_STYLE.md
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/ignores',
    ignores: [
      'dist/**', 'node_modules/**',
      // JSX/TSX 语法的 .vue 文件，ESLint 解析器无法处理，vite build 正常
      'src/components/workflow/modules/drawer/task-drawer.vue',
      'src/views/job/home/modules/task-tab.vue',
    ],
  },
  {
    name: 'app/files-lint',
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
  },
  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  {
    rules: {
      // ========== 项目代码规范补充（基于 CODE_STYLE.md）==========

      // 1. 路径别名：禁止 src/ 内部使用相对路径（必须用 @/ 别名）
      //    详见 CODE_STYLE.md §1.5
      'no-restricted-imports': ['warn', {
        patterns: [
          {
            group: ['../*', '../../*', '../../../*', '../../../../*'],
            message: 'src/ 内禁止使用相对路径，必须使用 @/ 别名（详见 CODE_STYLE.md §1.5）',
          },
        ],
      }],

      // 2. 色值规范：禁止在 JS/TS 中硬编码十六进制色值
      //    详见 CODE_STYLE.md §3.2
      //    备注：早期版本曾禁止运行时 defineProps/defineEmits，因存量 112 处
      //          改动量大且 IDE 类型推导已足够，2026-07-01 决策改为 off（B-7c 折中）。
      //          新代码推荐用 TS 泛型接口（CODE_STYLE.md §2.4），CI 不阻塞。
      'no-restricted-syntax': ['warn', {
        selector: "Literal[value=/^#[0-9a-fA-F]{6}$/]",
        message: '禁止在 JS/TS 中硬编码十六进制色值，应使用 var(--xxx) 或主题 token（详见 CODE_STYLE.md §3.2）',
      }],

      // 3. 调试残留：
      //    - console.log/info/debug 全禁（生产不应有调试日志）
      //    - console.error/warn 允许（运行时诊断有价值）
      //    - dev 阶段 warn / prod 阶段 error
      'no-console': [process.env.NODE_ENV === 'production' ? 'error' : 'warn', {
        allow: ['warn', 'error'],
      }],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

      // 4. 未使用变量：忽略 _ 前缀（约定表示故意未用）
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // 5. 组件命名：关闭 multi-word-component-names
      //    项目页面组件命名跟路由 URL 走（如 /login → Login.vue, /system/user → user.vue），
      //    不是可复用组件库，multi-word 约束不适用。
      //    可复用组件在 src/components/ 下已自觉用多词命名（如 ColumnSettings、SettingsDrawer）。
      //    2026-07-01 决策：B-8 关闭规则。
      'vue/multi-word-component-names': 'off',
    },
  },
  // 备注：早期版本曾对 src/api/ + src/stores/ 强制 explicit-module-boundary-types，
  //       因项目已统一用 request<T>() 泛型包装返回类型，强加显式标注是冗余，
  //       故关闭该规则（2026-06-30 决策：B-3 选项 A）。
  //       详见 CODE_STYLE.md §8.2。
  {
    // 全量关闭 @typescript-eslint/no-explicit-any（2026-06-30 决策：B-5 选项 A）。
    // 原因：项目存量 708 处 any 跨 11 个目录、8 种语法场景（catch 66 / param 145 /
    //       varDecl 107 / interfaceProp 106 / generic 72 / any[] 64 / rest 209 / typeAlias 2），
    //       强行 unknown 替换会大面积破坏类型推断，零成本方案是关掉。
    //       新代码建议遵循 CODE_STYLE.md §1.7 自觉规避 any，CI 留 lint:vue 自查但不阻塞。
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // app.ts 是色值源头（applyTheme 内部 cssVars 字面量），
    // 本身就在向 :root 注入十六进制色，不应被 hex 规则拦
    files: ['src/stores/app.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // 主题系统也是色值源头：setting.ts 定义 token 默认色值，
    // shared.ts 管理主题色值注入逻辑
    files: ['src/stores/theme/**/*.ts', 'src/theme/setting.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // business.ts 定义业务状态色值常量（status color / operation reason color 等），
    // 这些色值通过 JS 数据传给 <a-tag :color> 或 echarts series，
    // 不适合用 var(--xxx)（因为它们不是"主题色"，而是"数据语义色"）。
    // 加 eslint-disable-next-line 太冗余（25 处），直接在规则层面豁免。
    files: ['src/constants/business.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // shims-vue.d.ts 是 Vue 官方类型声明模板，{} 是标准写法，不应修改
    files: ['src/types/shims-vue.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    // SideMenu.vue catch 块内设置 menuError 是必要的副作用（错误边界），
    // 拆成 watch 会引入不必要的复杂度
    files: ['src/components/SideMenu.vue'],
    rules: {
      'vue/no-side-effects-in-computed-properties': 'off',
    },
  },
  {
    // 含 JSX/TSX 语法的 .vue 文件，ESLint TS 解析器无法完整解析 JSX，
    // 在 vite build 中正常通过（vue-jsx 插件处理），仅在 lint 阶段跳过相关规则
    files: [
      'src/components/workflow/modules/drawer/task-drawer.vue',
      'src/views/job/home/modules/task-tab.vue',
    ],
    rules: {
      'vue/block-lang': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
