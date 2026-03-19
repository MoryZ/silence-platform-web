import { configRequest as request } from '@/utils/request';
import type {
  ConfigCyberarkInfo,
  ConfigCyberarkInfoResponse,
  ConfigCyberarkInfoParams,
} from '@/types/config';

/**
 * 获取配置CyberarkInfo列表
 */
export function getConfigCyberarkInfos(params: ConfigCyberarkInfoParams) {
  return request.get<ConfigCyberarkInfoResponse>('/api/v1/configCyberarkInfos', { params });
}

/**
 * 创建配置CyberarkInfo
 */
export function createConfigCyberarkInfo(data: Partial<ConfigCyberarkInfo>) {
  return request.post<ConfigCyberarkInfo>('/api/v1/configCyberarkInfos', data);
}

/**
 * 更新配置CyberarkInfo
 */
export function updateConfigCyberarkInfo(id: number, data: Partial<ConfigCyberarkInfo>) {
  return request.put<ConfigCyberarkInfo>(`/api/v1/configCyberarkInfos/${id}`, data);
}

/**
 * 启用CyberarkInfo状态
 */
export function enableConfigCyberarkInfo(id: number) {
  return request.put<ConfigCyberarkInfo>(`/api/v1/configCyberarkInfos/${id}/enable`);
}

/**
 * 禁用CyberarkInfo状态
 */
export function disableConfigCyberarkInfo(id: number) {
  return request.put<ConfigCyberarkInfo>(`/api/v1/configCyberarkInfos/${id}/disable`);
}

/**
 * 删除配置CyberarkInfo
 */
export function deleteConfigCyberarkInfo(id: number) {
  return request.delete(`/api/v1/configCyberarkInfos/${id}`);
} 