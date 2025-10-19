import { configRequest as request } from '@/utils/request';
import type { AxiosResponse } from 'axios';

export interface ConfigItemHistory {
  id: number;
  configEnvironmentId: number;
  configItemId: number;
  oldContent: string;
  content: string;
  md5: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  operationType: number;
}

export interface ConfigItemHistoryResponse {
  data: ConfigItemHistory[];
  total: number;
}

export interface ConfigItemHistoryParams {
  configItemId: number;
}

/**
 * 获取配置项列表
 */
export function getConfigItemHistories(params: ConfigItemHistoryParams) {
  return request.get<ConfigItemHistory[]>('/api/v1/configItemHistories', { params });
}

/**
 * 创建配置项
 */
export function createConfigItemHistory(data: Partial<ConfigItemHistory>) {
  return request.post<ConfigItemHistory>('/api/v1/configItemHistories', data);
}


/**
 * 删除配置项
 */
export function deleteConfigItemHistory(id: number) {
  return request.delete(`/api/v1/configItemHistories/${id}`);
}
