export interface JobTaskSearchParams {
  groupName: string;
  jobName: string;
  jobStatus: string;
  ownerId: string;
  executorInfo: string;
  pageNo: number;
  pageSize: number;
}

export interface JobSearchParams {
  pageNo: number;
  pageSize: number;
  sort: string;
  groupName: string;
  jobName: string;
  jobStatus: string;
  ownerId: string;
  executorInfo: string;
}

export interface JobSearchListParams {
  groupName: string;
  jobName: string;
  jobStatus: string;
  ownerId: string;
  executorInfo: string;
}

export interface Job {
  id: string;
  groupName: string;
  jobName: string;
  jobStatus: boolean;
  argsStr: string;
  argsType: number;
  routeKey: number;
  executorType: number;
  executorInfo: string;
  triggerType: number;
  triggerInterval: number;
  blockStrategy: number;
  executorTimeout: number;
  maxRetryTimes: number;
  retryInterval: number;
  taskType: number;
  parallelNum: number;
  description: string;
  notifyIds: string[];
  ownerId: string;
  ownerName?: string;
}

export interface TriggerJobParams {
  tmpArgsStr: string;
}

export interface JobNameListSearchParams {
  keywords: string;
  groupName: string;
  jobId: number;
}

export interface ExportJobParams {
  jobIds: string[];
  groupName: string;
  jobName: string;
  jobStatus: boolean;
}