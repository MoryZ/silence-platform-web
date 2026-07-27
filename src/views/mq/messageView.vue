<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive, nextTick } from 'vue'
import { message} from 'ant-design-vue'
import { queryMessages, viewMessage, findByKeyAndTopic, consumeMessageDirectly } from '@/api/mq/message'
import type { MessageQuery, Message, MessageView } from '@/types/mq/message'
import { queryTopicList } from '@/api/mq/topic'
import { SearchOutlined, CopyOutlined } from '@ant-design/icons-vue'
import { sendMessage } from '@/api/mq/topic'
import type { MessageRequest } from '@/types/mq/topicApi';
import dayjs from 'dayjs'

// State
const loading = ref(false)
const topics = ref<string[]>([])
const searchForm = reactive<{
  topic: string
  startTime: dayjs.Dayjs | null
  endTime: dayjs.Dayjs | null
}>({
  topic: '',
  startTime: null,
  endTime: null
})
const beginTime = ref('')
const endTime = ref('')

const messageId = ref('')
const key = ref('')
const tag = ref('')

const messages = ref<Message[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

const showSendDialog = ref(false)
const showMessageDetailDialog = ref(false)
const currentMessage = ref<MessageView | null>(null)
const currentMessageTrackList = ref<Array<{ consumerGroup: string; trackType: string; exceptionDesc?: string | null }>>([])
const resendLoadingMap = ref<Record<string, boolean>>({})
const newMessage = ref<MessageRequest>({ topic: '', tag: '', key: '', messageBody: '', traceEnabled: false })

// Tabs
const tabsReady = ref(false)
const activeTab = ref<'topic' | 'messageKey' | 'messageId'>('topic')

// Methods
const loadTopics = async () => {
  try {
    const response = await queryTopicList({
      pageNo: 1,
      pageSize: 200,
      skipSysProcess: true
    })

    const raw = response as any
    const rows = Array.isArray(raw?.data?.data)
      ? raw.data.data
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.topicList)
          ? raw.topicList
          : Array.isArray(raw?.data?.topicList)
            ? raw.data.topicList
            : []

    topics.value = rows
      .map((item: any) => (typeof item === 'string' ? item : (item?.topicName || item?.topic || '')))
      .filter(Boolean)
      .sort()
   
  } catch (error: any) {
    message.error(error.message || '获取Topic列表失败')
  }
}

const searchMessages = async () => {
  // 校验必填项
  if (!searchForm.topic) {
    message.warning('请选择Topic')
    return
  }
  if (activeTab.value === 'messageKey' && !key.value) {
    message.warning('请输入消息Key')
    return
  }
  if (activeTab.value === 'messageId' && !messageId.value) {
    message.warning('请输入消息ID')
    return
  }

  loading.value = true
  try {
    if (activeTab.value === 'topic') {
      // topic tab 查询
      const query: MessageQuery = {
        topic: searchForm.topic,
        pageNo: currentPage.value,
        pageSize: pageSize.value,
        taskId: '',
        begin: searchForm.startTime ? searchForm.startTime.valueOf() : 0,
        end: searchForm.endTime ? searchForm.endTime.valueOf() : 0,
        messageId: '',
        key: '',
        tag: ''
      }
      const data = await queryMessages(query)
      messages.value = data.page.content
      totalCount.value = data.page.totalElements
      if (messages.value.length === 0) {
        message.info('未找到匹配的消息')
      }
    } else if (activeTab.value === 'messageKey') {
      // messageKey tab 查询
      const messageView = await findByKeyAndTopic(key.value, searchForm.topic)
      if (messageView) {
        messages.value = messageView
        totalCount.value = 1
      } else {
        messages.value = []
        totalCount.value = 0
        message.info('未找到匹配的消息')
      }
    } else if (activeTab.value === 'messageId') {
      // messageId tab 查询
      const result = await viewMessage(messageId.value, searchForm.topic)
      if (result && result?.messageView) {
        await loadMessageDetail(messageId.value, searchForm.topic)
        showMessageDetailDialog.value = true
      } else {
        message.info('未找到匹配的消息')
      }
    }
  } catch (error: any) {
    message.error(error.message || '查询消息失败')
  } finally {
    loading.value = false
  }
}


const handlePageChange = (page: number) => {
  currentPage.value = page
  if (activeTab.value !== 'messageId') {
    searchMessages()
  }
}

const loadMessageDetail = async (msgId: string, topic: string) => {
  const result = await viewMessage(msgId, topic)
  currentMessage.value = result.messageView
  currentMessageTrackList.value = Array.isArray(result.messageTrackList) ? result.messageTrackList : []
}

const viewMessageDetail = async (msg: Message) => {
  try {
    await loadMessageDetail(msg.msgId, msg.topic)
    showMessageDetailDialog.value = true
  } catch (error: any) {
    message.error(error.message || '获取消息详情失败')
  }
}

const copyText = async (text: string, successText: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success(successText)
  } catch {
    message.error('复制失败，请手动复制')
  }
}

const copyMessageId = async (id: string) => {
  await copyText(id, 'Message ID 已复制')
}

const copyFieldValue = async (value: string, label: string) => {
  await copyText(value, `${label} 已复制`)
}

const formatStoreSize = (size?: number) => {
  const value = Number(size || 0)
  if (value < 1024) return `${value} bytes`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

const getTrackStatusColor = (status?: string) => {
  if (status === 'CONSUMED') return 'success'
  if (status === 'NOT_ONLINE') return 'warning'
  return 'default'
}

const resendByTrack = async (consumerGroup: string) => {
  const msg = currentMessage.value
  if (!msg?.messageId || !msg?.topic || !consumerGroup) {
    message.warning('缺少重发参数')
    return
  }

  const loadingKey = `${consumerGroup}-${msg.messageId}`
  resendLoadingMap.value[loadingKey] = true

  try {
    await consumeMessageDirectly({
      consumerGroup,
      topic: msg.topic,
      msgId: msg.messageId
    })
    message.success('Resend Message 成功')
    await loadMessageDetail(msg.messageId, msg.topic)
  } catch (error: any) {
    message.error(error.message || 'Resend Message 失败')
  } finally {
    resendLoadingMap.value[loadingKey] = false
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const openSendDialog = () => {
  newMessage.value = {
    topic: searchForm.topic,
    messageBody: '',
    key: '',
    tag: '',
    traceEnabled: false
  }
  showSendDialog.value = true
}

const handleSendMessage = async () => {
  if (!newMessage.value.topic || !newMessage.value.messageBody) {
    message.warning('请填写必要的消息信息')
    return
  }

  try {
    await sendMessage(newMessage.value)
    message.success('发送消息成功')
    showSendDialog.value = false
    await searchMessages()
  } catch (error: any) {
    message.error(error.message || '发送消息失败')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const resetForm = () => {
  searchForm.topic = ''
  searchForm.startTime = null
  searchForm.endTime = null
  messageId.value = ''
  key.value = ''
  tag.value = ''
  currentPage.value = 1
  messages.value = []
  totalCount.value = 0
}

onMounted(async () => {
  loadTopics()
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  searchForm.startTime = dayjs(threeHoursAgo)
  searchForm.endTime = dayjs(now)

  // 等待 transition 动画完成后再渲染 tabs，避免 keep-alive + transition 组合下
  // ant-design-vue tabs 在首次挂载时因容器尺寸未稳定导致 ink-bar / 布局计算错乱
  await nextTick()
  requestAnimationFrame(() => {
    tabsReady.value = true
  })
});


const getTimestamp = (timeString: string) => {
  if (!timeString) return undefined;
  const date = new Date(timeString);
  return date.getTime();
};

const beginTimestamp = ref(getTimestamp(beginTime.value));
const endTimestamp = ref(getTimestamp(endTime.value));

// 监听 beginTime 和 endTime 的变化
watch([beginTime, endTime], ([newBegin, newEnd]) => {
  beginTimestamp.value = getTimestamp(newBegin);
  endTimestamp.value = getTimestamp(newEnd);
});

watch(activeTab, (newTab) => {
  // 切换tab时清空表格内容和计数
  messages.value = []
  totalCount.value = 0
  showMessageDetailDialog.value = false
  currentMessageTrackList.value = []
  resendLoadingMap.value = {}
  if (newTab === 'topic') {
    key.value = ''
    messageId.value = ''
  } else if (newTab === 'messageKey') {
    searchForm.startTime = null
    searchForm.endTime = null
    messageId.value = ''
  } else if (newTab === 'messageId') {
    searchForm.startTime = null
    searchForm.endTime = null
    key.value = ''
  }
})

// Computed
const formattedProperties = computed(() => {
  if (!currentMessage.value?.properties) return []
  return Object.entries(currentMessage.value.properties).map(([key, value], index) => ({
    id: `${key}-${index}`,
    key,
    value
  }))
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const messageTypes = [
  { label: '普通消息', value: 'NORMAL' },
  { label: '顺序消息', value: 'FIFO' },
  { label: '事务消息', value: 'TRANSACTION' },
  { label: '延时消息', value: 'DELAY' }
]
</script>

<template>
  <div class="message-page">
    <!-- Tabs -->
    <div v-if="!tabsReady" class="tabs-placeholder" />
    <a-tabs
      v-else
      v-model:activeKey="activeTab"
      class="message-tabs"
      tabPosition="top"
      type="line"
      style="margin-bottom:16px; width:100%;"
    >
      <a-tab-pane key="topic" tab="TOPIC" />
      <a-tab-pane key="messageKey" tab="MESSAGE KEY" />
      <a-tab-pane key="messageId" tab="MESSAGE ID" />
    </a-tabs>

    <!-- Search Filters -->
    <a-form layout="inline" style="margin-bottom:16px">
      <!-- 所有tab都显示topic选择 -->
      <a-form-item label="主题">
        <a-select
          v-model:value="searchForm.topic"
          :options="topics.map(t => ({ label: t, value: t }))"
          placeholder="请选择Topic"
          style="width:180px"
          allow-clear
        />
      </a-form-item>
      <!-- 仅topic tab显示时间区间 -->
      <template v-if="activeTab === 'topic'">
        <a-form-item label="开始">
          <a-date-picker
            v-model:value="searchForm.startTime"
            show-time
            format="YYYY-MM-DD HH:mm"
            style="width:180px"
            placeholder="开始时间"
          />
        </a-form-item>
        <a-form-item label="结束">
          <a-date-picker
            v-model:value="searchForm.endTime"
            show-time
            format="YYYY-MM-DD HH:mm"
            style="width:180px"
            placeholder="结束时间"
          />
        </a-form-item>
      </template>
      <template v-if="activeTab === 'messageKey'">
        <a-form-item label="消息Key">
          <a-input
            v-model:value="key"
            placeholder="请输入消息Key"
            style="width:240px"
            allow-clear
          />
        </a-form-item>
      </template>
      <template v-if="activeTab === 'messageId'">
        <a-form-item label="消息ID">
          <a-input
            v-model:value="messageId"
            placeholder="请输入消息ID"
            style="width:240px"
            allow-clear
          />
        </a-form-item>
      </template>
      <!-- 搜索按钮 -->
      <a-form-item>
        <a-button type="primary" @click="searchMessages">
          <template #icon><SearchOutlined/></template>
          搜索
        </a-button>
      </a-form-item>
    </a-form>

    <template v-if="activeTab !== 'messageId'">
      <!-- Results Table -->
      <a-table
        :dataSource="messages"
        :rowKey="(record: Message) => record.msgId"
        :pagination="false"
        bordered
      >
        <a-table-column title="Message ID" dataIndex="msgId" key="msgId">
          <template #customRender="{ text }">
            <span>{{ text }}</span>
            <a-button type="link" size="small" @click="copyMessageId(text)">
              <template #icon><CopyOutlined /></template>
            </a-button>
          </template>
        </a-table-column>
        <a-table-column title="Tag" :dataIndex="['properties', 'TAGS']" key="tag" />
        <a-table-column title="Key" :dataIndex="['properties', 'KEYS']" key="key" />
        <a-table-column title="StoreTime" dataIndex="storeTimestamp" key="storeTimestamp">
          <template #customRender="{ text }">
            {{ text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '' }}
          </template>
        </a-table-column>
        <a-table-column title="Operation" key="operation">
          <template #default="{ record }">
            <a-button type="primary" size="small" @click="viewMessageDetail(record)">消息详情</a-button>
          </template>
        </a-table-column>
      </a-table>

      <!-- Pagination -->
      <div style="text-align:right;margin-top:16px">
        <a-pagination
          v-model:current="currentPage"
          :pageSize="pageSize"
          :total="totalCount"
          @change="handlePageChange"
        />
      </div>
    </template>

    <!-- Send Message Dialog -->
    <a-modal
      v-model:open="showSendDialog"
      title="发送消息"
      width="600px"
    >
      <a-form :model="newMessage" label-width="100px">
        <a-form-item label="Topic" required>
          <a-select
            v-model:value="newMessage.topic"
            placeholder="选择Topic"
            show-search
            style="width: 100%"
          >
            <a-select-option
              v-for="topic in topics"
              :key="topic"
              :value="topic"
            >
              {{ topic }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="消息内容" required>
          <a-textarea
            v-model="newMessage.messageBody"
            :rows="6"
            placeholder="输入消息内容"
          />
        </a-form-item>

        <a-form-item label="Key">
          <a-input
            v-model="newMessage.key"
            placeholder="输入消息Key"
          />
        </a-form-item>

        <a-form-item label="Tag">
          <a-input
            v-model="newMessage.tag"
            placeholder="输入消息Tag"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showSendDialog = false">取消</a-button>
        <a-button type="primary" @click="handleSendMessage">
          发送
        </a-button>
      </template>
    </a-modal>

    <!-- Message Detail Dialog -->
    <a-modal
      v-model:open="showMessageDetailDialog"
      title="消息详情"
      width="800px"
      class="message-detail-modal"
    >
      <a-descriptions :column="2" border>
        <a-descriptions-item label="Topic">
          {{ currentMessage?.topic || '-' }}
          <a-button
            v-if="currentMessage?.topic"
            type="link"
            size="small"
            @click="copyFieldValue(currentMessage.topic, 'Topic')"
          >
            <template #icon><CopyOutlined /></template>
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="消息ID">
          {{ currentMessage?.messageId }}
          <a-button
            v-if="currentMessage?.messageId"
            type="link"
            size="small"
            @click="copyMessageId(currentMessage.messageId)"
          >
            <template #icon><CopyOutlined /></template>
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="StoreHost">
          {{ currentMessage?.storeHost || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="BornHost">
          {{ currentMessage?.bornHost || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="StoreTime">
          {{ currentMessage?.storeTimestamp ? dayjs(currentMessage.storeTimestamp).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="BornTime">
          {{ currentMessage?.bornTimestamp ? dayjs(currentMessage.bornTimestamp).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="Queue ID">
          {{ currentMessage?.queueId ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="Queue Offset">
          {{ currentMessage?.queueOffset ?? currentMessage?.offset ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="StoreSize">
          {{ currentMessage ? formatStoreSize(currentMessage.storeSize) : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="ReconsumeTimes">
          {{ currentMessage?.reconsumeTimes ?? 0 }}
        </a-descriptions-item>
        <a-descriptions-item label="BodyCRC">
          {{ currentMessage?.bodyCRC ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="SysFlag">
          {{ currentMessage?.sysFlag ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="Flag">
          {{ currentMessage?.flag ?? '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="PreparedTransactionOffset">
          {{ currentMessage?.preparedTransactionOffset ?? '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <div class="message-section">
        <div class="section-title">消息内容</div>
        <div class="body-line">
          <span>{{ currentMessage?.messageBody || '-' }}</span>
          <a-button
            v-if="currentMessage?.messageBody"
            type="link"
            size="small"
            @click="copyFieldValue(currentMessage.messageBody, 'Message Body')"
          >
            <template #icon><CopyOutlined /></template>
          </a-button>
        </div>
      </div>

      <div class="message-section" v-if="formattedProperties.length > 0">
        <div class="section-title">消息属性</div>
        <a-table :dataSource="formattedProperties" :pagination="false" bordered :rowKey="(record) => record.id">
          <a-table-column title="属性名" dataIndex="key" key="key" width="220" />
          <a-table-column title="属性值" dataIndex="value" key="value">
            <template #customRender="{ text }">
              <span>{{ text }}</span>
              <a-button type="link" size="small" @click="copyFieldValue(text, '属性值')">
                <template #icon><CopyOutlined /></template>
              </a-button>
            </template>
          </a-table-column>
        </a-table>
      </div>

      <div class="message-section" v-if="currentMessageTrackList.length > 0">
        <div class="section-title">消息追踪</div>
        <a-table :dataSource="currentMessageTrackList" :pagination="false" bordered :rowKey="(record, index) => `${record.consumerGroup}-${index}`">
          <a-table-column title="Consumer group" dataIndex="consumerGroup" key="consumerGroup" width="260" />
          <a-table-column title="状态" dataIndex="trackType" key="trackType" width="140">
            <template #customRender="{ text }">
              <a-tag :color="getTrackStatusColor(text)">{{ text }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" key="action" width="180">
            <template #default="{ record }">
              <a-button
                size="small"
                @click="resendByTrack(record.consumerGroup)"
                :loading="resendLoadingMap[`${record.consumerGroup}-${currentMessage?.messageId || ''}`]"
              >
                Resend Message
              </a-button>
            </template>
          </a-table-column>
          <a-table-column title="异常信息" dataIndex="exceptionDesc" key="exceptionDesc">
            <template #customRender="{ text }">
              {{ text || '-' }}
            </template>
          </a-table-column>
        </a-table>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.message-page {
  padding: 20px;
}

.tabs-placeholder {
  height: 46px;
  margin-bottom: 16px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.range-separator {
  margin: 0 8px;
  color: var(--a-text-color-secondary);
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

.body-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid #eceef2;
  border-radius: 6px;
  background: #fafbfd;
  padding: 10px 12px;
  word-break: break-all;
}

.body-line span {
  flex: 1;
}

:deep(.message-detail-modal .ant-modal-body) {
  padding-top: 12px;
}

:deep(.message-detail-modal .ant-descriptions-item-content) {
  word-break: break-all;
}

:deep(.message-detail-modal .ant-tag) {
  font-weight: 500;
}

:deep(.a-form) {
  margin-bottom: 20px;
}

:deep(.a-descriptions) {
  margin-bottom: 20px;
}

:deep(.a-table) {
  margin-top: 10px;
}
</style>

<style>
/* ant-design-vue tabs 穿透样式 —— 放在非 scoped 块中避免首次挂载时 CSS 注入时序导致 tab 错乱 */
.message-tabs .ant-tabs-nav-list {
  display: flex;
  flex-direction: row;
}
.message-tabs .ant-tabs-tab + .ant-tabs-tab {
  margin-left: 32px;
}
</style>
