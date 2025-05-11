<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table, Tooltip, Dropdown, Card, Divider } from 'ant-design-vue';
import { onMounted, ref } from 'vue';
import { useBoolean } from '~/packages/hooks';
import {
  fetchBatchDeleteRetry,
  fetchExecuteRetry,
  fetchGetAllGroupNameList,
  fetchGetRetryById,
  fetchGetRetryList,
  fetchUpdateRetryStatus
} from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { retryStatusTypeRecord, retryTaskTypeRecord } from '@/constants/business';
import { tagColor } from '@/utils/common';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { useRouterPush } from '@/hooks/common/router';
import RetryTaskOperateDrawer from './modules/retry-operate-drawer.vue';
import RetryTaskBatchAddDrawer from './modules/retr-batch-add-drawer.vue';
import RetryTaskSearch from './modules/retry-search.vue';
import RetryTaskDetailDrawerVue from './modules/retry-detail-drawer.vue';

/** 详情页属性数据 */
const detailData = ref<Api.Retry.Retry | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);
const { routerPushByKey } = useRouterPush();

const appStore = useAppStore();
const retryStatus = history.state.retryStatus;

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetRetryList,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    sceneName: null,
    idempotentId: null,
    bizNo: null,
    retryStatus: null
  },
  searchParams: {
    retryStatus
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48,
      disabled: row => row.retryStatus === 0
    },
    {
      key: 'id',
      align: 'center',
      width: 128,
      fixed: 'left',
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
      title: $t('page.retry.groupName'),
      align: 'center',
      width: 180
    },
    {
      key: 'sceneName',
      title: $t('page.retry.sceneName'),
      align: 'center',
      width: 180
    },
    {
      key: 'nextTriggerAt',
      title: $t('page.retry.nextTriggerAt'),
      align: 'center',
      width: 120
    },
    {
      key: 'retryCount',
      title: $t('page.retry.retryCount'),
      align: 'center',
      width: 100
    },
    {
      key: 'retryStatus',
      title: $t('page.retry.retryStatus'),
      align: 'center',
      width: 120,
      render: row => {
        if (row.retryStatus === null) {
          return null;
        }
        const label = $t(retryStatusTypeRecord[row.retryStatus!]);

        return <Tag color={tagColor(row.retryStatus!)}>{label}</Tag>;
      }
    },
    {
      key: 'taskType',
      title: $t('page.retry.taskType'),
      align: 'center',
      width: 120,
      render: row => {
        if (row.taskType === null) {
          return null;
        }
        const tagMap: Record<Api.Retry.TaskType, string> = {
          1: 'orange',
          2: 'red'
        };
        const label = $t(retryTaskTypeRecord[row.taskType!]);

        return <Tag color={tagMap[row.taskType!]}>{label}</Tag>;
      }
    },
    {
      key: 'idempotentId',
      title: $t('page.retry.idempotentId'),
      align: 'center',
      width: 120
    },
    {
      key: 'bizNo',
      title: $t('page.retry.bizNo'),
      align: 'center',
      width: 120
    },
    {
      key: 'createDt',
      title: $t('page.retryTask.createDt'),
      align: 'center',
      width: 120
    },
    {
      key: 'updateDt',
      title: $t('page.retryTask.createDt'),
      align: 'center',
      width: 120
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      align: 'center',
      width: 120,
      fixed: 'right',
      render: row => {
        const items = [
          {
            key: 'execute',
            label: $t('common.execute'),
            disabled: row.retryStatus === 1 || row.retryStatus === 2,
            onClick: () => handleExecute(row.groupName!, row.id! as any)
          },
          {
            key: 'delete',
            label: $t('common.delete'),
            disabled: row.retryStatus === 1 || row.retryStatus === 2,
            onClick: () => handleDelete(row.id!)
          }
        ];

        return (
          <div class="flex-center gap-8px">
            <Button type="link" onClick={() => edit(row.id!)}>
              {$t('common.edit')}
            </Button>
            <Divider type="vertical" />
            <Dropdown menu={{ items }}>
              <Button type="link">
                {$t('common.more')}
              </Button>
            </Dropdown>
          </div>
        );
      }
    }
  ]
});

function goToRetryTask(retryId: string) {
  routerPushByKey('retry_task', { state: { retryId } });
}

const {
  drawerVisible,
  operateType,
  handleAdd,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted
  // closeDrawer
} = useTableOperate(data, getData);

const { bool: batchAddDrawerVisible, setTrue: openBatchAddDrawer } = useBoolean();

async function handleDelete(groupName: string, id: string) {
  const { error } = await fetchBatchDeleteRetry({ groupName, ids: [id] });
  if (error) return;
  onDeleted();
}

async function loadRetryInfo(row: Api.Retry.Retry) {
  const res = await fetchGetRetryById(row.id!, row.groupName!);
  detailData.value = (res.data as Api.Retry.Retry) || null;
}

async function handleBatchDelete() {
  const ids: string[] = checkedRowKeys.value as string[];
  if (ids.length === 0) return;
  const groupName = data.value[0].groupName;
  const { error } = await fetchBatchDeleteRetry({ groupName, ids });
  if (error) return;
  onBatchDeleted();
}

function handleBatchAdd() {
  openBatchAddDrawer();
}

function handleExecute(groupName: string, retryId: number) {
  fetchExecuteRetry({ groupName, retryIds: [retryId] });
}

function handleResume(id: number) {
  updateRetryTaskStatus(id, 0);
}

function handlePause(id: number) {
  updateRetryTaskStatus(id, 3);
}

function handleFinish(id: number) {
  updateRetryTaskStatus(id, 1);
}

async function updateRetryTaskStatus(id: number, status: Api.Retry.RetryStatusType) {
  const { error } = await fetchUpdateRetryStatus({ id, retryStatus: status });
  if (error) return;
  window.$message?.success($t('common.updateSuccess'));
  getData();
}

onMounted(async () => {
  const { error, data: groupList } = await fetchGetAllGroupNameList();
  if (!error && groupList.length > 0) {
    getData();
  }
});
</script>

<template>
  <div class="flex-col h-full">
    <RetryTaskSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
    <div class="flex-1 overflow-hidden">
      <Card
        :title="$t('page.retry.title')"
        :bordered="false"
        size="small"
      >
        <template #extra>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-delete="hasAuth('R_ADMIN')"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
        </template>
        <Table
          v-model:columns="columns"
          :data-source="data"
          :loading="loading"
          :pagination="mobilePagination"
          :row-selection="columnChecks"
          @change="getData"
        />
        <RetryTaskOperateDrawer
          v-model:open="drawerVisible"
          :operate-type="operateType"
          :row-data="editingData"
          @submitted="getData"
        />
        <RetryTaskDetailDrawerVue v-model:open="detailVisible" :row-data="detailData" />
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
