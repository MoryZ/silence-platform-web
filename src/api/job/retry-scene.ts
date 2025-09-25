import request from '../../utils/request';

/** get retry scene list */
export function fetchGetRetryScenePageList(params?: any) {
  return request.get<any>('/scene-config/page/list', { params });
}

/** get retry scene list */
export function fetchGetRetrySceneList(params?: any) {
  return request.get<any>('/scene-config/list', { params });
}

/** add retry scene */
export function fetchAddRetryScene(data: any) {
  return request.post<boolean>('/scene-config', data);
}

/** edit retry scene */
export function fetchEditRetryScene(data: any) {
  return request.put<boolean>('/scene-config', data);
}

/** update retry scene status */
export function fetchUpdateSceneStatus(id: string, status: number) {
  return request.put<boolean>(`/scene-config/${id}/status/${status}`);
}

/** delete retry scene status */
export function fetchDeleteRetryScene(id: string) {
  return request.delete<boolean>('/scene-config/ids', { data: [id] });
}

/** batch delete retry scene status */
export function fetchBatchDeleteRetryScene(data: string[]) {
  return request.delete<boolean>('/scene-config/ids', { data });
}
