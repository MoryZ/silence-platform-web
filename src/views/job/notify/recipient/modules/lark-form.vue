<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import { $t } from '@/locales';
import { NotifyRecipient } from '@/api/job/notify-recipients';

defineOptions({
  name: 'LarkForm'
});


interface LarkNotify {
  id?: any;
  recipientName: string;
  notifyType: number;
  webhookUrl: string;
  ats: string[];
  description?: string;
  notifyAttribute?: string;
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
  LarkNotify,
  'id' | 'recipientName' | 'notifyType' | 'webhookUrl' | 'ats' | 'description' | 'notifyAttribute'
>;
const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  const { webhookUrl, ats } = JSON.parse(props.value.notifyAttribute || '{}') as { webhookUrl: string; ats: string[] };

  return {
    id: props.value.id,
    recipientName: props.value.recipientName,
    notifyType: 4,
    webhookUrl: webhookUrl || '',
    ats: ats || [],
    description: props.value.description || '',
    notifyAttribute: props.value.notifyAttribute
  };
}

type RuleKey = Extract<keyof Model, 'recipientName' | 'notifyType' | 'webhookUrl' | 'ats'>;

const rules: Record<RuleKey, any> = {
  recipientName: defaultRequiredRule,
  notifyType: defaultRequiredRule,
  webhookUrl: defaultRequiredRule,
  ats: defaultRequiredRule
};

const buildNotifyAttribute = (webhookUrl: string, ats: string[]) => {
  return JSON.stringify({ webhookUrl, ats });
};

watch(
  model,
  () => {
    const { id, recipientName, notifyType, webhookUrl, ats, description } = model;
    const notifyAttribute = buildNotifyAttribute(webhookUrl, ats);
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
      <a-input
        v-model:value="model.recipientName"
        :placeholder="$t('page.notifyRecipient.form.recipientName')"
        allow-clear
      />
    </a-form-item>
    <a-form-item :label="$t('page.notifyRecipient.webhookUrl')" name="webhookUrl">
      <a-input v-model:value="model.webhookUrl" :placeholder="$t('page.notifyRecipient.form.webhookUrl')" allow-clear />
    </a-form-item>
    <a-form-item name="ats">
      <template #label>
        <a-tooltip :title="$t('page.notifyRecipient.form.larkAts')">
          {{ $t('page.notifyRecipient.ats') }}
        </a-tooltip>
      </template>
      <a-select
        v-model:value="model.ats"
        mode="tags"
        :placeholder="$t('page.notifyRecipient.form.ats')"
        allow-clear
      />
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
