<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table, Card, Divider } from 'ant-design-vue';
import { ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchDeleteNotifyRecipient, fetchGetNotifyRecipientPageList } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { alarmTypeRecord } from '@/constants/business';
import { tagColor } from '@/utils/common';
import { useAuth } from '@/hooks/business/auth';
import { downloadFetch } from '@/utils/download';
import NotifyRecipientOperateDrawer from './modules/notify-recipient-operate-drawer.vue';
import NotifyRecipientSearch from './modules/notify-recipient-search.vue';
import NotifyRecipientDetailDrawer from './modules/notify-recipient-detail-drawer.vue';
const { hasAuth } = useAuth();

const appStore = useAppStore();

/** 详情页属性数据 */
const detailData = ref<Api.NotifyRecipient.NotifyRecipient | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetNotifyRecipientPageList,
  apiParams: {
    page: 1,
    size: 10,
    recipientName: null,
    notifyType: null
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
      width: 64
    },
    {
      key: 'recipientName',
      title: $t('page.notifyRecipient.recipientName'),
      align: 'left',
      width: 120,
      render: row => {
        return (
          <Button type="link" onClick={() => {
            detailData.value = row || null;
            openDetail();
          }}>
            {row.recipientName}
          </Button>
        );
      }
    },
    {
      key: 'notifyType',
      title: $t('page.notifyRecipient.notifyType'),
      align: 'left',
      width: 120,
      render: row => {
        const label = $t(alarmTypeRecord[row.notifyType!]);
        return <Tag color={tagColor(row.notifyType)}>{label}</Tag>;
      }
    },
    {
      key: 'description',
      title: $t('page.notifyRecipient.description'),
      align: 'left',
      width: 120
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      align: 'center',
      width: 130,
      render: row => (
        <div class="flex-center gap-8px">
          <Button type="link" onClick={() => edit(row.id!)}>
            {$t('common.edit')}
          </Button>
          {hasAuth('R_ADMIN') ? (
            <Popconfirm
              title={$t('common.deleteConfirm')}
              onConfirm={() => handleDelete(row.id!)}
            >
              <Button type="link" danger>
                {$t('common.delete')}
              </Button>
            </Popconfirm>
          ) : null}
        </div>
      )
    }
  ]
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted
  // closeDrawer
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  const { error } = await fetchDeleteNotifyRecipient(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: string) {
  // request
  const { error } = await fetchDeleteNotifyRecipient([id]);
  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    getData();
  }
}

function edit(id: string) {
  handleEdit(id);
}

function body(): Api.NotifyRecipient.ExportNotifyRecipient {
  return {
    notifyRecipientIds: checkedRowKeys.value,
    notifyType: searchParams.notifyType,
    recipientName: searchParams.recipientName
  };
}

function handleExport() {
  downloadFetch('/notify-recipient/export', body(), $t('page.notifyRecipient.title'));
}
</script>

<template>
  <div class="flex-col h-full">
    <NotifyRecipientSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
    <div class="flex-1 overflow-hidden">
      <Card
        :title="$t('page.notifyRecipient.title')"
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
          >
            <template #addAfter>
              <FileUpload action="/notify-recipient/import" accept="application/json" @refresh="getData" />
              <Popconfirm
                :title="checkedRowKeys.length === 0 ? $t('common.exportAll') : $t('common.exportPar', { num: checkedRowKeys.length })"
                @confirm="handleExport"
              >
                <Button
                  type="primary"
                  ghost
                  :disabled="checkedRowKeys.length === 0 && hasAuth('R_USER')"
                >
                  <template #icon>
                    <IconPajamasExport class="text-icon" />
                  </template>
                  {{ $t('common.export') }}
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
        <NotifyRecipientOperateDrawer
          v-model:open="drawerVisible"
          :operate-type="operateType"
          :row-data="editingData"
          @submitted="getData"
        />
        <NotifyRecipientDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
