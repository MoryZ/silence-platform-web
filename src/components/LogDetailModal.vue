<template>
  <a-drawer
    :open="visible"
    :width="isFullscreen ? '100%' : drawerWidth"
    :footer="null"
    :closable="false"
    class="log-drawer"
    @close="handleClose"
  >
    <template #title>
      <div class="drawer-header">
        <div class="header-left">
          <!-- 状态指示 -->
          <span v-if="finished" class="status-indicator success">
            <CheckCircleOutlined />
          </span>
          <a-spin v-else size="small" class="loading-indicator" />
          <span class="header-title">{{ title }}</span>
        </div>
        <div class="header-right">
          <!-- 刷新按钮 -->
          <a-tooltip title="刷新">
            <a-button type="text" @click="handleRefresh" :loading="loading" class="header-btn">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
          
          <!-- 自动滚动切换 -->
          <a-tooltip :title="isAutoScroll ? '关闭自动滚动' : '开启自动滚动'">
            <a-button type="text" @click="toggleAutoScroll" class="header-btn" :class="{ 'active': isAutoScroll }">
              <template #icon>
                <SyncOutlined v-if="isAutoScroll" :spin="isAutoScroll" />
                <VerticalAlignBottomOutlined v-else />
              </template>
            </a-button>
          </a-tooltip>
          
          <!-- 全屏/半屏切换 -->
          <a-tooltip :title="isFullscreen ? '半屏' : '全屏'">
            <a-button type="text" @click="toggleFullscreen" class="header-btn">
              <template #icon>
                <FullscreenExitOutlined v-if="isFullscreen" />
                <FullscreenOutlined v-else />
              </template>
            </a-button>
          </a-tooltip>
          
          <!-- 关闭按钮 -->
          <a-tooltip title="关闭">
            <a-button type="text" @click="handleClose" class="header-btn">
              <template #icon><CloseOutlined /></template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </template>
    
    <!-- 日志内容区域 -->
    <div class="log-content" ref="logContentRef">
      <!-- WebSocket 连接状态指示 -->
      <div v-if="enableWebSocket && wsStatus !== 'disconnected'" class="ws-status-bar">
        <a-tag v-if="wsStatus === 'connected'" color="success">
          <template #icon><span class="ws-dot"></span></template>
          实时连接中
        </a-tag>
        <a-tag v-else-if="wsStatus === 'connecting'" color="processing">连接中...</a-tag>
        <a-tag v-else-if="wsStatus === 'error'" color="error">连接失败</a-tag>
      </div>
      
      <template v-if="loading && mergedLogList.length === 0">
        <div class="loading-wrapper">
          <a-spin size="large" />
          <span class="loading-text">日志加载中...</span>
        </div>
      </template>
      
      <template v-else-if="mergedLogList.length === 0 && isFinished">
        <div class="empty-wrapper">
          <InboxOutlined class="empty-icon" />
          <span class="empty-text">暂无日志</span>
        </div>
      </template>
      
      <template v-else>
        <div class="log-list">
          <div
            v-for="item in mergedLogList"
            :key="item.key"
            class="log-item"
          >
            <!-- 日志头部信息 -->
            <div class="log-header-row">
              <span class="log-time">{{ formatTimestamp(item.time_stamp) }}</span>
              <span class="log-level" :class="`level-${item.level}`">{{ item.level }}</span>
              <span class="log-host">[{{ item.host }}:{{ item.port }}]</span>
              <span class="log-thread">[{{ item.thread }}]</span>
            </div>
            
            <!-- 位置信息 -->
            <div class="log-location">{{ item.location }}:</div>
            
            <!-- 消息内容 -->
            <div class="log-message-wrapper">
              <template v-if="item.message && item.message.includes('\n')">
                <a-collapse>
                  <a-collapse-panel :key="item.key + '-msg'" :header="getFirstLine(item.message)">
                    <pre class="message-content">{{ getRestContent(item.message) }}</pre>
                  </a-collapse-panel>
                </a-collapse>
              </template>
              <template v-else>
                <div class="log-message">- {{ item.message }}</div>
              </template>
            </div>
            
            <!-- 异常堆栈 -->
            <template v-if="item.throwable">
              <div class="log-throwable-wrapper">
                <a-collapse>
                  <a-collapse-panel :key="item.key + '-throw'" :header="getFirstLine(item.throwable)">
                    <pre class="throwable-content">{{ item.throwable }}</pre>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </template>
            
            <a-divider class="log-divider" />
          </div>
        </div>
      </template>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { 
  ReloadOutlined, 
  CloseOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined,
  VerticalAlignBottomOutlined,
  SyncOutlined,
  InboxOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue';
import { generateRandomString } from '@/utils/common';
import { useWebSocketLog } from '@/hooks/useWebSocketLog';
import type { JobMessage } from '@/types/websocket';

interface Props {
  visible: boolean;
  title?: string;
  taskBatchId?: string | number;
  taskId?: string | number;
  status?: number;
  loading?: boolean;
  /** 是否启用 WebSocket 实时日志 */
  enableWebSocket?: boolean;
  /** 是否自动连接 WebSocket */
  autoConnect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '日志详情',
  taskBatchId: undefined,
  taskId: undefined,
  status: undefined,
  loading: false,
  enableWebSocket: true,
  autoConnect: true
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'refresh': [];
  'websocketConnected': [];
  'websocketDisconnected': [];
  'websocketError': [error: Event];
}>();

// WebSocket 日志
const {
  logList: wsLogList,
  status: wsStatus,
  isConnected: wsIsConnected,
  finished: wsFinished,
  connect: wsConnect,
  disconnect: wsDisconnect
} = useWebSocketLog({
  maxRetries: 3,
  retryInterval: 1000,
  onError: (error) => {
    emit('websocketError', error);
  }
});

// 合并日志列表：优先使用 WebSocket 日志，否则使用外部传入的日志
const mergedLogList = computed<JobMessage[]>(() => {
  return wsLogList.value.length > 0 ? wsLogList.value : logList.value;
});

const drawerWidth = ref(800);
const isFullscreen = ref(true);
const isAutoScroll = ref(true);
const finished = ref(true);
const logContentRef = ref<HTMLElement | null>(null);

// 日志列表
const logList = ref<JobMessage[]>([]);

// 计算属性：是否已完成（优先使用 WebSocket 的状态）
const isFinished = computed(() => {
  if (props.enableWebSocket && wsLogList.value.length > 0) {
    return wsFinished.value;
  }
  return finished.value;
});

// 格式化时间戳
function formatTimestamp(timestamp: string | number): string {
  if (!timestamp) return '';
  try {
    const date = new Date(Number.parseInt(String(timestamp), 10));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  } catch {
    return String(timestamp);
  }
}

// 获取第一行
function getFirstLine(text: string): string {
  if (!text) return '';
  const match = text.match(/^.+$/m);
  return match ? match[0] : text.substring(0, 100);
}

// 获取剩余内容
function getRestContent(text: string): string {
  if (!text) return '';
  return text.replace(/^.+(\n|$)/m, '').replace(/\n/g, '\n - ');
}

// 刷新
const handleRefresh = () => {
  logList.value = [];
  finished.value = false;
  if (props.enableWebSocket) {
    // 使用 WebSocket 时，重新连接以获取新日志
    wsConnect(props.taskBatchId, props.taskId);
  }
  emit('refresh');
};

// 切换自动滚动
function toggleAutoScroll() {
  isAutoScroll.value = !isAutoScroll.value;
  if (isAutoScroll.value) {
    scrollToBottom();
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (logContentRef.value) {
      logContentRef.value.scrollTop = logContentRef.value.scrollHeight;
    }
  });
}

// 切换全屏
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

// 关闭
function handleClose() {
  // 断开 WebSocket 连接
  if (props.enableWebSocket) {
    wsDisconnect();
  }
  emit('update:visible', false);
}

// 设置日志列表（供父组件调用）
function setLogList(messages: any[]) {
  if (Array.isArray(messages)) {
    messages.forEach((msg: any) => {
      msg.key = `${msg.time_stamp}-${generateRandomString(16)}`;
      logList.value.push(msg);
    });
    
    if (isAutoScroll.value) {
      scrollToBottom();
    }
  }
}

// 标记日志加载完成
function setFinished() {
  finished.value = true;
}

// 清空日志
function clearLog() {
  logList.value = [];
  wsLogList.value = [];
  finished.value = false;
  wsFinished.value = false;
}

// 暴露方法给父组件
defineExpose({
  setLogList,
  setFinished,
  clearLog,
  // WebSocket 控制方法
  connect: wsConnect,
  disconnect: wsDisconnect,
  isConnected: wsIsConnected,
  status: wsStatus
});

// 监听 visible 变化，自动连接/断开 WebSocket
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    // 关闭时清空日志并断开连接
    logList.value = [];
    finished.value = true;
    if (props.enableWebSocket) {
      wsDisconnect();
    }
  } else {
    // 打开时，如果有 taskBatchId 且启用了 WebSocket，自动连接
    if (props.enableWebSocket && props.autoConnect && (props.taskBatchId || props.taskId)) {
      wsConnect(props.taskBatchId, props.taskId);
    }
  }
});

// 监听任务参数变化
watch([() => props.taskBatchId, () => props.taskId], ([newBatchId, newTaskId]) => {
  // 如果已连接且参数变化，重新连接
  if (props.visible && props.enableWebSocket && props.autoConnect && (newBatchId || newTaskId)) {
    wsConnect(newBatchId, newTaskId);
  }
});

// 监听 WebSocket 状态变化
watch(wsStatus, (newStatus) => {
  if (newStatus === 'connected') {
    emit('websocketConnected');
  } else if (newStatus === 'disconnected' || newStatus === 'error') {
    emit('websocketDisconnected');
  }
});

// 监听自动滚动
watch(isAutoScroll, (newVal) => {
  if (newVal) {
    scrollToBottom();
  }
});

// 监听 WebSocket 日志变化，自动滚动
watch(() => wsLogList.value.length, () => {
  if (isAutoScroll.value) {
    scrollToBottom();
  }
});
</script>

<style scoped>
.log-drawer :deep(.ant-drawer-body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.status-indicator.success {
  color: #52c41a;
}

.loading-indicator {
  margin-right: 0;
}

.ws-status-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(30, 31, 34, 0.95);
  padding: 8px 16px;
  border-bottom: 1px solid #333;
}

.ws-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52c41a;
  margin-right: 6px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn {
  color: #666 !important;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn:hover {
  color: #1677ff !important;
  background: rgba(22, 119, 255, 0.08) !important;
}

.header-btn.active {
  color: #52c41a !important;
}

.log-content {
  flex: 1;
  overflow: auto;
  background: #1e1f22;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #ffffffe6;
}

.loading-wrapper,
.empty-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 400px;
}

.loading-text,
.empty-text {
  margin-top: 12px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  color: #666;
}

.log-list {
  padding: 8px 16px;
}

.log-item {
  margin-bottom: 4px;
}

.log-header-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 4px;
}

.log-time {
  color: #2db7f5;
  min-width: 200px;
}

.log-level {
  font-weight: 600;
  min-width: 60px;
}

.level-DEBUG { color: #2647cc; }
.level-INFO { color: #5c962c; }
.level-WARN { color: #da9816; }
.level-ERROR { color: #dc3f41; }

.log-host,
.log-thread {
  color: #00a3a3;
}

.log-location {
  color: #a771bf;
  margin-bottom: 4px;
  padding-left: 8px;
}

.log-message-wrapper {
  padding-left: 8px;
}

.log-message {
  color: #ffffffe6;
  white-space: pre-wrap;
  word-break: break-word;
  padding-left: 8px;
}

.log-throwable-wrapper {
  margin-top: 4px;
  padding-left: 8px;
}

.message-content,
.throwable-content {
  background: #2d2d2d;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 13px;
  color: #ffffffe6;
  max-height: 200px;
  overflow: auto;
}

.log-divider {
  margin: 12px 0;
  border-color: #333;
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

/* Collapse 样式覆盖 */
:deep(.ant-collapse) {
  background: transparent;
  border: none;
}

:deep(.ant-collapse-item) {
  border: none;
}

:deep(.ant-collapse-header) {
  color: #ffffffe6 !important;
  padding: 4px 0 !important;
}

:deep(.ant-collapse-content) {
  background: transparent;
  border-top: none;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}

:deep(.ant-divider) {
  margin: 12px 0;
}
</style>
