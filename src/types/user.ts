export interface UserInfo {
  id: number;
  username: string;
  avatar: string;
  roles: string[];
  permissions?: string[];
}