import { ref, onUnmounted, computed } from 'vue';
import type { JobMessage, WebSocketStatus } from '@/types/websocket';

export interface UseWebSocketLogReturn {
  logList: ReturnType<typeof ref<JobMessage[]>>;
  status: ReturnType<typeof ref<WebSocketStatus>>;
  isConnected: ReturnType<typeof computed<boolean>>;
  finished: ReturnType<typeof ref<boolean>>;
  connect: (taskBatchId?: string | number, taskId?: string | number) => void;
  disconnect: () => void;
  clear: () => void;
}

function generateSid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function useWebSocketLog(): UseWebSocketLogReturn {
  const logList = ref<JobMessage[]>([]);
  const finished = ref(false);
  const status = ref<WebSocketStatus>('disconnected');
  let ws: WebSocket | null = null;

  const updateStatus = (s: WebSocketStatus) => {
    status.value = s;
    console.log('[WS] Status:', s);
  };

  const connect = (taskBatchId?: string | number, taskId?: string | number) => {
    const sid = generateSid();
    const url = `ws://127.0.0.1:8098/websocket?sid=${sid}&scene=JOB_LOG_SCENE`;
    
    console.log('[WS] Connecting to:', url);
    console.log('[WS] taskBatchId:', taskBatchId, 'taskId:', taskId);
    
    // 关闭旧连接
    if (ws) {
      ws.close();
    }

    finished.value = false;
    logList.value = [];
    updateStatus('connecting');

    try {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('[WS] Connected!');
        updateStatus('connected');
        
        // 发送查询消息
        const msg = JSON.stringify({
          taskBatchId: taskBatchId,
          taskId: taskId
        });
        console.log('[WS] Sending:', msg);
        ws?.send(msg);
      };

      ws.onmessage = (event) => {
        console.log('[WS] Received:', event.data);
        
        const data = event.data.trim();
        
        // END 信号
        if (data === '"END"' || data === 'END') {
          finished.value = true;
          console.log('[WS] Finished');
          return;
        }
        
        // 解析 JSON 日志
        try {
          const parsed = JSON.parse(data);
          console.log('[WS] Parsed:', parsed);
          
          // 检查是否有日志字段
          if (parsed && (parsed.time_stamp || parsed.message || parsed.level)) {
            const msg: JobMessage = {
              index: parsed.index || logList.value.length,
              key: `${parsed.time_stamp || Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              level: parsed.level || 'INFO',
              host: parsed.host || '',
              port: parsed.port || '',
              location: parsed.location || '',
              message: parsed.message || parsed.msg || '',
              thread: parsed.thread || '',
              time_stamp: parsed.time_stamp || '',
              throwable: parsed.throwable || ''
            };
            logList.value.push(msg);
            console.log('[WS] Added to list, total:', logList.value.length);
          }
        } catch (e) {
          console.log('[WS] Not JSON or invalid:', data);
        }
      };

      ws.onerror = (e) => {
        console.error('[WS] Error:', e);
        updateStatus('error');
      };

      ws.onclose = () => {
        console.log('[WS] Closed');
        updateStatus('disconnected');
      };
    } catch (e) {
      console.error('[WS] Failed to connect:', e);
      updateStatus('error');
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    updateStatus('disconnected');
  };

  const clear = () => {
    logList.value = [];
    finished.value = false;
  };

  const isConnected = computed(() => status.value === 'connected');

  onUnmounted(() => {
    disconnect();
  });

  return {
    logList,
    status,
    isConnected,
    finished,
    connect,
    disconnect,
    clear
  };
}
