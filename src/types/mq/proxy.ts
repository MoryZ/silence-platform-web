export interface ProxyNode {
  proxyAddr: string
  proxyName: string
  version: string
  status: 'ONLINE' | 'OFFLINE'
  startTime: number
  updateTime: number
}

export interface ProxyConfig {
  proxyName: string
  listenPort: number
  virtualHost: string
  accessLog: boolean
  mqMode: 'CLUSTER' | 'BROADCAST'
  threadPoolSize: number
  maxConns: number
  connectTimeout: number
  socketTimeout: number
  heartbeatInterval: number
  heartbeatTimeout: number
}

export interface ProxyStats {
  proxyAddr: string
  connections: number
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
  connectTime: number
  lastHeartbeat: number
  requestCount: number
}

export interface ProxyResponse {
  status: number
  errMsg?: string
  data?: any
} 