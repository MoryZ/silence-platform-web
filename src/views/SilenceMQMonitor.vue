<template>
  <div class="silence-mq-monitor">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-card :bordered="false" title="队列统计">
          <a-statistic
            title="活跃队列数"
            :value="statistics.activeQueues"
            :value-style="{ color: '#3f8600' }"
          />
          <a-statistic
            title="待处理消息"
            :value="statistics.pendingMessages"
            :value-style="{ color: '#cf1322' }"
            style="margin-top: 16px"
          />
          <a-statistic
            title="处理中消息"
            :value="statistics.processingMessages"
            :value-style="{ color: '#1890ff' }"
            style="margin-top: 16px"
          />
          <a-statistic
            title="失败消息"
            :value="statistics.failedMessages"
            :value-style="{ color: '#ff4d4f' }"
            style="margin-top: 16px"
          />
        </a-card>
      </a-col>
      <a-col :span="18">
        <a-card :bordered="false" title="消息处理趋势">
          <div ref="chartRef" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="12">
        <a-card :bordered="false" title="队列状态">
          <a-table
            :columns="queueColumns"
            :data-source="queueData"
            :pagination="false"
            size="small"
          >
            <template #status="{ text }">
              <a-tag :color="getQueueStatusColor(text)">{{ text }}</a-tag>
            </template>
            <template #action="{ record }">
              <a-space>
                <a @click="showQueueDetail(record)">详情</a>
                <a @click="pauseQueue(record)" v-if="record.status === 'active'">暂停</a>
                <a @click="resumeQueue(record)" v-if="record.status === 'paused'">恢复</a>
              </a-space>
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card :bordered="false" title="消费者状态">
          <a-table
            :columns="consumerColumns"
            :data-source="consumerData"
            :pagination="false"
            size="small"
          >
            <template #status="{ text }">
              <a-tag :color="getConsumerStatusColor(text)">{{ text }}</a-tag>
            </template>
            <template #action="{ record }">
              <a-space>
                <a @click="showConsumerDetail(record)">详情</a>
                <a @click="restartConsumer(record)" v-if="record.status === 'error'">重启</a>
              </a-space>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:visible="queueDetailVisible"
      title="队列详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="2">
        <a-descriptions-item label="队列名称">{{ currentQueue?.name }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getQueueStatusColor(currentQueue?.status)">{{ currentQueue?.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="消息总数">{{ currentQueue?.totalMessages }}</a-descriptions-item>
        <a-descriptions-item label="消费者数量">{{ currentQueue?.consumerCount }}</a-descriptions-item>
        <a-descriptions-item label="处理速率">{{ currentQueue?.processRate }}/s</a-descriptions-item>
        <a-descriptions-item label="平均处理时间">{{ currentQueue?.avgProcessTime }}ms</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentQueue?.createTime }}</a-descriptions-item>
        <a-descriptions-item label="最后更新时间">{{ currentQueue?.updateTime }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <a-modal
      v-model:visible="consumerDetailVisible"
      title="消费者详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="2">
        <a-descriptions-item label="消费者ID">{{ currentConsumer?.id }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getConsumerStatusColor(currentConsumer?.status)">{{ currentConsumer?.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="队列名称">{{ currentConsumer?.queueName }}</a-descriptions-item>
        <a-descriptions-item label="处理消息数">{{ currentConsumer?.processedMessages }}</a-descriptions-item>
        <a-descriptions-item label="失败消息数">{{ currentConsumer?.failedMessages }}</a-descriptions-item>
        <a-descriptions-item label="最后活跃时间">{{ currentConsumer?.lastActiveTime }}</a-descriptions-item>
        <a-descriptions-item label="错误信息" v-if="currentConsumer?.error" :span="2">
          <pre class="error-message">{{ currentConsumer?.error }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import * as echarts from 'echarts';

interface Statistics {
  activeQueues: number;
  pendingMessages: number;
  processingMessages: number;
  failedMessages: number;
}

interface Queue {
  name: string;
  status: string;
  totalMessages: number;
  consumerCount: number;
  processRate: number;
  avgProcessTime: number;
  createTime: string;
  updateTime: string;
}

interface Consumer {
  id: string;
  status: string;
  queueName: string;
  processedMessages: number;
  failedMessages: number;
  lastActiveTime: string;
  error?: string;
}

const statistics = reactive<Statistics>({
  activeQueues: 5,
  pendingMessages: 1000,
  processingMessages: 50,
  failedMessages: 10,
});

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

const queueColumns = [
  {
    title: '队列名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' },
  },
  {
    title: '消息数',
    dataIndex: 'totalMessages',
    key: 'totalMessages',
  },
  {
    title: '处理速率',
    dataIndex: 'processRate',
    key: 'processRate',
    render: (text: number) => `${text}/s`,
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

const consumerColumns = [
  {
    title: '消费者ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' },
  },
  {
    title: '队列',
    dataIndex: 'queueName',
    key: 'queueName',
  },
  {
    title: '处理消息数',
    dataIndex: 'processedMessages',
    key: 'processedMessages',
  },
  {
    title: '最后活跃',
    dataIndex: 'lastActiveTime',
    key: 'lastActiveTime',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

const queueData = ref<Queue[]>([
  {
    name: '队列1',
    status: 'active',
    totalMessages: 1000,
    consumerCount: 2,
    processRate: 100,
    avgProcessTime: 50,
    createTime: '2024-03-20 10:00:00',
    updateTime: '2024-03-20 10:30:00',
  },
  {
    name: '队列2',
    status: 'paused',
    totalMessages: 500,
    consumerCount: 1,
    processRate: 0,
    avgProcessTime: 0,
    createTime: '2024-03-20 10:00:00',
    updateTime: '2024-03-20 10:25:00',
  },
]);

const consumerData = ref<Consumer[]>([
  {
    id: 'consumer-1',
    status: 'active',
    queueName: '队列1',
    processedMessages: 5000,
    failedMessages: 10,
    lastActiveTime: '2024-03-20 10:30:00',
  },
  {
    id: 'consumer-2',
    status: 'error',
    queueName: '队列1',
    processedMessages: 3000,
    failedMessages: 50,
    lastActiveTime: '2024-03-20 10:28:00',
    error: '连接超时',
  },
]);

const queueDetailVisible = ref(false);
const consumerDetailVisible = ref(false);
const currentQueue = ref<Queue | null>(null);
const currentConsumer = ref<Consumer | null>(null);

const getQueueStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    paused: 'warning',
    error: 'error',
  };
  return colors[status] || 'default';
};

const getConsumerStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    idle: 'warning',
    error: 'error',
  };
  return colors[status] || 'default';
};

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    const option = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['处理成功', '处理失败'],
      },
      xAxis: {
        type: 'category',
        data: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '处理成功',
          type: 'line',
          data: [120, 132, 101, 134, 90, 230, 210],
        },
        {
          name: '处理失败',
          type: 'line',
          data: [2, 1, 3, 1, 2, 5, 3],
        },
      ],
    };
    chart.setOption(option);
  }
};

const showQueueDetail = (record: Queue) => {
  currentQueue.value = record;
  queueDetailVisible.value = true;
};

const showConsumerDetail = (record: Consumer) => {
  currentConsumer.value = record;
  consumerDetailVisible.value = true;
};

const pauseQueue = (record: Queue) => {
  Modal.confirm({
    title: '确认暂停',
    content: `确定要暂停队列 ${record.name} 吗？`,
    onOk: () => {
      message.success(`暂停队列: ${record.name}`);
      // TODO: 实现暂停逻辑
    },
  });
};

const resumeQueue = (record: Queue) => {
  Modal.confirm({
    title: '确认恢复',
    content: `确定要恢复队列 ${record.name} 吗？`,
    onOk: () => {
      message.success(`恢复队列: ${record.name}`);
      // TODO: 实现恢复逻辑
    },
  });
};

const restartConsumer = (record: Consumer) => {
  Modal.confirm({
    title: '确认重启',
    content: `确定要重启消费者 ${record.id} 吗？`,
    onOk: () => {
      message.success(`重启消费者: ${record.id}`);
      // TODO: 实现重启逻辑
    },
  });
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', () => chart?.resize());
});

onUnmounted(() => {
  chart?.dispose();
  window.removeEventListener('resize', () => chart?.resize());
});
</script>

<style scoped>
.silence-mq-monitor {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.error-message {
  margin: 0;
  padding: 8px;
  background: #fff1f0;
  border-radius: 2px;
  color: #ff4d4f;
  font-family: monospace;
  white-space: pre-wrap;
}
</style> 