<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { fetchAddWorkflow } from '@/api/job/workflow';
import Workflow from '@/components/workflow/workflow.vue';

const router = useRouter();

const node = ref<any>({
  workflowName: `WF-${new Date().getTime()}`,
  workflowStatus: 1,
  blockStrategy: 1,
  description: undefined,
  executorTimeout: 60,
  wfContext: '{"init":""}'
});

onMounted(() => {
  // 初始化工作流数据
});

const save = async () => {
  const { error } = await fetchAddWorkflow(node.value);
  if (!error) {
    message.success($t('common.addSuccess'));
    router.push('/workflow/task');
  }
};

const cancel = () => {
  router.push('/workflow/task');
};
</script>

<template>
  <Workflow 
    v-model="node" 
    :spinning="false"
    :disabled="false"
    @save="save" 
    @cancel="cancel" 
  />
</template>

<style scoped>
/* 使用 Workflow 组件的默认样式 */
</style>
