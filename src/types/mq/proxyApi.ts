export interface ProxyNode {
  proxyAddr: string;
  proxyName: string;
  version: string;
  status: 'ONLINE' | 'OFFLINE';
  startTime: number;
  updateTime: number;
  cpuUsage: number;
  memoryUsage: number;
  connectionCount: number;
  tps: number;
}

export interface ProxyConfig {
  proxyName: string;
  listenPort: number;
  virtualHost: string;
  accessLog: boolean;
  messageQueueMode: 'MEMORY' | 'FILE';
  threadPoolSize: number;
  sendMsgTimeout: number;
  compressMsgBodyOverHowmuch: number;
  retryTimesWhenSendFailed: number;
  retryAnotherBrokerWhenNotStoreOK: boolean;
  maxMessageSize: number;
}

export interface ProxyStats {
  proxyAddr: string;
  connectionCount: number;
  tps: number;
  requestCount: number;
  failureCount: number;
  avgLatency: number;
  maxLatency: number;
  cpuUsage: number;
  memoryUsage: number;
  threadCount: number;
}

export interface ProxyConnection {
  clientId: string;
  clientAddr: string;
  language: string;
  version: string;
  connectionTime: number;
  lastHeartbeat: number;
  requestCount: number;
}