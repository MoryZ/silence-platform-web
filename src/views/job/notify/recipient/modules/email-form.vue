<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import { $t } from '@/locales';
import type { NotifyRecipient } from '@/types/job';

defineOptions({
  name: 'EmailForm'
});


interface EmailNotify {
  id?: any;
  recipientName: string;
  notifyType: number;
  tos: string[];
  description?: string;
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

type Model = Pick<EmailNotify, 'id' | 'recipientName' | 'notifyType' | 'tos' | 'description'>;
const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  const { tos } = JSON.parse(props.value.notifyAttribute || '{}') as { tos: string[] };
  return {
    id: props.value.id,
    recipientName: props.value.recipientName,
    notifyType: 2,
    tos: tos || [],
    description: props.value.description || ''
  };
}

type RuleKey = Extract<keyof Model, 'recipientName' | 'notifyType' | 'tos'>;

const rules: Record<RuleKey, any> = {
  recipientName: defaultRequiredRule,
  notifyType: defaultRequiredRule,
  tos: defaultRequiredRule
};

const buildNotifyAttribute = (tos: string[]) => {
  return JSON.stringify({ tos });
};

watch(
  model,
  () => {
    const { id, recipientName, notifyType, tos, description } = model;
    const notifyAttribute = buildNotifyAttribute(tos);
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
    <a-form-item :label="$t('page.notifyRecipient.tos')" name="tos">
      <a-select
        v-model:value="model.tos"
        mode="tags"
        :placeholder="$t('page.notifyRecipient.form.tos')"
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
