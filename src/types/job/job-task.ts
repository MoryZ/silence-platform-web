export interface JobTask {
  id: number;
  groupName: string;
  taskName: string;
  jobId: number;
  taskBatchId: number;
  parentId: number;
  taskStatus: number;
  retryCount: number;
  resultMessage: string;
  clientInfo: string;
  argsStr: string;
  argsType: number;
  extAttrs: string;
  createdDate: string;
  updatedDate: string;
  isLeaf: boolean;
}

export interface JobTaskPageSearchParams {
  jobId: string;
  taskBatchId: string;
  parentId: string;
  taskStatus: number;
  pageNo: number;
  pageSize: number;
}