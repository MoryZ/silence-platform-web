import { mqRequest as request } from '@/utils/request';
import type { ClusterInfo, BrokerDetail, ClusterData, BrokerConfig } from '@/types/mq/clusterApi';

// 获取集群列表及详细信息
export const queryClusterList = async (): Promise<ClusterData> => {
  return await request.get('/api/v1/cluster/list')
}

// 获取Broker配置信息
export const queryBrokerConfig = async (brokerAddr: string): Promise<Record<string, string>> => {
  return await request.get('/api/v1/cluster/brokerConfig', {
    params: { brokerAddr }
  })
}

// 生成Broker映射表
export const generateBrokerMap = (
  brokerDetail: Record<string, Record<number, BrokerDetail>>,
  clusterMap: Record<string, string[]>,
  brokerMap: Record<string, Record<number, string>>
): Record<string, BrokerDetail[]> => {
  const result: Record<string, BrokerDetail[]> = {}
  
  Object.entries(clusterMap).forEach(([clusterName, brokerNames]) => {
    result[clusterName] = []
    brokerNames.forEach(brokerName => {
      const brokerIds = brokerMap[brokerName] || {}
      Object.entries(brokerIds).forEach(([id, addr]) => {
        const detail = brokerDetail[brokerName]?.[Number(id)]
        if (detail) {
          result[clusterName].push({
            ...detail,
            brokerName,
            index: Number(id),
            brokerAddr: addr
          })
        }
      })
    })
  })

  return result
} 