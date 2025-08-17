<script setup lang="tsx">
import { Button, Popconfirm, Tag, Table } from 'ant-design-vue';
import { ref } from 'vue';
import {
  fetchBatchDeleteRetryScene,
  fetchDeleteRetryScene,
  fetchGetRetryScenePageList,
  fetchUpdateSceneStatus
} from '@/service/api';
import { $t } from '@/locales';
import {
  DelayLevel,
  backOffRecord,
  blockStrategyRecord,
  groupConfigStatusRecord,
  routeKeyRecord
} from '@/constants/business';
const { hasAuth } = useAuth();

const appStore = useAppStore();

/** 详情页属性数据 */
const detailData = ref<Api.RetryScene.Scene | null>();
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

const { columns, columnChecks, data, getData, loading, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: fetchGetRetryScenePageList,
  apiParams: {
    page: 1,
    size: 10,
    groupName: null,
    sceneName: null,
    sceneStatus: null
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
      key: 'sceneName',
      title: $t('page.retry.scene.sceneName'),
      width: 200,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'groupName',
      title: $t('page.retry.scene.groupName'),
      width: 120
    },
    {
      key: 'routeKey',
      title: $t('page.retry.scene.routeKey'),
      width: 100,
      render: row => {
        const record = routeKeyRecord[row.routeKey];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'backOff',
      title: $t('page.retry.scene.backOff'),
      width: 100,
      render: row => {
        const record = backOffRecord[row.backOff];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'blockStrategy',
      title: $t('page.retry.scene.blockStrategy'),
      width: 100,
      render: row => {
        const record = blockStrategyRecord[row.blockStrategy];
        return <Tag color={record.color}>{record.label}</Tag>;
      }
    },
    {
      key: 'sceneStatus',
      title: $t('page.retry.scene.sceneStatus'),
      width: 100,
      render: row => {
        return <StatusSwitch v-model:value={row.sceneStatus} onUpdateValue={value => handleUpdateStatus(row, value)} />;
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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onDeleted, onBatchDeleted } =
  useTableOperate(data, getData);

function edit(id: string) {
  handleEdit(id);
}

async function handleDelete(id: string) {
  const { error } = await fetchDeleteRetryScene(id);
  if (error) return;
  onDeleted();
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteRetryScene(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

function triggerInterval(backOff: number, maxRetryCount: number) {
  if (backOff !== 1) {
    return '';
  }

  let desc = '';
  for (let i = 1; i <= maxRetryCount; i += 1) {
    desc += `,${DelayLevel[i as keyof typeof DelayLevel]}`;
  }
  return desc.substring(1, desc.length);
}

function body(): Api.RetryScene.ExportScene {
  return {
    sceneIds: checkedRowKeys.value,
    groupName: searchParams.groupName,
    sceneName: searchParams.sceneName,
    sceneStatus: searchParams.sceneStatus
  };
}

function handleExport() {
  downloadFetch('/scene-config/export', body(), $t('page.retryScene.title'));
}
</script>

<template>
  <div class="flex-col h-full">
    <SceneSearch v-model="searchParams" @reset="resetSearchParams" @search="getData" />
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
    <SceneOperateDrawer v-model:open="drawerVisible" :operate-type="operateType" :row-data="editingData" @submitted="getData" />
    <SceneDetailDrawer v-model:open="detailVisible" :row-data="detailData" />
  </div>
</template>

<style scoped></style>
