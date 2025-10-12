<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { createJob, getJobPage, Job, triggerJob, updateJob, deleteJob, importJob, exportJob } from '@/api/job/job';
import { getAllGroupConfigs } from '@/api/job/group';
import { fetchSystemUser } from '@/api/job/systemUser';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';
import { jobStatusOptions, taskTypeEnum, triggerTypeEnum, blockStrategyEnum, routeKeyEnum } from '@/constants/jobEnums';
import DetailDrawer from '@/components/DetailDrawer.vue';
import { DownOutlined } from '@ant-design/icons-vue';

const drawerVisible = ref(false);
const editingData = ref<Job | null>(null);
const isEdit = ref(false);
const loading = ref(false);
const data = ref<Job[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const searchForm = ref({ groupName: '', jobName: '', executorInfo: '', jobStatus: undefined, executorId: '', ownerId: '' });
const fields = [
  { key: 'groupName', type: 'select', label: '组名称', placeholder: '请选择组名称', options: async () => await getAllGroupConfigs() },
  { key: 'jobName', type: 'input', label: '任务名称', placeholder: '请输入任务名称' },
  { key: 'executorInfo', type: 'input', label: '执行器名称', placeholder: '请输入执行器名称' },
  { key: 'jobStatus', type: 'select', label: '任务状态', placeholder: '请选择任务状态', options: jobStatusOptions },
  { key: 'executorId', type: 'select', label: '负责人', placeholder: '请选择负责人' },
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
  { title: '序号', dataIndex: 'index', width: 70 },
  { title: '任务名称', dataIndex: 'jobName', width: 180, clickable: true },
  { title: '组名称', dataIndex: 'groupName', width: 140 },
  { title: '执行器名称', dataIndex: 'executorInfo', width: 160 },
  { title: '负责人', dataIndex: 'ownerName', width: 120 },
  { title: '触发时间', dataIndex: 'nextTriggerAt', type: 'date', width: 170 },
  { title: '状态', dataIndex: 'jobStatus', type: 'switch', width: 80 },
  { title: '任务类型', dataIndex: 'taskType', type: 'enum', enumMap: taskTypeEnum, width: 110 },
  { title: '触发类型', dataIndex: 'triggerType', type: 'enum', enumMap: triggerTypeEnum, width: 110 },
  { title: '间隔时长', dataIndex: 'triggerInterval', width: 100 },
  { title: '阻塞策略', dataIndex: 'blockStrategy', type: 'enum', enumMap: blockStrategyEnum, width: 110 },
  { title: '超时时间(秒)', dataIndex: 'executorTimeout', width: 120 },
  { title: '更新时间', dataIndex: 'updatedDate', type: 'date', width: 170 },
  { title: '操作', key: 'operation', width: 160, align: 'center' }
]));
const checkedKeys = ref<string[]>(allColumns.value.filter((c: Record<string, any>) => c.visible).map((c: Record<string, any>) => c.key));

// ensure dropdown overlay renders into body to avoid clipping
const getBodyContainer = () => document.body as HTMLElement;
const columnSettingVisible = ref(false);

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
    const params = {
      groupName: searchForm.value.groupName,
      jobName: searchForm.value.jobName,
      executorInfo: searchForm.value.executorInfo,
      jobStatus: searchForm.value.jobStatus ? String(searchForm.value.jobStatus) : '',
      executorId: searchForm.value.executorId,
      ownerId: searchForm.value.ownerId,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      sort: '-updatedDate'
    };
    const res = await getJobPage(params);
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
  searchForm.value = { groupName: '', jobName: '', executorInfo: '', jobStatus: undefined, executorId: '', ownerId: '' };
  handleSearch();
}
function handleAdd() {
  editingData.value = {
    id: '',
    groupName: '',
    jobName: '',
    executorInfo: '',
    jobStatus: true,
    argsStr: '',
    argsType: 1,
    routeKey: 1,
    executorType: 1,
    blockStrategy: 1,
    triggerType: 2,
    triggerInterval: 60,
    executorTimeout: 60,
    maxRetryTimes: 3,
    retryInterval: 1,
    taskType: 1,
    parallelNum: 1,
    notifyIds: [],
    description: '',
    ownerId: ''
  };
  isEdit.value = false;
  drawerVisible.value = true;
  executorMode.value = 'custom';
  builtinExecutorType.value = 'http';
  httpMethod.value = 'POST';
  builtinUrl.value = '';
  httpHeaders.value = [{ key: '', value: '' }];
  httpBody.value = '';
  mediaType.value = 'application/json';
}
function handleEdit(record: Job) {
  editingData.value = { ...record };
  isEdit.value = true;
  drawerVisible.value = true;
  if (record.argsType === 2) {
    // 内置
    try {
      const args = JSON.parse(record.argsStr || '{}');
      httpMethod.value = args.method || 'POST';
      builtinUrl.value = args.url || '';
      httpHeaders.value = Object.entries(args.headers || {}).map(([key, value]) => ({ key, value: String(value) }));
      httpBody.value = args.body || '';
      mediaType.value = args.mediaType || 'application/json';
      if (editingData.value) editingData.value.executorTimeout = args.timeout || 60;
    } catch {}
  } else {
    // 自定义
    httpMethod.value = 'POST';
    builtinUrl.value = '';
    httpHeaders.value = [{ key: '', value: '' }];
    httpBody.value = '';
    mediaType.value = 'application/json';
  }
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
function handleDrawerClose() {
  drawerVisible.value = false;
}
async function handleDrawerSave() {
  if (!editingData.value) return;
  try {
    if (isEdit.value && editingData.value.id) {
      await updateJob(editingData.value.id, editingData.value);
      message.success('编辑成功');
    } else {
      await createJob(editingData.value);
      message.success('新增成功');
    }
    drawerVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('操作失败');
  }
}

function onCheckColumn(key: string, checked: boolean) {
  if (checked) {
    if (!checkedKeys.value.includes(key)) checkedKeys.value.push(key);
  } else {
    checkedKeys.value = checkedKeys.value.filter((k: string) => k !== key);
  }
}

const groupOptions = ref<any[]>([]);
const ownerOptions = ref<any[]>([]);

const showArgsEditor = ref(false);
const argsEditorValue = ref('');

function openArgsEditor() {
  argsEditorValue.value = editingData.value?.argsStr || '';
  showArgsEditor.value = true;
  nextTick(() => {
    // 可选：聚焦或其它操作
  });
}
function handleArgsEditorOk() {
  if (editingData.value) {
    editingData.value.argsStr = argsEditorValue.value;
  }
  showArgsEditor.value = false;
}

function onArgsEditorInput(e: any) {
  if (editingData.value) {
    editingData.value.argsStr = argsEditorValue.value;
  }
}
function onArgsInputChange(e: any) {
  if (showArgsEditor.value) {
    argsEditorValue.value = editingData.value?.argsStr || '';
  }
}

const EXECUTOR_RADIO = [
  { label: '自定义执行器', value: 'custom' },
  { label: '内置执行器', value: 'builtin' }
];
const EXECUTOR_TYPE_OPTIONS = [
  { label: 'Http 执行器', value: 'http' },
  { label: 'CMD 执行器', value: 'cmd' },
  { label: 'PowerShell 执行器', value: 'powershell' },
  { label: 'Shell 执行器', value: 'shell' }
];
const HTTP_METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
];

const executorMode = ref('custom');
const builtinExecutorType = ref('http');
const httpMethod = ref('POST');
const builtinUrl = ref('');
const httpHeaders = ref([{ key: '', value: '' }]);
const httpBody = ref('');
const mediaType = ref('application/json');
const showBodyEditor = ref(false);
const bodyEditorValue = ref('');

// 监听内置相关字段变化，自动组装 argsStr（以 argsType 为准）
watch([
  httpMethod, builtinUrl, httpHeaders, httpBody, mediaType, () => editingData.value && editingData.value.executorTimeout, () => editingData.value && editingData.value.argsType
], () => {
  if (editingData.value?.argsType === 2) {
    const headersObj = Object.fromEntries(httpHeaders.value.filter(h => h.key).map(h => [h.key, h.value]));
    editingData.value.argsStr = JSON.stringify({
      method: httpMethod.value,
      url: builtinUrl.value,
      headers: headersObj,
      body: httpBody.value,
      mediaType: mediaType.value,
      timeout: editingData.value.executorTimeout
    });
  }
});

// 切换执行器类型时联动 argsType
watch(executorMode, (val) => {
  if (editingData.value) {
    editingData.value.argsType = val === 'builtin' ? 2 : 1;
  }
});

function addHeader() {
  httpHeaders.value.push({ key: '', value: '' });
}
function removeHeader(idx: number) {
  httpHeaders.value.splice(idx, 1);
}
function openBodyEditor() {
  bodyEditorValue.value = httpBody.value;
  showBodyEditor.value = true;
}
function handleBodyEditorOk() {
  httpBody.value = bodyEditorValue.value;
  showBodyEditor.value = false;
}

// 公共字段（始终显示）
const commonFields: any[] = [
  { key: 'jobName', label: '任务名称', type: 'input', required: true, placeholder: '请输入任务名称' },
  { key: 'groupName', label: '组名称', type: 'select', required: true, placeholder: '请输入组名称', options: groupOptions.value },
  { key: 'ownerId', label: '负责人', type: 'select', required: true, placeholder: '请选择负责人', options: ownerOptions.value },
  { key: 'jobStatus', label: '状态', type: 'radio', required: true, options: jobStatusOptions },
  { key: 'taskType', label: '任务类型', type: 'select', required: true, options: Object.entries(taskTypeEnum).map(([value, { label }]) => ({ label, value: Number(value) })) },
  { key: 'routeKey', label: '路由策略', type: 'select', required: true, options: [{ label: '轮询', value: 1 }] },
  { key: 'blockStrategy', label: '阻塞策略', type: 'select', required: true, options: Object.entries(blockStrategyEnum).map(([value, { label }]) => ({ label, value: Number(value) })) },
  { key: 'triggerType', label: '触发类型', type: 'select', required: true, options: Object.entries(triggerTypeEnum).map(([value, { label }]) => ({ label, value: Number(value) })) },
  { key: 'triggerInterval', label: '间隔时长', type: 'number', required: true, min: 1, step: 1, placeholder: '秒' },
  { key: 'executorTimeout', label: '超时时间(秒)', type: 'number', required: true, min: 1, step: 1 },
  { key: 'maxRetryTimes', label: '最大重试次数', type: 'number', required: true, min: 0, step: 1 },
  { key: 'retryInterval', label: '重试间隔', type: 'number', required: true, min: 1, step: 1, placeholder: '秒' },
  { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' }
];

watch(groupOptions, (val) => {
  const groupField = commonFields.find(f => f.key === 'groupName');
  if (groupField) groupField.options = val;
});

watch(ownerOptions, (val) => {
  const ownerField = commonFields.find(f => f.key === 'ownerId');
  if (ownerField) ownerField.options = val;
});

onMounted(async () => {
  const res = await getAllGroupConfigs();
  groupOptions.value = res || [];

  const userRes = await fetchSystemUser();
  ownerOptions.value = userRes || [];
});

// 执行器名称切换联动
watch(executorMode, (val) => {
  if (val === 'custom') {
    builtinExecutorType.value = 'http';
    httpMethod.value = 'POST';
    httpHeaders.value = [{ key: '', value: '' }];
    httpBody.value = '';
    if (editingData.value) {
      editingData.value.executorInfo = '';
      editingData.value.argsStr = '';
    }
  } else if (val === 'builtin') {
    if (editingData.value) {
      editingData.value.executorInfo = builtinExecutorType.value;
      editingData.value.argsStr = httpBody.value;
    }
  }
});
watch(builtinExecutorType, (val) => {
  if (executorMode.value === 'builtin' && editingData.value) {
    editingData.value.executorInfo = val;
    httpHeaders.value = [{ key: '', value: '' }];
    httpBody.value = '';
    editingData.value.argsStr = '';
  }
});

// 初始化加载
fetchData();

const showExecuteModal = ref(false);
const tmpArgsStr = ref('');
let currentExecJobId = '';

function handleExecute(record: Job) {
  currentExecJobId = record.id;
  tmpArgsStr.value = record.argsStr || '';
  showExecuteModal.value = true;
}

async function handleDoExecute() {
  try {
    await triggerJob(currentExecJobId, { tmpArgsStr: tmpArgsStr.value });
    message.success('任务已执行');
    showExecuteModal.value = false;
  } catch (e) {
    message.error('执行失败');
  }
}

function handleCopy(record: Job) {
  editingData.value = {
    ...record,
    id: '',
    jobName: record.jobName + '_副本'
  };
  isEdit.value = false;
  drawerVisible.value = true;
}

async function handleDelete(record: Job) {
  try {
    await deleteJob([record.id]);
    message.success('删除成功');
    fetchData();
  } catch (e) {
    message.error('删除失败');
  }
}

function handleBatch(record: Job) {
  message.info(`批次：${record.jobName}`);
}

const showImportModal = ref(false);
const importFile = ref<File | null>(null);
const importFileName = ref('');
const selectedRowKeys = ref<string[]>([]);

function handleBeforeUpload(file: File) {
  importFile.value = file;
  importFileName.value = file.name;
  showImportModal.value = true;
  return false;
}
async function handleImportSave() {
  if (!importFile.value) return;
  await importJob(importFile.value);
  message.success('导入成功');
  showImportModal.value = false;
  fetchData();
}
function handleExport() {
  const params = {
    jobIds: selectedRowKeys.value,
    groupName: searchForm.value.groupName,
    jobName: searchForm.value.jobName,
    jobStatus: searchForm.value.jobStatus !== undefined ? searchForm.value.jobStatus : false
  };
  exportJob(params);
}
</script>

<template>
  <div class="job-task-page">
    <a-card :bordered="false">
      <SearchPanel
        v-model="searchForm"
        :fields="fields as any"
        @search="handleSearch"
        @reset="handleReset"
      />
      <div class="table-toolbar">
        <a-button type="primary" style="margin-right: 8px;" @click="handleAdd">新增</a-button>
        <a-upload :before-upload="handleBeforeUpload" :show-upload-list="false">
          <a-button style="margin-right: 8px;">导入</a-button>
        </a-upload>
        <a-button style="margin-right: 8px;" @click="handleExport">导出</a-button>
        <a-button style="margin-right: 8px;" danger>批量删除</a-button>
        <a-button style="margin-right: 8px;" @click="handleRefresh">刷新</a-button>
        <ColumnSettings
          :columns="allColumns as any"
          v-model="checkedKeys"
          @update:columns="val => allColumns = val as any"
        />
      </div>
      <CommonPagination
        title="定时任务列表"
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :row-selection="{ selectedRowKeys, onChange: (keys: string[]) => (selectedRowKeys as any).value = keys }"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:pageNo="val => { pagination.current = val; fetchData(); }"
        @update:pageSize="val => { pagination.pageSize = val; pagination.current = 1; fetchData(); }"
        @change="handlePageChange"
        @cell-click="handleCellClick"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-space size="small">
              <a-button type="link" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" @click="handleExecute(record)">执行</a-button>
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <a-button type="link">更多 <DownOutlined /></a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="handleCopy(record)">复制</a-menu-item>
                    <a-menu-item @click="handleBatch(record)">批次</a-menu-item>
                    <a-menu-item danger @click="handleDelete(record)">删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </CommonPagination>
    </a-card>

    
    <DetailDrawer
      v-model:visible="detailDrawerVisible"
      :record="detailRecord"
      :columns="(tableColumns as any)"
      :enums="{ taskTypeEnum, triggerTypeEnum, blockStrategyEnum, jobStatusOptions }"
    />
    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? '编辑定时任务' : '新增定时任务'"
      width="700"
      :footer="null"
      @close="handleDrawerClose"
    >
      <a-form layout="vertical" v-if="editingData">
        <!-- 任务基础信息 -->
        <a-form-item label="任务名称">
          <a-input v-model:value="editingData.jobName" placeholder="请输入任务名称" :maxlength="64" />
        </a-form-item>
        <a-form-item label="组名称">
          <a-select v-model:value="editingData.groupName" :options="groupOptions" placeholder="请输入组名称" />
        </a-form-item>
        <a-form-item label="负责人">
          <a-select v-model:value="editingData.ownerId" :options="ownerOptions" placeholder="请选择负责人" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="editingData.jobStatus">
            <a-radio :value="true">启用</a-radio>
            <a-radio :value="false">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="任务类型">
          <a-select v-model:value="editingData.taskType" :options="Object.entries(taskTypeEnum).map(([value, { label }]) => ({ label, value: Number(value) }))" />
        </a-form-item>
        <a-form-item label="执行器类型">
          <a-select v-model:value="editingData.executorType" :options="[{ label: 'Java', value: 1 }, { label: 'Python', value: 2 }, { label: 'Go', value: 3 }]" style="width:100%;" />
        </a-form-item>
        <!-- 执行器名称类型与参数 -->
        <a-form-item label="执行器名称类型">
          <a-radio-group v-model:value="executorMode" style="margin-left:8px;">
            <a-radio v-for="item in EXECUTOR_RADIO" :key="item.value" :value="item.value">{{ item.label }}</a-radio>
          </a-radio-group>
        </a-form-item>
        <template v-if="editingData?.argsType === 1">
          <a-form-item label="执行器名称">
            <a-input v-model:value="editingData.executorInfo" placeholder="请输入执行器名称" />
          </a-form-item>
          <a-form-item label="方法参数">
            <div style="display:flex;align-items:center;gap:8px;">
              <a-input v-model:value="editingData.argsStr" placeholder="请输入方法参数" style="flex:1;" @input="onArgsInputChange" />
              <a-button @click="openArgsEditor" type="text" style="border-radius:6px;padding:0 8px;">
                <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M384 672v128a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32V672h64a32 32 0 0 0 32-32V512h128a32 32 0 0 0 32-32V352a32 32 0 0 0-32-32H672V192a32 32 0 0 0-32-32H512a32 32 0 0 0-32 32v128h-64a32 32 0 0 0-32 32v128H256a32 32 0 0 0-32 32v128a32 32 0 0 0 32 32h128z" fill="#888"/></svg>
              </a-button>
            </div>
          </a-form-item>
        </template>
        <template v-else-if="editingData?.argsType === 2">
          <a-form-item label="执行器名称">
            <a-select v-model:value="builtinExecutorType" :options="EXECUTOR_TYPE_OPTIONS" style="width:100%;" />
          </a-form-item>
          <a-form-item label="请求地址">
            <a-input v-model:value="builtinUrl" placeholder="请输入请求地址" />
          </a-form-item>
          <a-form-item label="请求方法">
            <a-select v-model:value="httpMethod" :options="HTTP_METHOD_OPTIONS" style="width:100px;" />
          </a-form-item>
          <a-form-item label="MediaType">
            <a-input v-model:value="mediaType" placeholder="请输入 MediaType" />
          </a-form-item>
          <a-form-item label="Header 参数">
            <div v-for="(item, idx) in httpHeaders" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;">
              <a-input v-model:value="item.key" placeholder="Key" style="width:40%;" />
              <a-input v-model:value="item.value" placeholder="Value" style="width:40%;" />
              <a-button @click="removeHeader(idx)" danger>删除</a-button>
            </div>
            <a-button @click="addHeader" type="dashed">添加Header</a-button>
          </a-form-item>
          <a-form-item label="Body 参数">
            <div style="display:flex;align-items:center;gap:8px;">
              <a-input v-model:value="httpBody" placeholder="请输入Body参数" style="flex:1;" />
              <a-button @click="openBodyEditor" type="text" style="border-radius:6px;padding:0 8px;">
                <svg width="18" height="18" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M384 672v128a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32V672h64a32 32 0 0 0 32-32V512h128a32 32 0 0 0 32-32V352a32 32 0 0 0-32-32H672V192a32 32 0 0 0-32-32H512a32 32 0 0 0-32 32v128h-64a32 32 0 0 0-32 32v128H256a32 32 0 0 0-32 32v128a32 32 0 0 0 32 32h128z" fill="#888"/></svg>
              </a-button>
            </div>
          </a-form-item>
        </template>
        <!-- 公共参数区域，始终展示 -->
        <div style="margin-top:24px;">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="路由策略" required>
                <a-select v-model:value="editingData.routeKey" :options="Object.entries(routeKeyEnum).map(([value, { label }]) => ({ label, value: Number(value) }))" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="阻塞策略" required>
                <a-select v-model:value="editingData.blockStrategy" :options="Object.entries(blockStrategyEnum).map(([value, { label }]) => ({ label, value: Number(value) }))" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="触发类型" required>
                <a-select v-model:value="editingData.triggerType" :options="Object.entries(triggerTypeEnum).map(([value, { label }]) => ({ label, value: Number(value) }))" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="间隔时长" required>
                <a-input-number v-model:value="editingData.triggerInterval" min="1" style="width:70%;" />
                <span style="margin-left:8px;">秒</span>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="超时时间(秒)" required>
                <a-input-number v-model:value="editingData.executorTimeout" min="1" style="width:70%;" />
                <span style="margin-left:8px;">秒</span>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="最大重试次数" required>
                <a-input-number v-model:value="editingData.maxRetryTimes" min="0" style="width:70%;" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="重试间隔" required>
                <a-input-number v-model:value="editingData.retryInterval" min="1" style="width:70%;" />
                <span style="margin-left:8px;">秒</span>
              </a-form-item>
            </a-col>
            <a-col :span="24">
              <a-form-item label="告警通知">
                <a-select v-model:value="editingData.notifyIds" mode="multiple" placeholder="请输入选择告警配置" />
              </a-form-item>
            </a-col>
            <a-col :span="24">
              <a-form-item label="描述">
                <a-textarea v-model:value="editingData.description" placeholder="请输入描述" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
      <div style="text-align:right;margin-top:24px;">
        <a-button @click="handleDrawerClose" style="margin-right:8px;">取消</a-button>
        <a-button type="primary" @click="handleDrawerSave">保存</a-button>
      </div>
      <a-modal v-model:open="showArgsEditor" title="方法参数编辑器" width="480px" @ok="handleArgsEditorOk" @cancel="showArgsEditor=false" wrap-class-name="fullscreen-modal">
        <a-textarea v-model:value="argsEditorValue" :rows="12" placeholder="请输入方法参数（支持多行）" style="font-size:15px;line-height:1.7;border-radius:10px;background:#fafbfc;min-height:180px;" @input="onArgsEditorInput" />
      </a-modal>
    </a-drawer>
    <a-modal v-model:open="showExecuteModal" title="执行任务" @ok="handleDoExecute" @cancel="showExecuteModal=false">
      <a-form>
        <a-form-item label="方法参数">
          <a-input v-model:value="tmpArgsStr" placeholder="请输入方法参数" />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:open="showImportModal" title="导入任务" @ok="handleImportSave" @cancel="showImportModal=false">
      <div>已选择文件：{{ importFileName }}</div>
    </a-modal>
  </div>
</template>

<style scoped>
.namespace-page {
  padding: 24px;
  background: #fafbfc;
  height: 100%;
}
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  justify-content: space-between;
}
.right-btns {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.table-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  margin-bottom: 8px;
}
.column-setting-popover {
  min-width: 180px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}
.column-setting-item {
  display: flex;
  align-items: center;
  padding: 2px 12px;
  user-select: none;
}
.drag-handle {
  cursor: grab;
  margin-right: 8px;
  color: #bbb;
  font-size: 16px;
}
/* 全屏编辑器美化 */
.ant-modal {
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  padding: 0 !important;
}
.ant-modal-content {
  border-radius: 16px !important;
  padding: 32px 32px 24px 32px !important;
}
.ant-modal-title {
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 8px;
}
.ant-modal-body {
  padding: 0 !important;
}
.ant-input-textarea {
  border-radius: 10px !important;
  font-size: 16px !important;
  line-height: 1.7 !important;
  padding: 16px !important;
  min-height: 320px;
  background: #fafbfc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.ant-modal-footer {
  border-top: none !important;
  padding: 16px 32px 24px 32px !important;
}
/* 全屏编辑器弹窗美化 */
.fullscreen-modal .ant-modal-content {
  border-radius: 14px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  padding: 20px 20px 16px 20px !important;
}
.fullscreen-modal .ant-modal-title {
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 8px;
}
.fullscreen-modal .ant-modal-footer {
  border-top: none !important;
  padding: 12px 20px 16px 20px !important;
}
</style>
