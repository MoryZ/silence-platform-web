import { ConsumerConfigInfo, ConsumerConnection, ConsumerRunningInfo, DeleteSubGroupRequest, GroupConsumeInfo } from '@/types/mq/consumer';
import { mqRequest as request } from '@/utils/request';
import { ResetOffsetConfig } from '@/types/mq/topic';
import { TopicConsumerInfo } from './topic';



// 获取消费者组列表
export const queryConsumerGroupList = async (skipSysGroup = false): Promise<GroupConsumeInfo[]> => {
  return await request.get('/api/v1/consumer/groupList', {
    params: {
      skipSysGroup,
      address: localStorage.getItem('isV5') ? localStorage.getItem('proxyAddr') : null
    }
  })
}

// 刷新消费者组列表
export const refreshConsumerGroupList = async (consumerGroup: string): Promise<GroupConsumeInfo> => {
  return await request.get('/api/v1/consumer/group/refresh', {
    params: {
      address: localStorage.getItem('isV5') ? localStorage.getItem('proxyAddr') : null,
      consumerGroup
    }
  })
}

//刷新全部消费者组列表
export const refreshAllConsumerGroupList = async (): Promise<GroupConsumeInfo[]> => {
  return await request.get('/api/v1/consumer/group/refreshAll', {
    params: {address: localStorage.getItem('isV5') ? localStorage.getItem('proxyAddr') : null
    }
  })
}

// 获取消费者组订阅的Topic信息
export const queryTopicByConsumer = async (
  consumerGroup: string,
  address?: string
): Promise<TopicConsumerInfo[]> => {
  return await request.get('/api/v1/consumer/queryTopicByConsumer', {
    params: { consumerGroup, address }
  })
}

// 运行消费者
export const queryConsumerRunningInfo = async (
  consumerGroup: string,
  clientId: string,
  jstack?: boolean
): Promise<ConsumerRunningInfo> => {
  return await request.get('/api/v1/consumer/consumerRunningInfo', {
    params: { consumerGroup, clientId, jstack }
  })
}
// 连接信息
export const queryConsumerConnection = async (
  consumerGroup: string,
  address: string,
): Promise<ConsumerConnection> => {
  return await request.get('/api/v1/consumer/consumerConnection', {
    params: { consumerGroup,address }
  })
}

// 获取消费者组监控配置
export const queryConsumerConfig = async (
  consumerGroup: string
): Promise<ConsumerConfigInfo> => {
  return await request.get('/api/v1/consumer/examineSubscriptionGroupConfig', {
    params: { consumerGroup }
  })
}

// 删除消费者组
export const deleteConsumerGroup = async (params: DeleteSubGroupRequest): Promise<boolean> => {
  return await request.delete('/api/v1/consumer/deleteSubGroup', {data: params})
}

// 更新消费者组监控配置
export const updateConsumerMonitorConfig = async (
  config: ConsumerConfigInfo
): Promise<boolean> => {
  return await request.post('/api/v1/consumer/createOrUpdate', config)
}


// 重置消费点位
export const resetOffset = async (config: ResetOffsetConfig): Promise<any> => {
  return await request.post('/api/v1/consumer/resetOffset', config)
}


// 跳过累积点位
export const skipAccumulate = async (config: ResetOffsetConfig): Promise<any> => {
  return await request.post('/api/v1/consumer/skipAccumulate', config)
}
