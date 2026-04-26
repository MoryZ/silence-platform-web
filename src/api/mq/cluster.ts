import { mqRequest as request } from '@/utils/request';
import type { ClusterInfo, BrokerDetail, ClusterData, BrokerConfig } from '@/types/mq/clusterApi';

// 获取集群列表及详细信息
export const queryClusterList = async (): Promise<ClusterData> => {
  const response = await request.get('/api/v1/clusters') as any

  const root = response && typeof response === 'object' ? response : {}
  const source = root?.clusterInfo && typeof root.clusterInfo === 'object' ? root.clusterInfo : root

  const clusterAddrTable = source?.clusterAddrTable && typeof source.clusterAddrTable === 'object'
    ? source.clusterAddrTable
    : {}
  const brokerAddrTable = source?.brokerAddrTable && typeof source.brokerAddrTable === 'object'
    ? source.brokerAddrTable
    : {}

  const brokerServer = root?.brokerServer && typeof root.brokerServer === 'object'
    ? root.brokerServer
    : Object.fromEntries(
        Object.entries(brokerAddrTable).map(([brokerName, brokerInfo]: [string, any]) => {
          const brokerAddrs = brokerInfo?.brokerAddrs && typeof brokerInfo.brokerAddrs === 'object'
            ? brokerInfo.brokerAddrs
            : {}
          const nodes = Object.fromEntries(
            Object.keys(brokerAddrs).map((id) => [
              id,
              {
                brokerVersionDesc: '-',
                putTps: '0 0 0',
                getTotalTps: '0 0 0',
                msgPutTotalYesterdayMorning: '0',
                msgGetTotalYesterdayMorning: '0',
                msgPutTotalTodayNow: '0',
                msgGetTotalTodayNow: '0'
              }
            ])
          )
          return [brokerName, nodes]
        })
      )

  const messageTypes = root?.messageTypes && typeof root.messageTypes === 'object'
    ? root.messageTypes
    : {
        NORMAL: 'NORMAL',
        FIFO: 'FIFO',
        DELAY: 'DELAY',
        TRANSACTION: 'TRANSACTION'
      }

  return {
    clusterInfo: {
      clusterAddrTable,
      brokerAddrTable
    },
    brokerServer,
    messageTypes
  }
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