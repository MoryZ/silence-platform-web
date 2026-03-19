import { jobRequest as request } from '@/utils/request';
import type { JobExecutor, JobExecutorPage, JobExecutorParams } from '@/types/job';

/**
 * 分页获取执行器列表
 */
export function getJobExecutors(params: JobExecutorParams) {
  return request.get<JobExecutorPage>('/api/v1/jobExecutors', { params });
}

/**
 * 获取所有执行器列表
 */
export function getAllJobExecutors() {
  return request.get<JobExecutor[]>('/api/v1/jobExecutors');
}


/**
 * 创建执行器
 */
export function createJobExecutor(data: Partial<JobExecutor>) {
  return request.post<JobExecutor>('/api/v1/jobExecutors', data);
}

/**
 * 更新执行器
 */
export function updateJobExecutor(id: number, data: Partial<JobExecutor>) {
  return request.put<JobExecutor>(`/api/v1/jobExecutors/${id}`, data);
}

/**
 * 删除执行器
 */
export function deleteJobExecutor(id: number) {
  return request.delete(`/api/v1/jobExecutors/${id}`);
} 
