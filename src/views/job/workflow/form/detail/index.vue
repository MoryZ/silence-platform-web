<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { fetchWorkflowInfo } from '@/api/job/workflow';
import Workflow from '@/components/workflow/workflow.vue';
import { useWorkflowStore } from '@/stores/workflow';

const route = useRoute();
const store = useWorkflowStore();

const spinning = ref(false);

const id: string = String(route.query.id);

const node = ref<any>({});

const getDetail = async () => {
  spinning.value = true;
  store.setType(1); // 设置为查看模式
  const { data, error } = await fetchWorkflowInfo(id);
  if (!error) {
    node.value = data;
  }
  spinning.value = false;
};

onMounted(() => {
  getDetail();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getBlockStrategyText(strategy: number): string {
  const strategyMap: Record<number, string> = {
    1: '单机串行',
    2: '丢弃后续调度',
    3: '覆盖之前调度'
  };
  return strategyMap[strategy] || '未知';
}
</script>

<template>
  <Workflow 
    v-model="node" 
    :spinning="spinning"
    :disabled="true"
  />
</template>

<style scoped>
/* 使用 Workflow 组件的默认样式 */
</style>
