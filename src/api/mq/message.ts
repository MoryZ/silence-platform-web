import { Message, MessageQuery, MessagePageResult, MessageTrace, MessageTraceQuery } from '@/types/mq/message';
import { mqRequest as request } from '@/utils/request';
import { PaginationResult } from '@/types/mq/api';


// 查询消息
export const queryMessages = async (
  params: MessageQuery
): Promise<MessagePageResult> => {
  return await request.get('/api/v1/message/queryMessagePageByTopic', { params })
}

export interface MessageView {
  messageTrackList: []
  messageView: Message

}

// 根据messageId 和 topic查看消息详情
export const viewMessage = async (messageId: string, topic?: string): Promise<MessageView> => {
  return await request.get('/api/v1/message/viewMessage?msgId=' + messageId + '&topic=' + topic)
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
  return await request.get('/api/v1/message/messages/export', {
    params,
    responseType: 'blob'
  })
}

// 重发消息
export const resendMessage = async (messageId: string): Promise<void> => {
  return await request.post('/api/v1/message/message/resend', null, {
    params: { messageId }
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