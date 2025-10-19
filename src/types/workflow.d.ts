declare namespace Workflow {
  interface ConditionNodeType {
    id?: string;
    nodeName?: string;
    nodeType?: number;
    priorityLevel?: number;
    decision?: {
      logicalCondition: number;
      expressionType: number;
      nodeExpression: string;
      checkContents: any[];
      defaultDecision?: number;
    };
    [key: string]: any;
  }

  interface NodeDataType {
    id?: string;
    workflowName?: string;
    workflowStatus?: number;
    blockStrategy?: number;
    description?: string;
    executorTimeout?: number;
    wfContext?: string;
    nodeConfig?: any;
    [key: string]: any;
  }

  interface NodeModelType {
    id?: string;
    nodeName?: string;
    nodeType?: number;
    condition?: string;
    conditionExpression?: string;
    conditionResult?: boolean;
    children?: NodeModelType[];
    conditionNodes?: ConditionNodeType[];
    childNode?: NodeModelType;
    [key: string]: any;
  }

  interface JobTaskType {
    id?: string;
    taskBatchId?: string;
    workflowNodeId?: string;
    groupName?: string;
    jobName?: string;
    taskBatchStatus?: number;
    jobStatus?: number;
    executionAt?: string;
    operationReason?: number;
    executorType?: number;
    executorInfo?: string;
    createDt?: string;
    [key: string]: any;
  }
}
