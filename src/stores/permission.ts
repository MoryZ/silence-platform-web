import { defineStore } from 'pinia'
import { hasPermission as checkPermission, hasAnyPermission as checkAnyPermission, hasAllPermissions as checkAllPermissions, clearPermissionCache } from '@/utils/permissionCheck'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: [] as string[], // 按钮权限列表
    menuList: [] as any[] // 菜单列表
  }),
  
  actions: {
    // 设置权限
    setPermissions(permissions: string[]) {
      this.permissions = permissions
    },
    
    // 检查是否有权限
    hasPermission(permission: string): boolean {
      return checkPermission(permission)
    },
    
    // 检查是否有任意一个权限
    hasAnyPermission(permissions: string[]): boolean {
      return checkAnyPermission(permissions)
    },
    
    // 检查是否有所有权限
    hasAllPermissions(permissions: string[]): boolean {
      return checkAllPermissions(permissions)
    },
    
    // 从登录响应中提取权限
    extractPermissions(loginData: any) {
      const permissions: string[] = []
      
      // 递归遍历菜单树，提取所有按钮权限
      const extractFromMenu = (menus: any[]) => {
        menus.forEach(menu => {
          if (menu.type === 'BUTTON' && menu.perms) {
            permissions.push(menu.perms)
          }
          if (menu.children) {
            extractFromMenu(menu.children)
          }
        })
      }
      
      extractFromMenu(loginData.menus || [])
      this.setPermissions(permissions)
    },
    
    // 清空权限
    clearPermissions() {
      this.permissions = []
      this.menuList = []
      clearPermissionCache()
    }
  }
})
