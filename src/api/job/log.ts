import { jobRequest as request } from '@/utils/request';

/** get Job Log List */
export function fetchJobLogList(params?: any) {
  return request.get<any>('/job/log/list', { params });
}

/** get Retry Log List */
export function fetchRetryLogList(params?: any) {
  return request.get<any>('/retry-task/message/list', { params });
}
