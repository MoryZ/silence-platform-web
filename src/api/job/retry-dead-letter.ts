import { jobRequest as request } from '@/utils/request';

/** get retry dead letter list */
export function fetchGetRetryDeadLetterPageList(params?: any) {
  return request.get<any>('/api/v1/retryDeadLetters', { params });
}

export function fetchGetRetryDeadLetterById(id: string, groupName: string) {
  return request.get<any>(`/api/v1/retryDeadLetters/${id}?groupName=${groupName}`);
}

/** add retry scene */
export function fetchRollbackRetryDeadLetter(data: any) {
  return request.post<boolean>('/api/v1/retryDeadLetters/batchRollback', data);
}

/** edit retry scene */
export function fetchDeleteRetryDeadLetter(data: any) {
  return request.delete<boolean>('/api/v1/retryDeadLetters/batchDelete', { data });
}
