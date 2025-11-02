<template>
  <div class="publish-management">
    <!-- 发布弹窗（第一步：填写发布信息） -->
    <a-modal
      v-model:open="showPublishModal"
      title="发布"
      ok-text="下一步"
      cancel-text="取消"
      @ok="handleNextStep"
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

        <!-- 可选：配置比对（与其他环境对比） -->
        <a-form-item label="配置比对（可选）">
          <div class="compare-section">
            <div class="compare-controls">
              <a-form-item label="环境信息" name="targetEnvironmentId">
                <a-select
                  v-model:value="publishForm.targetEnvironmentId"
                  placeholder="请选择环境"
                  @change="handleTargetEnvironmentChange"
                  allow-clear
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
              
              <a-form-item label="命名空间" name="targetNamespaceId">
                <a-select
                  v-model:value="publishForm.targetNamespaceId"
                  placeholder="请选择命名空间"
                  allow-clear
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

    <!-- 配置对比弹窗（第二步：对比当前发布内容与上次发布内容） -->
    <a-modal
      v-model:open="showCompareModal"
      title="配置对比"
      ok-text="确定"
      cancel-text="返回"
      @ok="handlePublishSubmit"
      @cancel="handleCompareCancel"
      :width="1200"
      :confirmLoading="publishLoading"
    >
      <div class="compare-modal-content">
        <div class="editor-container">
          <h4>上次发布内容（旧值）</h4>
          <div ref="historyContentEditor" class="monaco-editor"></div>
        </div>
        <div class="editor-container">
          <h4>当前发布内容（新值）</h4>
          <div ref="publishCurrentContentEditor" class="monaco-editor"></div>
        </div>
      </div>
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
                <a-tag :color="statusMap[record.namespaceStatus as StatusKey]?.color || 'default'">
                  {{ statusMap[record.namespaceStatus as StatusKey]?.text || '未知' }}
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
import { ref, nextTick, onUnmounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getConfigItems } from '../../../api/config/configItem';
import type { ConfigItem } from '../../../api/config/configItem';
import type { ConfigEnvironment } from '../../../api/config/configEnvironment';
import { batchPublishConfigs, publishConfig } from '../../../api/config/configPublish';
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
const showCompareModal = ref(false);
const publishLoading = ref(false);
const publishFormRef = ref<FormInstance>();
const currentPublishItem = ref<ConfigItem | null>(null);
const publishForm = ref({
  releaseName: '',
  releaseType: 1,
  distributionStrategy: 1,
  publishTime: null,
  weaponVersion: undefined,
  targetEnvironmentId: undefined,
  targetNamespaceId: undefined,
  content: '' // 当前要发布的配置内容
});

const publishRules = {
  releaseName: [{ required: true, message: '请输入发布名称', trigger: 'blur' }],
  releaseType: [{ required: true, message: '请选择发布类型', trigger: 'blur' }],
  distributionStrategy: [{ required: true, message: '请选择下发策略', trigger: 'blur' }],
  publishTime: [{ required: false, message: '请选择发布时间', trigger: 'blur' }],
  targetEnvironmentId: [{ required: false, message: '请选择环境信息', trigger: 'blur' }],
  targetNamespaceId: [{ required: false, message: '请选择命名空间', trigger: 'blur' }]
};

// 比对相关
const targetConfigItems = ref<ConfigItem[]>([]);
const showCompareResult = ref(false);
const currentContentEditor = ref<HTMLElement | null>(null);
const targetContentEditor = ref<HTMLElement | null>(null);
let currentCompareEditor: any = null;
let targetCompareEditor: any = null;

// 发布对比相关（第二步）
const historyContentEditor = ref<HTMLElement | null>(null);
const publishCurrentContentEditor = ref<HTMLElement | null>(null);
let historyCompareEditor: any = null;
let publishCurrentCompareEditor: any = null;

// 批量发布相关
const showBatchPublishModal = ref(false);
const batchPublishLoading = ref(false);
const batchPublishFormRef = ref<FormInstance>();
const batchPublishForm = ref({
  releaseName: dayjs().format('YYYYMMDDHHmm') + '-batch-release',
  releaseType: 1
});

// 状态映射
type StatusKey = 1 | 2 | 3;
type StatusValue = { text: string; color: string };
const statusMap: Record<StatusKey, StatusValue> = {
  1: { text: '已保存', color: 'warning' },
  2: { text: '发布中', color: 'processing' },
  3: { text: '已发布', color: 'success' },
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
const openPublishModal = async (record: ConfigItem) => {
  console.log('打开发布弹窗，record:', {
    id: record.id,
    namespaceId: record.namespaceId,
    hasContent: !!record.content,
    hasOldContent: !!record.oldContent,
    contentLength: record.content?.length || 0,
    oldContentLength: record.oldContent?.length || 0
  });

  // 如果 record 中没有 content 或 oldContent，尝试从表单数据中获取
  // 注意：表格列表可能不返回这些大字段，所以这里直接使用 record
  // 如果后端列表接口确实不返回，需要在打开时重新获取完整数据
  currentPublishItem.value = record;
  publishForm.value.releaseName = `${dayjs().format('YYYYMMDDHHmm')}-release`;
  publishForm.value.releaseType = 1;
  publishForm.value.distributionStrategy = 1;
  publishForm.value.publishTime = null;
  publishForm.value.weaponVersion = undefined;
  publishForm.value.targetEnvironmentId = undefined;
  publishForm.value.targetNamespaceId = undefined;
  publishForm.value.content = record.content || ''; // 设置当前要发布的配置内容
  
  // 重置对比结果
  showCompareResult.value = false;
  targetConfigItems.value = [];
  
  showPublishModal.value = true;
};

// 打开批量发布弹窗
const openBatchPublishModal = () => {
  showBatchPublishModal.value = true;
};

// 点击下一步，进入对比页面
const handleNextStep = async () => {
  try {
    // 验证表单
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

    // 关闭第一步弹窗，打开对比弹窗
    showPublishModal.value = false;
    await nextTick();
    showCompareModal.value = true;
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 对比弹窗取消，返回第一步
const handleCompareCancel = () => {
  showCompareModal.value = false;
  // 清理编辑器
  if (publishCurrentCompareEditor) {
    try {
      publishCurrentCompareEditor.dispose();
    } catch (e) {
      console.warn('清理编辑器失败:', e);
    }
    publishCurrentCompareEditor = null;
  }
  if (historyCompareEditor) {
    try {
      historyCompareEditor.dispose();
    } catch (e) {
      console.warn('清理编辑器失败:', e);
    }
    historyCompareEditor = null;
  }
  // 重新打开第一步弹窗
  showPublishModal.value = true;
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

// 处理比对（与其他环境和命名空间对比）
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
  await new Promise(resolve => setTimeout(resolve, 200));
  initCompareEditors(targetContent, currentContent);
  showCompareResult.value = true;
};

// 初始化比对编辑器
const initCompareEditors = async (targetContent: string, currentContent: string) => {
  // 清理旧的编辑器
  if (targetCompareEditor) {
    try {
      targetCompareEditor.dispose();
    } catch (e) {
      console.warn('清理目标编辑器失败:', e);
    }
    targetCompareEditor = null;
  }
  if (currentCompareEditor) {
    try {
      currentCompareEditor.dispose();
    } catch (e) {
      console.warn('清理当前编辑器失败:', e);
    }
    currentCompareEditor = null;
  }

  // 等待DOM更新
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!currentContentEditor.value || !targetContentEditor.value) {
    console.error('编辑器容器未找到');
    return;
  }

  // 检查容器尺寸
  const currentRect = currentContentEditor.value.getBoundingClientRect();
  const targetRect = targetContentEditor.value.getBoundingClientRect();
  
  if (currentRect.width === 0 || currentRect.height === 0 || targetRect.width === 0 || targetRect.height === 0) {
    console.warn('编辑器容器尺寸为0，延迟重试');
    setTimeout(() => initCompareEditors(targetContent, currentContent), 200);
    return;
  }

  try {
    // 确保 Monaco 已加载
    if (!monaco || !monaco.editor) {
      console.error('Monaco Editor 未加载');
      message.error('编辑器未加载，请刷新页面重试');
      return;
    }

    // 创建目标配置编辑器（其他环境的配置）
    targetCompareEditor = monaco.editor.create(targetContentEditor.value, {
      value: targetContent,
      language: 'yaml',
      readOnly: true,
      theme: 'vs',
      fontSize: 13,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible'
      }
    });

    // 创建当前配置编辑器
    currentCompareEditor = monaco.editor.create(currentContentEditor.value, {
      value: currentContent,
      language: 'yaml',
      readOnly: true,
      theme: 'vs',
      fontSize: 13,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible'
      }
    });

    // 强制布局更新
    setTimeout(() => {
      if (targetCompareEditor) {
        targetCompareEditor.layout();
      }
      if (currentCompareEditor) {
        currentCompareEditor.layout();
      }
    }, 100);

    // 同步滚动
    if (targetCompareEditor && currentCompareEditor) {
      targetCompareEditor.onDidScrollChange(() => {
        if (currentCompareEditor && targetCompareEditor) {
          currentCompareEditor.setScrollTop(targetCompareEditor.getScrollTop());
          currentCompareEditor.setScrollLeft(targetCompareEditor.getScrollLeft());
        }
      });
      
      currentCompareEditor.onDidScrollChange(() => {
        if (targetCompareEditor && currentCompareEditor) {
          targetCompareEditor.setScrollTop(currentCompareEditor.getScrollTop());
          targetCompareEditor.setScrollLeft(currentCompareEditor.getScrollLeft());
        }
      });
    }
  } catch (error) {
    console.error('初始化编辑器失败:', error);
    message.error('编辑器初始化失败，请刷新页面重试');
  }
};

// 初始化发布对比编辑器（第二步）
const initPublishCompareEditors = async () => {
  // 清理旧的编辑器
  if (publishCurrentCompareEditor) {
    try {
      publishCurrentCompareEditor.dispose();
    } catch (e) {
      console.warn('清理当前编辑器失败:', e);
    }
    publishCurrentCompareEditor = null;
  }
  if (historyCompareEditor) {
    try {
      historyCompareEditor.dispose();
    } catch (e) {
      console.warn('清理历史编辑器失败:', e);
    }
    historyCompareEditor = null;
  }

  // 检查容器是否存在
  if (!publishCurrentContentEditor.value || !historyContentEditor.value) {
    console.warn('编辑器容器不存在');
    return;
  }

  // 检查容器尺寸
  const historyRect = historyContentEditor.value.getBoundingClientRect();
  const currentRect = publishCurrentContentEditor.value.getBoundingClientRect();
  console.log('容器尺寸:', {
    historyWidth: historyRect.width,
    historyHeight: historyRect.height,
    currentWidth: currentRect.width,
    currentHeight: currentRect.height
  });

  if (historyRect.width === 0 || historyRect.height === 0 || currentRect.width === 0 || currentRect.height === 0) {
    console.warn('容器尺寸为0，延迟重试');
    setTimeout(() => {
      initPublishCompareEditors();
    }, 200);
    return;
  }

  // 确保 Monaco 已加载
  if (!monaco || !monaco.editor) {
    console.error('Monaco Editor 未加载');
    message.error('编辑器未加载，请刷新页面重试');
    return;
  }

  // 检查数据是否存在
  if (!currentPublishItem.value) {
    console.warn('当前发布项不存在');
    message.warning('数据不存在，请重新选择配置项');
    return;
  }

  // 获取内容
  // 上次发布内容：当前配置项的 oldContent 字段
  // 当前发布内容：当前配置项的 content 字段
  const currentContent = currentPublishItem.value?.content || '';
  const oldContent = currentPublishItem.value?.oldContent || '';

  console.log('初始化对比编辑器:', {
    itemId: currentPublishItem.value?.id,
    currentContentLength: currentContent.length,
    oldContentLength: oldContent.length,
    hasContent: !!currentPublishItem.value?.content,
    hasOldContent: !!currentPublishItem.value?.oldContent,
    currentContentPreview: currentContent.substring(0, 50),
    oldContentPreview: oldContent.substring(0, 50)
  });

  // 创建历史版本编辑器（上次发布内容）- 参考 CodeEditor 的实现
  historyCompareEditor = monaco.editor.create(historyContentEditor.value, {
    value: oldContent || '（无上次发布内容）',
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
  });

  // 创建当前版本编辑器（当前发布内容）- 参考 CodeEditor 的实现
  publishCurrentCompareEditor = monaco.editor.create(publishCurrentContentEditor.value, {
    value: currentContent || '（无内容）',
    language: 'yaml',
    theme: 'vs-dark',
    readOnly: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
  });

  // 手动触发布局更新，确保编辑器正确渲染
  setTimeout(() => {
    if (historyCompareEditor) {
      historyCompareEditor.layout();
      console.log('历史编辑器布局已更新');
    }
    if (publishCurrentCompareEditor) {
      publishCurrentCompareEditor.layout();
      console.log('当前编辑器布局已更新');
    }
  }, 100);

  // 同步滚动
  if (historyCompareEditor && publishCurrentCompareEditor) {
    historyCompareEditor.onDidScrollChange(() => {
      if (publishCurrentCompareEditor && historyCompareEditor) {
        publishCurrentCompareEditor.setScrollTop(historyCompareEditor.getScrollTop());
        publishCurrentCompareEditor.setScrollLeft(historyCompareEditor.getScrollLeft());
      }
    });
    
    publishCurrentCompareEditor.onDidScrollChange(() => {
      if (historyCompareEditor && publishCurrentCompareEditor) {
        historyCompareEditor.setScrollTop(publishCurrentCompareEditor.getScrollTop());
        historyCompareEditor.setScrollLeft(publishCurrentCompareEditor.getScrollLeft());
      }
    });
  }
};

// 处理发布提交（在第二步对比页面点击确定后调用）
const handlePublishSubmit = async () => {
  try {
    publishLoading.value = true;
    
    // 准备发布数据
    // oldContent: 当前配置项的 oldContent 字段（上次发布的内容）
    // content: 当前配置项的 content 字段（当前要发布的内容）
    const oldContent = currentPublishItem.value?.oldContent || '';
    const newContent = currentPublishItem.value?.content || '';
    
    await publishConfig({
      configItemId: currentPublishItem.value?.id,
      releaseName: publishForm.value.releaseName,
      releaseType: publishForm.value.releaseType,
      oldContent: oldContent,
      content: newContent,
    });
    
    message.success('发布成功');
    showCompareModal.value = false;
    resetPublishForm();
    emit('refresh-data');
  } catch (error) {
    console.error('发布失败:', error);
    message.error('发布失败，请重试');
  } finally {
    publishLoading.value = false;
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
    targetNamespaceId: undefined,
    content: ''
  };
  showPublishModal.value = false;
  showCompareModal.value = false;
  showCompareResult.value = false;
  currentPublishItem.value = null;
  targetConfigItems.value = [];
  
  if (currentCompareEditor) {
    try {
      currentCompareEditor.dispose();
    } catch (e) {
      console.warn('清理编辑器失败:', e);
    }
    currentCompareEditor = null;
  }
  if (targetCompareEditor) {
    try {
      targetCompareEditor.dispose();
    } catch (e) {
      console.warn('清理编辑器失败:', e);
    }
    targetCompareEditor = null;
  }
  if (publishCurrentCompareEditor) {
    try {
      publishCurrentCompareEditor.dispose();
    } catch (e) {
      console.warn('清理编辑器失败:', e);
    }
    publishCurrentCompareEditor = null;
  }
  if (historyCompareEditor) {
    try {
      historyCompareEditor.dispose();
    } catch (e) {
      console.warn('清理编辑器失败:', e);
    }
    historyCompareEditor = null;
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


// 监听对比弹窗打开，初始化编辑器 - 参考 CodeEditor 的实现
watch(showCompareModal, async (isOpen) => {
  if (isOpen) {
    // 等待 DOM 更新后初始化编辑器
    await nextTick();
    // 使用 requestAnimationFrame 确保 modal 完全渲染
    // 增加延迟时间，确保容器有正确的尺寸
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          initPublishCompareEditors();
        }, 200);
      });
    });
  } else {
    // 弹窗关闭时清理编辑器
    if (publishCurrentCompareEditor) {
      try {
        publishCurrentCompareEditor.dispose();
      } catch (e) {
        console.warn('清理编辑器失败:', e);
      }
      publishCurrentCompareEditor = null;
    }
    if (historyCompareEditor) {
      try {
        historyCompareEditor.dispose();
      } catch (e) {
        console.warn('清理编辑器失败:', e);
      }
      historyCompareEditor = null;
    }
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (currentCompareEditor) {
    currentCompareEditor.dispose();
  }
  if (targetCompareEditor) {
    targetCompareEditor.dispose();
  }
  if (publishCurrentCompareEditor) {
    publishCurrentCompareEditor.dispose();
  }
  if (historyCompareEditor) {
    historyCompareEditor.dispose();
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
          min-height: 400px;
          border: 1px solid var(--border-color);
          border-radius: 2px;
          background: #fff;
          width: 100%;
        }
      }
    }
  }
}

// 对比弹窗样式（模仿 CodeEditor 的结构）
:deep(.ant-modal-body) {
  padding: 16px;
  overflow: hidden;
}

.compare-modal-content {
  display: flex;
  gap: 16px;
  height: 600px;
  
  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color, #d9d9d9);
    
    h4 {
      margin: 0;
      padding: 8px;
      background-color: var(--background-color, #fafafa);
      border-bottom: 1px solid var(--border-color, #d9d9d9);
      font-weight: 500;
      color: var(--text-color, #666);
    }
    
    .monaco-editor {
      flex: 1;
      min-height: 500px;
    }
  }
}
</style>
