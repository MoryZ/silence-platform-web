<template>
  <div class="silence-mq-queue">
    <a-card :bordered="false">
      <template #title>队列管理</template>
      <template #extra>
        <a-button type="primary">
          <template #icon><plus-outlined /></template>
          新建队列
        </a-button>
      </template>
      
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'success' : record.status === 'paused' ? 'warning' : 'error'">
              {{ record.statusText }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="handleEdit(record as QueueItem)"
              >
                编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                @click="handleView(record as QueueItem)"
              >
                查看
              </a-button>
              <a-popconfirm
                title="确定要删除这个队列吗？"
                @confirm="() => handleDelete(record as QueueItem)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { Card as ACard, Table as ATable, Tag as ATag, Space as ASpace, Button as AButton, Popconfirm as APopconfirm } from 'ant-design-vue';
import type { TableProps, TableColumnType } from 'ant-design-vue';

interface QueueItem {
  key: string;
  name: string;
  type: string;
  status: string;
  statusText: string;
  messageCount: number;
  consumerCount: number;
  createTime: string;
}

const columns: TableColumnType<QueueItem>[] = [
  {
    title: '队列名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '队列类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '消息数量',
    dataIndex: 'messageCount',
    key: 'messageCount',
  },
  {
    title: '消费者数量',
    dataIndex: 'consumerCount',
    key: 'consumerCount',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right' as const,
    width: 200,
  },
];

const loading = ref(false);
const dataSource = ref<QueueItem[]>([
  {
    key: '1',
    name: 'user.notification',
    type: '普通队列',
    status: 'active',
    statusText: '运行中',
    messageCount: 1000,
    consumerCount: 5,
    createTime: '2024-01-01 12:00:00',
  },
  {
    key: '2',
    name: 'order.payment',
    type: '延迟队列',
    status: 'paused',
    statusText: '已暂停',
    messageCount: 500,
    consumerCount: 3,
    createTime: '2024-01-01 11:00:00',
  },
]);

const pagination = {
  total: 2,
  current: 1,
  pageSize: 10,
};

const handleTableChange: TableProps['onChange'] = (pagination, filters, sorter) => {
  console.log(pagination, filters, sorter);
};

const handleEdit = (record: QueueItem) => {
  console.log('Edit queue:', record);
};

const handleView = (record: QueueItem) => {
  console.log('View queue:', record);
};

const handleDelete = (record: QueueItem) => {
  console.log('Delete queue:', record);
};
</script>

<style scoped>
.silence-mq-queue {
  padding: 24px;
  background: var(--color-bg-container);
}
</style> 