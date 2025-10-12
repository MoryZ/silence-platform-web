<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { fetchAddWorkflow, fetchWorkflowInfo } from '@/api/job/workflow';
import Workflow from '@/components/workflow/workflow.vue';

const route = useRoute();
const router = useRouter();

const spinning = ref(false);

const id: string = String(route.query.id);

const node = ref<any>({
  workflowName: `Workflow ${new Date().getTime()}`,
  workflowStatus: 1,
  blockStrategy: 1,
  description: undefined,
  executorTimeout: 60
});

const getDetail = async () => {
  spinning.value = true;
  const { data, error } = await fetchWorkflowInfo(id);
  if (!error) {
    node.value = { ...data, workflowName: `Copy of ${data.workflowName}` };
  }
  spinning.value = false;
};

onMounted(() => {
  getDetail();
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
    :spinning="spinning"
    :disabled="false"
    @save="save" 
    @cancel="cancel" 
  />
</template>

<style scoped>
/* 使用 Workflow 组件的默认样式 */
</style>
