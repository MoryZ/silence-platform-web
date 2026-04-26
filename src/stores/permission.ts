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
      const visited = new Set<string>()
      
      // 递归遍历菜单树，提取所有按钮权限
      const extractFromMenu = (menus: any[]) => {
        menus.forEach(menu => {
          const permission = menu?.meta?.permission
          if (typeof permission === 'string' && permission.trim() && !visited.has(permission.trim())) {
            visited.add(permission.trim())
            permissions.push(permission.trim())
          }
          if (menu.children) {
            extractFromMenu(menu.children)
          }
        })
      }
      
      const menus = Array.isArray(loginData) ? loginData : (loginData?.menus || [])
      extractFromMenu(menus)
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
