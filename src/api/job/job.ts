import request from '@/utils/request';

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
  jobStatus: string;
  argString: string;
  argsType: number;
  routeKey: number;
  executorType: number;
  executorInfo: string;
  triggerInterval: string;
  blockStrategy: number;
  executorTimeout: number;
  maxRetryTimes: number;
  taskType: number;
  parallelNum: number;
  description: string;
  notifyIds: string[];
  ownerId: string;
}

export interface TriggerJobParams {
  tmpArgsStr: string;
  jobId: string;
}

export interface JobNameListSearchParams {
  keywords: string;
  groupName: string;
  jobId: number;
}

/** get Job page */
export function getJobPage(params?: JobSearchParams) {
  return request.get('/job/page/list', { params });
}

/** get Job list */
export function getJobList(params?: JobSearchParams) {
  return request.get('/job/list', { params });
}

/** get Job list */
export function getJobDetail(id: string) {
  return request.get(`/job/${id}`);
}

/** get Job Task list */
export function getJobTaskList(params?: JobTaskSearchParams) {
  return request.get('/job/task/list', { params });
}

/** get Job Task Tree */
export function getJobTaskTree(params?: JobTaskSearchParams) {
  return request.get('/job/task/tree/list', { params });
}

/** add Job */
export function addJob(data: Job) {
  return request.post('/job', data);
}

/** update Job */
export function updateJob(id: string, data: Job) {
  return request.put(`/job/${id}`, data);
}

/** update Job status */
export function runJob(id: string) {
  return request.put(`/job/${id}/run`);
}

/** update Job status */
export function stopJob(id: string) {
  return request.put(`/job/${id}/stop`);
}


/** batch delete Job by id */
export function deleteJob(data: string[]) {
  return request.delete('/job/ids', { data });
}

/** trigger Job by id */
export function triggerJob(jobId: string, data: TriggerJobParams) {
  return request.post(`/job/trigger/${jobId}`, data);
}


/** job name list */
export function getJobNameList(params?: JobNameListSearchParams) {
  return request.get('/job/job-name/list', { params });
}
