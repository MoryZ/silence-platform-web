import { defineStore } from "pinia";
import type { MenuItem } from "../types/menu";
import { addDynamicRoutes } from "@/router";
import {
  login as apiLogin,
  logout as apiLogout,
  type UserInfo,
  type LoginParams,
} from "@/api/auth/user";
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ls } from "@/utils/stoarge";
import { TOKEN, MENUS, USER_INFO } from "@/utils/constant";
interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
  dynamicRoutes: MenuItem[];
  routesLoaded: boolean;
}

export const useUserStore = defineStore("user", () => {
  const router = useRouter();
  
  // 状态（从本地存储恢复）
  const token = ref<string>(ls.get(TOKEN) || '');
  const userInfo = ref<UserInfo | null>(ls.get(USER_INFO) || null);
  
  // 获取
  const getToken = () => token.value;
  const getUserData = () => userInfo.value;
  const getUserInfo = () => userInfo.value;
  
  // 设置
  const setToken = (value: string) => {
    token.value = value;
    ls.set(TOKEN, value);
  };
  
  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info;
    ls.set(USER_INFO, info);
  };
  
  // 登录
  async function handleLogin(loginParams: LoginParams) {
    try {
      const data = await apiLogin(loginParams);
      const { token, userInfo, menus } = data;
      // 设置token
      setToken(token);
      // 设置用户信息
      setUserInfo(userInfo);

      // 保存菜单数据
      if (Array.isArray(menus) && menus.length > 0) {
        ls.set(MENUS, menus);
        // 设置菜单和路由
        await addDynamicRoutes(menus);
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  
  // 登出
  async function handleLogout() {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // 清除本地存储和状态
      ls.remove(TOKEN);
      token.value = '';
      userInfo.value = null;
      router.push('/login');
    }
  }
  
  
  return {
    token,
    userInfo,
    getToken,
    getUserData,
    setToken,
    setUserInfo,
    handleLogin,
    getUserInfo,
    handleLogout,
  };
});
