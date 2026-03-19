export type OAuthProvider = 'github' | 'google' | 'wechat' | 'qq';

export interface OAuthLoginParams {
  provider: OAuthProvider;
  code?: string;
  state?: string;
}

export interface OAuthCallbackResult {
  token: string;
  userInfo: any;
  menus: any[];
  needBind: boolean;
}

export interface OAuthUrlResponse {
  url: string;
  state: string;
}