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

/**
 * 时间序列数据点 [timestamp, value]
 */
export type TimeSeriesDataPoint = [number, string];

/**
 * Topic 时间序列数据
 */
export interface TopicTimeSeriesData {
  [topicName: string]: TimeSeriesDataPoint[];
}

/**
 * Broker 时间序列数据
 */
export interface BrokerTimeSeriesData {
  [brokerAddr: string]: TimeSeriesDataPoint[];
}

/**
 * Dashboard API 泛型响应封装
 */
export interface DashboardResponse<T = unknown> {
  code: number;
  data?: T;
  message?: string | null;
} 