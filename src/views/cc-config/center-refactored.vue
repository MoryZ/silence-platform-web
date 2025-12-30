<template>
  <div class="cc-config-center">
    <!-- 环境选择器 -->
    <EnvironmentTabs
      :environments="environments"
      :active-tab-key="activeTabKey"
      :selected-components="selectedComponents"
      :current-env="currentEnv"
      @change="handleEnvironmentChange"
      @delete="handleDeleteEnvironment"
      @add="handleAddEnvironment"
    />

    <!-- 顶部搜索 + 创建配置 -->
    <TopSearchBar
      :initial-search="searchForm"
      @search="handleSearch"
      @reset="handleReset"
      @create="openAddFromChild"
    />

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

    <!-- 配置管理 -->
    <ConfigManagement
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
      :open="showAddEnvironmentModal"
      title="新增环境"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleAddEnvironmentSubmit"
      @cancel="closeEnvironmentModal"
      @update:open="closeEnvironmentModal"
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
import ConfigManagement from './components/ConfigManagement.vue';
import ReleaseHistory from './components/ReleaseHistory.vue';
import PublishManagement from './components/PublishManagement.vue';
import EnvironmentTabs from './components/EnvironmentTabs.vue';
import TopSearchBar from './components/TopSearchBar.vue';
import { useConfigStore } from '@/stores/config';
import { useEnvStore } from '@/stores/env';
import { useEnvironmentManagement } from './composables/useEnvironmentManagement';
import { useConfigData } from './composables/useConfigData';
import type { ConfigItem } from '@/api/config/configItem';

// 获取 store 实例
const configStore = useConfigStore();
const envStore = useEnvStore();

// 组件选择相关 - 从 store 获取
const selectedComponents = computed(() => configStore.selectedComponentIds);
const currentEnv = computed(() => envStore.currentEnv);

// 使用环境管理 Composable
const {
  showAddEnvironmentModal,
  environmentFormRef,
  newEnvironment,
  environmentRules,
  openAddEnvironment,
  handleAddEnvironment: addEnvironment,
  handleDeleteEnvironment: deleteEnvironment,
  closeModal: closeEnvironmentModal,
} = useEnvironmentManagement();

// 使用配置数据 Composable
const {
  dataSource,
  loading,
  environments,
  targetEnvironments,
  pagination,
  searchForm,
  fetchEnvironments,
  fetchData: fetchConfigData,
  handleSearch: searchConfigData,
  handleReset: resetSearchData,
  handlePaginationChange,
  updateDataSource,
} = useConfigData();

const activeTabKey = ref<string | number>('');
const selectedItems = ref<ConfigItem[]>([]);
const showReleaseHistory = ref(false);
const selectedConfigItemForHistory = ref<ConfigItem | null>(null);
const publishManagementRef = ref<any>();
const childRef = ref<any>();

/**
 * 获取环境列表
 */
const fetchEnvironmentsData = async () => {
  if (!selectedComponents.value.length || !currentEnv.value) return;

  const success = await fetchEnvironments(
    selectedComponents.value[0],
    Number(currentEnv.value)
  );

  if (success && environments.value.length > 0) {
    activeTabKey.value = environments.value[0].id;
    await fetchData();
  } else {
    activeTabKey.value = '';
  }
};

/**
 * 获取配置项数据
 */
const fetchData = async () => {
  if (!activeTabKey.value) return;
  await fetchConfigData(Number(activeTabKey.value));
};

/**
 * 处理环境变化
 */
const handleEnvironmentChange = async (envId: number | string) => {
  activeTabKey.value = envId;
  await fetchData();
};

/**
 * 处理删除环境
 */
const handleDeleteEnvironment = async (envId: number | string) => {
  const success = await deleteEnvironment(Number(envId));
  if (success) {
    await fetchEnvironmentsData();
  }
};

/**
 * 处理新增环境
 */
const handleAddEnvironment = () => {
  if (!openAddEnvironment(Number(currentEnv.value), selectedComponents.value[0])) {
    message.warning('请先选择组件和环境类型');
  }
};

/**
 * 处理新增环境提交
 */
const handleAddEnvironmentSubmit = async () => {
  const success = await addEnvironment();
  if (success) {
    await fetchEnvironmentsData();
  }
};

/**
 * 处理搜索
 */
const handleSearch = async (payload: { namespaceId?: string; content?: string }) => {
  if (!activeTabKey.value) return;
  await searchConfigData(payload, Number(activeTabKey.value));
};

/**
 * 处理重置
 */
const handleReset = async () => {
  if (!activeTabKey.value) return;
  await resetSearchData(Number(activeTabKey.value));
};

/**
 * 处理搜索变化
 */
const handleSearchChange = async (payload: { namespaceId?: string; content?: string }) => {
  await handleSearch(payload);
};

/**
 * 处理数据源更新
 */
const handleDataSourceUpdate = (data: ConfigItem[]) => {
  updateDataSource(data);
};

/**
 * 处理分页更新
 */
const handlePaginationUpdate = async (pag: any) => {
  await handlePaginationChange(pag.pageNo, pag.pageSize, Number(activeTabKey.value));
};

/**
 * 处理查看发布历史
 */
const handleViewReleaseHistory = (record: ConfigItem) => {
  selectedConfigItemForHistory.value = record;
  showReleaseHistory.value = true;
};

/**
 * 处理发布
 */
const handlePublish = (record: ConfigItem) => {
  publishManagementRef.value?.openPublishModal(record);
};

/**
 * 打开子组件新增弹窗
 */
const openAddFromChild = () => {
  if (!childRef.value) {
    message.warning('请先选择组件和环境');
    return;
  }
  if (typeof childRef.value.openAddModal === 'function') {
    childRef.value.openAddModal();
  } else {
    message.error('无法打开新增配置弹窗，请检查组件是否正确加载');
  }
};

/**
 * 获取环境类型标签
 */
const getEnvTypeLabel = (envType: string | null | undefined) => {
  const envTypeMap: Record<string, string> = {
    '1': '开发环境',
    '2': '测试环境',
    '3': '生产环境'
  };
  return envTypeMap[envType || ''] || '未知环境';
};

/**
 * 监听器
 */
watch([selectedComponents, currentEnv], () => {
  if (selectedComponents.value.length && currentEnv.value) {
    fetchEnvironmentsData();
  }
}, { immediate: true });

/**
 * 组件挂载
 */
onMounted(() => {
  // 初始化不需要立即获取数据
});
</script>

<style lang="scss" scoped>
@import './styles/center.scss';
</style>
