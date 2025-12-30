import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { getConfigItemById } from '@/api/config/configItem';
import type { ConfigItem } from '@/api/config/configItem';

/**
 * 配置比较 Composable
 */
export function useConfigComparison() {
  const showCompareModal = ref(false);
  const showCompareDiffModal = ref(false);
  const compareLoading = ref(false);
  
  const compareForm = ref({
    sourceConfigItemId: 0,
    targetSubsystemId: undefined as number | undefined,
    targetEnvironmentId: undefined as number | undefined,
    targetNamespaceId: ''
  });

  const sourceConfig = ref<ConfigItem | null>(null);
  const targetConfig = ref<ConfigItem | null>(null);

  /**
   * 打开比较配置弹窗
   */
  const openCompareModal = (selectedItem: ConfigItem) => {
    if (!selectedItem) {
      message.error('未找到选中的配置项');
      return;
    }
    
    compareForm.value.sourceConfigItemId = selectedItem.id;
    compareForm.value.targetEnvironmentId = undefined;
    compareForm.value.targetNamespaceId = selectedItem.namespaceId;
    
    showCompareModal.value = true;
  };

  /**
   * 处理比较配置提交
   */
  const handleCompareSubmit = async (): Promise<{ source: ConfigItem; target: ConfigItem | null }> => {
    try {
      compareLoading.value = true;
      
      // 获取源配置项
      sourceConfig.value = await getConfigItemById(compareForm.value.sourceConfigItemId);
      
      // 获取目标配置项（这里需要根据实际API调整）
      try {
        const response = await getConfigItemById(compareForm.value.sourceConfigItemId);
        targetConfig.value = response;
      } catch (error) {
        console.log('目标环境中未找到对应的配置项');
        targetConfig.value = null;
      }
      
      showCompareModal.value = false;
      showCompareDiffModal.value = true;
      
      return {
        source: sourceConfig.value,
        target: targetConfig.value
      };
    } catch (error) {
      console.error('比较配置失败:', error);
      message.error('比较配置失败');
      throw error;
    } finally {
      compareLoading.value = false;
    }
  };

  /**
   * 处理比较配置取消
   */
  const handleCompareCancel = () => {
    showCompareModal.value = false;
    compareForm.value = {
      sourceConfigItemId: 0,
      targetEnvironmentId: undefined,
      targetNamespaceId: ''
    };
  };

  /**
   * 关闭差异对比弹窗
   */
  const closeCompareDiffModal = () => {
    showCompareDiffModal.value = false;
  };

  /**
   * 重置比较状态
   */
  const resetCompare = () => {
    compareForm.value = {
      sourceConfigItemId: 0,
      targetSubsystemId: undefined,
      targetEnvironmentId: undefined,
      targetNamespaceId: ''
    };
    sourceConfig.value = null;
    targetConfig.value = null;
  };

  return {
    showCompareModal,
    showCompareDiffModal,
    compareLoading,
    compareForm,
    sourceConfig,
    targetConfig,
    openCompareModal,
    handleCompareSubmit,
    handleCompareCancel,
    closeCompareDiffModal,
    resetCompare,
  };
}
