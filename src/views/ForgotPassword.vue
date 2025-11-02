<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="forgot-password-header">
        <h2>重置密码</h2>
        <p class="subtitle">请输入您的用户名、邮箱或手机号来重置密码</p>
      </div>
      
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
        class="forgot-password-form"
      >
        <a-form-item label="用户名/邮箱/手机号" name="identifier">
          <a-input
            v-model:value="formState.identifier"
            placeholder="请输入用户名、邮箱或手机号"
            size="large"
          >
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
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
            block
            class="submit-button"
          >
            重置密码
          </a-button>
        </a-form-item>

        <a-form-item>
          <a-button
            type="text"
            @click="handleCancel"
            block
            class="cancel-button"
          >
            返回登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import { forgotPassword } from '@/api/auth/user';

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const formState = reactive({
  identifier: '',
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
  identifier: [
    { required: true, message: '请输入用户名、邮箱或手机号', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

// 提交重置密码
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    loading.value = true;
    
    // 调用重置密码 API
    await forgotPassword(formState.identifier, formState.newPassword);
    
    message.success('密码重置成功，请使用新密码登录');
    
    // 跳转到登录页
    setTimeout(() => {
      router.replace('/login');
    }, 1500);
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || '密码重置失败';
    message.error(errorMessage);
    console.error('密码重置失败:', error);
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  router.replace('/login');
};
</script>

<style lang="scss" scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 24px;
}

.forgot-password-card {
  width: 100%;
  max-width: 480px;
  background: var(--component-background);
  border-radius: 8px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
  }

  .subtitle {
    margin: 0;
    color: var(--text-color);
    opacity: 0.65;
    font-size: 14px;
  }
}

.forgot-password-form {
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

