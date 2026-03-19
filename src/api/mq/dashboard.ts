import { mqRequest as request } from '@/utils/request';
import type { TopicTimeSeriesData, BrokerTimeSeriesData } from '@/types/mq/dashboard';


/**
 * Get topic 相关信息
 * @param date - 查询日期，格式如 "2025-05-02"
 * @returns 所有主题的时间序列数据
 */
export const getTopicInfo = async (date: string): Promise<TopicTimeSeriesData> => {
  try {
    const params: Record<string, string> = { date }
    return await request.get('/api/v1/dashboard/topic', { params })
  } catch (error) {
    console.error('Error loading topic info:', error)
    throw error
  }
}

/**
 * 获取特定主题的数据
 * @param date - 查询日期，格式如 "2025-05-02"
 * @param topicName - 主题名称
 * @returns 特定主题的时间序列数据
 */
export const getTopicInfoWithTopic = async (date: string, topicName: string): Promise<TopicTimeSeriesData> => {
  try {
    const params = { date, topicName }
    return await request.get('/api/v1/dashboard/topic', { params })
  } catch (error) {
    console.error(`Error loading topic data for ${topicName}:`, error)
    throw error
  }
}

/**
 * Get broker 相关信息
 * @param date - 可选，查询日期，格式如 "2025-05-02"
 * @returns Broker 时间序列数据
 */
export const getBrokerInfo = async (date?: string): Promise<BrokerTimeSeriesData> => {
  try {
    const params: Record<string, string> = {}
    if (date) {
      params.date = date
    }
    return await request.get('/api/v1/dashboard/broker', date ? { params } : undefined)
  } catch (error) {
    console.error('Error loading broker metrics:', error)
    throw error
  }
}

/**
 * 获取topic 列表
 * 出参为 {"code":200,"data":["TEST_TOPIC,0"],"message":null}
 */
export const getCurrentTopic = async (): Promise<string[]> => {
  try {
    return await request.get('/api/v1/dashboard/topicCurrent')
  } catch (error) {
    console.error('Error loading topic list:', error)
    throw error
  }
}