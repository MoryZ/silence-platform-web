export interface JobExecutor {
  id: number;
  namespaceId: string;
  executorName: string;
  executorType: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface JobExecutorPage {
  total: number;
  data: JobExecutor[];
}

export interface JobExecutorParams {
  namespaceId: string;
  executorName: string;
  pageNo: number;
  pageSize: number;
}