import { configRequest as request } from '@/utils/request';
import type {
  ConfigItemHistory,
  ConfigItemHistoryParams,
} from '@/types/config';

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
