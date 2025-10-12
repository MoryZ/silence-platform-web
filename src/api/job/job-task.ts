import { jobRequest as request } from '@/utils/request';

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

export interface JobTaskSearchParams {
  jobId: string;
  taskBatchId: string;
  parentId: string;
  taskStatus: number;
  pageNo: number;
  pageSize: number;
}

/** get Job Task page */
export function getJobTaskPage(params?: JobTaskSearchParams) {
  return request.get('/api/v1/jobTasks', { params });

}

/** get Job Task Tree */
export function getJobTaskTree(params?: JobTaskSearchParams) {
  return request.get('/api/v1/jobTasks/tree', { params });
}