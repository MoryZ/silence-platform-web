<script setup lang="ts">
import { ref, watch } from 'vue';
import { $t } from '@/locales';

defineOptions({
  name: 'NotifyRecipientDetailDrawer'
});

// 定义类型接口
interface NotifyRecipient {
  id?: any;
  recipientName: string;
  notifyType: number;
  notifyAttribute?: string;
  description?: string;
}

interface DingDingNotify {
  webhookUrl?: string;
  ats?: string[];
}

interface EmailNotify {
  tos?: string[];
}

interface Props {
  /** row data */
  rowData?: NotifyRecipient | null;
}

const props = defineProps<Props>();
const notifyAttribute = ref<DingDingNotify | EmailNotify>();

const visible = defineModel<boolean>('visible', {
  default: false
});

watch(
  () => props.rowData,
  () => {
    const rowData = props.rowData?.notifyAttribute || null;
    notifyAttribute.value = JSON.parse(rowData || '{}') || {};
  },
  { immediate: true }
);

// 辅助函数
const getTagColor = (type: any) => {
  const colors = ['blue', 'green', 'orange', 'red', 'purple'];
  if (typeof type === 'number') {
    return colors[type - 1] || 'default';
  }
  return colors[type % colors.length] || 'default';
};

const getNotifyTypeLabel = (type: any) => {
  const labels = {
    1: '钉钉',
    2: '邮箱', 
    3: '企业微信',
    4: '飞书',
    5: 'Webhook'
  };
  return labels[type as keyof typeof labels] || '未知';
};
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('page.notifyRecipient.detail')"
    width="600px"
    placement="right"
  >
    <a-descriptions :column="2" bordered>
      <a-descriptions-item :label="$t('page.notifyRecipient.recipientName')" :span="2">
        {{ rowData?.recipientName }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('page.notifyRecipient.notifyType')" :span="2">
        <a-tag :color="getTagColor(rowData?.notifyType)">
          {{ getNotifyTypeLabel(rowData?.notifyType) }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item v-if="rowData?.notifyType !== 2" :label="$t('page.notifyRecipient.webhookUrl')" :span="2">
        {{ (notifyAttribute as DingDingNotify)?.webhookUrl }}
      </a-descriptions-item>
      <a-descriptions-item v-if="rowData?.notifyType !== 2" :label="$t('page.notifyRecipient.ats')" :span="2">
        <a-tag
          v-for="(item, index) in (notifyAttribute as DingDingNotify)?.ats"
          :key="index"
          :color="getTagColor(index)"
          style="margin-right: 10px"
        >
          {{ item }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item v-if="rowData?.notifyType == 2" :label="$t('page.notifyRecipient.tos')" :span="2">
        <a-tag
          v-for="(item, index) in (notifyAttribute as EmailNotify)?.tos"
          :key="index"
          :color="getTagColor(index)"
          style="margin-right: 10px"
        >
          {{ item }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item :label="$t('page.notifyRecipient.description')" :span="2">
        {{ rowData?.description }}
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<style scoped></style>
