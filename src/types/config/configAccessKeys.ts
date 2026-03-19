export interface ConfigAccessKeys {
  id: number;
  componentCode: string;
  accessKey: string;
  secretKey: string;
  description: string;
  enabled: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigAccessKeysResponse {
  data: ConfigAccessKeys[];
  total: number;
}

export interface ConfigAccessKeysParams {
  componentCode?: string;
  enabled?: boolean;
  pageNo: number;
  pageSize: number;
  sort: string;
}