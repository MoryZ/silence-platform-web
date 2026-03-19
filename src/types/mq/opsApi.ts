export interface ClusterStats {
  clusterName: string;
  brokerCount: number;
  topicCount: number;
  consumerGroupCount: number;
  totalMessageCount: number;
  avgTps: number;
  avgLatency: number;
}

export interface BrokerStats {
  brokerAddr: string;
  brokerName: string;
  brokerId: number;
  messageCount: number;
  tps: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  putLatency: number;
  getLatency: number;
  status: 'ONLINE' | 'OFFLINE';
}

export interface TopicStats {
  topic: string;
  messageCount: number;
  tps: number;
  avgMessageSize: number;
  lastUpdateTime: number;
}

export interface ConsumerStats {
  groupName: string;
  messageCount: number;
  tps: number;
  diffTotal: number;
  lastConsumeTime: number;
}

export interface HistoryStatsParams {
  type: 'cluster' | 'broker' | 'topic' | 'consumer';
  name?: string;
  begin: number;
  end: number;
}

/**
 * 历史统计数据点 - 时间序列数据
 * 格式: [timestamp, value1, value2, ...]
 */
export type HistoryStatsDataPoint = number[];

/**
 * 历史统计数据 - 按资源名称分组的时间序列
 */
export interface HistoryStats {
  [resourceName: string]: HistoryStatsDataPoint[];
}