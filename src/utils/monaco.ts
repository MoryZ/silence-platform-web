import * as monaco from 'monaco-editor';

// 在 Vite 中，使用 ?worker 后缀导入 worker
// 这样可以避免路径解析错误，Vite 会自动处理 worker 的加载
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// 配置 Monaco Editor 的 Worker（Vite 环境）
// 
// 根本原因：
// 1. Monaco Editor 明确要求必须定义 MonacoEnvironment.getWorker 或 getWorkerUrl
// 2. 使用 new URL('../../', import.meta.url) 会导致 Vite 路径解析错误
//
// 正确解决方案（Vite 环境）：
// 使用 Vite 的 ?worker 后缀导入 worker 文件
// Vite 会自动处理 worker 的路径和加载，避免手动构建 URL 导致的错误

if (typeof window !== 'undefined' && !(window as any).MonacoEnvironment) {
  (window as any).MonacoEnvironment = {
    // 使用 getWorker 函数，返回 Worker 实例
    // Monaco Editor 要求必须定义此函数，否则会报错
    getWorker: function (_workerId: string, label: string) {
      // 根据语言类型返回对应的 Worker 实例
      // 使用通过 ?worker 导入的 Worker 类来创建实例
      switch (label) {
        case 'json':
          return new jsonWorker();
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker();
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker();
        case 'typescript':
        case 'javascript':
          return new tsWorker();
        default:
          // 对于 yaml、plaintext、xml、properties 等语言，使用默认的 editor worker
          return new editorWorker();
      }
    },
  };
}

export default monaco;
