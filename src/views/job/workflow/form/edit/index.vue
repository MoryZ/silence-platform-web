<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Workflow from '@/components/workflow';
import { $t } from '@/locales';
import { useWorkflowStore } from '@/store/modules/workflow';
import { fetchUpdateWorkflow, fetchWorkflowInfo } from '@/service/api';

const store = useWorkflowStore();
const route = useRoute();
const router = useRouter();

const spinning = ref(false);

const id: string = String(route.query.id);

const node = ref<Workflow.NodeDataType>({});

const getDetail = async () => {
  spinning.value = true;
  const { data, error } = await fetchWorkflowInfo(id);
  if (!error) {
    node.value = data;
  }
  spinning.value = false;
};

onMounted(() => {
  store.clear();
  store.setType(0);
  store.setId(id);
  getDetail();
});

const update = async () => {
  const { error } = await fetchUpdateWorkflow(node.value);
  if (!error) {
    window.$message?.info($t('common.updateSuccess'));
    router.push({ path: '/workflow/task' });
  }
};

const cancel = () => {
  router.push('/workflow/task');
};
</script>

<template>
  <Workflow v-model="node" :spinning="spinning" @save="update" @cancel="cancel" />
</template>

<style scoped></style>
