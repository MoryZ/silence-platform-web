import router from './index'
import { useUserStore } from '@/stores/user'

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  console.log('权限路由守卫:', { 
    从: from.path, 
    到: to.path, 
    匹配路由: to.matched.length ? 'yes' : 'no'
  });
  
  // 白名单直接放行
  if (['/login', '/404'].includes(to.path)) {
    next()
    return
  }
  
  // 检查token
  if (!userStore.token) {
    next(`/login?redirect=${to.path}`)
    return
  }
  
  // 如果路由未匹配，且路径以/system开头，尝试修正路径
  if (to.matched.length === 0 && to.path.startsWith('/system/')) {
    // 可能是系统路由注册问题，尝试重新获取用户信息和菜单
    console.log('系统路由未匹配，尝试重新获取用户信息');
    try {
      await userStore.getUserInfo();
      next({ ...to, replace: true });
      return;
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  }
  
  try {
    // 获取用户信息和菜单
    if (!userStore.userInfo) {
      console.log('获取用户信息');
      await userStore.getUserInfo()
    }
    
    // 确保动态路由已添加
    next()
  } catch (error) {
    // 获取信息失败，清除token并跳转到登录页
    console.error('路由守卫异常:', error);
    await userStore.handleLogout()
    next(`/login?redirect=${to.path}`)
  }
})