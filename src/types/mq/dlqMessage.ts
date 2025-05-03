import type { MessageView } from './message'

export interface DLQMessageQuery {
  topic: string
  consumerGroup: string
  begin: number
  end: number
  beginTime?: string
  endTime?: string
  messageId?: string
}

export interface DLQMessagePage {
  pageNum: number
  pageSize: number
  total: number
  messages: MessageView[]
}

export interface ResendDLQMessageRequest {
  topicName: string
  consumerGroup: string
  msgId: string
  clientId?: number
}

export interface ConsumerGroupInfo {
  groupName: string
  count: number
  messageModel: string
  consumeType: string
  version: string
} 
