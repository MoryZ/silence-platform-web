export interface GroupConsumeInfo {
  group: string
  version: string
  count: number
  consumeType: ConsumerType
  messageModel: MessageModel
  address: string[]
  consumeTps: number
  diffTotal: number
  subGroupType: 'NORMAL' | 'SYSTEM' | 'FIFO'
}


export enum ConsumerType {
  CONSUME_ACTIVELY = "PULL",
  CONSUME_PASSIVELY = "PUSH",
  CONSUME_POP = "POP"
}

export enum MessageModel {
  BROADCASTING = "BROADCASTING",
  CLUSTERING = "CLUSTERING"
}

export interface ConsumerGroupRollBackStat {
  status: boolean
  errorMsg: string
  rollbackStatsList: RollbackStats[]
}

export interface RollbackStats {
  brokerName: string
  queueId: number
  brokerOffset: number
  consumerOffset: number
  timestampOffset: number
  rollbackOffset: number
}

export interface ConsumerConfigInfo {
  clusterNameList: string[]
  brokerNameList: string[]
  subscriptionGroupConfig: SubscriptionGroupConfig
}

export interface DeleteSubGroupRequest {
  groupName: string
  brokerNameList: string[]
}

export interface SubscriptionGroupConfig {
  groupName: string
  consumeEnable: boolean
  consumeFromMinEnable: boolean
  consumeBroadcastEnable: boolean
  retryQueueNums: number
  retryMaxTimes: number
  brokerId: number
  whichBrokerWhenConsumeSlowly: number
  notifyConsumerIdsChangedEnable: boolean
  groupSysFlag: number
  consumeTimeoutMinute: number
}


export interface ConsumerConnection {
  connectionSet: {
    clientId: string
    clientAddr: string
    language: string
    versionDesc: string
  }[]
  subscriptionTable: Record<string, {
    subString: string
  }>
  consumeType: ConsumeType
  messageModel: string
  address: string[]
  consumeTps: number
  diffTotal: number
  subGroupType: 'NORMAL' | 'SYSTEM' | 'FIFO'
}

export enum ConsumeType {
  CONSUME_ACTIVELY = "PULL",
  CONSUME_PASSIVELY = "PUSH",
  CONSUME_POP = "POP"
}

export interface ConsumerRunningInfo {
  properties: Record<string, string>
  subscriptionSet: Record<string, string>
  mqTable: Record<string, string>
  mqPopTable:  Record<string, string>
  statusTable:  Record<string, string>
  userConsumerInfo:  Record<string, string>
  jstack: string
}

