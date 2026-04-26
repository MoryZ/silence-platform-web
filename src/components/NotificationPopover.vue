<template>
  <a-popover
    v-model:open="visible"
    trigger="click"
    placement="bottomRight"
    :overlay-style="{ width: '380px', padding: 0 }"
    overlay-class-name="notification-popover-overlay"
  >
    <template #content>
      <div class="notification-popup">
        <div class="notification-header">
          <div class="header-main">
            <div class="header-title-row">
              <span class="header-title">通知</span>
              <a-badge :count="unreadCount" />
            </div>
            <div class="header-subtitle">消息中心</div>
          </div>
          <a-button type="link" class="mark-read-btn" @click="handleMarkAllAsRead">全部已读</a-button>
        </div>
        <a-spin :spinning="loading">
          <a-tabs v-model:activeKey="activeTab" class="notification-tabs">
            <a-tab-pane key="0" tab="未读消息">
              <div class="notification-list">
                <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="notification-item"
                  @click="viewNotificationDetail(item)"
                >
                  <div class="avatar">
                    <a-avatar :style="{ background: '#1677ff' }">
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
                  <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE" description="暂无未读消息" />
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
                  <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE" description="暂无已读消息" />
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
import { Empty } from 'ant-design-vue'
import { getNoticeByStatus, markAllNoticeAsRead, clearNotice } from '@/api/auth/notice'
import type { Notice } from '@/types/auth'
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
  position: relative;
  overflow: hidden;
  background: #fff;
  padding: 0;
  min-width: 380px;
  max-width: 380px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 6px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
}

.header-main {
  min-width: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
  color: #1f1f1f;
}

.header-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: #8c8c8c;
}

.mark-read-btn {
  padding: 0;
  height: auto;
  font-size: 13px;
  color: #1677ff;
}

.notification-tabs {
  padding: 0 12px;
}

.notification-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px 2px 6px 2px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-item:hover {
  border-color: #d6e4ff;
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.08);
  transform: translateY(-1px);
}

.avatar {
  margin-right: 12px;
}

.content {
  flex: 1;
  min-width: 0;
}

.title {
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
  line-height: 20px;
}

.description {
  color: #595959;
  font-size: 13px;
  line-height: 18px;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.time {
  color: #8c8c8c;
  font-size: 12px;
}

.status {
  margin-left: 6px;
  display: flex;
  align-items: center;
  padding-top: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1677ff;
  box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
}

.empty-placeholder {
  padding: 32px 0 24px 0;
}

.notification-footer {
  padding: 12px 16px 14px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-button {
  color: #8c8c8c;
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
  min-width: 132px;
  height: 36px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.18);
}
</style>

<style>
/* 全局样式：覆盖 a-popover 的默认样式 */
.notification-popover-overlay .ant-popover-inner {
  border-radius: 16px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.14);
  padding: 0;
}
.notification-popover-overlay .ant-popover-inner-content {
  padding: 0;
}

.notification-popover-overlay .ant-tabs-nav {
  margin: 0;
  padding: 0 2px;
}

.notification-popover-overlay .ant-tabs-tab {
  padding: 12px 2px 10px 2px;
  font-weight: 500;
}

.notification-popover-overlay .ant-tabs-tab + .ant-tabs-tab {
  margin-left: 20px;
}
</style>