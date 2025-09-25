import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'ant-design-vue';
import { ls } from './stoarge';
import { TOKEN } from './constant';
import { useUserStore } from '@/stores/user';
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
          message.error(response.data.msg || '请求失败');
          if (response.data.code === 401) {
            const userStore = useUserStore();
            userStore.handleLogout();
          }
          return Promise.reject(new Error(response.data.msg || '请求失败'));
        }
        return response.data.data;
      }
      return response.data;
    },
    (error) => {
      message.error(error.message || '请求失败');
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
    timeout: 10000,
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