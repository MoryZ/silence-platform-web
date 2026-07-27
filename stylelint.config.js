/**
 * Stylelint 配置
 *
 * 适用项目代码规范（详见 CODE_STYLE.md）：
 *  - 颜色统一为 #1677ff 主题色（暗色模式通过 var()）
 *  - 圆角统一为 4/6/8/9999px 四档（var(--radius-*)）
 *  - 样式文件全部使用 kebab-case
 *  - 单位：0 不带单位，其他数值带单位
 *
 * 使用：项目已锁定 sass 1.86（无需额外配置）
 * 安装命令（未自动装）：npm i -D stylelint stylelint-config-standard stylelint-config-recommended-vue postcss-html
 */
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue/scss',
  ],
  // 允许 SCSS 嵌套语法
  customSyntax: 'postcss-scss',
  overrides: [
    {
      // .vue 文件中的 <style lang="scss"> 块
      files: ['**/*.vue', '**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    // ===== 基于 CODE_STYLE.md 颜色规范 =====
    // 禁止硬编码十六进制色值（除 #000 / #fff / transparent / inherit / currentColor / unset）
    // 应使用 var(--xxx) 或主题 token
    'color-no-hex': [true, {
      ignore: ['#000', '#fff'],  // 黑白是中性色，允许
    }],

    // 禁止 rgb() / rgba() 数字写法（统一用 var 或 hex）
    'color-function-notation': 'legacy',

    // ===== 基于 CODE_STYLE.md 圆角规范 =====
    // 圆角统一为 4 档：4px/6px/8px/9999px
    // 允许：4px / 6px / 8px / 9999px / 50% / 0 / 复合（4 段） / 2px / 3px / 10px / 12px / 16px / 20px
    'declaration-property-value-disallowed-list': {
      '/^border-radius/': [
        '/^(?!.*\\b(4px|6px|8px|9999px|50%|0|2px|3px|10px|12px|16px|20px)\\b).*$/',
      ],
    },

    // ===== 项目级 CSS 规范 =====
    // 类名统一 kebab-case
    'selector-class-pattern': 'kebab-case',
    // 缩进 2 空格
    indentation: 2,
    // 引号统一双引号
    'string-quotes': 'double',
    // 0 不带单位
    'length-zero-no-unit': true,
    // 不允许未知的伪类（防止手误）
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['deep', 'global', 'slotted'],  // Vue scoped 必需
    }],
    // 允许 SCSS 嵌套
    'no-descending-specificity': null,  // 嵌套中容易触发，关闭
    // 允许 id 选择器（项目内 antd 覆盖偶尔需要）
    'selector-max-id': null,
  },
  ignoreFiles: [
    'dist/**',
    'node_modules/**',
    '**/*.min.css',
  ],
}
