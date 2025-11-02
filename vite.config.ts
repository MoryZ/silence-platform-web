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
        target: 'http://115.190.196.117:9000', 
        changeOrigin: true,
      },
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
    cssMinify: 'esbuild', // 使用 esbuild CSS 压缩器
    rollupOptions: {
      output: {
        manualChunks: {
          jsonWorker: ['monaco-editor/esm/vs/language/json/json.worker'],
          cssWorker: ['monaco-editor/esm/vs/language/css/css.worker'],
          htmlWorker: ['monaco-editor/esm/vs/language/html/html.worker'],
          tsWorker: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
          editorWorker: ['monaco-editor/esm/vs/editor/editor.worker'],
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