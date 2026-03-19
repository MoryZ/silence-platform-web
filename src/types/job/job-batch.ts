export interface JobBatch {
  id: number;
  groupName: string;
  jobName: string;
  taskType: number;
  jobId: number;
  taskBatchStatus: number;
  createdDate: string;
  updatedDate: string;
  operationReason: number;
  executorType: number;
  executorInfo: string;
}

export interface JobBatchSearchParams {
  groupName: string;
  jobName: string;
  taskBatchStatuses: string[];
  createdDateStart: string;
  createdDateEnd: string;
  pageNo: number;
  pageSize: number;
  sort: string;
}