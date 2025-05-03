<template>
  <div class="silence-mq">
    <a-row :gutter="24">
      <a-col :span="8">
        <a-card :bordered="false" title="消息队列状态">
          <a-statistic
            title="活跃队列数"
            :value="activeQueues"
            :value-style="{ color: '#3f8600' }"
          />
          <a-statistic
            title="待处理消息"
            :value="pendingMessages"
            :value-style="{ color: '#cf1322' }"
            style="margin-top: 16px"
          />
          <a-statistic
            title="处理中消息"
            :value="processingMessages"
            :value-style="{ color: '#1890ff' }"
            style="margin-top: 16px"
          />
        </a-card>
      </a-col>
      <a-col :span="16">
        <a-card :bordered="false" title="队列列表">
          <a-table
            :columns="columns"
            :data-source="queues"
            :pagination="{ pageSize: 5 }"
            :loading="loading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                  {{ record.status === 'active' ? '活跃' : '停用' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space>
                  <a @click="viewMessages(record)">查看消息</a>
                  <a-divider type="vertical" />
                  <a @click="editQueue(record)">编辑</a>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="800px"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="1" tab="队列信息">
          <a-form
            :model="formState"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 18 }"
            layout="horizontal"
          >
            <a-form-item
              label="队列名称"
              name="name"
              :rules="[{ required: true, message: '请输入队列名称' }]"
            >
              <a-input v-model:value="formState.name" placeholder="请输入队列名称" />
            </a-form-item>

            <a-form-item
              label="队列类型"
              name="type"
              :rules="[{ required: true, message: '请选择队列类型' }]"
            >
              <a-select v-model:value="formState.type" placeholder="请选择队列类型">
                <a-select-option value="direct">直连队列</a-select-option>
                <a-select-option value="topic">主题队列</a-select-option>
                <a-select-option value="fanout">广播队列</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              label="最大长度"
              name="maxLength"
            >
              <a-input-number v-model:value="formState.maxLength" :min="1" :max="100000" />
            </a-form-item>

            <a-form-item
              label="启用状态"
              name="enabled"
            >
              <a-switch v-model:checked="formState.enabled" />
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="2" tab="消息列表">
          <a-table
            :columns="messageColumns"
            :data-source="messages"
            :pagination="{ pageSize: 5 }"
            :loading="messageLoading"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'pending' ? 'orange' : 'green'">
                  {{ record.status === 'pending' ? '待处理' : '已处理' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

const loading = ref(false);
const messageLoading = ref(false);
const modalVisible = ref(false);
const modalTitle = ref('队列详情');
const activeTab = ref('1');

const activeQueues = ref(3);
const pendingMessages = ref(156);
const processingMessages = ref(23);

interface FormState {
  name: string;
  type: string;
  maxLength: number;
  enabled: boolean;
}

const formState = reactive<FormState>({
  name: '',
  type: 'direct',
  maxLength: 1000,
  enabled: true,
});

const columns = [
  {
    title: '队列名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
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
    title: '操作',
    key: 'action',
  },
];

const messageColumns = [
  {
    title: '消息ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
];

const queues = ref([
  {
    key: '1',
    name: '订单队列',
    type: 'direct',
    status: 'active',
    messageCount: 45,
  },
  {
    key: '2',
    name: '通知队列',
    type: 'topic',
    status: 'active',
    messageCount: 23,
  },
  {
    key: '3',
    name: '日志队列',
    type: 'fanout',
    status: 'active',
    messageCount: 88,
  },
]);

const messages = ref([
  {
    key: '1',
    id: 'MSG001',
    content: '订单创建成功',
    status: 'pending',
    createTime: '2024-03-22 10:00:00',
  },
  {
    key: '2',
    id: 'MSG002',
    content: '支付完成通知',
    status: 'processed',
    createTime: '2024-03-22 09:55:00',
  },
]);

const viewMessages = (record: any) => {
  modalTitle.value = `队列消息 - ${record.name}`;
  activeTab.value = '2';
  modalVisible.value = true;
};

const editQueue = (record: any) => {
  modalTitle.value = `编辑队列 - ${record.name}`;
  activeTab.value = '1';
  formState.name = record.name;
  formState.type = record.type;
  formState.enabled = record.status === 'active';
  modalVisible.value = true;
};

const handleModalOk = () => {
  if (activeTab.value === '1') {
    const index = queues.value.findIndex(item => item.name === formState.name);
    if (index !== -1) {
      queues.value[index] = {
        ...queues.value[index],
        type: formState.type,
        status: formState.enabled ? 'active' : 'inactive',
      };
      message.success('更新成功');
    }
  }
  modalVisible.value = false;
};

const handleModalCancel = () => {
  modalVisible.value = false;
};
</script>

<style scoped>
.silence-mq {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}
</style> 