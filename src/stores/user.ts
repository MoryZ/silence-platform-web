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
import { TOKEN, MENUS, USER_INFO, RECENT_VISITED_PRODUCTS, FAVORITE_PRODUCTS } from "@/utils/constant";
import { usePermissionStore } from "./permission";
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
  const getMenus = () => ls.get(MENUS) || [];
  
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
        
        // 设置权限
        const permissionStore = usePermissionStore();
        // 优先从 userInfo.permissions 中获取权限
        if (userInfo.permissions && userInfo.permissions.length > 0) {
          permissionStore.setPermissions(userInfo.permissions);
          console.log('权限已从 userInfo 设置:', userInfo.permissions);
        } else {
          // 备用方案：从菜单树中提取权限
          permissionStore.extractPermissions({ menus });
          console.log('权限已从菜单树提取:', permissionStore.permissions);
        }
        
        // 设置菜单和路由，强制重新添加
        await addDynamicRoutes(menus, true);
      } else {
        console.log('没有菜单数据');
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
      // 清除所有用户相关的本地存储和状态
      ls.remove(TOKEN);
      ls.remove(USER_INFO);
      ls.remove(MENUS);
      ls.remove(RECENT_VISITED_PRODUCTS);
      ls.remove(FAVORITE_PRODUCTS);
      
      // 清除其他用户相关的数据
      // localStorage.removeItem('silence-config-config');
      // localStorage.removeItem('silence-config-searchHistory');
      // localStorage.removeItem('silence-config-search-history');
      
      // 清除状态
      token.value = '';
      userInfo.value = null;
      
      // 清除权限
      const permissionStore = usePermissionStore();
      permissionStore.clearPermissions();
      
      // 跳转到登录页
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
    getMenus,
    handleLogout,
  };
});
