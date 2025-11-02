import { configRequest as request } from '@/utils/request';
import type { AxiosResponse } from 'axios';

export interface ConfigSubsystem {
  id: number;
  name: string;
  code: string;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigSubsystemResponse {
  data: ConfigSubsystem[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface ConfigSubsystemParams {
  pageNo: number;
  pageSize: number;
  name: string;
  code: string;
  description: string;
}

/**
 * 获取配置项列表
 */
export function getAllConfigSubsystem(): Promise<ConfigSubsystem[]> {
  return request.get<ConfigSubsystem[]>('/api/v1/configSubsystems', {});
}


/**
 * 分页获取配置项列表
 */
export function getConfigSubsystems(params: ConfigSubsystemParams): Promise<ConfigSubsystemResponse> {
  return request.get<ConfigSubsystemResponse>('/api/v1/configSubsystems', { params });
}

/**
 * 创建配置项
 */
export function createConfigSubsystem(data: Partial<ConfigSubsystem>) {
  return request.post<ConfigSubsystem>('/api/v1/configSubsystems', data);
}

/**
 * 更新配置项
 */
export function updateConfigSubsystem(id: number, data: Partial<ConfigSubsystem>) {
  return request.put<ConfigSubsystem>(`/api/v1/configSubsystems/${id}`, data);
}

/**
 * 删除配置项
 */
export function deleteConfigSubsystem(id: number) {
  return request.delete(`/api/v1/configSubsystems/${id}`);
}
