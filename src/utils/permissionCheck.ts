/**
 * 权限检查工具函数
 * 提供安全的权限检查方法，避免循环依赖和错误
 */

import { ls } from '@/utils/stoarge'
import { USER_INFO } from '@/utils/constant'
import { SUPER_ADMIN_IDENTIFIERS } from '@/utils/permissionConstants'

// 权限缓存
let permissionCache: string[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 5000 // 5秒缓存

/**
 * 获取用户权限列表
 */
function getUserPermissions(): string[] {
  const now = Date.now()
  
  // 如果缓存有效，直接返回
  if (now - cacheTimestamp < CACHE_DURATION && permissionCache.length > 0) {
    return permissionCache
  }
  
  try {
    const userInfo = ls.get(USER_INFO) as any
    if (userInfo && userInfo.permissions) {
      permissionCache = userInfo.permissions
      cacheTimestamp = now
      return permissionCache
    }
  } catch (error) {
    console.warn('获取用户权限失败:', error)
  }
  
  return []
}

/**
 * 检查是否为超管
 */
export function isSuperAdmin(): boolean {
  try {
    const userInfo = ls.get(USER_INFO) as any
    
    if (userInfo) {
      return userInfo.username === SUPER_ADMIN_IDENTIFIERS.USERNAME || 
             SUPER_ADMIN_IDENTIFIERS.ROLES.some(role => userInfo.roles?.includes(role))
    }
  } catch (error) {
    console.warn('检查超管身份失败:', error)
  }
  
  return false
}

/**
 * 检查是否有指定权限
 */
export function hasPermission(permission: string): boolean {
  try {
    // 如果是超管，直接返回 true
    if (isSuperAdmin()) {
      return true
    }
    
    const permissions = getUserPermissions()
    return permissions.includes(permission)
  } catch (error) {
    console.warn('权限检查失败:', error)
    return false
  }
}

/**
 * 检查是否有任意一个权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
  try {
    // 如果是超管，直接返回 true
    if (isSuperAdmin()) {
      return true
    }
    
    const userPermissions = getUserPermissions()
    return permissions.some(permission => userPermissions.includes(permission))
  } catch (error) {
    console.warn('权限检查失败:', error)
    return false
  }
}

/**
 * 检查是否有所有权限
 */
export function hasAllPermissions(permissions: string[]): boolean {
  try {
    // 如果是超管，直接返回 true
    if (isSuperAdmin()) {
      return true
    }
    
    const userPermissions = getUserPermissions()
    return permissions.every(permission => userPermissions.includes(permission))
  } catch (error) {
    console.warn('权限检查失败:', error)
    return false
  }
}

/**
 * 清除权限缓存
 */
export function clearPermissionCache() {
  permissionCache = []
  cacheTimestamp = 0
}
