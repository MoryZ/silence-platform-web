<template>
  <div class="apply-permission-container">
    <div class="apply-permission-card">
      <div class="apply-permission-header">
        <a-result
          status="warning"
          title="暂无访问权限"
          sub-title="您的账户尚未分配菜单权限，请联系管理员申请权限"
        >
          <template #icon>
            <lock-outlined style="font-size: 72px; color: #faad14;" />
          </template>
          <template #extra>
            <a-space direction="vertical" size="large" style="width: 100%">
              <div class="user-info">
                <a-descriptions :column="1" bordered size="small">
                  <a-descriptions-item label="用户名">
                    {{ userInfo?.username }}
                  </a-descriptions-item>
                  <a-descriptions-item label="昵称">
                    {{ userInfo?.nickname }}
                  </a-descriptions-item>
                  <a-descriptions-item label="邮箱">
                    {{ userInfo?.email || '-' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="手机号">
                    {{ userInfo?.phone || '-' }}
                  </a-descriptions-item>
                </a-descriptions>
              </div>

              <div class="action-buttons">
                <a-button type="primary" size="large" @click="showRoleModal = true" :loading="loadingRoles">
                  <mail-outlined /> 申请权限
                </a-button>
                <a-button size="large" @click="handleLogout">
                  <logout-outlined /> 退出登录
                </a-button>
              </div>
            </a-space>
          </template>
        </a-result>
      </div>

      <!-- 权限申请说明 -->
      <div class="permission-tips">
        <a-alert
          message="权限申请说明"
          type="info"
          show-icon
        >
          <template #description>
            <ul class="tips-list">
              <li>请联系系统管理员为您分配相应的菜单权限</li>
              <li>权限申请通过后，您需要重新登录系统</li>
              <li>如有疑问，请联系技术支持</li>
            </ul>
          </template>
        </a-alert>
      </div>
    </div>

    <!-- 角色选择弹窗 -->
    <a-modal
      v-model:open="showRoleModal"
      title="选择角色申请权限"
      ok-text="提交申请"
      cancel-text="取消"
      @ok="handleSubmitApplication"
      @cancel="handleCancelApplication"
      width="600px"
      :confirm-loading="submitting"
    >
      <a-form :model="applicationForm" layout="vertical">
        <a-form-item label="选择角色" required>
          <a-select
            v-model:value="applicationForm.roleIds"
            mode="multiple"
            placeholder="请选择需要申请的角色（可多选）"
            :options="roleOptions"
            :field-names="{ label: 'name', value: 'id' }"
            :loading="loadingRoles"
            style="width: 100%"
            :max-tag-count="3"
            :show-search="true"
            :filter-option="filterRoleOption"
          >
            <template #option="{ name, description }">
              <div class="role-option">
                <div class="role-name">{{ name }}</div>
                <div v-if="description" class="role-description">{{ description }}</div>
              </div>
            </template>
          </a-select>
          <div class="selected-count" v-if="applicationForm.roleIds && applicationForm.roleIds.length > 0">
            已选择 {{ applicationForm.roleIds.length }} 个角色
          </div>
        </a-form-item>

        <a-form-item label="申请说明（可选）">
          <a-textarea
            v-model:value="applicationForm.remark"
            placeholder="请输入申请理由或说明"
            :rows="4"
            :maxlength="200"
            show-count
          />
        </a-form-item>

        <a-alert
          message="提示"
          description="提交申请后，系统管理员会收到通知并处理您的权限申请。申请通过后，请重新登录系统。"
          type="info"
          show-icon
          style="margin-top: 16px"
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { LockOutlined, MailOutlined, LogoutOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '@/stores/user';
import { getMinimumRoles, type Role } from '@/api/auth/role';

const router = useRouter();
const userStore = useUserStore();

const userInfo = computed(() => userStore.getUserInfo());

// 角色选择相关
const showRoleModal = ref(false);
const loadingRoles = ref(false);
const submitting = ref(false);
const roleOptions = ref<Role[]>([]);

// 申请表单
const applicationForm = reactive({
  roleIds: [] as number[],
  remark: ''
});

// 获取角色列表
const fetchRoles = async () => {
  loadingRoles.value = true;
  try {
    const roles = await getMinimumRoles();
    // 只显示启用状态的角色
    roleOptions.value = roles.filter(role => role.status === true);
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '获取角色列表失败';
    message.error(errorMessage);
    console.error('获取角色列表失败:', error);
  } finally {
    loadingRoles.value = false;
  }
};

// 角色选项过滤
const filterRoleOption = (input: string, option: any) => {
  const name = option.name || '';
  const description = option.description || '';
  const searchText = input.toLowerCase();
  return name.toLowerCase().includes(searchText) || description.toLowerCase().includes(searchText);
};

// 提交申请
const handleSubmitApplication = async () => {
  if (!applicationForm.roleIds || applicationForm.roleIds.length === 0) {
    message.warning('请至少选择一个角色');
    return;
  }

  submitting.value = true;
  try {
    // 获取选中的角色名称
    const selectedRoles = roleOptions.value
      .filter(role => applicationForm.roleIds.includes(role.id))
      .map(role => role.name);

    // 这里可以调用申请权限的API
    // 暂时使用邮件方式通知管理员
    const email = userInfo.value?.email || 'admin@example.com';
    const subject = encodeURIComponent('权限申请');
    const body = encodeURIComponent(
      `尊敬的管理员：\n\n` +
      `用户 ${userInfo.value?.username} (${userInfo.value?.nickname}) 申请系统访问权限。\n\n` +
      `用户信息：\n` +
      `- 用户名：${userInfo.value?.username}\n` +
      `- 昵称：${userInfo.value?.nickname}\n` +
      `- 邮箱：${userInfo.value?.email || '-'}\n` +
      `- 手机号：${userInfo.value?.phone || '-'}\n\n` +
      `申请角色：\n` +
      selectedRoles.map((name, index) => `${index + 1}. ${name}`).join('\n') +
      `\n\n申请说明：\n${applicationForm.remark || '无'}\n\n` +
      `请尽快处理该权限申请，谢谢！`
    );
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    message.success('申请已提交，已打开邮件客户端，请发送权限申请邮件');
    showRoleModal.value = false;
    
    // 重置表单
    applicationForm.roleIds = [];
    applicationForm.remark = '';
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '提交申请失败';
    message.error(errorMessage);
    console.error('提交申请失败:', error);
  } finally {
    submitting.value = false;
  }
};

// 取消申请
const handleCancelApplication = () => {
  showRoleModal.value = false;
  applicationForm.roleIds = [];
  applicationForm.remark = '';
};

// 打开弹窗时加载角色列表
const handleOpenRoleModal = () => {
  showRoleModal.value = true;
  if (roleOptions.value.length === 0) {
    fetchRoles();
  }
};

// 退出登录
const handleLogout = async () => {
  await userStore.handleLogout();
  message.success('已退出登录');
  router.replace('/login');
};

// 组件挂载时预加载角色列表
onMounted(() => {
  fetchRoles();
});
</script>

<style lang="scss" scoped>
.apply-permission-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 24px;
}

.apply-permission-card {
  width: 100%;
  max-width: 600px;
  background: var(--component-background);
  border-radius: 8px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.apply-permission-header {
  text-align: center;
  margin-bottom: 32px;
}

.user-info {
  margin: 24px 0;
  text-align: left;

  :deep(.ant-descriptions-item-label) {
    font-weight: 500;
    color: var(--text-color);
    opacity: 0.85;
  }

  :deep(.ant-descriptions-item-content) {
    color: var(--text-color);
  }
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;

  .ant-btn {
    min-width: 120px;
    height: 44px;
    font-size: 16px;
  }

  .ant-btn-primary {
    background: linear-gradient(90deg, #36d1dc 0%, #5b86e5 100%);
    border: none;

    &:hover {
      background: linear-gradient(90deg, #5bdce6 0%, #7599e8 100%);
    }
  }
}

.permission-tips {
  margin-top: 32px;

  .tips-list {
    margin: 12px 0 0 0;
    padding-left: 20px;
    color: var(--text-color);
    opacity: 0.85;
    line-height: 1.8;

    li {
      margin-bottom: 8px;
    }
  }
}

:deep(.ant-result-title) {
  color: var(--text-color);
}

:deep(.ant-result-subtitle) {
  color: var(--text-color);
  opacity: 0.65;
}

.role-option {
  .role-name {
    font-weight: 500;
    color: var(--text-color);
  }

  .role-description {
    font-size: 12px;
    color: var(--text-color);
    opacity: 0.65;
    margin-top: 4px;
  }
}

.selected-count {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-color);
  opacity: 0.65;
}
</style>

