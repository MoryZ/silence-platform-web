<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message, Modal, DatePicker } from 'ant-design-vue'
import {
  queryTopicTypeList,
  queryTopicStats,
  queryTopicRoute,
  queryTopicConsumers,
  examineTopicConfig,
  createTopic,
  updateTopic,
  deleteTopic,
  refreshTopic,
  sendMessage,
  queryTopicConsumerInfo
} from '@/api/mq/topic'
import { resetOffset, skipAccumulate } from '@/api/mq/consumer'
import { queryClusterList } from '@/api/mq/cluster'
import type { TopicConfig, TopicConsumerInfo } from '@/types/mq/topicApi';
import { SearchOutlined } from '@ant-design/icons-vue'
import moment from 'moment'
import 'moment/locale/zh-cn'

moment.locale('zh-cn')

// State
const loading = ref(false)
const filterStr = ref('')

// Add message sending dialog state and data
const showSendMessageDialog = ref(false)
const messageInfo = ref({
  topic: '',
  tag: '',
  key: '',
  messageBody: '',
  traceEnabled: false
})

// Add reset offset dialog state and data

// Add skip accumulate dialog state and data
const showSkipAccumulateDialog = ref(false)
const skipAccumulateInfo = ref({
  topic: '',
  resetTime: 222222222222,
  force: true,
  consumerGroupList: [] as string[],
})
const selectedConsumerGroupForSkip = ref<string>('')
const showResetOffsetDialog = ref(false)
const resetOffsetInfo = ref({
  topic: '',
  consumerGroupList: [] as string[],
  resetTime: '2025-05-02 17:12:56',
  force: true
})
const consumerGroupOptions = ref<string[]>([])
const selectedConsumerGroup = ref<string>('')

// Topic type filters
const filterNormal = ref(true) // Default only normal is selected
const filterDelay = ref(false)
const filterFifo = ref(false)
const filterTransaction = ref(false)
const filterUnspecified = ref(false)
const filterRetry = ref(false)
const filterDLQ = ref(false)
const filterSystem = ref(false)

const topics = ref<TopicConfig[]>([])
const messageTypes = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const showAddDialog = ref(false)
const showUpdateDialog = ref(false)
const showStatsDialog = ref(false)
const showConsumerDialog = ref(false)
const showRouteDialog = ref(false)

const currentTopic = ref<TopicConfig & { messageType?: string }>({
  topicName: '',
  readQueueNums: 8,
  writeQueueNums: 8,
  perm: 6,
  order: false,
  unit: false,
  hasUnitSubscription: false,
  brokerNameList: [],
  clusterNameList:[],
  messageType: 'NORMAL' // 默认值
})

const currentTopicStats = ref<any>(null)
const currentTopicConsumers = ref<any[]>([])
const offsetTableData = ref<any[]>([])
const routeData = ref<any>(null)

// Add a new state for the topic config dialog
const showTopicConfigDialog = ref(false)
const brokerOptions = ref<string[]>([])
const selectedBroker = ref<string>('')
const topicMessageTypes = ref([
  { label: '普通消息', value: 'NORMAL' },
  { label: '顺序消息', value: 'FIFO' },
  { label: '延迟消息', value: 'DELAY' },
  { label: '事务消息', value: 'TRANSACTION' }
])

const clusterOptions = ref<string[]>([])
const messageTypeOptions = ref<{ label: string, value: string }[]>([])

const messageTypeLabelMap: Record<string, string> = {
  NORMAL: '普通消息',
  FIFO: '顺序消息',
  DELAY: '延迟消息',
  TRANSACTION: '事务消息',
  UNSPECIFIED: '未指定'
}

// Get topic type by index
const getTopicType = (index: number): string => {
  return messageTypes.value[index] || 'NORMAL'
}

// Computed
const filteredTopics = computed(() => {
  const lowExceptStr = filterStr.value.toLowerCase()
  
  return topics.value.filter((topic, index) => {
    // Text filter
    if (!topic.topicName.toLowerCase().includes(lowExceptStr)) {
      return false
    }
    
    // Type filters based on messageTypes
    const topicType = getTopicType(index)
    
    if (filterNormal.value && topicType === 'NORMAL') {
      return true
    }
    
    if (filterDelay.value && topicType === 'DELAY') {
      return true
    }
    
    if (filterFifo.value && topicType === 'FIFO') {
      return true
    }
    
    if (filterTransaction.value && topicType === 'TRANSACTION') {
      return true
    }
    
    if (filterRetry.value && topicType === 'RETRY') {
      return true
    }
    
    if (filterDLQ.value && topicType === 'DLQ') {
      return true
    }
    
    if (filterSystem.value && topicType === 'SYSTEM') {
      return true
    }
    
    if (filterUnspecified.value && 
        topicType !== 'NORMAL' && 
        topicType !== 'DELAY' && 
        topicType !== 'FIFO' && 
        topicType !== 'TRANSACTION' && 
        topicType !== 'RETRY' && 
        topicType !== 'DLQ' && 
        topicType !== 'SYSTEM') {
      return true
    }
    
    // If no filter is selected, show everything
    if (!filterNormal.value && !filterDelay.value && !filterFifo.value && 
        !filterTransaction.value && !filterUnspecified.value && 
        !filterRetry.value && !filterDLQ.value && !filterSystem.value) {
      return true
    }
    
    return false
  })
})

const paginatedTopics = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTopics.value.slice(start, end).map((topic, idx) => ({
    ...topic,
    topicType: getTopicType(start + idx)
  }))
})

// Methods
const loadTopicList = async () => {
  loading.value = true
  try {
    refreshTopic()
    const response = await queryTopicTypeList()
    if (response) {
      const data = response
      
      // Extract topic list and message types
      if (data.topicNameList && data.messageTypeList) {
        topics.value = data.topicNameList.map((topicName: string, index: number) => {
          return {
            topic: topicName, // Keep original topic field for compatibility
            topicName: topicName, // Add topicName field
            readQueueNums: 4,  // Default values until we get specific topic config
            writeQueueNums: 4,
            perm: 6,
            order: data.messageTypeList[index] === 'FIFO',
            unit: false,
            hasUnitSubscription: false,
            brokerNameList: [],
            clusterNameList: [],
            messageType: data.messageTypeList[index]
          }
        })
        
        messageTypes.value = data.messageTypeList
        totalCount.value = topics.value.length
      } else {
        console.error('API response format unexpected:', data)
        message.error('获取Topic列表格式不正确')
      }
    } else {
      console.error('API response is empty')
      message.error('获取Topic列表失败')
    }
  } catch (error: any) {
    console.error('获取Topic列表错误:', error)
    message.error(error.message || '获取Topic列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadTopicList()
}

const openAddDialog = async () => {
  // 1. 重置当前主题
  currentTopic.value = {
    topicName: '',
    readQueueNums: 8,
    writeQueueNums: 8,
    perm: 6,
    order: false,
    unit: false,
    hasUnitSubscription: false,
    brokerNameList: [],
    clusterNameList: [],
    messageType: 'NORMAL'
  }
  // 2. 拉取集群、broker、消息类型
  try {
    const res = await queryClusterList()
    // 集群名
    if (res?.clusterInfo?.clusterAddrTable) {
      clusterOptions.value = Object.keys(res.clusterInfo.clusterAddrTable)
    }
    // broker
    if (res?.brokerServer) {
      brokerOptions.value = Object.keys(res.brokerServer)
    }
    // 消息类型
    if (res?.messageTypes) {
      messageTypeOptions.value = Object.keys(res.messageTypes).map(k => ({
        label: messageTypeLabelMap[k] || k,
        value: k
      }))
    }
  } catch (e) {
    message.error('获取集群/消息类型失败')
  }
  showAddDialog.value = true
}


const handleSubmit = async (isUpdate: boolean) => {
  try {
    const topicData = {
      ...currentTopic.value,
      topic: currentTopic.value.topicName,
      brokerNameList: currentTopic.value.brokerNameList,
      clusterNameList: currentTopic.value.clusterNameList,
      messageType: currentTopic.value.messageType || "NORMAL"
    };
    
    const response = isUpdate
      ? await updateTopic(topicData)
      : await createTopic(topicData);

    if (response !== undefined) {
      message.success(`${isUpdate ? '更新' : '创建'}Topic成功`);
      showAddDialog.value = false;
      showUpdateDialog.value = false;
      loadTopicList();
    } else {
      console.error(`${isUpdate ? '更新' : '创建'}Topic返回空`);
      message.error(`${isUpdate ? '更新' : '创建'}Topic失败`);
    }
  } catch (error: any) {
    console.error(`${isUpdate ? '更新' : '创建'}Topic错误:`, error);
    message.error(error.message || `${isUpdate ? '更新' : '创建'}Topic失败`);
  }
}

const handleDelete = async (topic: string) => {
  try {
    const response = await deleteTopic(topic);
    if (response !== undefined) {
      message.success('删除Topic成功');
      loadTopicList();
    } else {
      console.error('删除Topic返回空:', topic);
      message.error('删除Topic失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除Topic错误:', error);
      message.error(error.message || '删除Topic失败');
    }
  }
}

const showStats = async (topic: string) => {
  try {
    const response = await queryTopicStats(topic)
    if (response) {
      currentTopicStats.value = response
      
      // Store the current topic name for the dialog title
      currentTopic.value = { ...currentTopic.value, topicName: topic }
      
      // Process offsetTable data for table display
      if (response.offsetTable) {
        offsetTableData.value = Object.entries(response.offsetTable).map(([key, value]: [string, any]) => {
          // Return a structured object for the table that includes the original key
          return {
            key: key,
            queueKey: key,
            minOffset: value.minOffset,
            maxOffset: value.maxOffset,
            lastUpdateTimestamp: value.lastUpdateTimestamp
          }
        })
      } else {
        offsetTableData.value = []
      }
      
      showStatsDialog.value = true
    } else {
      console.error('获取Topic统计信息返回空:', topic)
      message.error('获取Topic统计信息失败')
    }
  } catch (error: any) {
    console.error('获取Topic统计信息错误:', error)
    message.error(error.message || '获取Topic统计信息失败')
  }
}

const showConsumers = async (topic: string) => {
  try {
    const response = await queryTopicConsumers(topic)
    if (response && typeof response === 'object') {
      // 转成数组 [{ groupName, ...groupData }]
      currentTopicConsumers.value = Object.entries(response).map(([groupName, groupData]) => ({
        groupName,
        ...groupData
      }))
      // 记录当前 topic
      currentTopic.value = { ...currentTopic.value, topicName: topic }
      showConsumerDialog.value = true
    } else {
      currentTopicConsumers.value = []
      message.error('获取Topic消费者信息失败')
    }
  } catch (error: any) {
    currentTopicConsumers.value = []
    message.error(error.message || '获取Topic消费者信息失败')
  }
}

const exportData = () => {
  const csvContent = [
    ['Topic名称', '读队列数', '写队列数', '权限', '类型'],
    ...topics.value.map((topic, index) => [
      topic.topicName,
      topic.readQueueNums,
      topic.writeQueueNums,
      topic.perm === 2 ? '只读' : topic.perm === 4 ? '只写' : '读写',
      getTopicType(index)
    ])
  ].map(e => e.join(",")).join("\n")

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', 'topics.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Reset all filters except the provided one
const handleFilterClick = (filterName: string) => {
  filterNormal.value = filterName === 'normal'
  filterDelay.value = filterName === 'delay'
  filterFifo.value = filterName === 'fifo'
  filterTransaction.value = filterName === 'transaction'
  filterUnspecified.value = filterName === 'unspecified'
  filterRetry.value = filterName === 'retry'
  filterDLQ.value = filterName === 'dlq'
  filterSystem.value = filterName === 'system'
}

// Add a helper function to format timestamps
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  
  // Format the date as YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


// Update the showRoute function to better handle errors
const showRoute = async (topic: string) => {
  try {
    console.log('Fetching route for topic:', topic)
    const response = await queryTopicRoute(topic)
    
    if (response) {
      console.log('Route data received:', response)
      routeData.value = response
      
      // Store the current topic name for the dialog title
      currentTopic.value = { ...currentTopic.value, topicName: topic }
      showRouteDialog.value = true
    } else {
      console.error('获取Topic路由信息返回空:', topic)
      message.error('获取Topic路由信息失败')
    }
  } catch (error: any) {
    console.error('获取Topic路由信息错误:', error)
    message.error(error.message || '获取Topic路由信息失败')
  }
}

// Add a helper function to calculate consumer progress percentage
const calculateConsumeProgress = (record: any): number => {
  if (!record || typeof record.diffTotal === 'undefined' || typeof record.consumeTPS === 'undefined') {
    return 0
  }
  
  // To avoid division by zero
  if (record.diffTotal === 0) {
    return 100
  }
  
  // Calculate progress as consumed / total * 100
  const total = record.diffTotal + (record.consumedTotal || 0)
  if (total === 0) {
    return 0
  }
  
  const progress = ((record.consumedTotal || 0) / total) * 100
  return Math.min(Math.round(progress), 100) // Ensure it doesn't exceed 100%
}

// Add a function to open the topic config dialog
const openTopicConfigDialog = async (topic: string) => {
  try {
    // Reset topic data with defaults
    currentTopic.value = {
      topicName: topic,
      readQueueNums: 8,
      writeQueueNums: 8,
      perm: 6,
      order: false,
      unit: false,
      hasUnitSubscription: false,
      brokerNameList: [],
      clusterNameList: [],
      messageType: 'NORMAL'
    }
    
    // Find the topic's index in the topics array to get its message type
    const topicIndex = topics.value.findIndex(t => t.topicName === topic);
    let topicMessageType = "NORMAL"; // Default
    
    if (topicIndex >= 0 && topicIndex < messageTypes.value.length) {
      topicMessageType = messageTypes.value[topicIndex];
    }
    
    // Load topic config
    const configResponse = await examineTopicConfig(topic)
    if (configResponse) {
      console.log('Topic config data:', configResponse)
      
      // If configResponse is an array, take the first item
      const topicConfig = Array.isArray(configResponse) ? configResponse[0] : configResponse
      
      if (topicConfig) {
        currentTopic.value = {
          ...currentTopic.value,
          topicName: topic, // Make sure topicName is set correctly
          readQueueNums: topicConfig.readQueueNums || 8,
          writeQueueNums: topicConfig.writeQueueNums || 8,
          perm: topicConfig.perm || 6,
          order: !!topicConfig.order,
          // Store message type if available
          messageType: topicConfig.messageType || topicMessageType
        }
      }
    } else {
      // If no config response, still set message type based on our list
      currentTopic.value.messageType = topicMessageType;
    }
    
    // Load clusters and brokers
    const clustersResponse = await queryClusterList()
    if (clustersResponse && clustersResponse.brokerServer) {
      console.log('Clusters data:', clustersResponse)
      
      // Extract brokers list
      const brokers: string[] = []
      if (typeof clustersResponse.brokerServer === 'object' && !Array.isArray(clustersResponse.brokerServer)) {
        Object.keys(clustersResponse.brokerServer).forEach(broker => {
          brokers.push(broker)
        })
      }
      
      brokerOptions.value = brokers
      
      // Try to find the correct broker from the topic config
      if (configResponse && Array.isArray(configResponse) && configResponse.length > 0 && configResponse[0].brokerNameList) {
        // Set selected broker from config if available
        const configBroker = configResponse[0].brokerNameList[0]
        if (brokers.includes(configBroker)) {
          selectedBroker.value = configBroker
        } else if (brokers.length > 0) {
          selectedBroker.value = brokers[0]
        }
      } else if (brokers.length > 0) {
        selectedBroker.value = brokers[0]
      }
    }
    
    showTopicConfigDialog.value = true
  } catch (error) {
    console.error('Failed to load topic configuration:', error)
    message.error('获取Topic配置失败')
  }
}

// Add a function to handle topic config updates
const handleConfigSubmit = async () => {
  loading.value = true;
  try {
    // Include the broker name in the request and map fields correctly
    const topicData = {
      ...currentTopic.value,
      topic: currentTopic.value.topicName, // API expects 'topic' field
      brokerNameList: currentTopic.value.brokerNameList,
      clusterNameList: currentTopic.value.clusterNameList,
      messageType: currentTopic.value.messageType || "NORMAL", // Use stored message type
      // Make sure that brokerAddrs is included if needed by the API
    };
    
    topicData.brokerNameList.push(selectedBroker.value)
    console.log('Updating topic with data:', topicData);
    const response = await updateTopic(topicData);
    
    if (response) {
      message.success('更新Topic配置成功');
      showTopicConfigDialog.value = false;
      loadTopicList();
    } else {
      message.error('更新Topic配置失败');
    }
  } catch (error: any) {
    console.error('Failed to update topic configuration:', error);
    message.error(error.message || '更新Topic配置失败');
  } finally {
    loading.value = false;
  }
}

// Add a function to open the send message dialog
const showSendMessage = (topic: string) => {
  messageInfo.value = {
    topic: topic,
    tag: '',
    key: '',
    messageBody: '',
    traceEnabled: false
  }
  showSendMessageDialog.value = true
}

// Add a function to handle send message submission
const handleSendMessage = async () => {
  loading.value = true
  try {
    console.log('Sending message:', messageInfo.value)
    const response = await sendMessage(messageInfo.value)
    if (response) {
      message.success('发送消息成功')
      showSendMessageDialog.value = false
    } else {
      message.error('发送消息失败')
    }
  } catch (error: any) {
    console.error('Failed to send message:', error)
    message.error(error.message || '发送消息失败')
  } finally {
    loading.value = false
  }
}

// Add a function to open the reset offset dialog
const showResetOffset = async (topic: string) => {
  resetOffsetInfo.value = {
    topic: topic,
    consumerGroupList: [],
    resetTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    force: true
  };

  try {
    loading.value = true;
    const response = await queryTopicConsumerInfo(topic);
    if (response && Array.isArray(response.groupList)) {
      consumerGroupOptions.value = response.groupList;
      if (consumerGroupOptions.value.length > 0) {
        selectedConsumerGroup.value = consumerGroupOptions.value[0];
        selectedConsumerGroupForSkip.value = consumerGroupOptions.value[0];
      } else {
        selectedConsumerGroup.value = '';
        selectedConsumerGroupForSkip.value = '';
      }
    } else {
      consumerGroupOptions.value = [];
      selectedConsumerGroup.value = '';
      selectedConsumerGroupForSkip.value = '';
    }
  } catch (error: any) {
    message.error(error.message || '获取消费组信息失败');
    consumerGroupOptions.value = [];
    selectedConsumerGroup.value = '';
    selectedConsumerGroupForSkip.value = '';
  } finally {
    loading.value = false;
    showResetOffsetDialog.value = true;
  }
};

// Add a function to open the skip accumulate dialog
const showSkipAccumulate = async (topic: string) => {
  skipAccumulateInfo.value = {
    topic: topic,
    resetTime: 222222222222,
    consumerGroupList: [],
    force: true
  }
  showSkipAccumulateDialog.value = true;
  
  try {
    // Load consumer groups for this topic
    loading.value = true;
    
    const response = await queryTopicConsumerInfo(topic);
    if (response && response && Array.isArray(response.groupList)) {
      consumerGroupOptions.value = response.groupList;
      selectedConsumerGroupForSkip.value = consumerGroupOptions.value[0] || '';
    } else {
      consumerGroupOptions.value = [];
      selectedConsumerGroupForSkip.value = '';
    }
  } catch (error: any) {
    console.error('Failed to load consumer groups:', error);
    message.error(error.message || '获取消费组信息失败');
    // Still display the dialog with empty consumer group options
    consumerGroupOptions.value = [];
    selectedConsumerGroupForSkip.value = '';
  } finally {
    loading.value = false;
  }
  
  // Always show the dialog
  showSkipAccumulateDialog.value = true;
}

// Add a function to handle skip accumulate submission
const handleSkipAccumulate = async (topic: string) => {
  loading.value = true
  try {
    skipAccumulateInfo.value.consumerGroupList = selectedConsumerGroupForSkip.value 
      ? [selectedConsumerGroupForSkip.value] 
      : [];
    
    console.log('Skipping accumulate:', skipAccumulateInfo.value)
    const response = await skipAccumulate(skipAccumulateInfo.value)
    if (response) {
      message.success('跳过堆积成功')
      showSkipAccumulateDialog.value = false
      // 重新加载主题列表，确保界面更新
      loadTopicList(); 
    } else {
      message.error('跳过堆积失败')
    }
  } catch (error: any) {
    console.error('Failed to skip accumulate:', error)
    message.error(error.message || '跳过堆积失败')
  } finally {
    loading.value = false
  }
}

// Fix type issues by ensuring resetTime is a string before API call
const handleResetOffset = async () => {
  const date = moment(resetOffsetInfo.value.resetTime, 'YYYY-MM-DD HH:mm:ss');
  if (!date.isValid()) {
    message.error('请选择有效的时间');
    return;
  }

  resetOffsetInfo.value.resetTime = date.format('YYYY-MM-DD HH:mm:ss'); // Ensure resetTime is a string

  resetOffsetInfo.value.consumerGroupList = selectedConsumerGroup.value 
    ? [selectedConsumerGroup.value] 
    : [];

  console.log('Submitting with timestamp:', resetOffsetInfo.value.resetTime);

  loading.value = true;
  try {
    console.log('Resetting offset with data:', resetOffsetInfo.value);
    const response = await resetOffset({
      ...resetOffsetInfo.value,
      resetTime: date.valueOf() // Ensure resetTime is a number for the API
    });
    if (response !== undefined) {
      message.success('重置消费位点成功');
      showResetOffsetDialog.value = false;
    } else {
      message.error('重置消费位点失败');
    }
  } catch (error: any) {
    console.error('Failed to reset offset:', error);
    message.error(error.message || '重置消费位点失败');
  } finally {
    loading.value = false;
  }
}

// Define getRowKey and getConsumerRowKey functions
const getRowKey = (record: { topicName: string }) => record.topicName;
const getConsumerRowKey = (record: { groupName?: string; id?: string }) => record.groupName || record.id || Math.random().toString();

onMounted(async () => {
  loadTopicList()
})
</script>

<template>
  <div class="topic-page">
  <!-- Skip Accumulate Dialog -->
  <a-modal
    title="跳过堆积"
    :open="showSkipAccumulateDialog"
    @cancel="showSkipAccumulateDialog = false"
    @ok="handleSkipAccumulate(skipAccumulateInfo.topic)"
  >
  <a-form-item label="消费组">
    <a-select
      v-model:value="selectedConsumerGroupForSkip"
      :options="consumerGroupOptions.map(g => ({ label: g, value: g }))"
      placeholder="请选择消费组"
      style="width: 100%"
      allow-clear
      :notFoundContent="'暂无数据'"
    />
    </a-form-item>
  </a-modal>
    <a-card class="topic-card" :loading="loading">
      <template #title>
        <div class="card-header">
          <div class="search-box">
            <a-input
              v-model:value="filterStr"
              placeholder="搜索Topic..."
              allow-clear
            >
              <template #prefix>
                <search-outlined />
              </template>

            </a-input>
          </div>
          <div class="header-actions">
            <a-button @click="loadTopicList">
              刷新
            </a-button>
            <a-button @click="exportData">导出CSV</a-button>
          </div>
        </div>
      
</template>

      <!-- 主题筛选区域 -->
      <div class="filter-section">
        <span class="filter-label">主题:</span>
        <div class="filter-options">
          <a-checkbox v-model:checked="filterNormal">普通</a-checkbox>
          <a-checkbox v-model:checked="filterDelay">延迟</a-checkbox>
          <a-checkbox v-model:checked="filterFifo">顺序</a-checkbox>
          <a-checkbox v-model:checked="filterTransaction">事务</a-checkbox>
          <a-checkbox v-model:checked="filterUnspecified">未指定</a-checkbox>
          <a-checkbox v-model:checked="filterRetry">重试</a-checkbox>
          <a-checkbox v-model:checked="filterDLQ">死信</a-checkbox>
          <a-checkbox v-model:checked="filterSystem">系统</a-checkbox>
        </div>
        
        <div class="action-buttons">
          <a-button type="primary" size="small" @click="openAddDialog">新增/更新</a-button>
        </div>
      </div>

      <a-table 
        :dataSource="paginatedTopics" 
        :columns="[
          { title: '主题', dataIndex: 'topicName', key: 'topicName', width:100 },
          { title: '操作', key: 'action', width: 500 }
        ]" 
        :rowKey="(record) => record.topicName"
        bordered
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'perm'">
            {{ record.perm === 2 ? '只读' : record.perm === 4 ? '只写' : '读写' }}
          </template>
          <template v-if="column.key === 'type'">
            <a-tag 
              :color="
                record.topicType === 'NORMAL' ? '' :
                record.topicType === 'FIFO' ? 'success' :
                record.topicType === 'DELAY' ? 'processing' :
                record.topicType === 'TRANSACTION' ? 'purple' :
                record.topicType === 'SYSTEM' ? 'warning' :
                record.topicType === 'RETRY' || record.topicType === 'DLQ' ? 'error' : 'default'
              "
            >
              {{ 
                record.topicType === 'NORMAL' ? '普通' :
                record.topicType === 'FIFO' ? '顺序' :
                record.topicType === 'DELAY' ? '延迟' :
                record.topicType === 'TRANSACTION' ? '事务' :
                record.topicType === 'SYSTEM' ? '系统' :
                record.topicType === 'RETRY' ? '重试' :
                record.topicType === 'DLQ' ? '死信' : '未指定'
              }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="operation-buttons">
              <a-button type="primary" size="small" style="background-color: #20b2aa; border-color: #20b2aa;" @click="showStats(record.topicName)">
                状态
              </a-button>
              <a-button type="primary" size="small" style="background-color: #20b2aa; border-color: #20b2aa;" @click="showRoute(record.topicName)">
                路由
              </a-button>
              <a-button type="primary" size="small" style="background-color: #20b2aa; border-color: #20b2aa;" @click="showConsumers(record.topicName)">
                CONSUMER 管理
              </a-button>
              <a-button type="primary" size="small" style="background-color: #20b2aa; border-color: #20b2aa;" @click="openTopicConfigDialog(record.topicName)">
                TOPIC 配置
              </a-button>
              <a-button type="primary" size="small" style="background-color: #20b2aa; border-color: #20b2aa;" @click="showSendMessage(record.topicName)">
                发送消息
              </a-button>
              <a-button type="primary" size="small" style="background-color: #ff6347; border-color: #ff6347;" 
                @click="showResetOffset(record.topicName)">
                重置消费位点
              </a-button>
              <a-button type="primary" size="small" style="background-color: #ff6347; border-color: #ff6347;" @click="showSkipAccumulate(record.topicName)">
                跳过堆积
              </a-button>
              <a-button type="primary" size="small" style="background-color: #ff6347; border-color: #ff6347;" @click="handleDelete(record.topicName)">
                删除
              </a-button>
            </div>
          </template>
        </template>
      </a-table>

      <div class="pagination-container">
        <a-pagination
          v-model:current="currentPage"
          :pageSize="pageSize"
          :total="totalCount"
          :showTotal="(total: number, range: number[]) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`"
          @change="handlePageChange"
        />
      </div>
    </a-card>

    <!-- Add/Update Topic Dialog -->
    <a-modal
      v-model:open="showAddDialog"
      title="创建Topic"
      :width="500"
      @ok="handleSubmit(false)"
      @cancel="showAddDialog = false"
    >
      <a-form :model="currentTopic" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="集群名">
          <a-select
            v-model:value="currentTopic.clusterNameList"
            mode="multiple"
            :options="clusterOptions.map(c => ({ label: c, value: c }))"
            placeholder="请选择集群"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="BROKER_NAME">
          <a-select
            v-model:value="currentTopic.brokerNameList"
            mode="multiple"
            :options="brokerOptions.map(b => ({ label: b, value: b }))"
            placeholder="请选择Broker"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="Topic名称">
          <a-input v-model:value="currentTopic.topicName" />
        </a-form-item>
        <a-form-item label="读队列数">
          <a-input-number v-model:value="currentTopic.readQueueNums" :min="1" />
        </a-form-item>
        <a-form-item label="写队列数">
          <a-input-number v-model:value="currentTopic.writeQueueNums" :min="1" />
        </a-form-item>
        <a-form-item label="权限">
          <a-select v-model:value="currentTopic.perm">
            <a-select-option :value="2">只读</a-select-option>
            <a-select-option :value="4">只写</a-select-option>
            <a-select-option :value="6">读写</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="消息类型">
          <a-select
            v-model:value="currentTopic.messageType"
            :options="messageTypeOptions"
            placeholder="请选择消息类型"
            style="width: 100%"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Update Topic Dialog -->
    <a-modal
      v-model:open="showUpdateDialog"
      title="更新Topic"
      :width="500"
      @ok="handleSubmit(true)"
      @cancel="showUpdateDialog = false"
    >
      <a-form :model="currentTopic" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="Topic名称">
          <a-input v-model:value="currentTopic.topicName" disabled />
        </a-form-item>
        <a-form-item label="读队列数">
          <a-input-number v-model:value="currentTopic.readQueueNums" :min="1" />
        </a-form-item>
        <a-form-item label="写队列数">
          <a-input-number v-model:value="currentTopic.writeQueueNums" :min="1" />
        </a-form-item>
        <a-form-item label="权限">
          <a-select v-model:value="currentTopic.perm">
            <a-select-option :value="2">只读</a-select-option>
            <a-select-option :value="4">只写</a-select-option>
            <a-select-option :value="6">读写</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="消息类型">
          <a-select
            v-model:value="currentTopic.messageType"
            style="width: 100%"
            placeholder="请选择消息类型"
            :disabled="loading"
            allow-clear
          >
            <a-select-option
              v-for="type in topicMessageTypes"
              :key="type.value"
              :value="type.value"
            >
              {{ type.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Topic Stats Dialog -->
    <a-modal
      v-model:open="showStatsDialog"
      :title="`${currentTopic.topicName || 'Topic'}状态`"
      :width="800"
      @ok="showStatsDialog = false"
      @cancel="showStatsDialog = false"
    >
      <a-table
        :dataSource="offsetTableData"
        :columns="[
          { title: '队列信息', dataIndex: 'queueKey', key: 'queueKey', width: 300 },
          { title: '最小位点', dataIndex: 'minOffset', key: 'minOffset', width: 120 },
          { title: '最大位点', dataIndex: 'maxOffset', key: 'maxOffset', width: 120 },
          { title: '消息数', key: 'messageCount', width: 120 },
          { title: '最后更新时间', key: 'lastUpdateTime', width: 180 }
        ]"
        :rowKey="(record: any) => record.key"
        bordered
        size="small"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'messageCount'">
            {{ record.maxOffset - record.minOffset }}
          </template>

          <template v-if="column.key === 'lastUpdateTime'">
            {{ formatTimestamp(record.lastUpdateTimestamp) }}
          </template>
        </template>
      </a-table>
    </a-modal>

    <!-- Topic Consumers Dialog -->
    <a-modal
      v-model:open="showConsumerDialog"
      :title="`${currentTopic.topicName || 'Topic'}消费者管理`"
      :width="900"
      :footer="null"
    >
      <template #title>
        {{ currentTopic.topicName }}消费者管理
      </template>
      <template v-if="currentTopicConsumers.length > 0">
        <div v-for="group in currentTopicConsumers" :key="group.groupName" style="margin-bottom: 24px;">
          <div style="font-weight: bold; margin-bottom: 8px;">
            消费组：{{ group.groupName }}
            <span style="margin-left: 24px;">延迟：{{ group.diffTotal }}</span>
            <span style="margin-left: 24px;">最后消费时间：{{ group.lastTimestamp ? formatTimestamp(group.lastTimestamp) : 'N/A' }}</span>
          </div>
          <a-table
            :dataSource="group.queueStatInfoList"
            :columns="[
              { title: 'broker', dataIndex: 'brokerName', key: 'brokerName' },
              { title: 'queue', dataIndex: 'queueId', key: 'queueId' },
              { title: 'consumerClient', dataIndex: 'clientInfo', key: 'clientInfo' },
              { title: 'brokerOffset', dataIndex: 'brokerOffset', key: 'brokerOffset' },
              { title: 'consumerOffset', dataIndex: 'consumerOffset', key: 'consumerOffset' },
              { title: 'lastTimestamp', dataIndex: 'lastTimestamp', key: 'lastTimestamp',
                customRender: ({ text }) => text && text !== 0 ? formatTimestamp(text) : 'N/A'
              }
            ]"
            :pagination="false"
            bordered
            size="small"
            :rowKey="record => `${record.brokerName}-${record.queueId}`"
          />
        </div>
      </template>
      <a-alert v-else type="info" message="暂无消费者信息" show-icon />
    </a-modal>

    <!-- Topic Route Dialog -->
    <a-modal
      v-model:open="showRouteDialog"
      :title="`${currentTopic.topicName || 'Topic'}路由`"
      :width="700"
      :footer="null"
    >
      <div class="route-dialog">
        <div class="route-section">
          <div class="section-header">brokerDatas:</div>
          <div class="section-content">
            <a-table
              :dataSource="[{ key: 'broker', broker: 'broker:' }, { key: 'brokerAddrs', broker: 'brokerAddrs:' }]"
              :columns="[
                { title: '', dataIndex: 'broker', key: 'broker', width: 120 },
                { title: '', key: 'value', width: 250 }
              ]"
              :pagination="false"
              bordered
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'value'">
                  <div v-if="record.key === 'broker'">
                    {{ routeData?.brokerDatas && routeData.brokerDatas.length > 0 
                       ? routeData.brokerDatas[0].brokerName 
                       : 'broker-a' }}
                  </div>
                  <div v-if="record.key === 'brokerAddrs'">
                    <div class="broker-addrs-table">
                      <template v-if="routeData?.brokerDatas && routeData.brokerDatas.length > 0 && routeData.brokerDatas[0].brokerAddrs">
                        <table class="broker-addr-table">
                          <tbody>
                            <tr v-for="(addr, idx) in Object.entries(routeData.brokerDatas[0].brokerAddrs)" :key="idx">
                              <td class="broker-addr-key">{{ addr[0] }}</td>
                              <td class="broker-addr-value">{{ addr[1] }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </template>
                      <template v-else>
                        <table class="broker-addr-table">
                          <tbody>
                            <tr>
                              <td class="broker-addr-key">0</td>
                              <td class="broker-addr-value">169.254.110.198:10911</td>
                            </tr>
                          </tbody>
                        </table>
                      </template>
                    </div>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
        </div>

        <div class="route-section mt-20">
          <div class="section-header">队列信息</div>
          <div class="section-content">
            <a-table
              :dataSource="[
                { 
                  key: 'brokerName', 
                  label: 'BROKER_NAME', 
                  value: routeData?.queueDatas && routeData.queueDatas.length > 0 
                    ? routeData.queueDatas[0].brokerName 
                    : (routeData?.brokerDatas && routeData.brokerDatas.length > 0 
                      ? routeData.brokerDatas[0].brokerName 
                      : 'broker-a')
                },
                { 
                  key: 'readQueue', 
                  label: '读队列数量', 
                  value: routeData?.queueDatas && routeData.queueDatas.length > 0 
                    ? routeData.queueDatas[0].readQueueNums 
                    : 8
                },
                { 
                  key: 'writeQueue', 
                  label: '写队列数量', 
                  value: routeData?.queueDatas && routeData.queueDatas.length > 0 
                    ? routeData.queueDatas[0].writeQueueNums 
                    : 8 
                },
                { 
                  key: 'perm', 
                  label: 'perm', 
                  value: routeData?.queueDatas && routeData.queueDatas.length > 0 
                    ? routeData.queueDatas[0].perm 
                    : 6
                }
              ]"
              :columns="[
                { title: '', dataIndex: 'label', key: 'label', width: 150 },
                { title: '', dataIndex: 'value', key: 'value', width: 500 }
              ]"
              :pagination="false"
              bordered
              size="small"
            />
          </div>
        </div>
        
      </div>
      <template #footer>
        <div style="text-align: right;">
          <a-button @click="showRouteDialog = false">关闭</a-button>
        </div>
      </template>
    </a-modal>

    <!-- Topic Config Dialog -->
    <a-modal
      v-model:open="showTopicConfigDialog"
      title="修改主题"
      :width="800"
      @ok="handleConfigSubmit"
      :confirmLoading="loading"
      okText="提交"
      cancelText="关闭"
    >
      <a-form :model="currentTopic" layout="horizontal" :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="BROKER_NAME:">
          <a-select v-model:value="selectedBroker" style="width: 100%" :disabled="loading">
            <a-select-option 
              v-for="broker in brokerOptions" 
              :key="broker" 
              :value="broker"
            >
              {{ broker }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="主题名:">
          <a-input v-model:value="currentTopic.topicName" disabled />
        </a-form-item>
        
        <a-form-item label="消息类型:">
          <a-select
            v-model:value="currentTopic.messageType"
            style="width: 100%"
            placeholder="请选择消息类型"
            :disabled="loading"
            allow-clear
          >
            <a-select-option
              v-for="type in topicMessageTypes"
              :key="type.value"
              :value="type.value"
            >
              {{ type.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="写队列数量:">
          <a-input-number v-model:value="currentTopic.writeQueueNums" :min="1" :max="16" style="width: 100%" :disabled="loading" />
        </a-form-item>
        
        <a-form-item label="读队列数量:">
          <a-input-number v-model:value="currentTopic.readQueueNums" :min="1" :max="16" style="width: 100%" :disabled="loading" />
        </a-form-item>
        
        <a-form-item label="perm:">
          <a-select v-model:value="currentTopic.perm" style="width: 100%" :disabled="loading">
            <a-select-option :value="2">只读 (2)</a-select-option>
            <a-select-option :value="4">只写 (4)</a-select-option>
            <a-select-option :value="6">读写 (6)</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Send Message Dialog -->
    <a-modal
      v-model:open="showSendMessageDialog"
      :title="`发送[${messageInfo.topic}]消息`"
      :width="700"
      :confirmLoading="loading"
      okText="提交"
      cancelText="关闭"
      @ok="handleSendMessage"
      @cancel="showSendMessageDialog = false"
    >
      <a-form :model="messageInfo" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="主题:">
          <a-input v-model:value="messageInfo.topic" disabled />
        </a-form-item>
        <a-form-item label="标签:">
          <a-input v-model:value="messageInfo.tag" placeholder="tag" />
        </a-form-item>
        <a-form-item label="值:">
          <a-input v-model:value="messageInfo.key" placeholder="key" />
        </a-form-item>
        <a-form-item label="消息主体:">
          <a-textarea v-model:value="messageInfo.messageBody" placeholder="messageBody" :rows="6" />
        </a-form-item>
        <a-form-item label="开启消息轨迹:">
          <a-switch
            v-model:checked="messageInfo.traceEnabled"
            :disabled="loading"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Reset Offset Dialog -->
    <a-modal
      v-model:open="showResetOffsetDialog"
      title="重置位点"
      :width="700"
      :confirmLoading="loading"
      okText="重置"
      cancelText="关闭"
      @ok="handleResetOffset"
      @cancel="showResetOffsetDialog = false"
    >
      <a-form :model="resetOffsetInfo" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="订阅组:">
          <a-select
            v-model:value="selectedConsumerGroup"
            style="width: 100%"
            :disabled="loading"
            placeholder="No results match"
            :allowClear="true"
          >
            <a-select-option
              v-for="group in consumerGroupOptions"
              :key="group"
              :value="group"
            >
              {{ group }}
            </a-select-option>
            <template #notFoundContent>
              <div style="text-align: center; padding: 8px;">
                没有找到消费组，可留空操作
              </div>
            </template>
          </a-select>
        </a-form-item>
        
        <a-form-item label="时间点:">
          <a-date-picker
            v-model:value="resetOffsetInfo.resetTime"
            style="width: 100%"
            :disabled="loading"
            placeholder="选择时间"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            :valueFormat="'YYYY-MM-DD HH:mm:ss'"
          />
        </a-form-item>
        
        <a-form-item label="强制执行:">
          <a-switch
            v-model:checked="resetOffsetInfo.force"
            :disabled="loading"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>

</template>

<style scoped>
.topic-page {
  padding: 20px;
}

.topic-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  width: 300px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  display: flex;
  align-items: center;
  margin: 10px 0 20px 0;
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.filter-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 40px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

:deep(.ant-card-head) {
  padding: 15px 20px;
}

:deep(.ant-table-wrapper) {
  margin-top: 10px;
}

:deep(.ant-space) {
  display: flex;
  gap: 5px;
}

:deep(.ant-checkbox-wrapper) {
  margin-right: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.operation-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.operation-buttons .ant-btn {
  margin: 2px;
}

.route-dialog .route-section {
  margin-bottom: 15px;
}

.route-section .section-header {
  font-weight: bold;
  margin-bottom: 10px;
}

.route-section .section-content {
  border: 1px solid #f0f0f0;
  padding: 5px;
}

.broker-addrs-table {
  width: 100%;
  border-collapse: collapse;
}

.broker-addr-key, .broker-addr-value {
  padding: 4px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.broker-addr-key {
  font-weight: bold;
  width: 80px;
}

.mt-20 {
  margin-top: 20px;
}
</style>