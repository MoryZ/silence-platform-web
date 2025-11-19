<template>
  <div class="side-menu-container">
    <a-menu
      v-if="!menuError"
      mode="inline"
      theme="light"
      :inline-collapsed="collapsed"
      :selectedKeys="[activeKey]"
      :openKeys="openKeys"
      :openAnimation="{ appear: true }"
      @openChange="onOpenChange"
      class="custom-menu"
      :forceSubMenuRender="true"
      :key="menuKey"
    >
      <MenuRecursiveItem
        v-for="(menu, index) in filteredMenuList"
        :key="menu.path || menu.key || index"
        :menu="menu"
      />
    </a-menu>
    <div v-else class="menu-error">
      <p>菜单加载失败，请刷新页面重试</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  AppstoreOutlined,
  BarsOutlined
} from '@ant-design/icons-vue';
import * as Icons from '@ant-design/icons-vue'
import { ref, computed, onMounted, watch, nextTick, h, defineComponent, PropType, isVNode, resolveComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MENUS } from '@/utils/constant';
import { ls } from '@/utils/stoarge';
import { MenuItem } from '@/types/menu';

// 接收来自父组件的折叠状态
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  menuList: {
    type: Array as () => MenuItem[],
    default: []
  },
  menuKey: {
    type: String,
    default: ''
  }
});

const router = useRouter();
const route = useRoute();

// 错误状态
const menuError = ref(false);

// 计算当前激活的菜单项
const activeKey = computed(() => route.path);

// 过滤重复的菜单项，确保每个菜单只显示一次
const filteredMenuList = computed(() => {
  try {
    if (!props.menuList || props.menuList.length === 0) {
      return [];
    }
    
    // 递归去重函数，处理嵌套菜单
    const deduplicateMenus = (menus: any[]): any[] => {
      const seen = new Set();
      const result: any[] = [];
      
      menus.forEach(menu => {
        // 创建唯一标识符，包含路径和标题
        const uniqueKey = `${menu.path || ''}-${menu.title || menu.meta?.title || ''}`;
        
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          
          // 如果有子菜单，递归处理
          if (menu.children && menu.children.length > 0) {
            const deduplicatedChildren = deduplicateMenus(menu.children);
            result.push({
              ...menu,
              children: deduplicatedChildren
            });
          } else {
            result.push(menu);
          }
        }
      });
      
      return result;
    };
    
    const result = deduplicateMenus(props.menuList);
    return result;
  } catch (error) {
    menuError.value = true;
    return [];
  }
});

const resolveMenuPath = (path?: string, parentPath?: string): string => {
  if (!path) {
    return parentPath || '';
  }

  // 绝对路径
  if (path.startsWith('/')) {
    // 如果本身就是完整路径或者没父级，直接返回
    if (!parentPath || path.startsWith(parentPath)) {
      return path;
    }
    const cleanParent = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
    const cleanChild = path.slice(1); // 去掉开头/
    return `${cleanParent}/${cleanChild}`;
  }

  // 相对路径
  const base = parentPath || '';
  if (!base) {
    return `/${path}`;
  }
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}/${path}`;
};

// 检查菜单项是否为当前激活的路径
const isActive = (path?: string, parentPath?: string): boolean => {
  const targetPath = resolveMenuPath(path, parentPath);
  if (!targetPath) return false;
  return route.path === targetPath;
};

// 根据 MENUS 计算应展开的所有父级 key，按路径链路展开
function getOpenKeysByPath(path: string) {
  const storedMenus = ls.get<MenuItem[]>(MENUS);
  if (!storedMenus || !Array.isArray(storedMenus)) return [];

  const keys: string[] = [];

  const pathMatches = (base: string | undefined, target: string) => {
    if (!base) return false;
    if (target === base) return true;
    if (target.startsWith(base)) {
      const rest = target.substring(base.length);
      const result = rest === '' || rest.startsWith('/');
      return result;
    }
    return false;
  };

  const dfs = (menus: any[], ancestors: string[]) => {
    for (const menu of menus) {
      if (!menu || !menu.path) continue;
      const newAncestors = [...ancestors, menu.path];
      if (pathMatches(menu.path, path)) {
        // 命中后，将所有祖先路径作为 openKeys（使用路径作为 key）
        keys.splice(0, keys.length, ...newAncestors);
        // 继续向下以便展开更深层父级
        if (menu.children && menu.children.length > 0) {
          dfs(menu.children, newAncestors);
        }
        return; // 命中一条链即可
      }
      if (menu.children && menu.children.length > 0) {
        dfs(menu.children, newAncestors);
      }
    }
  };

  dfs(storedMenus, []);
  return keys;
}

// 判断两个路径是否属于同一个顶级菜单
function isSameTopLevelMenu(path1: string, path2: string): boolean {
  const storedMenus = ls.get<MenuItem[]>(MENUS);
  if (!storedMenus || !Array.isArray(storedMenus)) return false;
  
  const getTopLevelMenu = (path: string): string | null => {
    // 首先检查是否是顶级菜单本身
    for (const menu of storedMenus) {
      if (menu.path && path === menu.path) {
        return menu.path;
      }
    }
    
    // 然后检查是否是顶级菜单的子项
    for (const menu of storedMenus) {
      if (menu.children) {
        for (const child of menu.children) {
          if (child.path && path.startsWith(child.path)) {
            return menu.path || null;
          }
        }
      }
    }
    
    // 最后检查是否是嵌套路径（但只匹配有子菜单的顶级菜单）
    for (const menu of storedMenus) {
      if (menu.path && menu.children && path.startsWith(menu.path + '/')) {
        // 确保这个路径不是其他顶级菜单的直接子项
        let isDirectChild = false;
        for (const otherMenu of storedMenus) {
          if (otherMenu.children) {
            for (const child of otherMenu.children) {
              if (child.path && path.startsWith(child.path)) {
                isDirectChild = true;
                break;
              }
            }
          }
          if (isDirectChild) break;
        }
        if (!isDirectChild) {
          return menu.path;
        }
      }
    }
    
    return null;
  };
  
  const topLevel1 = getTopLevelMenu(path1);
  const topLevel2 = getTopLevelMenu(path2);
  
  return topLevel1 === topLevel2 && topLevel1 !== null;
}

const openKeys = ref<string[]>([]);
const isUserManuallyOperating = ref(false);

// 路由变化时的处理逻辑
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (!props.collapsed) {
      const requiredOpenKeys = getOpenKeysByPath(newPath);
      
      // 判断是否是切换到不同的顶级菜单
      const isSwitchingTopLevelMenu = oldPath && !isSameTopLevelMenu(oldPath, newPath);
      
      if (isSwitchingTopLevelMenu) {
        // 切换到不同顶级菜单时，只展开当前路由需要的父级菜单
        openKeys.value = requiredOpenKeys;
        // 重置手动操作标志
        isUserManuallyOperating.value = false;
      } else {
        // 同一顶级菜单内的子菜单切换时，保持父菜单展开状态
        const currentOpenKeys = new Set(openKeys.value);
        requiredOpenKeys.forEach(key => currentOpenKeys.add(key));
        openKeys.value = Array.from(currentOpenKeys);
        // 重置手动操作标志
        isUserManuallyOperating.value = false;
      }
    }
  },
  { immediate: true }
);

// 折叠时收起所有菜单，展开时恢复当前父菜单
watch(
  () => props.collapsed,
  (val) => {
    if (val) {
      openKeys.value = [];
    } else {
      openKeys.value = getOpenKeysByPath(route.path);
    }
  },
  { immediate: true }
);

const onOpenChange = (keys: string[]) => {
  try {
    // 当用户手动操作菜单时，设置标志并更新展开状态
    // 检查是否是程序自动触发的（通过比较 keys 和当前 openKeys）
    const isProgrammaticChange = JSON.stringify(keys.sort()) === JSON.stringify(openKeys.value.sort());
    
    if (!isProgrammaticChange) {
      // 只有真正的用户手动操作才设置标志
      isUserManuallyOperating.value = true;
    }
    
    openKeys.value = keys;
  } catch (error) {
    console.error('菜单展开状态更新出错:', error);
  }
};

// 点击父级标题时仅展开/收起，不导航
const toggleOpen = (key: string) => {
  try {
    isUserManuallyOperating.value = true;
    const idx = openKeys.value.indexOf(key);
    if (idx > -1) {
      openKeys.value.splice(idx, 1);
    } else {
      openKeys.value.push(key);
    }
  } catch (error) {
    console.error('菜单切换出错:', error);
  }
};

// 根据菜单图标字符串获取对应的图标组件
const getIcon = (icon?: string) => {
  if (!icon) return AppstoreOutlined
  
  try {
    // 直接使用图标名称从 Icons 对象中获取组件，与菜单管理保持一致
    const Icon = (Icons as Record<string, any>)[icon]
    if (Icon) {
      // 为不同风格的图标设置不同的样式属性，与菜单管理保持一致
      const props: any = {
        style: { fontSize: '16px' }
      }
      
      if (icon.endsWith('TwoTone')) {
        // 双色图标使用双色属性
        props.twoToneColor = ['#e6f7ff', '#1890ff']
      } else if (icon.endsWith('Filled')) {
        // 实底图标使用主色调
        props.style = { ...props.style, color: '#1890ff' }
      } else {
        // 线框图标使用默认颜色（在浅色主题下使用深色）
        props.style = { ...props.style, color: '#666666' }
      }
      
      return h(Icon, props)
    }
    
    // 如果直接获取失败，尝试一些常见的映射
    const shortcutMap: Record<string, any> = {
      'dashboard': DashboardOutlined,
      'setting': SettingOutlined,
      'user': UserOutlined,
      'team': TeamOutlined,
      'menu': MenuOutlined,
      'bars': BarsOutlined,
    }
    
    if (shortcutMap[icon]) {
      return h(shortcutMap[icon], { style: { fontSize: '16px', color: '#666666' } })
    }
    
    // 兜底
    return h(AppstoreOutlined, { style: { fontSize: '16px', color: '#666666' } })
  } catch (error) {
    console.warn(`Icon ${icon} not found in SideMenu`)
    return h(AppstoreOutlined, { style: { fontSize: '16px', color: '#666666' } })
  }
}

// 加载菜单数据
const loadMenus = () => {
  try {
    const storedMenus = ls.get<MenuItem[]>(MENUS);
    // 只做本地菜单数据校验和警告，不再赋值 props.menuList
    if (!(storedMenus && Array.isArray(storedMenus) && storedMenus.length > 0)) {
      console.warn('菜单数据不存在或格式不正确');
      // 如果页面正在系统相关页面，但没有菜单数据，重定向到首页
      if (route.path.includes('/system') && !route.path.includes('/dashboard')) {
        router.replace('/dashboard');
      }
    }
  } catch (error) {
    console.error('加载菜单数据出错:', error);
  }
};

onMounted(() => {
  loadMenus();
  if (!props.collapsed) {
    openKeys.value = getOpenKeysByPath(route.path);
  }
  
});

// 导航函数
const navigateTo = (path: string, parentPath?: string) => {
  try {
    const targetPath = resolveMenuPath(path, parentPath);
    if (!targetPath) return;
    router.push(targetPath);
  } catch (error) {
    console.error('导航出错:', error);
  }
};

const renderIconNode = (icon?: string) => {
  const iconResult: any = getIcon(icon);
  if (isVNode(iconResult)) {
    return iconResult;
  }
  return h(iconResult);
};

const MenuRecursiveItem = defineComponent({
  name: 'MenuRecursiveItem',
  props: {
    menu: {
      type: Object as PropType<MenuItem>,
      required: true
    },
    parentPath: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => {
      const menu = props.menu;
      const currentPath = resolveMenuPath(menu.path || '', props.parentPath);
      const key =
        currentPath ||
        menu.key ||
        (menu.meta?.title ? `menu-node-${menu.meta?.title}` : `menu-node-${Math.random()}`);
      const children = menu.children || [];
      if (children.length > 0) {
        const SubMenu = resolveComponent('a-sub-menu') as any;
        return h(
          SubMenu,
          { key },
          {
            icon: () => renderIconNode(menu.meta?.icon),
            title: () =>
              h(
                'span',
                {
                  onClick: (event: Event) => {
                    event.stopPropagation();
                    toggleOpen(key);
                  }
                },
                menu.meta?.title || menu.title
              ),
            default: () =>
              children
                .filter(Boolean)
                .map((child, idx) =>
                  h(MenuRecursiveItem, {
                    menu: child,
                    parentPath: currentPath || '/',
                    key: child.path || child.key || `${key}-child-${idx}`
                  })
                )
          }
        );
      }
      const MenuItemComp = resolveComponent('a-menu-item') as any;
      const targetPath = currentPath || menu.path || menu.key || '';
      return h(
        MenuItemComp,
        {
          key,
          class: isActive(targetPath) ? 'active-menu-item' : '',
          onClick: () => navigateTo(targetPath)
        },
        {
          icon: () => renderIconNode(menu.meta?.icon),
          default: () => h('span', menu.meta?.title || menu.title)
        }
      );
    };
  }
});

</script>

<style lang="scss" scoped>
.side-menu-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  background-color: #001529;

  :is(img) {
    width: 32px;
    height: 32px;
  }

  :is(h1) {
    margin: 0 0 0 12px;
    color: white;
    font-weight: 600;
    font-size: 18px;
    line-height: 32px;
    white-space: nowrap;
  }
}

/* 自定义菜单样式 */
:deep(.custom-menu) {
  /* 浅色主题背景 */
  background-color: #ffffff;
  
  /* 自定义选中状态 */
  .ant-menu-item-selected {
    background-color: #e6f7ff !important;
    color: #1890ff !important;
    font-weight: bold;
    position: relative;
    
    /* 左侧添加蓝色边框标记 */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: #1890ff;
    }
    
    &::after {
      display: none; /* 移除默认的右边框指示器 */
    }
    
    /* 选中项悬停状态增强 */
    &:hover {
      background-color: #bae7ff !important;
      box-shadow: 0 0 8px rgba(24, 144, 255, 0.2);
      transform: translateX(2px);
      
      /* 悬停时左侧边框加粗 */
      &::before {
        width: 4px;
        background-color: #1890ff;
      }
    }
    
    /* 选中项的图标颜色 */
    .anticon {
      color: #1890ff !important;
    }
  }
  
  /* 鼠标悬停状态 */
  .ant-menu-item:hover:not(.ant-menu-item-selected) {
    background-color: rgba(24, 144, 255, 0.05) !important;
    color: #1890ff !important;
  }
  
  /* 增加子菜单的缩进（父级和子级保持一致） */
  .ant-menu-sub .ant-menu-item,
  .ant-menu-sub .ant-menu-submenu-title {
    padding-left: 40px !important;
  }
  .ant-menu-sub .ant-menu-sub .ant-menu-item,
  .ant-menu-sub .ant-menu-sub .ant-menu-submenu-title {
    padding-left: 56px !important;
  }
  
  /* 子菜单被选中时的样式 */
  .ant-menu-submenu-selected > .ant-menu-submenu-title {
    color: #1890ff !important;
    font-weight: bold;
    background-color: #f0f8ff !important;
    
    /* 子菜单标题悬停效果 */
    &:hover {
      color: #40a9ff !important;
      background-color: #e6f7ff !important;
    }
  }
  
  /* 菜单项的过渡效果 */
  .ant-menu-item, .ant-menu-submenu {
    transition: all 0.2s ease;
  }
  
  /* 增强悬停时的动画效果 */
  .ant-menu-item:active, .ant-menu-submenu-title:active {
    transform: scale(0.98);
  }
}

/* 额外添加自定义激活状态样式 */
.active-menu-item {
  background-color: #1890ff !important;
  color: white !important;
  position: relative;
  
  /* 左侧添加亮色边框标记 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: #ffffff;
  }
  
  /* 激活项悬停状态 */
  &:hover {
    background-color: #40a9ff !important;
    box-shadow: 0 0 8px rgba(24, 144, 255, 0.5);
    transform: translateX(2px);
    
    &::before {
      width: 4px;
    }
  }
}

:deep(.ant-menu-item-selected),
.active-menu-item {
  background-color: #1677ff !important;
  color: #fff !important;
  font-weight: bold;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.08);
}

.layout-container {
  min-height: 100vh;
  height: 100vh;
}
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
}
.layout-content {
  flex: 1;
  padding: 24px;
  background: #f6fbfa;
  min-height: 0;
}
.layout-footer {
  width: 100%;
  text-align: center;
  color: #222;
  font-size: 14px;
  opacity: 0.7;
  padding: 16px 0 8px 0;
  background: transparent;
  letter-spacing: 0.5px;
  user-select: none;
}
.layout-sider {
  background: #001529;
}

.menu-error {
  padding: 20px;
  text-align: center;
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 4px;
  margin: 20px;
}
</style>