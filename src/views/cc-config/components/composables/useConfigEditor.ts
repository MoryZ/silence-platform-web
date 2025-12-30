import { ref, watch, nextTick, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import monaco from '@/utils/monaco';

/**
 * Monaco 编辑器 Composable
 */
export function useConfigEditor() {
  let editorInstance: any = null;

  /**
   * 获取编辑器语言
   */
  const getLanguage = (formatType: number): string => {
    const languageMap: Record<number, string> = {
      1: 'yaml',
      2: 'properties',
      3: 'plaintext',
      4: 'json',
      5: 'xml'
    };
    return languageMap[formatType] || 'plaintext';
  };

  /**
   * 初始化编辑器
   */
  const initEditor = (
    container: HTMLElement,
    options: {
      value?: string;
      language?: string;
      readOnly?: boolean;
      onContentChange?: (value: string) => void;
    } = {}
  ): any => {
    if (!container) {
      console.error('Editor container not found');
      return null;
    }

    // 检查容器是否可见且有尺寸
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('Editor container has no size, retrying...');
      setTimeout(() => initEditor(container, options), 100);
      return null;
    }

    // 如果编辑器已存在，先清理
    if (editorInstance) {
      try {
        editorInstance.dispose();
      } catch (e) {
        console.warn('Error disposing editor:', e);
      }
      editorInstance = null;
    }

    try {
      // 确保 Monaco 已经加载
      if (!monaco || !monaco.editor) {
        console.error('Monaco Editor not loaded');
        message.error('编辑器未加载，请刷新页面重试');
        return null;
      }

      editorInstance = monaco.editor.create(container, {
        value: options.value || '',
        language: options.language || 'yaml',
        theme: 'vs-dark',
        readOnly: options.readOnly || false,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontSize: 14,
        wordWrap: 'on',
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
      });

      // 监听编辑器内容变化
      if (options.onContentChange) {
        editorInstance.onDidChangeModelContent(() => {
          if (editorInstance) {
            options.onContentChange!(editorInstance.getValue());
          }
        });
      }

      // 强制布局更新
      setTimeout(() => {
        if (editorInstance) {
          editorInstance.layout();
        }
      }, 100);

      return editorInstance;
    } catch (error) {
      console.error('Failed to initialize Monaco editor:', error);
      message.error('编辑器初始化失败，请刷新页面重试');
      return null;
    }
  };

  /**
   * 获取编辑器内容
   */
  const getValue = (): string => {
    return editorInstance ? editorInstance.getValue() : '';
  };

  /**
   * 设置编辑器内容
   */
  const setValue = (value: string) => {
    if (editorInstance) {
      editorInstance.setValue(value);
    }
  };

  /**
   * 更新编辑器语言
   */
  const setLanguage = (language: string) => {
    if (editorInstance) {
      monaco.editor.setModelLanguage(editorInstance.getModel()!, language);
    }
  };

  /**
   * 布局更新
   */
  const layout = () => {
    if (editorInstance) {
      editorInstance.layout();
    }
  };

  /**
   * 清理编辑器
   */
  const disposeEditor = () => {
    if (editorInstance) {
      try {
        editorInstance.dispose();
      } catch (e) {
        console.warn('Error disposing editor:', e);
      }
      editorInstance = null;
    }
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    disposeEditor();
  });

  return {
    initEditor,
    getValue,
    setValue,
    setLanguage,
    layout,
    disposeEditor,
    getLanguage,
    editorInstance: () => editorInstance,
  };
}
