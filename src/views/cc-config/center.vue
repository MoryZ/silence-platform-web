<template>
  <div class="cc-config-center">
    <!-- 环境选择器（置顶，支持添加） -->
    <div v-if="selectedComponents.length && currentEnv" class="environment-selector">
      <div class="env-tabs-wrapper">
        <div class="env-tabs-container">
          <div
            v-for="env in environments"
            :key="env.id"
            :class="['env-tab', { active: activeTabKey === env.id }]"
            @click="handleEnvironmentChange(env.id)"
          >
            <span class="env-tab-name">{{ env.displayName || env.name }}</span>
            <span
              v-if="environments.length > 1"
              class="env-tab-close"
              @click.stop="handleDeleteEnvironment(env.id)"
            >
              <close-outlined />
            </span>
          </div>
          <!-- 如果没有环境，显示创建提示 -->
          <div
            v-if="environments.length === 0"
            class="env-tab empty"
            @click="handleAddEnvironment"
          >
            <span class="env-tab-name">请先创建环境</span>
          </div>
          <!-- 添加环境按钮 -->
          <div class="env-add-btn" @click="handleAddEnvironment">
            <plus-outlined />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 顶部搜索 + 创建配置（位于环境标签下方） -->
    <div class="topbar">
      <div class="filters">
        <a-input
          v-model:value="searchForm.namespaceId"
          placeholder="请输入命名空间关键字"
          style="width: 220px"
          @pressEnter="onSearch"
        />
        <a-input
          v-model:value="searchForm.content"
          placeholder="请输入配置项关键字"
          style="width: 220px; margin-left: 12px"
          @pressEnter="onSearch"
        />
        <a-button type="primary" style="margin-left: 12px" @click="onSearch">搜索</a-button>
        <a-button style="margin-left: 8px" @click="onReset">重置</a-button>
      </div>
      <div class="actions">
        <a-button type="primary" @click="openAddFromChild">创建配置</a-button>
      </div>
    </div>

    <!-- 如果没有环境，显示创建环境提示 -->
    <div v-if="selectedComponents.length && currentEnv && environments.length === 0" class="empty-state">
      <a-empty
        description="暂无环境，请先创建环境"
        :image="false"
      >
        <template #description>
          <div style="margin-bottom: 16px;">
            <p style="font-size: 16px; margin-bottom: 8px;">还没有环境，请先创建环境</p>
            <p style="color: #999; font-size: 14px;">创建环境后才能进行配置管理</p>
          </div>
          <a-button type="primary" @click="handleAddEnvironment">
            创建环境
          </a-button>
        </template>
      </a-empty>
    </div>

    <!-- 配置管理（只在有环境时显示） -->
    <config-management
      ref="childRef"
      v-if="selectedComponents.length && currentEnv && activeTabKey && environments.length > 0"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      :environments="environments"
      :active-tab-key="activeTabKey"
      :target-environments="targetEnvironments"
      @update:data-source="handleDataSourceUpdate"
      @update:pagination="handlePaginationUpdate"
      @view-release-history="handleViewReleaseHistory"
      @publish="handlePublish"
      @refresh-data="fetchData"
      @search-change="handleSearchChange"
    />

    <!-- 发布历史组件 -->
    <ReleaseHistory
      :data-source="dataSource"
      :open="showReleaseHistory"
      :selected-config-item="selectedConfigItemForHistory"
      @close="showReleaseHistory = false"
    />

    <!-- 发布管理组件 -->
    <PublishManagement
      ref="publishManagementRef"
      :target-environments="targetEnvironments"
      :active-tab-key="activeTabKey"
      :selected-items="selectedItems"
      @refresh-data="fetchData"
      @clear-selection="selectedItems = []"
    />

    <!-- 新增环境弹窗 -->
    <a-modal
      v-model:open="showAddEnvironmentModal"
      title="新增环境"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleAddEnvironmentSubmit"
      @cancel="showAddEnvironmentModal = false"
    >
      <a-form
        ref="environmentFormRef"
        :model="newEnvironment"
        :rules="environmentRules"
        layout="vertical"
      >
        <a-form-item label="环境名称" name="name">
          <a-input v-model:value="newEnvironment.name" placeholder="请输入环境名称" />
        </a-form-item>
        <a-form-item label="显示名称" name="displayName">
          <a-input v-model:value="newEnvironment.displayName" placeholder="请输入显示名称" />
        </a-form-item>
        <a-form-item label="环境类型">
          <span>{{ getEnvTypeLabel(currentEnv) }}</span>
        </a-form-item>
      </a-form>
    </a-modal>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue';
import ConfigManagement from './components/ConfigManagement.vue';
import ReleaseHistory from './components/ReleaseHistory.vue';
import PublishManagement from './components/PublishManagement.vue';
import { getConfigItems } from '../../api/config/configItem';
import { getConfigEnvironments, createConfigEnvironment, deleteConfigEnvironment } from '../../api/config/configEnvironment';
import type { ConfigItem } from '../../api/config/configItem';
import type { ConfigEnvironment } from '../../api/config/configEnvironment';
import type { FormInstance } from 'ant-design-vue';

import { useConfigStore } from '../../stores/config';
import { useEnvStore } from '../../stores/env';
// 获取 store 实例
const configStore = useConfigStore();
const envStore = useEnvStore();

// 组件选择相关 - 从 store 获取
const selectedComponents = computed(() => configStore.selectedComponentIds);
const currentEnv = computed(() => envStore.currentEnv);

// 环境相关
const environments = ref<ConfigEnvironment[]>([]);
const activeTabKey = ref<string | number>('');
const targetEnvironments = ref<ConfigEnvironment[]>([]);

// 数据相关
const dataSource = ref<ConfigItem[]>([]);
const loading = ref(false);
const pagination = ref({
  pageNo: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 查询条件
const searchForm = ref<{ namespaceId?: string; content?: string }>({})

// 选择相关
const selectedItems = ref<ConfigItem[]>([]);

// 发布历史相关
const showReleaseHistory = ref(false);
const selectedConfigItemForHistory = ref<ConfigItem | null>(null);

// 发布管理相关
const publishManagementRef = ref<any>();

// 获取环境列表
const fetchEnvironments = async () => {
  if (!selectedComponents.value.length || !currentEnv.value) return;
  
  try {
    const componentId = selectedComponents.value[0];
    const response = await getConfigEnvironments({ 
      configComponentId: componentId, 
      envType: Number(currentEnv.value)
    });
    
    // 处理不同格式的API响应
    let envData = [];
    if (response) {
      if (typeof response === 'object' && response !== null) {
        if ('data' in response && Array.isArray(response.data)) {
          envData = response.data;
        } else if (Array.isArray(response)) {
          envData = response;
        }
      }
    }
    
    const newEnvironments = Array.isArray(envData) ? envData : [];
    environments.value = newEnvironments;
    
    // 设置目标环境（除了当前环境外的其他环境）
    targetEnvironments.value = newEnvironments.filter(env => env.id !== newEnvironments[0]?.id);
    
    if (newEnvironments.length > 0) {
      activeTabKey.value = newEnvironments[0].id;
      await fetchData();
    } else {
      // 如果没有环境，清空 activeTabKey
      activeTabKey.value = 'create-env';
    }
  } catch (error) {
    message.error('获取环境列表失败');
  }
};

// 获取配置项数据
const fetchData = async () => {
  if (!activeTabKey.value) return;
  
  loading.value = true;
  try {
    const response = await getConfigItems({
      pageNo: pagination.value.pageNo,
      pageSize: pagination.value.pageSize,
      configEnvironmentId: Number(activeTabKey.value),
      namespaceId: searchForm.value.namespaceId,
      content: searchForm.value.content
    });
    
    if (response?.data) {
      dataSource.value = response.data;
      pagination.value.total = response.total || 0;
    }
  } catch (error) {
    message.error('获取配置项列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理数据源更新
const handleDataSourceUpdate = (data: ConfigItem[]) => {
  dataSource.value = data;
};

// 处理分页更新
const handlePaginationUpdate = (pag: any) => {
  pagination.value = { ...pagination.value, ...pag };
  fetchData();
};

function onSearch() {
  pagination.value.pageNo = 1
  fetchData()
}

function onReset() {
  searchForm.value = {}
  pagination.value.pageNo = 1
  fetchData()
}

function handleSearchChange(payload: { namespaceId?: string; content?: string }) {
  searchForm.value = { ...payload }
  onSearch()
}

// 处理查看发布历史
const handleViewReleaseHistory = (record: ConfigItem) => {
  console.log('点击查看发布历史，record:', record);
  selectedConfigItemForHistory.value = record;
  showReleaseHistory.value = true;
  console.log('设置 showReleaseHistory 为 true');
};

// 处理发布
const handlePublish = (record: ConfigItem) => {
  publishManagementRef.value?.openPublishModal(record);
};

// 处理组件变化
const handleComponentChange = () => {
  // 组件变化时重置环境和数据
  environments.value = [];
  activeTabKey.value = '';
  dataSource.value = [];
  selectedItems.value = [];
};

// 处理环境变化
const handleEnvChange = () => {
  // 环境变化时重置数据
  environments.value = [];
  activeTabKey.value = '';
  dataSource.value = [];
  selectedItems.value = [];
};

// 获取环境类型标签
const getEnvTypeLabel = (envType: string | null | undefined) => {
  const envTypeMap: Record<string, string> = {
    '1': '开发环境',
    '2': '测试环境',
    '3': '生产环境'
  };
  return envTypeMap[envType || ''] || '未知环境';
};

// 处理环境标签页变化
const handleEnvironmentChange = (key: string | number) => {
  // 如果是创建环境的标签页，不执行数据获取
  if (key === 'create-env') {
    activeTabKey.value = key;
    return;
  }
  activeTabKey.value = key;
  fetchData();
};

// 监听器 - 在所有函数定义之后
watch([selectedComponents, currentEnv], () => {
  if (selectedComponents.value.length && currentEnv.value) {
    fetchEnvironments();
  }
}, { immediate: true });

// 组件挂载时获取数据
onMounted(() => {
  // 初始化时不需要立即获取数据，等组件和环境选择完成后再获取
});

// 打开子组件新增弹窗
const childRef = ref<any>()
function openAddFromChild() {
  if (!childRef.value) {
    message.warning('请先选择组件和环境');
    return;
  }
  if (typeof childRef.value.openAddModal === 'function') {
    childRef.value.openAddModal();
  } else {
    message.error('无法打开新增配置弹窗，请检查组件是否正确加载');
  }
}

// 新增环境相关
const showAddEnvironmentModal = ref(false);
const environmentFormRef = ref<FormInstance>();
const newEnvironment = ref({
  name: '',
  displayName: '',
  envType: Number(currentEnv.value),
  configComponentId: 0,
  display: true
});

const environmentRules = {
  name: [{ required: true, message: '请输入环境名称', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
};

// 处理标签页编辑（新增/删除）
const handleTabEdit = async (targetKey: string | number, action: 'add' | 'remove') => {
  if (action === 'add') {
    handleAddEnvironment();
  } else if (action === 'remove') {
    await handleDeleteEnvironment(targetKey);
  }
};

// 处理新增环境
function handleAddEnvironment() {
  if (!selectedComponents.value.length || !currentEnv.value) {
    message.warning('请先选择组件和环境类型');
    return;
  }
  newEnvironment.value = {
    name: '',
    displayName: '',
    envType: Number(currentEnv.value),
    configComponentId: selectedComponents.value[0],
    display: true
  };
  showAddEnvironmentModal.value = true;
}

// 处理新增环境提交
const handleAddEnvironmentSubmit = async () => {
  try {
    await environmentFormRef.value?.validate();
    
    if (!selectedComponents.value.length) {
      message.error('请先选择组件');
      return;
    }
    
    const params = {
      ...newEnvironment.value,
      configComponentId: selectedComponents.value[0]
    };
    
    const response = await createConfigEnvironment(params);
    if (response) {
      message.success('新增环境成功');
      showAddEnvironmentModal.value = false;
      // 重新获取环境列表
      await fetchEnvironments();
    }
  } catch (error) {
    console.error('新增环境失败:', error);
    if (error && typeof error === 'object' && 'message' in error) {
      message.error(error.message as string || '新增环境失败');
    } else {
      message.error('新增环境失败');
    }
  }
};

// 处理删除环境
const handleDeleteEnvironment = async (targetKey: string | number) => {
  try {
    await deleteConfigEnvironment(Number(targetKey));
    message.success('删除环境成功');
    // 重新获取环境列表
    await fetchEnvironments();
  } catch (error) {
    console.error('删除环境失败:', error);
    message.error('删除环境失败');
  }
};
</script>

<style lang="scss" scoped>
.cc-config-center {
  padding: 24px;
  
  .environment-selector {
    margin-bottom: 24px;
    
    .env-tabs-wrapper {
      background: #fff;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      border: 1px solid #f0f0f0;
    }
    
    .env-tabs-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .env-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: 8px;
      background: #fafafa;
      border: 1px solid #e8e8e8;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      position: relative;
      overflow: hidden;
      
      // 添加微妙的阴影，hover 时增强
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      
      // 激活状态的 hover 效果
      &:hover:not(.empty):not(.active) {
        background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
        border-color: #bfd4f2;
        box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
        transform: translateY(-1px);
        
        .env-tab-name {
          color: #1677ff;
          font-weight: 500;
        }
      }
      
      // 激活状态
      &.active {
        background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
        border-color: #1677ff;
        box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
        transform: translateY(-2px);
        
        .env-tab-name {
          color: #fff;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .env-tab-close {
          color: #fff;
          opacity: 0.9;
          
          &:hover {
            background: rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        // 激活状态的 hover 增强
        &:hover {
          box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
          transform: translateY(-2px) scale(1.02);
        }
      }
      
      // 空状态（提示创建环境）
      &.empty {
        border: 2px dashed #d9d9d9;
        background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
        
        .env-tab-name {
          color: #999;
          font-style: italic;
        }
        
        &:hover {
          border-color: #1677ff;
          background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
          box-shadow: 0 2px 8px rgba(22, 119, 255, 0.15);
          transform: translateY(-1px);
          
          .env-tab-name {
            color: #1677ff;
            font-style: normal;
          }
        }
      }
      
      .env-tab-name {
        font-size: 14px;
        color: #333;
        line-height: 1.5;
      }
      
      .env-tab-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        color: #999;
        transition: all 0.2s;
        border-radius: 50%;
        font-size: 12px;
        
        &:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #333;
        }
      }
    }
    
    .env-add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px dashed #d9d9d9;
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #666;
      font-size: 16px;
      position: relative;
      overflow: hidden;
      
      // 添加微妙的阴影
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      
      &:hover {
        border-color: #1677ff;
        color: #1677ff;
        background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
        box-shadow: 0 4px 12px rgba(22, 119, 255, 0.25);
        transform: translateY(-2px) scale(1.05);
        border-width: 2px;
      }
      
      &:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 4px rgba(22, 119, 255, 0.2);
      }
    }
  }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0 16px 0;
  }

  .empty-state {
    padding: 60px 0;
    text-align: center;
    background: #fff;
    border-radius: 4px;
  }
  
}
</style> 