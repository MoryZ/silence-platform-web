import request from '../utils/request';
import type { AxiosResponse } from 'axios';

export interface ConfigComponent {
  id: number;
  name: string;
  code: string;
  description: string;
  subsystemId: number;
  status: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigComponentParams {
  subsystemId: number;
}

/**
 * 获取配置项列表
 */
export function getConfigComponents(params: ConfigComponentParams): Promise<ConfigComponent[]> {
  return request.get('/api/v1/configComponents', { params });
}

/**
 * 创建配置项
 */
export function createConfigComponent(data: Partial<ConfigComponent>) {
  return request.post<ConfigComponent>('/api/v1/configComponents', data);
}

/**
 * 更新配置项
 */
export function updateConfigComponent(id: number, data: Partial<ConfigComponent>) {
  return request.put<ConfigComponent>(`/api/v1/configComponents/${id}`, data);
}

/**
 * 删除配置项
 */
export function deleteConfigComponent(id: number) {
  return request.delete(`/api/v1/configComponents/${id}`);
}