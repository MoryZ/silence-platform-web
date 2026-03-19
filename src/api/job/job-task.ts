import { jobRequest as request } from '@/utils/request';
import type { JobTaskPageSearchParams } from '@/types/job';

/** get Job Task page */
export function getJobTaskPage(params?: JobTaskPageSearchParams) {
  return request.get('/api/v1/jobTasks', { params });

}

/** get Job Task Tree */
export function getJobTaskTree(params?: JobTaskPageSearchParams) {
  return request.get('/api/v1/jobTasks/tree', { params });
}