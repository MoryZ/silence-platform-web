<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="800"
    :footer="null"
    @cancel="handleClose"
    class="json-viewer-modal"
  >
    <div class="json-viewer-content">
      <div v-if="loading" class="loading-wrapper">
        <a-spin />
      </div>
      <template v-else>
        <div class="toolbar" v-if="isJson">
          <a-space>
            <a-button size="small" @click="formatJson">
              <template #icon><FormatPainterOutlined /></template>
              格式化
            </a-button>
            <a-button size="small" @click="copyContent">
              <template #icon><CopyOutlined /></template>
              复制
            </a-button>
          </a-space>
        </div>
        <pre ref="contentRef" class="content-pre" :class="{ 'is-json': isJson, 'is-text': !isJson }">{{ displayContent }}</pre>
      </template>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { FormatPainterOutlined, CopyOutlined } from '@ant-design/icons-vue';

interface Props {
  visible: boolean;
  title?: string;
  content?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '查看详情',
  content: '',
  loading: false
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const contentRef = ref<HTMLElement | null>(null);
const isFormatted = ref(true);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parsedJson = ref<any>(null);
const isJson = ref(false);

// 检测是否为JSON
const detectJson = (str: string): boolean => {
  if (!str) return false;
  const trimmed = str.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

// 格式化JSON
const formatJson = () => {
  isFormatted.value = !isFormatted.value;
};

// 复制内容
const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
};

const displayContent = computed(() => {
  if (!props.content) return '';
  
  if (isJson.value) {
    try {
      if (isFormatted.value) {
        return JSON.stringify(JSON.parse(props.content), null, 2);
      } else {
        return props.content;
      }
    } catch {
      return props.content;
    }
  }
  
  return props.content;
});

watch(() => props.content, (newContent) => {
  if (newContent) {
    isJson.value = detectJson(newContent);
    isFormatted.value = true;
  } else {
    isJson.value = false;
  }
}, { immediate: true });

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    isFormatted.value = true;
  }
});

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
.json-viewer-modal :deep(.ant-modal-body) {
  padding: 0;
}

.json-viewer-content {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.content-pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.content-pre.is-json {
  background: #f5f5f5;
  color: #333;
}

.content-pre.is-text {
  background: #1e1e1e;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
