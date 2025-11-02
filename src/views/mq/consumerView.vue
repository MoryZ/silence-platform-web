<script setup lang="ts">
import { ref, computed, onMounted, watch, h, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  queryConsumerGroupList,
  queryTopicByConsumer,
  queryConsumerConfig,
  deleteConsumerGroup,
  updateConsumerMonitorConfig,
  queryConsumerRunningInfo,
  queryConsumerConnection,
  refreshConsumerGroupList,
  refreshAllConsumerGroupList,
} from '@/api/mq/consumer'
import { queryClusterList } from '@/api/mq/cluster'
import type { GroupConsumeInfo, ConsumerRunningInfo, ConsumerConnection, ConsumerConfigInfo } from '@/types/mq/consumer'
import { TopicConsumerInfo } from '@/api/mq/topic'

// State
const loading = ref(false)
const consumerGroups = ref<GroupConsumeInfo[]>([])
const filterStr = ref('')
const filterNormal = ref(true)
const filterSystem = ref(false)
const filterFIFO = ref(false)
const autoRefresh = ref(false)
let refreshInterval: ReturnType<typeof setInterval> | null = null

const showRunningInfoDialog = ref(false)
const showConfigDialog = ref(false)
const showConnectionDialog = ref(false)
const currentConnection = ref<ConsumerConnection | null>(null)
const currentConnectionGroupName = ref('')

const consumerDetailInfo = ref<TopicConsumerInfo[] | null>(null)
const currentConfig = ref<ConsumerConfigInfo>({
  clusterNameList: [],
  brokerNameList:  [],
  subscriptionGroupConfig: {
    groupName: '',
    consumeEnable: false,
    consumeFromMinEnable: false,
    consumeBroadcastEnable: false,
    retryQueueNums: 1,
    retryMaxTimes: 1,
    brokerId: 1,
    whichBrokerWhenConsumeSlowly: 1,
    notifyConsumerIdsChangedEnable: false,
    groupSysFlag: 1,
    consumeTimeoutMinute: 1,
  }
})

const showClientPropsDialog = ref(false)
const clientProps = ref<Record<string, string>>({})
const clientIdForProps = ref('')

const isAddMode = ref(false)

const clusterOptions = ref<string[]>([])
const brokerOptions = ref<string[]>([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const handlePageChange = (page: number) => {
  currentPage.value = page
  // 如果需要，可以在这里重新加载数据
}

// Computed
const filteredConsumerGroups = computed(() => {
  const filtered = consumerGroups.value.filter(group => {
    const matchesFilter = !filterStr.value || group.group.toLowerCase().includes(filterStr.value.toLowerCase())
    const isSystemGroup = group.group.startsWith('%SYS%')
    const isFIFOGroup = group.subGroupType === 'FIFO'
    if (!matchesFilter) return false
    if (isSystemGroup && !filterSystem.value) return false
    if (isFIFOGroup && !filterFIFO.value) return false
    if (!isSystemGroup && !isFIFOGroup && !filterNormal.value) return false
    return true
  })
  totalCount.value = filtered.length
  return filtered
})

// Methods
const refreshConsumerGroups = async () => {
  loading.value = true
  try {
    const data = await refreshAllConsumerGroupList()
    consumerGroups.value = data
   
  } catch (error: any) {
    message.error(error.message || '获取消费组列表失败')
  } finally {
    loading.value = false
  }
}

const consumerDetail = async (groupName: string, clientId: string) => {
  try {
    const response = await queryTopicByConsumer(groupName, clientId)
    if (response) {
      consumerDetailInfo.value = response
      currentConnectionGroupName.value = groupName // 记住消费组名
      showRunningInfoDialog.value = true
    } else {
      message.error('获取运行信息失败')
    }
  } catch (error: any) {
    message.error(error.message || '获取运行信息失败')
  }
}

const viewConnection = async (groupName: string, address: string) => {
  try {
    const response = await queryConsumerConnection(groupName, address)
    if (response) {
      currentConnection.value = response
      currentConnectionGroupName.value = groupName // 记住消费组名
      showConnectionDialog.value = true
    } else {
      message.error('获取连接信息失败')
    }
  } catch (error: any) {
    message.error(error.message || '获取连接信息失败')
  }
}

const openConfigDialog = async (groupName: string) => {
  try {
    const response = await queryConsumerConfig(groupName)
    if (response && Array.isArray(response) && response.length > 0) {
      currentConfig.value = response[0]
      showConfigDialog.value = true
    } else {
      message.error('获取消费组配置失败')
    }
  } catch (error: any) {
    message.error(error.message || '获取消费组配置失败')
  }
}

const handleUpdateConfig = async () => {
  try {
    const response = await updateConsumerMonitorConfig(currentConfig.value)
    if (response) {
      message.success('更新配置成功')
      showConfigDialog.value = false
      await refreshConsumerGroups()
    } else {
      message.error('更新配置失败')
    }
  } catch (error: any) {
    message.error(error.message || '更新配置失败')
  }
}

const handleDeleteGroup = async (groupName: string) => {
  try {
    const response = await deleteConsumerGroup({
      groupName,
      brokerNameList: []
    })
    if (response) {
      message.success('删除消费组成功')
      await refreshConsumerGroups()
    } else {
      message.error('删除消费组失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      message.error(error.message || '删除消费组失败')
    }
  }
}

const refreshConsumerGroup = async (groupName: string) => {
  try {
    const updated = await refreshConsumerGroupList(groupName)
    if (updated) {
      // 找到并替换 consumerGroups 中对应项
      const idx = consumerGroups.value.findIndex(g => g.group === groupName)
      if (idx !== -1) {
        consumerGroups.value[idx] = updated
        message.success('刷新成功')
      }
    } else {
      message.error('刷新失败')
    }
  } catch (e: any) {
    message.error(e.message || '刷新失败')
  }
}

// Watch auto refresh
watch(autoRefresh, (newValue) => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  if (newValue) {
    refreshInterval = setInterval(() => {
      refreshConsumerGroups()
    }, 10000)
  }
})

onMounted(() => {
  refreshConsumerGroups()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})

const formatTimestamp = (ts: number) => {
  if (!ts) return 'N/A'
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
}

const handleShowClientProps = async (clientId: string) => {
  try {
    // 你需要有 groupName，可以用 currentConnectionGroupName.value
    const groupName = currentConnectionGroupName.value
    // 查询运行信息
    const res = await queryConsumerRunningInfo(groupName, clientId, false)
    if (res && res.properties) {
      clientProps.value = res.properties
      clientIdForProps.value = clientId
      showClientPropsDialog.value = true
    } else {
      message.error('未获取到客户端属性')
    }
  } catch (e: any) {
    message.error(e.message || '获取客户端属性失败')
  }
}

const openAddOrUpdateDialog = async () => {
  // 1. 获取集群和broker列表
  try {
    const res = await queryClusterList()
    
    // 解析 clusterOptions
    clusterOptions.value = Object.keys(res.clusterInfo.clusterAddrTable || {})
    // 默认选中第一个集群
    currentConfig.value.clusterNameList = clusterOptions.value.length ? [clusterOptions.value[0]] : []

    // 解析 brokerOptions
    if (currentConfig.value.clusterNameList.length) {
      // 取第一个集群下的所有 broker 名称
      const brokers = res.clusterInfo.clusterAddrTable[currentConfig.value.clusterNameList[0]] || []
      brokerOptions.value = brokers
      // 默认选中第一个 broker
      currentConfig.value.brokerNameList = brokerOptions.value.length ? [brokerOptions.value[0]] : []
    } else {
      brokerOptions.value = []
      currentConfig.value.brokerNameList = []
    }
  } catch (e: any) {
    message.error(e.message || '获取集群/节点失败')
    clusterOptions.value = []
    brokerOptions.value = []
    currentConfig.value.clusterNameList = []
    currentConfig.value.brokerNameList = []
  }

  // 2. 其余字段初始化
  currentConfig.value.subscriptionGroupConfig = {
    groupName: '',
    consumeEnable: true,
    consumeFromMinEnable: false,
    consumeBroadcastEnable: true,
    retryQueueNums: 1,
    retryMaxTimes: 16,
    brokerId: 0,
    whichBrokerWhenConsumeSlowly: 1,
    notifyConsumerIdsChangedEnable: false,
    groupSysFlag: 0,
    consumeTimeoutMinute: 15,
  }
  isAddMode.value = true
  showConfigDialog.value = true
}

const onClusterChange = (val: string[]) => {
  if (val.length) {
    queryClusterList().then(res => {
      const brokers = res.clusterInfo.clusterAddrTable[val[0]] || []
      brokerOptions.value = brokers
      currentConfig.value.brokerNameList = brokerOptions.value.length ? [brokerOptions.value[0]] : []
    })
  } else {
    brokerOptions.value = []
    currentConfig.value.brokerNameList = []
  }
}
</script>

<template>
  <div class="consumer-page">
    <a-card class="consumer-card" :loading="loading">
      <template #title>
        <div class="top-bar">
          <div class="left-group">
            <span class="label">订阅组：</span>
            <a-input
              v-model:value="filterStr"
              placeholder="silence-content-consumer-group"
              style="width: 220px; margin-right: 12px;"
              allow-clear
            />
            <a-checkbox v-model:checked="filterNormal" style="margin-right: 8px;">普通</a-checkbox>
            <a-checkbox v-model:checked="filterFIFO" style="margin-right: 8px;">顺序</a-checkbox>
            <a-checkbox v-model:checked="filterSystem" style="margin-right: 16px;">系统</a-checkbox>
          </div>
          <div class="right-group">
            <a-button type="primary" style="margin-right: 8px;" @click="openAddOrUpdateDialog">新增/更新</a-button>
            <a-button type="primary" @click="refreshConsumerGroups">刷新</a-button>
          </div>
        </div>

        <div class="auto-refresh-row">
          <a-switch v-model:checked="autoRefresh" style="margin-right: 8px;" />
          <span>自动刷新</span>
        </div>
      </template>

      <a-table :dataSource="filteredConsumerGroups" :pagination="false" bordered rowKey="group">
        <a-table-column title="订阅组" dataIndex="group" key="group">
          <template #default="{ text }">
            <span :style="{ color: text.startsWith('%SYS%') ? '#67c23a' : undefined }">
              {{ text.startsWith('%SYS%') ? text.substring(5) : text }}
            </span>
          </template>
        </a-table-column>
        <a-table-column title="数量" dataIndex="count" key="count" />
        <a-table-column title="版本" dataIndex="version" key="version" />
        <a-table-column title="类型" dataIndex="consumeType" key="consumeType" />
        <a-table-column title="模式" dataIndex="messageModel" key="messageModel" />
        <a-table-column title="TPS" dataIndex="consumeTps" key="consumeTps" />
        <a-table-column title="延迟" dataIndex="diffTotal" key="diffTotal" />
        <a-table-column title="操作" key="operation">
          <template #default="{ record }">
            <a-button type="primary" size="small" @click="viewConnection(record.group, record.address[0])">终端</a-button>
            <a-button type="primary" size="small" style="margin-right: 8px;" @click="consumerDetail(record.group, record.address[0])">消费详情</a-button>
            <a-button type="primary" size="small" style="margin-right: 8px;" @click="openConfigDialog(record.group)">配置</a-button>
            <a-button type="danger" size="small" v-if="!record.group.startsWith('%SYS%')" @click="handleDeleteGroup(record.group)">删除</a-button>
            <a-button type="primary" size="small" style="margin-right: 8px;" @click="refreshConsumerGroup(record.group)">刷新</a-button>
          </template>
        </a-table-column>
      </a-table>
      <div class="pagination-row">
        <a-pagination
          v-model:current="currentPage"
          :pageSize="pageSize"
          :total="totalCount"
          @change="handlePageChange"
          :show-size-changer="false"
        />
      </div>
    </a-card>

    <!-- 运行信息弹窗 -->
    <a-modal
      v-model:open="showRunningInfoDialog"
      :title="`[${currentConnectionGroupName}]消费详情`"
      width="1000px"
      :footer="null"
      @cancel="showRunningInfoDialog = false"
    >
      <div v-for="topicInfo in consumerDetailInfo || []" :key="topicInfo.topic" style="margin-bottom: 32px;">
        <!-- 分组 summary -->
        <div style="font-weight: bold; margin-bottom: 8px;">
          主题 {{ topicInfo.topic }}
          <span style="margin-left: 24px;">延迟 {{ topicInfo.diffTotal }}</span>
          <span style="margin-left: 24px;">最后消费时间 {{ topicInfo.lastTimestamp ? formatTimestamp(topicInfo.lastTimestamp) : 'N/A' }}</span>
        </div>
        <!-- 表格 -->
        <a-table
          :dataSource="topicInfo.queueStatInfoList"
          :columns="[
            { title: 'broker', dataIndex: 'brokerName', key: 'brokerName' },
            { title: 'queue', dataIndex: 'queueId', key: 'queueId' },
            { title: 'consumerClient', dataIndex: 'clientInfo', key: 'clientInfo',
              customRender: ({ text }) => text
                ? h('a', {
                    style: 'color:#1890ff;cursor:pointer;',
                    onClick: () => handleShowClientProps(text)
                  }, text)
                : ''
            },
            { title: 'brokerOffset', dataIndex: 'brokerOffset', key: 'brokerOffset' },
            { title: 'consumerOffset', dataIndex: 'consumerOffset', key: 'consumerOffset' },
            { title: 'diffTotal', key: 'diffTotal', customRender: ({ record }) => topicInfo.diffTotal },
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
      <template #footer>
        <a-button @click="showRunningInfoDialog = false">关闭</a-button>
      </template>
    </a-modal>

    <!-- 连接信息弹窗 -->
    <a-modal
      v-model:open="showConnectionDialog"
      :title="`[${currentConnectionGroupName}]终端`"
      width="900px"
      :footer="null"
      @cancel="showConnectionDialog = false"
    >
      <!-- 顶部客户端信息表格 -->
      <a-table
        :dataSource="currentConnection?.connectionSet || []"
        :columns="[
          { title: 'ClientId', dataIndex: 'clientId', key: 'clientId' },
          { title: 'ClientAddr', dataIndex: 'clientAddr', key: 'clientAddr' },
          { title: 'Language', dataIndex: 'language', key: 'language' },
          { title: 'Version', dataIndex: 'versionDesc', key: 'versionDesc' }
        ]"
        :pagination="false"
        bordered
        size="small"
        style="margin-bottom: 16px;"
        rowKey="clientId"
      />

      <div style="margin-bottom: 8px;">Below is subscription:</div>
      <!-- 订阅信息表格 -->
      <a-table
        :dataSource="Object.entries(currentConnection?.subscriptionTable || {}).map(([topic, v]) => ({ topic, subExpression: v.subString }))"
        :columns="[
          { title: 'Topic', dataIndex: 'topic', key: 'topic' },
          { title: 'SubExpression', dataIndex: 'subExpression', key: 'subExpression' }
        ]"
        :pagination="false"
        bordered
        size="small"
        rowKey="topic"
        style="margin-bottom: 16px;"
      />

      <div style="margin: 16px 0 0 0; color: #888;">
        <div>ConsumeType: {{ currentConnection?.consumeType }}</div>
        <div>MessageModel: {{ currentConnection?.messageModel }}</div>
        <div>ConsumeFromWhere: {{ (currentConnection as any)?.consumeFromWhere || 'N/A' }}</div>
      </div>

      <template #footer>
        <a-button @click="showConnectionDialog = false">关闭</a-button>
      </template>
    </a-modal>

    <!-- 配置弹窗 -->
    <a-modal
      v-model:open="showConfigDialog"
      title="修改订阅"
      width="700px"
      @cancel="showConfigDialog = false"
    >
      <a-form :model="currentConfig.subscriptionGroupConfig" label-width="180px">
        <!-- clusterName 多选只读 -->
        <a-form-item label="clusterName:">
          <a-select
            v-model:value="currentConfig.clusterNameList"
            :options="clusterOptions.map(c => ({ label: c, value: c }))"
            mode="multiple"
            style="width: 100%"
            :disabled="!isAddMode"
            @change="onClusterChange"
          />
        </a-form-item>
        <!-- brokerName 多选只读 -->
        <a-form-item label="brokerName:">
          <a-select
            v-model:value="currentConfig.brokerNameList"
            :options="brokerOptions.map(b => ({ label: b, value: b }))"
            mode="multiple"
            style="width: 100%"
            :disabled="!isAddMode"
          />
        </a-form-item>
        <!-- groupName 可输入 -->
        <a-form-item label="groupName:">
          <a-input v-model:value="currentConfig.subscriptionGroupConfig.groupName" :disabled="!isAddMode" />
        </a-form-item>
        <!-- consumeEnable -->
        <a-form-item label="consumeEnable:">
          <a-switch v-model:checked="currentConfig.subscriptionGroupConfig.consumeEnable" />
        </a-form-item>
        <!-- consumeFromMinEnable -->
        <a-form-item label="consumeFromMinEnable:">
          <a-switch v-model:checked="currentConfig.subscriptionGroupConfig.consumeFromMinEnable" />
          <div style="color: #888; font-size: 13px; margin-top: 4px;">
            [Pay Attention: FIFO ConsumerGroup Need Open 'consumeFromMinEnable' Option]
          </div>
        </a-form-item>
        <!-- consumeBroadcastEnable -->
        <a-form-item label="consumeBroadcastEnable:">
          <a-switch v-model:checked="currentConfig.subscriptionGroupConfig.consumeBroadcastEnable" />
        </a-form-item>
        <!-- retryQueueNums -->
        <a-form-item label="retryQueueNums:">
          <a-input-number v-model:value="currentConfig.subscriptionGroupConfig.retryQueueNums" :min="1" style="width: 100%;" />
        </a-form-item>
        <!-- brokerId -->
        <a-form-item label="brokerId:">
          <a-input-number v-model:value="currentConfig.subscriptionGroupConfig.brokerId" :min="0" style="width: 100%;" />
        </a-form-item>
        <!-- retryMaxTimes -->
        <a-form-item label="retryMaxTimes:">
          <a-input-number v-model:value="currentConfig.subscriptionGroupConfig.retryMaxTimes" :min="1" style="width: 100%;" />
        </a-form-item>
        <!-- whichBrokerWhenConsumeSlowly -->
        <a-form-item label="whichBrokerWhenConsumeSlowly:">
          <a-input-number v-model:value="currentConfig.subscriptionGroupConfig.whichBrokerWhenConsumeSlowly" :min="1" style="width: 100%;" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showConfigDialog = false">关闭</a-button>
        <a-button type="primary" @click="handleUpdateConfig">提交</a-button>
      </template>
    </a-modal>

    <!-- 客户端属性弹窗 -->
    <a-modal
      v-model:open="showClientPropsDialog"
      :title="clientIdForProps"
      width="700px"
      @cancel="showClientPropsDialog = false"
      :footer="null"
    >
      <a-table
        :dataSource="Object.entries(clientProps).map(([k, v]) => ({ key: k, value: v }))"
        :columns="[
          { title: '', dataIndex: 'key', key: 'key', width: 260 },
          { title: '', dataIndex: 'value', key: 'value' }
        ]"
        :pagination="false"
        bordered
        size="small"
        rowKey="key"
        showHeader="false"
      />
    </a-modal>
  </div>
</template>

<style scoped>
.consumer-page {
  padding: 20px;
}

.consumer-card {
  margin-bottom: 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.left-group {
  display: flex;
  align-items: center;
}

.label {
  font-size: 15px;
  color: #888;
  margin-right: 4px;
}

.right-group {
  display: flex;
  align-items: center;
}

.auto-refresh-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.system-group {
  color: #67c23a;
}

.subscription-title,
.connection-title {
  margin: 20px 0 10px;
  font-weight: bold;
}

:deep(.ant-descriptions) {
  margin-bottom: 20px;
}

:deep(.ant-button-group) {
  display: flex;
  gap: 5px;
}

.pagination-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}
</style> 