import { configRequest as request } from '@/utils/request';
import type { CloneNamespaceParams, SyncNamespaceParams } from '@/types/config';

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