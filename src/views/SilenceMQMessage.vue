<template>
  <div class="silence-mq-message">
    <a-card :bordered="false" title="消息管理">
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="队列名称">
          <a-select v-model:value="searchForm.queueName" placeholder="请选择队列" style="width: 200px">
            <a-select-option value="queue1">队列1</a-select-option>
            <a-select-option value="queue2">队列2</a-select-option>
            <a-select-option value="queue3">队列3</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="消息状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" style="width: 120px">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="时间范围">
          <a-range-picker v-model:value="searchForm.dateRange" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
          <a-button style="margin-left: 8px" type="primary" danger @click="handleRetryFailed">重试失败消息</a-button>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #status="{ text }">
          <a-tag :color="getStatusColor(text)">{{ getStatusText(text) }}</a-tag>
        </template>
        <template #content="{ text }">
          <div class="message-content">{{ text }}</div>
        </template>
        <template #action="{ record }">
          <a-space>
            <a @click="showDetail(record)">详情</a>
            <a @click="retryMessage(record)" v-if="record.status === 'failed'">重试</a>
            <a @click="deleteMessage(record)" class="danger">删除</a>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="detailVisible"
      title="消息详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="1">
        <a-descriptions-item label="消息ID">{{ currentMessage?.id }}</a-descriptions-item>
        <a-descriptions-item label="队列名称">{{ currentMessage?.queueName }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(currentMessage?.status)">{{ getStatusText(currentMessage?.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentMessage?.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ currentMessage?.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="重试次数">{{ currentMessage?.retryCount }}</a-descriptions-item>
        <a-descriptions-item label="消息内容">
          <pre class="message-detail-content">{{ currentMessage?.content }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="错误信息" v-if="currentMessage?.error">
          <pre class="message-detail-content error">{{ currentMessage?.error }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';

interface SearchForm {
  queueName: string;
  status: string;
  dateRange: [string, string];
}

interface Message {
  id: string;
  queueName: string;
  status: string;
  content: string;
  createTime: string;
  updateTime: string;
  retryCount: number;
  error?: string;
}

const searchForm = reactive<SearchForm>({
  queueName: '',
  status: '',
  dateRange: ['', ''],
});

const loading = ref(false);
const detailVisible = ref(false);
const currentMessage = ref<Message | null>(null);

const columns = [
  {
    title: '消息ID',
    dataIndex: 'id',
    key: 'id',
    width: 200,
  },
  {
    title: '队列名称',
    dataIndex: 'queueName',
    key: 'queueName',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    slots: { customRender: 'status' },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '重试次数',
    dataIndex: 'retryCount',
    key: 'retryCount',
    width: 100,
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    slots: { customRender: 'content' },
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    slots: { customRender: 'action' },
  },
];

const dataSource = ref<Message[]>([
  {
    id: 'msg-001',
    queueName: '队列1',
    status: 'pending',
    content: '{"type": "notification", "data": {"title": "测试消息", "content": "这是一条测试消息"}}',
    createTime: '2024-03-20 10:00:00',
    updateTime: '2024-03-20 10:00:00',
    retryCount: 0,
  },
  {
    id: 'msg-002',
    queueName: '队列2',
    status: 'failed',
    content: '{"type": "task", "data": {"taskId": "task-001", "action": "process"}}',
    createTime: '2024-03-20 10:30:00',
    updateTime: '2024-03-20 10:31:00',
    retryCount: 2,
    error: '处理超时',
  },
]);

const pagination = reactive<TablePaginationConfig>({
  total: 100,
  current: 1,
  pageSize: 10,
});

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'blue',
    processing: 'orange',
    completed: 'green',
    failed: 'red',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };
  return texts[status] || status;
};

const handleSearch = () => {
  console.log('Search form:', searchForm);
  // TODO: 实现搜索逻辑
};

const handleReset = () => {
  searchForm.queueName = '';
  searchForm.status = '';
  searchForm.dateRange = ['', ''];
  handleSearch();
};

const handleRetryFailed = () => {
  Modal.confirm({
    title: '确认重试',
    content: '确定要重试所有失败的消息吗？',
    onOk: () => {
      message.success('开始重试失败消息');
      // TODO: 实现重试逻辑
    },
  });
};

const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  // TODO: 实现分页逻辑
};

const showDetail = (record: Message) => {
  currentMessage.value = record;
  detailVisible.value = true;
};

const retryMessage = (record: Message) => {
  Modal.confirm({
    title: '确认重试',
    content: `确定要重试消息 ${record.id} 吗？`,
    onOk: () => {
      message.success(`重试消息: ${record.id}`);
      // TODO: 实现重试逻辑
    },
  });
};

const deleteMessage = (record: Message) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除消息 ${record.id} 吗？`,
    onOk: () => {
      message.success(`删除消息: ${record.id}`);
      // TODO: 实现删除逻辑
    },
  });
};
</script>

<style scoped>
.silence-mq-message {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.search-form {
  margin-bottom: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 2px;
}

.message-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-detail-content {
  max-height: 300px;
  overflow: auto;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 2px;
  font-family: monospace;
  white-space: pre-wrap;
}

.message-detail-content.error {
  background: #fff1f0;
  color: #ff4d4f;
}

.danger {
  color: #ff4d4f;
}
</style> 