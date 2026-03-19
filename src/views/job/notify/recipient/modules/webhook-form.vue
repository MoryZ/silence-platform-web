<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import { $t } from '@/locales';
import { translateOptions } from '@/utils/common';
import { alarmWebhookTypeRecordOptions } from '@/constants/business';
import type { NotifyRecipient } from '@/types/job';

defineOptions({
  name: 'WebhookForm'
});


interface WebhookNotify {
  id?: any;
  recipientName: string;
  notifyType: number;
  webhookUrl: string;
  secret?: string;
  description?: string;
  contentType: string;
}

interface Props {
  value: NotifyRecipient;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:value', value: any): void;
}

const emit = defineEmits<Emits>();

// 简化的表单处理
const formRef = ref();
const validate = async () => {
  // 简化的验证逻辑
  return true;
};
const restoreValidation = () => {
  // 简化的重置验证逻辑
};

// 简化的表单规则
const defaultRequiredRule = { required: true, message: '此字段为必填项' };

type Model = Pick<
  WebhookNotify,
  'id' | 'recipientName' | 'notifyType' | 'webhookUrl' | 'secret' | 'description' | 'contentType'
>;
const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  const { webhookUrl, contentType, secret } = JSON.parse(props.value.notifyAttribute || '{}') as {
    webhookUrl: string;
    contentType: string;
    secret: string;
  };

  return {
    id: props.value.id,
    recipientName: props.value.recipientName,
    notifyType: 5,
    contentType: contentType || '',
    webhookUrl: webhookUrl || '',
    secret: secret || '',
    description: props.value.description || ''
  };
}

type RuleKey = Extract<keyof Model, 'recipientName' | 'notifyType' | 'webhookUrl' | 'secret' | 'contentType'>;

const rules: Record<RuleKey, any> = {
  contentType: defaultRequiredRule,
  recipientName: defaultRequiredRule,
  notifyType: defaultRequiredRule,
  webhookUrl: defaultRequiredRule,
  secret: defaultRequiredRule
};

const buildNotifyAttribute = (webhookUrl: string, contentType: string, secret?: string) => {
  return JSON.stringify({ webhookUrl, contentType, secret });
};

watch(
  model,
  () => {
    const { id, recipientName, notifyType, webhookUrl, secret, description, contentType } = model;
    const notifyAttribute = buildNotifyAttribute(webhookUrl, contentType, secret);
    emit('update:value', { id, recipientName, notifyType, notifyAttribute, description: description || '' });
  },
  { immediate: true, deep: true }
);

defineExpose({
  validate,
  restoreValidation
});
</script>

<template>
  <a-form ref="formRef" :model="model" :rules="rules">
    <a-form-item :label="$t('page.notifyRecipient.recipientName')" name="recipientName">
      <a-input v-model:value="model.recipientName" :placeholder="$t('page.notifyRecipient.form.recipientName')" allow-clear />
    </a-form-item>
    <a-form-item :label="$t('page.notifyRecipient.webhookUrl')" name="webhookUrl">
      <a-input v-model:value="model.webhookUrl" :placeholder="$t('page.notifyRecipient.form.webhookUrl')" allow-clear />
    </a-form-item>
    <a-form-item :label="$t('page.notifyRecipient.contentType')" name="contentType">
      <a-select
        v-model:value="model.contentType"
        :options="translateOptions(alarmWebhookTypeRecordOptions)"
        :placeholder="$t('page.notifyRecipient.contentType')"
        allow-clear
      />
    </a-form-item>
    <a-form-item :label="$t('page.notifyRecipient.secret')" name="secret">
      <a-input v-model:value="model.secret" :placeholder="$t('page.notifyRecipient.form.secret')" allow-clear />
    </a-form-item>
    <a-form-item :label="$t('page.notifyRecipient.description')" name="description">
      <a-textarea
        v-model:value="model.description"
        :placeholder="$t('page.notifyRecipient.form.description')"
        allow-clear
        :rows="3"
      />
    </a-form-item>
  </a-form>
</template>

<style scoped></style>
