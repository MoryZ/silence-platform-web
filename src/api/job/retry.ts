import { jobRequest as request } from '@/utils/request';
import type { RetrySearchParams } from '@/types/job';
/** get retryTask list */
export function fetchGetRetryList(params?: RetrySearchParams) {
  return request.get<any>('/api/v1/retries', { params });
}

/** get retryTask */
export function fetchGetRetryById(id: string, groupName: string) {
  return request.get<any>(`/api/v1/retries/${id}?groupName=${groupName}`);
}

/** add retryTask */
export function fetchAddRetry(data: any) {
  return request.post<boolean>('/api/v1/retries', data);
}

/** batch add retryTask */
export function fetchBatchAddRetry(data: any) {
  return request.post<boolean>('/api/v1/retries/batch', data);
}

/** edit retryTask */
export function fetchEditRetryTask(data: any) {
  return request.put<boolean>('/api/v1/retries', data);
}

/** update retryTask status */
export function fetchUpdateRetryStatus(data: any) {
  return request.put<boolean>('/api/v1/retries/status', data);
}

/** manual execute retryTask */
export function fetchExecuteRetry(data: any) {
  return request.post<boolean>('/api/v1/retries/manual/trigger/retry/task', data);
}

/** batch delete retryTask */
export function fetchBatchDeleteRetry(data: any) {
  return request.delete<number>('/api/v1/retries/batchDelete', { data });
}

/** generate retryTask idempotent id */
export function fetchIdempotentIdGenerate(data: any) {
  return request.post<string>('/api/v1/retries/generate/idempotent-id', data);
}
