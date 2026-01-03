import { configRequest as request } from '@/utils/request';

interface CloneNamespaceParams {
  sourceEnvironmentId: number;
  targetEnvironmentId: number;
  cloneMode: number;
}

interface SyncNamespaceParams {
  sourceConfigItemId: number;
  targetEnvironmentId: number;
  targetNamespaceIds: string[];
  conflictStrategy: number; // 1: 终止导入, 2: 跳过, 3: 覆盖
}

/**
 * 克隆命名空间
 * @param params 克隆参数
 */
export function cloneNamespace(params: CloneNamespaceParams) {
  return request.post('/api/v1/configNamespaces/clone', params);
} 

/**
 * 同步命名空间
 * @param params 同步参数
 */
export function syncNamespace(params: SyncNamespaceParams) {
  return request.post('/api/v1/configNamespaces/sync', params);
} 