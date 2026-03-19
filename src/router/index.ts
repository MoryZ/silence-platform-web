import { createRouter, createWebHistory, RouteRecordRaw, RouteRecordName } from 'vue-router';
import { MenuItem } from '@/types/menu';
import { ls } from '@/utils/stoarge';
import { MENUS, TOKEN } from '@/utils/constant';

// 移除直接导入，改为异步导入，解决循环依赖问题
// import BasicLayout from '@/layout/BasicLayout.vue';

// Add Vite's glob import for components - explicitly include all views and layouts
const viewModules = {
  ...import.meta.glob('../views/**/*.vue'),
  ...import.meta.glob('../layout/**/*.vue')
} as Record<string, () => Promise<any>>;

const isDev = import.meta.env.DEV;

function debugRouteLog(...args: any[]) {
  if (isDev) {
    console.log(...args);
  }
}

// 基础路由
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/ChangePassword.vue'),
    meta: {
      title: '修改密码',
      requiresAuth: false
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: {
      title: '重置密码',
      requiresAuth: false
    }
  },
  {
    path: '/apply-permission',
    name: 'ApplyPermission',
    component: () => import('@/views/ApplyPermission.vue'),
    meta: {
      title: '申请权限',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'MainLayout',
    // 使用异步导入替代直接导入
    component: () => import('@/layout/BasicLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '仪表盘',
          requiresAuth: true
        }
      },
      {
        path: 'account',
        name: 'Account',
        component: () => import('@/views/account/index.vue'),
        meta: {
          title: '个人页',
          requiresAuth: true
        }
      },
      {
        path: 'account/settings',
        name: 'AccountSettings',
        component: () => import('@/views/account/settings.vue'),
        meta: {
          title: '个人设置',
          requiresAuth: true
        }
      },
    ]
  }
  // 注意：404和通配符路由将在所有动态路由加载后再添加
];

// 白名单路由
const whiteList = ['/login', '/404', '/change-password', '/apply-permission', '/forgot-password'] as const;
type WhiteListPath = typeof whiteList[number];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
});

// 标记是否正在加载权限数据
let hasAddedDynamicRoutes = false;
const dynamicRouteNames = new Set<string>();

function trackDynamicRouteName(routeName?: RouteRecordName | null) {
  if (typeof routeName === 'string' && routeName !== 'MainLayout') {
    dynamicRouteNames.add(routeName);
  }
}

function clearDynamicRoutes() {
  dynamicRouteNames.forEach((routeName) => {
    if (router.hasRoute(routeName)) {
      router.removeRoute(routeName);
    }
  });
  dynamicRouteNames.clear();

  // 兜底清理 404 与通配符
  const allRoutes = router.getRoutes();
  allRoutes.forEach(route => {
    if (
      route.path.includes('/:pathMatch') ||
      route.path === '*' ||
      route.path === '/404'
    ) {
      if (route.name && router.hasRoute(route.name)) {
        router.removeRoute(route.name);
      }
    }
  });
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  debugRouteLog('路由守卫执行:', {
    从: from.path, 
    到: to.path, 
    匹配路由: to.matched.length ? 'yes' : 'no',
    hasAddedDynamicRoutes,
    token: ls.get(TOKEN) ? 'exists' : 'none'
  });
  
  // 白名单直接放行
  if (whiteList.includes(to.path as WhiteListPath)) {
    next();
    return;
  }
  
  // 检查本地存储中是否有token
  const token = ls.get(TOKEN);
  
  if (!token) {
    debugRouteLog('无token，重定向到登录页');
    // 无token，重定向到登录页
    next('/login');
    return;
  }
  
  // 如果路由还没有加载完成，加载动态路由
  if (!hasAddedDynamicRoutes) {
    const localMenus = ls.get(MENUS);
    debugRouteLog('本地菜单数据:', localMenus);
    if (localMenus && Array.isArray(localMenus) && localMenus.length > 0) {
      try {
        await addDynamicRoutes(localMenus);
        // 保留 query/hash 并替换当前 history，避免重复记录
        next({ ...to, replace: true });
        return;
      } catch (error) {
        console.error('加载动态路由失败，重定向登录:', error);
        next('/login');
        return;
      }
    } else {
      next('/login');
      return;
    }
  }
  
  // 正常放行
  next();
});

export async function addDynamicRoutes(menus: MenuItem[], force: boolean = false) {
  debugRouteLog('addDynamicRoutes 被调用:', { hasAddedDynamicRoutes, force, menusLength: menus?.length });
  
  if (hasAddedDynamicRoutes && !force) {
    return;
  }
  
  let menuData: MenuItem[] = [];
  try {
    if (force || hasAddedDynamicRoutes) {
      clearDynamicRoutes();
      hasAddedDynamicRoutes = false;
    }

    // 获取菜单数据
    const storedMenus = ls.get<MenuItem[]>(MENUS);
    if (storedMenus && Array.isArray(storedMenus)) {
      menuData = storedMenus;
    } else {
      menuData = menus;
      ls.set(MENUS, menuData);
    }
    
    // 2. 转换并添加业务路由
    const dynamicRoutes = transformRoutes(menuData);
    
    // 找到布局路由
    const layoutRoute = router.getRoutes().find(route => route.path === '/');
    
    if (layoutRoute) {
      // 递归添加路由到布局中
      const addRoutesToLayout = (routes: RouteRecordRaw[]) => {
        routes.forEach(route => {
          // 顶级路由直接添加
          if (route.path === '/login') {
            router.addRoute(route);
            trackDynamicRouteName(route.name);
          } else {
            // 获取适当的路径，移除开头的/以适应子路由格式
            let routePath = route.path;
            if (routePath.startsWith('/')) {
              routePath = routePath.substring(1);
            }
            
            // 特殊处理带有子路由的情况
            if (route.children && route.children.length > 0) {
              // 添加父级路由但不包含子路由，子路由会单独添加
              router.addRoute('MainLayout', {
                ...route,
                path: routePath,
                children: []
              });
              trackDynamicRouteName(route.name);
              
              // 处理子路由 - 根据原始路径格式决定如何添加
              route.children.forEach(childRoute => {
                let childPath = childRoute.path;
                
                // 如果子路径已经是绝对路径(以/开头)且不包含父路径前缀
                if (childPath.startsWith('/') && !childPath.startsWith(route.path)) {
                  // 移除开头的/并拼接父路径
                  childPath = `${routePath}${childPath.substring(1)}`;
                } 
                // 如果子路径不是以/开头，保持原样作为相对路径
                else if (!childPath.startsWith('/')) {
                  childPath = `${routePath}/${childPath}`;
                }
                // 子路径已经包含父路径前缀的情况，去掉开头的/
                else {
                  childPath = childPath.substring(1);
                }
                
                // 为每个子路由创建唯一的name，使用路径确保唯一性
                const childName = `${routePath.replace(/\//g, '-')}-${childPath.replace(/\//g, '-')}`;
                
                // 添加子路由到主布局
                router.addRoute('MainLayout', {
                  ...childRoute,
                  path: childPath,
                  name: childName
                });
                trackDynamicRouteName(childName);
              });
            } else {
              // 没有子路由的普通路由直接添加
              router.addRoute('MainLayout', {
                ...route,
                path: routePath
              });
              trackDynamicRouteName(route.name);
            }
          }
        });
      };
      
      // 添加所有动态路由
      addRoutesToLayout(dynamicRoutes);
    } else {
      // 没有布局就全部作为顶级路由
      dynamicRoutes.forEach(route => {
        router.addRoute(route);
        trackDynamicRouteName(route.name);
      });
    }
    
    // 3. 添加404页面路由
    router.addRoute({
      path: '/404',
      name: '404',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '404' }
    });
    trackDynamicRouteName('404');
    
    // 4. 最后添加通配符路由 - 直接显示NotFound组件而不是重定向
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { hidden: true }
    });
    trackDynamicRouteName('NotFound');
    
    
    hasAddedDynamicRoutes = true;
  } catch (error) {
    console.error('添加动态路由失败:', error);
    clearDynamicRoutes();
    hasAddedDynamicRoutes = false; // 确保失败时重置标志
    throw error;
  }
}

// 转换后端路由为前端路由格式
function transformRoutes(routes: any[], parentPath: string = ''): RouteRecordRaw[] {
  return routes
    .filter(route => {
      // 过滤掉路径为空的路由
      if (!route.path) {
        return false;
      }
      return true;
    })
    .map(route => {
      const { meta, children } = route;
      
      // 处理路径，确保子路由包含父路由前缀
      let currentPath = route.path;
    
    // 如果有父路径，需要拼接
    if (parentPath) {
      // 如果子路径以/开头，去掉开头的/
      if (currentPath.startsWith('/')) {
        currentPath = currentPath.substring(1);
      }
      // 拼接父路径和子路径
      currentPath = `${parentPath}/${currentPath}`;
    }
    
    // 根据组件路径确定实际组件
    let component;
    if (route.component) {
      // 直接使用component字段对应的路径
      const componentPath = route.component.replace(/^\//, '');
      const importPath = `../views/${componentPath}.vue`;
      
      if (viewModules[importPath]) {
        component = () => viewModules[importPath]();
      } else {
        console.warn('未找到组件:', importPath);
        component = () => import('@/views/NotFound.vue');
      }
    } else {
      // 如果没有定义组件但有子路由，使用轻量容器 RouteView，避免重复渲染主布局
      if (children && children.length > 0) {
        component = () => import('@/layout/RouteView.vue');
      } else {
        // 既没有组件又没有子路由，使用NotFound
        component = () => import('@/views/NotFound.vue');
      }
    }
    
    // 创建路由对象
    const transformedRoute: any = {
      path: currentPath,
      // 使用路径生成唯一的路由名称，避免name字段冲突
      name: currentPath.replace(/^\//, '').replace(/\//g, '-'),
      component,
      meta: {
        title: meta?.title || route.title || route.name,
        icon: meta?.icon,
        hidden: meta?.hidden || false,
        permission: meta?.permission
      }
    };
    
    // 递归处理子路由，传递当前路径作为父路径
    if (children && children.length > 0) {
      transformedRoute.children = transformRoutes(children, currentPath);
    }
    
    return transformedRoute;
  });
}

export default router