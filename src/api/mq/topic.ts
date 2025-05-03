import request from '../../utils/request';

export interface TopicType {
  messageTypeList: string[]
  topicNameList: string[]
}

export interface TopicConfig {
  topicName: string
  readQueueNums: number
  writeQueueNums: number
  perm: number
  order: boolean
  unit: boolean
  hasUnitSubscription: boolean
  brokerNameList: string[]
  clusterNameList: string[]
}

export interface TopicStats {
  offsetTable: Record<string, object>
}

export interface TopicRouteData {
  orderTopicConf: string
  queueData: {
    brokerName: string
    readQueueNums: number
    writeQueueNums: number
    perm: number
    topicSynFlag: number
  }[]
  brokerDatas: {
    cluster: string
    brokerName: string
    brokerAddrs: Record<number, string>
    zoneName: string
    enableActingMaster: boolean
  }[]
  filterServerTable: Record<string, string[]>
  topicQueueMappingByBroker: Record<string, object>
}

export interface CreateTopicRequest {
  topicName: string
  readQueueNums: number
  writeQueueNums: number
  perm: number
  order: boolean
  unit: boolean
  hasUnitSubscription: boolean
  brokerNameList: string[]
  clusterNameList: string[]
}

export interface UpdateTopicRequest {
  brokerNameList: string[]
  clusterNameList: string[]
  messageType: string
  topicName: string
  readQueueNums: number
  writeQueueNums: number
  perm: number
  order: boolean
  unit: boolean
  hasUnitSubscription: boolean
}

export interface TopicConsumerInfo {
  topic: string
  diffTotal: number
  lastTimestamp: number
  queueStatInfoList: QueueStatInfo[]
}

export interface QueueStatInfo {
  brokerName: string
  queueId: number
  brokerOffset: number
  consumerOffset: number
  clientInfo: string
  lastTimestamp: number
}

export interface TopicConfigInfo {
  clusterNameList: string[]
  brokerNameList: string[]
  topicName: string
  writeQueueNums: number
  readQueueNums: number
  perm: number
  order: boolean
  messageType: string
}

export interface MessageRequest {
  topic: string
  tag: string
  key: string
  messageBody: string
  traceEnabled: boolean
}

export interface GroupList {
  groupList: string[]
}

export interface TopicInfo {
  topicList: string[]
  brokerAddr: string
}
// 刷新Topic列表
export const refreshTopic = async (): Promise<boolean> => {
  return await request.post('/api/v1/topics/refresh')
}

// 获取Topic类型列表
export const queryTopicTypeList = async (): Promise<TopicType> => {
  return await request.get('/api/v1/topics/topicType')
}


// 获取Topic列表
export const queryTopicList = async (skipSysProcess?: boolean, skipRetryAndDlq?: boolean): Promise<TopicInfo> => {
  return await request.get('/api/v1/topics', {
    params: { skipSysProcess, skipRetryAndDlq}
  })
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
export const sendMessage = async (params: MessageRequest): Promise<any> => {
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