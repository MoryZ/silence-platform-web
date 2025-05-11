<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SelectProps } from 'ant-design-vue';
import SelectGroup from '@/components/common/select-group.vue';
import DatetimeRange from '@/components/common/datetime-range.vue';
import { $t } from '@/locales';
import { fetchGetJobNameList } from '@/service/api';
import { taskBatchStatusRecordOptions } from '@/constants/business';
import { translateOptions } from '@/utils/common';

defineOptions({
  name: 'JobBatchSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const noSearchFlag = ref(false);

const emit = defineEmits<Emits>();

/** 定时任务列表 */
const jobList = ref<Api.Job.Job[]>([]);

const model = defineModel<Api.JobBatch.JobBatchSearchParams>('model', { required: true });
const keywords = ref<string>(model.value.jobName as string);

function reset() {
  keywords.value = '';
  emit('reset');
}

function search() {
  emit('search');
}

async function keywordsUpdate() {
  const res = await fetchGetJobNameList({ keywords: keywords.value, groupName: model.value.groupName });
  jobList.value = res.data as Api.Job.Job[];
}

function handleSelect(value: string) {
  model.value.jobId = value;
}

watch(
  () => keywords.value,
  (value: string) => {
    if (value.length !== 0) {
      keywordsUpdate();
      model.value.jobName = value;
    } else {
      noSearchFlag.value = false;
      model.value.jobId = null;
      model.value.jobName = null;
    }
  }
);

function translateJobOptions(options: Api.Job.Job[]) {
  return options.map(option => ({
    value: option.id,
    label: option.jobName
  }));
}

function renderLabel(option: SelectProps['options'][number]) {
  return [option.label as string, `(${option.value})`];
}
</script>

<template>
  <SearchForm btn-span="12 s:24 m:10 l:12 xl:16" :model="model" @search="search" @reset="reset">
    <a-form-item :label="$t('page.jobBatch.groupName')" name="groupName" class="pr-24px">
      <SelectGroup v-model:value="model.groupName" allowClear />
    </a-form-item>
    <a-form-item :label="$t('page.jobBatch.jobName')" name="jobName" class="pr-24px">
      <a-auto-complete
        v-model:value="keywords"
        :placeholder="$t('page.jobBatch.form.jobName')"
        :options="translateJobOptions(jobList)"
        :empty-visible="noSearchFlag"
        allowClear
        :filter-option="true"
        :render-label="renderLabel"
        @select="handleSelect"
      />
    </a-form-item>
    <a-form-item :label="$t('page.jobBatch.taskBatchStatus')" name="taskBatchStatus" class="pr-24px">
      <a-select
        v-model:value="model.taskBatchStatus"
        mode="multiple"
        max-tag-count="responsive"
        :placeholder="$t('common.taskBatchStatus.form')"
        :options="
          translateOptions(taskBatchStatusRecordOptions).filter(item => ![98, 99].includes(item.value as number))
        "
        allowClear
      />
    </a-form-item>
    <a-form-item
      :label="$t('page.common.createTime')"
      name="datetimeRange"
      class="pr-24px"
    >
      <DatetimeRange v-model:value="model.datetimeRange!" />
    </a-form-item>
  </SearchForm>
</template>

<style scoped></style>
