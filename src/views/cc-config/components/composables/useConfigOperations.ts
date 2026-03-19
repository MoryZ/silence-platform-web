import { ref, shallowRef } from 'vue';
import { message } from 'ant-design-vue';
import { deleteConfigItem, updateConfigContent } from '@/api/config/configItem';
import { getConfigItemHistories } from '@/api/config/configItemHistories';
import { analyzeChanges, getChangeTypeText, getOperationType } from '@/utils/changeAnalyzer';
import type { ConfigItem, ConfigItemHistory } from '@/types/config';

/**
 * 配置项操作 Composable
 */
export function useConfigOperations(emit: any) {
  const showEditor = ref(false);
  const editorTitle = ref('');
  const editorContent = ref('');
  const editorReadOnly = ref(false);
  const currentEditItem = ref<ConfigItem | null>(null);
  const modifyHistoryList = shallowRef<ConfigItemHistory[]>([]);

  /**
   * 获取修改历史
   */
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

  /**
   * 处理查看
   */
  const handleView = async (record: ConfigItem) => {
    currentEditItem.value = null;
    editorTitle.value = `查看配置 - ${record.namespaceId}`;
    editorContent.value = record.content || '';
    editorReadOnly.value = true;
    showEditor.value = true;

    // 获取修改历史
    await fetchModifyHistories(record.id);
  };

  /**
   * 处理编辑
   */
  const handleEdit = async (record: ConfigItem) => {
    currentEditItem.value = record;
    editorTitle.value = `编辑配置 - ${record.namespaceId}`;
    editorContent.value = record.content || '';
    editorReadOnly.value = false;
    showEditor.value = true;

    // 获取修改历史
    await fetchModifyHistories(record.id);
  };

  /**
   * 处理删除
   */
  const handleDelete = async (record: ConfigItem) => {
    try {
      await deleteConfigItem(record.id);
      message.success('删除成功');
      emit('refresh-data');
    } catch (error) {
      message.error('删除失败');
    }
  };

  /**
   * 处理保存
   */
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

      // 执行保存，更新内容（后端会自动将状态设置为1）
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

  /**
   * 处理查看发布历史
   */
  const handleViewReleaseHistory = (record: ConfigItem) => {
    emit('view-release-history', record);
  };

  /**
   * 处理发布
   */
  const handlePublish = (record: ConfigItem) => {
    emit('publish', record);
  };

  return {
    showEditor,
    editorTitle,
    editorContent,
    editorReadOnly,
    currentEditItem,
    modifyHistoryList,
    handleView,
    handleEdit,
    handleDelete,
    handleSave,
    handleViewReleaseHistory,
    handlePublish,
  };
}
