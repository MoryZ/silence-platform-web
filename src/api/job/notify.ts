import { jobRequest as request } from '@/utils/request';

/** get notify list */
export function fetchGetNotifyConfigList(params?: any) {
  return request.get<any>('/notify-config/list', { params });
}

/** get notify systemTaskType list */
export function fetchGetNotifyConfigSystemTaskTypeList(systemTaskType: number) {
  return request.get<any>(`/notify-config/all/${systemTaskType}`);
}

/** add notify */
export function fetchAddNotify(data: any) {
  return request.post<boolean>('/notify-config', data);
}

/** edit notify */
export function fetchEditNotify(data: any) {
  return request.put<boolean>('/notify-config', data);
}

/** delete notify */
export function fetchBatchDeleteNotify(data: string[]) {
  return request.delete<boolean>('/notify-config/ids', { data });
}

/** edit notify status */
export function fetchUpdateNotifyStatus(id: string, status: number) {
  return request.put<boolean>(`/notify-config/${id}/status/${status}`);
}

/** get notify recipient list */
export function fetchGetNotifyRecipientPageList(params?: any) {
  return request.get<any>('/notify-recipient/page/list', { params });
}

/** get notify recipient list */
export function fetchGetNotifyRecipientList() {
  return request.get<any>('/notify-recipient/list');
}

/** add notify recipient */
export function fetchAddNotifyRecipient(data: any) {
  return request.post<boolean>('/notify-recipient', data);
}

/** edit notify recipient */
export function fetchEditNotifyRecipient(data: any) {
  return request.put<boolean>('/notify-recipient', data);
}

/** delete notify recipient */
export function fetchDeleteNotifyRecipient(data: string[]) {
  return request.delete<boolean>('/notify-recipient/ids', { data });
}
