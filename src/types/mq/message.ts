import type {PaginationQuery } from '@/types/mq/api'

export interface MessageView {
  queueId: number
  storeSize: number
  messageId: string
  topic: string
  storeTimestamp: number
  bornTimestamp: number
  bornHost: string
  storeHost: string
  reconsumeTimes: number
  msgType: string
  properties: Record<string, string>
  messageBody: string
  offset: number
}

export interface MessageQuery extends PaginationQuery {
  topic: string
  begin: number
  end: number
  taskId?: string
  messageId?: string
  key?: string
  tag?: string
}

export interface Message {
  msgId: string
  topic: string
  brokerName: string
  queueId: number
  queueOffset: number
  storeSize: number
  queueSize: number
  sysFlag: number
  bornTimestamp: number
  bornHost: string
  storeTimestamp: number
  storeHost: string
  commitLogOffset: number
  bodyCRC: number
  reconsumeTimes: number
  preparedTransactionOffset: number
  properties: Record<string, string>
  messageBody: string
  transactionId?: string
  transactionState?: string
}

export interface MessageTraceQuery extends PaginationQuery {
  topic: string
  begin: number
  end: number
  taskId?: string
  groupName?: string
  messageId?: string
  key?: string
  tag?: string
}

export interface MessageTrace {
  traceId: string
  topic: string
  msgId: string
  tags: string
  keys: string
  storeHost: string
  clientHost: string
  costTime: number
  status: string
  timestamp: number
  type: string
}

export interface MessagePageResult {
  page: MessagePageResultPage<Message>
  taskId: string
}

export interface MessagePageResultPage<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
}

export interface MessageViewResult {
  messageTrackList: any[]
  messageView: MessageView
}