<template>
  <a-modal
    :visible="visible"
    :title="title"
    :width="1200"
    @update:visible="(val) => emit('update:visible', val)"
    @ok="handleOk"
    @cancel="handleCancel"
    :okButtonProps="{ disabled: readOnly }"
    ok-text="确定"
    cancel-text="取消"
  >
    <div class="split-container">
      <!-- 左侧编辑器 -->
      <div class="editor-container">
        <div class="editor-header">
          <span class="env-label" v-if="envName">环境：{{ envName }}</span>
        </div>
        <div ref="editorContainer" class="monaco-editor"></div>
      </div>

      <!-- 右侧发布历史 -->
      <div class="history-container">
        <div class="history-header">
          <h3>发布历史</h3>
          <!-- 时间过滤器 -->
          <div class="filter-section">
            <a-select v-model:value="timeFilter" style="width: 120px" @change="handleTimeFilterChange">
              <a-select-option value="1">最近一天</a-select-option>
              <a-select-option value="2">最近两天</a-select-option>
              <a-select-option value="7">最近一周</a-select-option>
              <a-select-option value="30">最近一月</a-select-option>
              <a-select-option value="90">最近三月</a-select-option>
              <a-select-option value="custom">自定义</a-select-option>
            </a-select>
            <a-range-picker
              v-if="timeFilter === 'custom'"
              v-model:value="dateRange"
              @change="handleDateRangeChange"
              :show-time="{ format: 'HH:mm' }"
              format="YYYY-MM-DD HH:mm"
            />
          </div>
        </div>
        <a-timeline class="history-timeline">
          <a-timeline-item 
            v-for="(history, index) in historyList" 
            :key="index"
            :color="history.id === selectedHistory?.id ? 'blue' : 'gray'"
          >
            <template #dot>
              <ClockCircleOutlined v-if="history.id === selectedHistory?.id" />
            </template>
            <div class="history-item" @click="handleHistoryClick(history)">
              <div class="history-info">
                <span class="history-time">{{ formatDate(history.createdDate) }}</span>
                <span class="history-user">{{ history.createdBy }}</span>
              </div>
              <div class="release-name">{{ history.releaseName }}</div>
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>

      <!-- 历史详情弹窗 -->
      <a-modal
        v-model:visible="showHistoryDetail"
        title="发布详情"
        :width="1000"
        :footer="null"
      >
        <div class="history-detail">
          <div class="detail-header">
            <h3>{{ selectedHistory?.releaseName }}</h3>
            <div class="detail-info">
              <p>发布人：{{ selectedHistory?.createdBy }}</p>
              <p>发布时间：{{ selectedHistory?.createdDate ? formatDate(selectedHistory.createdDate) : '无有效日期' }}</p>
            </div>
          </div>
          <div class="content-comparison">
            <div class="comparison-section">
              <h4>旧值</h4>
              <div ref="oldContentEditor" class="diff-editor"></div>
            </div>
            <div class="comparison-section">
              <h4>新值</h4>
              <div ref="newContentEditor" class="diff-editor"></div>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import * as monaco from 'monaco-editor';
import { ClockCircleOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

interface ReleaseHistory {
  id: number;
  releaseName: string;
  configItemId: number;
  oldContent: string;
  content: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  releaseType: number;
}

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  envName: {
    type: String,
    default: ''
  },
  historyList: {
    type: Array as () => ReleaseHistory[],
    default: () => []
  }
});

const emit = defineEmits(['update:visible', 'save', 'timeFilterChange']);

const editorContainer = ref<HTMLElement | null>(null);
const oldContentEditor = ref<HTMLElement | null>(null);
const newContentEditor = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let oldEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let newEditor: monaco.editor.IStandaloneCodeEditor | null = null;
const showHistoryDetail = ref(false);
const selectedHistory = ref<ReleaseHistory | null>(null);
const timeFilter = ref('7'); // 默认最近一周
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 格式化日期
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '';
};

// 处理时间过滤器变化
const handleTimeFilterChange = (value: string) => {
  if (value !== 'custom') {
    const end = dayjs();
    const start = end.subtract(Number(value), 'day');
    emit('timeFilterChange', {
      startDate: start.format('YYYY-MM-DD HH:mm:ss'),
      endDate: end.format('YYYY-MM-DD HH:mm:ss')
    });
  }
};

// 处理自定义日期范围变化
const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
  if (dates) {
    emit('timeFilterChange', {
      startDate: dates[0].format('YYYY-MM-DD HH:mm:ss'),
      endDate: dates[1].format('YYYY-MM-DD HH:mm:ss')
    });
  }
};

// 初始化编辑器
const initEditor = async () => {
  if (!editorContainer.value) return;

  // 配置 Monaco 编辑器
  editor = monaco.editor.create(editorContainer.value, {
    value: props.content,
    language: 'yaml',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    readOnly: props.readOnly,
    fontSize: 14,
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible'
    }
  });

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    if (editor) {
      const content = editor.getValue();
      console.log('Editor content changed:', content);
    }
  });
};

// 初始化差异编辑器
const initDiffEditors = async (oldContent: string, newContent: string) => {
  if (!oldContentEditor.value || !newContentEditor.value) return;

  if (oldEditor) {
    oldEditor.dispose();
  }
  if (newEditor) {
    newEditor.dispose();
  }

  // 初始化旧值编辑器
  oldEditor = monaco.editor.create(oldContentEditor.value, {
    value: oldContent,
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
  });

  // 初始化新值编辑器
  newEditor = monaco.editor.create(newContentEditor.value, {
    value: newContent,
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
  });
};

// 处理历史记录点击
const handleHistoryClick = (history: ReleaseHistory) => {
  selectedHistory.value = history;
  showHistoryDetail.value = true;
  nextTick(() => {
    initDiffEditors(history.oldContent, history.content);
  });
};

// 处理确认
const handleOk = () => {
  if (editor && !props.readOnly) {
    const content = editor.getValue();
    emit('save', content);
  }
  handleCancel();
};

// 处理取消
const handleCancel = () => {
  emit('update:visible', false);
  if (editor) {
    editor.dispose();
    editor = null;
  }
  if (oldEditor) {
    oldEditor.dispose();
    oldEditor = null;
  }
  if (newEditor) {
    newEditor.dispose();
    newEditor = null;
  }
  selectedHistory.value = null;
  showHistoryDetail.value = false;
};

// 监听可见性变化
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    await nextTick();
    initEditor();
  } else if (editor) {
    editor.dispose();
    editor = null;
  }
});

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (editor) {
    const currentContent = editor.getValue();
    if (currentContent !== newContent) {
      editor.setValue(newContent);
    }
  }
});

// 组件卸载时清理
onMounted(() => {
  if (props.visible) {
    nextTick(() => {
      initEditor();
    });
  }
});
</script>

<style lang="scss" scoped>
.split-container {
  display: flex;
  gap: 16px;
  height: 600px;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  
  .editor-header {
    padding: 8px;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    
    .env-label {
      font-weight: 500;
      color: var(--text-color);
    }
  }
  
  .monaco-editor {
    flex: 1;
    min-height: 500px;
  }
}

.history-container {
  width: 350px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  
  .history-header {
    padding: 12px;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    
    h3 {
      margin: 0 0 12px 0;
      color: var(--text-color);
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
  
  .history-timeline {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    .history-item {
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: rgba(var(--primary-color), 0.1);
      }
      
      .history-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        
        .history-time {
          color: var(--text-color-secondary);
          font-size: 12px;
        }
        
        .history-user {
          color: var(--primary-color);
          font-size: 12px;
        }
      }
      
      .release-name {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-color);
      }
    }
  }
}

.history-detail {
  .detail-header {
    margin-bottom: 20px;
    
    h3 {
      margin: 0 0 12px 0;
      color: var(--text-color);
      font-size: 18px;
    }
    
    .detail-info {
      display: flex;
      gap: 24px;
      
      p {
        margin: 0;
        color: var(--text-color-secondary);
      }
    }
  }
  
  .content-comparison {
    display: flex;
    gap: 20px;
    
    .comparison-section {
      flex: 1;
      
      h4 {
        margin: 0 0 8px 0;
        color: var(--text-color);
      }
      
      .diff-editor {
        height: 400px;
        border: 1px solid var(--border-color);
      }
    }
  }
}

.release-name {
  margin-top: 4px;
  font-size: 13px;
  color: var(--primary-color);
}

:deep(.ant-modal-body) {
  padding: 16px;
  overflow: hidden;
}

:deep(.ant-modal-footer) {
  border-top: 1px solid var(--border-color);
}

:deep(.ant-timeline-item) {
  padding-bottom: 20px;
}

:deep(.ant-timeline-item-content) {
  margin-left: 28px;
}
</style> 