import { defineStore } from 'pinia';
import { ref, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { toggleHtmlClass } from '@/utils/common';
import { DARK_CLASS } from '@/constants/app';

// 安全的消息提示函数
const showMessage = (msg: string) => {
  nextTick(() => {
    try {
      message.success(msg);
    } catch (error) {
      console.log('Message display failed:', msg);
    }
  });
};

export const useAppStore = defineStore('app', () => {
  // 主题设置
  const theme = ref(localStorage.getItem('theme') || 'light');
  const language = ref(localStorage.getItem('language') || 'zh_CN');
  const isInitialized = ref(false);

  // 应用主题
  const applyTheme = async (newTheme: string) => {
    if (!isInitialized.value) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    // 移除现有主题类
    body.classList.remove('light-theme', 'dark-theme', 'light', 'dark');
    root.classList.remove('light-theme', 'dark-theme', 'light', 'dark');

    // 应用新主题
    let effectiveTheme = newTheme;
    if (newTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }


    // 设置主题属性和类
    root.setAttribute('data-theme', effectiveTheme);
    body.setAttribute('data-theme', effectiveTheme);
    const themeClass = `${effectiveTheme}-theme`;
    body.classList.add(themeClass);
    root.classList.add(themeClass);

    // 同步 .dark 类（与 stores/theme 的 toggleCssDarkMode 保持一致）
    // 两套系统共用同一个暗色标记，避免 data-theme 和 .class 不同步
    const isDark = effectiveTheme === 'dark';
    const { add: addDark, remove: removeDark } = toggleHtmlClass(DARK_CLASS);
    if (isDark) addDark(); else removeDark();

    // 更新 CSS 变量
    // 注意：--primary-color 由 stores/theme 系统统一注入（rgb 三元组格式），
    // 这里不再注入 hex 格式，避免覆盖导致 CodeEditor.vue 等处 rgba(var(--primary-color), 0.1) 失效
    const cssVars = {
      '--bg-color': isDark ? '#141414' : '#ffffff',
      '--text-color': isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
      '--border-color': isDark ? '#303030' : '#f0f0f0',
      '--component-background': isDark ? '#1f1f1f' : '#ffffff',
      '--menu-bg': isDark ? '#1f1f1f' : '#ffffff',
      '--menu-item-color': isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.85)',
      '--menu-highlight-color': isDark ? '#fff' : '#000',
      '--menu-item-active-bg': isDark ? 'rgba(250, 140, 22, 0.85)' : '#fff7e6',
      '--menu-item-hover-bg': isDark ? 'rgba(255, 255, 255, 0.08)' : '#f5f5f5',
      '--layout-body-background': isDark ? '#141414' : '#f0f2f5',
      '--layout-header-background': isDark ? '#1f1f1f' : '#ffffff',
      '--layout-sider-background': isDark ? '#1f1f1f' : '#ffffff',
      '--layout-trigger-background': isDark ? '#262626' : '#002140',
      '--layout-trigger-color': isDark ? 'rgba(255, 255, 255, 0.65)' : '#fff',
    };

    await nextTick();

    // 应用 CSS 变量到 root
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // 触发主题变化事件
    window.dispatchEvent(new CustomEvent('themeChange', { detail: effectiveTheme }));
   
  };

  // 监听主题变化
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  // 监听语言变化
  watch(language, (newLang) => {
    if (!isInitialized.value) return;
    localStorage.setItem('language', newLang);
    applyLanguage(newLang);
  });

  // 应用语言
  const applyLanguage = (newLang: string) => {
    document.documentElement.lang = newLang;
  };

  // 设置主题
  const setTheme = (newTheme: string) => {
    theme.value = newTheme;
  };

  // 设置语言
  const setLanguage = (newLang: string) => {
    language.value = newLang;
  };

  // 初始化
  const initialize = async () => {
    await nextTick();
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme.value === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    isInitialized.value = true;
    
    // 初始化主题和语言
    await applyTheme(theme.value);
    applyLanguage(language.value);
    
    // 返回清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  };

  return {
    theme,
    language,
    setTheme,
    setLanguage,
    initialize,
  };
}); 