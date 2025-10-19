/**
 * 系统权限常量
 * 统一管理所有权限标识，便于维护和修改
 */

// 用户管理权限
export const USER_PERMISSIONS = {
  PAGE: 'system:user:page',
  ADD: 'system:user:add',
  EDIT: 'system:user:edit',
  DELETE: 'system:user:delete',
  ENABLE: 'system:user:enable',
  DISABLE: 'system:user:disable',
  RESET_PASSWORD: 'system:user:reset-password',
  ASSIGN_ROLES: 'system:role:assign-permissions',
} as const;

// 角色管理权限
export const ROLE_PERMISSIONS = {
  PAGE: 'system:role:page',
  QUERY: 'system:role:query',
  ADD: 'system:role:add',
  EDIT: 'system:role:edit',
  DELETE: 'system:role:delete',
  SET_PERMISSIONS: 'system:role:setPermissions',
} as const;

// 菜单管理权限
export const MENU_PERMISSIONS = {
  PAGE: 'system:menu:list',
  QUERY: 'system:menu:query',
  ADD: 'system:menu:add',
  EDIT: 'system:menu:edit',
  DELETE: 'system:menu:delete',
} as const;

// 通知管理权限
export const NOTICE_PERMISSIONS = {
  PAGE: 'system:notice:page',
  QUERY: 'system:notice:query',
  ADD: 'system:notice:add',
  EDIT: 'system:notice:edit',
  DELETE: 'system:notice:delete',
  MARK_READ: 'system:notice:markRead',
  CLEAR: 'system:notice:clear',
} as const;

// 超管标识
export const SUPER_ADMIN_IDENTIFIERS = {
  USERNAME: 'admin',
  ROLES: ['超级管理员', 'SUPER_ADMIN', 'ROLE_ADMIN'],
} as const;
