import { configRequest as request } from '@/utils/request';

interface CloneNamespaceParams {
  sourceEnvironmentId: number;
  targetEnvironmentId: number;
  cloneMode: number;
}

export function cloneNamespace(params: CloneNamespaceParams) {
  return request.post('/api/v1/configNamespaces/clone', params);
} 