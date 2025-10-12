import { jobRequest as request } from '@/utils/request';

export interface JobTaskSearchParams {
  groupName: string;
  jobName: string;
  jobStatus: string;
  ownerId: string;
  executorInfo: string;
  pageNo: number;
  pageSize: number;
}

export interface JobSearchParams {
  pageNo: number;
  pageSize: number;
  sort: string;
  groupName: string;
  jobName: string;
  jobStatus: string;
  ownerId: string;
  executorInfo: string;
}


export interface JobSearchListParams {
  groupName: string;
  jobName: string;
  jobStatus: string;
  ownerId: string;
  executorInfo: string;
}
export interface Job {
  id: string;
  groupName: string;
  jobName: string;
  jobStatus: boolean;
  argsStr: string;
  argsType: number;
  routeKey: number;
  executorType: number;
  executorInfo: string;
  triggerType: number;
  triggerInterval: number;
  blockStrategy: number;
  executorTimeout: number;
  maxRetryTimes: number;
  retryInterval: number;
  taskType: number;
  parallelNum: number;
  description: string;
  notifyIds: string[];
  ownerId: string;
}

export interface TriggerJobParams {
  tmpArgsStr: string;
}

export interface JobNameListSearchParams {
  keywords: string;
  groupName: string;
  jobId: number;
}

export interface ExportJobParams {
    jobIds: string[];
    groupName: string;
    jobName: string;
    jobStatus: boolean;
  }

/** get Job page */
export function getJobPage(params?: JobSearchParams) {
  return request.get('/api/v1/jobs', { params });
}

/** get Job list */
export function getJobList(params?: JobSearchParams) {
  return request.get('/api/v1/jobs', { params });
}

/** get Job list */
export function getJobDetail(id: string) {
  return request.get(`/api/v1/jobs/${id}`);
}

/** get Job Task list */
export function getJobTaskList(params?: JobTaskSearchParams) {
  return request.get('/api/v1/jobs/task/list', { params });
}

/** get Job Task Tree */
export function getJobTaskTree(params?: JobTaskSearchParams) {
  return request.get('/api/v1/jobs/task/tree/list', { params });
}

/** add Job */
export function createJob(data: Job) {
  return request.post('/api/v1/jobs', data);
}

/** update Job */
export function updateJob(id: string, data: Job) {
  return request.put(`/api/v1/jobs/${id}`, data);
}

/** update Job status */
export function runJob(id: string) {
  return request.put(`/api/v1/jobs/${id}/run`);
}

/** update Job status */
export function stopJob(id: string) {
  return request.put(`/api/v1/jobs/${id}/stop`);
}


/** batch delete Job by id */
export function deleteJob(data: string[]) {
  return request.delete('/api/v1/jobs', { data });
}

/** trigger Job by id */
export function triggerJob(jobId: string, data: TriggerJobParams) {
  return request.post(`/api/v1/jobs/${jobId}/trigger`, data);
}


export function importJob(data: File) {
    return request.post(`/api/v1/jobs/import`, data);
}

export function exportJob(data: ExportJobParams) {
    return request.post(`/api/v1/jobs/export`, data);
}


