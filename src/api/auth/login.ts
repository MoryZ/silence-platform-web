import { authRequest as request } from '@/utils/request';
import type { AuthLoginParams, AuthLoginResponse } from '@/types/auth';

export function login(params: AuthLoginParams): Promise<AuthLoginResponse> {
  return request.post('/api/v1/auth/login', params);
}

export function logout() {
  return request.post('/api/v1/auth/logout');
}

export function refreshToken() {
  return request.post('/api/v1/auth/refresh');

}
