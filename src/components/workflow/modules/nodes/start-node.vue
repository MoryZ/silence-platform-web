<script lang="ts" setup>
import { ref, watch } from 'vue';
import { blockStrategyRecord, taskBatchStatusEnum } from '@/constants/business';
import { $t } from '@/locales';
import StartDetail from '../detail/start-detail.vue';
import StartDrawer from '../drawer/start-drawer.vue';
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
  }
);

// 移除对 store 的依赖
// watch(
//   () => nodeData.value?.groupName,
//   val => {
//     if (val) {
//       store.setJobList(val);
//     }
//   },
//   { immediate: true }
// );

const drawer = ref<boolean>(false);
const detailDrawer = ref<boolean>(false);

const save = (val: NodeDataType) => {
  nodeData.value = val;
};

const show = () => {
  // 简化逻辑，直接显示编辑抽屉
  form.value = JSON.parse(JSON.stringify(nodeData.value));
  drawer.value = true;
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
          <a-typography-text class="max-w-132px" :ellipsis="{ tooltip: true }">
            <span class="content_label">组名称:&nbsp;</span>
            {{ nodeData.groupName }}
          </a-typography-text>
        </div>
        <div>
          <span class="content_label">阻塞策略:&nbsp;</span>
          {{ $t(blockStrategyRecord[nodeData.blockStrategy!]) }}
        </div>
        <div>.........</div>
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
