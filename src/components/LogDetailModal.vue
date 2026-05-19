<template>
  <a-modal
    :open="visible"
    :title="null"
    :width="modalWidth"
    :footer="null"
    @cancel="handleClose"
    class="log-detail-modal"
    :bodyStyle="{ padding: 0, height: '70vh', display: 'flex', flexDirection: 'column' }"
  >
    <!-- 自定义头部 -->
    <div class="log-header">
      <div class="header-left">
        <span class="status-dot" :class="statusClass"></span>
        <span class="header-title">{{ title }}</span>
      </div>
      <div class="header-right">
        <a-tooltip title="刷新">
          <a-button type="text" @click="handleRefresh" :loading="loading" class="header-btn">
            <template #icon><ReloadOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip :title="autoScroll ? '关闭自动滚动' : '开启自动滚动'">
          <a-button type="text" @click="toggleAutoScroll" class="header-btn" :class="{ 'active': autoScroll }">
            <template #icon><VerticalAlignBottomOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-divider type="vertical" style="margin: 0 4px;" />
        <a-tooltip title="全屏">
          <a-button type="text" @click="toggleFullscreen" class="header-btn">
            <template #icon>
              <FullscreenOutlined v-if="!isFullscreen" />
              <FullscreenExitOutlined v-else />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="关闭">
          <a-button type="text" @click="handleClose" class="header-btn">
            <template #icon><CloseOutlined /></template>
          </a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- 日志内容区域 -->
    <div class="log-content" ref="logContentRef">
      <template v-if="loading">
        <div class="loading-wrapper">
          <a-spin size="large" />
          <span style="margin-top: 12px; color: #999;">加载中...</span>
        </div>
      </template>
      <template v-else-if="logLines.length">
        <div 
          v-for="(line, idx) in logLines" 
          :key="idx" 
          class="log-line"
          :class="getLineClass(line)"
        >
          <span class="log-time">{{ line.time }}</span>
          <span class="log-level" :class="`level-${line.level?.toLowerCase()}`">{{ line.level }}</span>
          <span class="log-location">{{ line.location }}</span>
          <span class="log-message">{{ line.message }}</span>
        </div>
      </template>
      <template v-else>
        <div class="empty-wrapper">
          <InboxOutlined style="font-size: 48px; color: #ccc;" />
          <span style="margin-top: 12px; color: #999;">暂无日志</span>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { 
  ReloadOutlined, 
  CloseOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined,
  VerticalAlignBottomOutlined,
  InboxOutlined 
} from '@ant-design/icons-vue';

interface Props {
  visible: boolean;
  title?: string;
  content?: string;
  loading?: boolean;
  status?: number;
}

interface LogLine {
  time: string;
  level: string;
  location: string;
  message: string;
  raw: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '日志详情',
  content: '',
  loading: false,
  status: undefined
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'refresh': [];
}>();

const logContentRef = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
const isFullscreen = ref(false);
const modalWidth = ref(1000);

// 状态样式
const statusClass = computed(() => {
  switch (props.status) {
    case 2: return 'status-running';
    case 3: return 'status-success';
    case 4: return 'status-error';
    case 5: return 'status-stopped';
    case 6: return 'status-cancelled';
    default: return 'status-default';
  }
});

// 解析日志内容
const logLines = ref<LogLine[]>([]);

const parseLogContent = (content: any): LogLine[] => {
  if (!content) return [];
  
  try {
    let arr: any[] = [];
    
    // 解析数据
    if (typeof content === 'string') {
      const parsed = JSON.parse(content);
      arr = Array.isArray(parsed) ? parsed : [parsed];
    } else if (Array.isArray(content)) {
      arr = content;
    } else {
      arr = [content];
    }
    
    return arr.map((item: any) => {
      const time = item.time_stamp ? formatTimestamp(item.time_stamp) : '';
      const level = item.level || '';
      const location = item.location || '';
      const message = item.message || '';
      
      return { time, level, location, message, raw: item };
    });
  } catch {
    // 如果解析失败，直接返回原内容作为一条日志
    return [{ time: '', level: '', location: '', message: String(content), raw: content }];
  }
};

// 时间戳格式化
const formatTimestamp = (ts: string | number): string => {
  try {
    const num = Number(ts);
    if (num > 1e12) {
      return new Date(num).toLocaleTimeString('zh-CN', { hour12: false });
    } else if (num > 1e9) {
      return new Date(num * 1000).toLocaleTimeString('zh-CN', { hour12: false });
    }
    return String(ts);
  } catch {
    return String(ts);
  }
};

// 获取行样式类
const getLineClass = (line: LogLine): string => {
  const level = line.level?.toLowerCase();
  if (level === 'error' || level === 'err' || level === 'fatal') return 'line-error';
  if (level === 'warn' || level === 'warning') return 'line-warn';
  if (level === 'debug') return 'line-debug';
  return '';
};

// 刷新
const handleRefresh = () => {
  emit('refresh');
};

// 切换自动滚动
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value) {
    scrollToBottom();
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (logContentRef.value) {
      logContentRef.value.scrollTop = logContentRef.value.scrollHeight;
    }
  });
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  modalWidth.value = isFullscreen.value ? '100vw' : 1000;
};

// 关闭
const handleClose = () => {
  emit('update:visible', false);
};

// 监听内容变化
watch(() => props.content, (newContent) => {
  logLines.value = parseLogContent(newContent);
  if (autoScroll.value) {
    scrollToBottom();
  }
}, { immediate: true });

// 监听自动滚动
watch(autoScroll, (newVal) => {
  if (newVal) {
    scrollToBottom();
  }
});

// 监听打开状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    logLines.value = parseLogContent(props.content);
    nextTick(() => scrollToBottom());
  }
});
</script>

<style scoped>
.log-detail-modal :deep(.ant-modal-content) {
  padding: 0;
  overflow: hidden;
}

.log-detail-modal :deep(.ant-modal-close) {
  display: none;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-running { background: #1677ff; animation: pulse 1.5s infinite; }
.status-success { background: #52c41a; }
.status-error { background: #ff4d4f; }
.status-stopped { background: #8c8c8c; }
.status-cancelled { background: #fa8c16; }
.status-default { background: #666; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-btn {
  color: #999 !important;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-btn.active {
  color: #52c41a !important;
}

.header-right :deep(.ant-divider) {
  border-color: #333;
}

.log-content {
  flex: 1;
  overflow: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.8;
  padding: 8px 0;
}

.log-line {
  display: flex;
  padding: 2px 16px;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-line.line-error {
  background: rgba(255, 77, 79, 0.1);
  color: #ff7875;
}

.log-line.line-warn {
  background: rgba(250, 140, 22, 0.1);
  color: #ffc53d;
}

.log-line.line-debug {
  color: #8c8c8c;
}

.log-time {
  color: #6e6e6e;
  margin-right: 8px;
  min-width: 80px;
}

.log-level {
  font-weight: 600;
  margin-right: 8px;
  min-width: 50px;
}

.level-info { color: #4ec9b0; }
.level-warn, .level-warning { color: #dcdcaa; }
.level-error, .level-fatal { color: #f14c4c; font-weight: 700; }
.level-debug { color: #6e6e6e; }

.log-location {
  color: #9cdcfe;
  margin-right: 8px;
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-message {
  flex: 1;
  color: #d4d4d4;
}

.loading-wrapper,
.empty-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 200px;
}

/* 滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
