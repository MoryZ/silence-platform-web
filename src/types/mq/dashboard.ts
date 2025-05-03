export interface ClusterMetrics {
  clusterName: string
  brokerCount: number
  topicCount: number
  consumerGroupCount: number
  totalMessageCount: number
  avgTps: number
  avgLatency: number
}

export interface TpsMetrics {
  timestamp: number
  putTps: number
  getTps: number
}

export interface TopicRanking {
  topic: string
  messageCount: number
  tps: number
}

export interface ConsumerRanking {
  groupName: string
  messageCount: number
  tps: number
  diffTotal: number
}

export interface BrokerMetrics {
  brokerAddr: string
  messageCount: number
  tps: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

export interface AlertMessage {
  id: number
  type: 'ERROR' | 'WARNING' | 'INFO'
  title: string
  content: string
  timestamp: number
  status: 'NEW' | 'READ'
}

export interface DashboardResponse {
  status: number
  errMsg?: string
  data?: any
} 