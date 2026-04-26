import { mqRequest as request } from '@/utils/request';
import type {
  TopicType,
  TopicConfig,
  TopicStats,
  TopicRouteData,
  CreateTopicRequest,
  UpdateTopicRequest,
  TopicConsumerInfo,
  QueueStatInfo,
  TopicConfigInfo,
  MessageRequest,
  GroupList,
  TopicInfo,
  SendResult
} from '@/types/mq/topicApi';
// 刷新Topic列表
export const refreshTopic = async (): Promise<boolean> => {
  return await request.post('/api/v1/topics/refresh')
}

// 获取Topic类型列表
export const queryTopicTypeList = async (params?: {
  pageNo?: number
  pageSize?: number
  topicName?: string
}): Promise<TopicType> => {
  return await request.get('/api/v1/topics/topicType', {
    params
  })
}


// 获取Topic列表
export const queryTopicList = async (
  paramsOrSkipSysProcess?: {
    skipSysProcess?: boolean
    skipRetryAndDlq?: boolean
    pageNo?: number
    pageSize?: number
    topicName?: string
  } | boolean,
  skipRetryAndDlq?: boolean
): Promise<TopicInfo> => {
  const params = typeof paramsOrSkipSysProcess === 'object'
    ? paramsOrSkipSysProcess
    : {
        skipSysProcess: paramsOrSkipSysProcess,
        skipRetryAndDlq
      }

  const query = new URLSearchParams()
  if (typeof params.pageNo === 'number') query.append('pageNo', String(params.pageNo))
  if (typeof params.pageSize === 'number') query.append('pageSize', String(params.pageSize))
  if (typeof params.topicName === 'string' && params.topicName.trim()) query.append('topicName', params.topicName.trim())
  if (typeof params.skipSysProcess === 'boolean') query.append('skipSysProcess', String(params.skipSysProcess))
  if (typeof params.skipRetryAndDlq === 'boolean') query.append('skipRetryAndDlq', String(params.skipRetryAndDlq))

  const url = query.toString() ? `/api/v1/topics?${query.toString()}` : '/api/v1/topics'

  return await request.get(url)
}

// 获取Topic统计信息
export const queryTopicStats = async (topic: string): Promise<TopicStats> => {
  return await request.get('/api/v1/topics/stats', {
    params: { topic }
  })
}

// 获取Topic路由信息
export const queryTopicRoute = async (topic: string): Promise<TopicRouteData> => {
  return await request.get('/api/v1/topics/routes', {
    params: { topic }
  })
}

// 创建Topic
export const createTopic = async (params: CreateTopicRequest): Promise<void> => {
  return await request.post('/api/v1/topics/createOrUpdate', params)
}

// 更新Topic配置
export const updateTopic = async (params: UpdateTopicRequest): Promise<boolean> => {
  return await request.post('/api/v1/topics/createOrUpdate', params)
}

// 删除Topic
export const deleteTopic = async (topic: string): Promise<boolean> => {
  return await request.delete('/api/v1/topics/delete', {
    params: { topic }
  })
}

// 获取Topic的消费者信息
export const queryTopicConsumers = async (
  topic: string
): Promise<TopicConsumerInfo[]> => {
  return await request.get('/api/v1/topics/queryConsumerByTopic', {
    params: { topic }
  })
}

// 获取Topic的消费者信息
export const queryTopicConsumerInfo = async (
  topic: string
): Promise<GroupList> => {
  return await request.get('/api/v1/topics/queryTopicConsumerInfo', {
    params: { topic }
  })
}

// 获取Topic的消费者信息
export const examineTopicConfig = async (
  topic: string
): Promise<TopicConfigInfo[]> => {
  return await request.get('/api/v1/topics/examineTopicConfig', {
    params: { topic }
  })
}

//发送消息
export const sendMessage = async (params: MessageRequest): Promise<SendResult> => {
  return await request.post('/api/v1/topics/send', params)
}

// 工具函数：格式化Topic权限
export const formatTopicPerm = (perm: number): string => {
  const perms: string[] = []
  if (perm & 2) perms.push('读')
  if (perm & 4) perms.push('写')
  if (perm & 6) perms.push('继承')
  return perms.join('/')
}

// 工具函数：解析Topic权限
export const parseTopicPerm = (perms: string[]): number => {
  let perm = 0
  if (perms.includes('读')) perm |= 2
  if (perms.includes('写')) perm |= 4
  if (perms.includes('继承')) perm |= 6
  return perm
}

// 工具函数：格式化消息大小
export const formatMessageSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

// 工具函数：格式化TPS
export const formatTps = (tps: number): string => {
  return `${tps.toFixed(2)}/s`
}

// 工具函数：格式化时间戳
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
} 