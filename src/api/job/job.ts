import { jobRequest as request } from '@/utils/request';
import type {
  ExportJobParams,
  Job,
  JobSearchParams,
  JobTaskSearchParams,
  TriggerJobParams
} from '@/types/job';

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


