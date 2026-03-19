import { configRequest as request } from '@/utils/request';
import type {
  ConfigAccessKeys,
  ConfigAccessKeysResponse,
  ConfigAccessKeysParams,
} from '@/types/config';

/**
 * 获取配置AccessKeys列表
 */
export function getConfigAccessKeys(params: ConfigAccessKeysParams) {
  return request.get<ConfigAccessKeysResponse>('/api/v1/configAccessKeys', { params });
}

/**
 * 创建配置AccessKeys
 */
export function createConfigAccessKeys(data: Partial<ConfigAccessKeys>) {
  return request.post<ConfigAccessKeys>('/api/v1/configAccessKeys', data);
}

/**
 * 更新配置AccessKeys
 */
export function updateConfigAccessKeys(id: number, data: Partial<ConfigAccessKeys>) {
  return request.put<ConfigAccessKeys>(`/api/v1/configAccessKeys/${id}`, data);
}

/**
 * 启用AccessKeys状态
 */
export function enableConfigAccessKeys(id: number) {
  return request.put<ConfigAccessKeys>(`/api/v1/configAccessKeys/${id}/enable`);
}

/**
 * 禁用AccessKeys状态
 */
export function disableConfigAccessKeys(id: number) {
  return request.put<ConfigAccessKeys>(`/api/v1/configAccessKeys/${id}/disable`);
}


/**
 * 删除配置AccessKeys
 */
export function deleteConfigAccessKeys(id: number) {
  return request.delete(`/api/v1/configAccessKeys/${id}`);
} 