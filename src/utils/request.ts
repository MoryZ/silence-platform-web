import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'ant-design-vue';
import { ls } from './stoarge';
import { TOKEN } from './constant';
import { useUserStore } from '@/stores/user';
import { useNamespaceStore } from '@/stores/namespace';

// 创建自定义的 axios 实例类型
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

interface ApiPayload {
  code?: number;
  msg?: string;
  message?: string;
  data?: any;
}

let isHandlingAuthFailure = false;

function getMessageFromPayload(payload: ApiPayload | undefined, fallback: string): string {
  return payload?.msg || payload?.message || fallback;
}

function hasToken(): boolean {
  return Boolean(ls.get(TOKEN));
}

async function handleAuthFailure(messageText: string) {
  if (isHandlingAuthFailure) {
    return;
  }

  isHandlingAuthFailure = true;
  message.error(messageText);

  try {
    const userStore = useUserStore();
    // 跳过远端 logout，避免 403 场景下再次触发拦截器形成循环
    await userStore.handleLogout(true);
  } finally {
    isHandlingAuthFailure = false;
  }
}

function processBusinessCodeError(payload: ApiPayload): Promise<never> | null {
  if (typeof payload.code !== 'number' || payload.code === 200) {
    return null;
  }

  if (payload.code === 403) {
    const authMessage = getMessageFromPayload(payload, '登录已过期，请重新登录');
    void handleAuthFailure(authMessage);
    return Promise.reject(new Error(authMessage));
  }

  if (payload.code === 401) {
    const authzMessage = getMessageFromPayload(payload, '无权限访问该资源');
    if (hasToken()) {
      message.error(authzMessage);
    } else {
      void handleAuthFailure(getMessageFromPayload(payload, '请先登录'));
    }
    return Promise.reject(new Error(authzMessage));
  }

  const errorMessage = getMessageFromPayload(payload, '请求失败');
  message.error(errorMessage);
  return Promise.reject(new Error(errorMessage));
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
        const payload = response.data as ApiPayload;
        const businessError = processBusinessCodeError(payload);
        if (businessError) {
          return businessError;
        }
        return payload.data;
      }
      return response.data;
    },
    (error) => {
      const payload =
        error.response?.data && typeof error.response.data === 'object'
          ? (error.response.data as ApiPayload)
          : undefined;

      // 处理 HTTP 状态码层面的 403 错误（token过期）
      if (error.response?.status === 403) {
        void handleAuthFailure(getMessageFromPayload(payload, '登录已过期，请重新登录'));
        return Promise.reject(error);
      }
      
      // 处理 HTTP 状态码层面的 401 错误（无权限）
      if (error.response?.status === 401) {
        if (hasToken()) {
          message.error(getMessageFromPayload(payload, '无权限访问该资源'));
        } else {
          void handleAuthFailure('请先登录');
        }
        return Promise.reject(error);
      }
      
      // 处理业务层面的错误响应
      if (payload && 'code' in payload) {
        const businessError = processBusinessCodeError(payload);
        if (businessError) {
          return businessError;
        }
      }
      
      // 处理其他错误情况
      const errorMessage = getMessageFromPayload(payload, error.message || '请求失败');
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
// 在开发环境中，使用相对路径以便走 Vite 代理；生产环境使用完整 URL
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const AUTH_PREFIX = import.meta.env.VITE_API_AUTH_PREFIX || '/auth';
const CONFIG_PREFIX = import.meta.env.VITE_API_CONFIG_PREFIX || '/config';
const MQ_PREFIX = import.meta.env.VITE_API_MQ_PREFIX || '/mq';
const JOB_PREFIX = import.meta.env.VITE_API_JOB_PREFIX || '/job';

// 如果 API_BASE 为空、未设置或为 '/'，使用相对路径（走代理）
// 如果 API_BASE 已设置且不是 '/'，使用完整 URL
const getBaseUrl = (prefix: string) => {
  if (!API_BASE || API_BASE === '' || API_BASE === '/') {
    return prefix;
  }
  return joinUrl(API_BASE, prefix);
};

export const authRequest = createRequest(getBaseUrl(AUTH_PREFIX));
export const configRequest = createRequest(getBaseUrl(CONFIG_PREFIX));
export const mqRequest = createRequest(getBaseUrl(MQ_PREFIX));

// 创建 jobRequest 实例
const jobRequestInstance = createRequest(getBaseUrl(JOB_PREFIX));

// 为 jobRequest 添加命名空间请求头拦截器
jobRequestInstance.interceptors.request.use(
  (config) => {
    const namespaceStore = useNamespaceStore();
    const namespaceId = namespaceStore.namespaceId;
    
    if (namespaceId) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      const h: any = config.headers;
      if (typeof h.set === 'function') {
        h.set('X-Tenant-Id', namespaceId);
      } else {
        h['X-Tenant-Id'] = namespaceId;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const jobRequest = jobRequestInstance;

export default request; 