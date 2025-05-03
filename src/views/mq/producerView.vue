<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  queryProducerConnection
} from '@/api/mq/producer'
import { queryTopicList } from '@/api/mq/topic'
import type {ConnectionSet } from '@/types/mq/producer'
import { SearchOutlined } from '@ant-design/icons-vue'

// State
const loading = ref(false)
const selectedTopic = ref('')
const producerGroup = ref('')
const connections = ref<ConnectionSet[]>([])
const topicOptions = ref<{ label: string; value: string }[]>([])
const tableData = ref<ConnectionSet[]>([])
const columns = [
  { title: 'clientId', dataIndex: 'clientId', key: 'clientId', align: 'center' },
  { title: 'clientAddr', dataIndex: 'clientAddr', key: 'clientAddr', align: 'center' },
  { title: 'language', dataIndex: 'language', key: 'language', align: 'center' },
  { title: 'versionDesc', dataIndex: 'versionDesc', key: 'versionDesc', align: 'center' }
]

// Methods
const loadTopics = async () => {
  loading.value = true
  try {
    const response = await queryTopicList()
    if (response && response.topicList.length > 0) {
      topicOptions.value = response.topicList.sort().map((t: string) => ({
        label: t,
        value: t
      }))
    } else {
      message.error('获取Topic列表失败')
    }
  } catch (error: any) {
    message.error(error.message || '获取Topic列表失败')
  } finally {
    loading.value = false
  }
}

const queryClientByTopicAndGroup = async () => {
  if (!selectedTopic.value || !producerGroup.value) {
    message.warning('请选择Topic和生产者组')
    return
  }

  loading.value = true
  try {
    const response = await queryProducerConnection(selectedTopic.value, producerGroup.value)
    if (response) {
      connections.value = response.connectionSet
      if (connections.value.length === 0) {
        message.info('未找到匹配的生产者连接')
      }
    } else {
      message.error('查询生产者连接失败')
    }
  } catch (error: any) {
    message.error(error.message || '查询生产者连接失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  if (!selectedTopic.value || !producerGroup.value) return
  const res = await queryProducerConnection(producerGroup.value, selectedTopic.value)
  tableData.value = res.connectionSet || []
}

onMounted(() => {
  loadTopics()
})
</script>

<template>
  <div class="producer-page">
    <div class="filter-bar">
      <span>主题：</span>
      <a-select v-model:value="selectedTopic" :options="topicOptions" style="width: 220px; margin-right: 16px;" />
      <span>生产组：</span>
      <a-input v-model:value="producerGroup" style="width: 240px; margin-right: 16px;" />
      <a-button type="primary" @click="handleSearch">
        <template #icon><SearchOutlined /></template>
        搜索
      </a-button>
    </div>
    <a-table
      :dataSource="tableData"
      :columns="columns"
      bordered
      :pagination="false"
      rowKey="clientId"
      class="producer-table"
    />
  </div>
</template>

<style scoped>
.producer-page {
  padding: 24px;
}

.producer-card {
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
  align-items: center;
  gap: 10px;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 14px;
}

:deep(.el-form) {
  margin-bottom: 20px;
}

:deep(.el-table) {
  margin-top: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.producer-table :deep(.ant-table-thead > tr > th) {
  font-weight: bold;
  text-align: center;
}
</style> 