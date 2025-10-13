<template>
  <a-drawer
    v-model:open="open"
    title="偏好设置"
    placement="right"
    width="380"
    @close="onClose"
  >
    <div class="settings-container">
      <a-tabs>
        <a-tab-pane key="appearance" tab="外观">
          <div class="settings-section">
            <div class="section-title">主题</div>
            <div class="theme-selector">
              <div
                class="theme-option"
                :class="{ active: currentTheme === 'light' }"
                @click="setTheme('light')"
              >
                <bulb-outlined />
                <span>浅色</span>
              </div>
              <div
                class="theme-option"
                :class="{ active: currentTheme === 'dark' }"
                @click="setTheme('dark')"
              >
                <sync-outlined />
                <span>深色</span>
              </div>
              <div
                class="theme-option"
                :class="{ active: currentTheme === 'system' }"
                @click="setTheme('system')"
              >
                <desktop-outlined />
                <span>跟随系统</span>
              </div>
            </div>

            <div class="setting-item">
              <span>深色侧边栏</span>
              <a-switch v-model:checked="settings.darkSider" />
            </div>

            <div class="setting-item">
              <span>深色顶栏</span>
              <a-switch v-model:checked="settings.darkHeader" />
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="layout" tab="布局">
          <div class="settings-section">
            <div class="section-title">布局</div>
            <div class="layout-options">
              <div
                v-for="(layout, index) in layouts"
                :key="index"
                class="layout-option"
                :class="{ active: settings.layout === layout.value }"
                @click="setLayout(layout.value)"
              >
                <div class="layout-preview" :class="layout.value">
                  <div class="preview-sidebar"></div>
                  <div class="preview-header"></div>
                  <div class="preview-content"></div>
                </div>
                <div class="layout-name">
                  {{ layout.label }}
                  <question-circle-outlined class="help-icon" />
                </div>
              </div>
            </div>

            <div class="section-title">内容</div>
            <div class="content-options">
              <div
                v-for="(content, index) in contentModes"
                :key="index"
                class="content-option"
                :class="{ active: settings.contentMode === content.value }"
                @click="setContentMode(content.value)"
              >
                <div class="content-preview" :class="content.value">
                  <div class="preview-header"></div>
                  <div class="preview-content"></div>
                </div>
                <div class="content-name">{{ content.label }}</div>
              </div>
            </div>

            <div class="section-title">侧边栏</div>
            <div class="setting-item">
              <span>显示侧边栏</span>
              <a-switch v-model:checked="settings.showSider" />
            </div>
            <div class="setting-item">
              <span>折叠菜单</span>
              <a-switch v-model:checked="settings.collapseMenu" />
            </div>
            <div class="setting-item">
              <span>鼠标悬停展开</span>
              <a-switch v-model:checked="settings.menuHoverExpand" />
            </div>
            <div class="setting-item">
              <span>折叠显示菜单名</span>
              <a-switch v-model:checked="settings.showMenuName" />
            </div>
            <div class="setting-item">
              <span>自动激活子菜单</span>
              <a-switch v-model:checked="settings.autoExpandMenu" />
            </div>
            <div class="setting-item">
              <span>宽度</span>
              <div class="width-control">
                <a-button @click="decreaseWidth">-</a-button>
                <a-input-number
                  v-model:value="settings.siderWidth"
                  :min="180"
                  :max="300"
                  :step="4"
                />
                <a-button @click="increaseWidth">+</a-button>
              </div>
            </div>

            <div class="section-title">标签栏</div>
            <div class="setting-item">
              <span>启用标签栏</span>
              <a-switch v-model:checked="settings.enableTabs" />
            </div>
            <div class="setting-item">
              <span>持久化标签页</span>
              <a-switch v-model:checked="settings.persistentTabs" />
            </div>
            <div class="setting-item">
              <span>最大标签数</span>
              <div class="width-control">
                <a-button @click="decreaseMaxTabs">-</a-button>
                <a-input-number
                  v-model:value="settings.maxTabs"
                  :min="0"
                  :max="100"
                  :step="1"
                />
                <a-button @click="increaseMaxTabs">+</a-button>
              </div>
            </div>
            <div class="setting-item">
              <span>启动拖拽排序</span>
              <a-switch v-model:checked="settings.enableTabDrag" />
            </div>
            <div class="setting-item">
              <span>启用纵向滚轮响应</span>
              <a-tooltip title="开启后可以使用鼠标滚轮切换标签页">
                <a-switch v-model:checked="settings.enableTabScroll" />
              </a-tooltip>
            </div>
            <div class="setting-item">
              <span>点击鼠标中键关闭标签页</span>
              <a-switch v-model:checked="settings.closeTabOnMiddleClick" />
            </div>
            <div class="setting-item">
              <span>显示标签栏图标</span>
              <a-switch v-model:checked="settings.showTabIcons" />
            </div>
            <div class="setting-item">
              <span>显示更多按钮</span>
              <a-switch v-model:checked="settings.showMoreButton" />
            </div>
            <div class="setting-item">
              <span>显示最大化按钮</span>
              <a-switch v-model:checked="settings.showMaximizeButton" />
            </div>
            <div class="setting-item">
              <span>标签页风格</span>
              <a-select v-model:value="settings.tabStyle" style="width: 120px">
                <a-select-option value="chrome">谷歌</a-select-option>
                <a-select-option value="firefox">火狐</a-select-option>
                <a-select-option value="safari">Safari</a-select-option>
              </a-select>
            </div>

            <div class="section-title">小部件</div>
            <div class="setting-item">
              <span>启用全局搜索</span>
              <a-switch v-model:checked="settings.enableGlobalSearch" />
            </div>
            <div class="setting-item">
              <span>启用主题切换</span>
              <a-switch v-model:checked="settings.enableThemeSwitch" />
            </div>
            <div class="setting-item">
              <span>启用语言切换</span>
              <a-switch v-model:checked="settings.enableLocaleSwitch" />
            </div>
            <div class="setting-item">
              <span>启用全屏</span>
              <a-switch v-model:checked="settings.enableFullscreen" />
            </div>
            <div class="setting-item">
              <span>启用通知</span>
              <a-switch v-model:checked="settings.enableNotification" />
            </div>
            <div class="setting-item">
              <span>启用锁屏</span>
              <a-switch v-model:checked="settings.enableLockScreen" />
            </div>
            <div class="setting-item">
              <span>启用侧边栏切换</span>
              <a-switch v-model:checked="settings.enableSiderSwitch" />
            </div>
            <div class="setting-item">
              <span>启用刷新</span>
              <a-switch v-model:checked="settings.enableRefresh" />
            </div>
            <div class="setting-item">
              <span>偏好设置位置</span>
              <a-select v-model:value="settings.settingsPosition" style="width: 120px">
                <a-select-option value="auto">自动</a-select-option>
                <a-select-option value="header">顶部</a-select-option>
                <a-select-option value="fixed">固定</a-select-option>
              </a-select>
            </div>

            <div class="section-title">底栏</div>
            <div class="setting-item">
              <span>显示底栏</span>
              <a-switch v-model:checked="settings.showFooter" />
            </div>
            <div class="setting-item">
              <span>固定在底部</span>
              <a-switch v-model:checked="settings.fixedFooter" />
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="shortcut" tab="快捷键">
          <div class="settings-section">
            <div class="section-title">全局</div>
            <div class="setting-item">
              <span>快捷键</span>
              <a-switch v-model:checked="settings.enableShortcuts" />
            </div>
            <div class="setting-item">
              <span>全局搜索</span>
              <div class="shortcut-key">Ctrl K</div>
              <a-switch v-model:checked="settings.enableGlobalSearchShortcut" />
            </div>
            <div class="setting-item">
              <span>退出登录</span>
              <div class="shortcut-key">Alt Q</div>
              <a-switch v-model:checked="settings.enableLogoutShortcut" />
            </div>
            <div class="setting-item">
              <span>锁定屏幕</span>
              <div class="shortcut-key">Alt L</div>
              <a-switch v-model:checked="settings.enableLockScreenShortcut" />
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="general" tab="通用">
          <div class="settings-section">
            <div class="section-title">通用</div>
            <div class="setting-item">
              <span>语言</span>
              <a-select v-model:value="settings.language" style="width: 120px">
                <a-select-option value="zh_CN">简体中文</a-select-option>
                <a-select-option value="en_US">English</a-select-option>
              </a-select>
            </div>
            <div class="setting-item">
              <span>动态标题</span>
              <a-switch v-model:checked="settings.dynamicTitle" />
            </div>
            <div class="setting-item">
              <span>水印</span>
              <a-switch v-model:checked="settings.watermark" />
            </div>
            <div class="setting-item">
              <span>定时检查更新</span>
              <a-switch v-model:checked="settings.autoCheckUpdate" />
            </div>

            <div class="section-title">动画</div>
            <div class="setting-item">
              <span>页面切换进度条</span>
              <a-switch v-model:checked="settings.pageProgressBar" />
            </div>
            <div class="setting-item">
              <span>页面切换 Loading</span>
              <a-switch v-model:checked="settings.pageLoading" />
            </div>
            <div class="setting-item">
              <span>页面切换动画</span>
              <a-switch v-model:checked="settings.pageTransition" />
            </div>

            <div class="animation-mode-selector">
              <div
                v-for="mode in animationModes"
                :key="mode.value"
                class="animation-mode-option"
                :class="{ active: settings.animationMode === mode.value }"
                @click="setAnimationMode(mode.value)"
              >
                <div class="mode-preview"></div>
              </div>
            </div>

            <div class="setting-item">
              <span>色弱模式</span>
              <a-switch v-model:checked="settings.colorWeak" />
            </div>
            <div class="setting-item">
              <span>灰色模式</span>
              <a-switch v-model:checked="settings.grayMode" />
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <a-button type="primary" block @click="saveSettings">复制配置设置</a-button>
        <div class="footer-links">
          <a-button type="link" @click="clearAndLogout">清空缓存 & 退出登录</a-button>
        </div>
      </div>
    </template>
  </a-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';
import {
  BulbOutlined,
  SyncOutlined,
  DesktopOutlined,
  CheckOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useAppStore } from '../stores/app';

const open = defineModel<boolean>('open');
const appStore = useAppStore();

// 使用计算属性连接到 store
const currentTheme = computed({
  get: () => appStore.theme,
  set: (value) => appStore.setTheme(value)
});

const layouts = [
  { label: '垂直', value: 'vertical', tooltip: '垂直布局' },
  { label: '双列菜单', value: 'double', tooltip: '双列菜单布局' },
  { label: '水平', value: 'horizontal', tooltip: '水平布局' },
  { label: '侧边导航', value: 'side', tooltip: '侧边导航布局' },
  { label: '混合垂直', value: 'mixed-vertical', tooltip: '混合垂直布局' },
  { label: '混合双列', value: 'mixed-double', tooltip: '混合双列布局' },
  { label: '内容全屏', value: 'fullscreen', tooltip: '内容全屏布局' },
];

const contentModes = [
  { label: '流式', value: 'fluid' },
  { label: '定宽', value: 'fixed' },
];

const settings = reactive({
  darkSider: false,
  darkHeader: false,
  primaryColor: '#1890ff',
  borderRadius: 0.5,
  darkBlur: false,
  blurRadius: 10,
  colorWeak: false,
  grayMode: false,
  layout: 'double',
  contentMode: 'fluid',
  showSider: true,
  collapseMenu: false,
  menuHoverExpand: true,
  showMenuName: false,
  autoExpandMenu: false,
  siderWidth: 224,
  showHeader: true,
  headerMode: 'fixed',
  menuPosition: 'left',
  menuStyle: 'rounded',
  menuSplit: false,
  menuAccordion: true,
  showBreadcrumb: true,
  hideSingleBreadcrumb: false,
  showBreadcrumbIcon: true,
  showHomeButton: false,
  breadcrumbStyle: 'normal',
  enableTabs: true,
  persistentTabs: true,
  maxTabs: 0,
  enableTabDrag: true,
  enableTabScroll: true,
  closeTabOnMiddleClick: false,
  showTabIcons: true,
  showMoreButton: true,
  showMaximizeButton: true,
  tabStyle: 'chrome',
  enableGlobalSearch: true,
  enableThemeSwitch: true,
  enableLocaleSwitch: true,
  enableFullscreen: true,
  enableNotification: true,
  enableLockScreen: true,
  enableSiderSwitch: true,
  enableRefresh: true,
  settingsPosition: 'auto',
  showFooter: true,
  fixedFooter: false,
  enableShortcuts: true,
  enableGlobalSearchShortcut: true,
  enableLogoutShortcut: true,
  enableLockScreenShortcut: true,
  language: 'zh_CN',
  dynamicTitle: false,
  watermark: false,
  autoCheckUpdate: false,
  pageProgressBar: true,
  pageLoading: true,
  pageTransition: true,
  animationMode: 'default',
});

const themeColors = [
  { name: '默认蓝', value: '#1890ff' },
  { name: '紫罗兰', value: '#722ed1' },
  { name: '樱花粉', value: '#eb2f96' },
  { name: '柠檬黄', value: '#faad14' },
  { name: '天蓝色', value: '#13c2c2' },
  { name: '极客蓝', value: '#2f54eb' },
  { name: '酱红色', value: '#f5222d' },
  { name: '深绿色', value: '#52c41a' },
  { name: '深色灰', value: '#666666' },
  { name: '石板灰', value: '#8c8c8c' },
  { name: '中灰色', value: '#bfbfbf' },
  { name: '自定义', value: 'custom' },
];

const animationModes = [
  { value: 'default', label: '默认' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'slide', label: '滑动' },
  { value: 'zoom', label: '缩放' },
];

const setTheme = (theme: string) => {
  currentTheme.value = theme;
};

const setLayout = (layout: string) => {
  settings.layout = layout;
  
  // 应用布局
  const body = document.body;
  // 移除所有布局相关的类
  layouts.forEach(l => body.classList.remove(l.value));
  // 添加新的布局类
  body.classList.add(layout);
  
  // 保存布局设置
  saveToStorage();
  
  // 触发布局变化事件
  window.dispatchEvent(new CustomEvent('layoutChange', { detail: layout }));
};

const setContentMode = (mode: string) => {
  settings.contentMode = mode;
};

const decreaseWidth = () => {
  if (settings.siderWidth > 180) {
    settings.siderWidth -= 4;
  }
};

const increaseWidth = () => {
  if (settings.siderWidth < 300) {
    settings.siderWidth += 4;
  }
};

const decreaseMaxTabs = () => {
  if (settings.maxTabs > 0) {
    settings.maxTabs--;
  }
};

const increaseMaxTabs = () => {
  if (settings.maxTabs < 100) {
    settings.maxTabs++;
  }
};

const onClose = () => {
  open.value = false;
};

const loadSettings = () => {
  const savedSettings = localStorage.getItem('app-settings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    Object.assign(settings, parsed);
  }
};

const saveToStorage = () => {
  localStorage.setItem('app-settings', JSON.stringify(settings));
};

const applySettings = () => {
  // 应用布局设置
  const body = document.body;
  body.className = [
    settings.layout,
    settings.contentMode,
    settings.colorWeak ? 'color-weak' : '',
    settings.grayMode ? 'gray-mode' : '',
    settings.darkSider ? 'dark-sider' : '',
    settings.darkHeader ? 'dark-header' : '',
    currentTheme.value === 'dark' ? 'dark-theme' : 'light-theme'
  ].filter(Boolean).join(' ');
  
  // 应用语言设置
  appStore.setLanguage(settings.language);
  
  // 应用页面过渡动画
  document.documentElement.style.setProperty('--page-transition', settings.pageTransition ? 'all 0.3s' : 'none');
  
  // 应用水印
  toggleWatermark(settings.watermark);
  
  // 应用动态标题
  setupDynamicTitle(settings.dynamicTitle);
  
  // 应用页面进度条
  toggleProgressBar(settings.pageProgressBar);
  
  // 应用其他设置
  applyOtherSettings();
};

// 辅助函数
const toggleWatermark = (show: boolean) => {
  const existingWatermark = document.querySelector('.watermark');
  if (show && !existingWatermark) {
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.6;
    `;
    document.body.appendChild(watermark);
  } else if (!show && existingWatermark) {
    existingWatermark.remove();
  }
};

const setupDynamicTitle = (enable: boolean) => {
  const originalTitle = document.title;
  if (enable) {
    window.addEventListener('blur', () => {
      document.title = '😊 快回来~';
    });
    window.addEventListener('focus', () => {
      document.title = originalTitle;
    });
  } else {
    window.removeEventListener('blur', () => {});
    window.removeEventListener('focus', () => {});
    document.title = originalTitle;
  }
};

const toggleProgressBar = (show: boolean) => {
  const existingBar = document.querySelector('.page-progress-bar');
  if (show && !existingBar) {
    const bar = document.createElement('div');
    bar.className = 'page-progress-bar';
    document.body.appendChild(bar);
  } else if (!show && existingBar) {
    existingBar.remove();
  }
};

const applyOtherSettings = () => {
  // 应用侧边栏设置
  const sider = document.querySelector('.ant-layout-sider');
  if (sider) {
    (sider as HTMLElement).style.width = `${settings.siderWidth}px`;
  }
  
  // 应用标签页设置
  const tabs = document.querySelector('.ant-tabs');
  if (tabs) {
    tabs.className = `ant-tabs ant-tabs-${settings.tabStyle}`;
  }
};

// 监听设置变化
watch(settings, (newSettings) => {
  saveToStorage();
  applySettings();
}, { deep: true });

// 监听主题变化
watch(currentTheme, (newTheme) => {
  setTheme(newTheme);
});

// 组件挂载时初始化
onMounted(() => {
  loadSettings();
  appStore.initialize();
  applySettings();
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    if (currentTheme.value === 'system') {
      appStore.setTheme('system');
    }
  };
  mediaQuery.addEventListener('change', handleChange);
  
  // 监听打开设置抽屉的自定义事件
  const handleOpenSettings = () => {
    open.value = true;
  };
  window.addEventListener('open-settings-drawer', handleOpenSettings);
  
  // 组件卸载时清理
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleChange);
    window.removeEventListener('open-settings-drawer', handleOpenSettings);
  });
});

const setAnimationMode = (mode: string) => {
  settings.animationMode = mode;
};

const saveSettings = () => {
  try {
    const settingsStr = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(settingsStr);
    message.success('配置已复制到剪贴板');
  } catch (error) {
    message.error('复制配置失败');
  }
  open.value = false;
};

const clearAndLogout = async () => {
  try {
    // 清空本地缓存
    localStorage.removeItem('app-settings');
    Object.assign(settings, {
      layout: 'double',
      contentMode: 'fluid',
      language: 'zh_CN',
    });
    
    // 调用退出登录 API
    const { useUserStore } = await import('@/stores/user');
    const userStore = useUserStore();
    await userStore.handleLogout();
    
    message.success('已清空缓存并退出登录');
  } catch (error) {
    console.error('退出登录失败:', error);
    message.error('退出登录失败');
  }
};
</script>

<style lang="scss" scoped>
.settings-container {
  height: calc(100% - 64px);
  overflow-y: auto;
  padding: 0 16px;
  background: var(--bg-color);
  color: var(--text-color);
}

.settings-section {
  margin-bottom: 24px;

  .section-title {
    color: var(--text-color);
    font-size: 14px;
    margin: 24px 0 16px;
    font-weight: 600;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 14px;
      background: #1890ff;
      border-radius: 2px;
    }

    &:first-child {
      margin-top: 0;
    }
  }

  & + .settings-section {
    margin-top: 32px;
  }
}

.theme-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;

  .theme-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    background: var(--bg-color);
    color: var(--text-color);

    &:hover {
      border-color: #1890ff;
    }

    &.active {
      border-color: #1890ff;
      background-color: #1890ff1a;
      color: #1890ff;
    }

    .anticon {
      font-size: 20px;
      margin-bottom: 4px;
    }

    span {
      font-size: 12px;
    }
  }
}

.theme-colors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;

  .color-block {
    aspect-ratio: 1;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    border: 1px solid transparent;

    &:hover {
      transform: scale(1.05);
    }

    &.active {
      border-color: #1890ff;
      .anticon {
        color: #fff;
        font-size: 16px;
      }
    }
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: var(--text-color);
  padding: 8px 0;

  span {
    font-weight: 500;
  }

  .shortcut-key {
    background: var(--border-color);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-color);
    margin-right: 12px;
  }

  &:has(.shortcut-key) {
    display: grid;
    grid-template-columns: auto auto auto;
    gap: 8px;
  }
}

.border-radius-slider {
  padding: 8px 0;
}

.drawer-footer {
  background: var(--bg-color);
  padding: 16px;
  border-top: 1px solid var(--border-color);

  .footer-links {
    margin-top: 12px;
    text-align: center;
  }
}

:deep(.ant-drawer-header) {
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);

  .ant-drawer-title {
    color: var(--text-color);
  }

  .ant-drawer-close {
    color: var(--text-color);
    opacity: 0.45;

    &:hover {
      opacity: 0.85;
    }
  }
}

:deep(.ant-drawer-body) {
  background: var(--bg-color);
  padding: 0;
}

:deep(.ant-drawer-footer) {
  background: var(--bg-color);
  border-top: 1px solid var(--border-color);
  padding: 16px;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 8px;
  padding: 0 16px;
  
  .ant-tabs-nav-list {
    width: 100%;
    display: flex;
    justify-content: space-between;
    
    .ant-tabs-tab {
      margin: 0;
      padding: 12px 0;
      font-size: 14px;
      color: var(--text-color) !important;
      opacity: 0.65;
      
      &.ant-tabs-tab-active {
        opacity: 1;
      }
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

:deep(.ant-tabs-ink-bar) {
  background: #1890ff;
  height: 2px;
}

:deep(.ant-switch) {
  background-color: rgba(0, 0, 0, 0.25);

  &.ant-switch-checked {
    background-color: #1890ff;
  }
}

.layout-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  .layout-option {
    cursor: pointer;
    text-align: center;

    &.active {
      .layout-preview {
        border: 2px solid #1890ff;
      }
    }

    .layout-preview {
      height: 80px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
      background: var(--bg-color);
      overflow: hidden;

      .preview-sidebar {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20%;
        background: #00b96b;
      }

      .preview-header {
        position: absolute;
        left: 20%;
        right: 0;
        top: 0;
        height: 20%;
        background: #00b96b;
      }

      .preview-content {
        position: absolute;
        left: 20%;
        right: 0;
        top: 20%;
        bottom: 0;
        background: #f0f0f0;
      }
    }

    .layout-name {
      font-size: 12px;
      color: var(--text-color);
      opacity: 0.65;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .help-icon {
        opacity: 0.45;
        cursor: help;
      }
    }
  }
}

.content-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  .content-option {
    cursor: pointer;
    text-align: center;

    &.active {
      .content-preview {
        border: 2px solid #1890ff;
      }
    }

    .content-preview {
      height: 80px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
      background: var(--bg-color);
      overflow: hidden;

      .preview-header {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: 20%;
        background: #00b96b;
      }

      .preview-content {
        position: absolute;
        left: 10%;
        right: 10%;
        top: 30%;
        bottom: 10%;
        background: #f0f0f0;
      }

      &.fluid .preview-content {
        left: 5%;
        right: 5%;
      }
    }

    .content-name {
      font-size: 12px;
      color: var(--text-color);
      opacity: 0.65;
    }
  }
}

.width-control {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.ant-input-number) {
    width: 80px;
  }
}

:deep(.ant-radio-group) {
  .ant-radio-button-wrapper {
    padding: 0 12px;
    
    &-checked {
      background: #00b96b;
      border-color: #00b96b;
      
      &:hover {
        background: #00b96b;
        border-color: #00b96b;
      }
    }
  }
}

:deep(.ant-select) {
  .ant-select-selector {
    border-radius: 4px;
  }
}

.animation-mode-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;

  .animation-mode-option {
    cursor: pointer;
    text-align: center;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    transition: all 0.3s;
    background: var(--bg-color);
    color: var(--text-color);

    &:hover {
      border-color: #1890ff;
    }

    &.active {
      border-color: #1890ff;
      background-color: #1890ff1a;
    }

    .mode-preview {
      width: 100%;
      height: 80px;
      border-radius: 4px;
      margin-bottom: 8px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
  }
}

.watermark {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.05) 0px,
    rgba(0, 0, 0, 0.05) 2px,
    transparent 2px,
    transparent 4px
  );
}

:root {
  --page-transition: all 0.3s;
}

.page-enter-active,
.page-leave-active {
  transition: var(--page-transition);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

// 添加深色主题样式
:root[data-theme='dark'] {
  --bg-color: #141414;
  --text-color: rgba(255, 255, 255, 0.85);
  --border-color: #303030;
  --component-background: #1f1f1f;
}

:root[data-theme='light'] {
  --bg-color: #ffffff;
  --text-color: rgba(0, 0, 0, 0.85);
  --border-color: #f0f0f0;
  --component-background: #ffffff;
}

// 深色侧边栏样式
.dark-sider {
  .ant-layout-sider {
    background: #001529;
    color: #ffffff;
  }
}

// 深色顶栏样式
.dark-header {
  .ant-layout-header {
    background: #001529;
    color: #ffffff;
  }
}

// 页面进度条样式
.page-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: #1890ff;
  transition: width 0.2s;
  z-index: 9999;
}

// 水印样式优化
.watermark {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.05) 0px,
    rgba(0, 0, 0, 0.05) 2px,
    transparent 2px,
    transparent 4px
  );
  opacity: 0.6;
}

// 色弱模式
.color-weak {
  filter: grayscale(0.95);
}

// 灰色模式
.gray-mode {
  filter: grayscale(1);
}
</style> 