<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table, Card, Divider } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import {
  fetchBatchDeleteWorkflowBatch,
  fetchDeleteWorkflowBatch,
  fetchGetWorkflowBatchList,
  fetchStopWorkflowBatch
} from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { operationReasonRecord, taskBatchStatusRecord } from '@/constants/business';
import { monthRangeISO8601 } from '@/utils/common';
import WorkflowBatchSearch from './modules/workflow-batch-search.vue';

const router = useRouter();

const appStore = useAppStore();
const workflowId = history.state.workflowId;
const workflowName = history.state.workflowName;
const taskBatchStatus = history.state.taskBatchStatus;

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetWorkflowBatchList,
  apiParams: {
    page: 1,
    size: 10,
    workflowId: null,
    workflowName: null,
    groupName: null,
    taskBatchStatus: null,
    datetimeRange: monthRangeISO8601()
  },
  searchParams: {
    workflowId,
    workflowName,
    taskBatchStatus
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
      width: 120,
      align: 'center',
      render: row => {
        return (
          <Button type="link" onClick={() => detail(row.id!)}>
            {row.id}
          </Button>
        );
      }
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
      width: 120,
      render: row => {
        if (!row.taskBatchStatus) {
          return null;
        }

        const tagMap: Record<number, string> = {
          1: 'blue',
          2: 'green',
          3: 'green',
          4: 'red',
          5: 'orange',
          6: 'orange'
        };

        const label = $t(taskBatchStatusRecord[row.taskBatchStatus!]);
        return <Tag color={tagMap[row.taskBatchStatus]}>{label}</Tag>;
      }
    },
    {
      key: 'operationReason',
      title: $t('page.workflowBatch.operationReason'),
      width: 120,
      render: row => {
        if (!row.operationReason) {
          return null;
        }

        const label = $t(operationReasonRecord[row.operationReason!]);
        return <Tag color="orange">{label}</Tag>;
      }
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
      align: 'center',
      render: row => (
        <div class="flex-center gap-8px">
          {row?.taskBatchStatus === 1 || row?.taskBatchStatus === 2 ? (
            <>
              <Popconfirm
                title={$t('common.confirmStop')}
                onConfirm={() => handleStop(row.id!)}
              >
                <Button type="link" danger>
                  {$t('common.stop')}
                </Button>
              </Popconfirm>
              <Divider type="vertical" />
            </>
          ) : (
            ''
          )}
          <Popconfirm
            title={$t('common.deleteConfirm')}
            onConfirm={() => handleDelete(row.id!)}
          >
            <Button type="link" danger>
              {$t('common.delete')}
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ]
});

const {
  checkedRowKeys,
  onDeleted,
  onBatchDeleted
} = useTableOperate(data, getData);

async function handleDelete(id: string) {
  const { error } = await fetchDeleteWorkflowBatch(id);
  if (error) return;
  onDeleted();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWorkflowBatch(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleStop(id: string) {
  const { error } = await fetchStopWorkflowBatch(id);
  if (!error) {
    window.$message?.success($t('common.executeSuccess'));
    getData();
  }
}

function detail(id: string) {
  router.push({ path: '/workflow/form/batch', query: { id } });
}
</script>

<template>
  <div class="flex-col h-full">
    <WorkflowBatchSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
    <Card
      :title="$t('page.workflowBatch.title')"
      :bordered="false"
      size="small"
      class="flex-1 overflow-hidden"
    >
      <Table
        v-model:columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="mobilePagination"
        :row-selection="columnChecks"
        @change="getData"
      />
    </Card>
  </div>
</template>

<style scoped></style>
