export interface TopicType {
  messageTypeList: string[];
  topicNameList: string[];
}

export interface TopicConfig {
  topicName: string;
  readQueueNums: number;
  writeQueueNums: number;
  perm: number;
  order: boolean;
  unit: boolean;
  hasUnitSubscription: boolean;
  brokerNameList: string[];
  clusterNameList: string[];
}

export interface TopicStats {
  offsetTable: Record<string, object>;
}

export interface TopicRouteData {
  orderTopicConf: string;
  queueData: {
    brokerName: string;
    readQueueNums: number;
    writeQueueNums: number;
    perm: number;
    topicSynFlag: number;
  }[];
  brokerDatas: {
    cluster: string;
    brokerName: string;
    brokerAddrs: Record<number, string>;
    zoneName: string;
    enableActingMaster: boolean;
  }[];
  filterServerTable: Record<string, string[]>;
  topicQueueMappingByBroker: Record<string, object>;
}

export interface CreateTopicRequest {
  topicName: string;
  readQueueNums: number;
  writeQueueNums: number;
  perm: number;
  order: boolean;
  unit: boolean;
  hasUnitSubscription: boolean;
  brokerNameList: string[];
  clusterNameList: string[];
}

export interface UpdateTopicRequest {
  brokerNameList: string[];
  clusterNameList: string[];
  messageType: string;
  topicName: string;
  readQueueNums: number;
  writeQueueNums: number;
  perm: number;
  order: boolean;
  unit: boolean;
  hasUnitSubscription: boolean;
}

export interface TopicConsumerInfo {
  topic: string;
  diffTotal: number;
  lastTimestamp: number;
  queueStatInfoList: QueueStatInfo[];
}

export interface QueueStatInfo {
  brokerName: string;
  queueId: number;
  brokerOffset: number;
  consumerOffset: number;
  clientInfo: string;
  lastTimestamp: number;
}

export interface TopicConfigInfo {
  clusterNameList: string[];
  brokerNameList: string[];
  topicName: string;
  writeQueueNums: number;
  readQueueNums: number;
  perm: number;
  order: boolean;
  messageType: string;
}

export interface MessageRequest {
  topic: string;
  tag: string;
  key: string;
  messageBody: string;
  traceEnabled: boolean;
}

export interface GroupList {
  groupList: string[];
}

export interface TopicInfo {
  topicList: string[];
  brokerAddr: string;
}

export interface ResetOffsetConfig {
  consumerGroupList: string[];
  topic: string;
  resetTime: number;
  force: boolean;
}