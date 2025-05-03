<template>
  <div class="side-menu-container">
    <div class="logo">
      <img src="/logo.svg" alt="Logo" />
      <h1 v-show="!collapsed">Silence Platform</h1>
    </div>
    
    <a-menu
      mode="inline"
      theme="dark"
      :selectedKeys="[activeKey]"
      :openKeys="openKeys"
      @openChange="onOpenChange"
      class="custom-menu"
    >
      <!-- 仪表盘菜单项始终显示 -->
      <a-menu-item key="/dashboard" @click="navigateTo('/dashboard')">
        <template #icon><dashboard-outlined /></template>
        <span>仪表盘</span>
      </a-menu-item>
      
      <!-- 动态生成菜单 -->
      <template v-for="(menu, index) in menuList" :key="menu.path || menu.key || index">
        <a-sub-menu 
          v-if="menu.children && menu.children.length" 
          :key="`submenu-${menu.path || menu.key || index}`"
        >
          <template #icon>
            <component :is="getIcon(menu.meta?.icon)" />
          </template>
          <template #title>{{ menu.meta?.title || menu.title }}</template>
          
          <a-menu-item 
            v-for="(subMenu, subIndex) in menu.children" 
            :key="`submenu-item-${subMenu.path || subMenu.key || subIndex}`" 
            @click="navigateTo(subMenu.path || '', menu.path)"
            :class="isActive(subMenu.path, menu.path) ? 'active-menu-item' : ''"
          >
            <template #icon>
              <component :is="getIcon(subMenu.meta?.icon)" />
            </template>
            <span>{{ subMenu.meta?.title || subMenu.title }}</span>
          </a-menu-item>
        </a-sub-menu>
        
        <a-menu-item 
          v-else 
          :key="`menu-item-${menu.path || menu.key || index}`" 
          @click="navigateTo(menu.path || '')"
          :class="isActive(menu.path) ? 'active-menu-item' : ''"
        >
          <template #icon>
            <component :is="getIcon(menu.meta?.icon)" />
          </template>
          <span>{{ menu.meta?.title || menu.title }}</span>
        </a-menu-item>
      </template>
    </a-menu>
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
import { ref, computed, onMounted, watch, inject, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MENUS } from '@/utils/constant';
import { ls } from '@/utils/stoarge';
import { MenuItem } from '@/types/menu';

// 接收来自父组件的折叠状态
const collapsedFromParent = inject('collapsed', ref(false));
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const route = useRoute();
const menuList = ref<MenuItem[]>([]);

// 计算当前激活的菜单项
const activeKey = computed(() => route.path);

// 检查菜单项是否为当前激活的路径
const isActive = (path?: string, parentPath?: string): boolean => {
  if (!path) return false;
  
  // 处理路径拼接逻辑，与navigateTo函数保持一致
  let targetPath = path;
  
  if (parentPath) {
    if (!path.startsWith('/')) {
      targetPath = `${parentPath}/${path}`;
    } else if (!path.startsWith(parentPath)) {
      // 处理特殊情况，如子路由以/开头但需要拼接父路径
      const storedMenus = ls.get<MenuItem[]>(MENUS);
      if (storedMenus && Array.isArray(storedMenus)) {
        const findParentMenu = (menus: MenuItem[], targetParentPath: string): MenuItem | null => {
          for (const menu of menus) {
            if (menu.path === targetParentPath) {
              return menu;
            }
            if (menu.children && menu.children.length > 0) {
              const found = findParentMenu(menu.children, targetParentPath);
              if (found) return found;
            }
          }
          return null;
        };
        
        const parentMenu = findParentMenu(storedMenus, parentPath);
        
        if (parentMenu && parentMenu.children) {
          const childPathsWithoutSlash = parentMenu.children
            .filter(child => child.path && child.path.startsWith('/'))
            .map(child => child.path);
            
          if (childPathsWithoutSlash.includes(path)) {
            targetPath = `${parentPath}${path}`;
          }
        }
      }
    }
  }
  
  // 检查当前路径是否与目标路径匹配
  return route.path === targetPath;
};

// 当前展开的子菜单
const openKeys = ref<string[]>([]);

// 自动计算路径的父级路径，用于自动展开菜单
const calculateParentPaths = (path: string) => {
  const parts = path.split('/');
  const result = [];
  
  for (let i = 1; i < parts.length; i++) {
    const parentPath = '/' + parts.slice(1, i + 1).join('/');
    if (parentPath) {
      result.push(parentPath);
    }
  }
  
  return result;
};

// 获取子菜单的父菜单键值
const getParentMenuKey = (path: string): string | null => {
  // 查找包含当前路径的子菜单的父菜单
  for (const menu of menuList.value) {
    if (menu.children && menu.children.length > 0) {
      for (const subMenu of menu.children) {
        if (subMenu.path === path) {
          return `submenu-${menu.path || menu.key}`;
        }
      }
    }
  }
  return null;
};

// 处理子菜单展开状态变化
const onOpenChange = (keys: string[]) => {
  openKeys.value = keys;
};

// 确保当前路径的父菜单被展开
const updateOpenKeys = () => {
  // 获取当前路径的所有父路径
  const parentPaths = calculateParentPaths(route.path);
  
  // 转换成菜单需要的key格式
  const parentKeys = parentPaths.map(path => {
    for (const menu of menuList.value) {
      if (menu.path === path) {
        return `submenu-${menu.path || menu.key}`;
      }
    }
    return null;
  }).filter(Boolean) as string[];
  
  // 查找当前路径所在的子菜单的父菜单
  const parentMenuKey = getParentMenuKey(route.path);
  if (parentMenuKey && !parentKeys.includes(parentMenuKey)) {
    parentKeys.push(parentMenuKey);
  }
  
  // 更新展开的菜单项
  if (parentKeys.length > 0) {
    openKeys.value = [...new Set([...openKeys.value, ...parentKeys])];
  }
};

// 根据菜单图标字符串获取对应的图标组件
const getIcon = (icon?: string) => {
  const iconMap: Record<string, any> = {
    'dashboard': DashboardOutlined,
    'setting': SettingOutlined,
    'user': UserOutlined,
    'team': TeamOutlined,
    'menu': MenuOutlined,
    'bars': BarsOutlined
  };
  
  return icon && iconMap[icon] ? iconMap[icon] : AppstoreOutlined;
};

// 加载菜单数据
const loadMenus = () => {
  try {
    const storedMenus = ls.get<MenuItem[]>(MENUS);
    
    if (storedMenus && Array.isArray(storedMenus) && storedMenus.length > 0) {
      // 过滤掉不需要显示的菜单项
      menuList.value = storedMenus.filter(menu => !menu.meta?.show === false);
      
      // 初始化展开的菜单
      nextTick(() => {
        updateOpenKeys();
      });
    } else {
      console.warn('菜单数据不存在或格式不正确');
      
      // 当本地没有菜单数据时，保持菜单状态为空数组
      menuList.value = [];
      
      // 如果页面正在系统相关页面，但没有菜单数据，重定向到首页
      if (route.path.includes('/system') && !route.path.includes('/dashboard')) {
        router.replace('/dashboard');
      }
    }
  } catch (error) {
    console.error('加载菜单数据出错:', error);
    // 保持菜单为空
    menuList.value = [];
  }
};

// 确保在组件创建时加载菜单
onMounted(() => {
  loadMenus();
});

// 在路由变化时重新加载菜单数据并更新选中状态
watch(
  () => route.path,
  (newPath) => {
    // 确保菜单数据存在
    if (menuList.value.length === 0) {
      loadMenus();
    } else {
      // 更新展开的菜单
      updateOpenKeys();
    }
  },
  { immediate: true }
);

// 监听折叠状态变化，折叠时清空展开的菜单
watch(
  () => props.collapsed,
  (isCollapsed) => {
    if (isCollapsed) {
      openKeys.value = [];
    } else {
      // 展开时恢复展开的菜单
      updateOpenKeys();
    }
  }
);

// 导航函数
const navigateTo = (path: string, parentPath?: string) => {
  if (!path) return;
  
  let targetPath = path;
  
  // 处理路径拼接逻辑 - 避免硬编码特定路径
  if (parentPath) {
    // 处理相对路径 - 如果子路径不是以/开头，将其拼接到父路径
    if (!path.startsWith('/')) {
      targetPath = `${parentPath}/${path}`;
    } 
    // 处理绝对路径 - 如果子路径以/开头，但应该是父路径的子路由
    else if (!path.startsWith(parentPath)) {
      // 检查当前path是否应该是parentPath的子路由
      const storedMenus = ls.get<MenuItem[]>(MENUS);
      if (storedMenus && Array.isArray(storedMenus)) {
        // 查找父菜单及其子菜单配置
        const findParentMenu = (menus: MenuItem[], targetParentPath: string): MenuItem | null => {
          for (const menu of menus) {
            if (menu.path === targetParentPath) {
              return menu;
            }
            if (menu.children && menu.children.length > 0) {
              const found = findParentMenu(menu.children, targetParentPath);
              if (found) return found;
            }
          }
          return null;
        };
        
        const parentMenu = findParentMenu(storedMenus, parentPath);
        
        // 如果在父菜单的子项中找到了与当前路径匹配的项，说明它应该被拼接
        if (parentMenu && parentMenu.children) {
          const childPathsWithoutSlash = parentMenu.children
            .filter(child => child.path && child.path.startsWith('/'))
            .map(child => child.path);
            
          if (childPathsWithoutSlash.includes(path)) {
            targetPath = `${parentPath}${path}`;
          }
        }
      }
    }
  }
  
  router.push(targetPath);
};
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

  img {
    width: 32px;
    height: 32px;
  }

  h1 {
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
  /* 自定义选中状态 */
  .ant-menu-item-selected {
    background-color: #1890ff !important;
    color: white !important;
    font-weight: bold;
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
    
    &::after {
      display: none; /* 移除默认的右边框指示器 */
    }
    
    /* 选中项悬停状态增强 */
    &:hover {
      background-color: #40a9ff !important;
      box-shadow: 0 0 8px rgba(24, 144, 255, 0.5);
      transform: translateX(2px);
      
      /* 悬停时左侧边框加粗 */
      &::before {
        width: 4px;
        background-color: #ffffff;
      }
    }
    
    /* 选中项的图标颜色 */
    .anticon {
      color: white !important;
    }
  }
  
  /* 鼠标悬停状态 */
  .ant-menu-item:hover:not(.ant-menu-item-selected) {
    background-color: rgba(24, 144, 255, 0.1) !important;
    color: #1890ff !important;
  }
  
  /* 增加子菜单的缩进 */
  .ant-menu-sub .ant-menu-item {
    padding-left: 40px !important;
  }
  
  /* 子菜单被选中时的样式 */
  .ant-menu-submenu-selected > .ant-menu-submenu-title {
    color: #1890ff !important;
    font-weight: bold;
    
    /* 子菜单标题悬停效果 */
    &:hover {
      color: #40a9ff !important;
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
</style>