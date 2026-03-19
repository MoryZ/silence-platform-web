import { jobRequest as request } from '@/utils/request';
import type { JobBatch, JobBatchSearchParams } from '@/types/job';

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
  return request.put<boolean>('/api/v1/jobBatches/' + jobId + '/retry');
}

/** delete job */
export function batchDeleteJobBatch(data: string[]) {
  return request.delete<boolean>('/api/v1/jobBatches', { data });
}
