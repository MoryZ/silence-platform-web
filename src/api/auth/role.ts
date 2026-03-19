import { authRequest as request } from '@/utils/request';
import type { Role, RoleResponse, RoleParams } from '@/types/auth';

export function getRoles(params: RoleParams): Promise<RoleResponse> {
  return request.get('/api/v1/roles', { params });
}

export function getMinimumRoles(): Promise<Role[]> {
  return request.get('/api/v1/roles/minimum');
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

export function setRolePermissions(id: number, permissions: number[]) {
  return request.put(`/api/v1/roles/${id}/permissions`,  permissions );
}

export function getRolePermissions(id: number) {
  return request.get(`/api/v1/roles/${id}/permissions`);
} 