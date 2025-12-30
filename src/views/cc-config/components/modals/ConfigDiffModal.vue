<template>
  <a-modal
    :open="open"
    :title="`配置比较 - ${namespaceId}`"
    :footer="null"
    :width="1200"
    :mask-closable="true"
    @cancel="handleClose"
    @update:open="emit('update:open', $event)"
  >
    <div class="compare-result">
      <div class="compare-header">
        <div class="compare-info">
          <div class="info-item">
            <span class="label">源环境:</span>
            <span class="value">{{ sourceEnvName }}</span>
          </div>
          <div class="info-item">
            <span class="label">目标环境:</span>
            <span class="value">{{ targetEnvName }}</span>
          </div>
        </div>
      </div>
      
      <div class="diff-container">
        <div class="diff-editor-wrapper">
          <div class="editor-title">{{ sourceEnvName }}</div>
          <div ref="leftEditorContainer" class="diff-editor"></div>
        </div>
        <div class="diff-editor-wrapper">
          <div class="editor-title">{{ targetEnvName }}</div>
          <div ref="rightEditorContainer" class="diff-editor"></div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import monaco from '@/utils/monaco';

interface Props {
  open: boolean;
  sourceEnvName: string;
  targetEnvName: string;
  namespaceId: string;
  leftContent: string;
  rightContent: string;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const leftEditorContainer = ref<HTMLElement | null>(null);
const rightEditorContainer = ref<HTMLElement | null>(null);

let leftEditor: any = null;
let rightEditor: any = null;

// 初始化差异编辑器
const initDiffEditors = () => {
  // 清理旧的编辑器实例
  if (leftEditor) {
    leftEditor.dispose();
    leftEditor = null;
  }
  if (rightEditor) {
    rightEditor.dispose();
    rightEditor = null;
  }
  
  if (!leftEditorContainer.value || !rightEditorContainer.value) {
    console.error('Diff editor containers not found');
    return;
  }
  
  try {
    // 创建左侧编辑器（源配置）
    leftEditor = monaco.editor.create(leftEditorContainer.value, {
      value: props.leftContent,
      language: 'yaml',
      theme: 'vs-dark',
      readOnly: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      wordWrap: 'on',
    });
    
    // 创建右侧编辑器（目标配置）
    rightEditor = monaco.editor.create(rightEditorContainer.value, {
      value: props.rightContent,
      language: 'yaml',
      theme: 'vs-dark',
      readOnly: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      wordWrap: 'on',
    });
    
    // 同步滚动
    leftEditor.onDidScrollChange(() => {
      if (rightEditor && leftEditor) {
        const scrollTop = leftEditor.getScrollTop();
        rightEditor.setScrollTop(scrollTop);
      }
    });
    
    rightEditor.onDidScrollChange(() => {
      if (leftEditor && rightEditor) {
        const scrollTop = rightEditor.getScrollTop();
        leftEditor.setScrollTop(scrollTop);
      }
    });
  } catch (error) {
    console.error('Failed to initialize diff editors:', error);
    message.error('差异编辑器初始化失败');
  }
};

// 监听弹窗打开状态
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    setTimeout(() => {
      initDiffEditors();
    }, 100);
  } else {
    if (leftEditor) {
      leftEditor.dispose();
      leftEditor = null;
    }
    if (rightEditor) {
      rightEditor.dispose();
      rightEditor = null;
    }
  }
});

// 处理关闭
const handleClose = () => {
  emit('update:open', false);
};

// 组件卸载时清理
onUnmounted(() => {
  if (leftEditor) {
    leftEditor.dispose();
  }
  if (rightEditor) {
    rightEditor.dispose();
  }
});
</script>

<style lang="scss" scoped>
.compare-result {
  .compare-header {
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
    
    .compare-info {
      display: flex;
      gap: 24px;
      
      .info-item {
        display: flex;
        gap: 8px;
        
        .label {
          font-weight: 500;
          color: #666;
        }
        
        .value {
          color: #1890ff;
        }
      }
    }
  }
  
  .diff-container {
    display: flex;
    gap: 16px;
    height: 500px;
    
    .diff-editor-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      overflow: hidden;
      
      .editor-title {
        padding: 8px 12px;
        background-color: #fafafa;
        border-bottom: 1px solid #d9d9d9;
        font-weight: 500;
        color: #333;
      }
      
      .diff-editor {
        flex: 1;
        min-height: 0;
      }
    }
  }
}
</style>
