/**
 * 系统权限常量
 * 统一管理所有权限标识，便于维护和修改
 */

// 用户管理权限
export const USER_PERMISSIONS = {
  PAGE: 'system:user:page',
  LIST: 'system:user:list',
  ADD: 'system:user:add',
  EDIT: 'system:user:edit',
  DELETE: 'system:user:delete',
  ENABLE: 'system:user:edit',
  DISABLE: 'system:user:edit',
  RESET_PASSWORD: 'system:user:edit',
  ASSIGN_ROLES: 'system:role:assign-permissions',
} as const;

// 角色管理权限
export const ROLE_PERMISSIONS = {
  PAGE: 'system:role:page',
  LIST: 'system:role:list',
  ADD: 'system:role:add',
  EDIT: 'system:role:edit',
  DELETE: 'system:role:delete',
  ENABLE: 'system:role:enable',
  DISABLE: 'system:role:disable',
  ASSIGN_PERMISSIONS: 'system:role:assign-permissions',
} as const;

// 菜单管理权限
export const MENU_PERMISSIONS = {
  PAGE: 'system:menu:list',
  LIST: 'system:menu:list',
  ADD: 'system:menu:add',
  EDIT: 'system:menu:edit',
  DELETE: 'system:menu:delete',
  DETAIL: 'system:menu:detail',
  TREE: 'system:menu:tree',
  ENABLE: 'system:menu:enable',
  DISABLE: 'system:menu:disable',
} as const;

// 通知管理权限
export const NOTICE_PERMISSIONS = {
  PAGE: 'system:notice:page',
  LIST: 'system:notice:list',
  ADD: 'system:notice:add',
  EDIT: 'system:notice:edit',
  DELETE: 'system:notice:delete',
  MARK_READ: 'system:notice:read',
  MARK_ALL_READ: 'system:notice:readAll',
  CLEAR: 'system:notice:clear',
} as const;

// 超管标识
export const SUPER_ADMIN_IDENTIFIERS = {
  USERNAME: 'admin',
  ROLES: ['超级管理员', 'SUPER_ADMIN', 'ROLE_ADMIN'],
} as const;
