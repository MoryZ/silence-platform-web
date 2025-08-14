<template>
  <div class="login-container" :style="backgroundStyle">
    <div class="settings-group">
      <a-button class="settings-item" type="text" @click="showLanguageMenu">
        <translation-outlined />
      </a-button>
      
      <a-button class="settings-item" type="text" @click="showThemeMenu">
        <bg-colors-outlined />
      </a-button>
      
      <a-button class="settings-item" type="text" @click="showBackgroundMenu">
        <picture-outlined />
      </a-button>
    </div>

    <!-- 语言选择菜单 -->
    <a-menu
      v-if="languageVisible"
      :selectedKeys="currentLang"
      @select="handleLanguageChange"
      class="settings-menu"
      :style="menuStyle"
    >
      <a-menu-item key="zh_CN">简体中文</a-menu-item>
      <a-menu-item key="en_US">English</a-menu-item>
    </a-menu>

    <!-- 主题选择菜单 -->
    <a-menu
      v-if="themeVisible"
      :selectedKeys="[currentTheme]"
      @select="handleThemeChange"
      class="settings-menu"
      :style="menuStyle"
    >
      <a-menu-item key="dark">{{ getText.theme.dark }}</a-menu-item>
      <a-menu-item key="light">{{ getText.theme.light }}</a-menu-item>
    </a-menu>

    <!-- 背景选择菜单 -->
    <a-menu
      v-if="backgroundVisible"
      @select="handleBackgroundChange"
      class="settings-menu"
      :style="menuStyle"
    >
      <a-menu-item key="default">{{ getText.background.default }}</a-menu-item>
      <a-menu-item key="custom">
        <div @click.stop="handleCustomBackground">{{ getText.background.custom }}</div>
      </a-menu-item>
      <a-menu-item key="gradient">{{ getText.background.gradient }}</a-menu-item>
    </a-menu>
    <div class="login-left">
      <div class="login-content">
        <div class="login-header">
          <img src="/logo.svg" alt="logo" class="logo" />
          <h1>{{ getText.login.title }}</h1>
        </div>
        <div class="login-desc">
          <h2>{{ getText.login.subtitle }}</h2>
          <p>{{ getText.login.description }}</p>
        </div>
        <div class="login-illustration">
          <img src="/login-illustration.svg" alt="illustration" />
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-form-container">
        <h2 class="form-title">{{ getText.login.formTitle }}</h2>
        <p class="form-subtitle">{{ getText.login.formSubtitle }}</p>
        
        <a-form
          :model="formState"
          name="login"
          @finish="onFinish"
          class="login-form"
        >
          <a-form-item
            name="username"
            :rules="[{ required: true, message: getText.login.username }]"
          >
            <a-input
              v-model:value="formState.username"
              size="large"
              :placeholder="getText.login.username"
              :bordered="false"
              class="custom-input"
            >
              <template #prefix>
                <user-outlined class="input-icon" />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            name="password"
            :rules="[{ required: true, message: getText.login.password }]"
          >
            <a-input-password
              v-model:value="formState.password"
              size="large"
              :placeholder="getText.login.password"
              :bordered="false"
              class="custom-input"
            >
              <template #prefix>
                <lock-outlined class="input-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item
            name="verify"
            :rules="[{ required: true, message: getText.login.verify }]"
          >
            <slide-verify
              v-model:value="formState.verify"
              @success="handleVerifySuccess"
            />
          </a-form-item>

          <div class="form-options">
            <a-checkbox v-model:checked="formState.remember" class="remember-checkbox">
              {{ getText.login.remember }}
            </a-checkbox>
            <a class="forgot-link">{{ getText.login.forgot }}</a>
          </div>

          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              :loading="loading"
              :disabled="!formState.verify"
              class="login-button"
            >
              {{ getText.login.loginButton }}
            </a-button>
          </a-form-item>

          <div class="other-login">
            <div class="divider">
              <span>{{ getText.login.otherLogin }}</span>
            </div>
            <div class="social-login">
              <a href="#" class="social-icon">
                <wechat-outlined />
              </a>
              <a href="#" class="social-icon">
                <qq-outlined />
              </a>
              <a href="#" class="social-icon">
                <github-outlined />
              </a>
              <a href="#" class="social-icon">
                <google-outlined />
              </a>
            </div>
          </div>
        </a-form>
        <div class="register-link">
          {{ getText.login.register }}<a href="#">{{ getText.login.registerLink }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import {
  UserOutlined,
  LockOutlined,
  WechatOutlined,
  QqOutlined,
  GithubOutlined,
  GoogleOutlined,
  TranslationOutlined,
  BgColorsOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAppStore } from '@/stores/app';
import SlideVerify from '@/components/SlideVerify.vue';

interface FormState {
  username: string;
  password: string;
  remember: boolean;
  verify: boolean;
}

interface BackgroundStyle {
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
}

const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();
const loading = ref(false);

// 预设登录信息，便于开发调试
const formState = reactive<FormState>({
  username: 'admin',
  password: '123456',
  remember: true,
  verify: true, // 自动通过滑块验证
});

const currentLang = computed(() => [appStore.language]);

const handleLanguageChange = (e: any) => {
  const selectedLang = e.key;
  console.log('Language change triggered:', selectedLang);
  appStore.setLanguage(selectedLang);
  languageVisible.value = false;
};

const currentTheme = computed(() => appStore.theme);

const handleThemeChange = (e: any) => {
  const selectedTheme = e.key;
  console.log('Theme change triggered:', selectedTheme);
  appStore.setTheme(selectedTheme);
  themeVisible.value = false;
};

const backgroundStyle = ref<BackgroundStyle>({});

const handleVerifySuccess = () => {
  formState.verify = true;
};

const i18n = {
  'zh_CN': {
    theme: {
      dark: '暗色主题',
      light: '亮色主题'
    },
    background: {
      default: '默认背景',
      custom: '自定义背景',
      gradient: '渐变背景'
    },
    login: {
      title: 'SILENCE PLATFORM',
      subtitle: '开箱即用的大型中后台管理系统',
      description: '工程化、高性能、跨平台的 SAAS 平台',
      formTitle: '登录',
      formSubtitle: '请输入您的账户和密码以开始使用',
      username: '请输入用户名',
      password: '请输入密码',
      verify: '请完成滑块验证',
      remember: '记住账号',
      forgot: '忘记密码？',
      loginButton: '登录',
      otherLogin: '其他登录方式',
      register: '还没有账号？',
      registerLink: '立即注册',
      loginSuccess: '登录成功',
      verifyMessage: '请完成滑块验证',
      loginFailed: '登录失败',
      menuLoadFailed: '菜单加载失败'
    }
  },
  'en_US': {
    theme: {
      dark: 'Dark Theme',
      light: 'Light Theme'
    },
    background: {
      default: 'Default Background',
      custom: 'Custom Background',
      gradient: 'Gradient Background'
    },
    login: {
      title: 'SILENCE PLATFORM',
      subtitle: 'Enterprise Management System',
      description: 'Engineering, High Performance, Cross-platform SAAS Platform',
      formTitle: 'Login',
      formSubtitle: 'Please enter your account and password to start',
      username: 'Please enter username',
      password: 'Please enter password',
      verify: 'Please complete verification',
      remember: 'Remember me',
      forgot: 'Forgot password?',
      loginButton: 'Login',
      otherLogin: 'Other Login Methods',
      register: "Don't have an account?",
      registerLink: 'Register Now',
      loginSuccess: 'Login successful',
      verifyMessage: 'Please complete verification',
      loginFailed: 'Login failed',
      menuLoadFailed: 'Menu load failed'
    }
  }
};

// 获取当前语言的文本
const getText = computed(() => {
  const language = appStore.language;
  if (language === 'zh_CN' || language === 'en_US') {
    return i18n[language as keyof typeof i18n];
  }
  // 默认返回中文
  return i18n['zh_CN'];
});

const onFinish = async (values: any) => {
  if (!formState.verify) {
    message.error(getText.value.login.verifyMessage);
    return;
  }

  try {
    loading.value = true;
    
    
    // 调用登录方法
    const success = await userStore.handleLogin({
      username: formState.username,
      password: formState.password
    });

    if (success) {
      // 显示登录成功消息
      message.success(getText.value.login.loginSuccess);
      
      router.replace('/dashboard');
      loginSuccess.value = true;
    } else {
      message.error(getText.value.login.loginFailed);
    }
  } catch (error: any) {
    console.error('登录失败:', error);
    message.error(error.message || getText.value.login.loginFailed);
  } finally {
    loading.value = false;
  }
};

// 用于标记登录是否成功
const loginSuccess = ref(false);

const handleCustomBackground = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        backgroundStyle.value = {
          backgroundImage: `url(${e.target?.result})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};

const handleBackgroundChange = ({ key }: { key: string }) => {
  switch (key) {
    case 'default':
      backgroundStyle.value = {};
      break;
    case 'gradient':
      backgroundStyle.value = {
        backgroundImage: currentTheme.value === 'light' 
          ? 'linear-gradient(135deg, #f5f5f5 0%, #e6e6e6 100%)'
          : 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
      };
      break;
  }
};

const languageVisible = ref(false);
const themeVisible = ref(false);
const backgroundVisible = ref(false);

const menuStyle = computed(() => ({
  position: 'fixed',
  top: '80px',
  right: '24px',
  zIndex: 1000,
  minWidth: '120px',
  padding: '4px',
  background: 'var(--component-background)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
}));

const showLanguageMenu = () => {
  languageVisible.value = true;
  themeVisible.value = false;
  backgroundVisible.value = false;
};

const showThemeMenu = () => {
  languageVisible.value = false;
  themeVisible.value = true;
  backgroundVisible.value = false;
};

const showBackgroundMenu = () => {
  languageVisible.value = false;
  themeVisible.value = false;
  backgroundVisible.value = true;
};

// 点击其他区域关闭菜单
const closeMenus = () => {
  languageVisible.value = false;
  themeVisible.value = false;
  backgroundVisible.value = false;
};

onMounted(() => {
  appStore.initialize();
  
  // 添加点击事件监听器来关闭菜单
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.settings-group') && !target.closest('.settings-menu')) {
      closeMenus();
    }
  });

  // 监听主题变化事件
  const handleThemeChange = (event: CustomEvent) => {
    if (backgroundStyle.value.backgroundImage?.includes('linear-gradient')) {
      handleBackgroundChange({ key: 'gradient' });
    }
  };

  window.addEventListener('themeChange', handleThemeChange as EventListener);

  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('themeChange', handleThemeChange as EventListener);
    document.removeEventListener('click', closeMenus);
  });
});
</script>

<style lang="less" scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: var(--bg-color);
  position: relative;
  background-size: cover;
  background-position: center;
  transition: all 0.3s;
}

.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: var(--component-background);
}

.login-content {
  max-width: 480px;
  color: var(--text-color);
}

.login-header {
  display: flex;
  align-items: center;
  margin-bottom: 48px;
}

.logo {
  width: 48px;
  height: 48px;
  margin-right: 16px;
}

.login-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(90deg, #36d1dc 0%, #5b86e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-desc {
  margin-bottom: 48px;
  width: 520px;
}

.login-desc h2 {
  margin: 0 0 16px;
  font-size: 36px;
  font-weight: 600;
  line-height: 1.4;
  background: linear-gradient(90deg, var(--text-color) 0%, var(--text-color) 100%);
  opacity: 0.85;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-desc p {
  margin: 0;
  font-size: 16px;
  color: var(--text-color);
  opacity: 0.45;
}

.login-illustration {
  margin-top: 64px;
  
  img {
    width: 100%;
    max-width: 480px;
  }
}

.login-right {
  width: 480px;
  background: var(--component-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form-container {
  width: 100%;
  max-width: 360px;
  padding: 0 32px;
}

.form-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.form-subtitle {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--text-color);
  opacity: 0.65;
}

.login-form {
  .custom-input {
    background: var(--component-background);
    border-radius: 4px;
    border: 1px solid var(--border-color);
    
    &:hover, &:focus {
      background: var(--component-background);
      border-color: #1890ff;
    }
    
    input {
      background: transparent;
      color: var(--text-color);
      
      &::placeholder {
        color: var(--text-color);
        opacity: 0.45;
      }
    }
  }
  
  .input-icon {
    color: var(--text-color);
    opacity: 0.45;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-checkbox {
  color: var(--text-color);
  
  :deep(.ant-checkbox-inner) {
    background-color: var(--component-background);
    border-color: var(--border-color);
  }
  
  :deep(.ant-checkbox-checked .ant-checkbox-inner) {
    background-color: #1890ff;
    border-color: #1890ff;
  }
}

.forgot-link {
  color: #1890ff;
  font-size: 14px;
  
  &:hover {
    color: #40a9ff;
  }
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background: linear-gradient(90deg, #36d1dc 0%, #5b86e5 100%);
  border: none;
  
  &:hover {
    background: linear-gradient(90deg, #5bdce6 0%, #7599e8 100%);
  }
}

.other-login {
  margin-top: 24px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: var(--text-color);
  opacity: 0.45;
  font-size: 14px;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
  
  span {
    padding: 0 16px;
  }
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--component-background);
  color: var(--text-color);
  opacity: 0.65;
  transition: all 0.3s;
  border: 1px solid var(--border-color);
  
  &:hover {
    opacity: 1;
    border-color: #1890ff;
    color: #1890ff;
  }
}

.register-link {
  margin-top: 24px;
  text-align: center;
  color: var(--text-color);
  opacity: 0.65;
  font-size: 14px;
  
  a {
    color: #1890ff;
    
    &:hover {
      color: #40a9ff;
    }
  }
}

.manual-redirect {
  margin: 20px 0;
  text-align: center;
  padding: 15px;
  background-color: rgba(24, 144, 255, 0.1);
  border-radius: 8px;
  
  p {
    margin-bottom: 10px;
  }
}

.settings-group {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 16px;
  z-index: 1000;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--component-background);
  backdrop-filter: blur(8px);
  color: var(--text-color);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--border-color);
  padding: 0;
  
  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
}

.settings-menu {
  position: absolute;
  right: 0;
  top: 40px;
  min-width: 120px;
  background-color: var(--menu-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;

  :deep(.ant-menu-item) {
    color: var(--menu-item-color);
    transition: all 0.3s;

    &:hover {
      background-color: var(--menu-item-hover-bg);
    }

    &.ant-menu-item-selected {
      background-color: var(--menu-item-active-bg);
      color: var(--menu-highlight-color);
    }
  }
}

.settings-button {
  background: transparent;
  border: none;
  color: var(--text-color);
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: var(--menu-item-hover-bg);
  }

  .anticon {
    margin-right: 4px;
  }
}
</style> 