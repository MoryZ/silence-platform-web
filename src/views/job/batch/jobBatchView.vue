<template>
  <div class="job-batch-page">
    <!-- 搜索区 -->
    <a-card :bordered="false" class="search-card">
      <SearchPanel
        v-model="searchForm"
        :fields="fields"
        @search="handleSearch"
        @reset="handleReset"
      />
    </a-card>

    <!-- 工具栏 -->
    <div class="table-toolbar">
      <a-button danger :disabled="!selectedRowKeys.length" @click="handleBatchDelete">批量删除</a-button>
      <a-button style="margin-left:8px" @click="handleRefresh">刷新</a-button>
      <a-dropdown style="margin-left:8px">
        <a-button>列设置</a-button>
        <!-- 可插入列设置内容 -->
      </a-dropdown>
    </div>

    <!-- 表格 -->
    <CommonPagination
      title="任务批次列表"
      :columns="columns"
      :data-source="data"
      :loading="loading"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :page-no="pagination.current"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      @update:pageNo="val => { pagination.current = val; fetchData(); }"
      @update:pageSize="val => { pagination.pageSize = val; pagination.current = 1; fetchData(); }"
      @change="handlePageChange"
      @cell-click="handleCellClick"
    >
      <template #tableToolbar>
        <div class="table-toolbar">
          <a-button danger :disabled="!selectedRowKeys.length" @click="handleBatchDelete">批量删除</a-button>
          <a-button style="margin-left:8px" @click="handleRefresh">刷新</a-button>
          <a-dropdown style="margin-left:8px">
            <a-button>列设置</a-button>
          </a-dropdown>
        </div>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'jobType'">
          <a-tag color="blue">集群</a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <span :style="{ color: record.status === 5 ? '#ff4d4f' : record.status === 3 ? '#52c41a' : '#333' }">
            {{ STATUS_ENUM.find(s => s.value === record.status)?.label || record.status }}
          </span>
        </template>
        <template v-else-if="column.key === 'reason'">
          <span style="color:#52c41a">{{ record.reason }}</span>
        </template>
        <template v-else-if="column.key === 'operation'">
          <a @click="handleLog(record)">日志</a>
          <a style="margin:0 8px;color:#ff4d4f" @click="handleRetry(record)">重试</a>
          <a style="color:#ff4d4f" @click="handleDelete(record)">删除</a>
        </template>
      </template>
    </CommonPagination>

    <!-- 分页 -->
    <div class="pagination-bar">
      <a-pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        show-size-changer
        show-quick-jumper
        @change="onPageChange"
        @showSizeChange="onPageSizeChange"
      />
      <span class="total-tip">共 {{ pagination.total }} 条</span>
    </div>

    <DetailDrawer
      v-model:visible="detailDrawerVisible"
      :record="detailRecord"
      :columns="columns"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import DetailDrawer from '@/components/DetailDrawer.vue';
import { getJobBatchPage, findById, retryJobBatch, batchDeleteJobBatch } from '@/api/job/job-batch';
import { message } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { getAllGroupConfigs } from '@/api/job/group'

// 状态枚举
const STATUS_ENUM = [
  { label: '全部', value: '' },
  { label: '待执行', value: 1 },
  { label: '执行中', value: 2 },
  { label: '成功', value: 3 },
  { label: '失败', value: 4 },
  { label: '取消', value: 5 }
];

interface SearchForm {
  groupName: string;
  jobName: string;
  status: string;
  createdDate: [Dayjs, Dayjs] | null;
  createdDateStart: string;
  createdDateEnd: string;
}

const searchForm = ref<SearchForm>({
  groupName: '',
  jobName: '',
  status: '',
  createdDate: null,
  createdDateStart: '',
  createdDateEnd: ''
});
const loading = ref(false);
const data = ref([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const selectedRowKeys = ref<string[]>([]);
const detailDrawerVisible = ref(false);
const detailRecord = ref<any>(null);

const fields = [
  { 
    key: 'groupName', 
    type: 'select' as const, 
    label: '组名称', 
    placeholder: '请选择组名称', 
    options: async () => await getAllGroupConfigs()
  },
  { key: 'jobName', type: 'input' as const, label: '任务名称', placeholder: '请输入任务名称' },
  { key: 'status', type: 'select' as const, label: '状态', placeholder: '请选择执行状态', options: STATUS_ENUM },
  { 
    key: 'createdDate', 
    type: 'date-picker' as const, 
    label: '创建时间', 
    placeholder: '请选择时间范围',
    dateConfig: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      defaultRange: [24, 0] as [number, number] // 默认显示最近24小时
    }
  }
];

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80, clickable: true },
  { title: '组名称', dataIndex: 'groupName' },
  { title: '任务类型', dataIndex: 'jobType' },
  { title: '任务名称', dataIndex: 'jobName' },
  { title: '开始执行时间', dataIndex: 'executionAt' },
  { title: '执行时长(秒)', dataIndex: 'duration' },
  { title: '状态', dataIndex: 'taskBatchStatus', enum: STATUS_ENUM },
  { title: '操作原因', dataIndex: 'reason' },
  { title: '创建时间', dataIndex: 'createdDate' },
  { title: '操作', dataIndex: 'operation', width: 120, align: 'center' }
];

function buildSearchParams() {
  const form = searchForm.value;
  const params: any = {
    pageNo: pagination.current,
    pageSize: pagination.pageSize,
    groupName: form.groupName,
    jobName: form.jobName
  };
  
  // 时间范围处理
  if (form.createdDate) {
    params.createdDateStart = form.createdDate[0].format('YYYY-MM-DD HH:mm:ss');
    params.createdDateEnd = form.createdDate[1].format('YYYY-MM-DD HH:mm:ss');
  }
  return params;
}

async function fetchData(params: any) {
  loading.value = true;
  try {
    const res = await getJobBatchPage(params);
    data.value = res.data || [];
    pagination.total = res.total || 0;
  } catch (e) {
    data.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  const params = buildSearchParams();
  params.pageNo = 1;
  fetchData(params);
}

function handleReset() {
  searchForm.value = { groupName: '', jobName: '', status: '', createdDate: null, createdDateStart: '', createdDateEnd: '' };
  handleSearch();
}

function handleRefresh() {
  fetchData(buildSearchParams());
  message.success('已刷新');
}

function handlePageChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchData(buildSearchParams());
}

function onSelectChange(keys: string[]) {
  selectedRowKeys.value = keys;
}

async function handleLog(record: any) {
  // 可扩展：打开日志弹窗
}

async function handleRetry(record: any) {
  await retryJobBatch(record.id);
  message.success('重试成功');
  fetchData(buildSearchParams());
}

async function handleDelete(record: any) {
  await batchDeleteJobBatch([record.id]);
  message.success('删除成功');
  fetchData(buildSearchParams());
}

async function handleBatchDelete() {
  if (!selectedRowKeys.value.length) return;
  await batchDeleteJobBatch(selectedRowKeys.value);
  message.success('批量删除成功');
  fetchData(buildSearchParams());
}

async function handleCellClick(record: any, column: any) {
  if (column.dataIndex === 'id') {
    const detail = await findById(record.id);
    detailRecord.value = detail;
    detailDrawerVisible.value = true;
  }
}


onMounted(() => {
  fetchData(buildSearchParams());
});
</script>

<style scoped>
.job-batch-page { padding: 16px; background: #fff; }
.search-card { margin-bottom: 12px; }
.table-toolbar { display: flex; align-items: center; justify-content: flex-end; margin-bottom: 0; }
.pagination-bar { display: flex; align-items: center; justify-content: flex-end; margin-top: 12px; }
.total-tip { margin-left: 16px; color: #888; }
</style>
