import request from '../../utils/request';

export interface ClusterStats {
  clusterName: string
  brokerCount: number
  topicCount: number
  consumerGroupCount: number
  totalMessageCount: number
  avgTps: number
  avgLatency: number
}

export interface BrokerStats {
  brokerAddr: string
  brokerName: string
  brokerId: number
  messageCount: number
  tps: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  putLatency: number
  getLatency: number
  status: 'ONLINE' | 'OFFLINE'
}

export interface TopicStats {
  topic: string
  messageCount: number
  tps: number
  avgMessageSize: number
  lastUpdateTime: number
}

export interface ConsumerStats {
  groupName: string
  messageCount: number
  tps: number
  diffTotal: number
  lastConsumeTime: number
}

// 获取集群统计信息
export const queryClusterStats = async (): Promise<ClusterStats> => {
  return await request.get('/api/v1/ops/cluster/stats')
}

// 获取Broker统计信息
export const queryBrokerStats = async (): Promise<BrokerStats[]> => {
  return await request.get('/api/v1/ops/broker/stats')
}

// 获取Topic统计信息
export const queryTopicStats = async (): Promise<TopicStats[]> => {
  return await request.get('/api/v1/ops/topic/stats')
}

// 获取消费者统计信息
export const queryConsumerStats = async (): Promise<ConsumerStats[]> => {
  return await request.get('/api/v1/ops/consumer/stats')
}

// 获取历史统计数据
export const queryHistoryStats = async (params: {
  type: 'cluster' | 'broker' | 'topic' | 'consumer'
  name?: string
  begin: number
  end: number
}): Promise<any[]> => {
  return await request.get('/api/v1/ops/history/stats', { params })
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

// 工具函数：格式化消息大小
export const formatMessageSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

// 工具函数：格式化Broker状态
export const formatBrokerStatus = (status: string): string => {
  switch (status) {
    case 'ONLINE':
      return '在线'
    case 'OFFLINE':
      return '离线'
    default:
      return status
  }
} 