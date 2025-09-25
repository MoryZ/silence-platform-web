import { authRequest as request } from '@/utils/request';

export interface Role {
  id: number;
  name: string;
  code: string;
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
  status?: number;
  pageNo?: number;
  pageSize?: number;
}

export function getRoles(params: RoleParams): Promise<RoleResponse> {
  return request.get('/api/v1/roles', { params });
}

export function getRoleList(): Promise<Role[]> {
    return request.get('/api/v1/roles');
  }

export function createRole(data: Partial<Role>): Promise<Role> {
  return request.post('/api/v1/roles', data);
}

export function updateRole(id: number, data: Partial<Role>): Promise<Role> {
  return request.put(`/api/v1/roles/${id}`, data);
}

export function deleteRole(id: number) {
  return request.delete(`/api/v1/roles/${id}`);
}

export function disableRole(id: number) {
  return request.put(`/api/v1/roles/${id}/disable`);
}

export function enableRole(id: number) {
  return request.put(`/api/v1/roles/${id}/enable`);
}

export function setRolePermissions(id: number, permissions: string[]) {
  return request.put(`/api/v1/roles/${id}/permissions`,  permissions );
}

export function getRolePermissions(id: number) {
  return request.get(`/api/v1/roles/${id}/permissions`);
} 