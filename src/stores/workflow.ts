import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 工作流状态接口
interface WorkflowState {
  // 当前工作流 ID
  id: string | null;
  // 工作流类型：0-编辑模式，1-查看模式，2-执行模式
  type: number;
  // 任务列表
  jobList: Array<{
    id?: string;
    jobName?: string;
    executorInfo?: string;
    taskType?: number;
  }>;
  // 当前选中的节点
  selectedNodeId: string | null;
  // 工作流数据
  workflowData: Workflow.NodeDataType | null;
  // 是否正在加载
  loading: boolean;
  // 错误信息
  error: string | null;
}

export const useWorkflowStore = defineStore('workflow', () => {
  // 状态
  const state = ref<WorkflowState>({
    id: null,
    type: 0, // 默认编辑模式
    jobList: [],
    selectedNodeId: null,
    workflowData: null,
    loading: false,
    error: null
  });

  // Getters
  const id = computed(() => state.value.id);
  const type = computed(() => state.value.type);
  const jobList = computed(() => state.value.jobList);
  const selectedNodeId = computed(() => state.value.selectedNodeId);
  const workflowData = computed(() => state.value.workflowData);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);

  // 是否处于编辑模式
  const isEditMode = computed(() => state.value.type === 0);
  // 是否处于查看模式
  const isViewMode = computed(() => state.value.type === 1);
  // 是否处于执行模式
  const isExecuteMode = computed(() => state.value.type === 2);

  // Actions
  /**
   * 设置工作流 ID
   * @param id 工作流 ID
   */
  const setId = (id: string | null) => {
    state.value.id = id;
  };

  /**
   * 设置工作流类型
   * @param type 工作流类型：0-编辑，1-查看，2-执行
   */
  const setType = (type: number) => {
    state.value.type = type;
  };

  /**
   * 设置任务列表
   * @param jobList 任务列表
   */
  const setJobList = (jobList: Array<{
    id?: string;
    jobName?: string;
    executorInfo?: string;
    taskType?: number;
  }>) => {
    state.value.jobList = jobList;
  };

  /**
   * 添加任务到列表
   * @param job 任务信息
   */
  const addJob = (job: {
    id?: string;
    jobName?: string;
    executorInfo?: string;
    taskType?: number;
  }) => {
    const existingIndex = state.value.jobList.findIndex(j => j.id === job.id);
    if (existingIndex >= 0) {
      state.value.jobList[existingIndex] = job;
    } else {
      state.value.jobList.push(job);
    }
  };

  /**
   * 根据 ID 获取任务信息
   * @param id 任务 ID
   * @returns 任务信息
   */
  const getJobById = (id: string) => {
    return state.value.jobList.find(job => job.id === id);
  };

  /**
   * 设置选中的节点 ID
   * @param nodeId 节点 ID
   */
  const setSelectedNodeId = (nodeId: string | null) => {
    state.value.selectedNodeId = nodeId;
  };

  /**
   * 设置工作流数据
   * @param data 工作流数据
   */
  const setWorkflowData = (data: Workflow.NodeDataType | null) => {
    state.value.workflowData = data;
  };

  /**
   * 设置加载状态
   * @param loading 是否正在加载
   */
  const setLoading = (loading: boolean) => {
    state.value.loading = loading;
  };

  /**
   * 设置错误信息
   * @param error 错误信息
   */
  const setError = (error: string | null) => {
    state.value.error = error;
  };

  /**
   * 清除错误信息
   */
  const clearError = () => {
    state.value.error = null;
  };

  /**
   * 重置工作流状态
   */
  const resetWorkflow = () => {
    state.value = {
      id: null,
      type: 0,
      jobList: [],
      selectedNodeId: null,
      workflowData: null,
      loading: false,
      error: null
    };
  };

  /**
   * 初始化工作流
   * @param id 工作流 ID
   * @param type 工作流类型
   * @param data 工作流数据
   */
  const initWorkflow = (
    id: string | null = null,
    type: number = 0,
    data: Workflow.NodeDataType | null = null
  ) => {
    state.value.id = id;
    state.value.type = type;
    state.value.workflowData = data;
    state.value.error = null;
  };

  /**
   * 更新工作流数据
   * @param updates 更新的数据
   */
  const updateWorkflowData = (updates: Partial<Workflow.NodeDataType>) => {
    if (state.value.workflowData) {
      state.value.workflowData = {
        ...state.value.workflowData,
        ...updates
      };
    }
  };

  return {
    // 状态
    id,
    type,
    jobList,
    selectedNodeId,
    workflowData,
    loading,
    error,
    
    // 计算属性
    isEditMode,
    isViewMode,
    isExecuteMode,
    
    // 方法
    setId,
    setType,
    setJobList,
    addJob,
    getJobById,
    setSelectedNodeId,
    setWorkflowData,
    setLoading,
    setError,
    clearError,
    resetWorkflow,
    initWorkflow,
    updateWorkflowData
  };
});
