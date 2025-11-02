<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ReloadOutlined, DownOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
import { fetchWorkflowBatchInfo } from '@/api/job/workflow';
import Workflow from '@/components/workflow/workflow.vue';

const route = useRoute();

const spinning = ref(false);
const id: string = String(route.query.id);
const node = ref<any>({});
const syncTime = ref(0);
const interval = ref<NodeJS.Timeout>();
const controller = new AbortController();
const finished = ref<boolean>(true);

const pauseBatch = () => {
  finished.value = true;
  controller.abort();
  clearTimeout(interval.value);
  interval.value = undefined;
};

const stopBatch = () => {
  if (!finished.value) controller.abort();
  pauseBatch();
  node.value = {};
};

const getBatchDetail = async () => {
  spinning.value = true;
  const { data, error } = await fetchWorkflowBatchInfo(id);
  if (!error) {
    node.value = data;
    finished.value = !(data.workflowBatchStatus && [1, 2].includes(data.workflowBatchStatus)) || syncTime.value === 0;
    if (!finished.value && syncTime.value !== 0) {
      clearTimeout(interval.value);
      interval.value = setTimeout(getBatchDetail, syncTime.value * 1000);
    }
  } else if (error?.code !== 'ERR_CANCELED') {
    stopBatch();
  }
  spinning.value = false;
};

const handleSyncSelect = async (time: number) => {
  if (time === -1) {
    if (finished.value) {
      finished.value = false;
      await getBatchDetail();
    }
    return;
  }

  syncTime.value = time;

  if (time === 0) {
    pauseBatch();
    return;
  }

  finished.value = false;
  await getBatchDetail();
};

onMounted(() => {
  getBatchDetail();
});

onBeforeUnmount(() => {
  stopBatch();
});

const syncOptions = ref([
  {
    label: 'Auto(off)',
    key: 0
  },
  {
    label: '1s',
    key: 1
  },
  {
    label: '5s',
    key: 5
  },
  {
    label: '10s',
    key: 10
  },
  {
    label: '30s',
    key: 30
  },
  {
    label: '1m',
    key: 60
  },
  {
    label: '5m',
    key: 300
  }
]);

function getBatchStatusColor(status: number): string {
  const colorMap: Record<number, string> = {
    1: 'blue',
    2: 'green',
    3: 'green',
    4: 'red',
    5: 'orange',
    6: 'orange'
  };
  return colorMap[status] || 'default';
}

function getBatchStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    1: '运行中',
    2: '已完成',
    3: '已完成',
    4: '已失败',
    5: '已停止',
    6: '已停止'
  };
  return statusMap[status] || '未知';
}
</script>

<template>
  <Workflow 
    v-model="node" 
    :spinning="spinning"
    :disabled="true"
  >
    <template #buttons>
      <!-- 控制栏 -->
      <div class="control-bar">
        <a-dropdown :trigger="['hover']" @select="handleSyncSelect">
          <a-button dashed @click="handleSyncSelect(-1)">
            <template #icon>
              <ReloadOutlined />
            </template>
            {{ syncOptions.find(item => item.key === syncTime)?.label }}
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="(e: any) => handleSyncSelect(Number(e.key))">
              <a-menu-item v-for="option in syncOptions" :key="option.key">
                {{ option.label }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        
        <a-tooltip v-if="finished" title="流程批次加载完成">
          <CheckCircleOutlined style="color: #52c41a; font-size: 24px; margin-left: 16px;" />
        </a-tooltip>
        <a-tooltip v-else title="流程批次正在加载">
          <a-spin size="small" style="margin-left: 16px;" />
        </a-tooltip>
      </div>
    </template>
  </Workflow>
</template>

<style scoped>
.control-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
</style>
