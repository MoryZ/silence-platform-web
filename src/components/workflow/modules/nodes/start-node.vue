<script lang="ts" setup>
import { ref, watch } from 'vue';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { blockStrategyRecord, taskBatchStatusEnum } from '@/constants/business';
import { getJobPage } from '@/api/job/job';
import { $t } from '@/locales';
import { useWorkflowStore } from '@/stores/workflow';
const store = useWorkflowStore();

import StartDetail from '@/components/workflow/modules/detail/start-detail.vue';
import StartDrawer from '@/components/workflow/modules/drawer/start-drawer.vue';
import AddNode from './add-node.vue';

defineOptions({
  name: 'StartNode'
});

interface NodeDataType {
  id?: string;
  workflowName?: string;
  workflowStatus?: number;
  blockStrategy?: number;
  description?: string;
  executorTimeout?: number;
  wfContext?: string;
  nodeConfig?: any;
  [key: string]: any;
}

interface Props {
  modelValue?: NodeDataType;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: () => ({})
});

interface Emits {
  (e: 'update:modelValue', modelValue: NodeDataType): void;
}

const emit = defineEmits<Emits>();
const form = ref<NodeDataType>({});
const nodeData = ref<NodeDataType>({});

watch(
  () => props.modelValue,
  val => {
    nodeData.value = val;
  },
  { immediate: true }
);

watch(
  () => nodeData.value,
  val => {
    emit('update:modelValue', val);
  },
  { deep: true }
);

const fetchJobListByGroup = async (groupName?: string) => {
  if (!groupName) {
    store.setJobList([]);
    return;
  }

  try {
    const res: any = await getJobPage({
      groupName,
      jobName: '',
      jobStatus: '',
      ownerId: '',
      executorInfo: '',
      pageNo: 1,
      pageSize: 1000,
      sort: '-updatedDate'
    });

    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    store.setJobList(
      list.map((item: any) => ({
        id: item?.id,
        jobName: item?.jobName,
        executorInfo: item?.executorInfo,
        taskType: item?.taskType,
        labels: item?.labels
      }))
    );
  } catch {
    store.setJobList([]);
  }
};

watch(
  () => nodeData.value?.groupName,
  val => {
    fetchJobListByGroup(val);
  },
  { immediate: true }
);

const drawer = ref<boolean>(false);
const detailDrawer = ref<boolean>(false);

const save = (val: NodeDataType) => {
  nodeData.value = val;
};

const show = () => {
  // 禁用模式或查看模式都打开详情
  if (props.disabled || store.type !== 0) {
    detailDrawer.value = true;
    return;
  }
  // 编辑模式打开编辑抽屉
  form.value = JSON.parse(JSON.stringify(nodeData.value));
  drawer.value = true;
};

const triggerIntervalText = (data: NodeDataType) => {
  if (!data?.triggerInterval) return '-';
  return data.triggerType === 2 ? `${data.triggerInterval} 秒` : String(data.triggerInterval);
};

const wfContextText = (raw: any) => {
  if (!raw) return '-';

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return String(parsed);
  }

  const entries = Object.entries(parsed);
  if (!entries.length) return '-';

  const text = entries
    .slice(0, 2)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');

  return entries.length > 2 ? `${text} ...` : text;
};
</script>

<template>
  <div class="node-wrap">
    <div
      :class="`${disabled ? 'start-node-disabled' : 'node-wrap-box-hover'}`"
      class="node-wrap-box start-node"
      @click="show"
    >
      <div class="title">
        <span class="text">
          <a-badge dot :color="nodeData.workflowStatus === 1 ? '#52c41a' : '#ff000d'" />
          <span class="text-#ff943e">
            &nbsp;{{
              nodeData.workflowName ? `${nodeData.workflowName} ${nodeData.id ? ` (${nodeData.id})` : ''}` : '请选择组'
            }}
          </span>
        </span>
      </div>
      <div v-if="nodeData.groupName" class="content">
        <div>
          <span class="content_label">组名称:&nbsp;</span>
          {{ nodeData.groupName }}
        </div>
        <div>
          <span class="content_label">阻塞策略:&nbsp;</span>
          {{ $t(blockStrategyRecord[nodeData.blockStrategy!]) }}
        </div>
        <div>
          <span class="content_label">间隔时长:&nbsp;</span>
          {{ triggerIntervalText(nodeData) }}
        </div>
        <div>
          <span class="content_label">工作流上下文:&nbsp;</span>
          {{ wfContextText(nodeData.wfContext) }}
        </div>
      </div>
      <div v-else class="content min-h-85px">
        <span class="placeholder">请配置工作流</span>
      </div>
    </div>
    <AddNode v-model="nodeData.nodeConfig!" :disabled="disabled"></AddNode>
    <StartDetail v-model:open="detailDrawer" v-model="nodeData" />
    <StartDrawer v-model:open="drawer" v-model="form" @save="save" />
  </div>
</template>

<style scoped>
.content {
  line-height: 136%;
}
</style>
