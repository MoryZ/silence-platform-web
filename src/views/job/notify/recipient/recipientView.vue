<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { fetchDeleteNotifyRecipient, fetchGetNotifyRecipientPageList, NotifyRecipient, NotifyRecipientParams } from '@/api/job/notify-recipients';
import { $t } from '@/locales';
import { alarmTypeRecord } from '@/constants/business';
// 下载功能（简化版本）
const downloadFile = (url: string, data: any, filename: string) => {
  // 这里应该实现实际的下载逻辑
  console.log('Download:', url, data, filename);
  message.info('导出功能待实现');
};
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';
import NotifyRecipientOperateDrawer from './modules/notify-recipient-operate-drawer.vue';
import NotifyRecipientDetailDrawer from './modules/notify-recipient-detail-drawer.vue';


// 权限检查函数（简化版本）
const hasAuth = (permission: string): boolean => {
  return true;
};

// 布尔状态管理（简化版本）
const useBoolean = (initialValue: boolean) => {
  const bool = ref(initialValue);
  const setTrue = () => { bool.value = true; };
  const setFalse = () => { bool.value = false; };
  return { bool, setTrue, setFalse };
};

// 搜索表单配置
const searchForm = ref<NotifyRecipientParams>({
  pageNo: 1,
  pageSize: 10,
  sort: '-createdDate',
  recipientName: null,
  notifyType: null
});

// 搜索字段配置
const searchFields = [
  { 
    key: 'recipientName', 
    type: 'input' as const, 
    label: $t('page.notifyRecipient.recipientName'), 
    placeholder: $t('page.notifyRecipient.form.recipientName') 
  },
  { 
    key: 'notifyType', 
    type: 'select' as const, 
    label: $t('page.notifyRecipient.notifyType'), 
    placeholder: $t('page.notifyRecipient.notifyType'),
    options: [
      { label: $t(alarmTypeRecord[1]), value: '1' },
      { label: $t(alarmTypeRecord[2]), value: '2' },
      { label: $t(alarmTypeRecord[3]), value: '3' },
      { label: $t(alarmTypeRecord[4]), value: '4' },
      { label: $t(alarmTypeRecord[5]), value: '5' }
    ]
  }
];

// 表格列配置
const tableColumns = [
  { title: $t('common.index'), dataIndex: 'id', key: 'id', width: 64, align: 'center' },
  { 
    title: $t('page.notifyRecipient.recipientName'), 
    dataIndex: 'recipientName', 
    key: 'recipientName', 
    width: 120,
    clickable: true
  },
  { 
    title: $t('page.notifyRecipient.notifyType'), 
    dataIndex: 'notifyType', 
    key: 'notifyType', 
    width: 120,
    type: 'enum',
    enumMap: {
      1: { label: $t(alarmTypeRecord[1]), color: 'blue' },
      2: { label: $t(alarmTypeRecord[2]), color: 'green' },
      3: { label: $t(alarmTypeRecord[3]), color: 'orange' },
      4: { label: $t(alarmTypeRecord[4]), color: 'red' },
      5: { label: $t(alarmTypeRecord[5]), color: 'purple' }
    }
  },
  { title: $t('page.notifyRecipient.description'), dataIndex: 'description', key: 'description', width: 120 },
  { title: $t('common.operation'), key: 'operation', width: 130, fixed: 'right', align: 'center' }
];

// 列可见性状态管理
const visibleColumns = ref<string[]>(tableColumns.map(col => col.key));
const defaultVisibleColumns = ref<string[]>(tableColumns.map(col => col.key));

// 计算可见的列
const visibleTableColumns = computed(() => {
  return tableColumns.filter(col => visibleColumns.value.includes(col.key));
});

// 数据管理
const data = ref<NotifyRecipient[]>([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const selectedRowKeys = ref<string[]>([]);

const getData = async () => {
  loading.value = true;
  try {
    const params: NotifyRecipientParams = {
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      sort: '-createdDate',
      recipientName: searchForm.value.recipientName,
      notifyType: searchForm.value.notifyType
    };
    const response = await fetchGetNotifyRecipientPageList(params);
    data.value = response.data || [];
    pagination.total = response.total || 0;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    data.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const resetSearchParams = () => {
  searchForm.value = {
    pageNo: 1,
    pageSize: 10,
    sort: '-createdDate',
    recipientName: null,
    notifyType: null
  };
};

/** 详情页属性数据 */
const detailData = ref<NotifyRecipient | null>(null);
/** 详情页可见状态 */
const { bool: detailVisible, setTrue: openDetail } = useBoolean(false);

const handleSearchFormUpdate = (newForm: any) => {
  searchForm.value = { ...searchForm.value, ...newForm }
}

// 事件处理函数
const handleSearch = () => {
  pagination.current = 1;
  getData();
};

const handleReset = () => {
  resetSearchParams();
  handleSearch();
};

const handlePageChange = (pageNo: number, pageSize: number) => {
  pagination.current = pageNo;
  pagination.pageSize = pageSize;
  getData();
};

const handleCellClick = (record: NotifyRecipient, column: any) => {
  if (column.key === 'recipientName') {
    detailData.value = record;
    openDetail();
  }
};

// 表格操作相关状态
const drawerVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<NotifyRecipient | null>(null);

// 表格操作函数
const handleAdd = () => {
  operateType.value = 'add';
  editingData.value = null;
  drawerVisible.value = true;
};

const handleEdit = (id: string) => {
  operateType.value = 'edit';
  editingData.value = data.value.find((item: NotifyRecipient) => item.id === id) || null;
  drawerVisible.value = true;
};

const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('common.pleaseSelectData'));
    return;
  }
  
  try {
    await fetchDeleteNotifyRecipient(selectedRowKeys.value);
    selectedRowKeys.value = [];
    message.success($t('common.deleteSuccess'));
    getData();
  } catch (error) {
    console.error('Failed to batch delete:', error);
    message.error($t('common.deleteFailed'));
  }
};

const handleDelete = async (id: string) => {
  try {
    await fetchDeleteNotifyRecipient([id]);
    message.success($t('common.deleteSuccess'));
    getData();
  } catch (error) {
    console.error('Failed to delete:', error);
    message.error($t('common.deleteFailed'));
  }
};

// 导出功能
const handleExport = () => {
  const body = {
    notifyRecipientIds: selectedRowKeys.value,
    notifyType: searchForm.value.notifyType,
    recipientName: searchForm.value.recipientName
  };
  downloadFile('/notify-recipient/export', body, $t('page.notifyRecipient.title'));
};

// 初始化数据
getData();
</script>

<template>
  <div class="notify-recipient-page">
    <a-card :bordered="false">
      <!-- 搜索面板 -->
      <SearchPanel
        :model-value="searchForm"
        @update:model-value="handleSearchFormUpdate"
        :fields="searchFields"
        @search="handleSearch"
        @reset="handleReset"
      />
      
      <!-- 操作工具栏 -->
      <div class="table-toolbar">
        <a-button type="primary" style="margin-right: 8px;" @click="handleAdd">
          {{ $t('common.add') }}
        </a-button>
        <a-button 
          danger 
          style="margin-right: 8px;"
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
          v-if="hasAuth('R_ADMIN')"
        >
          {{ $t('common.batchDelete') }}
        </a-button>
        <a-button style="margin-right: 8px;" @click="getData">
          {{ $t('common.refresh') }}
        </a-button>
        <a-popconfirm
          :title="selectedRowKeys.length === 0 ? $t('common.exportAll') : $t('common.exportPar', { num: selectedRowKeys.length })"
          @confirm="handleExport"
        >
          <a-button type="primary" ghost :disabled="selectedRowKeys.length === 0 && hasAuth('R_USER')">
            {{ $t('common.export') }}
          </a-button>
        </a-popconfirm>
        <ColumnSettings
          v-model="visibleColumns"
          :columns="tableColumns"
          :default-keys="defaultVisibleColumns"
          @update:columns="(cols) => { tableColumns.splice(0, tableColumns.length, ...cols); }"
        />
      </div>
      
      <!-- 表格 -->
      <CommonPagination
        title="通知接收者列表"
        :columns="visibleTableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :row-selection="{ selectedRowKeys, onChange: (keys: string[]) => selectedRowKeys = keys }"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:pageNo="val => { pagination.current = val; getData(); }"
        @update:pageSize="val => { pagination.pageSize = val; pagination.current = 1; getData(); }"
        @change="handlePageChange"
        @cell-click="handleCellClick"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <a-space>
              <a-button type="link" @click="handleEdit(record.id)">
                {{ $t('common.edit') }}
              </a-button>
              <a-divider type="vertical" v-if="hasAuth('R_ADMIN')" />
              <a-popconfirm
                v-if="hasAuth('R_ADMIN')"
                :title="$t('common.deleteConfirm')"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger>
                  {{ $t('common.delete') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </CommonPagination>
      
      <!-- 操作抽屉 -->
      <NotifyRecipientOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
      
      <!-- 详情抽屉 -->
      <NotifyRecipientDetailDrawer 
        v-model:visible="detailVisible" 
        :row-data="detailData" 
      />
    </a-card>
  </div>
</template>

<style scoped>
.notify-recipient-page {
  padding: 16px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
</style>
