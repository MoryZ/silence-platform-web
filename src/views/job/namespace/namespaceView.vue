<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import {
  getNamespaces,
  createNamespace,
  updateNamespace
} from '@/api/job/namespace';
import type { NameSpace } from '@/types/job';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '@/utils/common';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';

const drawerVisible = ref(false);
const editingData = ref<Partial<NameSpace> | null>(null);
const isEdit = ref(false);
const loading = ref(false);
const data = ref<NameSpace[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const searchForm = ref({ name: '', uniqueId: '' });
const fields = [
  { key: 'name', type: 'input' as const, label: '名称', placeholder: '请输入空间名称' },
  { key: 'uniqueId', type: 'input' as const, label: '唯一标识', placeholder: '请输入唯一标识' }
];

const allColumns = ref([
  { title: '序号', dataIndex: 'index', key: 'index', visible: true },
  { title: '名称', dataIndex: 'name', key: 'name', visible: true },
  { title: '唯一标识(默认UUID)', dataIndex: 'uniqueId', key: 'uniqueId', visible: true },
  { title: '描述', dataIndex: 'description', key: 'description', visible: true },
  { title: '创建时间', dataIndex: 'createdDate', key: 'createdDate', visible: true, customRender: ({ text }: { text: string }) => text ? formatDate(text) : '' },
  { title: '更新时间', dataIndex: 'updatedDate', key: 'updatedDate', visible: true, customRender: ({ text }: { text: string }) => text ? formatDate(text) : '' },
  { title: '操作', key: 'operation', visible: true, width: 100, align: 'center' } as any
]);
const checkedKeys = ref(allColumns.value.filter(c => c.visible).map(c => c.key));


const tableColumns = computed(() =>
  allColumns.value.filter(col => checkedKeys.value.includes(col.key))
);

async function fetchData() {
  loading.value = true;
  try {
    const params = {
      name: searchForm.value.name,
      uniqueId: searchForm.value.uniqueId,
      pageNo: pagination.current,
      pageSize: pagination.pageSize
    };
    const res = await getNamespaces(params);
    if (Array.isArray(res)) {
      data.value = res;
      pagination.total = res.length;
    } else {
      data.value = res.data || [];
      pagination.total = res.total || data.value.length;
    }
  } catch (e) {
    data.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}
const handleSearchFormUpdate = (newForm: any) => {
  searchForm.value = { ...newForm }
}

function handleReset() {
  searchForm.value = { name: '', uniqueId: '' };
  handleSearch();
}
function handleAdd() {
  editingData.value = {
    name: '',
    uniqueId: uuidv4().replace(/-/g, ''),
    description: ''
  };
  isEdit.value = false;
  drawerVisible.value = true;
}
function handleEdit(record: NameSpace) {
  editingData.value = { ...record };
  isEdit.value = true;
  drawerVisible.value = true;
}
function regenerateUniqueId() {
  if (!isEdit.value && editingData.value) {
    editingData.value.uniqueId = uuidv4().replace(/-/g, '');
  }
}
function handleRefresh() {
  fetchData();
  message.success('已刷新');
}
function handlePageChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchData();
}
function handleDrawerClose() {
  drawerVisible.value = false;
}
async function handleDrawerSave() {
  if (!editingData.value) return;
  try {
    if (isEdit.value && editingData.value.id) {
      await updateNamespace(editingData.value.id, editingData.value);
      message.success('编辑成功');
    } else {
      await createNamespace(editingData.value);
      message.success('新增成功');
    }
    drawerVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('操作失败');
  }
}

function onCheckColumn(key: string, checked: boolean) {
  if (checked) {
    if (!checkedKeys.value.includes(key)) checkedKeys.value.push(key);
  } else {
    checkedKeys.value = checkedKeys.value.filter(k => k !== key);
  }
}

// 初始化加载
fetchData();
</script>

<template>
  <div class="namespace-page">
    <a-card :bordered="false">
      <SearchPanel
        :model-value="searchForm"
        :fields="fields"
        @search="handleSearch"
        @reset="handleReset"
        @update:model-value="handleSearchFormUpdate"
      />
      <div class="table-toolbar">
        <a-button type="primary" style="margin-right: 8px;" @click="handleAdd">新增</a-button>
        <a-button style="margin-right: 8px;" @click="handleRefresh">刷新</a-button>
        <ColumnSettings
          :columns="allColumns"
          v-model="checkedKeys"
          @update:columns="val => allColumns = val as any"
        />
      </div>
      <CommonPagination
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:pageNo="val => { pagination.current = val; fetchData(); }"
        @update:pageSize="val => { pagination.pageSize = val; pagination.current = 1; fetchData(); }"
        @change="handlePageChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
          </template>
        </template>
      </CommonPagination>
    </a-card>
    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? '编辑命名空间' : '新增命名空间'"
      width="400"
      :footer="null"
      @close="handleDrawerClose"
    >
      <a-form layout="vertical" v-if="editingData">
        <a-form-item label="名称">
          <a-input v-model:value="editingData.name" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="唯一标识(默认UUID)">
          <a-input v-model:value="editingData.uniqueId" placeholder="请输入唯一标识" :disabled="isEdit" >
            <template #suffix>
              <ReloadOutlined v-if="!isEdit" @click.stop="regenerateUniqueId" style="cursor:pointer; color:#555;" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="editingData.description" placeholder="请输入描述" />
        </a-form-item>
        <div style="text-align:right;">
          <a-button @click="handleDrawerClose" style="margin-right:8px;">取消</a-button>
          <a-button type="primary" @click="handleDrawerSave">保存</a-button>
        </div>
      </a-form>
    </a-drawer>

    
  </div>
</template>

<style scoped>
.namespace-page {
  padding: 24px;
  background: #fafbfc;
  height: 100%;
}
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  justify-content: space-between;
}
.right-btns {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.table-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  margin-bottom: 8px;
}
.column-setting-popover {
  min-width: 180px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}
.column-setting-item {
  display: flex;
  align-items: center;
  padding: 2px 12px;
  user-select: none;
}
.drag-handle {
  cursor: grab;
  margin-right: 8px;
  color: #bbb;
  font-size: 16px;
}
</style>
