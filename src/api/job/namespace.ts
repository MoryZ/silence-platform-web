import request from '../../utils/request';

export interface NameSpace {
  id: number;
  name: string;
  uniqueId: string;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface NameSpacePage {
 total: number
 data: NameSpace[]
}

export interface NameSpaceParams {
  name: string;
  uniqueId: string;
  pageNo: number;
  pageSize: number;
}

/**
 * 分页获取配置环境列表
 */
export function getNamespaces(params: NameSpaceParams) {
  return request.get<NameSpacePage>('/api/v1/namespaces', { params });
}

/**
 * 获取所有配置环境列表
 */
export function getAllNamespaces() {
  return request.get<NameSpace[]>('/api/v1/namespaces');
}


/**
 * 创建配置环境
 */
export function createNamespace(data: Partial<NameSpace>) {
  return request.post<NameSpace>('/api/v1/namespaces', data);
}

/**
 * 更新配置环境
 */
export function updateNamespace(id: number, data: Partial<NameSpace>) {
  return request.put<NameSpace>(`/api/v1/namespaces/${id}`, data);
}

/**
 * 删除配置环境
 */
export function deleteNamespace(uniqueId: string) {
  return request.delete(`/api/v1/namespaces/${uniqueId}`);
} 
