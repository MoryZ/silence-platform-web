<template>
  <div class="job-group-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-select
            v-model:value="searchForm.configEnvironmentId"
            style="width: 100%"
            :disabled="true"
            placeholder="环境"
          >
            <a-select-option value="1">开发环境</a-select-option>
            <a-select-option value="2">测试环境</a-select-option>
            <a-select-option value="3">生产环境</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-input v-model:value="searchForm.appName" placeholder="请输入AppName" />
        </a-col>
        <a-col :span="6">
          <a-input v-model:value="searchForm.title" placeholder="名称" />
        </a-col>
        
        <a-col :span="3">
          <a-button type="primary" @click="handleSearch">搜索</a-button>
        </a-col>
        <a-col :span="3">
          <a-button type="primary" @click="handleAdd">新增</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 表格 -->
    <div class="table-container">


      <a-table
        :columns="columns"
        :data-source="jobGroupList"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'registryType'">
            {{ record.registryType === 0 ? '自动注册' : '手动注册' }}
          </template>
          <template v-if="column.key === 'onlineAddress'">
            <a-button type="link" @click="handleViewAddress(record)">
              查看({{ record.registryList?.length || 0 }})
            </a-button>
          </template>
          <template v-if="column.key === 'action'">
            <a-dropdown>
              <a-button type="primary">
                操作
                <down-outlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="1" @click="handleEdit(record)">编辑</a-menu-item>
                  <a-menu-item key="2" @click="handleDelete(record)">删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="AppName" required>
          <a-input v-model:value="formData.appName" placeholder="请输入AppName" />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input v-model:value="formData.title" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="注册方式" required>
          <a-select v-model:value="formData.registryType">
            <a-select-option :value="0">自动注册</a-select-option>
            <a-select-option :value="1">手动注册</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          v-if="formData.registryType === 1"
          label="机器地址"
          required
        >
          <a-textarea
            v-model:value="formData.addressList"
            :rows="4"
            placeholder="请输入机器地址，多个地址用逗号分隔"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看机器地址弹窗 -->
    <a-modal
      v-model:visible="addressModalVisible"
      title="地址管理"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleAddressModalOk"
    >
      <div class="address-list">
        <a-list
          :data-source="currentAddressList"
          :bordered="true"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <span class="address-text">{{ item }}</span>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { getJobGroups, createJobGroup, updateJobGroup, deleteJobGroup } from '../../api/jobGroup';
import type { JobGroup } from '../../api/jobGroup';
import { useEnvStore } from '../../stores/env';
import type { EnvType } from '../../stores/env';

// 环境存储
const envStore = useEnvStore();

// 表格列定义
const columns: TableColumnsType = [
  {
    title: 'AppName',
    dataIndex: 'appName',
    key: 'appName',
    width: 200,
  },
  {
    title: '名称',
    dataIndex: 'title',
    key: 'title',
    width: 200,
  },
  {
    title: '注册方式',
    dataIndex: 'registryType',
    key: 'registryType',
    width: 120,
  },
  {
    title: 'OnLine 机器地址',
    key: 'onlineAddress',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
  },
];

// 搜索表单数据
const searchForm = reactive({
  appName: '',
  title: '',
  configEnvironmentId: envStore.currentEnv,
});

// 监听环境变化
watch(
  () => envStore.currentEnv,
  (newEnv) => {
    searchForm.configEnvironmentId = newEnv;
    fetchJobGroupList();
  }
);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 加载状态
const loading = ref(false);

// 执行器列表数据
const jobGroupList = ref<JobGroup[]>([]);

// 模态框相关
const modalVisible = ref(false);
const modalTitle = ref('新增执行器');
const formData = reactive({
  id: 0,
  appName: '',
  title: '',
  registryType: 0,
  addressList: '',
});

// 地址查看模态框
const addressModalVisible = ref(false);
const currentAddressList = ref<string[]>([]);

// 搜索方法
const handleSearch = () => {
  pagination.current = 1;
  fetchJobGroupList();
};

// 新增执行器
const handleAdd = () => {
  modalTitle.value = '新增执行器';
  formData.id = 0;
  formData.appName = '';
  formData.title = '';
  formData.registryType = 0;
  formData.addressList = '';
  modalVisible.value = true;
};

// 编辑执行器
const handleEdit = (record: JobGroup) => {
  modalTitle.value = '编辑执行器';
  formData.id = record.id;
  formData.appName = record.appName;
  formData.title = record.title;
  formData.registryType = record.registryType;
  formData.addressList = record.addressList?.join(',') || '';
  modalVisible.value = true;
};

// 删除执行器
const handleDelete = async (record: JobGroup) => {
  try {
    await deleteJobGroup(record.id);
    message.success('删除执行器成功');
    fetchJobGroupList();
  } catch (error) {
    message.error('删除执行器失败');
  }
};

// 查看机器地址
const handleViewAddress = (record: JobGroup) => {
  currentAddressList.value = record.registryList || [];
  addressModalVisible.value = true;
};

// 处理模态框确认
const handleModalOk = async () => {
  if (!formData.appName || !formData.title) {
    message.error('请填写必填项');
    return;
  }

  if (formData.registryType === 1 && !formData.addressList) {
    message.error('请填写机器地址');
    return;
  }

  try {
    const submitData = {
      ...formData,
      addressList: formData.addressList ? formData.addressList.split(',') : [],
    };

    if (formData.id) {
      await updateJobGroup(formData.id, submitData);
      message.success('编辑执行器成功');
    } else {
      await createJobGroup(submitData);
      message.success('新增执行器成功');
    }

    modalVisible.value = false;
    fetchJobGroupList();
  } catch (error) {
    message.error(formData.id ? '编辑执行器失败' : '新增执行器失败');
  }
};

// 处理模态框取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 处理地址模态框确认
const handleAddressModalOk = () => {
  addressModalVisible.value = false;
};

// 处理表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchJobGroupList();
};

// 获取执行器列表数据
const fetchJobGroupList = async () => {
  loading.value = true;
  try {
    const response = await getJobGroups({
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      appName: searchForm.appName,
      title: searchForm.title,
      configEnvironmentId: searchForm.configEnvironmentId,
    });
    
    if (response.data) {
      jobGroupList.value = response.data.data;
      pagination.total = response.data.total;
    }
  } catch (error) {
    message.error('获取执行器列表失败');
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchJobGroupList();
});
</script>

<style lang="less" scoped>
.job-group-container {
  padding: 24px;
  background: #fff;

  .search-bar {
    margin-bottom: 16px;
  }

  .table-container {
    .table-operations {
      margin-bottom: 16px;
    }
  }

  :deep(.ant-table) {
    .ant-table-cell {
      white-space: nowrap;
    }
  }

  :deep(.ant-table-pagination) {
    margin: 16px 0;
  }

  .address-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
    background: var(--component-background);
    border-radius: 4px;
    border: 1px solid var(--border-color);

    .address-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px;
      background: var(--component-background);
      border-radius: 2px;
      border: 1px solid var(--border-color);

      .address-text {
        flex: 1;
        margin-right: 8px;
        word-break: break-all;
      }

      .address-actions {
        display: flex;
        gap: 8px;
        flex-wrap: nowrap;
        white-space: nowrap;
        
        .ant-btn {
          padding: 0 4px;
          height: 22px;
          line-height: 22px;
        }
      }
    }
  }
}
</style> 