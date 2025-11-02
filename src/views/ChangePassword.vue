<template>
  <div class="change-password-container">
    <div class="change-password-card">
      <div class="change-password-header">
        <h2>{{ isForceChange ? '首次登录，请修改密码' : '修改密码' }}</h2>
        <p v-if="isForceChange" class="force-notice">
          为了账户安全，您需要修改默认密码后才能继续使用
        </p>
      </div>
      
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
        class="change-password-form"
      >
        <a-form-item 
          v-if="!isForceChange" 
          label="当前密码" 
          name="currentPassword"
        >
          <a-input-password
            v-model:value="formState.currentPassword"
            placeholder="请输入当前密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="新密码" name="newPassword">
          <a-input-password
            v-model:value="formState.newPassword"
            placeholder="请输入新密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="确认新密码" name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请再次输入新密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            :disabled="isForceChange ? false : !formState.currentPassword"
            block
            class="submit-button"
          >
            {{ isForceChange ? '修改密码并登录' : '修改密码' }}
          </a-button>
        </a-form-item>

        <a-form-item v-if="!isForceChange">
          <a-button
            type="text"
            @click="handleCancel"
            block
            class="cancel-button"
          >
            取消
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { LockOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import { useUserStore } from '@/stores/user';
import { modifyPassword } from '@/api/auth/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

// 判断是否是强制修改密码
const isForceChange = computed(() => {
  return route.query.force === 'true';
});

const formState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 表单验证规则
const validateConfirmPassword = (_: any, value: string) => {
  if (!value) {
    return Promise.reject(new Error('请确认新密码'));
  }
  if (value !== formState.newPassword) {
    return Promise.reject(new Error('两次输入的密码不一致'));
  }
  return Promise.resolve();
};

const rules = {
  currentPassword: [
    {
      required: !isForceChange.value,
      message: '请输入当前密码',
      trigger: 'blur'
    }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

// 提交修改密码
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    loading.value = true;
    
    const userInfo = userStore.getUserInfo();
    if (!userInfo || !userInfo.username) {
      message.error('用户信息不存在，请重新登录');
      router.replace('/login');
      return;
    }

    // 调用修改密码 API（使用用户名和新密码）
    await modifyPassword(userInfo.username, formState.newPassword);
    
    message.success('密码修改成功');
    
    if (isForceChange.value) {
      // 强制修改密码后，需要重新登录
      message.info('请使用新密码重新登录');
      await userStore.handleLogout();
      router.replace('/login');
    } else {
      // 普通修改密码，返回上一页或首页
      router.back();
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '密码修改失败';
    message.error(errorMessage);
    console.error('修改密码失败:', error);
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  router.back();
};

// 如果是强制修改密码，检查是否已登录
onMounted(() => {
  if (isForceChange.value) {
    const userInfo = userStore.getUserInfo();
    if (!userInfo || !userInfo.id) {
      message.warning('请先登录');
      router.replace('/login');
    }
  }
});
</script>

<style lang="scss" scoped>
.change-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 24px;
}

.change-password-card {
  width: 100%;
  max-width: 480px;
  background: var(--component-background);
  border-radius: 8px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.change-password-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
  }

  .force-notice {
    margin: 0;
    color: #ff9800;
    font-size: 14px;
  }
}

.change-password-form {
  :deep(.ant-form-item) {
    margin-bottom: 24px;
  }

  :deep(.ant-input-affix-wrapper) {
    border-radius: 4px;
  }
}

.submit-button {
  height: 44px;
  font-size: 16px;
  background: linear-gradient(90deg, #36d1dc 0%, #5b86e5 100%);
  border: none;

  &:hover {
    background: linear-gradient(90deg, #5bdce6 0%, #7599e8 100%);
  }
}

.cancel-button {
  color: var(--text-color);
  opacity: 0.65;

  &:hover {
    opacity: 1;
  }
}
</style>

