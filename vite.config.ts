import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '^/(auth|config|job|mq)/api/v1': {
        target: 'http://localhost:9000', 
        changeOrigin: true
      }
    },
  },
  optimizeDeps: {
    include: ['monaco-editor']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // 使用现代 API 避免 legacy-js-api 警告
        silenceDeprecations: ['legacy-js-api'], // 静默 legacy-js-api 弃用警告
      },
      less: {
        // Less 配置
        javascriptEnabled: true,
      },
    },
  },
  build: {
    cssMinify: 'lightningcss', // 使用 lightningcss 以完整支持 CSS 嵌套
    chunkSizeWarningLimit: 4000, // 避免已拆分后仍因 Monaco/Ant Design 大包触发告警
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 monaco-editor 的 worker 文件单独打包
          if (id.includes('monaco-editor/esm/vs/language/json/json.worker')) {
            return 'json-worker'
          }
          if (id.includes('monaco-editor/esm/vs/language/css/css.worker')) {
            return 'css-worker'
          }
          if (id.includes('monaco-editor/esm/vs/language/html/html.worker')) {
            return 'html-worker'
          }
          if (id.includes('monaco-editor/esm/vs/language/typescript/ts.worker')) {
            return 'ts-worker'
          }
          if (id.includes('monaco-editor/esm/vs/editor/editor.worker')) {
            return 'editor-worker'
          }
          // 将 monaco-editor 主包单独打包
          if (id.includes('monaco-editor')) {
            return 'monaco-editor'
          }
          // 将 node_modules 中的大型依赖单独打包
          if (id.includes('node_modules')) {
            if (id.includes('echarts')) {
              return 'echarts'
            }
            if (id.includes('ant-design-vue')) {
              return 'ant-design-vue'
            }
            if (id.includes('naive-ui')) {
              return 'naive-ui'
            }
            // 其他 node_modules 依赖
            return 'vendor'
          }
        },
      },
      onwarn(warning, warn) {
        // 忽略 CSS 嵌套规则的警告（这些是已知的 esbuild CSS 压缩器警告，不影响功能）
        if (warning.message && warning.message.includes('nested style rule cannot start with')) {
          return
        }
        warn(warning)
      },
    },
  },
}) 