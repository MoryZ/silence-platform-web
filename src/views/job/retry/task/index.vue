<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table, Tooltip, Divider } from 'ant-design-vue';
import { ref } from 'vue';
import { useBoolean } from '~/packages/hooks';
import {
  fetchBatchDeleteRetryTask,
  fetchDeleteRetryTask,
  fetchRetryTaskById,
  fetchRetryTaskPageList,
  fetchStopRetryTask
} from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { retryOperationReasonRecord, retryTaskStatusTypeRecord, retryTaskTypeRecord } from '@/constants/business';
import { monthRangeISO8601, tagColor } from '@/utils/common';
import SvgIcon from '@/components/custom/svg-icon.vue';
import RetryLogSearch from './modules/retry-task-search.vue';
import RetryLogDetailDrawer from './modules/retry-task-detail-drawer.vue';

const appStore = useAppStore();

/** 详情页属性数据 */
const detailData = ref<Api.RetryTask.RetryTask | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);
const retryId = history.state.retryId;

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchRetryTaskPageList,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    sceneName: null,
    taskStatus: null,
    datetimeRange: monthRangeISO8601()
  },
  searchParams: {
    retryId
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
      disabled: row => row.taskStatus === 1
    },
    {
      key: 'id',
      width: 120,
      fixed: 'left',
      align: 'center',
      title: () => {
        return (
          <div class="flex-center">
            <span>{$t('page.jobBatch.jobTask.id')}</span>
            <Tooltip title={$t('common.idDetailTip')}>
              <span class="mb-2px ml-5px text-16px">
                <SvgIcon icon="ant-design:info-circle-outlined" />
              </span>
            </Tooltip>
          </div>
        );
      },
      render: row => {
        return (
          <Button type="link" onClick={async () => {
            await loadRetryInfo(row);
            openDetail();
          }}>
            {row.id}
          </Button>
        );
      }
    },
    {
      key: 'groupName',
      title: $t('page.retryTask.groupName'),
      width: 120,
      align: 'center'
    },
    {
      key: 'sceneName',
      title: $t('page.retryTask.sceneName'),
      width: 120,
      align: 'center'
    },
    {
      key: 'retryId',
      title: $t('page.retryTask.retryId'),
      width: 120,
      align: 'center'
    },
    {
      key: 'taskType',
      title: $t('page.retryTask.taskType'),
      width: 80,
      align: 'center',
      render: row => {
        if (row.taskType === null) {
          return null;
        }
        const label = $t(retryTaskTypeRecord[row.taskType!]);
        return <Tag color={tagColor(row.taskType!)}>{label}</Tag>;
      }
    },
    {
      key: 'taskStatus',
      title: $t('page.retryTask.taskStatus'),
      width: 80,
      align: 'center',
      render: row => {
        if (row.taskStatus === null) {
          return null;
        }
        const tagMap: Record<number, string> = {
          1: 'blue',
          2: 'blue',
          3: 'blue',
          4: 'red',
          5: 'red',
          6: 'red'
        };

        const label = $t(retryTaskStatusTypeRecord[row.taskStatus!]);
        return <Tag color={tagMap[row.taskStatus!]}>{label}</Tag>;
      }
    },
    {
      key: 'operationReason',
      title: $t('page.retryTask.operationReason'),
      width: 240,
      align: 'center',
      render: row => {
        if (row.operationReason === null) {
          return null;
        }
        const label = $t(retryOperationReasonRecord[row.operationReason!]);
        return <Tag color={tagColor(row.operationReason!)}>{label}</Tag>;
      }
    },
    {
      key: 'createDt',
      title: $t('page.retryTask.createDt'),
      width: 120,
      align: 'center'
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      width: 80,
      align: 'center',
      render: row => {
        const stopBtn = () => {
          if (row.taskStatus === 1 || row.taskStatus === 2) {
            return (
              <>
                <Divider type="vertical" />
                <Popconfirm
                  title={$t('common.confirmStop')}
                  onConfirm={() => handleStopRetry(row.id!)}
                >
                  <Button type="link" danger>
                    {$t('common.stop')}
                  </Button>
                </Popconfirm>
                <Divider type="vertical" />
              </>
            );
          }
          return null;
        };
        return (
          <div class="flex-center gap-8px">
            {stopBtn()}
            {row.taskStatus !== 1 && row.taskStatus !== 2 ? (
              <Popconfirm
                title={$t('common.deleteConfirm')}
                onConfirm={() => handleDelete(row.id)}
              >
                <Button type="link" danger>
                  {$t('common.delete')}
                </Button>
              </Popconfirm>
            ) : null}
          </div>
        );
      }
    }
  ]
});

const { checkedRowKeys, onDeleted, onBatchDeleted } = useTableOperate(data, getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteRetryTask(checkedRowKeys.value as any[]);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: any) {
  const { error } = await fetchDeleteRetryTask(id);
  if (error) return;
  onDeleted();
}

async function loadRetryInfo(row: Api.RetryTask.RetryTask) {
  const res = await fetchRetryTaskById(row.id!);
  detailData.value = (res.data as Api.RetryTask.RetryTask) || null;
}

async function handleStopRetry(id: string) {
  const { error } = await fetchStopRetryTask(id! as any);
  if (!error) {
    window.$message?.success($t('common.operateSuccess'));
    getData();
  }
}
</script>

<template>
  <div class="flex-col h-full">
    <RetryLogSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
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
    <RetryLogDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
  </div>
</template>

<style scoped></style>
