/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 可以添加更多环境变量的类型声明
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 