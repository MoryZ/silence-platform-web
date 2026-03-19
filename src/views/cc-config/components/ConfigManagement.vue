<template>
  <div class="config-management">
    <CommonPagination
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :row-key="'id'"
      v-model:pageNo="innerPagination.pageNo"
      v-model:pageSize="innerPagination.pageSize"
      :total="pagination.total"
      :table-props="{ rowSelection: { selectedRowKeys, onChange: onSelectChange } }"
      @change="handleCommonChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- 发布状态列 -->
        <template v-if="column.dataIndex === 'namespaceStatus'">
          <a-tag :color="STATUS_MAP[record.namespaceStatus]?.color || 'default'">
            {{ STATUS_MAP[record.namespaceStatus]?.text || '未知' }}
          </a-tag>
        </template>

        <!-- 监听设备列 -->
        <template v-if="column.dataIndex === 'ips'">
          <span v-if="record.ips">{{ record.ips }}</span>
          <span v-else class="text-muted">-</span>
        </template>

        <!-- 格式类型列 -->
        <template v-if="column.dataIndex === 'formatType'">
          {{ FORMAT_MAP[record.formatType] || '未知' }}
        </template>

        <!-- 类型列 -->
        <template v-if="column.dataIndex === 'type'">
          {{ TYPE_MAP[record.type] || '未知' }}
        </template>

        <!-- 操作列 -->
        <template v-if="column.dataIndex === 'action'">
          <div class="action-buttons">
            <a-button type="link" @click="handleView(record)">查看</a-button>
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" status="danger" @click="handleDelete(record)">删除</a-button>
            <a-button type="link" @click="handleViewReleaseHistory(record)">发布历史</a-button>
            <a-button type="link" @click="handlePublish(record)">发布</a-button>
          </div>
        </template>
      </template>
    </CommonPagination>

    <!-- 表格下方操作按钮 -->
    <div class="bottom-actions">
      <a-button type="primary" @click="handleCloneNamespace">克隆命名空间</a-button>
      <a-button :disabled="selectedRowKeys.length === 0" @click="handleCompare">比较配置</a-button>
      <a-button @click="handleSync">同步配置</a-button>
      <a-button type="primary" :disabled="!selectedRowKeys.length" @click="handleBatchPublish">批量发布</a-button>
    </div>

    <!-- 新增配置弹窗 -->
    <AddConfigModal
      v-model:open="showAddConfigModal"
      :environment-id="activeTabKey"
      @success="handleRefreshData"
    />

    <!-- 克隆命名空间弹窗 -->
    <CloneNamespaceModal
      v-model:open="showCloneModal"
      :source-environment-id="activeTabKey"
      :source-environment-name="currentEnvironment?.name || ''"
      :target-environments="targetEnvironments"
      @success="handleRefreshData"
    />

    <!-- 比较配置弹窗 -->
    <CompareConfigModal
      v-model:open="showCompareModal"
      :loading="compareLoading"
      :source-item="selectedItems[0]"
      :source-environment-name="currentEnvironment?.name || ''"
      :target-environments="targetEnvironments"
      @confirm="handleCompareConfirm"
    />

    <!-- 同步配置弹窗 -->
    <SyncConfigModal
      v-model:open="showSyncModal"
      :loading="syncLoading"
      :source-item="selectedItems[0]"
      :source-environment-name="currentEnvironment?.name || ''"
      :target-environments="targetEnvironments"
      @confirm="handleSyncConfirm"
    />

    <!-- 配置比较结果弹窗 -->
    <ConfigDiffModal
      v-model:open="showCompareDiffModal"
      :source-env-name="currentEnvironment?.name || ''"
      :target-env-name="targetEnvName"
      :namespace-id="compareNamespaceId"
      :left-content="leftContent"
      :right-content="rightContent"
    />

    <!-- 代码编辑器 -->
    <CodeEditor
      :open="showEditor"
      :title="editorTitle"
      :content="editorContent"
      :read-only="editorReadOnly"
      :env-name="envName"
      :history-list="modifyHistoryList"
      @cancel="showEditor = false"
      @save="handleSave"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import CommonPagination from '@/components/CommonPagination.vue';
import CodeEditor from '@/components/CodeEditor.vue';
import AddConfigModal from './modals/AddConfigModal.vue';
import CloneNamespaceModal from './modals/CloneNamespaceModal.vue';
import CompareConfigModal from './modals/CompareConfigModal.vue';
import SyncConfigModal from './modals/SyncConfigModal.vue';
import ConfigDiffModal from './modals/ConfigDiffModal.vue';
import { useConfigOperations } from './composables/useConfigOperations';
import { STATUS_MAP, FORMAT_MAP, TYPE_MAP, TABLE_COLUMNS } from './constants/configConstants';
import { getConfigItemById, getConfigItemList } from '@/api/config/configItem';
import type { ConfigItem, ConfigEnvironment } from '@/types/config';

interface Props {
  dataSource: ConfigItem[];
  pagination: { pageNo: number; pageSize: number; total: number };
  loading: boolean;
  environments: ConfigEnvironment[];
  activeTabKey: string | number;
  targetEnvironments: ConfigEnvironment[];
}

interface Emits {
  (e: 'update:dataSource', data: ConfigItem[]): void;
  (e: 'update:pagination', data: { pageNo: number; pageSize: number }): void;
  (e: 'view-release-history', record: ConfigItem): void;
  (e: 'publish', record: ConfigItem): void;
  (e: 'refresh-data'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 表格列定义
const columns = TABLE_COLUMNS;

// 表格选择相关
const selectedRowKeys = ref<number[]>([]);
const selectedItems = ref<ConfigItem[]>([]);

const onSelectChange = (keys: number[], rows: ConfigItem[]) => {
  selectedRowKeys.value = keys;
  selectedItems.value = rows;
};

// 使用配置操作 Composable
const {
  showEditor,
  editorTitle,
  editorContent,
  editorReadOnly,
  modifyHistoryList,
  handleView,
  handleEdit,
  handleDelete,
  handleSave,
  handleViewReleaseHistory,
  handlePublish,
} = useConfigOperations(emit);

// 新增配置相关
const showAddConfigModal = ref(false);

// 克隆命名空间相关
const showCloneModal = ref(false);

// 比较配置相关
const showCompareModal = ref(false);
const showCompareDiffModal = ref(false);
const compareLoading = ref(false);
const compareNamespaceId = ref('');
const leftContent = ref('');
const rightContent = ref('');
const targetEnvName = ref('');

// 同步配置相关
const showSyncModal = ref(false);
const syncLoading = ref(false);

// 计算属性
const currentEnvironment = computed(() => 
  props.environments.find(env => env.id === Number(props.activeTabKey))
);

const envName = computed(() => 
  props.environments.find(env => env.id === Number(props.activeTabKey))?.displayName
);

// 内部分页用于双向绑定
const innerPagination = ref({ 
  pageNo: props.pagination.pageNo, 
  pageSize: props.pagination.pageSize 
});

watch(() => props.pagination, (val) => {
  innerPagination.value.pageNo = val.pageNo;
  innerPagination.value.pageSize = val.pageSize;
});

// 处理分页变化
const handleCommonChange = (pageNo: number, pageSize: number) => {
  emit('update:pagination', { pageNo, pageSize });
  emit('refresh-data');
};

// 处理新增
const handleAdd = () => {
  showAddConfigModal.value = true;
};

// 处理克隆命名空间
const handleCloneNamespace = () => {
  if (!currentEnvironment.value) {
    message.error('请先选择环境');
    return;
  }
  showCloneModal.value = true;
};

// 处理比较配置
const handleCompare = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请至少选择一条记录');
    return;
  }
  
  const selectedItem = selectedItems.value[0];
  if (!selectedItem) {
    message.error('未找到选中的配置项');
    return;
  }
  
  showCompareModal.value = true;
};

// 处理比较配置确认
const handleCompareConfirm = async (data: { targetItem: ConfigItem; targetEnvironmentName: string }) => {
  try {
    compareLoading.value = true;
    const selectedItem = selectedItems.value[0];
    
    // 直接使用已选中的源配置项和传入的目标配置项，无需再查询
    const sourceConfig = selectedItem;
    const targetConfig = data.targetItem;
    
    // 设置比较数据
    compareNamespaceId.value = data.targetItem.namespaceId;
    leftContent.value = sourceConfig.content || '';
    rightContent.value = targetConfig?.content || '';
    targetEnvName.value = data.targetEnvironmentName;
    
    // 显示差异对比弹窗
    showCompareModal.value = false;
    showCompareDiffModal.value = true;
  } catch (error) {
    console.error('比较配置失败:', error);
    message.error('比较配置失败');
  } finally {
    compareLoading.value = false;
  }
};

// 处理同步配置
const handleSync = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先选择要同步的配置项');
    return;
  }
  showSyncModal.value = true;
};

// 处理同步配置确认
const handleSyncConfirm = async (data: { targetEnvironmentId: number; targetNamespaceIds: string[]; conflictStrategy: number }) => {
  try {
    syncLoading.value = true;
    const selectedItem = selectedItems.value[0];
    
    // 导入 syncNamespace API
    const { syncNamespace } = await import('@/api/config/configNamespace');
    
    // 调用同步配置接口
    await syncNamespace({
      sourceConfigItemId: selectedItem.id,
      targetEnvironmentId: data.targetEnvironmentId,
      targetNamespaceIds: data.targetNamespaceIds,
      conflictStrategy: data.conflictStrategy
    });
    
    message.success('同步配置成功');
    showSyncModal.value = false;
    emit('refresh-data');
  } catch (error) {
    console.error('同步配置失败:', error);
    message.error('同步配置失败');
  } finally {
    syncLoading.value = false;
  }
};

// 处理批量发布
const handleBatchPublish = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先选择要发布的配置项');
    return;
  }
  console.log('批量发布选中的配置项:', selectedRowKeys.value);
  message.info('批量发布功能开发中...');
};

// 处理刷新数据
const handleRefreshData = () => {
  emit('refresh-data');
};

// 暴露给父组件的方法
function openAddModal() {
  if (!props.activeTabKey) {
    message.warning('请先选择环境');
    return;
  }
  handleAdd();
}

defineExpose({ openAddModal });
</script>

<style lang="scss" scoped>
.config-management {
  .bottom-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    
    .ant-btn {
      padding: 0 4px;
      height: 22px;
      line-height: 22px;
      
      &[status="danger"] {
        color: #ff4d4f;
        
        &:hover {
          color: #ff7875;
        }
      }
    }
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-style: italic;
  }
}
</style>
