import { number } from "echarts"

export interface TopicData {
  topic: string
  isSys: boolean
}

export interface TopicConfig {
  topicName: string
  writeQueueNums: number
  readQueueNums: number
  perm: number
  messageType: MessageType
  clusterNameList?: string[]
  brokerNameList?: string[]
}

export enum MessageType {
  NORMAL = 'NORMAL',
  FIFO = 'FIFO',
  DELAY = 'DELAY',
  TRANSACTION = 'TRANSACTION',
  UNSPECIFIED = 'UNSPECIFIED'
}

export interface ConsumerData {
  [consumerGroup: string]: {
    count: number
    messageModel: string
    consumeType: string
    consumeFromWhere: string
    diff: number
    lastTimestamp: number
    version: string
  }
}

export interface SendResult {
  msgId: string
  sendStatus: string
  queueId: number
  queueOffset: number
}

export interface ResetOffsetConfig {
   consumerGroupList: string[];
   topic: string
   resetTime: number
   force: boolean
}