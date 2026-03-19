import { jobRequest as request } from '@/utils/request';
import type { JobPodPage, JobPodParams } from '@/types/job';

export function getJobPods(params: JobPodParams) {
  return request.get<JobPodPage>('/api/v1/pods', { params });
}