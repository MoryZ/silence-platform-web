import { configRequest as request } from '@/utils/request';
import type {
  ConfigItem,
  ConfigItemResponse,
  ConfigItemParams,
  CompareConfigParams,
} from '@/types/config';

/**
 * 获取配置项列表
 */
export function getConfigItems(params: ConfigItemParams) {
  return request.get<ConfigItemResponse>('/api/v1/configItems', { params });
}

export function getConfigItemList(configComponentId: number, environmentName: string) {
  return request.get<ConfigItem[]>('/api/v1/configItems', { 
    params: { 
      configComponentId, 
      environmentName 
    } 
  });
}

/**
 * 创建配置项
 */
export function createConfigItem(data: Partial<ConfigItem>) {
  return request.post<ConfigItem>('/api/v1/configItems', data);
}

/**
 * 更新配置项
 */
export function updateConfigItem(id: number, data: Partial<ConfigItem>) {
  return request.put<ConfigItem>(`/api/v1/configItems/${id}`, data);
}

/**
 * 删除配置项
 */
export function deleteConfigItem(id: number) {
  return request.delete(`/api/v1/configItems/${id}`);
}

/**
 * 更新配置内容
 */
export function updateConfigContent(id: number, content: string, operationType: number) {
  return request.put<ConfigItem>(`/api/v1/configItems/${id}/content`, { content: content, operationType: operationType });
}

/**
 * 获取指定配置项详情（用于比较）
 */
export function getConfigItemById(id: number) {
  return request.get<ConfigItem>(`/api/v1/configItems/${id}`);
}

export function compareConfig(params: CompareConfigParams) {
  return request.post<{ source: ConfigItem; target: ConfigItem | null }>('/api/v1/configItems/compare', params);
} 