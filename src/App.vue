<template>
  <a-config-provider :locale="locale">
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { useThemeStore } from './stores/theme';
const locale = ref(zhCN);
const themeStore = useThemeStore();

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
  color: rgba(0, 0, 0, 0.85);
  background-color: #f0f2f5;
}

/* Ant Design Vue 全局样式覆盖 */
.ant-layout {
  background: #f0f2f5;
}

.ant-layout-header {
  background: #fff;
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
  background: #fff;
}

.ant-menu-item .anticon,
.ant-menu-submenu-title .anticon {
  margin-right: 8px;
}
</style> 