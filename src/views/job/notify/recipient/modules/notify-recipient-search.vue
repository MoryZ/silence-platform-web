<script setup lang="ts">
import { $t } from '@/locales';
import { alarmTypeRecordOptions } from '@/constants/business';
import { translateOptions } from '@/utils/common';

defineOptions({
  name: 'NotifyRecipientSearch'
});

// 定义类型接口
interface NotifyRecipientParams {
  recipientName?: string;
  notifyType?: number;
}

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<NotifyRecipientParams>('model', { required: true });

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <SearchPanel :model="model" @search="search" @reset="reset">
    <a-form-item
      :label="$t('page.notifyRecipient.recipientName')"
      name="recipientName"
      class="pr-24px"
    >
      <a-input
        v-model:value="model.recipientName"
        :placeholder="$t('page.notifyRecipient.form.recipientName')"
        allow-clear
      />
    </a-form-item>
    <a-form-item :label="$t('page.notifyRecipient.notifyType')" name="notifyType" class="pr-24px">
      <a-select
        v-model:value="model.notifyType"
        :options="translateOptions(alarmTypeRecordOptions)"
        :placeholder="$t('page.notifyRecipient.notifyType')"
        allow-clear
      />
    </a-form-item>
  </SearchPanel>
</template>

<style scoped></style>
