<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { queryClusterList, queryBrokerConfig } from '@/api/mq/cluster';
import type { ClusterData, BrokerDetail, BrokerConfig } from '@/types/mq/clusterApi';

const selectedCluster = ref('DefaultCluster')
const clusterData = ref<any>(null)
const loading = ref(false)
const statusDialogVisible = ref(false)
const configDialogVisible = ref(false)
const currentBrokerDetail = ref<any>(null)
const currentBrokerConfig = ref<any>(null)

// 处理嵌套的数据结构，转换为表格可用的扁平结构
const tableData = computed(() => {
  if (!clusterData.value) {
    return [];
  }
  
  const result: any = [];
  try {
    const data = clusterData.value;
    
    // 检查并处理brokerServer的不同可能的数据结构
    if (data.brokerServer) {
      // 如果是对象结构（包含broker名称作为key）
      if (typeof data.brokerServer === 'object' && !Array.isArray(data.brokerServer)) {
        Object.entries(data.brokerServer).forEach(([brokerName, brokerInfo]: [string, any]) => {
          // 可能的嵌套结构：brokerServer -> brokerName -> index -> nodeInfo
          if (typeof brokerInfo === 'object' && !Array.isArray(brokerInfo)) {
            Object.entries(brokerInfo).forEach(([index, nodeInfo]: [string, any]) => {
              // 创建表格行数据
              try {
                const brokerAddr = data.clusterInfo?.brokerAddrTable?.[brokerName]?.brokerAddrs?.[index] || '';
                
                result.push({
                  brokerName: brokerName,
                  index: parseInt(index),
                  brokerAddr: brokerAddr,
                  version: nodeInfo.brokerVersionDesc || '',
                  inTPS: parseFloat((nodeInfo.putTps || '0 0 0').split(' ')[0]),
                  outTPS: parseFloat((nodeInfo.getTotalTps || '0 0 0').split(' ')[0]),
                  inTotalYest: parseInt(nodeInfo.msgPutTotalYesterdayMorning || '0'),
                  outTotalYest: parseInt(nodeInfo.msgGetTotalYesterdayMorning || '0'),
                  inTotalToday: parseInt(nodeInfo.msgPutTotalTodayNow || '0'),
                  outTotalToday: parseInt(nodeInfo.msgGetTotalTodayNow || '0'),
                  rawData: nodeInfo
                });
              } catch (err) {
                console.error('解析节点数据出错:', err);
              }
            });
          }
        });
      }
      // 如果是数组结构
      else if (Array.isArray(data.brokerServer)) {
        data.brokerServer.forEach(broker => {
          try {
            result.push({
              ...broker,
              brokerName: broker.brokerName || '',
              index: broker.index || 0,
              brokerAddr: broker.brokerAddr || '',
              version: broker.version || '',
              inTPS: parseFloat(broker.inTPS || '0'),
              outTPS: parseFloat(broker.outTPS || '0'),
              inTotalYest: parseInt(broker.inTotalYest || '0'),
              outTotalYest: parseInt(broker.outTotalYest || '0'),
              inTotalToday: parseInt(broker.inTotalToday || '0'),
              outTotalToday: parseInt(broker.outTotalToday || '0'),
              rawData: broker
            });
          } catch (err) {
            console.error('解析broker数据出错:', err);
          }
        });
      }
    }
  } catch (err) {
    console.error('处理表格数据出错:', err);
  }
  
  console.log('处理后的表格数据:', result);
  return result;
});

// 获取可用的集群列表
const availableClusters = computed(() => {
  if (!clusterData.value || !clusterData.value.clusterInfo || !clusterData.value.clusterInfo.clusterAddrTable) {
    return ['DefaultCluster'];
  }
  return Object.keys(clusterData.value.clusterInfo.clusterAddrTable);
});

// 定义表格列
const tableColumns = [
  { title: '分片', dataIndex: 'brokerName', key: 'brokerName' },
  { title: '编号', dataIndex: 'index', key: 'index' },
  { title: '地址', dataIndex: 'brokerAddr', key: 'brokerAddr' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '生产消息TPS', dataIndex: 'inTPS', key: 'inTPS', customRender: ({ text }) => text ? text.toFixed(2) : '0.00' },
  { title: '消费消息TPS', dataIndex: 'outTPS', key: 'outTPS', customRender: ({ text }) => text ? text.toFixed(2) : '0.00' },
  { title: '昨日生产总数', dataIndex: 'inTotalYest', key: 'inTotalYest' },
  { title: '昨日消费总数', dataIndex: 'outTotalYest', key: 'outTotalYest' },
  { title: '今日生产总数', dataIndex: 'inTotalToday', key: 'inTotalToday' },
  { title: '今日消费总数', dataIndex: 'outTotalToday', key: 'outTotalToday' },
  { title: '操作', key: 'action', width: 200 }
]

const loadClusterData = async () => {
  loading.value = true
  try {
    const response = await queryClusterList()
    console.log('原始API响应:', response);
    
    // 无论响应格式如何，都确保它可以被安全处理
    clusterData.value = response || { brokerServer: {} };
  } catch (error: any) {
    console.error('加载集群数据出错:', error);
    clusterData.value = { brokerServer: {} };
  } finally {
    loading.value = false
  }
}

const showBrokerStatus = (record: any) => {
  currentBrokerDetail.value = record
  statusDialogVisible.value = true
}

// 将配置转换为数组，便于 Ant Design 的表格遍历
const configItems = ref<{ key: string; value: string }[]>([])

// 简化 broker 配置处理
const showBrokerConfig = async (brokerAddr: string) => {
  try {
    // 获取broker配置
    const response = await queryBrokerConfig(brokerAddr)
    console.log('Broker config API response:', response);
    
    // 直接处理对象
    if (response && typeof response === 'object') {
      // 直接将对象属性转换为表格数据
      configItems.value = Object.entries(response).map(([key, value]) => ({
        key,
        value: value === null ? 'null' : String(value)
      }));
      
      // 按键名排序
      configItems.value.sort((a, b) => a.key.localeCompare(b.key));
      
      // 显示对话框
      configDialogVisible.value = true;
    } else {
      console.error('无效的配置数据格式:', response);
    }
  } catch (error: any) {
    console.error('加载Broker配置出错:', error);
  }
}

onMounted(() => {
  loadClusterData()
})

// 不需要额外处理
const handleConfigDialogOpen = () => {
  // 配置已在showBrokerConfig中处理完成
}
</script>

<template>
  <div class="cluster-page">
    <div class="cluster-selector">
      <span class="selector-label">集群：</span>
      <a-select v-model:value="selectedCluster" style="width: 300px">
        <a-select-option 
          v-for="cluster in availableClusters" 
          :key="cluster"
          :value="cluster"
        >
          {{ cluster }}
        </a-select-option>
      </a-select>
    </div>

    <a-table 
      :dataSource="tableData" 
      :columns="tableColumns"
      :rowKey="(record, index) => record.brokerAddr || index"
      :pagination="false"
      :loading="loading"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'index'">
          {{ record.index === 0 ? '0(master)' : `${record.index}(slave)` }}
        </template>
        <template v-if="column.key === 'action'">
          <div class="action-buttons">
            <a-button type="primary" size="small" @click="showBrokerStatus(record)">
              状态
            </a-button>
            <a-button type="primary" size="small" @click="showBrokerConfig(record.brokerAddr)">
              配置
            </a-button>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 状态对话框 -->
    <a-modal
      v-model:open="statusDialogVisible"
      title="Broker状态"
      width="800px"
      @ok="statusDialogVisible = false"
      @cancel="statusDialogVisible = false"
    >
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="Broker名称">{{ currentBrokerDetail?.brokerName }}</a-descriptions-item>
        <a-descriptions-item label="Broker ID">{{ currentBrokerDetail?.index }}</a-descriptions-item>
        <a-descriptions-item label="地址">{{ currentBrokerDetail?.brokerAddr }}</a-descriptions-item>
        <a-descriptions-item label="版本">{{ currentBrokerDetail?.version }}</a-descriptions-item>
        <a-descriptions-item label="运行时间">{{ currentBrokerDetail?.rawData?.runtime }}</a-descriptions-item>
        <a-descriptions-item label="启动时间">{{ currentBrokerDetail?.rawData?.bootTimestamp ? new Date(parseInt(currentBrokerDetail.rawData.bootTimestamp)).toLocaleString() : '' }}</a-descriptions-item>
        <a-descriptions-item label="生产消息TPS">{{ currentBrokerDetail?.inTPS?.toFixed(2) || '0.00' }}</a-descriptions-item>
        <a-descriptions-item label="消费消息TPS">{{ currentBrokerDetail?.outTPS?.toFixed(2) || '0.00' }}</a-descriptions-item>
        <a-descriptions-item label="昨日生产总数">{{ currentBrokerDetail?.inTotalYest || 0 }}</a-descriptions-item>
        <a-descriptions-item label="昨日消费总数">{{ currentBrokerDetail?.outTotalYest || 0 }}</a-descriptions-item>
        <a-descriptions-item label="今日生产总数">{{ currentBrokerDetail?.inTotalToday || 0 }}</a-descriptions-item>
        <a-descriptions-item label="今日消费总数">{{ currentBrokerDetail?.outTotalToday || 0 }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 配置对话框 -->
    <a-modal
      v-model:open="configDialogVisible"
      :title="currentBrokerDetail?.brokerName + '[' + currentBrokerDetail?.index + ']'"
      width="800px"
      @cancel="configDialogVisible = false"
      :footer="null"
      :maskClosable="false"
      class="config-dialog"
    >
      <div v-if="configItems.length > 0">
        <a-table
          :dataSource="configItems"
          :columns="[
            { title: '', dataIndex: 'key', key: 'key', width: '40%' },
            { title: '', dataIndex: 'value', key: 'value' }
          ]"
          :pagination="false"
          size="small"
          :rowKey="record => record.key"
          bordered
          :scroll="{ y: 500 }"
        />
      </div>
      <div v-else class="empty-data">
        <a-empty description="没有配置数据" />
      </div>
      <div class="dialog-footer">
        <a-button type="primary" @click="configDialogVisible = false">关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.cluster-page {
  padding: 20px;
}

.cluster-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.selector-label {
  margin-right: 10px;
  font-size: 14px;
}

:deep(.ant-table-wrapper) {
  margin-top: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

:deep(.ant-descriptions) {
  padding: 10px;
}

:deep(.ant-descriptions-item-label) {
  width: 150px;
}

.config-dialog :deep(.ant-table-thead) {
  display: none;
}

.config-dialog :deep(.ant-table) {
  max-height: 600px;
}

.config-dialog :deep(.ant-table-body) {
  max-height: 500px !important;
  overflow-y: auto !important;
}

.dialog-footer {
  text-align: center;
  margin-top: 20px;
}

.empty-data {
  padding: 40px 0;
}
</style> 