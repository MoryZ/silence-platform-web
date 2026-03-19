export interface ConfigSubsystem {
  id: number;
  name: string;
  code: string;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ConfigSubsystemResponse {
  data: ConfigSubsystem[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface ConfigSubsystemParams {
  pageNo: number;
  pageSize: number;
  name: string;
  code: string;
  description: string;
}