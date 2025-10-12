import { jobRequest as request } from '@/utils/request';

export interface NotifyRecipientParams {
  pageNo: number,
  pageSize: number,
  sort: string,
  recipientName: string | null,
  notifyType: number | null

}

export interface NotifyRecipient {
  id: string;
  notifyName: string;
  groupName: string;
  notifyType: number;
  description: string;
  notifyAttribute: any;
  recipientName: string;
}

export interface NotifyRecipientPage {
  total: number;
  data: NotifyRecipient[];
}



/** get notify recipient list */
export function fetchGetNotifyRecipientPageList(params?: NotifyRecipientParams) {
  return request.get<NotifyRecipientPage>('/api/v1/notifyRecipients', { params });
}

/** get notify recipient list */
export function fetchGetNotifyRecipientList() {
  return request.get<NotifyRecipient[]>('/api/v1/notifyRecipients');
}

/** add notify recipient */
export function fetchAddNotifyRecipient(data: any) {
  return request.post<boolean>('/api/v1/notifyRecipients', data);
}

/** edit notify recipient */
export function fetchEditNotifyRecipient(data: any) {
  return request.put<boolean>(`/api/v1/notifyRecipients/${data.id}`, data);
}

/** delete notify recipient */
export function fetchDeleteNotifyRecipient(data: string[]) {
  return request.delete<boolean>('/api/v1/notifyRecipients/ids', { data });
}
