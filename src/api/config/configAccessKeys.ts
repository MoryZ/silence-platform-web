import { configRequest as request } from '@/utils/request';

export interface ConfigAccessKeys {
  id: number;
  componentCode: string;
  accessKey: string;
  secretKey: string;
  description: string;
  enabled: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigAccessKeysResponse {
  data: ConfigAccessKeys[];
  total: number;
}

export interface ConfigAccessKeysParams {
  componentCode?: string;
  enabled?: boolean;
  pageNo: number;
  pageSize: number;
  sort: string;
}

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