<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table, Dropdown, Divider } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { $t } from '@/locales';
import { triggerTypeRecord } from '@/constants/business';
import { tagColor } from '@/utils/common';

const { hasAuth } = useAuth();

const router = useRouter();
const appStore = useAppStore();
const { routerPushByKey } = useRouterPush();

const triggerData = ref<Api.Workflow.Workflow | null>();
const { bool: triggerVisible, setTrue: openTriggerModal } = useBoolean(false);

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetWorkflowPageList,
  apiParams: {
    page: 1,
    size: 10,
    workflowName: null,
    groupName: null,
    workflowStatus: null
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
      align: 'center'
    },
    {
      key: 'workflowName',
      title: $t('page.workflow.workflowName'),
      width: 200,
      ellipsis: {
        tooltip: true
      },
      render: row => {
        return (
          <Button type="link" onClick={() => detail(row.id!)}>
            {row.workflowName}
          </Button>
        );
      }
    },
    {
      key: 'groupName',
      title: $t('page.workflow.groupName'),
      width: 120
    },
    {
      key: 'nextTriggerAt',
      title: $t('page.workflow.nextTriggerAt'),
      width: 120
    },
    {
      key: 'workflowStatus',
      title: $t('page.workflow.workflowStatus'),
      width: 120,
      render: row => {
        return <StatusSwitch v-model:value={row.workflowStatus} onUpdateValue={value => handleUpdateStatus(row, value)} />;
      }
    },
    {
      key: 'triggerType',
      title: $t('page.workflow.triggerType'),
      width: 120,
      render: row => {
        if (!row.triggerType) {
          return null;
        }
        const record = triggerTypeRecord[row.triggerType];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'triggerInterval',
      title: $t('page.workflow.triggerInterval'),
      width: 120
    },
    {
      key: 'executorTimeout',
      title: $t('page.workflow.executorTimeout'),
      width: 120
    },
    {
      key: 'updateDt',
      title: $t('page.workflow.updateDt'),
      width: 120
    },
    {
      key: 'operation',
      title: $t('common.operation'),
      width: 200,
      align: 'center',
      render: row => {
        const items = [
          {
            key: 'copy',
            label: $t('common.copy'),
            onClick: () => copy(row.id!)
          },
          {
            type: 'divider'
          },
          {
            key: 'batchList',
            label: $t('common.batchList'),
            onClick: () => goToBatch(row.id!)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            label: (
              <Popconfirm
                title={$t('common.deleteConfirm')}
                onConfirm={() => handleDelete(row.id!)}
              >
                <Button type="link" danger>
                  {$t('common.delete')}
                </Button>
              </Popconfirm>
            )
          }
        ];

        return (
          <div class="flex-center gap-8px">
            <Button type="link" onClick={() => edit(row.id!)}>
              {$t('common.edit')}
            </Button>
            <Divider type="vertical" />
            <Button type="link" danger onClick={() => execute(row)}>
              {$t('common.execute')}
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

const {
  checkedRowKeys,
  onBatchDeleted,
  onDeleted
  // closeDrawer
} = useTableOperate(data, getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteWorkflow(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: string) {
  // request
  const { error } = await fetchBatchDeleteWorkflow([id!]);
  if (error) return;
  onDeleted();
}

function edit(id: string) {
  router.push({ path: '/workflow/form/edit', query: { id } });
}

function handleAdd() {
  router.push({ path: '/workflow/form/add' });
}

function detail(id: string) {
  router.push({ path: '/workflow/form/detail', query: { id } });
}

function copy(id: string) {
  router.push({ path: '/workflow/form/copy', query: { id } });
}

// function batch(id: string) {
//   router.push({ path: '/workflow/batch', state: { workflowId: id } });
// }

async function execute(row: Api.Workflow.Workflow) {
  triggerData.value = row;
  openTriggerModal();
}

function body(): Api.Workflow.ExportWorkflow {
  return {
    workflowIds: checkedRowKeys.value,
    groupName: searchParams.groupName,
    workflowName: searchParams.workflowName,
    workflowStatus: searchParams.workflowStatus
  };
}

function handleExport() {
  downloadFetch('/workflow/export', body(), $t('page.workflow.title'));
}
function goToBatch(workflowId: string) {
  const findItem = data.value.find(item => item.id === workflowId)!;
  routerPushByKey('workflow_batch', { state: { workflowId, workflowName: findItem.workflowName } });
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <WorkflowSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getData" />
    <DeleteAlert />
    <NCard
      :title="$t('page.workflow.title')"
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
        >
          <template #addAfter>
            <FileUpload action="/workflow/import" accept="application/json" @refresh="getData" />
            <Popconfirm @positive-click="handleExport">
              <template #trigger>
                <NButton size="small" ghost type="primary" :disabled="checkedRowKeys.length === 0 && hasAuth('R_USER')">
                  <template #icon>
                    <IconPajamasExport class="text-icon" />
                  </template>
                  {{ $t('common.export') }}
                </NButton>
              </template>
              <template #default>
                {{
                  checkedRowKeys.length === 0
                    ? $t('common.exportAll')
                    : $t('common.exportPar', { num: checkedRowKeys.length })
                }}
              </template>
            </Popconfirm>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :flex-height="!appStore.isMobile"
        :scroll-x="1300"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
    <WorkflowTriggerModal v-model:open="triggerVisible" :row-data="triggerData" />
  </div>
</template>

<style scoped></style>
