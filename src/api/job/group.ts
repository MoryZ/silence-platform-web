import request from '../../utils/request';

export interface GroupConfigSearchParams {
  groupName: string;
  groupStatus: boolean;
  pageNo: number;
  pageSize:number;
}

export interface GroupConfigRequestVO {
  groupName: string; // 组名称, 长度为1~64字符且类型为数字、字母、下划线和短横线
  groupStatus: boolean; // 组状态不能为空
  token: string; // 令牌不能为空
  description?: string; // 描述，可以为空
  groupPartition: number; // 分区不能为空
  idGeneratorMode: number; // 唯一id生成模式, 不能为空
  initScene: boolean; // 初始化场景, 不能为空
}

export interface GroupConfigResponseVO {
  total: number;
  data: GroupConfig[];
}

export interface GroupConfig {
  id: number;
  groupName: string; 
  namespaceId: string;
  namespaceName: string;
  groupStatus: boolean; 
  groupPartition: number;
  routeKey:number;
  version: number;
  description?: string; 
  idGeneratorMode: number; 
  initScene: boolean;
  onlinePodList: string[];
  token: string;
  createdDat: string;
  updatedDate: string;
}

export interface GroupConfigUpdateVO {
  groupName: string; // 组名称, 长度为1~64字符且类型为数字、字母、下划线和短横线
  groupStatus: boolean; // 组状态不能为空
}

/** get groupConfig list */
export function getGroupPage(params?:GroupConfigSearchParams) {
  return request.get<GroupConfigResponseVO>('/api/v1/groupConfigs', { params });

}

/** get all group config list */
export function getAllGroupConfigs() {
  return request.get('/api/v1/groupConfigs');
}


export function getAllGroupNameList(params?:GroupConfigSearchParams) {
  return request.get('/api/v1/groupConfigs');
}

/** add groupConfig */
export function createGroup(data:GroupConfigRequestVO) {
  return request.post('/api/v1/groupConfigs', data);
}

/** edit groupConfig */
export function updateGroup(id:string, data:GroupConfigRequestVO) {
  return request.post(`/api/v1/groupConfigs/${id}`, data);
}

export function updateGroupStatus(data:GroupConfigUpdateVO) {
  return request.put('/api/v1/groupConfigs/status', data);
}


/** get all group config list */
export function getAllGroupConfigListByNameSpaceIdIn(data: string[]) {
  return request.post( '/api/v1/groupConfigs', data);
}

/** delete group by id */
export function deleteGroup(groupName: string) {
  return request.delete(`/api/v1/groupConfigs/${groupName}`);
}
