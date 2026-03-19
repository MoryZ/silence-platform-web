export interface ConfigCyberarkInfo {
  id: number;
  cyberarkObject: string;
  componentCode: string;
  encryptedValue: string;
  safe: string;
  folder: string;
  description: string;
  enabled: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigCyberarkInfoResponse {
  data: ConfigCyberarkInfo[];
  total: number;
}

export interface ConfigCyberarkInfoParams {
  cyberarkObject?: string;
  componentCode?: string;
  enabled?: boolean;
  pageNo: number;
  pageSize: number;
  sort: string;
}