import type { WebSocketScene } from '@/types/websocket';

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 初始化 WebSocket URL
 * @param scene 场景类型
 * @param sid 会话 ID（可选，默认自动生成）
 * @returns WebSocket URL
 */
export function initWebSocketUrl(scene: WebSocketScene, sid?: string): string {
  const sessionId = sid ?? generateRandomString(32);
  
  // 直接连接到后端服务器，绕过 Vite 代理
  // 开发环境：连接 http://127.0.0.1:9900
  // 生产环境：使用当前域名
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // 开发环境直接连接 job 服务 8098
  const host = import.meta.env.DEV ? '127.0.0.1:8098' : window.location.host;
  const url = `${wsProtocol}//${host}/websocket?sid=${sessionId}&scene=${scene}`;
  
  // eslint-disable-next-line no-console
  console.log('[WebSocket] Generated URL:', url);
  return url;
}

/**
 * 生成任务日志 WebSocket URL
 */
export function getJobLogWebSocketUrl(sid?: string): string {
  return initWebSocketUrl('JOB_LOG_SCENE', sid);
}
