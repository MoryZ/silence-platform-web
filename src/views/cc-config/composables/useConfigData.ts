import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { getConfigItems } from '@/api/config/configItem';
import { getConfigEnvironments } from '@/api/config/configEnvironment';
import type { ConfigItem, ConfigEnvironment } from '@/types/config';

/**
 * 配置数据管理 Composable
 */
export function useConfigData() {
  const dataSource = ref<ConfigItem[]>([]);
  const loading = ref(false);
  const environments = ref<ConfigEnvironment[]>([]);
  const targetEnvironments = ref<ConfigEnvironment[]>([]);
  
  const pagination = ref({
    pageNo: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
  });

  const searchForm = ref<{ namespaceId?: string; content?: string }>({});

  /**
   * 获取环境列表
   */
  const fetchEnvironments = async (componentId: number, envType: number): Promise<boolean> => {
    if (!componentId || !envType) return false;

    try {
      const response = await getConfigEnvironments({
        configComponentId: componentId,
        envType: envType
      });

      // 处理不同格式的API响应
      let envData: ConfigEnvironment[] = [];
      if (response) {
        if (typeof response === 'object' && response !== null) {
          if ('data' in response && Array.isArray((response as any).data)) {
            envData = (response as any).data;
          } else if (Array.isArray(response)) {
            envData = response;
          }
        }
      }

      environments.value = Array.isArray(envData) ? envData : [];
      
      // 设置目标环境（显示所有环境，不过滤）
      targetEnvironments.value = environments.value;

      return environments.value.length > 0;
    } catch (error) {
      console.error('获取环境列表失败:', error);
      message.error('获取环境列表失败');
      return false;
    }
  };

  /**
   * 获取配置项数据
   */
  const fetchData = async (environmentId: number): Promise<boolean> => {
    if (!environmentId) return false;

    loading.value = true;
    try {
      const response = await getConfigItems({
        pageNo: pagination.value.pageNo,
        pageSize: pagination.value.pageSize,
        configEnvironmentId: environmentId,
        namespaceId: searchForm.value.namespaceId,
        content: searchForm.value.content
      });

      if (response?.data) {
        dataSource.value = response.data;
        pagination.value.total = response.total || 0;
        return true;
      }
      return false;
    } catch (error) {
      console.error('获取配置项列表失败:', error);
      message.error('获取配置项列表失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 搜索
   */
  const handleSearch = (payload: { namespaceId?: string; content?: string }, environmentId: number) => {
    searchForm.value = payload;
    pagination.value.pageNo = 1;
    return fetchData(environmentId);
  };

  /**
   * 重置搜索
   */
  const handleReset = (environmentId: number) => {
    searchForm.value = {};
    pagination.value.pageNo = 1;
    return fetchData(environmentId);
  };

  /**
   * 处理分页变化
   */
  const handlePaginationChange = (pageNo: number, pageSize: number, environmentId: number) => {
    pagination.value.pageNo = pageNo;
    pagination.value.pageSize = pageSize;
    return fetchData(environmentId);
  };

  /**
   * 重置数据
   */
  const resetData = () => {
    dataSource.value = [];
    environments.value = [];
    targetEnvironments.value = [];
    pagination.value = {
      pageNo: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true
    };
    searchForm.value = {};
  };

  /**
   * 更新数据源
   */
  const updateDataSource = (data: ConfigItem[]) => {
    dataSource.value = data;
  };

  return {
    dataSource,
    loading,
    environments,
    targetEnvironments,
    pagination,
    searchForm,
    fetchEnvironments,
    fetchData,
    handleSearch,
    handleReset,
    handlePaginationChange,
    resetData,
    updateDataSource,
  };
}
