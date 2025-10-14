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
        '^/auth/api/v1': {
          target: 'http://localhost:8096',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth\/api\/v1/, '/api/v1'),
        },
        '^/config/api/v1': {
          target: 'http://localhost:8097',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/config\/api\/v1/, '/api/v1'),
        },
        '^/job/api/v1': {
          target: 'http://localhost:8098',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/job\/api\/v1/, '/api/v1'),
        },
        '^/mq/api/v1': {
          target: 'http://localhost:8099',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mq\/api\/v1/, '/api/v1'),
        },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.worker']
  },
  build: {
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
    },
  },
}) 