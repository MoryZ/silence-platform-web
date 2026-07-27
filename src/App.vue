<template>
  <a-config-provider :locale="locale">
    <n-config-provider :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
      <n-loading-bar-provider>
        <n-message-provider>
          <n-dialog-provider>
            <n-notification-provider>
              <router-view v-slot="{ Component }">
                <transition name="fade-slide" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </n-notification-provider>
          </n-dialog-provider>
        </n-message-provider>
      </n-loading-bar-provider>
    </n-config-provider>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { useThemeStore } from './stores/theme';
const locale = ref(zhCN);
const themeStore = useThemeStore();

// 暴露 naiveTheme 给 n-config-provider：让 workflow/DAG 模块的 Naive UI 组件
// 跟随项目主色（#1677ff）和暗色模式，与 antd 视觉一致
// 不影响任何交互逻辑（拖拽/缩放/连线/数据流）—— provider 只控样式 token
const naiveTheme = computed(() => themeStore.naiveTheme);
const naiveThemeOverrides = computed(() => themeStore.naiveTheme);
</script>

<style>
#app {
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 页面过渡效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-size: 14px;
  color: var(--text-color);
  background-color: var(--layout-body-background);
}

/* Ant Design Vue 全局样式覆盖 */
.ant-layout {
  background: var(--layout-body-background);
}

.ant-layout-header {
  background: var(--layout-header-background);
  padding: 0 24px;
  height: 64px;
  line-height: 64px;
}

.ant-layout-content {
  margin: 24px;
  min-height: 280px;
}

.ant-layout-footer {
  padding: 24px;
  text-align: center;
  background: var(--component-background);
}

.ant-menu-item .anticon,
.ant-menu-submenu-title .anticon {
  margin-right: 8px;
}
</style> 