<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { message} from 'ant-design-vue'
import { queryMessages, viewMessage, findByKeyAndTopic } from '@/api/mq/message'
import type { MessageQuery, Message, MessageView } from '@/types/mq/message'
import { queryTopicList } from '@/api/mq/topic'
import { SearchOutlined } from '@ant-design/icons-vue'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { sendMessage } from '@/api/mq/topic'
import type { MessageRequest } from '@/api/mq/topic'
import dayjs from 'dayjs'

moment.locale('zh-cn')

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
const currentMessage = ref<Message | null>(null)
const newMessage = ref<MessageRequest>({ topic: '', tag: '', key: '', messageBody: '', traceEnabled: false })

// Tabs
const activeTab = ref<'topic' | 'messageKey' | 'messageId'>('topic')

// Methods
const loadTopics = async () => {
  try {
    const data = await queryTopicList(true)
    topics.value = data.topicList.map(item => item).sort()
   
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
      if (result && result.messageView) {
        currentMessage.value = result.messageView
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

const viewMessageDetail = async (msg: Message) => {
  try {
    const result = await viewMessage(msg.msgId, msg.topic)
    currentMessage.value = result.messageView
    showMessageDetailDialog.value = true
  } catch (error: any) {
    message.error(error.message || '获取消息详情失败')
  }
}

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

onMounted(() => {
  loadTopics()
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  searchForm.startTime = dayjs(threeHoursAgo)
  searchForm.endTime = dayjs(now)

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
  return Object.entries(currentMessage.value.properties).map(([key, value]) => ({
    key,
    value
  }))
})

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
    <a-tabs
      v-model:activeKey="activeTab"
      tabPosition="top"
      type="line"
      style="margin-bottom:16px; width:100%;"
    >
      <a-tab-pane key="topic" tab="TOPIC" />
      <a-tab-pane key="messageKey" tab="MESSAGE KEY" />
      <a-tab-pane key="messageId" tab="MESSAGE ID" />
    </a-tabs>

    <!-- Total Count -->
    <div style="margin-bottom:16px;font-weight:bold;">
      Total {{ totalCount }} Messages
    </div>

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

    <!-- Results Table -->
    <a-table
      :dataSource="messages"
      :rowKey="(record: Message) => record.msgId"
      :pagination="false"
      bordered
    >
      <a-table-column title="Message ID" dataIndex="msgId" key="msgId" />
      <a-table-column title="Tag" :dataIndex="['properties', 'TAGS']" key="tag" />
      <a-table-column title="Key" :dataIndex="['properties', 'KEYS']" key="key" />
      <a-table-column title="StoreTime" dataIndex="storeTimestamp" key="storeTimestamp">
        <template #customRender="{ text }">
          {{ text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '' }}
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

    <!-- Send Message Dialog -->
    <a-modal
      v-model:open="showSendDialog"
      title="发送消息"
      width="600px"
    >
      <a-form :model="newMessage" label-width="100px">
        <a-form-item label="Topic" required>
          <a-select
            v-model="newMessage.topic"
            placeholder="选择Topic"
            filterable
            style="width: 100%"
          >
            <a-option
              v-for="topic in topics"
              :key="topic"
              :label="topic"
              :value="topic"
            />
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
    >
      <a-descriptions :column="2" border>
        <a-descriptions-item label="消息ID">
          {{ currentMessage?.msgId }}
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
      </a-descriptions>

      <div class="message-section">
        <div class="section-title">消息内容</div>
        <a-textarea
          :value="currentMessage?.messageBody"
          rows="6"
          readonly
        />
      </div>

      <div class="message-section" v-if="formattedProperties.length > 0">
        <div class="section-title">消息属性</div>
        <a-table :data="formattedProperties" border stripe>
          <a-table-column label="属性名" prop="key" />
          <a-table-column label="属性值" prop="value" show-overflow-tooltip />
        </a-table>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.message-page {
  padding: 20px;
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