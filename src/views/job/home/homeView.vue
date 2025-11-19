<script setup lang="ts">
import { ref } from 'vue';
import CardData from './modules/card-data.vue';
import TaskTab from './modules/task-tab.vue';

const cardCount = ref({
  jobTask: {
    totalNum: 2039,
    successNum: 1314,
    failNum: 500,
    stopNum: 162,
    cancelNum: 63,
    successRate: 64.44
  },
  retryTask: {
    totalNum: 0,
    runningNum: 0,
    finishNum: 0,
    maxCountNum: 0,
    suspendNum: 0
  },
  workFlowTask: {
    totalNum: 492,
    successNum: 316,
    failNum: 158,
    stopNum: 15,
    cancelNum: 3,
    successRate: 64.23
  },
  retryTaskBarList: [
    { name: '成功', value: 9 },
    { name: '失败', value: 3 },
    { name: '停止', value: 2 },
    { name: '取消', value: 1 }
  ],
  onLineService: {
    total: 4,
    clientTotal: 2,
    serverTotal: 2
  }
});
</script>

<template>
  <div class="home-wrapper">
    <CardData v-model="cardCount" />
    <a-card bordered="false" class="home-panel">
      <TaskTab v-model="cardCount" />
    </a-card>
  </div>
</template>

<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.home-panel {
  padding: 24px;
  border-radius: 12px;
}
</style>
