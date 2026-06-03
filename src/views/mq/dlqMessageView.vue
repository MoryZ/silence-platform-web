<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { queryConsumerGroupList } from '@/api/mq/consumer'
import { queryDLQMessages, resendMessage } from '@/api/mq/dlqMessage'
import { viewMessage} from '@/api/mq/message'
import type { MessageView } from '@/types/mq/message'
import type { DLQMessageQuery, ResendDLQMessageRequest, ConsumerGroupInfo } from '@/types/mq/dlqMessage'

// State
const loading = ref(false)
const consumerGroups = ref<ConsumerGroupInfo[]>([])
const selectedGroup = ref('')
const beginTime = ref('')
const endTime = ref('')
const messageId = ref('')

const messages = ref<MessageView[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const tabsReady = ref(false)
const activeTab = ref<'consumer' | 'messageId'>('consumer')

const showResendDialog = ref(false)
const showMessageDetailDialog = ref(false)
const currentMessage = ref<MessageView | null>(null)
const currentMessageTrackList = ref<Array<{ consumerGroup: string; trackType: string; exceptionDesc?: string }>>([])
const resendConfig = ref<ResendDLQMessageRequest>({
  msgId: '',
  topicName: '',
  consumerGroup: ''
})

// Methods
const loadConsumerGroups = async () => {
  loading.value = true
  try {
    const response = await queryConsumerGroupList() as any
    const code = Number(response?.code ?? 200)
    const rawList = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : []

    if (code === 200) {
      consumerGroups.value = rawList
        .map((item: any) => ({
          groupName: item?.groupName || item?.group || '',
          count: Number(item?.count ?? 0),
          messageModel: item?.messageModel || '',
          consumeType: item?.consumeType || '',
          version: item?.version || ''
        }))
        .filter((item: ConsumerGroupInfo) => !!item.groupName)
    } else {
      message.error(response?.message || '获取消费者组列表失败')
    }
  } catch (error: any) {
    message.error(error.message || '获取消费者组列表失败')
  } finally {
    loading.value = false
  }
}

const searchMessages = async () => {
  if (!selectedGroup.value) {
    message.warning('请选择消费者组')
    return
  }
  if (activeTab.value === 'messageId' && !messageId.value) {
    message.warning('请输入消息ID')
    return
  }

  loading.value = true
  try {
    const beginTimestamp = beginTime.value ? new Date(beginTime.value).getTime() : undefined
    const endTimestamp = endTime.value ? new Date(endTime.value).getTime() : undefined

    const query: DLQMessageQuery = {
      topic: `%DLQ%${selectedGroup.value}`,
      consumerGroup: selectedGroup.value,
      begin: activeTab.value === 'consumer' && Number.isFinite(beginTimestamp) ? beginTimestamp : undefined,
      end: activeTab.value === 'consumer' && Number.isFinite(endTimestamp) ? endTimestamp : undefined,
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      messageId: activeTab.value === 'messageId' ? (messageId.value || undefined) : undefined
    }

    const response = await queryDLQMessages(query) as any

    const page = response?.data?.page || response?.page
    if (page && Array.isArray(page.data)) {
      messages.value = page.data.map((item: any) => ({
        ...item,
        messageId: item?.messageId || item?.msgId || '',
        messageBody: item?.messageBody || item?.body || ''
      }))
      totalCount.value = Number(page.total ?? 0)
      if (messages.value.length === 0) {
        message.info('未找到匹配的死信队列消息')
      }
    } else {
      message.error('查询死信队列消息失败')
    }
  } catch (error: any) {
    message.error(error.message || '查询死信队列消息失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  searchMessages()
}

const viewMessageDetail = async (row: MessageView) => {
  try {
    loading.value = true
    const messageId = row.messageId || (row as any).msgId
    if (!messageId) {
      message.warning('消息ID不能为空')
      return
    }
    const detailTopic = row?.properties?.RETRY_TOPIC || row.topic
    const result = await viewMessage(messageId, detailTopic)
    currentMessageTrackList.value = Array.isArray(result?.messageTrackList) ? result.messageTrackList : []
    const detail = result?.messageView || row
    currentMessage.value = {
      ...detail,
      messageId: detail?.messageId || (detail as any)?.msgId || messageId,
      messageBody: detail?.messageBody || (detail as any)?.body || ''
    }
    showMessageDetailDialog.value = true
  } catch (error: any) {
    message.error(error.message || '获取消息详情失败')
  } finally {
    loading.value = false
  }
}

const openResendDialog = (message: MessageView) => {
  const fallbackMsgId = (message as any)?.msgId || ''
  const resolvedMsgId = message.messageId || fallbackMsgId
  const retryTopic = message?.properties?.RETRY_TOPIC
  const resolvedTopic = retryTopic || message.topic

  resendConfig.value = {
    msgId: resolvedMsgId,
    topicName: resolvedTopic,
    consumerGroup: selectedGroup.value
  }
  showResendDialog.value = true
}

const resendDlqMessage = async () => {
  try {
    const payload: ResendDLQMessageRequest = {
      topicName: resendConfig.value.topicName?.trim(),
      msgId: resendConfig.value.msgId?.trim(),
      consumerGroup: resendConfig.value.consumerGroup?.trim(),
      clientId: resendConfig.value.clientId
    }

    if (!payload.msgId || !payload.topicName || !payload.consumerGroup) {
      message.warning('重发参数不完整，请重新选择消息后再试')
      return
    }

    // topic 误传成 msgId 时会触发后端 route info 错误，这里前端直接拦截。
    if (payload.topicName === payload.msgId) {
      message.error('topicName 参数异常（与 msgId 相同），请重新打开重发弹窗')
      return
    }

    const data = await resendMessage(payload) as any

    if (!data?.remark) {
      message.success('重发消息成功')
      showResendDialog.value = false
      await searchMessages()
    } else {
      message.error(data.remark || '重发消息失败')
    }
  } catch (error: any) {
    message.error(error.message || '重发消息失败')
  }
}

const resetForm = () => {
  selectedGroup.value = ''
  beginTime.value = ''
  endTime.value = ''
  messageId.value = ''
  currentPage.value = 1
  messages.value = []
  totalCount.value = 0
}

const handleTabChange = (key: string) => {
  activeTab.value = key as 'consumer' | 'messageId'
  currentPage.value = 1
  messages.value = []
  totalCount.value = 0
  currentMessageTrackList.value = []
}

onMounted(async () => {
  loadConsumerGroups()
  // 等待 transition 动画完成后再渲染 tabs，避免 keep-alive + transition 组合下
  // ant-design-vue tabs 在首次挂载时因容器尺寸未稳定导致 ink-bar / 布局计算错乱
  await nextTick()
  requestAnimationFrame(() => {
    tabsReady.value = true
  })
})

// Computed
const formattedProperties = computed(() => {
  if (!currentMessage.value?.properties) return []
  return Object.entries(currentMessage.value.properties).map(([key, value]) => ({
    key,
    value
  }))
})

const displayMessageBody = computed(() => {
  const raw = currentMessage.value?.messageBody || ''
  if (!raw) return ''
  try {
    const decoded = atob(raw)
    const utf8 = decodeURIComponent(
      Array.from(decoded)
        .map(ch => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
    return utf8
  } catch {
    return raw
  }
})

const trackStatusColor = (trackType?: string) => {
  if (trackType === 'CONSUMED') return 'green'
  if (trackType === 'NOT_ONLINE') return 'orange'
  return 'blue'
}

const delayLevels = [
  { label: '不延时', value: 0 },
  { label: '1秒', value: 1 },
  { label: '5秒', value: 2 },
  { label: '10秒', value: 3 },
  { label: '30秒', value: 4 },
  { label: '1分钟', value: 5 },
  { label: '2分钟', value: 6 },
  { label: '3分钟', value: 7 },
  { label: '4分钟', value: 8 },
  { label: '5分钟', value: 9 },
  { label: '6分钟', value: 10 },
  { label: '7分钟', value: 11 },
  { label: '8分钟', value: 12 },
  { label: '9分钟', value: 13 },
  { label: '10分钟', value: 14 },
  { label: '20分钟', value: 15 },
  { label: '30分钟', value: 16 },
  { label: '1小时', value: 17 },
  { label: '2小时', value: 18 }
]
</script>

<template>
  <div class="dlq-message-page">
    <div class="search-panel">
      <div v-if="!tabsReady" class="tabs-placeholder" />
      <a-tabs v-else v-model:activeKey="activeTab" @change="handleTabChange" class="top-tabs">
        <a-tab-pane key="consumer" tab="Consumer" />
        <a-tab-pane key="messageId" tab="Message ID" />
      </a-tabs>
      <div class="tab-content-form">
        <div v-if="activeTab === 'consumer'" class="toolbar-row">
          <div class="toolbar-field">
            <label>Consumer:</label>
            <a-select
              v-model:value="selectedGroup"
              placeholder="请选择消费者组"
              allow-clear
              show-search
              class="consumer-select"
            >
              <a-select-option
                v-for="group in consumerGroups"
                :key="group.groupName"
                :value="group.groupName"
              >
                {{ group.groupName }}
              </a-select-option>
            </a-select>
          </div>
          <div class="toolbar-field">
            <label>Begin:</label>
            <a-date-picker
              v-model:value="beginTime"
              placeholder="开始时间"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="time-picker"
            />
          </div>
          <div class="toolbar-field">
            <label>End:</label>
            <a-date-picker
              v-model:value="endTime"
              placeholder="结束时间"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="time-picker"
            />
          </div>
          <a-button class="toolbar-button" type="primary" @click="searchMessages">Search</a-button>
          <a-button class="toolbar-button" disabled>batchReSend</a-button>
        </div>
        <div v-if="activeTab === 'consumer'" class="toolbar-actions-row">
          <a-button disabled>batchExport</a-button>
        </div>
        <div v-if="activeTab === 'messageId'" class="toolbar-row">
          <div class="toolbar-field">
            <label>Consumer:</label>
            <a-select
              v-model:value="selectedGroup"
              placeholder="请选择消费者组"
              allow-clear
              show-search
              class="consumer-select"
            >
              <a-select-option
                v-for="group in consumerGroups"
                :key="group.groupName"
                :value="group.groupName"
              >
                {{ group.groupName }}
              </a-select-option>
            </a-select>
          </div>
          <div class="toolbar-field message-id-field">
            <label>MessageId:</label>
            <a-input
              v-model:value="messageId"
              placeholder="输入消息ID"
              class="message-id-input"
            />
          </div>
          <a-button class="toolbar-button" type="primary" @click="searchMessages">Search</a-button>
        </div>
      </div>
    </div>

    <a-card class="table-card" v-loading="loading">
      <a-table
        :dataSource="messages"
        :pagination="false"
        bordered
        :rowKey="(record: MessageView) => record.messageId || record.topic"
        :locale="{ emptyText: '暂无数据' }"
      >
        <a-table-column title="消息ID" dataIndex="messageId" key="messageId" width="260" />
        <a-table-column title="Tag" key="tag" width="180">
          <template #customRender="{ record }">
            {{ record?.properties?.TAGS || '-' }}
          </template>
        </a-table-column>
        <a-table-column title="Key" key="key" width="220">
          <template #customRender="{ record }">
            {{ record?.properties?.KEYS || '-' }}
          </template>
        </a-table-column>
        <a-table-column title="StoreTime" key="storeTimestamp" width="200">
          <template #customRender="{ record }">
            {{ record.storeTimestamp ? new Date(record.storeTimestamp).toLocaleString() : '-' }}
          </template>
        </a-table-column>
        <a-table-column title="操作" key="action" width="180" fixed="right">
          <template #customRender="{ record }">
            <div class="action-buttons">
              <a-button
                type="primary"
                size="small"
                @click="viewMessageDetail(record)"
              >
                详情
              </a-button>
              <a-button
                type="primary"
                ghost
                size="small"
                @click="openResendDialog(record)"
              >
                重发
              </a-button>
            </div>
          </template>
        </a-table-column>
      </a-table>

      <div class="pagination-container" v-if="totalCount > 0">
        <a-pagination
          v-model:current="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          :show-total="(total) => `Total ${total}`"
          @change="handlePageChange"
        />
      </div>

      <div v-if="messages.length === 0" class="no-results">
        未找到匹配的死信队列消息
      </div>
    </a-card>

    <!-- 重发消息对话框 -->
    <a-modal
      v-model:open="showResendDialog"
      title="重发死信队列消息"
      :width="500"
      @cancel="showResendDialog = false"
    >
      <a-form :model="resendConfig" label-width="100px">
        <a-form-item label="Topic">
          <a-input
            v-model:value="resendConfig.topicName"
            readonly
          />
        </a-form-item>

        <a-form-item label="消费者组">
          <a-input
            v-model:value="resendConfig.consumerGroup"
            readonly
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showResendDialog = false">取消</a-button>
        <a-button type="primary" @click="resendDlqMessage">
          重发
        </a-button>
      </template>
    </a-modal>

    <!-- 消息详情对话框 -->
    <a-modal
      v-model:open="showMessageDetailDialog"
      title="消息详情"
      :width="800"
      @cancel="showMessageDetailDialog = false"
    >
      <a-descriptions :column="2" border>
        <a-descriptions-item label="消息ID">
          {{ currentMessage?.messageId }}
        </a-descriptions-item>
        <a-descriptions-item label="Topic">
          {{ currentMessage?.topic }}
        </a-descriptions-item>
        <a-descriptions-item label="存储大小">
          {{ currentMessage ? `${(currentMessage.storeSize / 1024).toFixed(2)} KB` : '' }}
        </a-descriptions-item>
        <a-descriptions-item label="队列ID">
          {{ currentMessage?.queueId }}
        </a-descriptions-item>
        <a-descriptions-item label="存储时间">
          {{ currentMessage ? new Date(currentMessage.storeTimestamp).toLocaleString() : '' }}
        </a-descriptions-item>
        <a-descriptions-item label="生产时间">
          {{ currentMessage ? new Date(currentMessage.bornTimestamp).toLocaleString() : '' }}
        </a-descriptions-item>
        <a-descriptions-item label="生产者">
          {{ currentMessage?.bornHost }}
        </a-descriptions-item>
        <a-descriptions-item label="存储节点">
          {{ currentMessage?.storeHost }}
        </a-descriptions-item>
        <a-descriptions-item label="重试次数">
          {{ currentMessage?.reconsumeTimes }}
        </a-descriptions-item>
        <a-descriptions-item label="消息类型">
          <a-tag :type="currentMessage?.msgType === 'NORMAL' ? '' : 'warning'">
            {{ currentMessage?.msgType }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <div class="message-section">
        <div class="section-title">消息内容</div>
        <a-textarea
          :rows="6"
          :value="displayMessageBody"
          readonly
        />
      </div>

      <div class="message-section" v-if="formattedProperties.length > 0">
        <div class="section-title">消息属性</div>
        <a-table :dataSource="formattedProperties" :pagination="false" bordered :rowKey="(record: any) => record.key">
          <a-table-column title="属性名" dataIndex="key" key="key" width="220" />
          <a-table-column title="属性值" dataIndex="value" key="value" />
        </a-table>
      </div>

      <div class="message-section" v-if="currentMessageTrackList.length > 0">
        <div class="section-title">消息轨迹</div>
        <a-table
          :dataSource="currentMessageTrackList"
          :pagination="false"
          bordered
          :rowKey="(record: any, index: number) => `${record.consumerGroup}-${index}`"
        >
          <a-table-column title="Consumer Group" dataIndex="consumerGroup" key="consumerGroup" width="260" />
          <a-table-column title="状态" dataIndex="trackType" key="trackType" width="140">
            <template #customRender="{ record }">
              <a-tag :color="trackStatusColor(record.trackType)">{{ record.trackType }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="异常信息" dataIndex="exceptionDesc" key="exceptionDesc">
            <template #customRender="{ record }">
              {{ record.exceptionDesc || '-' }}
            </template>
          </a-table-column>
        </a-table>
      </div>
      <template #footer>
        <a-button @click="showMessageDetailDialog = false">关闭</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.dlq-message-page {
  padding: 20px;
}

.search-panel {
  padding: 8px 12px 20px;
  background: #fff;
  border-radius: 2px;
  margin-bottom: 20px;
}
.top-tabs {
  margin-bottom: 0;
}

.tabs-placeholder {
  height: 48px;
  margin-bottom: 8px;
}

.tab-content-form {
  margin-top: 8px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 18px 24px 8px;
}

.toolbar-actions-row {
  padding: 0 24px 8px;
}

.toolbar-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-field label {
  color: #111827;
  font-size: 16px;
  white-space: nowrap;
}

.consumer-select {
  width: 420px;
}

.time-picker {
  width: 285px;
}

.message-id-field {
  flex: 1;
  min-width: 420px;
}

.message-id-input {
  width: 100%;
  max-width: 640px;
}

.toolbar-button {
  min-width: 128px;
  height: 44px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 14px;
}

.message-section {
  margin-top: 20px;
}

.section-title {
  margin-bottom: 10px;
  font-weight: 500;
  color: var(--a-text-color-primary);
}

:deep(.a-descriptions) {
  margin-bottom: 20px;
}

@media (max-width: 1200px) {
  .consumer-select,
  .time-picker,
  .message-id-input {
    width: 100%;
    max-width: none;
  }

  .message-id-field {
    min-width: 0;
    width: 100%;
  }
}
</style>

<style>
/* ant-design-vue tabs 穿透样式 —— 放在非 scoped 块中避免首次挂载时 CSS 注入时序导致 tab 错乱 */
.top-tabs .ant-tabs-nav-list {
  display: flex;
  flex-direction: row;
}

.top-tabs .ant-tabs-tab {
  margin-right: 24px !important;
}

.top-tabs .ant-tabs-tab + .ant-tabs-tab {
  margin-left: 0 !important;
}

.dlq-message-page .search-panel .ant-tabs-nav {
  margin-bottom: 0;
}

.dlq-message-page .search-panel .ant-tabs-tab {
  font-size: 16px;
  font-weight: 500;
  padding: 8px 32px;
}

.dlq-message-page .search-panel .ant-tabs-content-holder {
  display: none;
}
</style>
