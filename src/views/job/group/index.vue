<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table } from 'ant-design-vue';
import { ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchDeleteGroup, fetchGetGroupConfigList, fetchUpdateGroupStatus } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { yesOrNoRecord } from '@/constants/business';
import { tagColor } from '@/utils/common';
import StatusSwitch from '@/components/common/status-switch.vue';
import { useAuth } from '@/hooks/business/auth';
import { downloadFetch } from '@/utils/download';
import GroupOperateDrawer from './modules/group-operate-drawer.vue';
import GroupDetailDrawer from './modules/group-detail-drawer.vue';
import GroupSearch from './modules/group-search.vue';
const { hasAuth } = useAuth();
const appStore = useAppStore();

/** 详情页属性数据 */
const detailData = ref<Api.GroupConfig.GroupConfig | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetGroupConfigList,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    groupStatus: null
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
      key: 'groupName',
      title: $t('page.groupConfig.groupName'),
      width: 200,
      ellipsis: {
        tooltip: true
      },
      render: row => {
        return (
          <Button type="link" onClick={() => handleDetail(row)}>
            {row.groupName}
          </Button>
        );
      }
    },
    {
      key: 'groupStatus',
      title: $t('page.groupConfig.groupStatus'),
      width: 100,
      render: row => {
        return <StatusSwitch v-model:value={row.groupStatus} onUpdateValue={value => handleUpdateStatus(row, value)} />;
      }
    },
    {
      key: 'isAuto',
      title: $t('page.groupConfig.isAuto'),
      width: 100,
      render: row => {
        const record = yesOrNoRecord[row.isAuto];
        return <Tag color={record.color}>{record.label}</Tag>;
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
  checkedRowKeys,
  onDeleted
  // closeDrawer
} = useTableOperate(data, getData);

function edit(id: string) {
  handleEdit(id);
}

async function handleDelete(groupName: string) {
  const { error } = await fetchDeleteGroup(groupName);
  if (error) return;
  onDeleted();
}

function body(): Api.GroupConfig.ExportGroupConfig {
  return {
    groupName: searchParams.groupName,
    groupStatus: searchParams.groupStatus,
    groupIds: checkedRowKeys.value
  };
}

function handleExport() {
  downloadFetch('/group/export', body(), $t('page.groupConfig.title'));
}
</script>

<template>
  <div class="flex-col h-full">
    <GroupSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
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
    <GroupOperateDrawer v-model:open="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getData" />
    <GroupDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
  </div>
</template>

<style scoped></style>
