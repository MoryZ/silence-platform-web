import { authRequest as request } from '@/utils/request';
import type {
  User,
  UserQuery,
  UserListResponse,
  UserInfo,
  LoginParams,
  LoginResult,
} from '@/types/auth';

export function getUserList(query: UserQuery): Promise<UserListResponse> {
  return request.get('/api/v1/users', { params: query });
}

export function getUserById(id: number): Promise<User> {
  return request.get(`/api/v1/users/${id}`);
}

export function addUser(data: Partial<User>): Promise<User> {
  return request.post('/api/v1/users', data);
}

export function registerUser(data: Partial<User>): Promise<User> {
  return request.post('/api/v1/users/register', data);
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
  return request.put(`/api/v1/users/${id}/resetPassword`, { newPassword: newPassword });
}

// 修改密码（已登录用户）
export function modifyPassword(username: string, newPassword: string): Promise<any> {
  return request.post('/api/v1/users/modifyPassword', {
    username: username,
    newPassword: newPassword
  });
}

// 忘记密码（重置密码）
export function forgotPassword(identifier: string, newPassword: string): Promise<any> {
  return request.post('/api/v1/auth/forgot-password', { 
    identifier: identifier,
    newPassword: newPassword 
  });
} 