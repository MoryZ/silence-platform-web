import request from '../../utils/request';

export interface ClusterInfo {
  clusterAddrTable: Record<string, string[]> // cluster -> brokerNameList
  brokerAddrTable: Record<string, Record<number, string>> // brokerName -> {id: addr}
}

export interface BrokerDetail {
  brokerName: string
  index: number
  brokerAddr: string
  version: string
  inTotalYest: number
  outTotalYest: number
  inTotalToday: number
  outTotalToday: number
}

export interface ClusterData {
  clusterInfo: ClusterInfo
  brokerServer: Record<string, Record<number, BrokerDetail>>
  messageTypes: Record<string, string>
}

export interface BrokerConfig {
  brokerName: string
  brokerAddr: string
  config: Record<string, string>
}

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