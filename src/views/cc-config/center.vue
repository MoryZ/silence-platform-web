<template>
  <div class="cc-config-center">
    <!-- 环境选择器 -->
    <div v-if="environments.length > 0" class="environment-selector">
      <a-tabs
        v-model:activeKey="activeTabKey"
        type="card"
        @change="handleEnvironmentChange"
      >
        <a-tab-pane
          v-for="env in environments"
          :key="env.id"
          :tab="env.displayName || env.name"
        />
      </a-tabs>
    </div>

    <!-- 配置管理 -->
    <config-management
      v-if="selectedComponents.length && currentEnv && activeTabKey"
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
    />

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import ConfigManagement from './components/ConfigManagement.vue';
import { getConfigItems } from '../../api/config/configItem';
import { getConfigEnvironments } from '../../api/config/configEnvironment';
import type { ConfigItem } from '../../api/config/configItem';
import type { ConfigEnvironment } from '../../api/config/configEnvironment';

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

// 选择相关
const selectedItems = ref<ConfigItem[]>([]);

// 监听器
watch([selectedComponents, currentEnv], () => {
  if (selectedComponents.value.length && currentEnv.value) {
    fetchEnvironments();
  }
}, { immediate: true });

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

// 处理环境标签页变化
const handleEnvironmentChange = (key: string | number) => {
  activeTabKey.value = key;
  fetchData();
};

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
      configEnvironmentId: Number(activeTabKey.value)
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

// 处理查看发布历史
const handleViewReleaseHistory = (record: ConfigItem) => {
  // TODO: 实现查看发布历史功能
  message.info('查看发布历史功能待实现');
};

// 处理发布
const handlePublish = (record: ConfigItem) => {
  // TODO: 实现发布功能
  message.info('发布功能待实现');
};

// 组件挂载时获取数据
onMounted(() => {
  // 初始化时不需要立即获取数据，等组件和环境选择完成后再获取
});
</script>

<style lang="scss" scoped>
.cc-config-center {
  padding: 24px;
  
  .environment-selector {
    margin-bottom: 24px;
    
    :deep(.ant-tabs-card) {
      .ant-tabs-nav {
        margin-bottom: 16px;
        
        .ant-tabs-tab {
          border-radius: 6px 6px 0 0;
          
          &.ant-tabs-tab-active {
            background: var(--primary-1);
            border-color: var(--primary-color);
            
            .ant-tabs-tab-btn {
              color: var(--primary-color);
              font-weight: 500;
            }
          }
        }
      }
    }
  }
  
}
</style> 