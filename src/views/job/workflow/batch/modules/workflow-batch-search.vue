<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SelectProps } from 'ant-design-vue';
import { $t } from '@/locales';

import { fetchGetWorkflowNameList } from '@/api/job/workflow';

defineOptions({
  name: 'WorkflowBatchSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}
const noSearchFlag = ref(false);

const emit = defineEmits<Emits>();
/** 工作流列表 */
const workflowList = ref<Api.Workflow.Workflow[]>([]);

const model = defineModel<Api.WorkflowBatch.WorkflowBatchSearchParams>('model', { required: true });
const keywords = ref<string>(model.value.workflowName as any);

function reset() {
  keywords.value = '';
  emit('reset');
}

function search() {
  emit('search');
}

async function keywordsUpdate() {
  const res = await fetchGetWorkflowNameList({ keywords: keywords.value, groupName: model.value.groupName });
  workflowList.value = res.data as Api.Workflow.Workflow[];
}

function handleSelect(value: number) {
  model.value.workflowId = value;
}

watch(
  () => keywords.value,
  (value: string) => {
    if (value.length !== 0) {
      keywordsUpdate();
    } else {
      noSearchFlag.value = false;
    }
  }
);

function translateOptions(options: Api.Workflow.Workflow[]) {
  return options.map(option => ({
    value: option.id,
    label: option.workflowName
  }));
}

function renderLabel(option: SelectProps['options'][number]) {
  return [option.label as string, `(${option.value})`];
}
</script>

<template>
  <SearchForm btn-span="12 s:24 m:10 l:12 xl:16" :model="model" @search="search" @reset="reset">
    <a-form-item :label="$t('page.workflowBatch.groupName')" name="groupName" class="pr-24px">
      <SelectGroup v-model:value="model.groupName" allowClear />
    </a-form-item>
    <a-form-item
      :label="$t('page.workflowBatch.workflowName')"
      :label-width="100"
      name="workflowName"
      class="pr-24px"
    >
      <a-auto-complete
        v-model:value="keywords"
        :placeholder="$t('page.workflowBatch.form.workflowName')"
        :options="translateOptions(workflowList)"
        :empty-visible="noSearchFlag"
        allowClear
        :filter-option="true"
        :render-label="renderLabel"
        @select="handleSelect"
      />
    </a-form-item>
    <a-form-item
      :label="$t('page.workflowBatch.taskBatchStatus')"
      name="taskBatchStatus"
      class="pr-24px"
    >
      <TaskBatchStatus v-model:value="model.taskBatchStatus" allowClear />
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
