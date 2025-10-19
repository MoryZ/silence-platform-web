<template>
  <div class="publish-management">
    <!-- 发布弹窗 -->
    <a-modal
      v-model:open="showPublishModal"
      title="发布"
      ok-text="下一步"
      cancel-text="取消"
      @ok="handlePublishSubmit"
      @cancel="handlePublishCancel"
      :width="800"
    >
      <a-form :model="publishForm" :rules="publishRules" ref="publishFormRef">
        <a-form-item label="发布名称" name="releaseName" required>
          <a-input 
            v-model:value="publishForm.releaseName" 
            placeholder="请输入发布名称"
            :maxlength="30"
            show-count
          />
        </a-form-item>
        
        <a-form-item label="发布类型" name="releaseType" required>
          <a-radio-group v-model:value="publishForm.releaseType">
            <a-radio :value="1">普通发布</a-radio>
            <a-radio :value="2">灰度发布</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="下发策略" name="distributionStrategy" required>
          <a-radio-group v-model:value="publishForm.distributionStrategy">
            <a-radio :value="1">立即下发</a-radio>
            <a-radio :value="2">自定义时间</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item v-if="publishForm.distributionStrategy === 2" label="发布时间" name="publishTime">
          <a-date-picker 
            v-model:value="publishForm.publishTime"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择发布时间"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="神兵版本" name="weaponVersion">
          <a-select
            v-model:value="publishForm.weaponVersion"
            placeholder="请选择"
            allow-clear
            style="width: 100%"
          >
            <a-select-option value="v1.0.0">v1.0.0</a-select-option>
            <a-select-option value="v1.1.0">v1.1.0</a-select-option>
            <a-select-option value="v1.2.0">v1.2.0</a-select-option>
            <a-select-option value="v2.0.0">v2.0.0</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="配置比对">
          <div class="compare-section">
            <div class="compare-controls">
              <a-form-item label="环境信息" name="targetEnvironmentId" required>
                <a-select
                  v-model:value="publishForm.targetEnvironmentId"
                  placeholder="请选择环境"
                  @change="handleTargetEnvironmentChange"
                  style="width: 200px"
                >
                  <a-select-option
                    v-for="env in targetEnvironments"
                    :key="env.id"
                    :value="env.id"
                  >
                    {{ env.displayName }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              
              <a-form-item label="命名空间" name="targetNamespaceId" required>
                <a-select
                  v-model:value="publishForm.targetNamespaceId"
                  placeholder="请选择命名空间"
                  style="width: 200px"
                >
                  <a-select-option
                    v-for="item in targetConfigItems"
                    :key="item.id"
                    :value="item.namespaceId"
                  >
                    {{ item.namespaceId }}
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-button type="primary" @click="handleCompare">比对</a-button>
            </div>

            <div v-if="showCompareResult" class="compare-result">
              <div class="editor-container">
                <h4>当前配置</h4>
                <div ref="currentContentEditor" class="monaco-editor"></div>
              </div>
              <div class="editor-container">
                <h4>目标配置</h4>
                <div ref="targetContentEditor" class="monaco-editor"></div>
              </div>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量发布弹窗 -->
    <a-modal
      v-model:open="showBatchPublishModal"
      title="批量发布"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleBatchPublishSubmit"
      @cancel="showBatchPublishModal = false"
      :confirmLoading="batchPublishLoading"
      :width="800"
    >
      <a-form :model="batchPublishForm" ref="batchPublishFormRef">
        <a-form-item label="发布名称" name="releaseName" :rules="[{ required: true, message: '请输入发布名称' }]">
          <a-input v-model:value="batchPublishForm.releaseName" placeholder="请输入发布名称" />
        </a-form-item>
        <a-form-item label="发布类型" name="releaseType" :rules="[{ required: true, message: '请选择发布类型' }]">
          <a-radio-group v-model:value="batchPublishForm.releaseType">
            <a-radio :value="1">普通发布</a-radio>
            <a-radio :value="2">灰度发布</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="选中的配置项">
          <a-table
            :columns="selectedItemColumns"
            :data-source="selectedItems"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'namespaceStatus'">
                <a-tag :color="statusMap[record.namespaceStatus]?.color || 'default'">
                  {{ statusMap[record.namespaceStatus]?.text || '未知' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getConfigItems } from '../../../api/config/configItem';
import type { ConfigItem } from '../../../api/config/configItem';
import type { ConfigEnvironment } from '../../../api/config/configEnvironment';
import { batchPublishConfigs } from '../../../api/config/configPublish';
import dayjs from 'dayjs';
import monaco from '../../../utils/monaco';
import { analyzeChanges, getChangeTypeText, getChangeTypeColor } from '../../../utils/changeAnalyzer';

interface Props {
  targetEnvironments: ConfigEnvironment[];
  activeTabKey: string | number;
  selectedItems: ConfigItem[];
}

interface Emits {
  (e: 'refresh-data'): void;
  (e: 'clear-selection'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 发布相关
const showPublishModal = ref(false);
const publishFormRef = ref<FormInstance>();
const currentPublishItem = ref<ConfigItem | null>(null);
const publishForm = ref({
  releaseName: '',
  releaseType: 1,
  distributionStrategy: 1,
  publishTime: null,
  weaponVersion: undefined,
  targetEnvironmentId: undefined,
  targetNamespaceId: undefined
});

const publishRules = {
  releaseName: [{ required: true, message: '请输入发布名称', trigger: 'blur' }],
  releaseType: [{ required: true, message: '请选择发布类型', trigger: 'blur' }],
  distributionStrategy: [{ required: true, message: '请选择下发策略', trigger: 'blur' }],
  publishTime: [{ required: false, message: '请选择发布时间', trigger: 'blur' }],
  targetEnvironmentId: [{ required: true, message: '请选择环境信息', trigger: 'blur' }],
  targetNamespaceId: [{ required: true, message: '请选择命名空间', trigger: 'blur' }]
};

// 比对相关
const targetConfigItems = ref<ConfigItem[]>([]);
const showCompareResult = ref(false);
const currentContentEditor = ref<HTMLElement | null>(null);
const targetContentEditor = ref<HTMLElement | null>(null);
let currentCompareEditor: any = null;
let targetCompareEditor: any = null;

// 批量发布相关
const showBatchPublishModal = ref(false);
const batchPublishLoading = ref(false);
const batchPublishFormRef = ref<FormInstance>();
const batchPublishForm = ref({
  releaseName: dayjs().format('YYYYMMDDHHmm') + '-batch-release',
  releaseType: 1
});

// 状态映射
const statusMap = {
  1: { text: '已保存', color: 'warning' },
  2: { text: '已发布', color: 'success' },
};

// 选中项表格列定义
const selectedItemColumns = [
  {
    title: '命名空间',
    dataIndex: 'namespaceId',
    width: '40%',
  },
  {
    title: '发布状态',
    dataIndex: 'namespaceStatus',
    width: '30%',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedDate',
    width: '30%',
  }
];

// 打开发布弹窗
const openPublishModal = (record: ConfigItem) => {
  currentPublishItem.value = record;
  publishForm.value.releaseName = `${dayjs().format('YYYYMMDDHHmm')}-release`;
  publishForm.value.releaseType = 1;
  publishForm.value.distributionStrategy = 1;
  publishForm.value.publishTime = null;
  publishForm.value.weaponVersion = undefined;
  publishForm.value.targetEnvironmentId = undefined;
  publishForm.value.targetNamespaceId = undefined;
  showPublishModal.value = true;
};

// 打开批量发布弹窗
const openBatchPublishModal = () => {
  showBatchPublishModal.value = true;
};

// 处理目标环境变化
const handleTargetEnvironmentChange = async (value: number) => {
  if (!value) return;
  publishForm.value.targetNamespaceId = undefined;
  targetConfigItems.value = [];
  
  try {
    const response = await getConfigItems({
      pageNo: 1,
      pageSize: 100,
      configEnvironmentId: value
    });
    targetConfigItems.value = response?.data || [];
  } catch (error) {
    message.error('获取配置项列表失败');
  }
};

// 处理比对
const handleCompare = async () => {
  if (!publishForm.value.targetEnvironmentId || !publishForm.value.targetNamespaceId) {
    message.warning('请选择目标环境和命名空间');
    return;
  }

  // 获取目标配置内容
  const targetContent = targetConfigItems.value.find(
    item => item.namespaceId === publishForm.value.targetNamespaceId
  )?.content || '';
  
  const currentContent = currentPublishItem.value?.content || '';

  // 分析变更
  const changeAnalysis = analyzeChanges(currentContent, targetContent);
  
  console.log('配置比对分析结果:', {
    type: changeAnalysis.type,
    summary: changeAnalysis.summary,
    changes: changeAnalysis.changes
  });

  // 显示变更信息
  const changeTypeText = getChangeTypeText(changeAnalysis.type);
  const changeSummary = changeAnalysis.summary;
  
  let changeMessage = `配置比对结果: ${changeTypeText}`;
  if (changeSummary.totalChanges > 0) {
    changeMessage += `\n变更统计: 新增${changeSummary.addedLines}行, 删除${changeSummary.removedLines}行, 修改${changeSummary.changedLines}行`;
  } else {
    changeMessage += '\n两个配置内容完全相同';
  }

  message.info({
    content: changeMessage,
    duration: 5
  });

  // 初始化编辑器
  await nextTick();
  initCompareEditors();
  showCompareResult.value = true;
};

// 初始化比对编辑器
const initCompareEditors = () => {
  if (!currentContentEditor.value || !targetContentEditor.value) return;

  if (currentCompareEditor) {
    currentCompareEditor.dispose();
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
  }

  // 初始化当前配置编辑器
  currentCompareEditor = monaco.editor.create(currentContentEditor.value, {
    value: currentPublishItem.value?.content || '',
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });

  // 初始化目标配置编辑器
  const targetContent = targetConfigItems.value.find(
    item => item.namespaceId === publishForm.value.targetNamespaceId
  )?.content || '';

  targetCompareEditor = monaco.editor.create(targetContentEditor.value, {
    value: targetContent,
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14
  });
};

// 处理发布提交
const handlePublishSubmit = async () => {
  try {
    await publishFormRef.value?.validate();
    
    // 验证自定义时间发布
    if (publishForm.value.distributionStrategy === 2 && !publishForm.value.publishTime) {
      message.error('请选择发布时间');
      return;
    }
    
    // 验证发布时间不能早于当前时间
    if (publishForm.value.distributionStrategy === 2 && publishForm.value.publishTime) {
      const now = dayjs();
      const publishTime = dayjs(publishForm.value.publishTime);
      if (publishTime.isBefore(now)) {
        message.error('发布时间不能早于当前时间');
        return;
      }
    }
    
    // 准备发布数据
    const publishData = {
      configItemId: currentPublishItem.value?.id,
      releaseName: publishForm.value.releaseName,
      releaseType: publishForm.value.releaseType,
      distributionStrategy: publishForm.value.distributionStrategy,
      publishTime: publishForm.value.publishTime ? dayjs(publishForm.value.publishTime).format('YYYY-MM-DD HH:mm:ss') : null,
      weaponVersion: publishForm.value.weaponVersion,
      targetEnvironmentId: publishForm.value.targetEnvironmentId,
      targetNamespaceId: publishForm.value.targetNamespaceId
    };
    
    console.log('发布数据:', publishData);
    
    // TODO: 调用发布接口
    // await publishConfig(publishData);
    
    message.success('发布成功');
    showPublishModal.value = false;
    resetPublishForm();
    emit('refresh-data');
  } catch (error) {
    console.error('发布失败:', error);
    message.error('发布失败，请重试');
  }
};

// 处理发布取消
const handlePublishCancel = () => {
  showPublishModal.value = false;
  resetPublishForm();
};

// 重置发布表单
const resetPublishForm = () => {
  publishForm.value = {
    releaseName: '',
    releaseType: 1,
    distributionStrategy: 1,
    publishTime: null,
    weaponVersion: undefined,
    targetEnvironmentId: undefined,
    targetNamespaceId: undefined
  };
  showCompareResult.value = false;
  currentPublishItem.value = null;
  targetConfigItems.value = [];
  
  if (currentCompareEditor) {
    currentCompareEditor.dispose();
    currentCompareEditor = null;
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
    targetCompareEditor = null;
  }
};

// 处理批量发布提交
const handleBatchPublishSubmit = async () => {
  try {
    await batchPublishFormRef.value?.validate();
    batchPublishLoading.value = true;
    
    await batchPublishConfigs({
      configItemIds: props.selectedItems.map(item => item.id),
      releaseName: batchPublishForm.value.releaseName,
      releaseType: batchPublishForm.value.releaseType,
      environmentId: Number(props.activeTabKey)
    });
    
    message.success('发布成功');
    showBatchPublishModal.value = false;
    
    // 重置表单和选择
    batchPublishForm.value = {
      releaseName: dayjs().format('YYYYMMDDHHmm') + '-batch-release',
      releaseType: 1
    };
    
    emit('clear-selection');
    emit('refresh-data');
  } catch (error) {
    console.error('批量发布失败:', error);
    message.error('批量发布失败');
  } finally {
    batchPublishLoading.value = false;
  }
};

// 组件卸载时清理
onUnmounted(() => {
  if (currentCompareEditor) {
    currentCompareEditor.dispose();
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
  }
});

// 暴露方法给父组件
defineExpose({
  openPublishModal,
  openBatchPublishModal
});
</script>

<style lang="scss" scoped>
.publish-management {
  .compare-section {
    .compare-controls {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 16px;
    }

    .compare-result {
      display: flex;
      gap: 16px;
      margin-top: 16px;

      .editor-container {
        flex: 1;
        display: flex;
        flex-direction: column;

        h4 {
          margin: 0 0 8px 0;
          color: var(--text-color);
        }

        .monaco-editor {
          height: 400px;
          border: 1px solid var(--border-color);
          border-radius: 2px;
        }
      }
    }
  }
}
</style>
