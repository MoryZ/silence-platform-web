<template>
  <div class="cyberark-security">
    <a-card :bordered="false">
      <template #title>CyberArk 安全管理</template>
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <plus-outlined />
          新增
        </a-button>
      </template>

      <!-- 搜索面板 -->
      <search-panel
        :model-value="searchForm"
        :fields="searchFields"
        @search="handleSearch"
        @reset="handleReset"
        @update:model-value="handleSearchFormUpdate"
      />

      <!-- 数据表格 -->
      <common-pagination
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        row-key="id"
        style="margin-top: 16px"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <a-switch
              :checked="record.enabled"
              :loading="toggleLoading[record.id]"
              @change="(checked: boolean) => handleToggleEnabled(record, checked)"
              size="small"
            />
          </template>
          <template v-else-if="column.key === 'encryptedValue'">
            <span>{{ maskSensitiveData(record.encryptedValue) }}</span>
          </template>
          <template v-else-if="column.key === 'createdDate' || column.key === 'updatedDate'">
            {{ formatDate(record[column.key]) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除该 CyberArk 信息吗？"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" size="small" danger>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </common-pagination>
    </a-card>

    <!-- 表单弹窗 -->
    <a-modal
      v-model:open="showModal"
      :title="modalTitle"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="CyberArk 对象" name="cyberarkObject">
          <a-input
            v-model:value="form.cyberarkObject"
            placeholder="请输入 CyberArk 对象"
          />
        </a-form-item>
        <a-form-item label="组件编码" name="componentCode">
          <a-select
            v-model:value="form.componentCode"
            placeholder="请选择组件编码"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option
              v-for="component in componentOptions"
              :key="component.code"
              :value="component.code"
            >
              {{ component.code }} - {{ component.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="加密值" name="encryptedValue">
          <a-input-password
            v-model:value="form.encryptedValue"
            placeholder="请输入加密值"
          />
        </a-form-item>
        <a-form-item label="Safe" name="safe">
          <a-input
            v-model:value="form.safe"
            placeholder="请输入 Safe"
          />
        </a-form-item>
        <a-form-item label="folder" name="folder">
          <a-input
            v-model:value="form.folder"
            placeholder="请输入 folder"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="form.description"
            placeholder="请输入描述信息"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="状态" name="enabled">
          <a-switch v-model:checked="form.enabled" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import dayjs from 'dayjs';
import {
  getConfigCyberarkInfos,
  createConfigCyberarkInfo,
  updateConfigCyberarkInfo,
  deleteConfigCyberarkInfo,
  enableConfigCyberarkInfo,
  disableConfigCyberarkInfo,
} from '@/api/config/configCyberark';
import { getConfigComponents } from '@/api/config/configComponent';
import { getAllConfigSubsystem } from '@/api/config/configSubsystem';
import type { ConfigCyberarkInfo, ConfigCyberarkInfoParams, ConfigComponent } from '@/types/config';

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: 'CyberArk 对象',
    dataIndex: 'cyberarkObject',
    key: 'cyberarkObject',
    width: 200,
  },
  {
    title: '组件编码',
    dataIndex: 'componentCode',
    key: 'componentCode',
    width: 150,
  },
  {
    title: '加密值',
    dataIndex: 'encryptedValue',
    key: 'encryptedValue',
    width: 200,
  },
  {
    title: 'Safe',
    dataIndex: 'safe',
    key: 'safe',
    width: 150,
  },
  {
    title: 'folder',
    dataIndex: 'folder',
    key: 'folder',
    width: 150,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedDate',
    key: 'updatedDate',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

// 搜索表单数据
const searchForm = reactive<Record<string, any>>({
  cyberarkObject: '',
  componentCode: undefined,
  enabled: undefined,
});

// 搜索字段配置
const searchFields = [
  {
    key: 'cyberarkObject',
    label: 'CyberArk 对象',
    type: 'input' as const,
    placeholder: '请输入 CyberArk 对象',
    style: 'width: 200px',
  },
  {
    key: 'componentCode',
    label: '组件编码',
    type: 'select' as const,
    placeholder: '请选择组件编码',
    options: async () => {
      const components = await fetchAllComponents();
      return components.map((c) => ({
        label: `${c.code} - ${c.name}`,
        value: c.code,
      }));
    },
  },
  {
    key: 'enabled',
    label: '状态',
    type: 'select' as const,
    placeholder: '请选择状态',
    options: [
      { label: '全部', value: '' },
      { label: '启用', value: 'true' },
      { label: '禁用', value: 'false' },
    ],
  },
];

// 表格数据和分页
const tableData = ref<ConfigCyberarkInfo[]>([]);
const loading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 组件选项
const componentOptions = ref<ConfigComponent[]>([]);

// 表单相关
const showModal = ref(false);
const modalTitle = ref('新增 CyberArk 信息');
const formRef = ref<FormInstance>();
const form = reactive<Partial<ConfigCyberarkInfo>>({
  id: undefined,
  cyberarkObject: '',
  componentCode: '',
  encryptedValue: '',
  safe: '',
  folder: '',
  description: '',
  enabled: true,
});

// 表单验证规则
const rules = {
  cyberarkObject: [{ required: true, message: '请输入 CyberArk 对象', trigger: 'blur' }],
  componentCode: [{ required: true, message: '请选择组件编码', trigger: 'change' }],
  encryptedValue: [{ required: true, message: '请输入加密值', trigger: 'blur' }],
  safe: [{ required: true, message: '请输入 Safe', trigger: 'blur' }],
  folder: [{ required: true, message: '请输入 folder', trigger: 'blur' }],
};

// 状态切换加载状态
const toggleLoading = ref<Record<number, boolean>>({});

// 获取所有组件（用于搜索和表单）
const fetchAllComponents = async (): Promise<ConfigComponent[]> => {
  try {
    // 获取所有子系统
    const subsystems = await getAllConfigSubsystem();
    const allComponents: ConfigComponent[] = [];
    
    // 遍历每个子系统获取其组件
    for (const subsystem of subsystems) {
      try {
        const components = await getConfigComponents({ subsystemId: subsystem.id });
        allComponents.push(...components);
      } catch (error) {
        console.warn(`获取子系统 ${subsystem.name} 的组件失败:`, error);
      }
    }
    
    return allComponents;
  } catch (error) {
    console.error('获取组件列表失败:', error);
    return [];
  }
};

// 获取组件列表（用于表单下拉框）
const fetchComponentOptions = async () => {
  try {
    // 这里应该获取所有组件，可能需要根据实际情况调用 API
    // 如果后端没有提供获取所有组件的接口，可能需要先获取所有子系统，然后遍历获取组件
    componentOptions.value = await fetchAllComponents();
  } catch (error) {
    console.error('获取组件选项失败:', error);
    message.error('获取组件列表失败');
  }
};

// 筛选选项
const filterOption = (input: string, option: any) => {
  return option.children[0].children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 日期格式化
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.warn('日期格式化失败:', dateString, error);
    return dateString;
  }
};

// 掩码敏感数据
const maskSensitiveData = (data: string) => {
  if (!data || data.length <= 8) return data;
  return data.substring(0, 4) + '****' + data.substring(data.length - 4);
};

// 搜索方法
const handleSearch = () => {
  // 转换 enabled 值
  let enabledValue: boolean | undefined = undefined;
  if (searchForm.enabled === 'true') {
    enabledValue = true;
  } else if (searchForm.enabled === 'false') {
    enabledValue = false;
  } else if (searchForm.enabled === '' || searchForm.enabled === undefined || searchForm.enabled === null) {
    enabledValue = undefined;
  }

  const searchParams: ConfigCyberarkInfoParams = {
    cyberarkObject: searchForm.cyberarkObject || undefined,
    componentCode: searchForm.componentCode || undefined,
    enabled: enabledValue,
    pageNo: pagination.current,
    pageSize: pagination.pageSize,
    sort: '-createdDate',
  };

  // 移除空值（保留 false 值，因为 false 也是有效的搜索条件）
  Object.keys(searchParams).forEach((key) => {
    const value = searchParams[key as keyof ConfigCyberarkInfoParams];
    // 只删除 undefined、null 和空字符串，保留 false
    if (value === '' || value === undefined || value === null) {
      delete searchParams[key as keyof ConfigCyberarkInfoParams];
    }
  });

  console.log('搜索参数:', searchParams);
  console.log('searchForm.enabled 原始值:', searchForm.enabled);

  fetchData(searchParams);
};

// 搜索表单更新处理
const handleSearchFormUpdate = (newForm: any) => {
  Object.assign(searchForm, newForm);
};

// 重置方法
const handleReset = () => {
  searchForm.cyberarkObject = '';
  searchForm.componentCode = undefined;
  searchForm.enabled = undefined;
  pagination.current = 1;
  handleSearch();
};

// 分页变化
const handleTableChange = (pageNo: number, pageSize: number) => {
  pagination.current = pageNo;
  pagination.pageSize = pageSize;
  handleSearch();
};

// 获取数据
const fetchData = async (params?: ConfigCyberarkInfoParams) => {
  loading.value = true;
  try {
    const defaultParams: ConfigCyberarkInfoParams = {
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      sort: '-createdDate',
      ...params,
    };

    const response = await getConfigCyberarkInfos(defaultParams);
    tableData.value = response.data || [];
    pagination.total = response.total || 0;
  } catch (error) {
    console.error('获取 CyberArk 信息列表失败:', error);
    message.error('获取 CyberArk 信息列表失败');
  } finally {
    loading.value = false;
  }
};

// 新增
const handleAdd = () => {
  modalTitle.value = '新增 CyberArk 信息';
  form.id = undefined;
  form.cyberarkObject = '';
  form.componentCode = '';
  form.encryptedValue = '';
  form.safe = '';
  form.folder = '';
  form.description = '';
  form.enabled = true;
  showModal.value = true;
};

// 编辑
const handleEdit = (record: ConfigCyberarkInfo) => {
  modalTitle.value = '编辑 CyberArk 信息';
  Object.assign(form, record);
  showModal.value = true;
};

// 提交表单
const handleModalOk = async () => {
  try {
    await formRef.value?.validate();
    if (form.id) {
      // 更新
      await updateConfigCyberarkInfo(form.id, form);
      message.success('更新成功');
    } else {
      // 新增
      await createConfigCyberarkInfo(form);
      message.success('新增成功');
    }
    showModal.value = false;
    handleSearch();
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || (form.id ? '更新失败' : '新增失败');
    message.error(errorMessage);
    console.error('操作失败:', error);
  }
};

// 取消表单
const handleModalCancel = () => {
  showModal.value = false;
  formRef.value?.resetFields();
};

// 切换启用状态
const handleToggleEnabled = async (record: ConfigCyberarkInfo, checked: boolean) => {
  toggleLoading.value[record.id] = true;
  try {
    if (checked) {
      await enableConfigCyberarkInfo(record.id);
    } else {
      await disableConfigCyberarkInfo(record.id);
    }
    message.success(checked ? '启用成功' : '禁用成功');
    handleSearch();
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || error?.message || (checked ? '启用失败' : '禁用失败');
    message.error(errorMessage);
    console.error('状态切换失败:', error);
  } finally {
    toggleLoading.value[record.id] = false;
  }
};

// 删除
const handleDelete = async (record: ConfigCyberarkInfo) => {
  try {
    await deleteConfigCyberarkInfo(record.id);
    message.success('删除成功');
    handleSearch();
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败';
    message.error(errorMessage);
    console.error('删除失败:', error);
  }
};

// 初始化
onMounted(() => {
  fetchComponentOptions();
  handleSearch();
});
</script>

<style lang="scss" scoped>
.cyberark-security {
  padding: 24px;

  :deep(.ant-btn-link) {
    padding: 0 4px;

    &[status='danger'] {
      color: #ff4d4f;

      &:hover {
        color: #ff7875;
      }
    }
  }

  :deep(.ant-switch) {
    &.ant-switch-checked {
      background-color: #1677ff !important;
      border-color: #1677ff !important;
    }

    &:not(.ant-switch-checked) {
      background-color: #d9d9d9 !important;
      border-color: #d9d9d9 !important;
    }
  }
}
</style>

