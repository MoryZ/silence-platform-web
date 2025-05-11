<template>
    <a-dropdown>
      <div class="user-dropdown">
        <a-avatar :src="user.avatar" />
        <span class="username">{{ user.name }}</span>
      </div>
      <template #overlay>
        <a-menu>
          <a-menu-item key="profile">
            <user-outlined />
            <span>个人中心</span>
          </a-menu-item>
          <a-menu-item key="settings">
            <setting-outlined />
            <span>个人设置</span>
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="logout" @click="logout">
            <logout-outlined />
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons-vue'
  
  const user = ref({
    name: 'Admin',
    avatar: ''
  })
  
  function logout() {
    // TODO: 退出登录逻辑
    alert('退出登录')
  }
  </script>
  
  <style scoped>
  .user-dropdown { display: flex; align-items: center; cursor: pointer; }
  .username { margin-left: 8px; }
  </style>