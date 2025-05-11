import request from '../../utils/request';

export interface ConfigItemReleaseHistory {
  id: number;
  configItemId: number;
  releaseName: string;
  oldContent: string;
  content: string;
  releaseType: number;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigItemReleaseHistoryParams {
  pageNo: number;
  pageSize: number;
  configItemId: number;
  createdDateStart: string | undefined;
  createdDateEnd: string | undefined;
}

export interface ConfigItemReleaseHistoryResponse {
  data: ConfigItemReleaseHistory[];
  total: number;
}

/**
 * 获取配置项列表
 */
export function getConfigItemReleaseHistories(params: ConfigItemReleaseHistoryParams) {
  return request.get<ConfigItemReleaseHistoryResponse>('/api/v1/configItemReleaseHistories', { params });
}



