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
          <a-tag :color="statusMap[record.namespaceStatus]?.color || 'default'">
            {{ statusMap[record.namespaceStatus]?.text || '未知' }}
          </a-tag>
        </template>

        <!-- 监听设备列 -->
        <template v-if="column.dataIndex === 'ips'">
          <span v-if="record.ips">{{ record.ips }}</span>
          <span v-else class="text-muted">-</span>
        </template>

        <!-- 格式类型列 -->
        <template v-if="column.dataIndex === 'formatType'">
          {{ formatMap[record.formatType] || '未知' }}
        </template>

        <!-- 类型列 -->
        <template v-if="column.dataIndex === 'type'">
          {{ typeMap[record.type] || '未知' }}
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

    <!-- 表格下方操作按钮（克隆/比较/同步/批量发布） -->
    <div class="bottom-actions">
      <a-button type="primary" @click="handleCloneNamespace">克隆命名空间</a-button>
      <a-button @click="handleCompare">比较配置</a-button>
      <a-button @click="handleSync">同步配置</a-button>
      <a-button type="primary" :disabled="!selectedRowKeys.length" @click="handleBatchPublish">批量发布</a-button>
    </div>

    <!-- 新增配置弹窗 -->
    <a-modal
      v-model:open="showAddConfigModal"
      title="新增配置"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleAddConfigSubmit"
      @cancel="handleAddConfigCancel"
      :width="800"
      :maskClosable="false"
    >
      <a-form :model="newConfigForm" :rules="configRules" ref="configFormRef">
        <a-form-item label="命名空间类型" name="type">
          <a-radio-group v-model:value="newConfigForm.type">
            <a-radio :value="1">私有</a-radio>
            <a-radio :value="2">公共</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="命名空间ID" name="namespaceId">
          <a-input v-model:value="newConfigForm.namespaceId" placeholder="请输入命名空间ID" />
        </a-form-item>

        <a-form-item label="格式类型" name="formatType">
          <a-select v-model:value="newConfigForm.formatType" placeholder="请选择格式类型">
            <a-select-option :value="1">YML</a-select-option>
            <a-select-option :value="2">Properties</a-select-option>
            <a-select-option :value="3">TXT</a-select-option>
            <a-select-option :value="4">JSON</a-select-option>
            <a-select-option :value="5">XML</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="配置内容" name="content">
          <div ref="addConfigEditor" class="config-editor"></div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 克隆命名空间弹窗 -->
    <a-modal
      v-model:open="showCloneModal"
      title="克隆命名空间"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleCloneSubmit"
      @cancel="showCloneModal = false"
      :confirmLoading="cloneLoading"
    >
      <a-form :model="cloneForm" ref="cloneFormRef">
        <a-form-item label="源环境" name="sourceEnvironmentId">
          <a-input :value="currentEnvironment?.name" disabled />
        </a-form-item>
        <a-form-item label="目标环境" name="targetEnvironmentId" :rules="[{ required: true, message: '请选择目标环境' }]">
          <a-select
            v-model:value="cloneForm.targetEnvironmentId"
            placeholder="请选择目标环境"
          >
            <a-select-option
              v-for="env in targetEnvironments"
              :key="env.id"
              :value="env.id"
            >
              {{ env.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="克隆模式" name="cloneMode" :rules="[{ required: true, message: '请选择克隆模式' }]">
          <a-radio-group v-model:value="cloneForm.cloneMode">
            <a-radio :value="1">覆盖文件</a-radio>
            <a-radio :value="2">跳过同名文件</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 代码编辑器 -->
    <code-editor
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
import { ref, computed, nextTick, onUnmounted, watch, shallowRef } from 'vue';
import { message } from 'ant-design-vue';
import CommonPagination from '@/components/CommonPagination.vue'
import type { FormInstance } from 'ant-design-vue';
import { deleteConfigItem, updateConfigContent, createConfigItem } from '../../../api/config/configItem';
import type { ConfigItem } from '../../../api/config/configItem';
import type { ConfigEnvironment } from '../../../api/config/configEnvironment';
import { cloneNamespace } from '../../../api/config/configNamespace';
import { ConfigItemHistory, getConfigItemHistories } from '../../../api/config/configItemHistories';
import CodeEditor from '../../../components/CodeEditor.vue';
import monaco from '../../../utils/monaco';
import { analyzeChanges, getChangeTypeText, getChangeTypeColor, getOperationType } from '../../../utils/changeAnalyzer';

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

// 暴露“新增配置”方法供父组件调用
function openAddModal() {
  handleAdd()
}
defineExpose({ openAddModal })

function handleCompare() {
  // 预留：比较配置逻辑
  console.log('比较配置')
}

function handleSync() {
  // 预留：同步配置逻辑
  console.log('同步配置')
}

// 表格列定义
const columns = [
  {
    title: '命名空间',
    dataIndex: 'namespaceId',
    width: '20%',
  },
  {
    title: '发布状态',
    dataIndex: 'namespaceStatus',
    width: '10%',
  },
  {
    title: '监听设备',
    dataIndex: 'ips',
    width: '10%',
  },
  {
    title: '格式类型',
    dataIndex: 'formatType',
    width: '10%',
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: '10%',
  },
  {
    title: '操作人',
    dataIndex: 'updatedBy',
    width: '15%',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedDate',
    width: '20%',
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '15%',
    fixed: 'right',
  },
];

// 状态映射
const statusMap: Record<number, { text: string; color: string }> = {
  1: { text: '已保存', color: 'warning' },
  2: { text: '已发布', color: 'success' },
};

// 格式类型映射
const formatMap: Record<number, string> = {
  1: 'YML',
  2: 'Properties',
  3: 'TXT',
  4: 'JSON',
  5: 'XML'
};

// 类型映射
const typeMap: Record<number, string> = {
  1: '私有',
  2: '公共',
};

// 表格选择相关
const selectedRowKeys = ref<number[]>([]);
const selectedItems = ref<ConfigItem[]>([]);

const onSelectChange = (keys: number[], rows: ConfigItem[]) => {
  selectedRowKeys.value = keys;
  selectedItems.value = rows;
};

// 编辑器相关
const showEditor = ref(false);
const editorTitle = ref('');
const editorContent = ref('');
const editorReadOnly = ref(false);
const currentEditItem = ref<ConfigItem | null>(null);
const modifyHistoryList = shallowRef<ConfigItemHistory[]>([]);

// 新增配置相关
const showAddConfigModal = ref(false);
const configFormRef = ref<FormInstance>();
const addConfigEditor = ref<HTMLElement | null>(null);
let configMonacoEditor: any = null;

const newConfigForm = ref({
  type: 1,
  namespaceId: '',
  formatType: 1,
  content: '',
  configEnvironmentId: null as number | null
});

const configRules = {
  type: [{ required: true, message: '请选择命名空间类型', trigger: 'change' }],
  namespaceId: [{ required: true, message: '请输入命名空间ID', trigger: 'blur' }],
  formatType: [{ required: true, message: '请选择格式类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入配置内容', trigger: 'blur' }]
};

// 克隆命名空间相关
const showCloneModal = ref(false);
const cloneLoading = ref(false);
const cloneFormRef = ref<FormInstance>();
const cloneForm = ref({
  targetEnvironmentId: undefined as number | undefined,
  cloneMode: 1
});

// 计算属性
const currentEnvironment = computed(() => 
  props.environments.find(env => env.id === Number(props.activeTabKey))
);

const envName = computed(() => 
  props.environments.find(env => env.id === Number(props.activeTabKey))?.displayName
);

// 内部分页用于双向绑定 CommonPagination
const innerPagination = ref({ pageNo: props.pagination.pageNo, pageSize: props.pagination.pageSize })

watch(() => props.pagination, (val) => {
  innerPagination.value.pageNo = val.pageNo
  innerPagination.value.pageSize = val.pageSize
})

const handleCommonChange = (pageNo: number, pageSize: number) => {
  emit('update:pagination', { pageNo, pageSize })
  emit('refresh-data')
}

// 处理查看
const handleView = async (record: ConfigItem) => {
  currentEditItem.value = null;
  editorTitle.value = `查看配置 - ${record.namespaceId}`;
  editorContent.value = record.content || '';
  editorReadOnly.value = true;
  showEditor.value = true;

  // 获取修改历史
  await fetchModifyHistories(record.id);
};

// 处理编辑
const handleEdit = async (record: ConfigItem) => {
  currentEditItem.value = record;
  editorTitle.value = `编辑配置 - ${record.namespaceId}`;
  editorContent.value = record.content || '';
  editorReadOnly.value = false;
  showEditor.value = true;

  // 获取修改历史
  await fetchModifyHistories(record.id);
};

// 处理删除
const handleDelete = async (record: ConfigItem) => {
  try {
    await deleteConfigItem(record.id);
    message.success('删除成功');
    emit('refresh-data');
  } catch (error) {
    message.error('删除失败');
  }
};

// 处理查看发布历史
const handleViewReleaseHistory = (record: ConfigItem) => {
  emit('view-release-history', record);
};

// 处理发布
const handlePublish = (record: ConfigItem) => {
  emit('publish', record);
};

// 处理新增
const handleAdd = () => {
  newConfigForm.value.configEnvironmentId = Number(props.activeTabKey);
  showAddConfigModal.value = true;
  nextTick(() => {
    initConfigEditor();
  });
};

// 处理克隆命名空间
const handleCloneNamespace = () => {
  if (!currentEnvironment.value) {
    message.error('请先选择环境');
    return;
  }
  showCloneModal.value = true;
};

// 处理克隆提交
const handleCloneSubmit = async () => {
  try {
    await cloneFormRef.value?.validate();
    cloneLoading.value = true;
    
    await cloneNamespace({
      sourceEnvironmentId: Number(props.activeTabKey),
      targetEnvironmentId: cloneForm.value.targetEnvironmentId!,
      cloneMode: cloneForm.value.cloneMode
    });
    
    message.success('克隆成功');
    showCloneModal.value = false;
    
    // 重置表单
    cloneForm.value = {
      targetEnvironmentId: undefined,
      cloneMode: 1
    };
    
    // 刷新数据
    emit('refresh-data');
  } catch (error) {
    console.error('克隆失败:', error);
    message.error('克隆失败');
  } finally {
    cloneLoading.value = false;
  }
};

// 处理批量发布
const handleBatchPublish = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请先选择要发布的配置项');
    return;
  }
  // 这里可以触发批量发布事件
  console.log('批量发布选中的配置项:', selectedRowKeys.value);
};

// 获取修改历史
const fetchModifyHistories = async (configItemId: number) => {
  try {
    console.log('开始获取修改历史，configItemId:', configItemId);
    const response = await getConfigItemHistories({
      configItemId: configItemId
    });
    console.log('获取修改历史响应:', response);

    // 使用 requestAnimationFrame 确保在下一个渲染周期更新
    requestAnimationFrame(() => {
      if (response) {
        modifyHistoryList.value = response;
        console.log('设置修改历史列表:', response);
      } else {
        modifyHistoryList.value = [];
        console.log('响应为空，清空修改历史列表');
      }
    });
  } catch (error) {
    console.error('获取修改历史失败:', error);
    message.error('获取修改历史失败');
  }
};

// 处理保存
const handleSave = async (content: string) => {
  if (!currentEditItem.value) {
    message.error('未找到要编辑的配置项');
    return;
  }

  try {
    // 分析变更
    const oldContent = currentEditItem.value.content || '';
    const changeAnalysis = analyzeChanges(oldContent, content);
    
    console.log('变更分析结果:', {
      type: changeAnalysis.type,
      summary: changeAnalysis.summary,
      changes: changeAnalysis.changes
    });


    // 如果内容未变更，直接提示并返回
    if (changeAnalysis.type === 'unchanged') {
      message.info('您未变更任何内容，无需保存');
      showEditor.value = false;
      return;
    }

    // 根据变更类型设置 operationType
    const operationType = getOperationType(changeAnalysis.type);

    // 显示变更信息
    const changeTypeText = getChangeTypeText(changeAnalysis.type);
    const changeSummary = changeAnalysis.summary;
    
    let changeMessage = `变更类型: ${changeTypeText}`;
    if (changeSummary.totalChanges > 0) {
      changeMessage += `\n变更统计: 新增${changeSummary.addedLines}行, 删除${changeSummary.removedLines}行, 修改${changeSummary.changedLines}行`;
    }

    // 执行保存
    await updateConfigContent(currentEditItem.value.id, content, operationType);
    
    // 显示成功消息，包含变更信息
    message.success({
      content: `保存成功！\n${changeMessage}`,
      duration: 4
    });
    
    showEditor.value = false;
    emit('refresh-data');
  } catch (error) {
    message.error('保存失败');
  }
};

// 初始化配置编辑器
const initConfigEditor = () => {
  if (!addConfigEditor.value) return;

  if (configMonacoEditor) {
    configMonacoEditor.dispose();
  }

  configMonacoEditor = monaco.editor.create(addConfigEditor.value, {
    value: newConfigForm.value.content,
    language: getLanguage(newConfigForm.value.formatType),
    theme: 'vs-dark',
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });

  // 监听编辑器内容变化
  configMonacoEditor.onDidChangeModelContent(() => {
    newConfigForm.value.content = configMonacoEditor.getValue();
  });
};

// 获取编辑器语言
const getLanguage = (formatType: number): string => {
  const languageMap: Record<number, string> = {
    1: 'yaml',
    2: 'properties',
    3: 'plaintext',
    4: 'json',
    5: 'xml'
  };
  return languageMap[formatType] || 'plaintext';
};

// 处理新增配置提交
const handleAddConfigSubmit = async () => {
  try {
    await configFormRef.value?.validate();
    const params = {
      type: newConfigForm.value.type,
      namespaceId: newConfigForm.value.namespaceId,
      formatType: newConfigForm.value.formatType,
      content: configMonacoEditor.getValue(),
      configEnvironmentId: Number(props.activeTabKey),
      namespaceStatus: 1, // 默认为已保存状态
    };
    await createConfigItem(params);
    message.success('新增配置成功');
    showAddConfigModal.value = false;
    resetConfigForm();
    emit('refresh-data');
  } catch (error) {
    console.error('新增配置失败:', error);
    message.error('新增配置失败');
  }
};

// 处理新增配置取消
const handleAddConfigCancel = () => {
  showAddConfigModal.value = false;
  resetConfigForm();
};

// 重置新增配置表单
const resetConfigForm = () => {
  newConfigForm.value = {
    type: 1,
    namespaceId: '',
    formatType: 1,
    content: '',
    configEnvironmentId: null
  };
  if (configMonacoEditor) {
    configMonacoEditor.dispose();
  }
};

// 在组件卸载时清理编辑器实例
onUnmounted(() => {
  if (configMonacoEditor) {
    configMonacoEditor.dispose();
  }
});
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

  .config-editor {
    height: 400px;
    border: 1px solid var(--border-color);
    border-radius: 2px;
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-style: italic;
  }
}
</style>
