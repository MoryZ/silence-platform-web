import { jobRequest as request } from '@/utils/request';

/** get retry task list */
export function fetchRetryTaskPageList(params?: any) {
  return request.get<any>('/api/v1/retryTasks', { params });
}

/** get retry task list */
export function fetchRetryTaskById(id: string) {
  return request.get<any>(`/api/v1/retryTasks/${id}`);
}

/** delete retry task */
export function fetchDeleteRetryTask(id: number) {
  return request.delete<boolean>(`/api/v1/retryTasks/${id}`);
}

/** delete retry task */
export function fetchBatchDeleteRetryTask(ids: number[]) {
  return request.delete<boolean>(`/api/v1/retryTasks`, { data: ids });
}

/** stop retry task */
export function fetchStopRetryTask(id: number) {
  return request.put<boolean>(`/api/v1/retryTasks/${id}/stop`);
}
