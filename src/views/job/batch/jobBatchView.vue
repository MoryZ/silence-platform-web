<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { getJobBatchPage, stopJobBatch, retryJobBatch, batchDeleteJobBatch } from '@/api/job/job-batch';
import type { JobBatch, JobBatchSearchParams } from '@/types/job';
import { getAllGroupConfigs } from '@/api/job/group';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';
import { getJobTaskPage } from '@/api/job/job-task';
import { taskBatchStatusRecordOptions, taskBatchStatusEnum, jobOperationReasonEnum } from '@/constants/business';
// 直接使用中文文案，避免未配置的国际化key展示在界面
import { h, resolveComponent } from 'vue';
import { $t } from '@/locales';
import { DownOutlined } from '@ant-design/icons-vue';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import JsonViewerModal from '@/components/JsonViewerModal.vue';
import LogDetailModal from '@/components/LogDetailModal.vue';
import type { JobMessage } from '@/types/websocket';

const loading = ref(false);
const data = ref<JobBatch[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const searchForm = ref({
  groupName: '',
  jobName: '',
  taskBatchStatuses: [] as string[],
  createdDateRange: [] as any[],
  createdDateStart: '',
  createdDateEnd: ''
});

const fields = [
  { 
    key: 'groupName', 
    type: 'select' as const, 
    label: '组名称', 
    placeholder: '请选择组名称', 
    options: async () => {
      const res = await getAllGroupConfigs();
      const raw = res?.data || res || [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map((item: any) => ({
        label: item.label || item.groupName,
        value: item.label || item.groupName
      }));
    } 
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
    options: taskBatchStatusRecordOptions.map(o => ({ label: $t(o.label), value: String(o.value) })),
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
      defaultRange: [24, 0] as [number, number],
      rangeKeys: { startKey: 'createdDateStart', endKey: 'createdDateEnd' }
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
      return h('a', { style: 'color:var(--primary-color);cursor:pointer;', onClick: () => handleIdDetail(record), title: '点击ID查看详情' }, String(idText));
    }
  },
  { title: '组名称', dataIndex: 'groupName' },
  { title: '任务类型', dataIndex: 'taskType', customRender: ({ record }: { record: any }) => {
      const map: Record<number, { label: string; color: string }> = {
        // eslint-disable-next-line no-restricted-syntax
        1: { label: '集群', color: '#52c41a' },
        // eslint-disable-next-line no-restricted-syntax
        2: { label: '广播', color: '#1677ff' },
        // eslint-disable-next-line no-restricted-syntax
        3: { label: '静态分片', color: '#722ed1' },
        // eslint-disable-next-line no-restricted-syntax
        4: { label: 'Map', color: '#13c2c2' },
        // eslint-disable-next-line no-restricted-syntax
        5: { label: 'MapReduce', color: '#2f54eb' }
      };
      const info = map[record.taskType];
      if (!info) return record.taskType;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${info.color};color:${info.color}` }, info.label);
    }
  },
  { title: '任务名称', dataIndex: 'jobName' },
  { title: '开始执行时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '结束时间', dataIndex: 'executionAt', type: 'date' },
  { title: '执行时长(秒)', dataIndex: 'duration', width: 100,
    customRender: ({ record }: { record: any }) => {
      // 只在成功状态时显示执行时长
      if (record.taskBatchStatus !== 3) return '-';
      const start = record.executionAt ? new Date(record.executionAt).getTime() : undefined;
      const end = record.updatedDate ? new Date(record.updatedDate).getTime() : undefined;
      if (!start || !end || isNaN(start) || isNaN(end) || end < start) return '-';
      return Math.round((end - start) / 1000);
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
        // 无原因（0）使用特殊样式
        if (v === 0) {
          return h('span', { class: 'ant-tag', style: 'background:#f5f5f5;border-color:#d9d9d9;color:#8c8c8c' }, '无');
        }
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
        // eslint-disable-next-line no-restricted-syntax
        1: { label: 'HTTP', color: '#1677ff' },
        // eslint-disable-next-line no-restricted-syntax
        2: { label: 'GRPC', color: '#52c41a' },
        // eslint-disable-next-line no-restricted-syntax
        3: { label: 'Dubbo', color: '#722ed1' }
      };
      const info = map[record.executorType];
      if (!info) return record.executorType;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${info.color};color:${info.color}` }, info.label);
    }
  },
  { title: '执行器名称', dataIndex: 'executorInfo' },
  { title: '创建时间', dataIndex: 'createdDate', type: 'date' },
  { title: '更新时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '操作', key: 'operation', width: 200, align: 'center',
    customRender: ({ record }: { record: any }) => {
      const status = record.taskBatchStatus;
      const isRunning = status === 1 || status === 2; // 等待中或运行中，可停止
      const isFailed = status === 4 || status === 5 || status === 6; // 失败、停止、取消，可重试
      
      return h('div', { style: 'display:flex;gap:8px;justify-content:center;' }, [
        h('a', { onClick: () => handleViewLog(record) }, '日志'),
        isRunning && h('a', { style: 'color:#ff4d4f', onClick: () => handleStop(record) }, '停止'),
        isFailed && h('a', { onClick: () => handleRetry(record) }, '重试'),
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

// 查看参数的弹窗
const argsModalVisible = ref(false);
const argsModalContent = ref('');
const argsModalLoading = ref(false);

// 查看结果的弹窗
const resultModalVisible = ref(false);
const resultModalContent = ref('');
const resultModalLoading = ref(false);

// 日志详情弹窗
const logModalVisible = ref(false);
const logRecord = ref<Record<string, any> | null>(null);
const logModalLoading = ref(false);
const parsedLogList = ref<JobMessage[]>([]);

// 日志详情 - 列与数据
const logLoading = ref(false);
const logStatusFilter = ref<number | undefined>(undefined);
const logPagination = reactive({ current: 1, pageSize: 10, total: 0 });
const logData = ref<any[]>([]);

// 日志状态枚举（示例编码：运行中=2、成功=3、失败=4、停止=5、取消=6，按你的后端调整）
const logStatusEnum: Record<number, { label: string; color: string }> = {
  // eslint-disable-next-line no-restricted-syntax
  2: { label: '运行中', color: '#1677ff' },
  // eslint-disable-next-line no-restricted-syntax
  3: { label: '处理成功', color: '#52c41a' },
  // eslint-disable-next-line no-restricted-syntax
  4: { label: '处理失败', color: '#ff4d4f' },
  // eslint-disable-next-line no-restricted-syntax
  5: { label: '任务停止', color: '#8c8c8c' },
  // eslint-disable-next-line no-restricted-syntax
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
  { 
    title: '日志', 
    dataIndex: 'log', 
    width: 100,
    customRender: ({ record }: { record: any }) => {
      if (!record.log) return '-';
      return h('a', { 
        style: 'color:#52c41a;cursor:pointer;', 
        onClick: (e: Event) => {
          e.stopPropagation();
          handleViewLogContent(record);
        }
      }, '查看');
    } 
  },
  { title: '组名称', dataIndex: 'groupName', width: 140 },
  { title: '状态', dataIndex: 'status', width: 100, customRender: ({ record }: { record: any }) => {
      const m = (logStatusEnum as any)[record.status];
      if (!m) return record.status;
      return h('span', { class: 'ant-tag', style: `background:#fff;border-color:${m.color};color:${m.color}` }, m.label);
    } },
  { title: '地址', dataIndex: 'address', width: 180 },
  { 
    title: '参数', 
    dataIndex: 'args', 
    width: 100,
    customRender: ({ record }: { record: any }) => {
      if (!record.args) return '-';
      return h('a', { 
        style: 'color:var(--primary-color);cursor:pointer;', 
        onClick: (e: Event) => {
          e.stopPropagation();
          handleViewArgs(record);
        }
      }, '查看参数');
    } 
  },
  { 
    title: '结果', 
    dataIndex: 'result', 
    width: 100,
    customRender: ({ record }: { record: any }) => {
      if (!record.result) return '-';
      return h('a', { 
        style: 'color:var(--primary-color);cursor:pointer;', 
        onClick: (e: Event) => {
          e.stopPropagation();
          handleViewResult(record);
        }
      }, '查看结果');
    } 
  },
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
    
    // 解析日志消息数组，提取每个元素的message字段
    const parseLogMessages = (logData: any): string[] => {
      if (!logData) return [];
      try {
        // 如果是字符串，尝试解析为JSON数组
        if (typeof logData === 'string') {
          const parsed = JSON.parse(logData);
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => {
              // 格式: [timestamp][level] location - message
              const time = item.time_stamp ? formatTimestamp(item.time_stamp) : '';
              const level = item.level || '';
              const location = item.location || '';
              const message = item.message || '';
              return `[${time}][${level}] ${location} - ${message}`;
            });
          }
        }
        // 如果直接是数组
        if (Array.isArray(logData)) {
          return logData.map((item: any) => {
            const time = item.time_stamp ? formatTimestamp(item.time_stamp) : '';
            const level = item.level || '';
            const location = item.location || '';
            const message = item.message || '';
            return `[${time}][${level}] ${location} - ${message}`;
          });
        }
        return [String(logData)];
      } catch {
        return [String(logData || '')];
      }
    };
    
    // 时间戳格式化
    const formatTimestamp = (ts: string | number): string => {
      try {
        const num = Number(ts);
        if (num > 1e12) {
          // 毫秒时间戳
          return new Date(num).toLocaleTimeString('zh-CN', { hour12: false });
        } else if (num > 1e9) {
          // 秒时间戳
          return new Date(num * 1000).toLocaleTimeString('zh-CN', { hour12: false });
        }
        return String(ts);
      } catch {
        return String(ts);
      }
    };
    
    logData.value = records.map((r: any) => ({
      id: r.id,
      taskBatchId: r.taskBatchId,
      log: r.resultMessage,
      logMessages: parseLogMessages(r.resultMessage), // 解析后的日志消息数组
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

// 查看日志内容
function handleViewLogContent(record: Record<string, any>) {
  logRecord.value = record;
  logModalLoading.value = false;
  
  // 解析日志内容
  const logContent = record.log || record.resultMessage;
  let messages: JobMessage[] = [];
  if (logContent) {
    try {
      if (typeof logContent === 'string') {
        const parsed = JSON.parse(logContent);
        messages = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(logContent)) {
        messages = logContent;
      } else {
        messages = [logContent];
      }
    } catch {
      // 解析失败，忽略
    }
  }
  parsedLogList.value = messages;
}

// 刷新日志
function handleRefreshLog() {
  fetchLogList();
}

// 查看参数
function handleViewArgs(record: Record<string, any>) {
  argsModalContent.value = record.args || '';
  argsModalVisible.value = true;
}

// 查看结果
function handleViewResult(record: Record<string, any>) {
  resultModalContent.value = record.result || '';
  resultModalVisible.value = true;
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

// 获取操作原因标签
function getOperationReasonLabel(reason: any): string {
  if (reason === null || reason === undefined) return '';
  if (typeof reason === 'number') {
    const info = (jobOperationReasonEnum as any)[reason];
    return info ? ($t ? $t(info.name as any) : info.name) : String(reason);
  }
  if (typeof reason === 'string') {
    return $t ? $t(reason as any) : reason;
  }
  return String(reason);
}

// 获取执行时长
function getExecutionDuration(): string {
  if (!detailRecord.value) return '-';
  // 只在成功状态时显示执行时长
  if (detailRecord.value.taskBatchStatus !== 3) return '-';
  const start = detailRecord.value.executionAt ? new Date(detailRecord.value.executionAt).getTime() : undefined;
  const end = detailRecord.value.updatedDate ? new Date(detailRecord.value.updatedDate).getTime() : undefined;
  if (!start || !end || isNaN(start) || isNaN(end) || end < start) return '-';
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
  return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分`;
}

// 获取执行器类型标签
function getExecutorTypeLabel(type: number | undefined): string {
  const map: Record<number, string> = {
    1: 'Java',
    2: 'Python',
    3: 'Go'
  };
  return map[type ?? 0] || '-';
}

// 获取执行器类型颜色
function getExecutorTypeColor(type: number | undefined): string {
  const map: Record<number, string> = {
    1: 'purple',
    2: 'green',
    3: 'orange'
  };
  return map[type ?? 0] || 'default';
}

// 获取任务类型标签
function getTaskTypeLabel(type: number | undefined): string {
  const map: Record<number, string> = {
    1: '集群',
    2: '广播',
    3: '静态分片',
    4: 'Map',
    5: 'MapReduce'
  };
  return map[type ?? 0] || '-';
}

// 获取任务类型颜色
function getTaskTypeColor(type: number | undefined): string {
  const map: Record<number, string> = {
    1: 'green',
    2: 'blue',
    3: 'purple',
    4: 'cyan',
    5: 'geekblue'
  };
  return map[type ?? 0] || 'default';
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
      jobTaskBatchStatuses: searchForm.value.taskBatchStatuses,
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
  } catch {
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
  // 保留 createdDateRange 用于日期选择器显示，同时更新其他字段
  const currentDateRange = searchForm.value.createdDateRange;
  searchForm.value = { ...newForm, createdDateRange: currentDateRange }
}

const handleSearchPanelReady = (formData: any) => {
  // SearchPanel 初始化完成后，同步默认值到 searchForm
  searchForm.value = { ...searchForm.value, ...formData }
}

function handleReset() {
  searchForm.value = { 
    groupName: '', 
    jobName: '', 
    taskBatchStatuses: [], 
    createdDateRange: [],
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
  } catch {
    message.error('重试失败');
  }
}

async function handleStop(record: JobBatch) {
  try {
    await stopJobBatch(String(record.id));
    message.success('停止成功');
    fetchData();
  } catch {
    message.error('停止失败');
  }
}

async function handleDelete(ids: string[]) {
  try {
    await batchDeleteJobBatch(ids);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
}

onMounted(() => {
  // 日期默认值由 SearchPanel 设置
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
      @ready="handleSearchPanelReady"
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
          <div v-if="detailRecord" class="detail-base-info">
            <!-- 状态概览卡片 -->
            <div class="info-overview-card">
              <div class="overview-status">
                <a-tag 
                  v-if="detailRecord.taskBatchStatus !== undefined" 
                  class="status-tag" 
                  :style="{
                    background: taskBatchStatusEnum[detailRecord.taskBatchStatus]?.color + '20',
                    borderColor: taskBatchStatusEnum[detailRecord.taskBatchStatus]?.color,
                    color: taskBatchStatusEnum[detailRecord.taskBatchStatus]?.color
                  }"
                >
                  <template #icon>
                    <CheckCircleOutlined v-if="detailRecord.taskBatchStatus === 3" />
                    <CloseCircleOutlined v-else-if="detailRecord.taskBatchStatus === 4" />
                    <ClockCircleOutlined v-else-if="detailRecord.taskBatchStatus === 2" />
                    <StopOutlined v-else />
                  </template>
                  {{ taskBatchStatusEnum[detailRecord.taskBatchStatus]?.title || detailRecord.taskBatchStatus }}
                </a-tag>
                <span v-if="detailRecord.operationReason !== undefined && detailRecord.operationReason !== null" class="reason-text">
                  {{ getOperationReasonLabel(detailRecord.operationReason) }}
                </span>
              </div>
              <div class="overview-time">
                <span class="time-label">执行时长</span>
                <span class="time-value">{{ getExecutionDuration() }}</span>
              </div>
            </div>

            <!-- 基本信息卡片 -->
            <a-card title="基本信息" size="small" class="info-card">
              <a-descriptions :column="2" size="small" :label-style="{ fontWeight: 500, color: '#666' }">
                <a-descriptions-item label="组名称">
                  <span class="field-value">{{ detailRecord.groupName || '-' }}</span>
                </a-descriptions-item>
                <a-descriptions-item label="任务名称">
                  <span class="field-value">{{ detailRecord.jobName || '-' }}</span>
                </a-descriptions-item>
                <a-descriptions-item label="执行器类型">
                  <a-tag :color="getExecutorTypeColor(detailRecord.executorType)">
                    {{ getExecutorTypeLabel(detailRecord.executorType) }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="执行器名称">
                  <span class="field-value">{{ detailRecord.executorInfo || '-' }}</span>
                </a-descriptions-item>
                <a-descriptions-item label="任务类型">
                  <a-tag :color="getTaskTypeColor(detailRecord.taskType)">
                    {{ getTaskTypeLabel(detailRecord.taskType) }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="创建时间">
                  <span class="field-value">{{ detailRecord.createdDate || '-' }}</span>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>

            <!-- 执行信息卡片 -->
            <a-card title="执行信息" size="small" class="info-card">
              <a-descriptions :column="2" size="small" :label-style="{ fontWeight: 500, color: '#666' }">
                <a-descriptions-item label="开始执行时间">
                  <span class="field-value">{{ detailRecord.updatedDate || '-' }}</span>
                </a-descriptions-item>
                <a-descriptions-item label="结束时间">
                  <span class="field-value">{{ detailRecord.executionAt || '-' }}</span>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </div>
        </a-tab-pane>
        <a-tab-pane key="log" tab="日志详情">
          <div class="log-toolbar">
            <div class="toolbar-left">
              <a-select 
                v-model:value="logStatusFilter" 
                allow-clear 
                style="width:180px" 
                placeholder="请选择状态" 
                :options="logStatusOptions" 
              />
            </div>
            <div class="toolbar-right">
              <a-button @click="fetchLogList">
                <template #icon><ReloadOutlined /></template>
                刷新
              </a-button>
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

    <!-- 日志详情弹窗 -->
    <LogDetailModal
      v-model:visible="logModalVisible"
      title="日志详情"
      :loading="logModalLoading"
      :status="logRecord?.status"
      :taskBatchId="logRecord?.taskBatchId"
      :taskId="logRecord?.id"
      :enableWebSocket="true"
      :autoConnect="true"
      :initLogs="parsedLogList"
      @refresh="handleRefreshLog"
    />

    <!-- 查看参数弹窗 -->
    <JsonViewerModal
      v-model:visible="argsModalVisible"
      title="查看参数"
      :content="argsModalContent"
      :loading="argsModalLoading"
    />

    <!-- 查看结果弹窗 -->
    <JsonViewerModal
      v-model:visible="resultModalVisible"
      title="查看结果"
      :content="resultModalContent"
      :loading="resultModalLoading"
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
  border-radius: var(--radius-lg);
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

/* 日志工具栏 */
.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: var(--radius-lg);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 基本信息详情样式 */
.detail-base-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 状态概览卡片 */
.info-overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.overview-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.overview-status .status-tag {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid;
  display: flex;
  align-items: center;
  gap: 6px;
}

.overview-status .reason-text {
  font-size: 14px;
  opacity: 0.9;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
}

.overview-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.overview-time .time-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.overview-time .time-value {
  font-size: 24px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* 信息卡片 */
.info-card {
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: none;
}

.info-card :deep(.ant-card-head) {
  background: #fafafa;
  border-radius: 8px 8px 0 0;
  min-height: 40px;
}

.info-card :deep(.ant-card-head-title) {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.info-card :deep(.ant-card-body) {
  padding: 16px;
}

.info-card :deep(.ant-descriptions-item-label) {
  color: #666;
  font-weight: 500;
  width: 100px;
}

.info-card :deep(.ant-descriptions-item-content) {
  color: #333;
}

.field-value {
  color: #333;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .info-card :deep(.ant-card-head) {
    background: #2a2a2a;
  }

  .info-card :deep(.ant-descriptions-item-label) {
    color: #999;
  }

  .field-value {
    color: #e0e0e0;
  }
}
</style>