import request from '../../utils/request';
import { MessageDetail, MessageTraceView, MessageTraceGraph } from '@/types/mq/messageTrace';


// 查询消息轨迹

export const viewTraceMessage = async (msgId: string, topic?: string): Promise<MessageDetail> => {
  return await request.get('/api/v1/messageTrace/viewMessage?msgId=' + msgId + '&topic=' + topic)
}



// 查询消息轨迹详情
export const viewTraceMessageDetail = async (msgId: string): Promise<MessageTraceView[]> => {
  return await request.get('/api/v1/messageTrace/viewMessageTraceDetail?msgId=' + msgId)
}


// 查询消息轨迹图谱
export const viewMessageTraceGraph = async (msgId: string, traceTopic?: string): Promise<MessageTraceGraph> => {
  return await request.get('/api/v1/messageTrace/viewMessageTraceGraph?msgId=' + msgId)
}



// 工具函数：格式化时间戳
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

// 工具函数：格式化耗时
export const formatCostTime = (costTime: number): string => {
  if (costTime < 1000) return `${costTime}ms`
  return `${(costTime / 1000).toFixed(2)}s`
}

// 工具函数：格式化消息轨迹类型
export const formatTraceType = (type: string): string => {
  switch (type) {
    case 'Pub':
      return '发送'
    case 'SubBefore':
      return '消费前'
    case 'SubAfter':
      return '消费后'
    default:
      return type
  }
}

// 工具函数：格式化消费结果
export const formatConsumeResult = (result: string): string => {
  switch (result) {
    case 'SUCCEED':
      return '成功'
    case 'FAILED':
      return '失败'
    case 'ROLLBACK':
      return '回滚'
    case 'EXCEPTION':
      return '异常'
    case 'RETURNNULL':
      return '返回空'
    case 'TIMEOUT':
      return '超时'
    default:
      return result
  }
}

// 工具函数：计算成功率
export const calculateSuccessRate = (success: number, total: number): string => {
  if (total === 0) return '0%'
  return `${((success / total) * 100).toFixed(2)}%`
} 