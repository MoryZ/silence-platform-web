<script setup lang="tsx">
import { Button, Dropdown, Popconfirm, Tag, Table } from 'ant-design-vue';
import { useBoolean } from '@sa/hooks';
import { ref } from 'vue';
import { fetchBatchDeleteJob, fetchGetJobPage, fetchUpdateJobStatus } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { blockStrategyRecord, taskTypeRecord, triggerTypeRecord } from '@/constants/business';
import StatusSwitch from '@/components/common/status-switch.vue';
import { useRouterPush } from '@/hooks/common/router';
import { useAuth } from '@/hooks/business/auth';
import { downloadFetch } from '@/utils/download';
import JobTaskOperateDrawer from './modules/job-task-operate-drawer.vue';
import JobTaskTriggerModal from './modules/job-task-trigger-modal.vue';
import JobTaskSearch from './modules/job-task-search.vue';
import JobTaskDetailDrawer from './modules/job-task-detail-drawer.vue';

const { hasAuth } = useAuth();

const appStore = useAppStore();
const { routerPushByKey } = useRouterPush();

/** 详情页属性数据 */
const detailData = ref<Api.Job.Job | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);
const triggerData = ref<Api.Job.Job | null>();
const { bool: triggerVisible, setTrue: openTriggerModal } = useBoolean(false);

const { columnChecks, columns, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetJobPage,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    jobName: null,
    jobStatus: null,
    ownerId: null,
    executorInfo: null
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'id',
      title: $t('common.index'),
      width: 60,
      align: 'center'
    },
    {
      key: 'jobName',
      title: $t('page.job.task.jobName'),
      width: 200,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'groupName',
      title: $t('page.job.task.groupName'),
      width: 120
    },
    {
      key: 'taskType',
      title: $t('page.job.task.taskType'),
      width: 100,
      render: row => {
        const record = taskTypeRecord[row.taskType];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'triggerType',
      title: $t('page.job.task.triggerType'),
      width: 100,
      render: row => {
        const record = triggerTypeRecord[row.triggerType];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'blockStrategy',
      title: $t('page.job.task.blockStrategy'),
      width: 100,
      render: row => {
        const record = blockStrategyRecord[row.blockStrategy];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'jobStatus',
      title: $t('page.job.task.jobStatus'),
      width: 100,
      render: row => {
        return <StatusSwitch v-model:value={row.jobStatus} onUpdateValue={value => handleUpdateStatus(row, value)} />;
      }
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      width: 200,
      align: 'center',
      render: row => {
        return (
          <div class="flex-center gap-8px">
            <Button type="link" onClick={() => handleEdit(row)}>
              {$t('common.edit')}
            </Button>
            <Button type="link" onClick={() => handleDetail(row)}>
              {$t('common.detail')}
            </Button>
            <Button type="link" onClick={() => handleTrigger(row)}>
              {$t('page.job.task.trigger')}
            </Button>
            <Popconfirm
              title={$t('common.deleteConfirm')}
              onConfirm={() => handleDelete(row)}
            >
              <Button type="link" danger>
                {$t('common.delete')}
              </Button>
            </Popconfirm>
          </div>
        );
      }
    }
  ]
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  handleCopy,
  checkedRowKeys,
  onDeleted,
  onBatchDeleted
  // closeDrawer
} = useTableOperate(data, getData);

async function handleDelete(id: string) {
  const { error } = await fetchBatchDeleteJob([id]);
  if (error) return;
  onDeleted();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteJob(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

function add() {
  editingData.value = null;
  handleAdd();
}

function edit(id: string) {
  handleEdit(id);
}

function copy(id: string) {
  handleCopy(id);
}

async function handleTriggerJob(job: Api.Job.Job) {
  triggerData.value = job;
  openTriggerModal();
}

function goToBatch(jobId: string) {
  const findItem = data.value.find(item => item.id === jobId)!;
  routerPushByKey('job_batch', { state: { jobId, jobName: findItem.jobName } });
}

function body(): Api.Job.ExportJob {
  return {
    jobIds: checkedRowKeys.value,
    groupName: searchParams.groupName,
    jobName: searchParams.jobName,
    jobStatus: searchParams.jobStatus,
    ownerId: searchParams.ownerId
  };
}

function handleExport() {
  downloadFetch('/job/export', body(), $t('page.jobTask.title'));
}
</script>

<template>
  <div class="flex-col h-full">
    <JobTaskSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
    <div class="flex-1 overflow-hidden">
      <Table
        v-model:columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-selection="columnChecks"
        @change="getData"
      />
    </div>
    <JobTaskOperateDrawer v-model:open="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getData" />
    <JobTaskDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
    <JobTaskTriggerModal v-model:open="triggerVisible" :row-data="triggerData" />
  </div>
</template>

<style scoped></style>
