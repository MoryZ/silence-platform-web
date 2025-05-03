import { createRouter, createWebHistory, RouteRecordRaw, RouteLocationNormalized } from 'vue-router';
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
        path: 'notification',
        name: 'Notification',
        component: () => import('@/views/notification/notice.vue'),
        meta: {
          title: '通知管理',
          requiresAuth: true
        }
      }
    ]
  }
  // 注意：404和通配符路由将在所有动态路由加载后再添加
];

// 白名单路由
const whiteList = ['/login', '/404'] as const;
type WhiteListPath = typeof whiteList[number];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
});

// 标记是否正在加载权限数据
let hasAddedDynamicRoutes = false;

// 路由守卫
router.beforeEach(async (to, from, next) => {
  
  // 白名单直接放行
  if (whiteList.includes(to.path as WhiteListPath)) {
    next();
    return;
  }
  
  // 检查本地存储中是否有token
  const token = ls.get(TOKEN);
  
  if (!token) {
    // 无token，重定向到登录页
    next('/login');
    return;
  }
  
  // 如果路由还没有加载完成，加载动态路由
  if (!hasAddedDynamicRoutes) {
    const localMenus = ls.get(MENUS);
    if (localMenus && Array.isArray(localMenus) && localMenus.length > 0) {
      await addDynamicRoutes(localMenus);
      // 重新导航以匹配新添加的路由
      next({ ...to, replace: true });
      return;
    }
  }
  
  // 如果路由未匹配且不是去404页面，尝试重新加载路由
  if (to.matched.length === 0 && to.path !== '/404') {
    
    // 如果之前标记已加载过，但实际路由未匹配，强制重新加载一次
    if (hasAddedDynamicRoutes) {
      hasAddedDynamicRoutes = false;
      const localMenus = ls.get(MENUS);
      if (localMenus && Array.isArray(localMenus) && localMenus.length > 0) {
        await addDynamicRoutes(localMenus);
        next({ ...to, replace: true });
        return;
      }
    }
    
    // 如果重新加载后仍然未匹配，则可能是真的不存在此路由，去404
    next('/404');
    return;
  }
  
  // 正常放行
  next();
});

export async function addDynamicRoutes(menus: MenuItem[]) {
  if (hasAddedDynamicRoutes) return
  
  let menuData: MenuItem[] = [];
  try {
    // 获取菜单数据
    const storedMenus = ls.get<MenuItem[]>(MENUS);
    if (storedMenus && Array.isArray(storedMenus)) {
      menuData = storedMenus;
    } else {
      menuData = menus;
      ls.set(MENUS, menuData);
    }
    
    // 1. 先移除可能已存在的404和通配符路由
    const allRoutes = router.getRoutes();
    allRoutes.forEach(route => {
      if (
        route.path.includes('/:pathMatch') || 
        route.path === '*' || 
        route.path === '/404'
      ) {
        if (route.name) {
          router.removeRoute(route.name);
        }
      }
    });
    
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
                
                // 为每个子路由创建唯一的name
                const childName = childRoute.name || 
                  `${String(route.name || routePath.replace(/\//g, '-'))}-${childPath.replace(/\//g, '-')}`;
                
                // 添加子路由到主布局
                router.addRoute('MainLayout', {
                  ...childRoute,
                  path: childPath,
                  name: childName
                });
              });
            } else {
              // 没有子路由的普通路由直接添加
              router.addRoute('MainLayout', {
                ...route,
                path: routePath
              });
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
      });
    }
    
    // 3. 添加404页面路由
    router.addRoute({
      path: '/404',
      name: '404',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '404' }
    });
    
    // 4. 最后添加通配符路由
    router.addRoute({
      path: '/:pathMatch(.*)*',
      redirect: '/404',
      name: 'NotFound',
      meta: { hidden: true }
    });
    
    
    hasAddedDynamicRoutes = true;
  } catch (error) {
  }
}

// 转换后端路由为前端路由格式
function transformRoutes(routes: any[], parentPath: string = ''): RouteRecordRaw[] {
  return routes.map(route => {
    const { meta, children } = route;
    
    // 处理路径，确保子路由包含父路由前缀
    let currentPath = route.path;
    
    // 如果不是以/开头的路径，且有父路径，则拼接父路径
    if (!currentPath.startsWith('/') && parentPath) {
      currentPath = `${parentPath}/${currentPath}`;
    }
    // 如果是以/开头，但应该是子路由
    else if (currentPath.startsWith('/') && parentPath && !currentPath.startsWith(parentPath)) {
      // 检查是否需要拼接父路径
      // 只有在父路径不是'/'的情况下才拼接，避免重复前导斜杠
      if (parentPath !== '/') {
        currentPath = `${parentPath}${currentPath}`;
      }
    }
    
    // 根据组件路径确定实际组件
    let component;
    if (route.component) {
      // 构建动态导入路径
      const componentPath = route.component.replace(/^\//, '');
      const importPath = `../views/${componentPath}.vue`;
      
      // 尝试使用多种可能的组件导入路径
      const attemptComponentImport = () => {
        // 生成可能的组件路径
        const possiblePaths = [
          importPath,
          `../views/${currentPath.replace(/^\//, '')}.vue`,
          `../views${currentPath}.vue`,
        ];
        
        // 如果当前路径包含子路径部分(如/system/user)，也尝试直接导入该组件
        if (currentPath.split('/').length > 2) {
          const lastPart = currentPath.split('/').pop();
          if (lastPart) {
            possiblePaths.push(`../views/${lastPart}.vue`);
          }
          
          // 尝试按目录结构组织的组件路径
          const pathParts = currentPath.replace(/^\//, '').split('/');
          if (pathParts.length >= 2) {
            possiblePaths.push(`../views/${pathParts[0]}/${pathParts.slice(1).join('/')}.vue`);
          }
        }
        
        // 查找第一个存在的组件路径
        for (const path of possiblePaths) {
          if (viewModules[path]) {
            return () => viewModules[path]();
          }
        }
        
        // 如果都找不到，返回404组件
        return () => import('@/views/NotFound.vue');
      };
      
      component = attemptComponentImport();
    } else {
      // 如果没有定义组件但有子路由，使用布局组件
      if (children && children.length > 0) {
        component = () => import('@/layout/BasicLayout.vue');
      } else {
        // 既没有组件又没有子路由，使用NotFound
        component = () => import('@/views/NotFound.vue');
      }
    }
    
    // 创建路由对象
    const transformedRoute: any = {
      path: currentPath,
      name: route.name || currentPath.replace(/^\//, '').replace(/\//g, '-'),
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