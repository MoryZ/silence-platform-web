import request from '@/utils/request';

export interface Statistics {
  userCount: number;
  roleCount: number;
  menuCount: number;
  version: string;
}

export function getStatistics() {
  return request.get<Statistics>('/api/v1/dashboard/statistics');
} 