import { configRequest as request } from '@/utils/request';

interface BatchPublishParams {
  configItemIds: number[];
  releaseName: string;
  releaseType: number;
  environmentId: number;
}

interface PublishParams {
  releaseName: string;
  configItemId: number;
  oldContent: string;
  content: string;
  releaseType: number;
}
export function batchPublishConfigs(params: BatchPublishParams) {
  return request.post('/api/v1/configItemReleaseHistories/batch', params);
} 

export function publishConfig(data: Partial<PublishParams>) {
  return request.put('/api/v1/configItemReleaseHistories/release', data);
} 