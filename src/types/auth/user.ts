import type { MenuItem } from '@/types/menu';

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
  firstLogin?: boolean;
  forceChangePassword?: boolean;
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