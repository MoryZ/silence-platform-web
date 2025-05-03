export interface ClusterInfo {
  brokerAddr: string
  brokerName: string
  brokerId: number
  clusterName: string
  brokerVersion: string
  status: 'ONLINE' | 'OFFLINE'
  startTime: number
  updateTime: number
}

export interface BrokerStats {
  brokerAddr: string
  putTps: number
  putLatency: number
  getTps: number
  getLatency: number
  messageCount: number
  connectionCount: number
  topicCount: number
  consumerGroupCount: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

export interface TopicStats {
  topic: string
  brokerAddr: string
  queueCount: number
  messageCount: number
  tps: number
  avgMsgSize: number
  lastUpdateTime: number
}

export interface ConsumerGroupStats {
  groupName: string
  brokerAddr: string
  consumeType: 'PULL' | 'PUSH'
  messageModel: 'CLUSTERING' | 'BROADCASTING'
  consumeTps: number
  diffTotal: number
  lastTimestamp: number
}

export interface ConsumerStats {
  groupName: string
  consumeTps: number
  messageCount: number
  onlineInstances: number
  totalInstances: number
  delayTime: number
}

export interface OpsMetrics {
  clusterName: string
  brokerCount: number
  topicCount: number
  consumerGroupCount: number
  totalMessageCount: number
  avgTps: number
  avgLatency: number
}

export interface OpsResponse {
  status: number
  errMsg?: string
  data?: any
} 