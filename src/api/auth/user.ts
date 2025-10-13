import { MenuItem } from '@/types/menu';
import { authRequest as request } from '@/utils/request';

export interface User {
  id: number;
  username: string;
  password: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  status: boolean;
  roleIds: number[];
}

export interface UserQuery {
  pageNo: number;
  pageSize: number;
  username?: string;
  nickname?: string;
  status?: boolean;
}

export interface UserListResponse {
  data: User[];
  total: number;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  email?: string;
  phone?: string;
  status?: boolean;
  createdDate?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userInfo: UserInfo;
  menus: MenuItem[];
}

export function getUserList(query: UserQuery): Promise<UserListResponse> {
  return request.get('/api/v1/users', { params: query });
}

export function getUserById(id: number): Promise<User> {
  return request.get(`/api/v1/users/${id}`);
}

export function addUser(data: Partial<User>): Promise<User> {
  return request.post('/api/v1/users', data);
}

export function updateUser(id: number, data: Partial<User>): Promise<User> {
  return request.put(`/api/v1/users/${id}`, data);
}

export function deleteUser(id: number): Promise<any> {
  return request.delete(`/api/v1/users/${id}`);
}

export function enableUser(id: number): Promise<any> {
  return request.put(`/api/v1/users/${id}/enable`);
}

export function disableUser(id: number): Promise<any> {
  return request.put(`/api/v1/users/${id}/disable`);
}

export function login(data: LoginParams): Promise<LoginResult> {
  return request.post('/api/v1/auth/login', data);
}

export function logout(): Promise<any> {
  return request.post('/api/v1/auth/logout');
}

export function getUserInfo(): Promise<UserInfo> {
  return request.get('/api/v1/users/info');
}

export function resetPassword(id: number, newPassword: string): Promise<any> {
  return request.put(`/api/v1/users/${id}/resetPassword`, {
    newPassword
  });
} 