import { configRequest as request } from '@/utils/request';
import type {
  ConfigItemReleaseHistoryParams,
  ConfigItemReleaseHistoryResponse,
} from '@/types/config';

/**
 * 获取配置项列表
 */
export function getConfigItemReleaseHistories(params: ConfigItemReleaseHistoryParams) {
  return request.get<ConfigItemReleaseHistoryResponse>('/api/v1/configItemReleaseHistories', { params });
}



