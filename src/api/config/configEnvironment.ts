import { configRequest as request } from '@/utils/request';
import type { ConfigEnvironment, ConfigEnvironmentParams } from '@/types/config';

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