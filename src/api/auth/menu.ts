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
 * @returns 菜单树数据
 */
export function getMenuList() {
  return request.get('/api/v1/menus/list');
}


/**
 * 新增菜单
 * @param data 菜单数据
 */
export function addMenu(data: Partial<Menu>) {
  return request.post('/api/v1/menus', data);
}

/**
 * 更新菜单
 * @param id 菜单ID
 * @param data 菜单数据
 */
export function updateMenu(id: number, data: Partial<Menu>) {
  return request.put(`/api/v1/menus/${id}`, data);
}

/**
 * 删除菜单
 * @param id 菜单ID
 */
export function deleteMenu(id: number) {
  return request.delete(`/api/v1/menus/${id}`);
} 