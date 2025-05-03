import request from '../utils/request';

interface CloneNamespaceParams {
  sourceEnvironmentId: number;
  targetEnvironmentId: number;
  cloneMode: number;
}

export function cloneNamespace(params: CloneNamespaceParams) {
  return request({
    url: '/api/v1/configNamespaces/clone',
    method: 'post',
    data: params
  });
} 