<template>
  <a-popover
    v-model:open="visible"
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
        <a-spin :spinning="loading">
          <a-tabs v-model:activeKey="activeTab">
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
          <a-button type="link" class="clear-button" @click="handleClearAllNotifications">
            <delete-outlined />
            清空
          </a-button>
          <a-button type="primary" class="view-all-btn" @click="viewAllNotifications">
            查看所有消息
          </a-button>
        </div>
      </div>
    </template>
    <a-tooltip title="通知">
      <a-badge :count="unreadCount">
        <bell-outlined class="action-icon" />
      </a-badge>
    </a-tooltip>
  </a-popover>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { BellOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { getNoticeByStatus, markAllNoticeAsRead, clearNotice, type Notice } from '@/api/notice'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const visible = ref(false)
const loading = ref(false)
const notifications = ref<Notice[]>([])
const unreadCount = ref(0)
const activeTab = ref('0')

const fetchNotifications = async (status?: number) => {
  loading.value = true
  try {
    const data = await getNoticeByStatus(status ?? Number(activeTab.value))
    notifications.value = data || []
    if (status === 0 || (status === undefined && activeTab.value === '0')) {
      unreadCount.value = notifications.value.length
    }
  } finally {
    loading.value = false
  }
}
const handleMarkAllAsRead = async () => {
  await markAllNoticeAsRead()
  message.success('全部标记已读成功')
  await fetchNotifications(Number(activeTab.value))
}
const handleClearAllNotifications = async () => {
  await clearNotice()
  message.success('清空通知成功')
  notifications.value = []
  unreadCount.value = 0
}
const viewAllNotifications = () => {
  router.replace('/system/notice')
  visible.value = false
}
const viewNotificationDetail = (notice: Notice) => {
  // 可扩展为弹窗详情
  visible.value = false
}

watch(activeTab, () => fetchNotifications())
onMounted(() => fetchNotifications(0))
</script>

<style scoped>
.notification-popup {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 0;
  min-width: 360px;
  max-width: 420px;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px 8px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}
.notification-header .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.notification-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 0 24px;
}
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:last-child {
  border-bottom: none;
}
.notification-item:hover {
  background: #f5faff;
}
.avatar {
  margin-right: 14px;
}
.content {
  flex: 1;
}
.title {
  font-weight: 500;
  color: #222;
  margin-bottom: 2px;
}
.description {
  color: #888;
  font-size: 13px;
  margin-bottom: 2px;
}
.time {
  color: #bbb;
  font-size: 12px;
}
.status {
  margin-left: 8px;
  display: flex;
  align-items: center;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1677ff;
}
.empty-placeholder {
  padding: 32px 0;
  text-align: center;
  color: #bbb;
  font-size: 14px;
}
.notification-footer {
  padding: 16px 24px 20px 24px;
  border-top: 1px solid #f5f5f5;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.clear-button {
  color: #888;
  font-size: 14px;
  padding: 0;
  background: none;
  border: none;
  box-shadow: none;
}
.clear-button:hover {
  color: #ff4d4f;
}
.view-all-btn {
  min-width: 120px;
  height: 38px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(22,119,255,0.08);
}
</style>