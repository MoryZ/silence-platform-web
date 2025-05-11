<template>
  <div class="subsystem-container">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="left">
        <div class="search-item">
          <a-input
            v-model:value="searchParams.name"
            placeholder="请输入子系统名称"
            style="width: 200px"
            allow-clear
            @pressEnter="handleSearch"
          />
          <close-circle-filled
            v-if="searchParams.name"
            class="clear-icon"
            @click="() => clearSearchItem('name')"
          />
        </div>
        <div class="search-item">
          <a-input
            v-model:value="searchParams.code"
            placeholder="请输入子系统编码"
            style="width: 200px"
            allow-clear
            @pressEnter="handleSearch"
          />
          <close-circle-filled
            v-if="searchParams.code"
            class="clear-icon"
            @click="() => clearSearchItem('code')"
          />
        </div>
        <a-space>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            搜索
          </a-button>
          <a-button @click="handleReset">
            <template #icon><redo-outlined /></template>
            重置
          </a-button>
        </a-space>
      </div>
      <div class="right">
        <a-button type="primary" @click="handleAddSubsystem">
          <plus-outlined />
          新增子系统
        </a-button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="content-area">
      <!-- 子系统列表 -->
      <div class="subsystem-list">
        <a-card :bordered="false" title="子系统列表">
          <template #extra>
            <a-button type="link" @click="refreshSubsystems">
              <reload-outlined />
              刷新
            </a-button>
          </template>
          <common-pagination
            :onUpdate:pageNo="(val: number) => searchParams.pageNo = val"
            :columns="columns"
            :data-source="subsystems"
            v-model:pageNo="searchParams.pageNo"
            v-model:pageSize="searchParams.pageSize"
            :total="pagination.total"
            @change="handlePageChange"
          />
        </a-card>
      </div>

      <!-- 组件列表抽屉 -->
      <a-drawer
        v-model:open="componentDrawer.visible"
        :title="`${componentDrawer.subsystem?.name || ''} - 组件列表`"
        width="600"
        @close="handleComponentDrawerClose"
      >
        <template #extra>
          <a-button type="primary" @click="handleAddComponent">
            <plus-outlined />
            新增组件
          </a-button>
        </template>
        <a-table
          :columns="componentColumns"
          :data-source="components"
          :loading="componentLoading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status ? 'success' : 'error'">
                {{ record.status ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a @click="handleEditComponent(record)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm
                  title="确定要删除该组件吗？"
                  @confirm="handleDeleteComponent(record)"
                >
                  <a class="danger-link">删除</a>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-drawer>

      <!-- 子系统表单弹窗 -->
      <a-modal
        v-model:open="subsystemModal.visible"
        :title="subsystemModal.title"
        ok-text="确定"
        cancel-text="取消"
        @ok="handleSubsystemSubmit"
      >
        <a-form
          ref="subsystemFormRef"
          :model="subsystemForm"
          :rules="subsystemRules"
          layout="vertical"
        >
          <a-form-item label="子系统名称" name="name">
            <a-input v-model:value="subsystemForm.name" placeholder="请输入子系统名称" />
          </a-form-item>
          <a-form-item label="子系统编码" name="code">
            <a-input v-model:value="subsystemForm.code" placeholder="请输入子系统编码" />
          </a-form-item>
          <a-form-item label="描述" name="description">
            <a-textarea
              v-model:value="subsystemForm.description"
              placeholder="请输入描述信息"
              :rows="4"
            />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 组件表单弹窗 -->
      <a-modal
        v-model:open="componentModal.visible"
        :title="componentModal.title"
        ok-text="确定"
        cancel-text="取消"
        @ok="handleComponentSubmit"
      >
        <a-form
          ref="componentFormRef"
          :model="componentForm"
          :rules="componentRules"
          layout="vertical"
        >
          <a-form-item label="组件名称" name="name">
            <a-input v-model:value="componentForm.name" placeholder="请输入组件名称" />
          </a-form-item>
          <a-form-item label="组件编码" name="code">
            <a-input v-model:value="componentForm.code" placeholder="请输入组件编码" />
          </a-form-item>
          <a-form-item label="状态" name="status">
            <a-radio-group v-model:value="componentForm.status">
              <a-radio :value="true">启用</a-radio>
              <a-radio :value="false">禁用</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="描述" name="description">
            <a-textarea
              v-model:value="componentForm.description"
              placeholder="请输入描述信息"
              :rows="4"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import {
  getConfigSubsystems,
  createConfigSubsystem,
  updateConfigSubsystem,
  deleteConfigSubsystem,
  type ConfigSubsystem,
  type ConfigSubsystemParams,
} from '../../api/config/configSubsystem';
import {
  getConfigComponents,
  createConfigComponent,
  updateConfigComponent,
  deleteConfigComponent,
  type ConfigComponent,
} from '../../api/config/configComponent';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  RedoOutlined,
  CloseCircleFilled,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import CommonPagination from '../../components/CommonPagination.vue';

// 表格列定义
const columns = [
  {
    title: '子系统名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '子系统编码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '创建时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

const componentColumns = [
  {
    title: '组件名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '组件编码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
];

// 状态定义
const loading = ref(false);
const componentLoading = ref(false);
const subsystems = ref<ConfigSubsystem[]>([]);
const components = ref<ConfigComponent[]>([]);
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0,
});

// 搜索参数
const searchParams = reactive<ConfigSubsystemParams>({
  pageNo: 1,
  pageSize: 10,
  name: '',
  code: '',
  description: '',
});

// 子系统表单
const subsystemFormRef = ref<FormInstance>();
const subsystemForm = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  description: '',
});

const subsystemRules = {
  name: [{ required: true, message: '请输入子系统名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入子系统编码', trigger: 'blur' }],
};

const subsystemModal = reactive({
  visible: false,
  title: '新增子系统',
});

// 组件表单
const componentFormRef = ref<FormInstance>();
const componentForm = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  description: '',
  status: true,
  subsystemId: undefined as number | undefined,
});

const componentRules = {
  name: [{ required: true, message: '请输入组件名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入组件编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const componentModal = reactive({
  visible: false,
  title: '新增组件',
});

// 组件抽屉
const componentDrawer = reactive({
  visible: false,
  subsystem: null as ConfigSubsystem | null,
});

// 方法定义
const fetchSubsystems = async () => {
  loading.value = true;
  try {
    const { data, total } = await getConfigSubsystems(searchParams);
    subsystems.value = data;
    pagination.total = total;
  } catch (error) {
    console.error('获取子系统列表失败:', error);
    message.error('获取子系统列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchComponents = async (subsystemId: number) => {
  componentLoading.value = true;
  try {
    const data = await getConfigComponents({ subsystemId });
    components.value = data;
  } catch (error) {
    console.error('获取组件列表失败:', error);
    message.error('获取组件列表失败');
  } finally {
    componentLoading.value = false;
  }
};

const handleSearch = () => {
  searchParams.pageNo = 1;
  fetchSubsystems();
};

const handleReset = () => {
  searchParams.name = '';
  searchParams.code = '';
  searchParams.description = '';
  searchParams.pageNo = 1;
  fetchSubsystems();
};

const handlePageChange = (page: number, size: number) => {
  searchParams.pageNo = page;
  searchParams.pageSize = size;
  fetchSubsystems();
};

const refreshSubsystems = () => {
  fetchSubsystems();
};

// 子系统相关操作
const handleAddSubsystem = () => {
  subsystemModal.title = '新增子系统';
  subsystemForm.id = undefined;
  subsystemForm.name = '';
  subsystemForm.code = '';
  subsystemForm.description = '';
  subsystemModal.visible = true;
};

const handleEditSubsystem = (record: ConfigSubsystem) => {
  subsystemModal.title = '编辑子系统';
  subsystemForm.id = record.id;
  subsystemForm.name = record.name;
  subsystemForm.code = record.code;
  subsystemForm.description = record.description;
  subsystemModal.visible = true;
};

const handleSubsystemSubmit = async () => {
  try {
    await subsystemFormRef.value?.validate();
    if (subsystemForm.id) {
      await updateConfigSubsystem(subsystemForm.id, subsystemForm);
      message.success('更新成功');
    } else {
      await createConfigSubsystem(subsystemForm);
      message.success('创建成功');
    }
    subsystemModal.visible = false;
    fetchSubsystems();
  } catch (error) {
    console.error('提交失败:', error);
    message.error('提交失败');
  }
};

const handleDeleteSubsystem = async (record: ConfigSubsystem) => {
  try {
    await deleteConfigSubsystem(record.id);
    message.success('删除成功');
    fetchSubsystems();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

// 组件相关操作
const handleViewComponents = (record: ConfigSubsystem) => {
  componentDrawer.subsystem = record;
  componentDrawer.visible = true;
  fetchComponents(record.id);
};

const handleComponentDrawerClose = () => {
  componentDrawer.visible = false;
  componentDrawer.subsystem = null;
  components.value = [];
};

const handleAddComponent = () => {
  if (!componentDrawer.subsystem) return;
  componentModal.title = '新增组件';
  componentForm.id = undefined;
  componentForm.name = '';
  componentForm.code = '';
  componentForm.description = '';
  componentForm.status = true;
  componentForm.subsystemId = componentDrawer.subsystem.id;
  componentModal.visible = true;
};

const handleEditComponent = (record: ConfigComponent) => {
  componentModal.title = '编辑组件';
  componentForm.id = record.id;
  componentForm.name = record.name;
  componentForm.code = record.code;
  componentForm.description = record.description;
  componentForm.status = record.status;
  componentForm.subsystemId = record.subsystemId;
  componentModal.visible = true;
};

const handleComponentSubmit = async () => {
  try {
    await componentFormRef.value?.validate();
    if (componentForm.id) {
      await updateConfigComponent(componentForm.id, componentForm);
      message.success('更新成功');
    } else {
      await createConfigComponent(componentForm);
      message.success('创建成功');
    }
    componentModal.visible = false;
    if (componentDrawer.subsystem) {
      fetchComponents(componentDrawer.subsystem.id);
    }
  } catch (error) {
    console.error('提交失败:', error);
    message.error('提交失败');
  }
};

const handleDeleteComponent = async (record: ConfigComponent) => {
  try {
    await deleteConfigComponent(record.id);
    message.success('删除成功');
    if (componentDrawer.subsystem) {
      fetchComponents(componentDrawer.subsystem.id);
    }
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

// 清除单个搜索条件
const clearSearchItem = (field: keyof ConfigSubsystemParams) => {
  searchParams[field] = '';
};

onMounted(() => {
  fetchSubsystems();
});
</script>

<style lang="scss" scoped>
.subsystem-container {
  padding: 24px;

  .action-bar {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
      display: flex;
      gap: 16px;
      align-items: center;

      .search-item {
        position: relative;

        .clear-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0, 0, 0, 0.25);
          cursor: pointer;
          font-size: 12px;
          
          &:hover {
            color: rgba(0, 0, 0, 0.45);
          }
        }
      }
    }
  }

  .content-area {
    background: #fff;
    padding: 24px;
    border-radius: 4px;
  }

  .danger-link {
    color: #ff4d4f;

    &:hover {
      color: #ff7875;
    }
  }
}
</style> 