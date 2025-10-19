# Workflow Store 使用示例

## 基本用法

```typescript
import { useWorkflowStore } from '@/stores/workflow';

// 在组件中使用
const store = useWorkflowStore();

// 初始化工作流
store.initWorkflow('workflow-123', 0, workflowData);

// 设置工作流类型
store.setType(1); // 0-编辑，1-查看，2-执行

// 添加任务到列表
store.addJob({
  id: 'job-1',
  jobName: '数据处理任务',
  executorInfo: 'executor-1',
  taskType: 1
});

// 获取任务信息
const job = store.getJobById('job-1');

// 设置选中的节点
store.setSelectedNodeId('node-1');

// 更新工作流数据
store.updateWorkflowData({
  workflowName: '新的工作流名称',
  description: '更新后的描述'
});
```

## 状态访问

```typescript
// 响应式状态
const id = store.id; // 当前工作流 ID
const type = store.type; // 工作流类型
const jobList = store.jobList; // 任务列表
const selectedNodeId = store.selectedNodeId; // 选中的节点 ID
const workflowData = store.workflowData; // 工作流数据
const loading = store.loading; // 加载状态
const error = store.error; // 错误信息

// 计算属性
const isEditMode = store.isEditMode; // 是否编辑模式
const isViewMode = store.isViewMode; // 是否查看模式
const isExecuteMode = store.isExecuteMode; // 是否执行模式
```

## 工作流类型说明

- `type: 0` - 编辑模式：可以编辑工作流配置
- `type: 1` - 查看模式：只能查看工作流，不能编辑
- `type: 2` - 执行模式：可以执行工作流，查看执行状态

## 常用操作

```typescript
// 重置工作流状态
store.resetWorkflow();

// 设置加载状态
store.setLoading(true);

// 设置错误信息
store.setError('操作失败');

// 清除错误信息
store.clearError();
```
