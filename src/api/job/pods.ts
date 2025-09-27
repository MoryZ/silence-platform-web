import { jobRequest as request } from '@/utils/request';

export interface JobPod {
  hostId: string;
  nodeType: string;
  groupName: string;
  labels: string;
  hostIp: string;
  consumerBuckets: string[];
  executorType: string;
}

export interface JobPodPage {
  data: JobPod[];
  total: number;
}

export interface JobPodParams {
  groupName: string;
  pageNo: number;
  pageSize: number;
  sort: string;
}

export function getJobPods(params: JobPodParams) {
  return request.get<JobPodPage>('/api/v1/pods', { params });
}