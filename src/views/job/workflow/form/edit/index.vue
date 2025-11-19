<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { fetchUpdateWorkflow, fetchWorkflowInfo } from '@/api/job/workflow';
import Workflow from '@/components/workflow/workflow.vue';

const route = useRoute();
const router = useRouter();

const spinning = ref(false);

const id: string = String(route.query.id);

const node = ref<any>({});

const getDetail = async () => {
  spinning.value = true;
  const { data, error } = await fetchWorkflowInfo(id);
  if (!error) {
    node.value = data;
  }
  spinning.value = false;
};

onMounted(() => {
  getDetail();
});

const closePage = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.replace('/workflow/task');
  }
};

const update = async () => {
  const { error } = await fetchUpdateWorkflow(node.value);
  if (!error) {
    message.success($t('common.updateSuccess'));
    closePage();
  }
};

const cancel = () => {
  closePage();
};
</script>

<template>
  <Workflow 
    v-model="node" 
    :spinning="spinning"
    :disabled="false"
    @save="update" 
    @cancel="cancel" 
  />
</template>

<style scoped>
/* 使用 Workflow 组件的默认样式 */
</style>
