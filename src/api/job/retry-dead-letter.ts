import { jobRequest as request } from '@/utils/request';

/** get retry dead letter list */
export function fetchGetRetryDeadLetterPageList(params?: any) {
  return request.get<any>('/retry-dead-letter/list', { params });
}

export function fetchGetRetryDeadLetterById(id: string, groupName: string) {
  return request.get<any>(`/retry-dead-letter/${id}?groupName=${groupName}`);
}

/** add retry scene */
export function fetchRollbackRetryDeadLetter(data: any) {
  return request.post<boolean>('/retry-dead-letter/batch/rollback', data);
}

/** edit retry scene */
export function fetchDeleteRetryDeadLetter(data: any) {
  return request.delete<boolean>('/retry-dead-letter/batch', { data });
}
