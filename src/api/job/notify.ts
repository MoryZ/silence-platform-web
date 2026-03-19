import { jobRequest as request } from '@/utils/request';
import type { NotifyConfigPage, NotifyParams } from '@/types/job';

/** get notify list */
export function fetchGetNotifyConfigList(params: NotifyParams) {
  return request.get<NotifyConfigPage>('/api/v1/notifyConfig', { params });
}

/** get notify systemTaskType list */
export function fetchGetNotifyConfigSystemTaskTypeList(systemTaskType: number) {
  return request.get<any>(`/api/v1/notifyConfig/all/${systemTaskType}`);
}

/** add notify */
export function fetchAddNotify(data: any) {
  return request.post<boolean>('/api/v1/notifyConfig', data);
}

/** edit notify */
export function fetchEditNotify(data: any) {
  return request.put<boolean>('/api/v1/notifyConfig', data);
}

/** delete notify */
export function fetchBatchDeleteNotify(data: string[]) {
  return request.delete<boolean>('/api/v1/notifyConfig/ids', { data });
}

/** edit notify status */
export function fetchUpdateNotifyStatus(id: string, status: number) {
  return request.put<boolean>(`/api/v1/notifyConfig/${id}/status/${status}`);
}