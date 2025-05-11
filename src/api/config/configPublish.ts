import request from '../../utils/request';

interface BatchPublishParams {
  configItemIds: number[];
  releaseName: string;
  releaseType: number;
  environmentId: number;
}

export function batchPublishConfigs(params: BatchPublishParams) {
  return request({
    url: '/api/v1/configPublish/batch',
    method: 'post',
    data: params
  });
} 