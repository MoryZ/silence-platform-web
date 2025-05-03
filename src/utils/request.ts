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

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
}) as CustomAxiosInstance;

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = ls.get(TOKEN)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    
    if (response.data.code !== 200) {
      message.error(response.data.msg || '请求失败');
      
      // 401: Token 过期或未登录
      if (response.data.code === 401) {
        const userStore = useUserStore();
        userStore.handleLogout();
      }
      return Promise.reject(new Error(response.data.msg || '请求失败'));
    }
    
    return response.data.data;
  },
  (error) => {
    message.error(error.message || '请求失败');
    return Promise.reject(error);
  }
);

export default request; 