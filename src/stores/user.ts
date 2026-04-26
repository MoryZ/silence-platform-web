import { defineStore } from "pinia";
import type { MenuItem } from "../types/menu";
import { addDynamicRoutes } from "@/router";
import {
  login as apiLogin,
  logout as apiLogout,
  getUserInfo as fetchUserInfo,
} from "@/api/auth/user";
import { getCurrentUserMenus } from "@/api/auth/menu";
import type { UserInfo, LoginParams } from '@/types/auth';
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

  const extractPermissionsFromMenus = (menus: any[]): string[] => {
    const permissions = new Set<string>();

    const walk = (nodes: any[]) => {
      if (!Array.isArray(nodes)) {
        return;
      }

      nodes.forEach((node) => {
        const permission = node?.meta?.permission;
        if (typeof permission === 'string' && permission.trim()) {
          permissions.add(permission.trim());
        }

        if (Array.isArray(node?.children) && node.children.length > 0) {
          walk(node.children);
        }
      });
    };

    walk(menus);
    return Array.from(permissions);
  };

  const extractRolesFromUserInfo = (info: any): string[] => {
    const roles = new Set<string>();

    if (Array.isArray(info?.roles)) {
      info.roles.forEach((role: unknown) => {
        if (typeof role === 'string' && role.trim()) {
          roles.add(role.trim());
        }
      });
    }

    if (Array.isArray(info?.userRoles)) {
      info.userRoles.forEach((userRole: any) => {
        const code = userRole?.role?.code;
        if (typeof code === 'string' && code.trim()) {
          roles.add(code.trim());
        }
      });
    }

    return Array.from(roles);
  };

  async function bootstrapUserContext() {
    const [currentUserInfo, menus] = await Promise.all([
      fetchUserInfo(),
      getCurrentUserMenus(),
    ]);

    const roles = extractRolesFromUserInfo(currentUserInfo);
    const permissions = extractPermissionsFromMenus(menus as any[]);
    const permissionStore = usePermissionStore();
    permissionStore.setPermissions(permissions);

    setUserInfo({
      ...currentUserInfo,
      roles,
      permissions,
    });

    if (Array.isArray(menus) && menus.length > 0) {
      const menuItems = menus as unknown as MenuItem[];
      ls.set(MENUS, menuItems);
      await addDynamicRoutes(menuItems, true);
      return { hasMenus: true };
    }

    ls.remove(MENUS);
    return { hasMenus: false };
  }
  
  // 登录
  async function handleLogin(loginParams: LoginParams) {
    try {
      const data = await apiLogin(loginParams);
      const { token } = data;
      
      // 设置token
      setToken(token);

      const { hasMenus } = await bootstrapUserContext();
      
      return { success: true, hasMenus };
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  
  // 登出
  async function handleLogout(skipRemoteLogout: boolean = false) {
    try {
      if (!skipRemoteLogout) {
        await apiLogout();
      }
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
    bootstrapUserContext,
    handleLogin,
    getUserInfo,
    getMenus,
    handleLogout,
  };
});
