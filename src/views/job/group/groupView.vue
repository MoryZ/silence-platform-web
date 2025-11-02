<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message, Tag } from 'ant-design-vue';
import {
  getGroupPage,
  createGroup,
  updateGroup,
  enableGroup,
  disableGroup,
  GroupConfig,
  GroupConfigRequestVO,

} from '@/api/job/group';
import { formatDate } from '@/utils/common';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import DetailDrawer from '@/components/DetailDrawer.vue';
import ColumnSettings from '@/components/ColumnSettings.vue';
import Draggable from 'vuedraggable';
import { Checkbox as ACheckbox } from 'ant-design-vue';

const drawerVisible = ref(false);
const editingData = ref<Partial<GroupConfigRequestVO> | null>(null);
const isEdit = ref(false);
const loading = ref(false);
const data = ref<GroupConfig[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });
const formRef = ref();
const formRules = {
  groupName: [
    { required: true, message: '请输入组名称' },
    { max: 64, message: '名称最多64个字符' }
  ],
  groupStatus: [
    { required: true, message: '请选择状态' }
  ],
  token: [
    { required: true, message: '请填写或生成Token' },
    { pattern: /^SJ_[A-Za-z0-9]{32}$/, message: '格式为SJ_加32位大小写字母或数字' }
  ],
  groupPartition: [
    { required: true, message: '请输入分区数' }
  ],
  idGeneratorMode: [
    { required: true, message: '请选择ID生成模式' }
  ]
} as const;
const searchForm = ref<{ groupName: string; groupStatus: string | null }>({ groupName: '', groupStatus: null });

// Group detail drawer state
const detailDrawerVisible = ref(false);
const detailData = ref<GroupConfig | null>(null);

// Detail drawer columns configuration
const detailColumns = [
  { title: '组名称', dataIndex: 'groupName' },
  { title: 'Token', dataIndex: 'token', type: 'token' },
  { title: '状态', dataIndex: 'groupStatus', type: 'enum', enumMap: { true: { label: '启用', color: 'blue' }, false: { label: '禁用', color: 'red' } } },
  { title: '初始化场景', dataIndex: 'initScene', type: 'enum', enumMap: { true: { label: '是', color: 'blue' }, false: { label: '否', color: 'red' } } },
  { title: '描述', dataIndex: 'description' }
];
const fields = [
  { key: 'groupName', type: 'input' as const, label: '组名称', placeholder: '请输入组名称' },
  { key: 'groupStatus', type: 'select' as const, label: '状态', placeholder: '请选择状态', 
    options: [{ label: '启用', value: 'true' }, { label: '禁用', value: 'false' }] },
];

const allColumns = ref([
  { title: '序号', dataIndex: 'index', key: 'index', visible: true },
  { title: '组名称', dataIndex: 'groupName', key: 'groupName', visible: true },
  { title: '状态', dataIndex: 'groupStatus', key: 'groupStatus', visible: true },
  { title: '初始化场景', dataIndex: 'initScene', key: 'initScene', width: 100, customRender: ({ text }: { text: boolean }) => text ? '是' : '否' , visible: true},
  { title: '创建时间', dataIndex: 'createdDate', key: 'createdDate', visible: true, customRender: ({ text }: { text: string }) => text ? formatDate(text) : '' },
  { title: '更新时间', dataIndex: 'updatedDate', key: 'updatedDate', visible: true, customRender: ({ text }: { text: string }) => text ? formatDate(text) : '' },
  { title: '描述', dataIndex: 'description', key: 'description', visible: true },
  { title: '操作', key: 'operation', visible: true, width: 100, align: 'center' } as any
]);
const checkedKeys = ref(allColumns.value.filter(c => c.visible).map(c => c.key));

const tableColumns = computed(() =>
  allColumns.value.filter(col => checkedKeys.value.includes(col.key))
);

// ensure dropdown overlay renders into body to avoid clipping by parent containers
const getBodyContainer = () => document.body as HTMLElement;
const columnSettingVisible = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      groupName: searchForm.value.groupName,
      pageNo: pagination.current,
      pageSize: pagination.pageSize
    };
    if (typeof searchForm.value.groupStatus === 'string') {
      params.groupStatus = searchForm.value.groupStatus === 'true';
    }
    const res = await getGroupPage(params);
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
  searchForm.value = { groupName: '', groupStatus: null };
  handleSearch();
}
function handleAdd() {
  editingData.value = {
    groupName: '',
    groupStatus: true,
    token: generateToken(),
    description: '',
    groupPartition: 1,
    idGeneratorMode: 1,
    initScene: false
  };
  isEdit.value = false;
  drawerVisible.value = true;
}
function handleEdit(record: GroupConfig) {
  editingData.value = { 
    ...record,
    groupStatus: record.groupStatus,
    initScene: record.initScene
  };
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
    // validate
    // @ts-ignore antd form validate
    await formRef.value?.validate?.();

    const payload: any = { ...editingData.value };
    // normalize types
    if (typeof payload.groupStatus === 'string') payload.groupStatus = payload.groupStatus === 'true';
    if (typeof payload.idGeneratorMode === 'string') payload.idGeneratorMode = Number(payload.idGeneratorMode);
    if (typeof payload.groupPartition === 'string') payload.groupPartition = Number(payload.groupPartition);

    if (isEdit.value && (editingData.value as any).id) {
      await updateGroup(Number((editingData.value as any).id), payload as GroupConfigRequestVO);
      message.success('编辑成功');
    } else {
      await createGroup(payload as GroupConfigRequestVO);
      message.success('新增成功');
    }
    drawerVisible.value = false;
    fetchData();
  } catch (e) {
    if ((e as any)?.errorFields) return; // form error already shown
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

// Token generation function
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'SJ_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Group detail drawer functions
function showDetail(record: GroupConfig) {
  detailData.value = record;
  detailDrawerVisible.value = true;
}


async function handleStatusChange(record: GroupConfig, checked: boolean) {
  try {
    if (checked) {
      await enableGroup({ groupName: record.groupName, groupStatus: true });
    } else {
      await disableGroup({ groupName: record.groupName, groupStatus: false });
    }
    message.success('状态更新成功');
    fetchData();
  } catch (e) {
    message.error('状态更新失败');
    // Revert the switch state
    record.groupStatus = !checked;
  }
}

// 初始化加载
fetchData();
</script>

<template>
  <div class="group-page">
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
          <template v-else-if="column.key === 'groupName'">
            <a @click="showDetail(record)">{{ record.groupName }}</a>
          </template>
          <template v-else-if="column.key === 'groupStatus'">
            <a-switch
              v-model:checked="record.groupStatus"
              @change="(checked: boolean) => handleStatusChange(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'initScene'">
            <Tag :color="record.initScene ? 'blue' : 'red'">
              {{ record.initScene ? '是' : '否' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
          </template>
        </template>
      </CommonPagination>
    </a-card>
    <a-modal
      v-model:open="columnSettingVisible"
      title="列设置"
      :width="520"
      :maskClosable="true"
      :zIndex="3000"
      :footer="null"
    >
      <div class="column-setting-popover" style="max-height:420px; overflow:auto;">
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
    </a-modal>
    <a-drawer
      v-model:open="drawerVisible"
      :title="isEdit ? '编辑组' : '新增组'"
      width="400"
      :footer="null"
      @close="handleDrawerClose"
    >
      <a-form ref="formRef" :model="editingData" :rules="formRules" layout="vertical" v-if="editingData">
        <a-typography-title :level="5">通用配置</a-typography-title>
        <a-form-item label="组名称" name="groupName">
          <a-input v-model:value="editingData.groupName" :maxlength="64" show-count placeholder="请输入组名称，最多64字符" />
        </a-form-item>
        <a-form-item label="状态" name="groupStatus">
          <a-radio-group v-model:value="(editingData as any).groupStatus">
            <a-radio :value="true">启用</a-radio>
            <a-radio :value="false">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="Token" name="token">
          <div style="display:flex; gap:8px; align-items:center;">
            <a-input v-model:value="editingData.token" placeholder="SJ_加32位大小写字母或数字" />
            <a-button @click="editingData.token = generateToken()">生成</a-button>
          </div>
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="editingData.description" :rows="3" placeholder="请输入描述" />
        </a-form-item>

        <a-typography-title :level="5" style="margin-top:8px;">重试配置</a-typography-title>
        <a-form-item label="初始化场景">
          <a-radio-group v-model:value="(editingData as any).initScene">
            <a-radio :value="true">是</a-radio>
            <a-radio :value="false">否</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="分区" name="groupPartition">
          <a-input-number v-model:value="(editingData as any).groupPartition" :min="1" :precision="0" style="width: 100%;" placeholder="请输入分区数" />
        </a-form-item>

        <a-form-item label="ID生成模式" name="idGeneratorMode">
          <a-radio-group v-model:value="(editingData as any).idGeneratorMode">
            <a-radio :value="1">雪花算法</a-radio>
            <a-radio :value="2">号段模式</a-radio>
          </a-radio-group>
        </a-form-item>

        <div style="text-align:right;">
          <a-button @click="handleDrawerClose" style="margin-right:8px;">取消</a-button>
          <a-button type="primary" @click="handleDrawerSave">保存</a-button>
        </div>
      </a-form>
    </a-drawer>

    <!-- Group Detail Drawer -->
    <DetailDrawer
      v-model:visible="detailDrawerVisible"
      :record="detailData"
      :columns="detailColumns"
      title="组详情"
    />
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