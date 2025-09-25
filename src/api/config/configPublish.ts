import { configRequest as request } from '@/utils/request';

interface BatchPublishParams {
  configItemIds: number[];
  releaseName: string;
  releaseType: number;
  environmentId: number;
}

export function batchPublishConfigs(params: BatchPublishParams) {
  return request.post('/api/v1/configPublish/batch', params);
} 