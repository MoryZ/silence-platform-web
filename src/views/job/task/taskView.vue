<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { createJob, getJobPage, Job, updateJob } from '@/api/job/job';
import { getAllGroupConfigs } from '@/api/job/group';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import Draggable from 'vuedraggable';
import { Checkbox as ACheckbox } from 'ant-design-vue';
import { jobStatusOptions, taskTypeEnum, triggerTypeEnum, blockStrategyEnum } from '@/constants/jobEnums';
import DetailDrawer from '@/components/DetailDrawer.vue';
import FormGrid from '@/components/FormGrid.vue';

const drawerVisible = ref(false);
const editingData = ref<Partial<Job> | null>(null);
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
  { title: '序号', dataIndex: 'index', width: 60, fixed: 'left' },
  { title: '任务名称', dataIndex: 'jobName', fixed: 'left', width: 180, clickable: true  },
  { title: '组名称', dataIndex: 'groupName' },
  { title: '执行器', dataIndex: 'executorInfo' },
  { title: '负责人', dataIndex: 'ownerName' },
  { title: '执行时间', dataIndex: 'nextTriggerAt', type: 'date' },
  { title: '状态', dataIndex: 'jobStatus', type: 'switch' },
  { title: '任务类型', dataIndex: 'taskType', type: 'enum', enumMap: taskTypeEnum },
  { title: '触发类型', dataIndex: 'triggerType', type: 'enum', enumMap: triggerTypeEnum },
  { title: '间隔时长', dataIndex: 'triggerInterval' },
  { title: '阻塞策略', dataIndex: 'blockStrategy', type: 'enum', enumMap: blockStrategyEnum },
  { title: '超时时间(秒)', dataIndex: 'executorTimeout' },
  { title: '创建时间', dataIndex: 'createdDate', type: 'date' },
  { title: '更新时间', dataIndex: 'updatedDate', type: 'date' },
  { title: '操作', key: 'operation', width: 100, align: 'center' }
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
    const params = {
      groupName: searchForm.value.groupName,
      jobName: searchForm.value.jobName,
      executorInfo: searchForm.value.executorInfo,
      jobStatus: searchForm.value.jobStatus ? String(searchForm.value.jobStatus) : '',
      executorId: searchForm.value.executorId,
      ownerId: searchForm.value.ownerId,
      pageNo: pagination.current,
      pageSize: pagination.pageSize
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
    groupName: '',
    jobName: '',
    executorInfo: '',
    jobStatus: undefined,
    argsStr: '',
    argsType: 1,
    routeKey: 1,
    executorType: 1,
    blockStrategy: 1,
    triggerType: 1,
    triggerInterval: 60,
    executorTimeout: 60,
    maxRetryTimes: 3,
    retryInterval: 1,
    taskType: 1,
    parallelNum: 1,
    notifyIds: [],
    description: '',
    ownerId: '',
  };
  isEdit.value = false;
  drawerVisible.value = true;
}
function handleEdit(record: Job) {
  editingData.value = { ...record };
  isEdit.value = true;
  drawerVisible.value = true;
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

// 新增/编辑弹窗表单字段配置
const formFields = [
  { key: 'jobName', label: '任务名称', type: 'input', required: true, placeholder: '请输入任务名称' },
  { key: 'groupName', label: '组名称', type: 'select', required: true, placeholder: '请输入组名称', options: [] },
  { key: 'ownerId', label: '负责人', type: 'select', required: true, placeholder: '请选择负责人', options: [] },
  { key: 'jobStatus', label: '状态', type: 'select', required: true, options: jobStatusOptions },
  { key: 'taskType', label: '任务类型', type: 'select', required: true, options: Object.entries(taskTypeEnum).map(([value, { label }]) => ({ label, value: Number(value) })) },
  { key: 'executorType', label: '执行器类型', type: 'select', required: true, options: [{ label: 'Java', value: 1 }, { label: 'Python', value: 2 }] },
  { key: 'executorInfo', label: '执行器名称', type: 'input', required: true, placeholder: '请输入执行器名称' },
  { key: 'argsStr', label: '方法参数', type: 'input', required: false, placeholder: '请输入方法参数' },
  { key: 'routeKey', label: '路由策略', type: 'select', required: true, options: [{ label: '轮询', value: 1 }] },
  { key: 'blockStrategy', label: '阻塞策略', type: 'select', required: true, options: Object.entries(blockStrategyEnum).map(([value, { label }]) => ({ label, value: Number(value) })) },
  { key: 'triggerType', label: '触发类型', type: 'select', required: true, options: Object.entries(triggerTypeEnum).map(([value, { label }]) => ({ label, value: Number(value) })) },
  { key: 'triggerInterval', label: '间隔时长', type: 'number', required: true, min: 1, step: 1, placeholder: '秒' },
  { key: 'executorTimeout', label: '超时时间(秒)', type: 'number', required: true, min: 1, step: 1 },
  { key: 'maxRetryTimes', label: '最大重试次数', type: 'number', required: true, min: 0, step: 1 },
  { key: 'retryInterval', label: '重试间隔', type: 'number', required: true, min: 1, step: 1, placeholder: '秒' },
  { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' }
];

// 初始化加载
fetchData();
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
        <a-button style="margin-right: 8px;" @click="handleRefresh">刷新</a-button>
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <template #overlay>
            <div class="column-setting-popover">
              <Draggable
                v-model="allColumns"
                item-key="key"
                handle=".drag-handle"
                animation="200"
              >
                <template #item="{ element }">
                  <div class="column-setting-item">
                    <span class="drag-handle">☰</span>
                    <a-checkbox
                      :checked="checkedKeys.includes(element.key)"
                      @change="onCheckColumn(element.key, $event.target.checked)"
                    >
                      {{ element.title }}
                    </a-checkbox>
                  </div>
                </template>
              </Draggable>
            </div>
          </template>
          <a-button>
            <template #icon>
              <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="currentColor"><path d="M512 928c-229.75 0-416-186.25-416-416S282.25 96 512 96s416 186.25 416 416-186.25 416-416 416zm0-64c194.13 0 352-157.87 352-352S706.13 160 512 160 160 317.87 160 512s157.87 352 352 352zm-32-480v192h64V384h-64zm0 256v64h64v-64h-64z"></path></svg>
            </template>
            列设置
          </a-button>
        </a-dropdown>
      </div>
      <CommonPagination
        title="定时任务列表"
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
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
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
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
      <FormGrid v-if="editingData" :fields="formFields" :model="editingData" />
      <div style="text-align:right;margin-top:24px;">
        <a-button @click="handleDrawerClose" style="margin-right:8px;">取消</a-button>
        <a-button type="primary" @click="handleDrawerSave">保存</a-button>
      </div>
    </a-drawer>
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
</style>
