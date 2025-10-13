<template>
    <a-dropdown>
      <div class="user-dropdown">
        <a-avatar :src="getAvatarUrl(user.avatar)" size="large" />
        <span class="username">{{ user.name }}</span>
      </div>
      <template #overlay>
        <a-menu>
          <a-menu-item key="profile" @click="handlePersonalCenter">
            <user-outlined />
            <span>个人中心</span>
          </a-menu-item>
          <a-menu-item key="settings" @click="handlePersonalSettings">
            <setting-outlined />
            <span>个人设置</span>
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="logout" @click="handleLogout">
            <logout-outlined />
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>

    <!-- 个人中心弹窗 -->
    <a-modal
      v-model:open="showPersonalCenter"
      title="个人中心"
      :footer="null"
      width="600px"
    >
      <div class="personal-center">
        <div class="user-info-header">
          <a-avatar :src="getAvatarUrl(user.avatar)" size="80" />
          <div class="user-details">
            <h3>{{ user.name }}</h3>
            <p class="user-role">{{ userInfo?.roles?.join(', ') || '普通用户' }}</p>
          </div>
        </div>
        
        <a-divider />
        
        <div class="user-info-content">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="用户名">
              {{ userInfo?.username || 'N/A' }}
            </a-descriptions-item>
            <a-descriptions-item label="昵称">
              {{ userInfo?.nickname || 'N/A' }}
            </a-descriptions-item>
            <a-descriptions-item label="邮箱">
              {{ userInfo?.email || 'N/A' }}
            </a-descriptions-item>
            <a-descriptions-item label="电话">
              {{ userInfo?.phone || 'N/A' }}
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="userInfo?.status ? 'success' : 'error'">
                {{ userInfo?.status ? '启用' : '禁用' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(userInfo?.createdDate) }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
    </a-modal>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Modal } from 'ant-design-vue'
  import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons-vue'
  import workAvatar from '@/assets/images/work.png'
  import { useUserStore } from '@/stores/user'
  import dayjs from 'dayjs'
  import utc from 'dayjs/plugin/utc'
  import timezone from 'dayjs/plugin/timezone'
  
  // 扩展 dayjs 插件
  dayjs.extend(utc)
  dayjs.extend(timezone)
  
  const userStore = useUserStore()
  
  const user = ref({
    name: 'Admin',
    avatar: workAvatar
  })
  
  // 个人中心弹窗状态
  const showPersonalCenter = ref(false)
  
  // 获取用户信息
  const userInfo = computed(() => userStore.getUserInfo())
  
  // 监听用户信息变化，更新显示信息
  watch(userInfo, (newUserInfo) => {
    if (newUserInfo) {
      user.value.name = newUserInfo.nickname || newUserInfo.username || 'Admin'
      user.value.avatar = newUserInfo.avatar || workAvatar
    }
  }, { immediate: true })
  
  // 头像URL处理函数
  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return workAvatar
    if (avatarPath.startsWith('http')) return avatarPath
    if (avatarPath.startsWith('/')) return avatarPath
    return '/' + avatarPath
  }
  
  // 日期格式化函数
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return dayjs(dateString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
    } catch (error) {
      console.warn('日期格式化失败:', dateString, error)
      return dateString
    }
  }
  
  // 个人中心处理函数
  function handlePersonalCenter() {
    showPersonalCenter.value = true
  }
  
  // 个人设置处理函数
  function handlePersonalSettings() {
    // 触发设置抽屉打开
    const event = new CustomEvent('open-settings-drawer')
    window.dispatchEvent(event)
  }
  
  function handleLogout() {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await userStore.handleLogout()
        } catch (error) {
          console.error('退出登录失败:', error)
        }
      }
    })
  }
  </script>
  
  <style scoped>
  .user-dropdown { 
    display: flex; 
    align-items: center; 
    cursor: pointer; 
    padding: 8px 12px;
    border-radius: 6px;
    transition: background-color 0.3s;
  }
  
  .user-dropdown:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  .username { 
    margin-left: 8px; 
    font-weight: 500;
  }
  
  .personal-center {
    .user-info-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      
      .user-details {
        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #262626;
        }
        
        .user-role {
          margin: 0;
          color: #8c8c8c;
          font-size: 14px;
        }
      }
    }
    
    .user-info-content {
      .ant-descriptions-item-label {
        font-weight: 500;
        color: #595959;
      }
      
      .ant-descriptions-item-content {
        color: #262626;
      }
    }
  }
  </style>