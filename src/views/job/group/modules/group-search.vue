<script setup lang="ts">
import { $t } from '@/locales';
import { translateOptions } from '@/utils/common';
import { groupConfigStatusOptions } from '@/constants/business';

defineOptions({
  name: 'GroupSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.GroupConfig.GroupConfigSearchParams>('model', { required: true });

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <SearchForm :model="model" @search="search" @reset="reset">
    <a-col :span="24" :sm="12" :md="6" class="pr-24px">
      <a-form-item :label="$t('page.groupConfig.groupName')" name="groupName">
        <a-input v-model:value="model.groupName" :placeholder="$t('page.groupConfig.form.groupName')" allow-clear />
      </a-form-item>
    </a-col>
    <a-col :span="24" :sm="12" :md="6" class="pr-24px">
      <a-form-item :label="$t('page.groupConfig.groupStatus')" name="groupStatus">
        <a-select
          v-model:value="model.groupStatus"
          :placeholder="$t('page.groupConfig.form.groupStatus')"
          :options="translateOptions(groupConfigStatusOptions)"
          allow-clear
        />
      </a-form-item>
    </a-col>
  </SearchForm>
</template>

<style scoped></style>
