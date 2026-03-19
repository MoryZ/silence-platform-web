export interface AuthUser {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  roles: string[];
  permissions: string[];
}

export interface AuthLoginParams {
  username: string;
  password: string;
  remember?: boolean;
}

export interface AuthLoginResponse {
  token: string;
}