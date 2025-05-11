<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, defineAsyncComponent } from 'vue'
import type { MessageTraceView } from '@/types/mq/messageTrace'
import { viewTraceMessage, viewTraceMessageDetail, viewMessageTraceGraph } from '@/api/mq/messageTrace'
import { queryTopicList } from '@/api/mq/topic'
import { findByKeyAndTopic, viewMessage } from '@/api/mq/message'
import { message } from 'ant-design-vue'

// ECharts 组件注册
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent, LegendComponent, DatasetComponent } from 'echarts/components'

use([
  CanvasRenderer,
  SVGRenderer,
  BarChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent
])

const VChart = defineAsyncComponent(() => import('vue-echarts'))

// State
const activeTab = ref<'messageKey' | 'messageId'>('messageKey')
const topics = ref<string[]>([])
const consumerGroups = ref<string[]>([])

const traces = ref<MessageTraceView[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const searchForm = ref({
  topic: '',
  key: '',
  messageId: ''
})
const messages = ref<any[]>([])
const loading = ref(false)

const showDetailDialog = ref(false)
const traceDetail = ref<any>(null)
const graphOption = ref<any>(null)
const graphLoading = ref(false)
const traceGraphData = ref<any>(null)

// Methods
const loadTopics = async () => {
  try {
    const data = await queryTopicList(true)
    topics.value = data.topicList.sort()
  } catch (e) {
    message.error('获取Topic失败')
  }
}

const search = async () => {
  if (!searchForm.value.topic) {
    message.warning('请选择Topic')
    return
  }
  loading.value = true
  try {
    if (activeTab.value === 'messageKey') {
      if (!searchForm.value.key) {
        message.warning('请输入消息Key')
        return
      }
      const result = await findByKeyAndTopic(searchForm.value.key, searchForm.value.topic)
      messages.value = result || []
    } else if (activeTab.value === 'messageId') {
      if (!searchForm.value.messageId) {
        message.warning('请输入消息ID')
        return
      }
      const result = await viewMessage(searchForm.value.messageId, searchForm.value.topic)
      messages.value = result && result.messageView ? [result.messageView] : []
    }
  } catch (e) {
    message.error('查询失败')
  } finally {
    loading.value = false
  }
}

const handleViewTraceDetail = async (record: any) => {
  try {
    const res = await viewTraceMessageDetail(record.msgId)
    traceDetail.value = res

    graphLoading.value = true
    const graphRes = await viewMessageTraceGraph(record.msgId)
    graphOption.value = buildTraceGraphOption(graphRes)
    traceGraphData.value = graphRes
    graphLoading.value = false

    showDetailDialog.value = true
    await nextTick()
  } catch (e) {
    message.error('获取轨迹详情失败')
  }
}

function buildTraceGraphOption(graphRes: any) {
  if (!graphRes || !graphRes.producerNode) return {};
  const producer = graphRes.producerNode;
  const trace = producer.traceNode;
  if (!trace || typeof trace.costTime !== 'number') {
    return {
      title: { text: producer.topic, left: 'center', top: 10, textStyle: { fontSize: 18 } },
      series: []
    };
  }

  return {
    title: {
      text: producer.topic,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 18 }
    },
    grid: { left: 60, right: 40, top: 60, bottom: 60 },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 14 },
      extraCssText: 'box-shadow:0 2px 8px rgba(0,0,0,0.15);',
      formatter: () => {
        // 格式化时间戳
        const formatTime = (ts: number) => ts ? new Date(ts).toLocaleString() : '-';
        return `
          <div style="line-height:1.7;">
            <b>costTime:</b> ${trace.costTime}ms<br/>
            <b>status:</b> ${trace.status}<br/>
            <b>beginTimestamp:</b> ${formatTime(trace.beginTimestamp)}<br/>
            <b>endTimestamp:</b> ${formatTime(trace.endTimestamp)}<br/>
            <b>clientHost:</b> ${trace.clientHost}<br/>
            <b>storeHost:</b> ${trace.storeHost}<br/>
            <b>retryTimes:</b> ${trace.retryTimes}<br/>
            <b>msgType:</b> ${trace.msgType}
          </div>
        `;
      }
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: Math.max(trace.costTime * 1.2, 100),
      axisLabel: { formatter: '{value}.00ms' }
    },
    yAxis: {
      type: 'category',
      data: [producer.groupName],
      axisLabel: { fontWeight: 'bold' }
    },
    series: [
      {
        type: 'bar',
        data: [{
          value: trace.costTime,
          itemStyle: { color: '#7ed957' },
          label: {
            show: true,
            position: 'inside',
            formatter: `${trace.costTime}ms`
          }
        }],
        barWidth: 40
      }
    ]
  }
}

onMounted(() => {
  loadTopics()
})

watch(activeTab, () => {
  // 切换tab时清空表单和结果
  searchForm.value.key = ''
  searchForm.value.messageId = ''
  messages.value = []
})
</script>

<template>
  <div class="trace-page">
    <a-tabs v-model:activeKey="activeTab" tabPosition="top" type="line">
      <a-tab-pane key="messageKey" tab="MESSAGE KEY" />
      <a-tab-pane key="messageId" tab="MESSAGE ID" />
    </a-tabs>

    <a-form layout="inline" style="margin-bottom:16px">
      <a-form-item label="Topic">
        <a-select v-model:value="searchForm.topic" :options="topics.map(t => ({ label: t, value: t }))" style="width:180px" />
      </a-form-item>
      <template v-if="activeTab === 'messageKey'">
        <a-form-item label="Key">
          <a-input v-model:value="searchForm.key" style="width:180px" />
        </a-form-item>
      </template>
      <template v-if="activeTab === 'messageId'">
        <a-form-item label="Message ID">
          <a-input v-model:value="searchForm.messageId" style="width:180px" />
        </a-form-item>
      </template>
      <a-form-item>
        <a-button type="primary" @click="search">搜索</a-button>
      </a-form-item>
    </a-form>

    <a-table :dataSource="messages" :pagination="false" bordered>
      <a-table-column title="Message ID" dataIndex="msgId" key="msgId" />
      <a-table-column title="Tag" :dataIndex="['properties', 'TAGS']" key="tag" />
      <a-table-column title="Message Key" :dataIndex="['properties', 'KEYS']" key="key" />
      <a-table-column title="StoreTime" dataIndex="storeTimestamp" key="storeTimestamp">
        <template #customRender="{ text }">
          {{ text ? new Date(text).toLocaleString() : '' }}
        </template>
      </a-table-column>
      <a-table-column title="Operation" key="operation">
        <template #default="{ record }">
          <a-button type="primary" size="small" @click="handleViewTraceDetail(record)">消息轨迹详情</a-button>
        </template>
      </a-table-column>
    </a-table>

    <a-modal
      v-model:open="showDetailDialog"
      title=""
      width="900px"
      :footer="null"
      :closable="false"
      :bodyStyle="{ padding: '0 24px 24px 24px' }"
    >
      <div style="padding: 24px 0 0 0;">
        <!-- Message Trace Graph -->
        <div style="color:#4db3ff;font-size:18px;font-weight:500;margin-bottom:8px;">Message Trace Graph</div>
        <div style="text-align:center;font-size:20px;font-weight:600;margin-bottom:8px;">
          {{ traceDetail?.topic || '' }}
        </div>
        <div style="background:#fafbfc;padding:12px 0 0 0;">
          <v-chart
            v-if="graphOption"
            :option="graphOption"
            autoresize
            style="height:220px;width:100%;"
          />
          <a-spin v-else-if="graphLoading" />
        </div>
      </div>

      <!-- Send Message Trace -->
      <div style="margin-top:24px;">
        <div style="color:#4db3ff;font-size:16px;font-weight:500;margin-bottom:8px;">Send Message Trace</div>
        <div style="margin-bottom:8px;">
          Send Message Info : ( Message Id <b style="font-size:15px;">{{ traceDetail?.msgId }}</b> )
        </div>
        <a-descriptions :column="3" bordered size="small">
          <a-descriptions-item label="Topic">{{ traceGraphData?.producerNode?.topic }}</a-descriptions-item>
          <a-descriptions-item label="ProducerGroup">{{ traceGraphData?.producerNode?.groupName }}</a-descriptions-item>
          <a-descriptions-item label="Message Key">{{ traceGraphData?.producerNode?.keys }}</a-descriptions-item>
          <a-descriptions-item label="Tag">{{ traceGraphData?.producerNode?.tags }}</a-descriptions-item>
          <a-descriptions-item label="BeginTimestamp">{{ traceGraphData?.producerNode?.traceNode?.beginTimestamp }}</a-descriptions-item>
          <a-descriptions-item label="EndTimestamp">{{ traceGraphData?.producerNode?.traceNode?.endTimestamp }}</a-descriptions-item>
          <a-descriptions-item label="CostTime">{{ traceGraphData?.producerNode?.traceNode?.costTime }}ms</a-descriptions-item>
          <a-descriptions-item label="MsgType">{{ traceGraphData?.producerNode?.traceNode?.msgType }}</a-descriptions-item>
          <a-descriptions-item label="ClientHost">{{ traceGraphData?.producerNode?.traceNode?.clientHost }}</a-descriptions-item>
          <a-descriptions-item label="StoreHost">{{ traceGraphData?.producerNode?.traceNode?.storeHost }}</a-descriptions-item>
          <a-descriptions-item label="RetryTimes">{{ traceGraphData?.producerNode?.traceNode?.retryTimes }}</a-descriptions-item>
          <a-descriptions-item label="OffSetMsgId">{{ traceGraphData?.producerNode?.offSetMsgId }}</a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- Consume Message Trace -->
      <div style="margin-top:24px;">
        <div style="color:#4db3ff;font-size:16px;font-weight:500;margin-bottom:8px;">Consume Message Trace</div>
        <div v-if="traceGraphData?.subscriptionNodeList && traceGraphData.subscriptionNodeList.length > 0">
          <a-table
            :dataSource="traceGraphData.subscriptionNodeList"
            :pagination="false"
            size="small"
            bordered
            rowKey="groupName"
          >
            <a-table-column title="ConsumerGroup" dataIndex="groupName" key="groupName" />
            <a-table-column title="ClientHost">
              <template #default="{ record }">
                {{ record.traceNode.clientHost }}
              </template>
            </a-table-column>
            <a-table-column title="CostTime">
              <template #default="{ record }">
                {{ record.traceNode.costTime }}
              </template>
            </a-table-column>
            <a-table-column title="Status">
              <template #default="{ record }">
                {{ record.traceNode.status }}
              </template>
            </a-table-column>
            <a-table-column title="RetryTimes">
              <template #default="{ record }">
                {{ record.traceNode.retryTimes }}
              </template>
            </a-table-column>
            <a-table-column title="ConsumeTime">
              <template #default="{ record }">
                {{ record.traceNode.beginTimestamp }}
              </template>
            </a-table-column>
          </a-table>
        </div>
        <div v-else style="color:#888;padding:12px 0 0 8px;">No Consumer Trace Data</div>
      </div>

      <div style="text-align:right;margin-top:24px;">
        <a-button @click="showDetailDialog = false">关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.trace-page {
  padding: 20px;
}

.search-panel {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  min-width: 250px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-control {
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  grid-column: 1 / -1;
}

.stats-panel {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.stats-panel h5 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-item label {
  font-weight: 500;
  color: #666;
}

.stat-item span {
  font-size: 1.1em;
}

.trace-list {
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.table {
  margin-bottom: 0;
}

.table th {
  background-color: #f8f9fa;
  white-space: nowrap;
}

.table td {
  white-space: nowrap;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px;
}

:deep(.ant-tabs) {
  width: 100%;
}
:deep(.ant-tabs-nav) {
  flex-direction: row !important;
}
</style> 