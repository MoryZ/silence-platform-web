<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message, Modal, Tag } from 'ant-design-vue';
import Draggable from 'vuedraggable';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import { getJobExecutors, createJobExecutor, updateJobExecutor, deleteJobExecutor, type JobExecutor, type JobExecutorParams } from '@/api/job/executor';
import { formatDate } from '@/utils/common';

// 搜索与分页
const loading = ref(false);
const data = ref<JobExecutor[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

// 与 groupView 保持一致的 SearchPanel 接口
const searchForm = ref<{ namespaceId: string; executorName: string }>({ namespaceId: '', executorName: '' });
const fields = [
  { key: 'namespaceId', type: 'input' as const, placeholder: '请输入组名称/ID' },
  { key: 'executorName', type: 'input' as const, placeholder: '请输入执行器名称' }
];

// 列设置（支持拖拽与显隐）
const allColumns = ref([
  { title: '序号', dataIndex: 'index', key: 'index', visible: true },
  { title: '组名称/ID', dataIndex: 'namespaceId', key: 'namespaceId', visible: true },
  { title: '执行器名称', dataIndex: 'executorName', key: 'executorName', visible: true },
  { title: '执行器类型', dataIndex: 'executorType', key: 'executorType', visible: true, width: 120 },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', visible: false },
  { title: '更新人', dataIndex: 'updatedBy', key: 'updatedBy', visible: false },
  { title: '创建时间', dataIndex: 'createdDate', key: 'createdDate', visible: true },
  { title: '更新时间', dataIndex: 'updatedDate', key: 'updatedDate', visible: true },
  { title: '操作', key: 'operation', visible: true, width: 120, align: 'center' }
]);
const checkedKeys = ref(allColumns.value.filter(c => c.visible).map(c => c.key));
const tableColumns = computed(() => allColumns.value.filter(col => checkedKeys.value.includes(col.key)));

function onCheckColumn(key: string, checked: boolean) {
  if (checked) {
    if (!checkedKeys.value.includes(key)) checkedKeys.value.push(key);
  } else {
    checkedKeys.value = checkedKeys.value.filter(k => k !== key);
  }
}

// 选中与批量删除
const selectedRowKeys = ref<number[]>([]);
function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys.map(k => Number(k));
}

async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }
  Modal.confirm({
    title: '确认批量删除吗？',
    content: '该删除为物理删除，删除后不可恢复，必要时请先导出备份。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await Promise.all(selectedRowKeys.value.map(id => deleteJobExecutor(id)));
        message.success('批量删除成功');
        selectedRowKeys.value = [];
        fetchData();
      } catch (e) {
        message.error('删除失败');
      }
    }
  });
}

// 抽屉（新增/编辑）
const drawerVisible = ref(false);
const isEdit = ref(false);
const editingData = ref<Partial<JobExecutor> | null>(null);

function handleAdd() {
  editingData.value = {
    namespaceId: '',
    executorName: '',
    executorType: 'Java'
  } as Partial<JobExecutor>;
  isEdit.value = false;
  drawerVisible.value = true;
}

function handleEdit(record: JobExecutor) {
  editingData.value = { ...record };
  isEdit.value = true;
  drawerVisible.value = true;
}

function handleDrawerClose() {
  drawerVisible.value = false;
}

async function handleDrawerSave() {
  if (!editingData.value) return;
  try {
    if (isEdit.value && typeof editingData.value.id === 'number') {
      await updateJobExecutor(editingData.value.id, editingData.value);
      message.success('编辑成功');
    } else {
      await createJobExecutor(editingData.value);
      message.success('新增成功');
    }
    drawerVisible.value = false;
    fetchData();
  } catch (e) {
    message.error('操作失败');
  }
}

// 删除
function handleDelete(record: JobExecutor) {
  Modal.confirm({
    title: '确认删除该执行器吗？',
    content: '该删除为物理删除，删除后不可恢复，必要时请先导出备份。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteJobExecutor(record.id);
        message.success('删除成功');
        fetchData();
      } catch (e) {
        message.error('删除失败');
      }
    }
  });
}

// 数据加载
async function fetchData() {
  loading.value = true;
  try {
    const params: JobExecutorParams = {
      namespaceId: searchForm.value.namespaceId,
      executorName: searchForm.value.executorName,
      pageNo: pagination.current,
      pageSize: pagination.pageSize
    };
    const res = await getJobExecutors(params);
    if (Array.isArray((res as unknown))) {
      const list = res as unknown as JobExecutor[];
      data.value = list;
      pagination.total = list.length;
    } else {
      // 兼容接口返回结构 { total, data }
      const page = res as unknown as { total: number; data: JobExecutor[] };
      data.value = page.data || [];
      pagination.total = page.total || data.value.length;
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
  searchForm.value = { namespaceId: '', executorName: '' };
  handleSearch();
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

// 初始化
fetchData();
</script>

<template>
  <div class="executor-page">
    <a-card :bordered="false">
      <SearchPanel
        v-model="searchForm"
        :fields="fields"
        @search="handleSearch"
        @reset="handleReset"
      />

      <div class="table-toolbar">
        <a-button type="primary" style="margin-right: 8px;" @click="handleAdd">新增</a-button>
        <a-button danger style="margin-right: 8px;" @click="handleBatchDelete">批量删除</a-button>
        <a-button style="margin-right: 8px;" @click="handleRefresh">刷新</a-button>
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <template #overlay>
            <div class="column-setting-popover">
              <Draggable
                v-model="allColumns"
                item-key="key"
                handle=".drag-handle"
                animation="200"
              >
                <template #item="{ element }">
                  <div class="column-setting-item">
                    <span class="drag-handle">☰</span>
                    <a-checkbox
                      :checked="checkedKeys.includes(element.key)"
                      @change="onCheckColumn(element.key, $event.target.checked)"
                    >
                      {{ element.title }}
                    </a-checkbox>
                  </div>
                </template>
              </Draggable>
            </div>
          </template>
          <a-button>
            <template #icon>
              <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="currentColor"><path d="M512 928c-229.75 0-416-186.25-416-416S282.25 96 512 96s416 186.25 416 416-186.25 416-416 416zm0-64c194.13 0 352-157.87 352-352S706.13 160 512 160 160 317.87 160 512s157.87 352 352 352zm-32-480v192h64V384h-64zm0 256v64h64v-64h-64z"></path></svg>
            </template>
            列设置
          </a-button>
        </a-dropdown>
      </div>

      <CommonPagination
        :columns="tableColumns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:pageNo="(val: number) => { pagination.current = val; fetchData(); }"
        @update:pageSize="(val: number) => { pagination.pageSize = val; pagination.current = 1; fetchData(); }"
        @change="handlePageChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'executorType'">
            <Tag color="blue">{{ record.executorType }}</Tag>
          </template>
          <template v-else-if="column.key === 'createdDate'">
            {{ record.createdDate ? formatDate(record.createdDate) : '' }}
          </template>
          <template v-else-if="column.key === 'updatedDate'">
            {{ record.updatedDate ? formatDate(record.updatedDate) : '' }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
            <a-divider type="vertical" />
            <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
          </template>
        </template>
      </CommonPagination>
    </a-card>

    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? '编辑执行器' : '新增执行器'"
      width="480"
      :footer="null"
      @close="handleDrawerClose"
    >
      <a-form layout="vertical" v-if="editingData">
        <a-form-item label="组名称/ID">
          <a-input v-model:value="editingData.namespaceId" placeholder="请输入组名称或唯一标识" />
        </a-form-item>
        <a-form-item label="执行器名称">
          <a-input v-model:value="editingData.executorName" placeholder="请输入执行器名称" />
        </a-form-item>
        <a-form-item label="执行器类型">
          <a-select v-model:value="editingData.executorType" :options="[{ label: 'Java', value: 'Java' }]" />
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
.executor-page {
  padding: 24px;
  background: #fafbfc;
  height: 100%;
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
