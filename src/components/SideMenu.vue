<template>
  <div class="side-menu-container">
    <a-menu
      mode="inline"
      theme="dark"
      :inline-collapsed="collapsed"
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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

// 获取当前激活菜单的父级 openKey
function getOpenKeysByPath(path: string) {
  // 只展开一级父菜单
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 1) {
    return [`submenu-/${segments[0]}`];
  }
  // 如果是一级菜单（如 /dashboard），不展开任何子菜单
  return [];
}

const openKeys = ref<string[]>([]);

// 路由变化时只展开当前父菜单
watch(
  () => route.path,
  (newPath) => {
    if (!props.collapsed) {
      openKeys.value = getOpenKeysByPath(newPath);
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
  openKeys.value = keys;
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
</style>