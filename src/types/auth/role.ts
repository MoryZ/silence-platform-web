export interface Role {
  id: number;
  name: string;
  code: string;
  appCode: string;
  description: string;
  status: boolean;
  createdDate: string;
  permissions?: string[];
}

export interface RoleResponse {
  data: Role[];
  total: number;
}

export interface RoleParams {
  name?: string;
  code?: string;
  appCode?: string;
  status?: number;
  pageNo?: number;
  pageSize?: number;
}