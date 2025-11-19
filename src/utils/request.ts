import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'ant-design-vue';
import { ls } from './stoarge';
import { TOKEN } from './constant';
import { useUserStore } from '@/stores/user';

/**
 * 判断是否是 token 过期导致的错误
 * 通过检查错误消息中是否包含 token 过期相关的关键词来判断
 */
function isTokenExpiredError(error: AxiosError): boolean {
  // 获取错误消息（不区分大小写）
  const errorData = error.response?.data as any;
  const errorMessage = (
    (errorData?.message) ||
    (errorData?.msg) ||
    error.message ||
    ''
  ).toLowerCase();

  // 明确的 token 过期关键词（这些关键词明确表示 token 过期）
  const explicitTokenExpiredKeywords = [
    'token expired',
    'token is expired',
    'token过期',
    'token 过期',
    '登录已过期',
    '登录过期',
    'token失效',
    'token 失效',
    'token无效',
    'token 无效',
    'expired token',
    'invalid token',
    '认证失败',
    '认证过期',
    '认证已过期',
    '身份验证失败',
    '身份验证过期',
  ];

  // 检查是否包含明确的 token 过期关键词
  const hasExplicitTokenExpiredKeyword = explicitTokenExpiredKeywords.some(
    (keyword) => errorMessage.includes(keyword)
  );

  if (hasExplicitTokenExpiredKeyword) {
    return true;
  }

  // 如果错误消息中包含 "token" 和 "expired"/"过期"/"失效" 等词汇，也认为是 token 过期
  if (
    errorMessage.includes('token') &&
    (errorMessage.includes('expired') ||
      errorMessage.includes('过期') ||
      errorMessage.includes('失效') ||
      errorMessage.includes('invalid'))
  ) {
    return true;
  }

  // 如果错误消息中包含 "登录" 和 "过期"/"失效" 等词汇，也认为是 token 过期
  if (
    errorMessage.includes('登录') &&
    (errorMessage.includes('过期') || errorMessage.includes('失效'))
  ) {
    return true;
  }

  // 如果只是简单的 "unauthorized" 或 "未授权"，且没有其他标识，认为是权限问题，不是 token 过期
  // 注意：这个判断放在最后，避免误判
  if (
    (errorMessage === 'unauthorized' ||
      errorMessage === '未授权' ||
      errorMessage.trim() === 'unauthorized' ||
      errorMessage.trim() === '未授权') &&
    !errorMessage.includes('token') &&
    !errorMessage.includes('登录') &&
    !errorMessage.includes('认证')
  ) {
    return false;
  }

  // 默认情况下，如果是 401 但没有明确的 token 过期标识，保守地认为是权限问题
  // 但这里已经在外层判断了，所以默认返回 false
  return false;
}
// 创建自定义的 axios 实例类型
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

function attachInterceptors(instance: AxiosInstance) {
  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      const token = ls.get(TOKEN)
      if (token) {
        if (!config.headers) config.headers = {} as any;
        const h: any = config.headers;
        if (typeof h.set === 'function') {
          h.set('Authorization', `Bearer ${token}`);
        } else {
          h['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<any>) => {
      if (response.data && typeof response.data === 'object' && 'code' in response.data) {
        if (response.data.code !== 200) {
          // 处理业务层面的 403 错误（token过期）
          if (response.data.code === 403) {
            const userStore = useUserStore();
            message.error(response.data.msg || response.data.message || '登录已过期，请重新登录');
            userStore.handleLogout();
            return Promise.reject(new Error(response.data.msg || response.data.message || '登录已过期，请重新登录'));
          }
          
          // 处理业务层面的 401 错误（无权限）
          if (response.data.code === 401) {
            const token = ls.get(TOKEN);
            
            if (token) {
              // token 存在，只提示无权限，不跳转登录页
              message.error(response.data.msg || response.data.message || '无权限访问该资源');
            } else {
              // token 不存在，清除登录状态并跳转
              const userStore = useUserStore();
              message.error(response.data.msg || response.data.message || '请先登录');
              userStore.handleLogout();
            }
            return Promise.reject(new Error(response.data.msg || response.data.message || '无权限访问该资源'));
          }
          
          // 其他业务错误
          message.error(response.data.msg || '请求失败');
          return Promise.reject(new Error(response.data.msg || '请求失败'));
        }
        return response.data.data;
      }
      return response.data;
    },
    (error) => {
      // 处理 HTTP 状态码层面的 403 错误（token过期）
      if (error.response?.status === 403) {
        // 403 表示 token 过期，清除登录状态并跳转
        const userStore = useUserStore();
        message.error('登录已过期，请重新登录');
        userStore.handleLogout();
        return Promise.reject(error);
      }
      
      // 处理 HTTP 状态码层面的 401 错误（无权限）
      if (error.response?.status === 401) {
        // 检查 token 是否存在
        const token = ls.get(TOKEN);
        
        if (token) {
          // token 存在，只提示无权限，不跳转登录页
          const errorMessage = 
            error.response?.data?.message || 
            error.response?.data?.msg || 
            '无权限访问该资源';
          message.error(errorMessage);
        } else {
          // token 不存在，清除登录状态并跳转（虽然路由守卫应该已经处理了，但这里也做一下兜底）
          const userStore = useUserStore();
          message.error('请先登录');
          userStore.handleLogout();
        }
        return Promise.reject(error);
      }
      
      // 处理业务层面的错误响应
      if (error.response?.data && typeof error.response.data === 'object' && 'code' in error.response.data) {
        const errorData = error.response.data;
        
        // 处理业务层面的 403 错误（token过期）
        if (errorData.code === 403) {
          const userStore = useUserStore();
          message.error(errorData.msg || errorData.message || '登录已过期，请重新登录');
          userStore.handleLogout();
          return Promise.reject(new Error(errorData.msg || errorData.message || '登录已过期，请重新登录'));
        }
        
        // 处理业务层面的 401 错误（无权限）
        if (errorData.code === 401) {
          const token = ls.get(TOKEN);
          
          if (token) {
            // token 存在，只提示无权限，不跳转登录页
            message.error(errorData.msg || errorData.message || '无权限访问该资源');
          } else {
            // token 不存在，清除登录状态并跳转
            const userStore = useUserStore();
            message.error(errorData.msg || errorData.message || '请先登录');
            userStore.handleLogout();
          }
          return Promise.reject(new Error(errorData.msg || errorData.message || '无权限访问该资源'));
        }
        
        // 其他业务错误
        message.error(errorData.msg || errorData.message || '请求失败');
        return Promise.reject(new Error(errorData.msg || errorData.message || '请求失败'));
      }
      
      // 处理其他错误情况
      const errorMessage = error.response?.data?.message || error.message || '请求失败';
      message.error(errorMessage);
      return Promise.reject(error);
    }
  );
}

function joinUrl(base: string, path: string): string {
  const a = base.endsWith('/') ? base.slice(0, -1) : base;
  const b = path.startsWith('/') ? path : `/${path}`;
  return `${a}${b}`;
}

function createRequest(baseURL?: string): CustomAxiosInstance {
  const instance = axios.create({
    baseURL: baseURL ?? import.meta.env.VITE_API_BASE_URL,
    timeout: 30000, // 增加到30秒
    headers: {
      'Content-Type': 'application/json'
    }
  });
  attachInterceptors(instance);
  return instance as CustomAxiosInstance;
}

// 默认通用请求实例（保持兼容）
const request = createRequest();

// 分域请求实例：支持通过环境变量自定义前缀，未设置时走默认
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const AUTH_PREFIX = import.meta.env.VITE_API_AUTH_PREFIX || '/auth';
const CONFIG_PREFIX = import.meta.env.VITE_API_CONFIG_PREFIX || '/config';
const MQ_PREFIX = import.meta.env.VITE_API_MQ_PREFIX || '/mq';
const JOB_PREFIX = import.meta.env.VITE_API_JOB_PREFIX || '/job';

export const authRequest = createRequest(joinUrl(API_BASE, AUTH_PREFIX));
export const configRequest = createRequest(joinUrl(API_BASE, CONFIG_PREFIX));
export const mqRequest = createRequest(joinUrl(API_BASE, MQ_PREFIX));
export const jobRequest = createRequest(joinUrl(API_BASE, JOB_PREFIX));

export default request; 