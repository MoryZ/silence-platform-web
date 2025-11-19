<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { operationReasonRecord, taskBatchStatusRecord } from '@/constants/business';
import { monthRangeISO8601 } from '@/utils/common';
import dayjs from 'dayjs';
import {
  fetchBatchDeleteWorkflowBatch,
  fetchDeleteWorkflowBatch,
  fetchGetWorkflowBatchList,
  fetchStopWorkflowBatch,
  fetchGetWorkflowNameList
} from '@/api/job/workflow';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';

const router = useRouter();
const historyState = history.state || {};

// 数据状态
const data = ref<any[]>([]);
const loading = ref(false);
const checkedRowKeys = ref<string[]>([]);

const createDefaultSearchParams = () => {
  const range = monthRangeISO8601();
  return {
    groupName: null,
    workflowId: historyState.workflowId ? String(historyState.workflowId) : null,
    taskBatchStatus: historyState.taskBatchStatus ? String(historyState.taskBatchStatus) : null,
    datetimeRange: range.map(item => dayjs(item)),
    createdDateStart: range[0],
    createdDateEnd: range[1]
  };
};

const searchParams = ref<Record<string, any>>(createDefaultSearchParams());

const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
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

const searchFields = computed(() => [
  {
    key: 'groupName',
    label: $t('page.workflowBatch.groupName'),
    type: 'input' as const,
    placeholder: $t('page.workflowBatch.form.groupName')
  },
  {
    key: 'workflowId',
    label: $t('page.workflowBatch.workflowName'),
    type: 'select' as const,
    placeholder: $t('page.workflowBatch.form.workflowName'),
    options: async () => {
      try {
        const response = await fetchGetWorkflowNameList({ keywords: '' });
        const list = response.data || response || [];
        return list.map((item: any) => ({
          label: `${item.workflowName}(${item.id})`,
          value: String(item.id)
        }));
      } catch (error) {
        console.error('加载工作流选项失败:', error);
        return [];
      }
    }
  },
  {
    key: 'taskBatchStatus',
    label: $t('page.workflowBatch.taskBatchStatus'),
    type: 'select' as const,
    placeholder: $t('page.workflowBatch.form.taskBatchStatus'),
    options: [
      { label: $t('common.running'), value: '1' },
      { label: $t('common.success'), value: '2' },
      { label: $t('common.fail'), value: '3' },
      { label: $t('common.stop'), value: '4' }
    ]
  },
  {
    key: 'datetimeRange',
    label: $t('page.common.createTime'),
    type: 'date-picker' as const,
    dateConfig: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss'
    },
    style: 'width: 320px'
  }
]);

const tableProps = computed(() => ({
  rowSelection: {
    selectedRowKeys: checkedRowKeys.value,
    onChange: (keys: string[]) => {
      checkedRowKeys.value = keys;
    }
  },
  scroll: { x: 'max-content' }
}));

watch(
  () => searchParams.value.datetimeRange,
  value => {
    if (Array.isArray(value) && value.length === 2) {
      const [start, end] = value;
      searchParams.value.createdDateStart = start ? dayjs(start).format('YYYY-MM-DD HH:mm:ss') : null;
      searchParams.value.createdDateEnd = end ? dayjs(end).format('YYYY-MM-DD HH:mm:ss') : null;
    } else {
      searchParams.value.createdDateStart = null;
      searchParams.value.createdDateEnd = null;
    }
  },
  { deep: true, immediate: true }
);

// 获取数据
async function getData() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      groupName: searchParams.value.groupName
    };

    if (searchParams.value.workflowId) {
      params.workflowId = Number(searchParams.value.workflowId);
    }
    if (searchParams.value.taskBatchStatus) {
      params.taskBatchStatus = Number(searchParams.value.taskBatchStatus);
    }

    if (searchParams.value.createdDateStart) {
      params.createdDateStart = searchParams.value.createdDateStart;
    }
    if (searchParams.value.createdDateEnd) {
      params.createdDateEnd = searchParams.value.createdDateEnd;
    }

    const response = await fetchGetWorkflowBatchList(params);
    if (response && response.data) {
      data.value = response.data.items || response.data || [];
      pagination.total = response.data.total || response.data.totalCount || 0;
    }
    checkedRowKeys.value = [];
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
}

// 重置搜索参数
function resetSearchParams() {
  searchParams.value = createDefaultSearchParams();
  pagination.pageNo = 1;
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
  checkedRowKeys.value = [];
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

function handleSearch() {
  pagination.pageNo = 1;
  getData();
}

function handleReset() {
  resetSearchParams();
}

function handlePageChange(pageNo: number, pageSize: number) {
  pagination.pageNo = pageNo;
  pagination.pageSize = pageSize;
  getData();
}
</script>

<template>
  <div class="flex-col h-full">
    <SearchPanel v-model="searchParams" :fields="searchFields" @search="handleSearch" @reset="handleReset" />
    
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
    
    <CommonPagination
      :columns="columns"
      :data-source="data"
      :loading="loading"
      row-key="id"
      :page-no="pagination.pageNo"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      :table-props="tableProps"
      @change="handlePageChange"
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
    </CommonPagination>
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
