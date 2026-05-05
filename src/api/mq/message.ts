import type { Message, MessageQuery, MessagePageResult, MessageTrace, MessageTraceQuery, MessageView, MessageViewResult } from '@/types/mq/message';
import { mqRequest as request } from '@/utils/request';
import type { PaginationResult } from '@/types/mq/api';


// 查询消息
export const queryMessages = async (
  params: MessageQuery
): Promise<MessagePageResult> => {
  const response = await request.get('/api/v1/message/queryMessagePageByTopic', { params }) as any

  const wrapped = response && typeof response === 'object' ? response : {}
  const root = wrapped?.data && typeof wrapped.data === 'object' ? wrapped.data : wrapped
  const pageRaw = root?.page && typeof root.page === 'object' ? root.page : {}

  const content = Array.isArray(pageRaw?.content)
    ? pageRaw.content
    : Array.isArray(pageRaw?.data)
      ? pageRaw.data
      : []

  const totalElements = typeof pageRaw?.totalElements === 'number'
    ? pageRaw.totalElements
    : typeof pageRaw?.total === 'number'
      ? pageRaw.total
      : 0

  const number = typeof pageRaw?.number === 'number'
    ? pageRaw.number
    : Math.max((params.pageNo || 1) - 1, 0)

  const size = typeof pageRaw?.size === 'number'
    ? pageRaw.size
    : (params.pageSize || 20)

  const totalPages = typeof pageRaw?.totalPages === 'number'
    ? pageRaw.totalPages
    : (size > 0 ? Math.ceil(totalElements / size) : 0)

  return {
    taskId: typeof root?.taskId === 'string' ? root.taskId : '',
    page: {
      content,
      number,
      size,
      totalElements,
      totalPages
    }
  }
}

// 根据messageId 和 topic查看消息详情
export const viewMessage = async (messageId: string, topic?: string): Promise<MessageViewResult> => {
  const response = await request.get('/api/v1/message/viewMessage?msgId=' + messageId + '&topic=' + topic) as any

  const wrapped = response && typeof response === 'object' ? response : {}
  const root = wrapped?.data && typeof wrapped.data === 'object' ? wrapped.data : wrapped
  const rawMessageView = root?.messageView && typeof root.messageView === 'object' ? root.messageView : {}

  const normalizedMessageView: MessageView = {
    queueId: Number(rawMessageView?.queueId ?? 0),
    queueOffset: Number(rawMessageView?.queueOffset ?? 0),
    storeSize: Number(rawMessageView?.storeSize ?? 0),
    messageId: String(rawMessageView?.messageId ?? rawMessageView?.msgId ?? ''),
    topic: String(rawMessageView?.topic ?? topic ?? ''),
    storeTimestamp: Number(rawMessageView?.storeTimestamp ?? 0),
    bornTimestamp: Number(rawMessageView?.bornTimestamp ?? 0),
    bornHost: String(rawMessageView?.bornHost ?? ''),
    storeHost: String(rawMessageView?.storeHost ?? ''),
    reconsumeTimes: Number(rawMessageView?.reconsumeTimes ?? 0),
    sysFlag: Number(rawMessageView?.sysFlag ?? 0),
    commitLogOffset: Number(rawMessageView?.commitLogOffset ?? 0),
    bodyCRC: Number(rawMessageView?.bodyCRC ?? 0),
    preparedTransactionOffset: Number(rawMessageView?.preparedTransactionOffset ?? 0),
    flag: Number(rawMessageView?.flag ?? 0),
    msgType: String(rawMessageView?.msgType ?? ''),
    properties: {
      ...(rawMessageView?.properties && typeof rawMessageView.properties === 'object' ? rawMessageView.properties : {}),
      ...(rawMessageView?.keys ? { KEYS: String(rawMessageView.keys) } : {}),
      ...(rawMessageView?.tags ? { TAGS: String(rawMessageView.tags) } : {})
    },
    messageBody: String(rawMessageView?.messageBody ?? rawMessageView?.body ?? ''),
    offset: Number(rawMessageView?.offset ?? 0)
  }

  return {
    messageTrackList: Array.isArray(root?.messageTrackList) ? root.messageTrackList : [],
    messageView: normalizedMessageView
  }
}

// 根据key 和 topic 查消息
export const findByKeyAndTopic = async (key: string, topic?: string): Promise<Message[]> => {
  return await request.get('/api/v1/message/queryMessageByTopicAndKey?key=' + key + '&topic=' + topic)
}
// 查询消息轨迹
export const queryMessageTraces = async (
  params: MessageTraceQuery
): Promise<PaginationResult<MessageTrace>> => {
  return await request.get('/api/v1/message/traces', { params })
}

// 导出消息
export const exportMessages = async (params: MessageQuery): Promise<Blob> => {
  return await request.get('/api/v1/message/export', {
    params,
    responseType: 'blob'
  })
}


// 直接触发消费（消息详情中的 Resend Message）
export const consumeMessageDirectly = async (params: {
  consumerGroup: string
  topic: string
  msgId: string
  clientId?: string
}): Promise<any> => {
  return await request.post('/api/v1/message/consumeMessageDirectly', null, {
    params
  })
}

// 工具函数：格式化消息属性
export const formatMessageProperties = (properties: Record<string, string>): string => {
  return Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

// 工具函数：格式化时间戳
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

// 工具函数：格式化消息大小
export const formatMessageSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

// 工具函数：格式化消息状态
export const formatMessageStatus = (status: string): string => {
  switch (status) {
    case 'COMMIT':
      return '已提交'
    case 'ROLLBACK':
      return '已回滚'
    case 'UNKNOWN':
      return '未知'
    default:
      return status
  }
}

// 工具函数：格式化消息类型
export const formatMessageType = (type: string): string => {
  switch (type) {
    case 'Normal':
      return '普通消息'
    case 'Trans':
      return '事务消息'
    case 'Delay':
      return '延时消息'
    default:
      return type
  }
} 