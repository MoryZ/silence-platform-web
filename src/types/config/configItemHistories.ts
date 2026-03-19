export interface ConfigItemHistory {
  id: number;
  configEnvironmentId: number;
  configItemId: number;
  oldContent: string;
  content: string;
  md5: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  operationType: number;
}

export interface ConfigItemHistoryResponse {
  data: ConfigItemHistory[];
  total: number;
}

export interface ConfigItemHistoryParams {
  configItemId: number;
}