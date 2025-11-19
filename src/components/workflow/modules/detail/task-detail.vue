<script setup lang="ts">
import { ref, watch } from 'vue';
import { failStrategyRecord, workFlowNodeStatusRecord } from '@/constants/business';
import { useWorkflowStore } from '@/stores/workflow';
import { $t } from '@/locales';

defineOptions({
  name: 'TaskDetail'
});

interface Props {
  modelValue?: Workflow.ConditionNodeType;
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  modelValue: () => ({})
});

interface Emits {
  (e: 'update:open', open: boolean): void;
}

const emit = defineEmits<Emits>();

const store = useWorkflowStore();
const visible = ref(false);

watch(
  () => props.open,
  val => {
    visible.value = val;
  },
  { immediate: true }
);

const onClose = () => {
  emit('update:open', false);
};

const getTaskName = (id: string) => {
  const jobList: { id?: string; jobName?: string }[] = store.jobList;
  return jobList.find(item => item.id === id)?.jobName;
};
</script>

<template>
<a-drawer v-model:open="visible" width="500px" title="任务详情" @after-open-change="(open) => !open && onClose()">
    <NDescriptions :column="1" label-placement="left" bordered :label-style="{ width: '120px' }">
      <NDescriptionsItem label="节点名称">{{ modelValue.nodeName }}</NDescriptionsItem>
      <NDescriptionsItem label="任务 ID">{{ modelValue.jobTask?.jobId }}</NDescriptionsItem>
      <NDescriptionsItem label="任务名称">{{ getTaskName(modelValue.jobTask?.jobId!) }}</NDescriptionsItem>
      <NDescriptionsItem label="失败策略">
        {{ $t(failStrategyRecord[modelValue.failStrategy!]) }}
      </NDescriptionsItem>
      <NDescriptionsItem label="任务状态">
        {{ $t(workFlowNodeStatusRecord[modelValue.workflowNodeStatus!]) }}
      </NDescriptionsItem>
    </NDescriptions>
</a-drawer>
</template>

<style scoped lang="scss"></style>
