export interface TopicData {
  topic: string;
  messageCount: number;
  tps: number;
}

export interface BrokerData {
  brokerAddr: string;
  messageCount: number;
  tps: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface ClusterData {
  clusterName: string;
  brokerCount: number;
  topicCount: number;
}