import { mqRequest as request } from '@/utils/request';
import type { TopicData, BrokerData, ClusterData } from '@/types/mq/remoteApi';

export const queryTopic = async (): Promise<TopicData[]> => {
  return await request.get('/api/v1/topic/list')
}

export const queryClusterList = async (): Promise<ClusterData[]> => {
  return await request.get('/api/v1/cluster/list')
}

export const queryBrokerHisData = async (date: string): Promise<BrokerData[]> => {
  return await request.get('/api/v1/dashboard/broker', {
    params: { date },
    timeout: 15000 // 数据量较大，设置较长的超时时间
  })
}

export const queryTopicHisData = async (date: string, topicName: string): Promise<TopicData[]> => {
  return await request.get('/api/v1/dashboard/topic', {
    params: { date, topicName },
    timeout: 15000 // 数据量较大，设置较长的超时时间
  })
}

export const queryTopicCurrentData = async (): Promise<TopicData[]> => {
  return await request.get('/api/v1/dashboard/topicCurrent', {
    timeout: 15000 // 数据量较大，设置较长的超时时间
  })
}
