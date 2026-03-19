import { configRequest as request } from '@/utils/request';
import type { BatchPublishParams, PublishParams } from '@/types/config';
export function batchPublishConfigs(params: BatchPublishParams) {
  return request.post('/api/v1/configItemReleaseHistories/batch', params);
} 

export function publishConfig(data: Partial<PublishParams>) {
  return request.put('/api/v1/configItemReleaseHistories/release', data);
} 