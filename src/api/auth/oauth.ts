import { authRequest as request } from '@/utils/request';
import type {
  OAuthProvider,
  OAuthLoginParams,
  OAuthCallbackResult,
  OAuthUrlResponse,
} from '@/types/auth';

/**
 * 获取第三方登录授权 URL
 * @param provider 第三方平台类型
 * @returns 授权 URL
 */
export function getOAuthUrl(provider: OAuthProvider): Promise<OAuthUrlResponse> {
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
  provider: OAuthProvider,
  username: string,
  password: string
): Promise<OAuthCallbackResult> {
  return request.post(`/api/v1/auth/oauth/${provider}/bind`, {
    username,
    password
  });
}

