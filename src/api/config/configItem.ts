import request from '../../utils/request';

export interface ConfigItem {
  id: number;
  configEnvironmentId: number;
  namespaceId: string;
  namespaceStatus: number;
  formatType: number;
  type: number;
  oldContent: string;
  content: string;
  md5: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigItemResponse {
  data: ConfigItem[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface ConfigItemParams {
  pageNo: number;
  pageSize: number;
  configEnvironmentId: number;
}

/**
 * 获取配置项列表
 */
export function getConfigItems(params: ConfigItemParams): Promise<ConfigItemResponse> {
  return request.get('/api/v1/configItems', { params });
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
export function updateConfigContent(id: number, content: string) {
  return request.put<ConfigItem>(`/api/v1/configItems/${id}/content`, { content });
} 