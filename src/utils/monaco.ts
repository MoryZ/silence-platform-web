import * as monaco from 'monaco-editor';

// 配置 Monaco Editor 的 worker
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId: string, label: string) {
    if (label === 'json') {
      return new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url).href;
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url).href;
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url).href;
    }
    if (label === 'typescript' || label === 'javascript') {
      return new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url).href;
    }
    return new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url).href;
  }
};

export default monaco;
