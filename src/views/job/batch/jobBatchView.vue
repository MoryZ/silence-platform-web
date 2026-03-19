<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { getJobBatchPage, findById, retryJobBatch, batchDeleteJobBatch } from '@/api/job/job-batch';
import type { JobBatch, JobBatchSearchParams } from '@/types/job';
import { getAllGroupConfigs } from '@/api/job/group';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import { Checkbox as ACheckbox } from 'ant-design-vue';
import ColumnSettings from '@/components/ColumnSettings.vue';
import { getJobTaskPage } from '@/api/job/job-task';
import { taskBatchStatusRecord, taskBatchStatusRecordOptions, operationReasonRecord, operationReasonOptions, taskBatchStatusEnum, jobOperationReasonEnum } from '@/constants/business';
// 直接使用中文文案，避免未配置的国际化key展示在界面
import { h, resolveComponent } from 'vue';
import { $t } from '@/locales';
import DetailDrawer from '@/components/DetailDrawer.vue';
import { DownOutlined } from '@ant-design/icons-vue';

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
    type: 'select' as const, 
    label: '组名称', 
    placeholder: '请选择组名称', 
    options: async () => await getAllGroupConfigs() 
  },
  { 
    key: 'jobName', 
    type: 'input' as const, 
    label: '任务名称', 
    placeholder: '请输入任务名称' 
  },
  { 
    key: 'taskBatchStatuses', 
    type: 'select' as const, 
    label: '任务状态', 
    placeholder: '请选择任务状态', 
    options: taskBatchStatusRecordOptions.map(o => ({ label: o.label, value: String(o.value) })),
    mode: 'multiple'
  },
  { 
    key: 'createdDateRange', 
    type: 'date-picker' as const, 
    label: '创建时间', 
    placeholder: '请选择时间范围',
    dateConfig: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      defaultRange: [24, 0] as [number, number] // 默认查询最近24小时
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
  { title: (() => {
        const Tooltip: any = resolveComponent('a-tooltip');
        return h('span', { style: 'display:inline-flex;align-items:center;gap:6px;' }, [
          'ID',
          h(Tooltip, { title: '点击ID查看详情', getPopupContainer: () => document.body }, {
            default: () => h('span', { class: 'id-tip-icon' }, [
              h('svg', { width: '12', height: '12', viewBox: '0 0 1024 1024', fill: 'currentColor' }, [
                h('path', { d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 128a64 64 0 110 128 64 64 0 010-128zm96 576H416v-64h64V448h-64v-64h128v320h64v64z' })
              ])
            ])
          })
        ]);
      })(),
    dataIndex: 'id', width: 100, fixed: 'left',
    customRender: ({ record, index }: { record: any; index: number }) => {
      const idText = (record && (record.id ?? record.batchId ?? record.jobBatchId)) ?? (index + 1);
      return h('a', { style: 'color:#1677ff;cursor:pointer;', onClick: () => handleIdDetail(record), title: '点击ID查看详情' }, String(idText));
    }
  },
  { title: '组名称', dataIndex: 'groupName' },
  { title: '任务类型', dataIndex: 'taskType', customRender: ({ record }: { record: any }) => {
      const map: Record<number, { label: string; color: string }> = {
        1: { label: '集群', color: '#52c41a' },
        2: { label: '广播', color: '#1677ff' },
        3: { label: '静态分片', color: '#722ed1' },
        4: { label: 'Map', color: '#13c2c2' },
        5: { label: 'MapReduce', color: '#2f54eb' }
      };
      const info = map[record.taskType];
      if (!info) return record.taskType;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${info.color};color:${info.color}` }, info.label);
    }
  },
  { title: '任务名称', dataIndex: 'jobName' },
  { title: '开始执行时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '执行时长(秒)', dataIndex: 'executionAt', customRender: ({ record }: { record: any }) => {
      const start = record.updatedDate ? new Date(record.updatedDate).getTime() : undefined;
      const end = record.executionAt ? new Date(record.executionAt).getTime() : undefined;
      if (!start || !end || isNaN(start) || isNaN(end) || end < start) return '-';
      return Math.floor((end - start) / 1000);
    }
  },
  { title: '状态', dataIndex: 'taskBatchStatus', customRender: ({ record }: { record: any }) => {
      const v = record.taskBatchStatus;
      const info = (taskBatchStatusEnum as any)[v];
      if (!info) return v;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${info.color};color:${info.color}` }, info.title);
    }
  },
  { title: '操作原因', dataIndex: 'operationReason', customRender: ({ record }: { record: any }) => {
      const v = record.operationReason;
      if (typeof v === 'number') {
        const info = (jobOperationReasonEnum as any)[v];
        if (!info) return v;
        return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${info.color};color:${info.color}` }, $t ? $t(info.name as any) : info.name);
      }
      if (typeof v === 'string') {
        const label = $t ? $t(v as any) : v;
        return h('span', { class: 'ant-tag', style: 'background:#fff;border-color:#d9d9d9;color:#595959' }, label);
      }
      return String(v);
    }
  },
  { title: '执行器类型', dataIndex: 'executorType', customRender: ({ record }: { record: any }) => {
      const map: Record<number, { label: string; color: string }> = {
        1: { label: 'HTTP', color: '#1677ff' },
        2: { label: 'GRPC', color: '#52c41a' },
        3: { label: 'Dubbo', color: '#722ed1' }
      };
      const info = map[record.executorType];
      if (!info) return record.executorType;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${info.color};color:${info.color}` }, info.label);
    }
  },
 

  { title: '创建时间', dataIndex: 'createdDate', type: 'date' },
  { title: '更新时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '操作', key: 'operation', width: 160, align: 'center',
    customRender: ({ record }: { record: any }) => {
      return h('div', { style: 'display:flex;gap:8px;justify-content:center;' }, [
        h('a', { onClick: () => handleViewLog(record) }, '日志'),
        h('a', { onClick: () => handleRetry(record) }, '重试'),
        h('a', { style: 'color:#ff4d4f', onClick: () => handleDelete([String(record.id)]) }, '删除')
      ]);
    }
  }
]));

const checkedKeys = ref<string[]>(allColumns.value.filter((c: Record<string, any>) => c.visible).map((c: Record<string, any>) => c.key));

const tableColumns = computed(() =>
  allColumns.value.filter((col: Record<string, any>) => checkedKeys.value.includes(col.key))
);

const detailDrawerVisible = ref(false);
const detailRecord = ref<Record<string, any> | null>(null);
const detailActiveTab = ref('base');
const logModalVisible = ref(false);
const logRecord = ref<Record<string, any> | null>(null);

// 详情抽屉列配置
const detailColumns = [
  { title: '组名称', dataIndex: 'groupName' },
  { title: '任务名称', dataIndex: 'jobName' },
  { title: '状态', dataIndex: 'taskBatchStatus', type: 'enum', enumMap: taskBatchStatusEnum },
  { title: '开始执行时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '执行器类型', dataIndex: 'executorType', type: 'enum', enumMap: { 1: { label: 'Java', color: 'blue' }, 2: { label: 'Python', color: 'green' } } },
  { title: '执行器名称', dataIndex: 'executorName' },
  { title: '创建时间', dataIndex: 'createdDate', type: 'date' }
];

// 日志详情 - 列与数据
const logLoading = ref(false);
const logStatusFilter = ref<number | undefined>(undefined);
const logPagination = reactive({ current: 1, pageSize: 10, total: 0 });
const logData = ref<any[]>([]);

// 日志状态枚举（示例编码：运行中=2、成功=3、失败=4、停止=5、取消=6，按你的后端调整）
const logStatusEnum: Record<number, { label: string; color: string }> = {
  2: { label: '运行中', color: '#1677ff' },
  3: { label: '处理成功', color: '#52c41a' },
  4: { label: '处理失败', color: '#ff4d4f' },
  5: { label: '任务停止', color: '#8c8c8c' },
  6: { label: '取消', color: '#fa8c16' }
};

const logStatusOptions = [
  { label: '运行中', value: 2 },
  { label: '处理成功', value: 3 },
  { label: '处理失败', value: 4 },
  { label: '任务停止', value: 5 },
  { label: '取消', value: 6 }
];

const logColumns = [
  { title: 'ID', dataIndex: 'id', width: 100 },
  { title: '日志', dataIndex: 'log' },
  { title: '组名称', dataIndex: 'groupName', width: 140 },
  { title: '状态', dataIndex: 'status', width: 100, customRender: ({ record }: { record: any }) => {
      const m = (logStatusEnum as any)[record.status];
      if (!m) return record.status;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${m.color};color:${m.color}` }, m.label);
    } },
  { title: '地址', dataIndex: 'address', width: 180 },
  { title: '参数', dataIndex: 'args', width: 160 },
  { title: '结果', dataIndex: 'result', width: 120 },
  { title: '重试次数', dataIndex: 'retryTimes', width: 100 },
  { title: '开始执行时间', dataIndex: 'startTime', width: 180 }
];

async function fetchLogList() {
  if (!detailRecord.value) return;
  logLoading.value = true;
  try {
    const params: any = {
      taskBatchId: String(detailRecord.value.taskBatchId ?? detailRecord.value.id ?? ''),
      groupName: detailRecord.value.groupName,
      pageNo: logPagination.current,
      pageSize: logPagination.pageSize
    };
    if (logStatusFilter.value !== undefined) params.taskStatus = Number(logStatusFilter.value);

    const res: any = await getJobTaskPage(params);
    const records: any[] = Array.isArray(res) ? res : (res?.data || res?.records || res?.list || []);
    logData.value = records.map((r: any) => ({
      id: r.taskBatchId,
      log: r.resultMessage,
      groupName: r.groupName,
      status: r.taskStatus,
      address: r.clientInfo,
      args: r.argsStr,
      result: r.resultMessage,
      retryTimes: r.retryCount,
      startTime: r.updatedDate || r.createdDate
    }));
    logPagination.total = Number(res?.total ?? records.length ?? 0);
  } finally {
    logLoading.value = false;
  }
}

function handleLogSearch() {
  logPagination.current = 1;
  fetchLogList();
}

function handleLogPageChange(page: number, pageSize: number) {
  logPagination.current = page;
  logPagination.pageSize = pageSize;
  fetchLogList();
}

function handleCellClick(record: Record<string, any>, column: Record<string, any>) {
  if (column.dataIndex === 'jobName') {
    detailRecord.value = record;
    detailDrawerVisible.value = true;
  }
}

function handleIdDetail(record: Record<string, any>) {
  detailRecord.value = record;
  detailDrawerVisible.value = true;
  detailActiveTab.value = 'base';
  // 每次打开时刷新日志第一页
  logStatusFilter.value = undefined;
  logPagination.current = 1;
  fetchLogList();
}

function statusStyle(v: number) {
  const info = (taskBatchStatusEnum as any)[v];
  if (!info) return '';
  return `background:#fff;border-color:${info.color};color:${info.color}`;
}

watch(detailActiveTab, (val) => {
  if (val === 'log') fetchLogList();
});

function handleViewLog(record: Record<string, any>) {
  // 打开抽屉并切换到日志详情，与点击ID一致传参
  detailRecord.value = record;
  detailDrawerVisible.value = true;
  detailActiveTab.value = 'log';
  logStatusFilter.value = undefined;
  logPagination.current = 1;
  fetchLogList();
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
      pageSize: pagination.pageSize,
      sort: '-createdDate'
    };
    
    const res = await getJobBatchPage(params);
    if (Array.isArray(res)) {
      data.value = res;
      pagination.total = res.length;
    } else {
      // compatible with { data:[], total } or { records:[], total } or { list:[], total }
      const records = (res.data || res.records || res.list || []) as any[];
      data.value = records;
      pagination.total = Number(res.total ?? records.length ?? 0);
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

const handleSearchFormUpdate = (newForm: any) => {
  searchForm.value = { ...newForm }
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
      :model-value="searchForm"
      :fields="fields"
      @search="handleSearch"
      @reset="handleReset"
      @update:model-value="handleSearchFormUpdate"
    />

    <div class="table-container">
      <div class="table-header" style="display:flex;justify-content:flex-end;">
        <ColumnSettings
          :columns="allColumns as any"
          v-model="checkedKeys"
          @update:columns="val => (allColumns as any).value = val"
        />
      </div>

      <CommonPagination
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @change="handlePageChange"
        @cell-click="handleCellClick"
      />
    </div>

    <a-drawer v-model:open="detailDrawerVisible" title="任务批次详情" width="920" :footer="null">
      <a-tabs v-model:activeKey="detailActiveTab">
        <a-tab-pane key="base" tab="基本信息">
          <a-descriptions v-if="detailRecord" bordered :column="2" size="middle">
            <a-descriptions-item label="组名称">{{ detailRecord.groupName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="任务名称">{{ detailRecord.jobName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <span v-if="detailRecord.taskBatchStatus !== undefined" class="ant-tag" :style="statusStyle(detailRecord.taskBatchStatus)">
                {{ (taskBatchStatusEnum as any)[detailRecord.taskBatchStatus]?.title || detailRecord.taskBatchStatus }}
              </span>
              <span v-else> - </span>
            </a-descriptions-item>
            <a-descriptions-item label="开始执行时间">{{ detailRecord.updatedDate || '-' }}</a-descriptions-item>
            <a-descriptions-item label="执行器类型">
              <span class="ant-tag" style="background:#fff;border-color:#1677ff;color:#1677ff">{{ detailRecord.executorType === 1 ? 'Java' : detailRecord.executorType === 2 ? 'Python' : '-' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="执行器名称">{{ detailRecord.executorName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="创建时间" :span="2">{{ detailRecord.createdDate || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="log" tab="日志详情">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <a-select v-model:value="logStatusFilter" allow-clear style="width:180px" placeholder="请选择状态" :options="logStatusOptions" />
            <div>
              <a-button style="margin-right:8px;" @click="fetchLogList">刷新</a-button>
              <a-button @click="handleLogSearch">重试</a-button>
            </div>
          </div>
          <CommonPagination
            :columns="(logColumns as any)"
            :data-source="logData"
            :loading="logLoading"
            row-key="id"
            :page-no="logPagination.current"
            :page-size="logPagination.pageSize"
            :total="logPagination.total"
            @change="handleLogPageChange"
          />
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
    <a-modal v-model:open="logModalVisible" title="批次日志" @cancel="logModalVisible=false" :footer="null">
      <pre style="max-height:420px;overflow:auto;white-space:pre-wrap;">
        {{ JSON.stringify(logRecord, null, 2) }}
      </pre>
    </a-modal>
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

/* ID 表头 hover 提示效果 */
:deep(.id-tip) { position: relative; }
:deep(.id-tip-icon) {
  display: inline-flex;
  width: 18px; height: 18px;
  align-items: center; justify-content: center;
  background: #f0f0f0; border-radius: 50%;
  transition: background .12s, transform .12s;
}
:deep(.id-tip:hover .id-tip-icon) { background: #e0e0e0; transform: scale(1.05); }
:deep(.id-tip-pop) {
  position: absolute; top: 22px; left: -6px;
  background: #000000bf; color: #fff; padding: 6px 8px;
  border-radius: 4px; font-size: 12px; white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity .12s, transform .12s;
  transform: translateY(-4px);
}
:deep(.id-tip:hover .id-tip-pop) { opacity: 1; transform: translateY(0); }

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