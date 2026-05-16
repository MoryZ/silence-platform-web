<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { $t } from '@/locales';
import { enableStatusNumberOptions } from '@/constants/business';
import { getAllGroupConfigs } from '@/api/job/group';

defineOptions({
  name: 'WorkflowSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<any>('model', { required: true });

type SelectOption = { label: string; value: string };
const groupOptions = ref<SelectOption[]>([]);

const ensureOptionShape = (
  list: any[],
  labelResolver: (item: any) => string,
  valueResolver: (item: any) => string
): SelectOption[] => {
  return (list || []).map(item => ({
    label: labelResolver(item),
    value: valueResolver(item)
  }));
};

async function getGroupOptions() {
  const res: any = await getAllGroupConfigs();
  const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  groupOptions.value = ensureOptionShape(
    raw,
    item => item?.label ?? item?.groupName ?? item?.name ?? String(item?.value ?? item?.id ?? ''),
    item => String(item?.value ?? item?.groupName ?? item?.id ?? item?.name ?? '')
  );
}

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}

onMounted(() => {
  getGroupOptions();
});
</script>

<template>
  <div class="search-panel">
    <a-form layout="inline" @submit.prevent="search">
      <a-form-item :label="$t('page.workflow.groupName')" name="groupName">
        <a-select
          v-model:value="model.groupName"
          :placeholder="$t('page.workflow.form.groupName')"
          :options="groupOptions"
          allow-clear
          show-search
          :filter-option="(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())"
          style="width: 300px"
        />
      </a-form-item>
      <a-form-item
        :label="$t('page.workflow.workflowName')"
        name="workflowName"
      >
        <a-input v-model:value="model.workflowName" :placeholder="$t('page.workflow.form.workflowName')" allow-clear />
      </a-form-item>
      <a-form-item :label="$t('page.workflow.workflowStatus')" name="workflowStatus">
        <a-select
          v-model:value="model.workflowStatus"
          :placeholder="$t('page.workflow.form.workflowStatus')"
          allow-clear
        >
          <a-select-option :value="0">{{ $t('common.status.disable') }}</a-select-option>
          <a-select-option :value="1">{{ $t('common.status.enable') }}</a-select-option>
        </a-select>
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
