<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { operationReasonRecord, taskBatchStatusRecord } from '@/constants/business';
import { monthRangeISO8601 } from '@/utils/common';
import {
  fetchBatchDeleteWorkflowBatch,
  fetchDeleteWorkflowBatch,
  fetchGetWorkflowBatchList,
  fetchStopWorkflowBatch
} from '@/api/job/workflow';
import WorkflowBatchSearch from './modules/workflow-batch-search.vue';

const router = useRouter();

// 数据状态
const data = ref<any[]>([]);
const loading = ref(false);
const checkedRowKeys = ref<string[]>([]);
const searchParams = ref({
  page: 1,
  size: 10,
  workflowId: history.state.workflowId || null,
  workflowName: history.state.workflowName || null,
  groupName: null,
  taskBatchStatus: history.state.taskBatchStatus || null,
  datetimeRange: monthRangeISO8601()
});

// 分页配置
const mobilePagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 列配置
const columns = ref([
  {
    type: 'selection',
    align: 'center',
    width: 48
  },
  {
    key: 'id',
    title: $t('common.index'),
    width: 120,
    align: 'center'
  },
  {
    key: 'workflowName',
    title: $t('page.workflowBatch.workflowName'),
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'groupName',
    title: $t('page.workflowBatch.groupName'),
    width: 120
  },
  {
    key: 'executionAt',
    title: $t('page.workflowBatch.executionAt'),
    width: 120
  },
  {
    key: 'taskBatchStatus',
    title: $t('page.workflowBatch.taskBatchStatus'),
    width: 120
  },
  {
    key: 'operationReason',
    title: $t('page.workflowBatch.operationReason'),
    width: 120
  },
  {
    key: 'createDt',
    title: $t('page.workflowBatch.createDt'),
    width: 120
  },
  {
    key: 'operation',
    title: $t('common.operation'),
    width: 130,
    align: 'center'
  }
]);

// 获取数据
async function getData() {
  loading.value = true;
  try {
    const response = await fetchGetWorkflowBatchList(searchParams.value);
    if (response && response.data) {
      data.value = response.data.items || response.data || [];
      mobilePagination.value.total = response.data.total || 0;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
}

// 重置搜索参数
function resetSearchParams() {
  searchParams.value = {
    page: 1,
    size: 10,
    workflowId: history.state.workflowId || null,
    workflowName: history.state.workflowName || null,
    groupName: null,
    taskBatchStatus: history.state.taskBatchStatus || null,
    datetimeRange: monthRangeISO8601()
  };
  getData();
}

async function handleDelete(id: string) {
  const { error } = await fetchDeleteWorkflowBatch(id);
  if (error) return;
  message.success('删除成功');
  getData();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWorkflowBatch(checkedRowKeys.value);
  if (error) return;
  message.success('批量删除成功');
  getData();
}

async function handleStop(id: string) {
  const { error } = await fetchStopWorkflowBatch(id);
  if (!error) {
    message.success($t('common.executeSuccess'));
    getData();
  }
}

function detail(id: string) {
  router.push({ path: '/workflow/form/batch', query: { id } });
}

function getStatusColor(status: number): string {
  const tagMap: Record<number, string> = {
    1: 'blue',
    2: 'green',
    3: 'green',
    4: 'red',
    5: 'orange',
    6: 'orange'
  };
  return tagMap[status] || 'default';
}
</script>

<template>
  <div class="flex-col h-full">
    <WorkflowBatchSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getData" />
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <a-button 
          type="primary" 
          danger 
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('common.batchDelete') }}
        </a-button>
        <a-button @click="getData">{{ $t('common.refresh') }}</a-button>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <a-table
      v-model:selected-row-keys="checkedRowKeys"
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="mobilePagination"
      row-key="id"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'id'">
          <a-button type="link" @click="detail(record.id)">
            {{ record.id }}
          </a-button>
        </template>
        
        <template v-else-if="column.key === 'taskBatchStatus'">
          <a-tag v-if="record.taskBatchStatus" :color="getStatusColor(record.taskBatchStatus)">
            {{ $t(taskBatchStatusRecord[record.taskBatchStatus]) }}
          </a-tag>
        </template>
        
        <template v-else-if="column.key === 'operationReason'">
          <a-tag v-if="record.operationReason" color="orange">
            {{ $t(operationReasonRecord[record.operationReason]) }}
          </a-tag>
        </template>
        
        <template v-else-if="column.key === 'operation'">
          <div class="flex-center gap-8px">
            <template v-if="record.taskBatchStatus === 1 || record.taskBatchStatus === 2">
              <a-popconfirm
                :title="$t('common.confirmStop')"
                @confirm="handleStop(record.id)"
              >
                <a-button type="link" danger>
                  {{ $t('common.stop') }}
                </a-button>
              </a-popconfirm>
              <a-divider type="vertical" />
            </template>
            <a-popconfirm
              :title="$t('common.deleteConfirm')"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" danger>
                {{ $t('common.delete') }}
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 16px;
}

.action-left {
  display: flex;
  gap: 8px;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gap-8px {
  gap: 8px;
}
</style>
