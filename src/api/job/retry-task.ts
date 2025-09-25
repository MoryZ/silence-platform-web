import { jobRequest as request } from '@/utils/request';

/** get retry task list */
export function fetchRetryTaskPageList(params?: any) {
  return request.get<any>('/retry-task/list', { params });
}

/** get retry task list */
export function fetchRetryTaskById(id: string) {
  return request.get<any>(`/retry-task/${id}`);
}

/** delete retry task */
export function fetchDeleteRetryTask(id: number) {
  return request.delete<boolean>(`/retry-task/${id}`);
}

/** delete retry task */
export function fetchBatchDeleteRetryTask(ids: number[]) {
  return request.delete<boolean>(`/retry-task/ids`, { data: ids });
}

/** delete retry task */
export function fetchStopRetryTask(id: number) {
  return request.post<boolean>(`/retry-task/stop/${id}`);
}
