import { jobRequest as request } from '@/utils/request';
import type { Statistics } from '@/types/auth';

export function getStatistics(): Promise<Statistics> {
  return request.get<Statistics>('/api/v1/workBench/statistics');
} 