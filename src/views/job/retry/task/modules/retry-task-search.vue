<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'RetryLogSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.RetryTask.RetryTaskSearchParams>('model', { required: true });

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <SearchForm btn-span="12 s:24 m:10 l:12 xl:16" :model="model" @search="search" @reset="reset">
    <a-col :span="24" :sm="12" :md="6" class="pr-24px">
      <a-form-item :label="$t('page.retryTask.groupName')" name="groupName">
        <SelectGroup v-model:value="model.groupName" allow-clear />
      </a-form-item>
    </a-col>
    <a-col :span="24" :sm="12" :md="6" class="pr-24px">
      <a-form-item :label="$t('page.retryTask.sceneName')" name="sceneName">
        <SelectScene v-model:value="model.sceneName" :group-name="model.groupName as string" allow-clear />
      </a-form-item>
    </a-col>
    <a-col :span="24" :sm="12" :md="6" class="pr-24px">
      <a-form-item :label="$t('page.retryTask.retryId')" name="bizNo">
        <a-input v-model:value="model.retryId" :placeholder="$t('page.retryTask.form.retryId')" allow-clear />
      </a-form-item>
    </a-col>
    <a-col :span="24" :sm="12" :md="6" class="pr-24px">
      <a-form-item :label="$t('page.retry.retryStatus')" name="retryStatus">
        <a-select
          v-model:value="model.taskStatus"
          :placeholder="$t('page.retry.form.retryStatus')"
          :options="translateOptions(retryTaskStatusTypeOptions)"
          allow-clear
        />
      </a-form-item>
    </a-col>
    <a-col :span="24" :sm="24" :md="15" :lg="12" :xl="9" class="pr-24px">
      <a-form-item :label="$t('page.common.createTime')" name="datetimeRange">
        <DatetimeRange v-model:value="model.datetimeRange" />
      </a-form-item>
    </a-col>
  </SearchForm>
</template>

<style scoped></style>
