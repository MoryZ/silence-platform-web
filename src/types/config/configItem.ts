export interface ConfigItem {
  id: number;
  configEnvironmentId: number;
  namespaceId: string;
  namespaceStatus: number;
  ips: string;
  formatType: number;
  type: number;
  oldContent: string;
  content: string;
  md5: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigItemResponse {
  data: ConfigItem[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface ConfigItemParams {
  pageNo: number;
  pageSize: number;
  configEnvironmentId: number;
  namespaceId?: string;
  content?: string;
}

export interface CompareConfigParams {
  sourceConfigItemId: number;
  targetEnvironmentId: number;
  targetNamespaceId: string;
}