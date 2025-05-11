<script setup lang="tsx">
import { Button, Popconfirm, Table, Card, Divider } from 'ant-design-vue';
import { onMounted, ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import {
  fetchDeleteRetryDeadLetter,
  fetchGetAllGroupNameList,
  fetchGetRetryDeadLetterById,
  fetchGetRetryDeadLetterPageList,
  fetchRollbackRetryDeadLetter
} from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { monthRangeISO8601 } from '@/utils/common';
import RetryDeadLetterSearch from './modules/dead-letter-search.vue';
import RetryDeadLetterDetailDrawer from './modules/retry-letter-detail-drawer.vue';

const appStore = useAppStore();

/** 详情页属性数据 */
const detailData = ref<Api.RetryDeadLetter.DeadLetter | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetRetryDeadLetterPageList,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    sceneName: null,
    datetimeRange: monthRangeISO8601()
    // if you want to use the searchParams in Form, you need to define the following properties, and the value is null
    // the value can not be undefined, otherwise the property in Form will not be reactive
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
      align: 'center',
      width: 120,
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
      title: $t('page.retryDeadLetter.groupName'),
      align: 'center',
      width: 120
    },
    {
      key: 'sceneName',
      title: $t('page.retryDeadLetter.sceneName'),
      align: 'center',
      width: 120
    },
    {
      key: 'idempotentId',
      title: $t('page.retryDeadLetter.idempotentId'),
      align: 'center',
      width: 120
    },
    {
      key: 'bizNo',
      title: $t('page.retryDeadLetter.bizNo'),
      align: 'center',
      width: 120
    },
    {
      key: 'createDt',
      title: $t('page.retryDeadLetter.createDt'),
      align: 'center',
      width: 120
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      align: 'center',
      width: 130,
      render: row => (
        <div class="flex-center gap-8px">
          <Popconfirm
            title={$t('common.confirmRollback')}
            onConfirm={() => rollback(row)}
          >
            <Button type="link">
              {$t('common.rollback')}
            </Button>
          </Popconfirm>
          <Divider type="vertical" />
          <Popconfirm
            title={$t('common.deleteConfirm')}
            onConfirm={() => handleDelete(row)}
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

const { handleAdd, checkedRowKeys, onDeleted, onBatchDeleted } = useTableOperate(data, getData);

async function handleBatchDelete() {
  // request
  const { error } = await fetchDeleteRetryDeadLetter({
    ids: checkedRowKeys.value as any[],
    groupName: searchParams.groupName!
  });
  if (error) return;
  if (error) return;
  onBatchDeleted();
}

async function handleBatchRollback() {
  // request
  const { error } = await fetchRollbackRetryDeadLetter({
    ids: checkedRowKeys.value as any[]
  });
  if (error) return;
  window.$message?.success($t('common.rollbackSuccess'));
  getData();
}

async function handleDelete(row: Api.RetryDeadLetter.DeadLetter) {
  const { error } = await fetchDeleteRetryDeadLetter({ ids: [row.id!], groupName: row.groupName! });
  if (error) return;
  onDeleted();
}

async function loadRetryInfo(row: Api.RetryDeadLetter.DeadLetter) {
  const res = await fetchGetRetryDeadLetterById(row.id!, row.groupName!);
  detailData.value = (res.data as Api.RetryDeadLetter.DeadLetter) || null;
}

async function rollback(row: Api.RetryDeadLetter.DeadLetter) {
  const { error } = await fetchRollbackRetryDeadLetter({ ids: [row.id!], groupName: row.groupName! });
  if (error) return;
  window.$message?.success($t('common.rollbackSuccess'));
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
    <RetryDeadLetterSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
    <div class="flex-1 overflow-hidden">
      <Card
        :title="$t('page.retryDeadLetter.title')"
        :bordered="false"
        size="small"
      >
        <template #extra>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="false"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          >
            <template #addAfter>
              <Popconfirm
                :title="$t('common.confirmRollback')"
                @confirm="handleBatchRollback"
              >
                <Button
                  type="primary"
                  ghost
                  :disabled="checkedRowKeys.length === 0"
                >
                  <template #icon>
                    <IconTdesignRollback class="text-icon" />
                  </template>
                  {{ $t('common.rollback') }}
                </Button>
              </Popconfirm>
            </template>
          </TableHeaderOperation>
        </template>
        <Table
          v-model:columns="columns"
          :data-source="data"
          :loading="loading"
          :pagination="mobilePagination"
          :row-selection="columnChecks"
          @change="getData"
        />
        <RetryDeadLetterDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
