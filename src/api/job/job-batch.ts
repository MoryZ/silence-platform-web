import { jobRequest as request } from '@/utils/request';

export interface JobBatch {
    id: number;
    groupName: string;
    jobName: string;
    taskType: number;
    jobId: number;
    taskBatchStatus: number;
    createdDate: string; // 可进一步优化为 Date 类型
    updatedDate: string; // 可进一步优化为 Date 类型
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
}

/** get Job page */
export function getJobBatchPage(params?: JobBatchSearchParams) {
  return request.get('/api/v1/jobBatches', { params });
}

/** get Job by id */
export function findById(id: string) {
  return request.get<JobBatch>('/api/v1/jobBatches/' + id);
}

/** retry job */
export function retryJobBatch(jobId: string) {
  return request.post<boolean>('/api/v1/jobBatches/' + jobId + '/retry');
}

/** delete job */
export function batchDeleteJobBatch(data: string[]) {
  return request.post<boolean>('/api/v1/jobBatches/ids', { data });
}
