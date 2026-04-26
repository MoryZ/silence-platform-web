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
  return request.post('/api/v1/roles', data, { actionCode: 'system:role:add' });
}

export function updateRole(id: number, data: Partial<Role>): Promise<Role> {
  return request.put(`/api/v1/roles/${id}`, data, { actionCode: 'system:role:edit' });
}

export function deleteRole(id: number) {
  return request.delete(`/api/v1/roles/${id}`, { actionCode: 'system:role:delete' });
}

export function disableRole(id: number) {
  return request.put(`/api/v1/roles/${id}/disable`, undefined, { actionCode: 'system:role:disable' });
}

export function enableRole(id: number) {
  return request.put(`/api/v1/roles/${id}/enable`, undefined, { actionCode: 'system:role:enable' });
}

export function setRolePermissions(id: number, permissions: number[]) {
  return request.put(`/api/v1/roles/${id}/permissions`, permissions, { actionCode: 'system:role:assign-permissions' });
}

export function getRolePermissions(id: number) {
  return request.get(`/api/v1/roles/${id}/permissions`);
} 