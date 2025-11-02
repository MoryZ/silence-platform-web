<template>
  <div class="account-settings">
    <a-row :gutter="24">
      <!-- 左侧菜单 -->
      <a-col :span="6">
        <a-card class="settings-menu-card">
          <a-menu
            v-model:selectedKeys="selectedKeys"
            mode="inline"
            :style="{ border: 'none' }"
          >
            <a-menu-item key="basic">
              <user-outlined />
              <span>基本设置</span>
            </a-menu-item>
            <a-menu-item key="security">
              <safety-certificate-outlined />
              <span>安全设置</span>
            </a-menu-item>
            <a-menu-item key="binding">
              <link-outlined />
              <span>账号绑定</span>
            </a-menu-item>
            <a-menu-item key="notification">
              <bell-outlined />
              <span>新消息通知</span>
            </a-menu-item>
          </a-menu>
        </a-card>
      </a-col>

      <!-- 右侧内容 -->
      <a-col :span="18">
        <a-card class="settings-content-card">
          <!-- 基本设置 -->
          <div v-if="selectedKeys.includes('basic')" class="settings-section">
            <h3 class="section-title">基本设置</h3>
            <a-form
              :model="basicForm"
              :label-col="{ span: 6 }"
              :wrapper-col="{ span: 18 }"
              @finish="onBasicSubmit"
            >
              <a-form-item label="昵称" name="nickname">
                <a-input v-model:value="basicForm.nickname" placeholder="请输入昵称" />
              </a-form-item>
              <a-form-item label="个人简介" name="bio">
                <a-textarea
                  v-model:value="basicForm.bio"
                  placeholder="请输入个人简介"
                  :rows="4"
                />
              </a-form-item>
              <a-form-item label="邮箱" name="email">
                <a-input v-model:value="basicForm.email" placeholder="请输入邮箱" />
              </a-form-item>
              <a-form-item label="手机号" name="phone">
                <a-input v-model:value="basicForm.phone" placeholder="请输入手机号" />
              </a-form-item>
              <a-form-item label="地址" name="address">
                <a-input v-model:value="basicForm.address" placeholder="请输入地址" />
              </a-form-item>
              <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
                <a-button type="primary" html-type="submit" :loading="basicLoading">
                  更新基本信息
                </a-button>
              </a-form-item>
            </a-form>
          </div>

          <!-- 安全设置 -->
          <div v-if="selectedKeys.includes('security')" class="settings-section">
            <h3 class="section-title">安全设置</h3>
            <a-form
              :model="securityForm"
              :label-col="{ span: 6 }"
              :wrapper-col="{ span: 18 }"
              @finish="onSecuritySubmit"
            >
              <a-form-item label="当前密码" name="currentPassword">
                <a-input-password
                  v-model:value="securityForm.currentPassword"
                  placeholder="请输入当前密码"
                />
              </a-form-item>
              <a-form-item label="新密码" name="newPassword">
                <a-input-password
                  v-model:value="securityForm.newPassword"
                  placeholder="请输入新密码"
                />
              </a-form-item>
              <a-form-item label="确认新密码" name="confirmPassword">
                <a-input-password
                  v-model:value="securityForm.confirmPassword"
                  placeholder="请再次输入新密码"
                />
              </a-form-item>
              <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
                <a-button type="primary" html-type="submit" :loading="securityLoading">
                  修改密码
                </a-button>
              </a-form-item>
            </a-form>
          </div>

          <!-- 账号绑定 -->
          <div v-if="selectedKeys.includes('binding')" class="settings-section">
            <h3 class="section-title">账号绑定</h3>
            <div class="binding-list">
              <div class="binding-item">
                <div class="binding-info">
                  <wechat-outlined class="binding-icon" />
                  <div class="binding-details">
                    <div class="binding-title">微信</div>
                    <div class="binding-desc">当前未绑定微信账号</div>
                  </div>
                </div>
                <a-button type="link">绑定</a-button>
              </div>
              <div class="binding-item">
                <div class="binding-info">
                  <qq-outlined class="binding-icon" />
                  <div class="binding-details">
                    <div class="binding-title">QQ</div>
                    <div class="binding-desc">当前未绑定QQ账号</div>
                  </div>
                </div>
                <a-button type="link">绑定</a-button>
              </div>
              <div class="binding-item">
                <div class="binding-info">
                  <github-outlined class="binding-icon" />
                  <div class="binding-details">
                    <div class="binding-title">GitHub</div>
                    <div class="binding-desc">当前未绑定GitHub账号</div>
                  </div>
                </div>
                <a-button type="link">绑定</a-button>
              </div>
            </div>
          </div>

          <!-- 新消息通知 -->
          <div v-if="selectedKeys.includes('notification')" class="settings-section">
            <h3 class="section-title">新消息通知</h3>
            <div class="notification-list">
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">用户消息</div>
                  <div class="notification-desc">其他用户的消息将以站内信的形式通知</div>
                </div>
                <a-switch v-model:checked="notificationSettings.userMessage" />
              </div>
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">系统消息</div>
                  <div class="notification-desc">系统消息将以站内信的形式通知</div>
                </div>
                <a-switch v-model:checked="notificationSettings.systemMessage" />
              </div>
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">待办任务</div>
                  <div class="notification-desc">待办任务将以站内信的形式通知</div>
                </div>
                <a-switch v-model:checked="notificationSettings.todoTask" />
              </div>
            </div>
            <div class="notification-actions">
              <a-button type="primary" @click="saveNotificationSettings">
                保存设置
              </a-button>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  BellOutlined,
  WechatOutlined,
  QqOutlined,
  GithubOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 选中的菜单项
const selectedKeys = ref(['basic'])

// 基本设置表单
const basicForm = reactive({
  nickname: '',
  bio: '',
  email: '',
  phone: '',
  address: ''
})

const basicLoading = ref(false)

// 安全设置表单
const securityForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const securityLoading = ref(false)

// 通知设置
const notificationSettings = reactive({
  userMessage: true,
  systemMessage: true,
  todoTask: true
})

// 初始化用户信息
onMounted(() => {
  const userInfo = userStore.getUserInfo()
  if (userInfo) {
    const user = userInfo as any
    basicForm.nickname = userInfo.nickname || userInfo.username || ''
    basicForm.email = userInfo.email || ''
    basicForm.phone = userInfo.phone || ''
    basicForm.bio = user?.bio || ''
    basicForm.address = user?.address || ''
  }
})

// 提交基本设置
const onBasicSubmit = async () => {
  basicLoading.value = true
  try {
    // 这里应该调用API更新用户信息
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    message.success('基本信息更新成功')
  } catch (error) {
    message.error('更新失败，请重试')
  } finally {
    basicLoading.value = false
  }
}

// 提交安全设置
const onSecuritySubmit = async () => {
  if (securityForm.newPassword !== securityForm.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  
  securityLoading.value = true
  try {
    // 这里应该调用API修改密码
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    message.success('密码修改成功')
    // 清空表单
    securityForm.currentPassword = ''
    securityForm.newPassword = ''
    securityForm.confirmPassword = ''
  } catch (error) {
    message.error('密码修改失败，请重试')
  } finally {
    securityLoading.value = false
  }
}

// 保存通知设置
const saveNotificationSettings = async () => {
  try {
    // 这里应该调用API保存通知设置
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟API调用
    message.success('通知设置保存成功')
  } catch (error) {
    message.error('保存失败，请重试')
  }
}
</script>

<style scoped>
.account-settings {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.settings-menu-card {
  margin-bottom: 0;
}

.settings-content-card {
  margin-bottom: 0;
}

.section-title {
  margin-bottom: 24px;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.settings-section {
  padding: 24px 0;
}

.binding-list {
  .binding-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .binding-info {
      display: flex;
      align-items: center;
      
      .binding-icon {
        font-size: 24px;
        margin-right: 12px;
        color: #1890ff;
      }
      
      .binding-details {
        .binding-title {
          font-size: 16px;
          font-weight: 500;
          color: #262626;
          margin-bottom: 4px;
        }
        
        .binding-desc {
          font-size: 14px;
          color: #8c8c8c;
        }
      }
    }
  }
}

.notification-list {
  .notification-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .notification-info {
      .notification-title {
        font-size: 16px;
        font-weight: 500;
        color: #262626;
        margin-bottom: 4px;
      }
      
      .notification-desc {
        font-size: 14px;
        color: #8c8c8c;
      }
    }
  }
}

.notification-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}
</style>
