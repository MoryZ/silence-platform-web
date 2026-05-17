import { authRequest as request } from '@/utils/request';
import type { Menu } from '@/types/auth';

/**
 * 获取菜单树
 * @returns 菜单树数据
 */
export function getMenuTree(): Promise<Menu[]> {
  return request.get('/api/v1/menus/tree');
}

/**
 * 获取菜单列表
 * @returns 菜单列表数据
 */
export function getMenuList(): Promise<Menu[]> {
  return request.get('/api/v1/menus/list');
}

/**
 * 获取当前登录用户菜单
 * @returns 当前用户可访问菜单树
 */
export function getCurrentUserMenus(): Promise<Menu[]> {
  return request.get('/api/v1/menus/my');
}

/**
 * 新增菜单
 * @param data 菜单数据
 */
export function addMenu(data: Partial<Menu>): Promise<Menu> {
  return request.post('/api/v1/menus', data, { actionCode: 'system:menu:add' });
}

/**
 * 更新菜单
 * @param id 菜单ID
 * @param data 菜单数据
 */
export function updateMenu(id: number, data: Partial<Menu>): Promise<Menu> {
  return request.put(`/api/v1/menus/${id}`, data, { actionCode: 'system:menu:edit' });
}

/**
 * 删除菜单
 * @param id 菜单ID
 */
export function deleteMenu(id: number): Promise<void> {
  return request.delete(`/api/v1/menus/${id}`, { actionCode: 'system:menu:delete' });
}

/**
 * 启用菜单
 * @param id 菜单ID
 */
export function enableMenu(id: number): Promise<Menu> {
  return request.put(`/api/v1/menus/${id}/enable`, undefined, { actionCode: 'system:menu:enable' });
}

/**
 * 禁用菜单
 * @param id 菜单ID
 */
export function disableMenu(id: number): Promise<Menu> {
  return request.put(`/api/v1/menus/${id}/disable`, undefined, { actionCode: 'system:menu:disable' });
}