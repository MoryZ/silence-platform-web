import { authRequest as request } from '@/utils/request';

export interface OAuthLoginParams {
  provider: 'github' | 'google' | 'wechat' | 'qq';
  code?: string; // OAuth 授权码
  state?: string; // 状态参数，用于防止 CSRF 攻击
}

export interface OAuthCallbackResult {
  token: string;
  userInfo: any;
  menus: any[];
  needBind: boolean; // 是否需要绑定账号
}

/**
 * 获取第三方登录授权 URL
 * @param provider 第三方平台类型
 * @returns 授权 URL
 */
export function getOAuthUrl(provider: 'github' | 'google' | 'wechat' | 'qq'): Promise<{ url: string; state: string }> {
  return request.get(`/api/v1/auth/oauth/${provider}/url`);
}

/**
 * OAuth 回调处理（后端处理授权码并返回系统 token）
 * @param params OAuth 登录参数
 * @returns 登录结果
 */
export function oauthCallback(params: OAuthLoginParams): Promise<OAuthCallbackResult> {
  return request.post(`/api/v1/auth/oauth/${params.provider}/callback`, {
    code: params.code,
    state: params.state
  });
}

/**
 * 绑定第三方账号到已有账号
 * @param provider 第三方平台类型
 * @param username 用户名
 * @param password 密码
 */
export function bindOAuthAccount(
  provider: 'github' | 'google' | 'wechat' | 'qq',
  username: string,
  password: string
): Promise<OAuthCallbackResult> {
  return request.post(`/api/v1/auth/oauth/${provider}/bind`, {
    username,
    password
  });
}

