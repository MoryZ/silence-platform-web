import request from '../../utils/request';


/**
 * Get topic 相关信息
 * @param date - 查询日期，格式如 "2025-05-02"
 * @param topicName - 可选，指定查询的主题名称
 * @returns 当传入topicName时，返回该主题的时间序列数据；只传入date时，返回包含所有主题的对象
 */
export const getTopicInfo = async (date: string): Promise<any> => {
  try {
    const params: Record<string, string> = { date }
    
    // 根据文档，API返回的数据结构取决于是否提供了topicName参数
    // 如果提供了topicName，返回该主题的时间序列数组
    // 如果只提供了date，返回包含所有主题及其数据的对象
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
 * @returns 特定主题的时间序列数据数组
 */
export const getTopicInfoWithTopic = async (date: string, topicName: string): Promise<any> => {
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
 * 出参为 {
    "code": 200,
    "data": {
        "broker-a:0": [
            "1746160080014,40.93116",
            "1746160140010,41.00777",
            "1746160200005,40.92580",
            ...
        ]
    },
    "message": null
}
 * @param date - 可选，查询日期，格式如 "2025-05-02"
 */
export const getBrokerInfo = async (date?: string): Promise<any> => {
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