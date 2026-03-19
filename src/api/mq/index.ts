/**
 * MQ API 统一出口
 * 所有 MQ 相关 API 和类型都可以从这里统一导入
 * 
 * 注意: 工具函数 (formatXxx) 分散在各个模块中，如需使用请直接从子模块导入
 * 例如: import { formatTimestamp } from '@/api/mq/topic'
 */

// ============ Topic API ============
export {
  refreshTopic,
  queryTopicTypeList,
  queryTopicList,
  queryTopicStats,
  queryTopicRoute,
  createTopic,
  updateTopic,
  deleteTopic,
  queryTopicConsumers,
  queryTopicConsumerInfo,
  examineTopicConfig,
  sendMessage
} from './topic'

export type { 
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
  ResetOffsetConfig
} from '@/types/mq/topicApi'

// SendResult 在 /types/mq/topic.ts 而不是 topicApi.ts
export type {
  SendResult
} from '@/types/mq/topic'

// ============ Cluster API ============
export {
  queryClusterList,
  queryBrokerConfig,
  generateBrokerMap
} from './cluster'

export type { 
  ClusterInfo, 
  BrokerDetail, 
  ClusterData, 
  BrokerConfig 
} from '@/types/mq/clusterApi'

// ============ Consumer API ============
export {
  queryConsumerGroupList,
  refreshConsumerGroupList,
  refreshAllConsumerGroupList,
  queryTopicByConsumer,
  queryConsumerRunningInfo,
  queryConsumerConnection,
  queryConsumerConfig,
  deleteConsumerGroup,
  updateConsumerMonitorConfig,
  resetOffset,
  skipAccumulate
} from './consumer'

export type {
  GroupConsumeInfo,
  ConsumerRunningInfo,
  ConsumerConnection,
  ConsumerConfigInfo,
  DeleteSubGroupRequest
} from '@/types/mq/consumer'

// ============ Message API ============
export {
  queryMessages,
  viewMessage,
  findByKeyAndTopic,
  queryMessageTraces,
  exportMessages,
  resendMessage
} from './message'

export type {
  Message,
  MessageQuery,
  MessagePageResult,
  MessageTrace,
  MessageTraceQuery,
  MessageView,
  MessageViewResult
} from '@/types/mq/message'

// ============ Producer API ============
export {
  queryProducerConnection
} from './producer'

export type {
  ProducerConnection,
  ConnectionSet
} from '@/types/mq/producer'

// ============ ACL API ============
export {
  queryAclConfigs,
  addAclAccount,
  updateAclAccount,
  deleteAclAccount,
  addTopicPerm,
  updateTopicPerm,
  addGroupPerm,
  updateGroupPerm,
  deletePermConfig,
  synchronizeAclData
} from './acl'

export type {
  AclConfig,
  AclResponse,
  AclPermission,
  UpdatePermRequest,
  AddPermRequest,
  ACLAccount
} from '@/types/mq/acl'

// ============ Ops API ============
export {
  queryClusterStats,
  queryBrokerStats,
  queryConsumerStats,
  queryHistoryStats
} from './ops'

// 别名导出以避免与 topic.queryTopicStats 冲突
export {
  queryTopicStats as queryOpsTopicStats
} from './ops'

export type {
  ClusterStats,
  BrokerStats,
  TopicStats as OpsTopicStats,
  ConsumerStats,
  HistoryStatsParams,
  HistoryStats
} from '@/types/mq/opsApi'

// ============ Dashboard API ============
export {
  getTopicInfo,
  getTopicInfoWithTopic,
  getBrokerInfo,
  getCurrentTopic
} from './dashboard'

export type {
  ClusterMetrics,
  TpsMetrics,
  TopicRanking,
  ConsumerRanking,
  BrokerMetrics,
  AlertMessage,
  DashboardResponse,
  TopicTimeSeriesData,
  BrokerTimeSeriesData
} from '@/types/mq/dashboard'

// ============ Remote API ============
export {
  queryTopic,
  queryBrokerHisData,
  queryTopicHisData,
  queryTopicCurrentData
} from './remoteApi'

// 别名导出以避免与 cluster.queryClusterList 冲突
export {
  queryClusterList as queryRemoteClusterList
} from './remoteApi'

export type {
  TopicData as RemoteTopicData,
  BrokerData as RemoteBrokerData,
  ClusterData as RemoteClusterData
} from '@/types/mq/remoteApi'

// ============ Message Trace API ============
export {
  viewTraceMessage,
  viewTraceMessageDetail,
  viewMessageTraceGraph
} from './messageTrace'

export type {
  MessageTraceView
} from '@/types/mq/messageTrace'

// ============ DLQ Message API ============
export {
  queryConsumerGroupList as queryDLQConsumerGroupList,
  queryDLQMessages,
  exportDLQMessages,
  batchResendDLQMessage,
  batchExportDLQMessages
} from './dlqMessage'

export type {
  DLQMessageQuery,
  ResendDLQMessageRequest,
  DLQMessagePage
} from '@/types/mq/dlqMessage'

// ============ Proxy API ============
export {
  queryProxyList,
  queryProxyConfig,
  updateProxyConfig,
  queryProxyStats,
  queryProxyConnections
} from './proxy'

export type {
  ProxyNode,
  ProxyConfig,
  ProxyStats,
  ProxyConnection
} from '@/types/mq/proxy'

// ============ Tools ============
// 导出常用工具函数（避免 formatXxx 多处定义的命名冲突）
export {
  debounce,
  throttle,
  deepClone,
  downloadFile,
  copyToClipboard,
  parseUrlParams,
  buildUrlParams
} from './tools'

