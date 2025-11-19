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
  NSpin
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
    NSpin
  ]
});

let naiveInstalled = false;

export function setupNaive(app: App) {
  if (naiveInstalled) return;
  naiveInstalled = true;
  app.use(naive);
}

