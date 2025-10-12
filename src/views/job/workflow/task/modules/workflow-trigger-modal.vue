<script setup lang="ts">
import { reactive, watch } from 'vue';
import { message } from 'ant-design-vue';
import { $t } from '@/locales';
import { fetchTriggerWorkflowParams } from '@/api/job/workflow';
import { parseContent, stringToContent } from '@/utils/common';

defineOptions({
  name: 'WorkflowTriggerModal'
});

interface Props {
  /** the edit row data */
  rowData?: any | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

type Model = {
  workflowId?: string;
  tmpWfContext?: string;
  wfContexts: { key: string; value: string | number | boolean; type: string }[];
};

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    workflowId: props.rowData?.id,
    tmpWfContext: '',
    wfContexts: []
  };
}

function handleUpdateModelWhenEdit() {
  const rowData = props.rowData;
  if (!rowData) {
    Object.assign(model, createDefaultModel());
    return;
  }

  const wfContext = rowData?.wfContext;
  if (wfContext) {
    model.wfContexts = stringToContent(rowData?.wfContext) || [];
  }
}

function closeDrawer() {
  visible.value = false;
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
  }
});

function addContext() {
  model.wfContexts.push({
    key: '',
    value: '',
    type: 'string'
  });
}

function removeContext(index: number) {
  model.wfContexts.splice(index, 1);
}

async function handleSubmit() {
  const tmpWfContext = JSON.stringify(parseContent(model.wfContexts) || {});
  const { error } = await fetchTriggerWorkflowParams({ workflowId: props.rowData?.id, tmpWfContext });
  if (error) return;

  message.success($t('common.executeSuccess'));

  closeDrawer();
  emit('submitted');
}
</script>

<template>
  <a-modal
    v-model:open="visible"
    title="执行工作流"
    width="600px"
    :footer="null"
  >
    <a-form :model="model" layout="vertical">
      <a-form-item label="工作流上下文">
        <div class="context-input">
          <div v-for="(item, index) in model.wfContexts" :key="index" class="context-item">
            <a-input
              v-model:value="item.key"
              placeholder="键"
              style="width: 30%; margin-right: 8px"
            />
            <a-input
              v-model:value="item.value"
              placeholder="值"
              style="width: 30%; margin-right: 8px"
            />
            <a-select
              v-model:value="item.type"
              placeholder="类型"
              style="width: 20%; margin-right: 8px"
            >
              <a-select-option value="string">字符串</a-select-option>
              <a-select-option value="number">数字</a-select-option>
              <a-select-option value="boolean">布尔</a-select-option>
            </a-select>
            <a-button type="link" danger @click="removeContext(index)">删除</a-button>
          </div>
          <a-button type="dashed" @click="addContext" style="width: 100%">
            添加上下文
          </a-button>
        </div>
      </a-form-item>
    </a-form>
    
    <template #footer>
      <div style="text-align: right">
        <a-button @click="closeDrawer" style="margin-right: 8px">
          {{ $t('common.cancel') }}
        </a-button>
        <a-button type="primary" @click="handleSubmit">
          执行
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<style scoped>
.context-input {
  width: 100%;
}

.context-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
