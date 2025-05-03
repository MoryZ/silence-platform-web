import request from '../utils/request';

export interface ConfigEnvironment {
  id: number;
  name: string;
  displayName: string;
  envType: number;
  display: boolean;
  configComponentId: number;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigEnvironmentParams {
  configComponentId: number;
  envType: number;
}

/**
 * 获取配置环境列表
 */
export function getConfigEnvironments(params: ConfigEnvironmentParams) {
  return request.get<ConfigEnvironment[]>('/api/v1/configEnvironments', { params });
}

/**
 * 创建配置环境
 */
export function createConfigEnvironment(data: Partial<ConfigEnvironment>) {
  return request.post<ConfigEnvironment>('/api/v1/configEnvironments', data);
}

/**
 * 更新配置环境
 */
export function updateConfigEnvironment(id: number, data: Partial<ConfigEnvironment>) {
  return request.put<ConfigEnvironment>(`/api/v1/configEnvironments/${id}`, data);
}

/**
 * 删除配置环境
 */
export function deleteConfigEnvironment(id: number) {
  return request.delete(`/api/v1/configEnvironments/${id}`);
} 