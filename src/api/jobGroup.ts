import request from '../utils/request';
import type { EnvType } from '../stores/env';

export interface JobGroup {
  id: number;
  appName: string;
  title: string;
  registryType: number;
  addressList: string[];
  env: EnvType;
}

export interface JobGroupParams {
  pageNo: number;
  pageSize: number;
  appName?: string;
  title?: string;
  env: EnvType;
}

export interface JobGroupResponse {
  data: JobGroup[];
  total: number;
}

/**
 * 获取执行器列表
 */
export function getJobGroups(params: JobGroupParams) {
  return request.get<JobGroupResponse>('/api/v1/jobGroups', { params });
}

/**
 * 创建执行器
 */
export function createJobGroup(data: Partial<JobGroup>) {
  return request.post<JobGroup>('/api/v1/jobGroups', data);
}

/**
 * 更新执行器
 */
export function updateJobGroup(id: number, data: Partial<JobGroup>) {
  return request.put<JobGroup>(`/api/v1/jobGroups/${id}`, data);
}

/**
 * 删除执行器
 */
export function deleteJobGroup(id: number) {
  return request.delete(`/api/v1/jobGroups/${id}`);
} 