import { configRequest as request } from '@/utils/request';
import type { ConfigComponent, ConfigComponentParams } from '@/types/config';

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