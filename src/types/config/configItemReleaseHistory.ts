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