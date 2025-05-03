<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
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

const showResendDialog = ref(false)
const showMessageDetailDialog = ref(false)
const currentMessage = ref<MessageView | null>(null)
const resendConfig = ref<ResendDLQMessageRequest>({
  messageId: '',
  topic: '',
  consumerGroup: '',
  delayLevel: 0
})

// Methods
const loadConsumerGroups = async () => {
  loading.value = true
  try {
    const response = await fetch('/consumer/groupList.query')
    const data = await response.json()
    if (data.status === 0) {
      consumerGroups.value = data.data
    } else {
      message.error(data.errMsg || '获取消费者组列表失败')
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

  loading.value = true
  try {
    const query: DLQMessageQuery = {
      topic: `%DLQ%${selectedGroup.value}`,
      consumerGroup: selectedGroup.value,
      begin: (currentPage.value - 1) * pageSize.value,
      end: currentPage.value * pageSize.value,
      beginTime: beginTime.value || undefined,
      endTime: endTime.value || undefined,
      messageId: messageId.value || undefined
    }

    const response = await fetch('/message/queryDLQMessageByConsumerGroup.query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    })

    const data = await response.json()
    if (data.status === 0) {
      messages.value = data.data.messages
      totalCount.value = data.data.total
      if (messages.value.length === 0) {
        message.info('未找到匹配的死信队列消息')
      }
    } else {
      message.error(data.errMsg || '查询死信队列消息失败')
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

const viewMessageDetail = (message: MessageView) => {
  currentMessage.value = message
  showMessageDetailDialog.value = true
}

const openResendDialog = (message: MessageView) => {
  resendConfig.value = {
    messageId: message.messageId,
    topic: message.topic,
    consumerGroup: selectedGroup.value,
    delayLevel: 0
  }
  showResendDialog.value = true
}

const resendMessage = async () => {
  try {
    const response = await fetch('/message/resendDLQMessage.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendConfig.value)
    })

    const data = await response.json()
    if (data.status === 0) {
      message.success('重发消息成功')
      showResendDialog.value = false
      await searchMessages()
    } else {
      message.error(data.errMsg || '重发消息失败')
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

onMounted(() => {
  loadConsumerGroups()
})

// Computed
const formattedProperties = computed(() => {
  if (!currentMessage.value?.properties) return []
  return Object.entries(currentMessage.value.properties).map(([key, value]) => ({
    key,
    value
  }))
})

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
    <a-card class="search-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <h3 class="header-title">死信队列消息查询</h3>
          <div class="header-actions">
            <a-button @click="resetForm">重置</a-button>
            <a-button type="primary" @click="loadConsumerGroups">
              刷新
            </a-button>
          </div>
        </div>
      </template>

      <a-form :inline="true" @submit.prevent="searchMessages">
        <a-form-item label="消费者组" required>
          <a-select
            v-model="selectedGroup"
            placeholder="请选择消费者组"
            clearable
            filterable
            style="width: 300px"
          >
            <a-option
              v-for="group in consumerGroups"
              :key="group.groupName"
              :label="group.groupName"
              :value="group.groupName"
            />
          </a-select>
        </a-form-item>

        <a-form-item label="时间范围">
          <a-date-picker
            v-model="beginTime"
            type="datetime"
            placeholder="开始时间"
            style="width: 200px"
          />
          <span class="range-separator">至</span>
          <a-date-picker
            v-model="endTime"
            type="datetime"
            placeholder="结束时间"
            style="width: 200px"
          />
        </a-form-item>

        <a-form-item label="消息ID">
          <a-input
            v-model="messageId"
            placeholder="输入消息ID"
            clearable
            style="width: 300px"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="searchMessages">
            查询
          </a-button>
        </a-form-item>
      </a-form>

      <a-table
        :dataSource="messages"
        :pagination="false"
        bordered
        :locale="{ emptyText: '暂无数据' }"
      >
        <a-table-column label="消息ID" prop="messageId" min-width="220" show-overflow-tooltip />
        <a-table-column label="Topic" prop="topic" min-width="180" show-overflow-tooltip />
        <a-table-column label="存储大小" prop="storeSize" width="100">
          <template #default="{ row }">
            {{ (row.storeSize / 1024).toFixed(2) }} KB
          </template>
        </a-table-column>
        <a-table-column label="队列ID" prop="queueId" width="80" />
        <a-table-column label="存储时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.storeTimestamp).toLocaleString() }}
          </template>
        </a-table-column>
        <a-table-column label="生产时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.bornTimestamp).toLocaleString() }}
          </template>
        </a-table-column>
        <a-table-column label="生产者" prop="bornHost" width="150" show-overflow-tooltip />
        <a-table-column label="存储节点" prop="storeHost" width="150" show-overflow-tooltip />
        <a-table-column label="重试次数" prop="reconsumeTimes" width="100" />
        <a-table-column label="消息类型" prop="msgType" width="120">
          <template #default="{ row }">
            <a-tag :type="row.msgType === 'NORMAL' ? '' : 'warning'">
              {{ row.msgType }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <a-button
              type="primary"
              size="small"
              @click="viewMessageDetail(row)"
            >
              详情
            </a-button>
            <a-button
              type="success"
              size="small"
              @click="openResendDialog(row)"
            >
              重发
            </a-button>
          </template>
        </a-table-column>
      </a-table>

      <div class="pagination-container" v-if="totalCount > 0">
        <a-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>

      <div v-if="messages.length === 0" class="no-results">
        未找到匹配的死信队列消息
      </div>
    </a-card>

    <!-- 重发消息对话框 -->
    <a-dialog
      v-model="showResendDialog"
      title="重发死信队列消息"
      width="500px"
    >
      <a-form :model="resendConfig" label-width="100px">
        <a-form-item label="Topic">
          <a-input
            v-model="resendConfig.topic"
            readonly
          />
        </a-form-item>

        <a-form-item label="消费者组">
          <a-input
            v-model="resendConfig.consumerGroup"
            readonly
          />
        </a-form-item>

        <a-form-item label="延时级别">
          <a-select
            v-model="resendConfig.delayLevel"
            style="width: 100%"
          >
            <a-option
              v-for="level in delayLevels"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            />
          </a-select>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showResendDialog = false">取消</a-button>
        <a-button type="primary" @click="resendMessage">
          重发
        </a-button>
      </template>
    </a-dialog>

    <!-- 消息详情对话框 -->
    <a-dialog
      v-model="showMessageDetailDialog"
      title="消息详情"
      width="800px"
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
        <a-input
          type="textarea"
          :rows="6"
          :model-value="currentMessage?.messageBody"
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
    </a-dialog>
  </div>
</template>

<style scoped>
.dlq-message-page {
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

:deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}
:deep(.ant-tabs-tab) {
  font-size: 16px;
  font-weight: 500;
  padding: 8px 32px;
}

:deep(.ant-form-inline .ant-form-item) {
  margin-right: 24px;
  margin-bottom: 8px;
}
</style> 