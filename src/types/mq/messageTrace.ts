import type { MessageView } from './message'

export interface MessageDetail {
    messageView: MessageView[]
  }
  
  export interface MessageTraceGraph {
    producerNode: ProducerNode
    subscriptionNodeList: SubscriptionNode[]
    messageTraceViews: MessageTraceView[]
  }
  
  export interface ProducerNode {
    mesId: string
    tags: string
    keys: string
    offSetMsgId: string
    topic: string
    groupName?: string
    traceNode: TraceNode
    transactionNodeList: TraceNode[]
  }
  
  export interface SubscriptionNode {
    subscriptionGroup: string
    consumeNodeList: TraceNode[]
  }
  
  export interface TraceNode {
    requestId: string
    storeHost: string
    clientHost: string
    costTime: number
    beginTimestamp: number
    endTimestamp: number
    retryTimes?: number
    status: string
    transactionState: string
    transactionId: string
    fromTransactionCheck: boolean
    msgType: string
  }
  
  export interface MessageTraceView {
    requestId: string
    msgId: string
    tags: string
    keys: string
    storeHost: string
    clientHost: string
    costTime: number
    msgType: string
    offSetMsgId: string
    timestamp: number
    topic: string
    groupName?: string
    retryTimes?: number
    status: string
    transactionState: string
    transactionId: string
    fromTransactionCheck: boolean
    traceType: 'Pub' | 'SubBefore' | 'SubAfter'
  }