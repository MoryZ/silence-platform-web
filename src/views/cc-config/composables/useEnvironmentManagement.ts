import { ref } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { createConfigEnvironment, deleteConfigEnvironment } from '@/api/config/configEnvironment';

/**
 * 环境管理 Composable
 */
export function useEnvironmentManagement() {
  const showAddEnvironmentModal = ref(false);
  const environmentFormRef = ref<FormInstance>();
  const newEnvironment = ref({
    name: '',
    displayName: '',
    envType: 0,
    configComponentId: 0,
    display: true
  });

  const environmentRules = {
    name: [{ required: true, message: '请输入环境名称', trigger: 'blur' }],
    displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  };

  /**
   * 打开新增环境弹窗
   */
  const openAddEnvironment = (envType: number, componentId: number) => {
    if (!componentId) {
      message.warning('请先选择组件');
      return false;
    }

    newEnvironment.value = {
      name: '',
      displayName: '',
      envType: envType,
      configComponentId: componentId,
      display: true
    };
    showAddEnvironmentModal.value = true;
    return true;
  };

  /**
   * 处理新增环境提交
   */
  const handleAddEnvironment = async (): Promise<boolean> => {
    try {
      await environmentFormRef.value?.validate();

      const params = {
        ...newEnvironment.value,
      };

      const response = await createConfigEnvironment(params);
      if (response) {
        message.success('新增环境成功');
        showAddEnvironmentModal.value = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('新增环境失败:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        message.error((error as any).message || '新增环境失败');
      } else {
        message.error('新增环境失败');
      }
      return false;
    }
  };

  /**
   * 处理删除环境
   */
  const handleDeleteEnvironment = async (envId: number): Promise<boolean> => {
    try {
      await deleteConfigEnvironment(envId);
      message.success('删除环境成功');
      return true;
    } catch (error) {
      console.error('删除环境失败:', error);
      message.error('删除环境失败');
      return false;
    }
  };

  /**
   * 关闭弹窗
   */
  const closeModal = () => {
    showAddEnvironmentModal.value = false;
  };

  return {
    showAddEnvironmentModal,
    environmentFormRef,
    newEnvironment,
    environmentRules,
    openAddEnvironment,
    handleAddEnvironment,
    handleDeleteEnvironment,
    closeModal,
  };
}
