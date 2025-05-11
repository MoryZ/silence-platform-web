<script setup lang="ts">
import { ref, reactive } from 'vue';
import { message, Drawer, Form, Input, Button } from 'ant-design-vue';
import {
  getNamespaces,
  createNamespace,
  updateNamespace,
  NameSpace
} from '@/api/job/namespace';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const name = ref('');
const uniqueId = ref('');
const drawerVisible = ref(false);
const editingData = ref<Partial<NameSpace> | null>(null);
const isEdit = ref(false);
const loading = ref(false);
const data = ref<NameSpace[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

const columns = [
  { title: '序号', key: 'index', width: 60, align: 'center' },
  { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '唯一标识(默认UUID)', dataIndex: 'uniqueId', key: 'uniqueId', width: 320 },
  { title: '创建时间', dataIndex: 'createdDate', key: 'createdDate', width: 180, customRender: ({ text }) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '' },
  { title: '更新时间', dataIndex: 'updatedDate', key: 'updatedDate', width: 180, customRender: ({ text }) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '' },
  { title: '操作', key: 'operation', width: 100, align: 'center' }
];

async function fetchData() {
  loading.value = true;
  try {
    const params = {
      name: name.value,
      uniqueId: uniqueId.value,
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
function handleReset() {
  name.value = '';
  uniqueId.value = '';
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

// 初始化加载
fetchData();
</script>

<template>
  <div class="namespace-page">
    <a-card :bordered="false">
      <div class="search-bar">
        <a-input
          v-model:value="name"
          placeholder="请输入空间名称"
          style="width: 260px; margin-right: 12px;"
          @pressEnter="handleSearch"
          allow-clear
        />
        <a-input
          v-model:value="uniqueId"
          placeholder="请输入唯一标识"
          style="width: 260px; margin-right: 12px;"
          @pressEnter="handleSearch"
          allow-clear
        />
        <a-button @click="handleReset" style="margin-right: 8px;">重置</a-button>
        <a-button type="primary" @click="handleSearch" style="margin-right: 16px;">搜索</a-button>
        <div class="right-btns">
          <a-button type="primary" @click="handleAdd" style="margin-right: 8px;">新增</a-button>
          <a-button @click="handleRefresh" style="margin-right: 8px;">刷新</a-button>
          <a-button>列设置</a-button>
        </div>
      </div>
      <a-table
        :columns="columns"
        :data-source="data"
        :pagination="false"
        row-key="id"
        :loading="loading"
        style="margin-top: 16px;"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
          </template>
        </template>
      </a-table>
      <div style="margin-top: 16px; text-align: right;">
        <a-pagination
          v-model:current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          show-size-changer
          @change="handlePageChange"
        />
      </div>
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
        <a-form-item label="唯一标识">
          <a-input v-model:value="editingData.uniqueId" placeholder="请输入唯一标识" :disabled="isEdit" />
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
</style>
