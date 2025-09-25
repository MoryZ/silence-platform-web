import { jobRequest as request } from '@/utils/request';

/** Task Retry Job */
export function fetchCardCount() {
  return request.get<any>('/dashboard/task-retry-job');
}

/** All Group Name */
export function fetchAllGroupName() {
  return request.get<string[]>('/group/all/group-name/list');
}

/** Retry Line */
export function fetchRetryLine(params?: any) {
  return request.get<any>('/dashboard/retry/line', { params });
}

/** Job Line */
export function fetchJobLine(params?: any) {
  return request.get<any>('/dashboard/job/line', { params });
}

/** Pods */
export function fetchPods(params?: any) {
  return request.get<any>('/dashboard/pods', { params });
}
