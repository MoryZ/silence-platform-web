<template>
  <a-layout-header class="layout-header">
    <div class="header-left">
      <div class="logo-group">
        <a-button
          type="text"
          class="all-products-btn"
          @mouseenter="$emit('showAllProducts')"
          :icon="h(AppstoreOutlined)"
        />
        <img src="/logo.svg" class="logo" />
        <span class="system-title">Silence Platform</span>
      </div>
    </div>
    <div class="header-right">
      <EnvSelector />
      <SystemComponentSelector />
      <SearchHistoryPopover />
      <NotificationPopover />
      <UserDropdown />
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { h } from 'vue'
import EnvSelector from '../components/EnvSelector.vue'
import SystemComponentSelector from '../components/SystemComponentSelector.vue'
import SearchHistoryPopover from '../components/SearchHistoryPopover.vue'
import NotificationPopover from '../components/NotificationPopover.vue'
import UserDropdown from '../components/UserDropdown.vue'
import { AppstoreOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ collapsed: boolean }>()
const emit = defineEmits(['toggleCollapse', 'showAllProducts'])
</script>

<style scoped>
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px #f0f1f2;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 40px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
  min-width: 0;
}
.logo-group {
  display: flex;
  align-items: center;
  gap: 22px;
}
.logo { width: 32px; height: 32px; }
.system-title {
  color: #222;
  font-size: 18px;
  font-weight: 600;
  margin-left: 2px;
  white-space: nowrap;
}
.all-products-btn {
  color: #222;
  font-size: 18px;
  background: none;
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.all-products-btn:hover {
  color: #1890ff;
}
.all-products-btn :deep(.anticon) {
  font-size: 20px;
  margin-right: 4px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.header-right .user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-right .username {
  margin-left: 6px;
  color: #222;
  font-weight: 500;
}
.trigger {
  font-size: 20px;
  cursor: pointer;
  margin-right: 16px;
  color: #001529;
  transition: color 0.3s;
}
.trigger:hover {
  color: #1890ff;
}
.breadcrumb {
  margin-left: 24px;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}
@media (max-width: 1200px) {
  .breadcrumb {
    max-width: 220px;
  }
  .header-left {
    gap: 18px;
  }
  .layout-header {
    padding: 0 16px;
  }
  .header-right {
    gap: 12px;
  }
}
</style>