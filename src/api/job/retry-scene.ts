import { jobRequest as request } from '@/utils/request';
import type { RetryScene, RetryScenePage, RetrySceneParams } from '@/types/job';

/** get retry scene list */
export function fetchGetRetryScenePageList(params?: RetrySceneParams) {
  return request.get<RetryScenePage>('/api/v1/sceneConfig', { params });
}

/** get retry scene list */
export function fetchGetRetrySceneList(params?: RetrySceneParams) {
  return request.get<RetryScene[]>('/api/v1/sceneConfig', { params });
}

/** add retry scene */
export function fetchAddRetryScene(data: any) {
  return request.post<boolean>('/api/v1/sceneConfig', data);
}

/** edit retry scene */
export function fetchEditRetryScene(id: string, data: any) {
  return request.put<boolean>(`/api/v1/sceneConfig/${id}`, data);
}

/** update retry scene status */
export function fetchUpdateSceneStatus(id: string, status: boolean) {
  if (status) {
    return request.put<boolean>(`/api/v1/sceneConfig/${id}/enable`);
  } else {
    return request.put<boolean>(`/api/v1/sceneConfig/${id}/disable`);
  }
}

/** delete retry scene status */
export function fetchDeleteRetryScene(id: string) {
  return request.delete<boolean>('/api/v1/sceneConfig/ids', { data: [id] });
}

/** batch delete retry scene status */
export function fetchBatchDeleteRetryScene(data: string[]) {
  return request.delete<boolean>('/api/v1/sceneConfig/ids', { data });
}
