<template>
  <ALayout class="layout-container">
    <!-- 左侧菜单 -->
    <ALayoutSider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="256"
      class="layout-sider"
    >

      <SideMenu :collapsed="collapsed" :key="menuKey" />
    </ALayoutSider>

    <ALayout>
      <!-- 顶部导航 -->
      <ALayoutHeader class="layout-header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <breadcrumb />
        </div>
        <div class="header-right">
          <ASpace>
            <!-- 环境选择按钮 -->
            <a-button
              type="link"
              class="env-button"
              @click="showEnvModal = true"
            >
              <environment-outlined />
              {{ envStore.envDisplayName }}
              <down-outlined />
            </a-button>

            <!-- 系统/组件选择按钮 - 合并为一个按钮 -->
            <a-button
              type="link"
              class="env-button"
              @click="openSystemTab"
              v-if="route.path.includes('/config')"
            >
              <apartment-outlined />
              <span v-if="selectedComponents.length > 0 && selectedComponentName">
                {{ selectedSystemName }} / {{ selectedComponentName }}
              </span>
              <span v-else>
                {{ selectedSystemName || '请选择子系统/组件' }}
              </span>
              <down-outlined />
            </a-button>

            <!-- 组件筛选按钮 -->
            <template>
              <a-button
                type="primary"
                style="margin-right: 16px;"
                @click="showComponentFilter = true"
              >
                <filter-outlined />
                组件管理
              </a-button>
            </template>

            <a-popover
              v-model:open="searchHistoryVisible"
              trigger="click"
              placement="bottomRight"
              :overlay-style="{ width: '300px' }"
            >
              <template #content>
                <div class="search-popup">
                  <a-input-search
                    v-model:value="searchValue"
                    placeholder="搜索..."
                    @search="handleSearch"
                    @pressEnter="handleSearch(searchValue)"
                  />
                  <div v-if="searchHistory.length > 0" class="search-history">
                    <div class="history-header">
                      <span>搜索历史</span>
                      <a-button type="link" @click="clearSearchHistory">清空历史</a-button>
                    </div>
                    <div class="history-list">
                      <div
                        v-for="(item, index) in searchHistory"
                        :key="index"
                        class="history-item"
                      >
                        <clock-circle-outlined />
                        <span class="history-text" @click="onHistoryItemClick(item)">{{ item }}</span>
                        <close-outlined class="delete-icon" @click="removeSearchHistory(index)" />
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-history">
                    暂无搜索历史
                  </div>
                </div>
              </template>
              <a-tooltip title="搜索">
                <search-outlined class="action-icon" />
              </a-tooltip>
            </a-popover>
            <a-popover
              v-model:open="notificationVisible"
              trigger="click"
              placement="bottomRight"
              :overlay-style="{ width: '336px' }"
            >
              <template #content>
                <div class="notification-popup">
                  <div class="notification-header">
                    <div class="header-title">
                      <span>通知</span>
                      <a-badge :count="unreadCount" />
                    </div>
                    <a-button type="link" @click="handleMarkAllAsRead">全部标记为已读</a-button>
                  </div>
                  <a-spin :spinning="notificationLoading">
                    <a-tabs v-model:activeKey="activeNoticeTab">
                      <a-tab-pane key="0" tab="未读消息">
                        <div class="notification-list">
                          <div
                            v-for="item in notifications"
                            :key="item.id"
                            class="notification-item"
                            @click="viewNotificationDetail(item)"
                          >
                            <div class="avatar">
                              <a-avatar :style="{ background: '#1890ff' }">
                                {{ item.senderName?.[0] || 'N' }}
                              </a-avatar>
                            </div>
                            <div class="content">
                              <div class="title">{{ item.title }}</div>
                              <div class="description">{{ item.content }}</div>
                              <div class="time">{{ dayjs(item.createdDate).fromNow() }}</div>
                            </div>
                            <div class="status">
                              <div v-if="item.status === 0" class="unread-dot"></div>
                            </div>
                          </div>
                          <div v-if="notifications.length === 0" class="empty-placeholder">
                            暂无未读消息
                          </div>
                        </div>
                      </a-tab-pane>
                      <a-tab-pane key="1" tab="已读消息">
                        <div class="notification-list">
                          <div
                            v-for="item in notifications"
                            :key="item.id"
                            class="notification-item"
                            @click="viewNotificationDetail(item)"
                          >
                            <div class="avatar">
                              <a-avatar :style="{ background: '#1890ff' }">
                                {{ item.senderName?.[0] || 'N' }}
                              </a-avatar>
                            </div>
                            <div class="content">
                              <div class="title">{{ item.title }}</div>
                              <div class="description">{{ item.content }}</div>
                              <div class="time">{{ dayjs(item.createdDate).fromNow() }}</div>
                            </div>
                          </div>
                          <div v-if="notifications.length === 0" class="empty-placeholder">
                            暂无已读消息
                          </div>
                        </div>
                      </a-tab-pane>
                    </a-tabs>
                  </a-spin>
                  <div class="notification-footer">
                    <div class="footer-actions">
                      <a-button type="link" class="clear-button" @click="handleClearAllNotifications">
                        <delete-outlined />
                        清空
                      </a-button>
                      <a-button type="primary" @click="viewAllNotifications">查看所有消息</a-button>
                    </div>
                  </div>
                </div>
              </template>
              <a-tooltip title="通知">
                <a-badge :count="unreadCount">
                  <bell-outlined class="action-icon" />
                </a-badge>
              </a-tooltip>
            </a-popover>
            <ATooltip title="设置">
              <setting-outlined class="action-icon" @click="showSettings = true" />
            </ATooltip>
            <ADropdown>
              <div class="user-dropdown">
                <AAvatar :src="userInfo.avatar || require('@/assets/images/doraemon.png')"></AAvatar>
                <span class="username">{{ userInfo.name }}</span>
              </div>
              <template #overlay>
                <AMenu>
                  <AMenuItem key="profile">
                    <user-outlined />
                    <span>个人中心</span>
                  </AMenuItem>
                  <AMenuItem key="settings">
                    <setting-outlined />
                    <span>个人设置</span>
                  </AMenuItem>
                  <AMenuDivider />
                  <AMenuItem key="logout" @click="handleLogout">
                    <logout-outlined />
                    <span>退出登录</span>
                  </AMenuItem>
                </AMenu>
              </template>
            </ADropdown>
          </ASpace>
        </div>
      </ALayoutHeader>

      <!-- 内容区域 -->
      <ALayoutContent class="layout-content">
        <div class="content-container">
          <router-view v-slot="{ Component, route }">
            <transition name="fade" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" :key="route.name || route.path" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
      </ALayoutContent>
    </ALayout>
   <!-- 设置抽屉 -->
   <settings-drawer v-model:open="showSettings" />

<!-- 组件筛选抽屉 -->
<a-drawer
  title="选择系统/组件"
  :width="600"
  v-model:open="showComponentFilter"
  @close="showComponentFilter = false"
  :body-style="{ padding: '0' }"
  class="selector-drawer"
>
  <div class="component-filter">
    <div class="filter-header">
      <a-tabs v-model:activeKey="activeFilterTab">
        <a-tab-pane key="system" tab="子系统列表" />
        <a-tab-pane key="component" tab="组件列表" />
      </a-tabs>
    </div>
    <div class="filter-content">
      <!-- 系统列表 -->
      <div v-if="activeFilterTab === 'system'" class="system-list">
        <div class="search-section">
          <a-input-search
            v-model:value="systemSearchValue"
            placeholder="请输入子系统关键字"
            style="width: 100%; margin-bottom: 16px;"
          />
        </div>
        <div v-if="filteredSystems.length === 0" style="text-align: center; padding: 20px;">
          暂无子系统数据
        </div>
        <div
          v-for="system in filteredSystems"
          :key="system.id"
          class="system-item"
          :class="{ active: system.id === selectedSystem }"
          @click="handleSystemSelect(system)"
        >
          <div class="system-name">{{ system.name }}</div>
          <div class="system-code">编码: {{ system.code }}</div>
          <div class="system-desc">{{ system.description }}</div>
        </div>
      </div>
      
      <!-- 组件列表 -->
      <div v-else class="component-list">
        <div class="search-section">
          <a-input-search
            v-model:value="componentSearchValue"
            placeholder="请输入组件关键字"
            style="width: 100%; margin-bottom: 16px;"
          />
        </div>
        <div v-if="!selectedSystem" style="text-align: center; padding: 20px;">
          请先选择子系统
        </div>
        <div v-else-if="filteredComponents.length === 0" style="text-align: center; padding: 20px;">
          当前子系统下暂无组件数据
        </div>
        <div
          v-else
          v-for="component in filteredComponents"
          :key="component.id"
          class="component-item"
          :class="{ active: selectedComponents.includes(component.id) }"
          @click="handleComponentSelect(component)"
        >
          <div class="component-name">{{ component.name }}</div>
          <div class="component-code">编码: {{ component.code }}</div>
          <div class="component-desc">{{ component.description }}</div>
        </div>
      </div>
    </div>
  </div>
</a-drawer>

<!-- 环境选择模态框 -->
<a-modal
  v-model:open="showEnvModal"
  title="切换环境"
  :footer="null"
  :width="500"
  class="env-switch-modal"
  :mask-closable="false"
>
  <div class="env-selection">
    <div
      v-for="env in envOptions"
      :key="env.value"
      class="env-option"
      :class="{ active: envStore.currentEnv === env.value }"
      @click="handleEnvSelect(env.value)"
    >
      {{ env.label }}
    </div>
  </div>
</a-modal>
</ALayout>
</template>

<script setup lang="ts">
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  FilterOutlined,
  DownOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
} from '@ant-design/icons-vue';
import { ref, computed, onMounted, onUnmounted, provide, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useEnvStore } from '../stores/env';
import { useConfigStore } from '../stores/config';
import { useSearchHistory } from '../stores/searchHistory';
import type { EnvType } from '../stores/env';
import { getAllConfigSubsystem, type ConfigSubsystem } from '../api/configSubsystem';
import { getConfigComponents, type ConfigComponent } from '../api/configComponent';
import { getConfigEnvironments, type ConfigEnvironment } from '../api/configEnvironment';
import {
  getNoticeByStatus,
  markNoticeAsRead,
  markAllNoticeAsRead,
  clearNotice,
  type Notice
} from '../api/notice';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Badge,
  Tooltip,
  Divider,
  Input,
  Select,
  Drawer,
  Tabs,
  Modal,
  message,
  Card,
} from 'ant-design-vue';
import Breadcrumb from '../components/Breadcrumb.vue';
import SettingsDrawer from '../components/SettingsDrawer.vue';
import type { SelectValue } from 'ant-design-vue/es/select';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

import SideMenu from '@/components/SideMenu.vue';
import { ls } from '@/utils/stoarge';
import { MENUS, USER_INFO } from '@/utils/constant';
import { UserInfo } from '@/types/user';

// 注册需要的组件
const ALayoutSider = Layout.Sider;
const ALayoutHeader = Layout.Header;
const ALayoutContent = Layout.Content;
const AMenu = Menu;
const AMenuItem = Menu.Item;
const ASubMenu = Menu.SubMenu;
const AMenuDivider = Menu.Divider;
const AButton = Button;
const ADropdown = Dropdown;
const AAvatar = Avatar;
const ASpace = Space;
const ABadge = Badge;
const ATooltip = Tooltip;
const ADivider = Divider;
const AInput = Input;
const ASelect = Select;
const ATabs = Tabs;
const ADrawer = Drawer;
const AModal = Modal;
const ACard = Card;

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const envStore = useEnvStore();
const configStore = useConfigStore();
const { history: searchHistory, addSearchHistory, clearSearchHistory, removeSearchHistory } = useSearchHistory();
const collapsed = ref(false);
// 只有在必要时才更新menuKey，不要在路由切换时更新
const menuKey = ref("side-menu-" + Date.now());

const showSettings = ref(false);
const searchValue = ref('');
const searchHistoryVisible = ref(false);
const notificationVisible = ref(false);
const notifications = ref<Notice[]>([]);
const notificationLoading = ref(false);
const unreadCount = ref(0);
const activeNoticeTab = ref('0');

// 注册dayjs插件
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 自动计算需要缓存的视图组件
const cachedViews = computed(() => {
  const menus = ls.get(MENUS);
  if (!menus || !Array.isArray(menus)) return [];
  
  // 递归提取所有可能的组件名称进行缓存
  const extractComponentNames = (menuItems: any[]): string[] => {
    let names: string[] = [];
    
    menuItems.forEach(item => {
      // 添加组件名（使用路径或name派生，与router中的处理方式保持一致）
      if (item.path) {
        const derivedName = item.name || item.path.replace(/^\//, '').replace(/\//g, '-');
        names.push(derivedName);
      }
      
      // 递归处理子菜单
      if (item.children && item.children.length > 0) {
        names = names.concat(extractComponentNames(item.children));
      }
    });
    
    return names;
  };
  
  // 始终包含Dashboard
  const allNames = ['Dashboard'].concat(extractComponentNames(menus));
  
  // 去重
  return [...new Set(allNames)];
});

// 提供折叠状态给子组件
provide('collapsed', collapsed);

// 获取用户信息

// 定义自定义的UI用户信息接口
interface BasicLayoutUserInfo {
  name: string;
  avatar?: string;
}

// 从用户存储中获取用户信息，并将其转换为UI友好的格式
const userInfo = computed<BasicLayoutUserInfo>(() => {
  const user = ls.get<UserInfo>(USER_INFO)
  if (user) {
    return {
      name: user.username,
      avatar: user.avatar
    };
  }
  return { name: 'Admin' };
});



// 当前页面标题
const currentTitle = computed(() => {
  return route.meta.title || '首页';
});

// 监听路由变化，但只在特定情况下重新渲染菜单
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 只检查菜单数据是否存在，不重新渲染菜单
    const menus = ls.get(MENUS);
    if (!menus || !Array.isArray(menus) || menus.length === 0) {
      // 如果没有菜单数据且不在登录页，重新登录
      if (!newPath.includes('/login')) {
        router.push('/login');
      }
    }
    
    // 只有在从dashboard切换到system或从system切换到dashboard时才重新渲染菜单
    // 而不是在子菜单之间切换时重新渲染
    const oldPathBase = oldPath.split('/')[1];
    const newPathBase = newPath.split('/')[1];
    if (oldPathBase !== newPathBase) {
      menuKey.value = "side-menu-" + Date.now();
    }
  }
);

// 处理登出
const handleLogout = async () => {
  await userStore.handleLogout();
  router.push('/login');
};

// 处理搜索
const handleSearch = (value: string) => {
  if (!value.trim()) return;
  
  // 添加到搜索历史
  addSearchHistory(value);
  
  // TODO: 执行搜索逻辑
  
  // 关闭搜索弹窗
  searchHistoryVisible.value = false;
  
  // 清空搜索框，下次进入时显示placeholder
  setTimeout(() => {
    searchValue.value = '';
  }, 300);
};

// 点击历史记录项
const onHistoryItemClick = (item: string) => {
  searchValue.value = item;
  handleSearch(item);
};

// 组件挂载时确保路由正确初始化
onMounted(() => {
  // 如果路径是根路径，重定向到仪表盘
  if (route.path === '/') {
    router.replace('/dashboard');
  }
  
  // 检查菜单数据是否已加载
  const menus = ls.get(MENUS);
  if (!menus || !Array.isArray(menus) || menus.length === 0) {
    // 如果当前不在登录页，重定向到登录页
    if (route.path !== '/login') {
      router.push('/login');
    }
  }
});

// 获取未读通知数量
const fetchUnreadCount = async () => {
  try {
    const data = await getNoticeByStatus(0);
    if (data.length) {
      unreadCount.value = data.length;
    }
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
  }
};

// 获取通知列表
const fetchNotifications = async (status?: number) => {
  console.log(activeNoticeTab.value)
  notificationLoading.value = true;
  try {
    const data = await getNoticeByStatus(status ?? Number(activeNoticeTab.value));
    if (data?.length) {
      notifications.value = data;
    } else {
      notifications.value = [];
    }
    
    // 如果当前是查看未读通知，更新未读数量
    if (status === 0 || (status === undefined && activeNoticeTab.value === '0')) {
      unreadCount.value = notifications.value.length;
    } else {
      // 如果是查看已读通知，重新获取未读数量
      await fetchUnreadCount();
    }
  } catch (error) {
    console.error('获取通知列表失败:', error);
    message.error('获取通知列表失败');
  } finally {
    notificationLoading.value = false;
  }
};

// 标记单个通知为已读
const handleMarkAsRead = async (notice: Notice, skipRefresh = false) => {
  try {
    await markNoticeAsRead(notice.id);
    message.success('标记已读成功');
    if (!skipRefresh) {
      await fetchNotifications(Number(activeNoticeTab.value));
    } else {
      // 如果跳过刷新，则只更新未读计数
      await fetchUnreadCount();
    }
  } catch (error) {
    console.error('标记已读失败:', error);
    message.error('标记已读失败');
  }
};

// 标记所有为已读
const handleMarkAllAsRead = async () => {
  try {
    await markAllNoticeAsRead();
    message.success('全部标记已读成功');
    await fetchNotifications(Number(activeNoticeTab.value));
  } catch (error) {
    console.error('全部标记已读失败:', error);
    message.error('全部标记已读失败');
  }
};

// 清空所有通知
const handleClearAllNotifications = async () => {
  try {
    await clearNotice();
    message.success('清空通知成功');
    notifications.value = [];
    unreadCount.value = 0;
  } catch (error) {
    console.error('清空通知失败:', error);
    message.error('清空通知失败');
  }
};

// 查看所有通知
const viewAllNotifications = () => {
  // Using replace instead of push to avoid history stacking issues
  router.replace('/notification');
  notificationVisible.value = false;
};

// 查看通知详情
const viewNotificationDetail = async (notice: Notice) => {
  try {
    // 先关闭通知弹窗，防止DOM操作冲突
    notificationVisible.value = false;
    
    // 使用nextTick确保DOM更新后再执行后续操作
    await nextTick();
    
    // 如果是未读通知，标记为已读
    if (notice.status === 0) {
      await handleMarkAsRead(notice, true);
    }
    
    // TODO: 实现查看通知详情的逻辑
    console.log('查看通知详情:', notice);
  } catch (error) {
    console.error('查看通知详情失败:', error);
    message.error('查看通知详情失败');
  }
};

// 监听通知 tab 切换
watch(activeNoticeTab, () => {
  fetchNotifications();
});

// 在组件挂载时获取通知列表和未读数量
onMounted(() => {
  fetchNotifications(0); // 默认获取未读通知
});

// 定期刷新通知列表和未读数量（每分钟）
let notificationTimer: number;
onMounted(() => {
  notificationTimer = window.setInterval(() => {
    fetchNotifications(Number(activeNoticeTab.value));
  }, 60000);
});

onUnmounted(() => {
  if (notificationTimer) {
    clearInterval(notificationTimer);
  }
});

// 组件筛选
const showComponentFilter = ref(false);
const activeFilterTab = ref('system');
const systemSearchValue = ref('');
const componentSearchValue = ref('');

// 确保初始化时从store中获取值
const selectedSystem = ref<number | null>(configStore.selectedSystemId || null);
const selectedComponents = ref<number[]>(configStore.selectedComponentIds || []);

// 状态定义
const subsystems = ref<ConfigSubsystem[]>([]);
const components = ref<ConfigComponent[]>([]);
const environments = ref<ConfigEnvironment[]>([]);
const loading = ref(false);

// 获取子系统列表
const fetchSubsystems = async () => {
  loading.value = true;
  try {
    const response = await getAllConfigSubsystem();
    console.log('获取子系统原始响应:', response);
    
    // 正确处理API响应格式
    if (typeof response === 'object' && response !== null) {
      // 检查是否是标准响应格式 { code, data, message }
      if ('code' in response && 'data' in response && Array.isArray(response.data)) {
        subsystems.value = response.data.filter((item): item is ConfigSubsystem => item !== undefined);
        console.log('解析后的子系统列表:', subsystems.value);
      } 
      // 检查是否直接是数组
      else if (Array.isArray(response)) {
        subsystems.value = response.filter((item): item is ConfigSubsystem => item !== undefined);
        console.log('直接数组的子系统列表:', subsystems.value);
      }
      // 其他情况，设置为空数组
      else {
        console.warn('子系统返回格式不符合预期:', response);
        subsystems.value = [];
      }
    } else {
      console.warn('子系统响应不是对象:', response);
      subsystems.value = [];
    }
  } catch (error) {
    console.error('获取子系统列表失败:', error);
    message.error('获取子系统列表失败');
    subsystems.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取组件列表
const fetchComponents = async (subsystemId: number) => {
  try {
    const response = await getConfigComponents({ subsystemId });
    console.log('获取组件原始响应:', response);
    
    // 正确处理API响应格式
    if (typeof response === 'object' && response !== null) {
      // 检查是否是标准响应格式 { code, data, message }
      if ('code' in response && 'data' in response && Array.isArray(response.data)) {
        components.value = response.data.filter((item): item is ConfigComponent => item !== undefined);
        console.log('解析后的组件列表:', components.value);
      } 
      // 检查是否直接是数组
      else if (Array.isArray(response)) {
        components.value = response.filter((item): item is ConfigComponent => item !== undefined);
        console.log('直接数组的组件列表:', components.value);
      }
      // 其他情况，设置为空数组
      else {
        console.warn('组件返回格式不符合预期:', response);
        components.value = [];
      }
    } else {
      console.warn('组件响应不是对象:', response);
      components.value = [];
    }
  } catch (error) {
    console.error('获取组件列表失败:', error);
    message.error('获取组件列表失败');
    components.value = [];
  }
};

// 获取环境列表
const fetchEnvironments = async (componentId: number) => {
  try {
    const response = await getConfigEnvironments({ 
      configComponentId: componentId, 
      envType: Number(envStore.currentEnv)  // 将字符串转换为数字
    });
    
    console.log('获取环境原始响应:', response);
    
    // 正确处理API响应格式
    if (typeof response === 'object' && response !== null) {
      // 检查是否是标准响应格式 { code, data, message }
      if ('code' in response && 'data' in response && Array.isArray(response.data)) {
        environments.value = response.data.filter((item): item is ConfigEnvironment => item !== undefined);
        console.log('解析后的环境列表:', environments.value);
      } 
      // 检查是否直接是数组
      else if (Array.isArray(response)) {
        environments.value = response.filter((item): item is ConfigEnvironment => item !== undefined);
        console.log('直接数组的环境列表:', environments.value);
      }
      // 其他情况，设置为空数组
      else {
        console.warn('环境返回格式不符合预期:', response);
        environments.value = [];
      }
    } else {
      console.warn('环境响应不是对象:', response);
      environments.value = [];
    }
  } catch (error) {
    console.error('获取环境列表失败:', error);
    message.error('获取环境列表失败');
    environments.value = [];
  }
};

// 处理系统选择
const handleSystemSelect = async (system: ConfigSubsystem) => {
  console.log('选中系统:', system.code, '系统ID:', system.id, '类型:', typeof system.id);
  
  // 确保ID是数字类型
  const systemId = Number(system.id);
  selectedSystem.value = systemId;
  configStore.setSelectedSystem(systemId);
  
  await fetchComponents(systemId);
  
  // 自动切换到组件标签页
  activeFilterTab.value = 'component';
};

// 处理组件选择
const handleComponentSelect = async (component: ConfigComponent) => {
  console.log('选中组件:', component.name, '组件ID:', component.id, '类型:', typeof component.id);
  
  // 确保ID是数字类型
  const componentId = Number(component.id);
  
  // 先保存到store，再设置本地状态
  configStore.setSelectedComponents([componentId]);
  selectedComponents.value = [componentId];
  console.log('已保存组件ID到store:', configStore.selectedComponentIds);
  
  // 加载环境数据
  await fetchEnvironments(componentId);
  showComponentFilter.value = false;
  
  // 不再使用刷新页面的方式
  if (route.path.includes('/config')) {
    console.log('配置页面选中组件，刷新相关组件数据');
    // 改为其他方式通知组件更新，比如通过store或事件总线
    // 如果必须刷新，应该使用替代方案
    // 例如：手动修改路由参数触发组件重渲染
    const query = { ...route.query, _t: Date.now() };
    router.replace({ path: route.path, query });
  }
};

// 在组件挂载时获取子系统列表
onMounted(async () => {
  // 预加载子系统列表，无论是否在配置管理页面
  console.log('预加载子系统数据...');
  await fetchSubsystems();

  // 确保从store中恢复选中状态
  console.log('从 store 恢复选中状态, systemId:', configStore.selectedSystemId, ', componentIds:', configStore.selectedComponentIds);
  
  // 如果在配置管理页面，加载组件数据
  if (route.path.includes('/config')) {
    // 如果有存储的选中状态，恢复它们
    if (configStore.selectedSystemId) {
      selectedSystem.value = configStore.selectedSystemId;
      console.log('恢复选中的系统ID:', selectedSystem.value, '类型:', typeof selectedSystem.value);
      console.log('正在加载组件数据，系统ID:', configStore.selectedSystemId);
      await fetchComponents(configStore.selectedSystemId);
      
      if (configStore.selectedComponentIds.length > 0) {
        selectedComponents.value = configStore.selectedComponentIds;
        console.log('恢复选中的组件IDs:', selectedComponents.value, '类型:', typeof selectedComponents.value[0]);
        const componentId = configStore.selectedComponentIds[0];
        console.log('正在加载环境数据，组件ID:', componentId);
        await fetchEnvironments(componentId);
      }
    } else {
      console.log('未选择子系统ID，无法恢复状态');
    }
  }
  
  // 输出当前状态
  console.log('系统列表:', subsystems.value);
  console.log('当前选中系统ID:', selectedSystem.value);
  console.log('当前选中系统名称:', selectedSystemName.value);
});

// 处理组件过滤
const handleComponentFilter = () => {
  showComponentFilter.value = true;
  activeFilterTab.value = 'system';
  
  // 无论是否有存储状态，都加载子系统列表
  fetchSubsystems().then(() => {
    console.log('已加载子系统列表，总数:', subsystems.value.length);
    
    // 如果有存储的选中状态，恢复它们
    if (configStore.selectedSystemId) {
      selectedSystem.value = configStore.selectedSystemId;
      fetchComponents(configStore.selectedSystemId).then(() => {
        console.log('已加载组件列表，总数:', components.value.length);
        // 加载完组件列表后，如果有选中的组件，切换到组件标签页
        if (configStore.selectedComponentIds.length > 0) {
          selectedComponents.value = configStore.selectedComponentIds;
          activeFilterTab.value = 'component';
        }
      });
    } else if (subsystems.value.length > 0) {
      // 如果没有存储选中状态，但有子系统列表，默认选择第一个
      const firstSystem = subsystems.value[0];
      selectedSystem.value = firstSystem.id;
      fetchComponents(firstSystem.id).then(() => {
        console.log('已加载默认子系统的组件列表，总数:', components.value.length);
      });
    }
  });
};

// 环境选择模态框
const showEnvModal = ref(false);

// 环境选项
const envOptions = [
  { label: '开发环境', value: '1' as const },
  { label: '测试环境', value: '2' as const },
  { label: '生产环境', value: '3' as const },
] as const;

// 处理环境选择
const handleEnvSelect = (value: EnvType) => {
  envStore.setCurrentEnv(value);
  showEnvModal.value = false;
  
  // 不再使用刷新页面的方式
  if (route.path.includes('/config') && configStore.selectedComponentIds.length > 0) {
    console.log('环境切换，重新加载环境数据');
    const componentId = configStore.selectedComponentIds[0];
    fetchEnvironments(componentId);
    
    // 使用修改路由参数的方式触发组件重渲染
    const query = { ...route.query, _t: Date.now() };
    router.replace({ path: route.path, query });
  }
};

// 过滤系统列表
const filteredSystems = computed(() => {
  if (!systemSearchValue.value) return subsystems.value || [];
  return (subsystems.value || []).filter(sys => 
    sys?.name?.toLowerCase().includes(systemSearchValue.value.toLowerCase()) ||
    sys?.code?.toLowerCase().includes(systemSearchValue.value.toLowerCase()) ||
    sys?.description?.toLowerCase().includes(systemSearchValue.value.toLowerCase())
  );
});

// 过滤组件列表
const filteredComponents = computed(() => {
  if (!componentSearchValue.value) return components.value || [];
  return (components.value || []).filter(comp => 
    comp?.name?.toLowerCase().includes(componentSearchValue.value.toLowerCase()) ||
    comp?.code?.toLowerCase().includes(componentSearchValue.value.toLowerCase()) ||
    comp?.description?.toLowerCase().includes(componentSearchValue.value.toLowerCase())
  );
});

// 监听环境变化
watch(() => envStore.currentEnv, async (newEnv) => {
  if (route.path.includes('/config') && configStore.selectedComponentIds.length > 0) {
    const componentId = configStore.selectedComponentIds[0];
    await fetchEnvironments(componentId);
  }
});

// 新增的状态
const showSystemModal = ref(false);
const showComponentModal = ref(false);

// 计算选中的系统名称
const selectedSystemName = computed(() => {
  if (!selectedSystem.value) return '请选择子系统';
  
  // 查找与选中ID匹配的系统
  const system = subsystems.value.find(sys => sys.id === selectedSystem.value);
  if (system) {
    return system.name;
  }
  
  // 如果直接使用数字ID，尝试将selectedSystem转换为数字进行比较
  const systemId = Number(selectedSystem.value);
  const systemByNumericId = subsystems.value.find(sys => sys.id === systemId);
  if (systemByNumericId) {
    return systemByNumericId.name;
  }
  
  return '请选择子系统';
});

// 计算选中的组件名称
const selectedComponentName = computed(() => {
  if (!selectedComponents.value.length) return '请选择组件';
  
  // 查找与选中ID匹配的组件
  const componentId = selectedComponents.value[0];
  const component = components.value.find(comp => comp.id === componentId);
  if (component) {
    return component.name;
  }
  
  // 如果直接使用数字ID，尝试将componentId转换为数字进行比较
  const numericId = Number(componentId);
  const componentByNumericId = components.value.find(comp => comp.id === numericId);
  if (componentByNumericId) {
    return componentByNumericId.name;
  }
  
  return '请选择组件';
});

// 新增的函数来处理系统和组件选择按钮点击
const openSystemTab = () => {
  showComponentFilter.value = true;
  activeFilterTab.value = 'system';
};

const openComponentTab = () => {
  showComponentFilter.value = true;
  activeFilterTab.value = 'component';
};

// 处理系统模态框的选择
const handleSystemModalSelect = function(system: ConfigSubsystem) {
  console.log('模态框选择系统:', system.code, '系统ID:', system.id, '类型:', typeof system.id);
  
  // 确保ID是数字类型
  const systemId = Number(system.id);
  
  // 先保存到store，再设置本地状态
  configStore.setSelectedSystem(systemId);
  selectedSystem.value = systemId;
  console.log('已保存系统ID到store:', configStore.selectedSystemId);
  
  // 清空已选组件
  configStore.setSelectedComponents([]);
  selectedComponents.value = [];
  
  // 加载组件数据
  fetchComponents(systemId);
  showComponentFilter.value = false;
  
  // 不再使用刷新页面的方式
  if (route.path.includes('/config')) {
    console.log('配置页面选中系统，刷新相关系统数据');
    // 改为其他方式通知组件更新
    const query = { ...route.query, _t: Date.now() };
    router.replace({ path: route.path, query });
  }
};

// 处理组件模态框的选择
const handleComponentModalSelect = async function(component: ConfigComponent) {
  console.log('模态框选择组件:', component.name, '组件ID:', component.id, '类型:', typeof component.id);
  
  // 确保ID是数字类型
  const componentId = Number(component.id);
  
  // 先保存到store，再设置本地状态
  configStore.setSelectedComponents([componentId]);
  selectedComponents.value = [componentId];
  console.log('已保存组件ID到store:', configStore.selectedComponentIds);
  
  // 加载环境数据
  await fetchEnvironments(componentId);
  showComponentFilter.value = false;
  
  // 不再使用刷新页面的方式
  if (route.path.includes('/config')) {
    console.log('模态框配置页面选中组件，刷新相关组件数据');
    // 使用修改路由参数的方式触发组件重渲染
    const query = { ...route.query, _t: Date.now() };
    router.replace({ path: route.path, query });
  }
};
</script>

<style lang="scss" scoped>
.layout-container {
  min-height: 100vh;
  background-color: var(--layout-body-background);
}

.layout-sider {
  background-color: var(--layout-sider-background);
}

.layout-header {
  background-color: var(--layout-header-background);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  line-height: 64px;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .action-icon {
      padding: 0 8px;
      font-size: 16px;
      color: var(--text-color);
      opacity: 0.85;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        color: var(--primary-color);
      }
    }

    .user-dropdown {
      display: flex;
      align-items: center;
      padding: 0 8px;
      cursor: pointer;

      .username {
        margin-left: 8px;
        color: var(--text-color);
      }
      
      :deep(.ant-avatar) {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
}

.layout-content {
  padding: 24px;
  background-color: var(--layout-body-background);
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
  color: var(--text-color);
  opacity: 0.85;

  &:hover {
    color: var(--primary-color);
  }
}

.logo {
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  background-color: var(--layout-sider-background);
  border-bottom: 1px solid var(--border-color);

  img {
    width: 32px;
    height: 32px;
  }

  h1 {
    margin: 0 0 0 12px;
    color: var(--text-color);
    font-weight: 600;
    font-size: 18px;
    line-height: 32px;
    white-space: nowrap;
  }
}

:deep(.ant-layout-sider-children) {
  background-color: var(--layout-sider-background);
}

:deep(.ant-menu) {
  background-color: var(--layout-sider-background);
  color: var(--text-color);
}

:deep(.ant-menu-sub) {
  background-color: var(--component-background) !important;
}

:deep(.ant-menu-item), :deep(.ant-menu-submenu-title) {
  color: var(--text-color) !important;
  
  &:hover {
    color: var(--primary-color) !important;
  }
  
  &.ant-menu-item-selected {
    background-color: var(--primary-color) !important;
    color: #fff !important;
  }
}

.search-popup {
  padding: 12px;
  background-color: var(--component-background);
  
  .search-history {
    margin-top: 16px;
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      color: var(--text-color);
      
      .ant-btn {
        padding: 0;
        height: auto;
        line-height: 1;
      }
    }
    
    .history-list {
      .history-item {
        display: flex;
        align-items: center;
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.3s;
        
        &:hover {
          background-color: var(--menu-item-hover-bg);
          
          .delete-icon {
            opacity: 1;
          }
        }
        
        .anticon {
          color: var(--text-color);
          opacity: 0.45;
          font-size: 14px;
        }
        
        .history-text {
          flex: 1;
          margin: 0 12px;
          color: var(--text-color);
        }
        
        .delete-icon {
          opacity: 0;
          transition: opacity 0.3s;
          
          &:hover {
            color: #ff4d4f;
          }
        }
      }
    }
  }
  
  .empty-history {
    text-align: center;
    color: var(--text-color);
    opacity: 0.45;
    padding: 16px 0;
  }
}

.notification-popup {
  background-color: var(--component-background);

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-color);
      font-weight: 500;
    }
  }

  .notification-list {
    max-height: 400px;
    overflow-y: auto;

    .notification-item {
      display: flex;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.3s;
      position: relative;
      border-bottom: 1px solid var(--border-color);

      &:hover {
        background-color: var(--menu-item-hover-bg);
      }

      .avatar {
        margin-right: 12px;
      }

      .content {
        flex: 1;
        overflow: hidden;

        .title {
          color: var(--text-color);
          margin-bottom: 4px;
          font-weight: 500;
        }

        .description {
          color: var(--text-color);
          opacity: 0.45;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .time {
          color: var(--text-color);
          opacity: 0.45;
          font-size: 12px;
        }
      }

      .status {
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;

        .unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--primary-color);
        }
      }
    }
  }

  .empty-placeholder {
    padding: 32px 0;
    text-align: center;
    color: var(--text-color);
    opacity: 0.45;
    background-color: var(--component-background);
  }

  .notification-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border-color);
    background-color: var(--component-background);

    .footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .clear-button {
        color: #ff4d4f;
        padding: 0;

        .anticon {
          margin-right: 4px;
        }

        &:hover {
          color: #ff7875;
        }
      }
    }
  }
}

:deep(.ant-tabs-nav) {
  margin-bottom: 0;
  background-color: var(--component-background);
}

:deep(.ant-tabs-tab) {
  color: var(--text-color);
  opacity: 0.65;
  padding: 12px 16px;
  
  &.ant-tabs-tab-active {
    .ant-tabs-tab-btn {
      color: var(--primary-color);
    }
  }
}

:deep(.ant-popover-inner) {
  padding: 0;
  background-color: var(--component-background);
}

:deep(.ant-popover-inner-content) {
  padding: 0;
}

.component-filter {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .filter-header {
    padding: 0;
    border-bottom: 1px solid #e8e8e8;
    background: #fff;
    
    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
    }
    
    :deep(.ant-tabs-tab) {
      padding: 12px 16px;
      font-size: 16px;
      
      &.ant-tabs-tab-active {
        .ant-tabs-tab-btn {
          font-weight: 500;
        }
      }
    }
    
    :deep(.ant-tabs) {
      .ant-tabs-tab:nth-child(1) .ant-tabs-tab-btn {
        color: #000;
      }
      
      .ant-tabs-tab:nth-child(2) .ant-tabs-tab-btn {
        color: #ff0000;
      }
    }
  }
  
  .filter-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    
    .search-section {
      margin-bottom: 16px;
      
      :deep(.ant-input-search) {
        .ant-input {
          border-radius: 4px;
        }
        
        .ant-input-search-button {
          border-radius: 0 4px 4px 0;
        }
      }
    }

    .system-list, .component-list {
      .system-item, .component-item {
        padding: 12px 16px;
        cursor: pointer;
        border-radius: 2px;
        margin-bottom: 12px;
        transition: all 0.3s;
        border: 1px solid #e8e8e8;
        background-color: #fff;
        
        &:hover {
          border-color: #1890ff;
        }
        
        &.active {
          background: #e6f7ff;
          border-color: #1890ff;
        }

        &:last-child {
          margin-bottom: 0;
        }
        
        .system-name, .component-name {
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
          font-size: 16px;
        }
        
        .system-code, .component-code {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1.5;
          margin-bottom: 4px;
        }
        
        .system-desc, .component-desc {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1.5;
        }
      }
    }
  }
}

.selector-drawer {
  :deep(.ant-drawer-header) {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    padding: 16px 24px;
  }
  
  :deep(.ant-drawer-title) {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    font-size: 16px;
  }
  
  :deep(.ant-drawer-close) {
    color: rgba(0, 0, 0, 0.45);
    
    &:hover {
      color: rgba(0, 0, 0, 0.85);
    }
  }
  
  :deep(.ant-tabs) {
    .ant-tabs-nav {
      &::before {
        border-bottom: none;
      }
    }
    
    .ant-tabs-tab {
      &:nth-child(1) {
        .ant-tabs-tab-btn {
          color: #000000;
        }
      }
      
      &:nth-child(2) {
        .ant-tabs-tab-btn {
          color: #ff0000;
        }
      }
    }
    
    .ant-tabs-ink-bar {
      background-color: transparent;
    }
  }
}

.env-switch-modal {
  :deep(.ant-modal-content) {
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.ant-modal-header) {
    margin: 0;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color-split);
    background: linear-gradient(to right, #4b0082, #800080);

    .ant-modal-title {
      color: #fff;
      font-size: 16px;
      line-height: 1.5;
    }
  }

  :deep(.ant-modal-close) {
    color: #fff;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  :deep(.ant-modal-body) {
    padding: 24px;
  }
}

.env-selection {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 0;

  .env-option {
    flex: 1;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.85);
    transition: all 0.3s;

    &:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    &.active {
      background-color: #e6f7ff;
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
  }
}

.env-button {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 4px 8px;
  color: var(--text-color);

  &:hover {
    color: var(--primary-color);
  }

  .anticon {
    font-size: 14px;
  }
}
</style> 