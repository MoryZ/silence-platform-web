import { configRequest as request } from '@/utils/request';
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
  subsystemId?: number;
}

/**
 * 获取组件列表
 */
export function getConfigComponents(params: ConfigComponentParams) {
  return request.get<ConfigComponent[]>('/api/v1/configComponents', { params });
}

/**
 * 创建组件
 */
export function createConfigComponent(data: Partial<ConfigComponent>) {
  return request.post<ConfigComponent>('/api/v1/configComponents', data);
}

/**
 * 更新组件
 */
export function updateConfigComponent(id: number, data: Partial<ConfigComponent>) {
  return request.put<ConfigComponent>(`/api/v1/configComponents/${id}`, data);
}

/**
 * 删除组件
 */
export function deleteConfigComponent(id: number) {
  return request.delete(`/api/v1/configComponents/${id}`);
}