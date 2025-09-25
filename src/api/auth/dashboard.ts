import { jobRequest as request } from '@/utils/request';

export interface Statistics {
  configCenter: ConfigStat;
  jobCenter: JobStat;
  mqCenter: MqStat;
}

export interface ConfigStat {
  namespaceCount: number;
  listenerInstanceCount: number;
  componentCount: number;
}

export interface JobStat {
  localJobCount: number;
  remoteJobCount: number;
}

export interface MqStat {
  topicCount: number;
  publishRelationCount: number;
}

export function getStatistics(): Promise<Statistics> {
  return request.get<Statistics>('/api/v1/workBench/statistics');
} 