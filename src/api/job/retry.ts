import { jobRequest as request } from '@/utils/request';

/** get retryTask list */
export function fetchGetRetryList(params?: any) {
  return request.get<any>('/retry/list', { params });
}

/** get retryTask */
export function fetchGetRetryById(id: string, groupName: string) {
  return request.get<any>(`/retry/${id}?groupName=${groupName}`);
}

/** add retryTask */
export function fetchAddRetry(data: any) {
  return request.post<boolean>('/retry', data);
}

/** batch add retryTask */
export function fetchBatchAddRetry(data: any) {
  return request.post<boolean>('/retry/batch', data);
}

/** edit retryTask */
export function fetchEditRetryTask(data: any) {
  return request.put<boolean>('/retry', data);
}

/** update retryTask status */
export function fetchUpdateRetryStatus(data: any) {
  return request.put<boolean>('/retry/status', data);
}

/** manual execute retryTask */
export function fetchExecuteRetry(data: any) {
  return request.post<boolean>('/retry/manual/trigger/retry/task', data);
}

/** batch delete retryTask */
export function fetchBatchDeleteRetry(data: any) {
  return request.delete<number>('/retry/batch', { data });
}

/** generate retryTask idempotent id */
export function fetchIdempotentIdGenerate(data: any) {
  return request.post<string>('/retry/generate/idempotent-id', data);
}
