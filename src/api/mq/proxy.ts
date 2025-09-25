import { mqRequest as request } from '@/utils/request';

export interface ProxyNode {
  proxyAddr: string
  proxyName: string
  version: string
  status: 'ONLINE' | 'OFFLINE'
  startTime: number
  updateTime: number
  cpuUsage: number
  memoryUsage: number
  connectionCount: number
  tps: number
}

export interface ProxyConfig {
  proxyName: string
  listenPort: number
  virtualHost: string
  accessLog: boolean
  messageQueueMode: 'MEMORY' | 'FILE'
  threadPoolSize: number
  sendMsgTimeout: number
  compressMsgBodyOverHowmuch: number
  retryTimesWhenSendFailed: number
  retryAnotherBrokerWhenNotStoreOK: boolean
  maxMessageSize: number
}

export interface ProxyStats {
  proxyAddr: string
  connectionCount: number
  tps: number
  requestCount: number
  failureCount: number
  avgLatency: number
  maxLatency: number
  cpuUsage: number
  memoryUsage: number
  threadCount: number
}

export interface ProxyConnection {
  clientId: string
  clientAddr: string
  language: string
  version: string
  connectionTime: number
  lastHeartbeat: number
  requestCount: number
}

// 获取代理节点列表
export const queryProxyList = async (): Promise<ProxyNode[]> => {
  return await request.get('/api/v1/proxy/list')
}

// 获取代理配置
export const queryProxyConfig = async (proxyAddr: string): Promise<ProxyConfig> => {
  return await request.get('/api/v1/proxy/config', {
    params: { proxyAddr }
  })
}

// 更新代理配置
export const updateProxyConfig = async (
  proxyAddr: string,
  config: ProxyConfig
): Promise<void> => {
  return await request.post('/api/v1/proxy/config', config, {
    params: { proxyAddr }
  })
}

// 获取代理统计信息
export const queryProxyStats = async (proxyAddr: string): Promise<ProxyStats> => {
  return await request.get('/api/v1/proxy/stats', {
    params: { proxyAddr }
  })
}

// 获取代理连接信息
export const queryProxyConnections = async (
  proxyAddr: string
): Promise<ProxyConnection[]> => {
  return await request.get('/api/v1/proxy/connections', {
    params: { proxyAddr }
  })
}

// 工具函数：格式化时间戳
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

// 工具函数：格式化TPS
export const formatTps = (tps: number): string => {
  return `${tps.toFixed(2)}/s`
}

// 工具函数：格式化延迟
export const formatLatency = (latency: number): string => {
  return `${latency.toFixed(2)}ms`
}

// 工具函数：格式化百分比
export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// 工具函数：格式化代理状态
export const formatProxyStatus = (status: string): string => {
  switch (status) {
    case 'ONLINE':
      return '在线'
    case 'OFFLINE':
      return '离线'
    default:
      return status
  }
}

// 工具函数：格式化消息队列模式
export const formatQueueMode = (mode: string): string => {
  switch (mode) {
    case 'MEMORY':
      return '内存模式'
    case 'FILE':
      return '文件模式'
    default:
      return mode
  }
} 