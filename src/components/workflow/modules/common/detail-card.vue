<script setup lang="ts">
import { h, nextTick, ref, watch } from 'vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { NSpin, NTabs, NTabPane, NDescriptions, NDescriptionsItem, NTag, NPagination } from 'naive-ui';
import { executorTypeRecord, taskBatchStatusEnum } from '@/constants/business';
import { fetchWorkflowNodeRetry } from '@/api/job/workflow';
import { getJobDetail } from '@/api/job/job';
import { getJobTaskPage } from '@/api/job/job-task';
import { findById } from '@/api/job/job-batch';
import { useWorkflowStore } from '@/stores/workflow';
import { isNotNull } from '@/utils/common';
import { $t } from '@/locales';
import CommonPagination from '@/components/CommonPagination.vue';
import LogDetailModal from '@/components/LogDetailModal.vue';
import JsonViewerModal from '@/components/JsonViewerModal.vue';

defineOptions({
  name: 'DetailCard'
});

interface Props {
  id?: string;
  ids?: string[];
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  show: false,
  ids: () => []
});

interface Emits {
  (e: 'update:show', show: boolean): void;
}

const emit = defineEmits<Emits>();

const store = useWorkflowStore();
const visible = ref(false);
const spinning = ref(false);
const currentIndex = ref(1);
const jobData = ref<Workflow.JobTaskType>({});
const activeTab = ref('info');

// 任务项列表相关
const taskList = ref<any[]>([]);
const taskLoading = ref(false);
const taskStatusFilter = ref<number | undefined>(undefined);
const taskPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
});

const taskStatusOptions = [
  { label: '全部', value: undefined as any },
  { label: '运行中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '处理成功', value: 3 },
  { label: '处理失败', value: 4 },
  { label: '任务停止', value: 5 },
  { label: '取消', value: 6 }
];

watch(
  () => props.show,
  val => {
    visible.value = val;
    if (val) {
      onLoad();
    }
  },
  { immediate: true }
);

const onUpdateShow = (show: boolean = false) => {
  emit('update:show', show);
};

async function getDetail(id: string) {
  spinning.value = true;
  try {
    const res = await getJobDetail(id);
    const data = res?.data ?? res;
    if (!data) return;
    jobData.value = data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
  } finally {
    spinning.value = false;
  }
}

async function getBatchDetail(id: string) {
  spinning.value = true;
  try {
    const res: any = await findById(id);
    const data = res?.data ?? res;
    if (!data) return;
    jobData.value = {
      ...data,
      id: data.id?.toString(),
      taskBatchId: data.id?.toString(),
      createDt: data.createdDate,
      executionAt: data.updatedDate
    } as Workflow.JobTaskType;
    // 加载任务项列表
    fetchTaskList();
  } catch (error) {
    console.error('获取批次详情失败:', error);
  } finally {
    spinning.value = false;
  }
}

const idList = ref<string[]>([]);

function onLoad() {
  idList.value = props.ids;

  nextTick(() => {
    if (props.ids.length > 0) {
      getBatchDetail(props.ids[0]);
    } else if (props.id) {
      idList.value = [jobData.value.taskBatchId!];
      getDetail(props.id);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const retry = async () => {
  try {
    await fetchWorkflowNodeRetry(store.id!, jobData.value.workflowNodeId!);
    message.success('执行重试成功');
  } catch (error) {
    console.error('重试失败:', error);
    message.error('重试失败');
  }
};

function getTagColor(color: string) {
  return {
    color: `${color}18`,
    textColor: color,
    borderColor: `${color}58`
  };
}

const onUpdatePage = (page: number) => {
  currentIndex.value = page;
  const id = props.ids[page - 1];
  getBatchDetail(id);
};

// 任务项列表的列定义
const taskColumns = [
  { title: 'ID', dataIndex: 'id', width: 100 },
  { 
    title: '日志', 
    dataIndex: 'resultMessage', 
    width: 80,
    customRender: ({ record }: { record: any }) => {
      if (!record.resultMessage) return '-';
      return h('a', { 
        style: 'color:#52c41a;cursor:pointer;',
        onClick: () => handleViewLog(record)
      }, '查看');
    }
  },
  { title: '组名称', dataIndex: 'groupName', width: 120 },
  { 
    title: '状态', 
    dataIndex: 'taskStatus', 
    width: 100,
    customRender: ({ record }: { record: any }) => {
      const status = taskBatchStatusEnum[record.taskStatus];
      if (!status) return record.taskStatus;
      return h('span', { 
        class: 'ant-tag', 
        style: `background:#fff;border-color:${status.color};color:${status.color}` 
      }, status.title);
    }
  },
  { title: '地址', dataIndex: 'clientInfo', width: 180 },
  { 
    title: '参数', 
    dataIndex: 'argsStr', 
    width: 80,
    customRender: ({ record }: { record: any }) => {
      if (!record.argsStr) return '-';
      return h('a', { 
        style: 'color:#1677ff;cursor:pointer;',
        onClick: () => handleViewArgs(record)
      }, '查看');
    }
  },
  { 
    title: '结果', 
    dataIndex: 'resultMessage', 
    width: 80,
    customRender: ({ record }: { record: any }) => {
      if (!record.resultMessage) return '-';
      return h('a', { 
        style: 'color:#1677ff;cursor:pointer;',
        onClick: () => handleViewResult(record)
      }, '查看');
    }
  },
  { title: '重试次数', dataIndex: 'retryCount', width: 100 },
  { title: '开始执行时间', dataIndex: 'updatedDate', width: 180 }
];

// 日志弹窗
const logModalVisible = ref(false);
const logModalLoading = ref(false);
const logRecord = ref<any>(null);

// 查看日志
const handleViewLog = (record: any) => {
  logRecord.value = record;
  logModalVisible.value = true;
};

// 参数弹窗
const argsModalVisible = ref(false);
const argsModalContent = ref('');

const handleViewArgs = (record: any) => {
  argsModalContent.value = record.args || '';
  argsModalVisible.value = true;
};

// 结果弹窗
const resultModalVisible = ref(false);
const resultModalContent = ref('');

const handleViewResult = (record: any) => {
  resultModalContent.value = record.result || '';
  resultModalVisible.value = true;
};

// 获取任务项列表
async function fetchTaskList() {
  taskLoading.value = true;
  try {
    const params: any = {
      taskBatchId: String(jobData.value.taskBatchId ?? jobData.value.id ?? ''),
      groupName: jobData.value.groupName,
      pageNo: taskPagination.value.current,
      pageSize: taskPagination.value.pageSize
    };
    if (taskStatusFilter.value !== undefined) {
      params.taskStatus = Number(taskStatusFilter.value);
    }

    const res: any = await getJobTaskPage(params);
    const records: any[] = Array.isArray(res) ? res : (res?.data || res?.records || res?.list || []);
    taskList.value = records;
    taskPagination.value.total = res?.total || records.length;
  } catch (error) {
    console.error('获取任务列表失败:', error);
  } finally {
    taskLoading.value = false;
  }
}

function handleTaskPageChange(page: number, pageSize: number) {
  taskPagination.value.current = page;
  taskPagination.value.pageSize = pageSize;
  fetchTaskList();
}
</script>

<template>
  <a-drawer
    v-model:open="visible"
    width="1100px"
    title="任务批次详情"
    @after-open-change="(open) => !open && onUpdateShow(false)"
  >
    <NTabs v-model:value="activeTab" type="line">
      <!-- 基本信息 -->
      <NTabPane name="info" tab="基本信息">
        <NSpin :show="spinning">
          <NDescriptions label-placement="left" bordered :column="1">
            <NDescriptionsItem :label="$t('page.jobBatch.groupName')">{{ jobData?.groupName }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.jobBatch.jobName')">{{ jobData?.jobName }}</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.jobBatch.taskBatchStatus')">
              <NTag
                v-if="isNotNull(jobData.taskBatchStatus)"
                :color="getTagColor(taskBatchStatusEnum[jobData.taskBatchStatus!].color)"
              >
                {{ taskBatchStatusEnum[jobData.taskBatchStatus!].title }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.jobBatch.operationReason')">
              {{ jobData?.operationReason ?? '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.jobBatch.executorType')">
              <NTag
                v-if="isNotNull(jobData.executorType)"
                :color="getTagColor(executorTypeRecord[jobData.executorType!] ? '#52c41a' : '#999')"
              >
                {{ executorTypeRecord[jobData.executorType!] ? $t(executorTypeRecord[jobData.executorType!]) : '-' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.jobBatch.executorInfo')">
              {{ jobData?.executorInfo }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('common.createdDate')">
              {{ jobData?.createDt }}
            </NDescriptionsItem>
          </NDescriptions>
        </NSpin>
      </NTabPane>

      <!-- 任务项列表 -->
      <NTabPane name="task" tab="任务项列表">
        <div class="task-toolbar">
          <div class="toolbar-left">
            <NSelect
              v-model:value="taskStatusFilter"
              style="width:180px"
              placeholder="请选择状态"
              :options="taskStatusOptions"
              clearable
            />
          </div>
          <div class="toolbar-right">
            <a-button @click="fetchTaskList">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
          </div>
        </div>
        <CommonPagination
          :columns="taskColumns"
          :data-source="taskList"
          :loading="taskLoading"
          row-key="id"
          :page-no="taskPagination.current"
          :page-size="taskPagination.pageSize"
          :total="taskPagination.total"
          @change="handleTaskPageChange"
        />
      </NTabPane>
    </NTabs>

    <!-- 日志详情弹窗 -->
    <!-- @vue-ignore -->
    <LogDetailModal
      v-model:visible="logModalVisible"
      title="日志详情"
      :loading="logModalLoading"
      :status="logRecord?.status"
      :taskBatchId="logRecord?.taskBatchId"
      :taskId="logRecord?.id"
    />

    <!-- 查看参数弹窗 -->
    <JsonViewerModal
      v-model:visible="argsModalVisible"
      title="查看参数"
      :content="argsModalContent"
    />

    <!-- 查看结果弹窗 -->
    <JsonViewerModal
      v-model:visible="resultModalVisible"
      title="查看结果"
      :content="resultModalContent"
    />

    <template #footer v-if="ids && ids.length > 1">
      <NPagination
        v-model:page="currentIndex"
        class="text-center"
        :page-size="1"
        :page-count="ids.length"
        @update:page="onUpdatePage"
      />
    </template>
  </a-drawer>
</template>

<style scoped lang="scss">
.task-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
  }
}
</style>
