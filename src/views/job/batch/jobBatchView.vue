<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { getJobBatchPage, findById, retryJobBatch, batchDeleteJobBatch, JobBatch, JobBatchSearchParams } from '@/api/job/job-batch';
import { getAllGroupConfigs } from '@/api/job/group';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import { Checkbox as ACheckbox } from 'ant-design-vue';
import { taskBatchStatusRecordOptions, operationReasonOptions } from '@/constants/business';
import DetailDrawer from '@/components/DetailDrawer.vue';
import { DownOutlined } from '@ant-design/icons-vue';

const drawerVisible = ref(false);
const editingData = ref<JobBatch | null>(null);
const isEdit = ref(false);
const loading = ref(false);
const data = ref<JobBatch[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const searchForm = ref({ 
  groupName: '', 
  jobName: '', 
  taskBatchStatuses: [] as string[], 
  createdDateStart: '', 
  createdDateEnd: '' 
});

const fields = [
  { 
    key: 'groupName', 
    type: 'select', 
    label: '组名称', 
    placeholder: '请选择组名称', 
    options: async () => await getAllGroupConfigs() 
  },
  { 
    key: 'jobName', 
    type: 'input', 
    label: '任务名称', 
    placeholder: '请输入任务名称' 
  },
  { 
    key: 'taskBatchStatuses', 
    type: 'select', 
    label: '任务状态', 
    placeholder: '请选择任务状态', 
    options: taskBatchStatusRecordOptions,
    mode: 'multiple'
  },
  { 
    key: 'createdDateRange', 
    type: 'date-picker', 
    label: '创建时间', 
    placeholder: '请选择时间范围',
    dateConfig: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      defaultRange: [24, 0] // 默认查询最近24小时
    }
  }
];

function buildColumns(rawCols: Array<Record<string, any>>): Array<Record<string, any>> {
  return rawCols.map((col: Record<string, any>) => ({
    ...col,
    key: col.key || col.dataIndex,
    dataIndex: col.dataIndex || col.key,
    visible: col.visible !== false // 默认 true
  }));
}

const allColumns = ref<Array<Record<string, any>>>(buildColumns([
  { title: '序号', dataIndex: 'index', width: 60, fixed: 'left' },
  { title: '任务名称', dataIndex: 'jobName', fixed: 'left', width: 180, clickable: true },
  { title: '组名称', dataIndex: 'groupName' },
  { title: '执行器名称', dataIndex: 'executorInfo' },
  { title: '任务类型', dataIndex: 'taskType', type: 'enum', enumMap: { 1: '简单任务', 2: '工作流任务' } },
  { title: '状态', dataIndex: 'taskBatchStatus', type: 'enum', enumMap: taskBatchStatusRecordOptions },
  { title: '操作原因', dataIndex: 'operationReason', type: 'enum', enumMap: operationReasonOptions },
  { title: '执行器类型', dataIndex: 'executorType', type: 'enum', enumMap: { 1: 'HTTP', 2: 'GRPC', 3: 'Dubbo' } },
  { title: '创建时间', dataIndex: 'createdDate', type: 'date' },
  { title: '更新时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '操作', key: 'operation', width: 120, align: 'center' }
]));

const checkedKeys = ref<string[]>(allColumns.value.filter((c: Record<string, any>) => c.visible).map((c: Record<string, any>) => c.key));

const tableColumns = computed(() =>
  allColumns.value.filter((col: Record<string, any>) => checkedKeys.value.includes(col.key))
);

const detailDrawerVisible = ref(false);
const detailRecord = ref<Record<string, any> | null>(null);

function handleCellClick(record: Record<string, any>, column: Record<string, any>) {
  if (column.dataIndex === 'jobName') {
    detailRecord.value = record;
    detailDrawerVisible.value = true;
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: JobBatchSearchParams = {
      groupName: searchForm.value.groupName,
      jobName: searchForm.value.jobName,
      taskBatchStatuses: searchForm.value.taskBatchStatuses,
      createdDateStart: searchForm.value.createdDateStart,
      createdDateEnd: searchForm.value.createdDateEnd,
      pageNo: pagination.current,
      pageSize: pagination.pageSize
    };
    
    const res = await getJobBatchPage(params);
    if (Array.isArray(res)) {
      data.value = res;
      pagination.total = res.length;
    } else {
      data.value = res.data || [];
      pagination.total = res.total || data.value.length;
    }
  } catch (e) {
    data.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleReset() {
  searchForm.value = { 
    groupName: '', 
    jobName: '', 
    taskBatchStatuses: [], 
    createdDateStart: '', 
    createdDateEnd: '' 
  };
  handleSearch();
}

function handleRefresh() {
  fetchData();
  message.success('已刷新');
}

function handlePageChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchData();
}

async function handleRetry(record: JobBatch) {
  try {
    await retryJobBatch(String(record.id));
    message.success('重试成功');
    fetchData();
  } catch (e) {
    message.error('重试失败');
  }
}

async function handleDelete(ids: string[]) {
  try {
    await batchDeleteJobBatch(ids);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败');
  }
}

function onCheckColumn(key: string, checked: boolean) {
  if (checked) {
    if (!checkedKeys.value.includes(key)) checkedKeys.value.push(key);
  } else {
    checkedKeys.value = checkedKeys.value.filter((k: string) => k !== key);
  }
}

function getStatusColor(status: number) {
  const colorMap: Record<number, string> = {
    1: 'blue',    // waiting
    2: 'processing', // running
    3: 'success', // success
    4: 'error',   // fail
    5: 'default', // stop
    6: 'default', // cancel
    98: 'warning', // decisionFailed
    99: 'default'  // skip
  };
  return colorMap[status] || 'default';
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="job-batch-view">
    <div class="page-header">
      <h2>任务批次管理</h2>
      <div class="header-actions">
        <a-button @click="handleRefresh" :loading="loading">
          <template #icon><DownOutlined /></template>
          刷新
        </a-button>
      </div>
    </div>

    <SearchPanel
      :fields="fields"
      :form="searchForm"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="table-container">
      <div class="table-header">
        <div class="column-selector">
          <span>显示列：</span>
          <a-checkbox-group v-model:value="checkedKeys">
            <a-checkbox
              v-for="col in allColumns"
              :key="col.key"
              :value="col.key"
              @change="(e) => onCheckColumn(col.key, e.target.checked)"
            >
              {{ col.title }}
            </a-checkbox>
          </a-checkbox-group>
        </div>
      </div>

      <a-table
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        :pagination="false"
        :row-key="(record) => record.id"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.dataIndex === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          
          <template v-else-if="column.dataIndex === 'jobName'">
            <a @click="handleCellClick(record, column)">{{ record.jobName }}</a>
          </template>
          
          <template v-else-if="column.dataIndex === 'taskBatchStatus'">
            <a-tag :color="getStatusColor(record.taskBatchStatus)">
              {{ taskBatchStatusRecordOptions.find(opt => opt.value === record.taskBatchStatus)?.label || record.taskBatchStatus }}
            </a-tag>
          </template>
          
          <template v-else-if="column.dataIndex === 'createdDate'">
            {{ record.createdDate ? new Date(record.createdDate).toLocaleString() : '-' }}
          </template>
          
          <template v-else-if="column.dataIndex === 'updatedDate'">
            {{ record.updatedDate ? new Date(record.updatedDate).toLocaleString() : '-' }}
          </template>
          
          <template v-else-if="column.key === 'operation'">
            <a-space>
              <a-button
                v-if="record.taskBatchStatus === 4"
                type="link"
                size="small"
                @click="handleRetry(record)"
              >
                重试
              </a-button>
              <a-button
                type="link"
                size="small"
                danger
                @click="handleDelete([String(record.id)])"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <CommonPagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @change="handlePageChange"
      />
    </div>

    <DetailDrawer
      v-model:visible="detailDrawerVisible"
      :record="detailRecord"
      title="任务批次详情"
    />
  </div>
</template>

<style scoped>
.job-batch-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.column-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column-selector span {
  font-weight: 500;
  color: #374151;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 500;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

:deep(.ant-tag) {
  margin: 0;
}
</style>