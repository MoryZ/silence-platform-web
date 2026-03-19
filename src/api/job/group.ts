import { jobRequest as request } from '@/utils/request';
import type {
  CommonSelectedVO,
  GroupConfigRequestVO,
  GroupConfigResponseVO,
  GroupConfigSearchParams,
  GroupConfigUpdateVO
} from '@/types/job';

/** get groupConfig list */
export function getGroupPage(params:GroupConfigSearchParams) {
  return request.get<GroupConfigResponseVO>('/api/v1/groupConfigs', { params });

}

/** get all group config list */
export function getAllGroupConfigs() {
  return request.get('/api/v1/groupConfigs');
}


export function getAllGroupNameList(params?:GroupConfigSearchParams) {
  return request.get<CommonSelectedVO[]>('/api/v1/groupConfigs');
}

/** add groupConfig */
export function createGroup(data:GroupConfigRequestVO) {
  return request.post('/api/v1/groupConfigs', data);
}

/** edit groupConfig */
export function updateGroup(id:number, data:GroupConfigRequestVO) {
  return request.put(`/api/v1/groupConfigs/${id}`, data);
}

export function enableGroup(data:GroupConfigUpdateVO) {
  return request.put('/api/v1/groupConfigs/enable', data);
}


export function disableGroup(data:GroupConfigUpdateVO) {
  return request.put('/api/v1/groupConfigs/disable', data);
}

/** get all group config list */
export function getAllGroupConfigListByNameSpaceIdIn(data: string[]) {
  return request.post( '/api/v1/groupConfigs', data);
}

/** delete group by id */
export function deleteGroup(groupName: string) {
  return request.delete(`/api/v1/groupConfigs/${groupName}`);
}