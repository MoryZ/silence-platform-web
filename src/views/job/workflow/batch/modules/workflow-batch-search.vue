<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
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
const workflowList = ref<any[]>([]);

const model = defineModel<any>('model', { required: true });
const keywords = ref<string>(model.value.workflowName as any);

const datetimeRangeProxy = computed<Dayjs[] | null>({
  get() {
    if (!Array.isArray(model.value.datetimeRange)) {
      return null;
    }
    const [start, end] = model.value.datetimeRange;
    return [start ? dayjs(start) : null, end ? dayjs(end) : null].filter(Boolean) as Dayjs[];
  },
  set(value) {
    if (!value) {
      model.value.datetimeRange = null;
      return;
    }
    model.value.datetimeRange = value.map(item => (item ? item.format('YYYY-MM-DD HH:mm:ss') : null));
  }
});

function reset() {
  keywords.value = '';
  emit('reset');
}

function search() {
  emit('search');
}

async function keywordsUpdate() {
  const res = await fetchGetWorkflowNameList({ keywords: keywords.value, groupName: model.value.groupName });
  workflowList.value = res.data as any[];
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

function translateOptions(options: any[]) {
  return options.map(option => ({
    value: option.id,
    label: option.workflowName
  }));
}

function renderLabel(option: any) {
  return [option.label as string, `(${option.value})`];
}
</script>

<template>
  <div class="search-panel">
    <a-form layout="inline" @submit.prevent="search">
      <a-form-item :label="$t('page.workflowBatch.groupName')" name="groupName">
        <a-input v-model:value="model.groupName" :placeholder="$t('page.workflowBatch.form.groupName')" allow-clear />
      </a-form-item>
      <a-form-item
        :label="$t('page.workflowBatch.workflowName')"
        name="workflowName"
      >
        <a-auto-complete
          v-model:value="keywords"
          :placeholder="$t('page.workflowBatch.form.workflowName')"
          :options="translateOptions(workflowList)"
          :empty-visible="noSearchFlag"
          allow-clear
          :filter-option="true"
          :render-label="renderLabel"
          @select="handleSelect"
        />
      </a-form-item>
      <a-form-item
        :label="$t('page.workflowBatch.taskBatchStatus')"
        name="taskBatchStatus"
      >
        <a-select v-model:value="model.taskBatchStatus" :placeholder="$t('page.workflowBatch.form.taskBatchStatus')" allow-clear>
          <a-select-option :value="1">运行中</a-select-option>
          <a-select-option :value="2">已完成</a-select-option>
          <a-select-option :value="3">已失败</a-select-option>
          <a-select-option :value="4">已停止</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item
        :label="$t('page.common.createTime')"
        name="datetimeRange"
      >
        <a-range-picker
          v-model:value="datetimeRangeProxy"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          :placeholder="[$t('common.startTime'), $t('common.endTime')]"
          style="width: 240px"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="search">{{ $t('common.search') }}</a-button>
        <a-button @click="reset">{{ $t('common.reset') }}</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped>
.search-panel {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
</style>
