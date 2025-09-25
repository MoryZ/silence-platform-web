import { authRequest as request } from '@/utils/request';

export interface User {
  id: number
  username : string;
  nickname : string;
  avatar : string;
  roles : string[];
  permissions: string[];
} 

export interface LoginParams {
  username : string;
  password : string;
  remember?: boolean;
} 

export interface LoginResponse {
  token : string;
}

export function login(params: LoginParams): Promise<LoginResponse> {
  return request.post('/api/v1/auth/login', params);
}

export function logout() {
  return request.post('/api/v1/auth/logout');
}

export function refreshToken() {
  return request.post('/api/v1/auth/refresh');

}
