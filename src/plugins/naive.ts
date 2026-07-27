import type { App } from 'vue';
import {
  create,
  NButton,
  NPopover,
  NBadge,
  NTooltip,
  NDivider,
  NDescriptions,
  NDescriptionsItem,
  NEllipsis,
  NTag,
  NDrawer,
  NDrawerContent,
  NSelect,
  NForm,
  NFormItem,
  NRadioGroup,
  NSpace,
  NRadio,
  NInputNumber,
  NInput,
  NGrid,
  NGi,
  NTabs,
  NTabPane,
  NPagination,
  NSpin,
  // Providers：让 App.vue 模板里的 n-config-provider 等能直接使用
  NConfigProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider
} from 'naive-ui';

const naive = create({
  components: [
    NButton,
    NPopover,
    NBadge,
    NTooltip,
    NDivider,
    NDescriptions,
    NDescriptionsItem,
    NEllipsis,
    NTag,
    NDrawer,
    NDrawerContent,
    NSelect,
    NForm,
    NFormItem,
    NRadioGroup,
    NSpace,
    NRadio,
    NInputNumber,
    NInput,
    NGrid,
    NGi,
    NTabs,
    NTabPane,
    NPagination,
    NSpin,
    // 同步注册 provider 组件（与 getNaiveTheme / theme 注入配套）
    NConfigProvider,
    NLoadingBarProvider,
    NMessageProvider,
    NDialogProvider,
    NNotificationProvider
  ]
});

let naiveInstalled = false;

export function setupNaive(app: App) {
  if (naiveInstalled) return;
  naiveInstalled = true;
  app.use(naive);
}

