<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table, Typography, Divider } from 'ant-design-vue';
import { ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchBatchDeleteNotify, fetchGetNotifyConfigList, fetchUpdateNotifyStatus } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import NotifyConfigOperateDrawer from '@/views/notify/config/modules/notify-config-operate-drawer.vue';
import NotifyConfigSearch from '@/views/notify/config/modules/notify-config-search.vue';
import NotifyConfigDetailDrawer from '@/views/notify/config/modules/notify-config-detail-drawer.vue';
import StatusSwitch from '@/components/common/status-switch.vue';
import { jobNotifyScene, retryNotifyScene, systemTaskType, workflowNotifyScene } from '@/constants/business';
import { tagColor } from '@/utils/common';
import { useAuth } from '@/hooks/business/auth';
const { hasAuth } = useAuth();

const appStore = useAppStore();

/** 详情页属性数据 */
const detailData = ref<Api.NotifyConfig.NotifyConfig | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetNotifyConfigList,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    notifyStatus: null,
    notifyScene: null,
    notifyName: null,
    systemTaskType: null
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
      key: 'notifyName',
      title: $t('page.notifyConfig.notifyName'),
      align: 'left',
      width: 120,
      render: row => {
        return (
          <Button type="link" onClick={() => {
            detailData.value = row || null;
            openDetail();
          }}>
            {row.notifyName}
          </Button>
        );
      }
    },
    {
      key: 'groupName',
      title: $t('page.notifyConfig.groupName'),
      align: 'left',
      width: 120
    },
    {
      key: 'systemTaskType',
      title: $t('page.notifyConfig.systemTaskType'),
      align: 'left',
      width: 120,
      render: row => {
        if (row.systemTaskType === null) {
          return null;
        }

        const label = $t(systemTaskType[row.systemTaskType!]);

        return <Tag color={tagColor(row.systemTaskType!)}>{label}</Tag>;
      }
    },
    {
      key: 'notifyStatus',
      title: $t('page.notifyConfig.notifyStatus'),
      align: 'left',
      width: 120,
      render: row => {
        const fetchFn = async (notifyStatus: Api.Common.EnableStatusNumber, callback: (flag: boolean) => void) => {
          const { error } = await fetchUpdateNotifyStatus(row.id!, notifyStatus);
          if (!error) {
            row.notifyStatus = notifyStatus;
            window.$message?.success($t('common.updateSuccess'));
          }
          callback(!error);
        };

        return <StatusSwitch v-model:value={row.notifyStatus} onSubmitted={fetchFn} />;
      }
    },
    {
      key: 'notifyName',
      title: $t('page.notifyConfig.notifyName'),
      align: 'left',
      width: 120
    },
    {
      key: 'notifyScene',
      title: $t('page.notifyConfig.notifyScene'),
      align: 'left',
      width: 160,
      render: row => {
        if (row.notifyScene === null) {
          return null;
        }

        if (row.systemTaskType === 1) {
          const label = $t(retryNotifyScene[row.notifyScene! as Api.NotifyConfig.RetryNotifyScene]);
          return (
            <Tag color={tagColor(row.notifyScene)}>
              <Typography.Text ellipsis style={{ width: '136px' }}>{label}</Typography.Text>
            </Tag>
          );
        }

        if (row.systemTaskType === 3) {
          const label = $t(jobNotifyScene[row.notifyScene! as Api.NotifyConfig.JobNotifyScene]);
          return (
            <Tag color={tagColor(row.notifyScene)}>
              <Typography.Text ellipsis style={{ width: '136px' }}>{label}</Typography.Text>
            </Tag>
          );
        }

        if (row.systemTaskType === 4) {
          const label = $t(workflowNotifyScene[row.notifyScene! as Api.NotifyConfig.WorkflowNotifyScene]);
          return (
            <Tag color={tagColor(row.notifyScene)}>
              <Typography.Text ellipsis style={{ width: '136px' }}>{label}</Typography.Text>
            </Tag>
          );
        }

        return null;
      }
    },
    {
      key: 'notifyThreshold',
      title: $t('page.notifyConfig.notifyThreshold'),
      align: 'left',
      width: 120
    },
    {
      key: 'createDt',
      title: $t('common.createDt'),
      align: 'left',
      width: 120
    },
    {
      key: 'description',
      title: $t('page.notifyConfig.description'),
      align: 'left',
      width: 120
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      align: 'center',
      width: 130,
      fixed: 'right',
      render: row => (
        <div class="flex-center gap-8px">
          <Button type="link" onClick={() => edit(row.id!)}>
            {$t('common.edit')}
          </Button>
          {hasAuth('R_ADMIN') ? (
            <>
              <Divider type="vertical" />
              <Popconfirm
                title={$t('common.deleteConfirm')}
                onConfirm={() => handleDelete(row.id!)}
              >
                <Button type="link" danger>
                  {$t('common.delete')}
                </Button>
              </Popconfirm>
            </>
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
  const { error } = await fetchBatchDeleteNotify(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: string) {
  // request
  const { error } = await fetchBatchDeleteNotify([id]);
  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    getData();
  }
}

function edit(id: string) {
  handleEdit(id);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NotifyConfigSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getData" />
    <DeleteAlert />
    <NCard
      :title="$t('page.notifyConfig.title')"
      :bordered="false"
      size="small"
      class="sm:flex-1-hidden card-wrapper"
      header-class="view-card-header"
    >
      <template #header-extra>
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
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <NotifyConfigOperateDrawer
        v-model:open="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
      <NotifyConfigDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
    </NCard>
  </div>
</template>

<style scoped></style>
