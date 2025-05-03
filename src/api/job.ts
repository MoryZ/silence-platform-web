import request from '../utils/request'; // 暂时保留，后续可根据实际情况修改


export interface JobInfo {
  id: number;
  jobGroupId: number;
  jobDesc: string;
  addTime: string;
  updateTime: string;
  author: string;
  alarmEmail: string;
  scheduleType: number;
  scheduleConf: string;
  misfireStrategy: string;
  executorRouteStrategy: string;
  executorHandler: string;
  executorParam: string;
  executorBlockStrategy: string;
  executorTimeout: number;
  executorFailRetryCount: number;
  glueType: string;
  glueSource: string;
  glueRemark: string;
  glueUpdatedTime: string;
  childJobId: string;
  triggerStatus: number;
  triggerLastTime: number;
  triggerNextTime: number;
}

interface JobListResponse {
    data: JobInfo[];
    total: number;
}

export const getJobList = (pageNo: number, pageSize: number) => {
  return request.get<JobListResponse>(`/api/v1/jobInfos?pageNo=${pageNo}&pageSize=${pageSize}`)
    .then(response => {
      if (typeof response.data === 'object' && response.data!== null) {
        return response;
      } else {
        throw new Error('Invalid API response format');
      }
    });
};

/**
 * 创建job
 */
export function createJob(data: Partial<JobInfo>) {
  return request.post<JobInfo>('/api/v1/jobInfos', data);
}

/**
 * 更新job
 */
export function updateJob(id: number, data: Partial<JobInfo>) {
  return request.put<JobInfo>(`/api/v1/jobInfos/${id}`, data);
}

/**
 * 删除job
 */
export function deleteJob(id: number) {
  return request.delete(`/api/v1/jobInfos/${id}`);
}

/**
 * 执行job
 */
export function runJob(id: number) {
  return request.put(`/api/v1/jobInfos/${id}/run`);
}

/**
 * 暂停job
 */
export function pauseJob(id: number) {
  return request.put(`/api/v1/jobInfos/${id}/pause`);
}

/**
 * 恢复job
 */
export function resumeJob(id: number) {
  return request.put(`/api/v1/jobInfos/${id}/resume`);
}

/**
 * 获取job日志
 */
export function getJobLog(id: number) {
  return request.get(`/api/v1/jobLogs?jobId=${id}`);
}

/**
 * 获取job日志详情
 */
export function getJobLogDetail(id: number) {
  return request.get(`/api/v1/jobLogs/${id}`);
}

