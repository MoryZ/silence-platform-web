<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import Workflow from '@/components/workflow/workflow.vue';
import { fetchAddWorkflow, fetchUpdateWorkflow, fetchWorkflowInfo } from '@/api/job/workflow';
import { $t } from '@/locales';

type FormMode = 'add' | 'edit' | 'detail' | 'copy';

const props = defineProps<{
  mode: FormMode;
  recordId?: string | null;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}>();

const spinning = ref(false);
const saving = ref(false);
const formModel = ref<any>({});

const drawerTitle = computed(() => {
  const workflowLabel = $t('page.workflow.workflowName') || $t('page.workflow.workflow') || '工作流';
  switch (props.mode) {
    case 'add':
      return `${$t('common.add')} ${workflowLabel}`;
    case 'edit':
      return `${$t('common.edit')} ${workflowLabel}`;
    case 'detail':
      return `${$t('common.detail')} ${workflowLabel}`;
    case 'copy':
      return `${$t('common.copy')} ${workflowLabel}`;
    default:
      return workflowLabel;
  }
});
const isDetail = computed(() => props.mode === 'detail');

function defaultNode() {
  return {
    workflowName: `WF-${Date.now()}`,
    groupName: undefined,
    triggerType: 2,
    triggerInterval: '60',
    workflowStatus: 1,
    blockStrategy: 1,
    description: undefined,
    ownerId: undefined,
    notifyIds: [],
    executorTimeout: 60,
    wfContext: '{"init":""}',
    wfContexts: [{ key: 'init', value: '', type: 'string' }]
  };
}

function normalizeNodeConfig(node: any): any {
  if (!node || typeof node !== 'object') {
    return node;
  }

  if (Array.isArray(node.conditionNodes)) {
    node.conditionNodes = node.conditionNodes.map((item: any) => {
      const normalizedItem = { ...item };
      if (typeof normalizedItem.workflowNodeStatus === 'boolean') {
        normalizedItem.workflowNodeStatus = Number(normalizedItem.workflowNodeStatus);
      }
      if (normalizedItem.childNode) {
        normalizedItem.childNode = normalizeNodeConfig(normalizedItem.childNode);
      }
      return normalizedItem;
    });
  }

  if (node.childNode) {
    node.childNode = normalizeNodeConfig(node.childNode);
  }

  return node;
}

function normalizeWorkflowDetail(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const normalized = {
    ...raw
  } as any;

  if (typeof normalized.workflowStatus === 'boolean') {
    normalized.workflowStatus = Number(normalized.workflowStatus);
  }

  if (normalized.nodeConfig) {
    normalized.nodeConfig = normalizeNodeConfig(JSON.parse(JSON.stringify(normalized.nodeConfig)));
  }

  return normalized;
}

async function loadDetail() {
  if (!props.recordId) {
    formModel.value = {};
    return;
  }
  spinning.value = true;
  try {
    const response: any = await fetchWorkflowInfo(props.recordId);
    const data = normalizeWorkflowDetail(response?.data ?? response);
    if (data) {
      if (props.mode === 'copy') {
        formModel.value = {
          ...data,
          workflowName: `Copy of ${data.workflowName}`
        };
      } else {
        formModel.value = data;
      }
    }
  } finally {
    spinning.value = false;
  }
}

function initForm() {
  if (!props.visible) {
    return;
  }
  if (props.mode === 'add') {
    formModel.value = defaultNode();
    return;
  }
  loadDetail();
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      initForm();
    }
  }
);

watch(
  () => props.mode,
  () => {
    if (props.visible) {
      initForm();
    }
  }
);

watch(
  () => props.recordId,
  () => {
    if (props.visible && props.mode !== 'add') {
      initForm();
    }
  }
);

function handleClose() {
  emit('update:visible', false);
}

async function handleSave() {
  if (isDetail.value) {
    handleClose();
    return;
  }
  if (!formModel.value?.nodeConfig) {
    message.warning('DAG 节点不能为空，请先添加至少一个节点');
    return;
  }

  saving.value = true;
  try {
    let result;
    if (props.mode === 'add' || props.mode === 'copy') {
      result = await fetchAddWorkflow(formModel.value);
    } else {
      result = await fetchUpdateWorkflow(formModel.value);
    }

    if (!result?.error) {
      const successMsg = props.mode === 'edit' ? $t('common.updateSuccess') : $t('common.addSuccess');
      message.success(successMsg);
      emit('submitted');
      handleClose();
    }
  } catch (error: any) {
    message.error(error?.message || '保存失败，请检查 DAG 节点配置');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <a-modal
    :open="visible"
    :title="drawerTitle"
    :width="'calc(100vw - 120px)'"
    wrap-class-name="workflow-form-modal"
    :footer="null"
    centered
    destroy-on-close
    @cancel="handleClose"
  >
    <Workflow
      v-model="formModel"
      :spinning="spinning || saving"
      :disabled="isDetail"
      @save="handleSave"
      @cancel="handleClose"
    />
  </a-modal>
</template>

<style lang="scss">
.workflow-form-modal {
  .ant-modal {
    max-width: none;
  }

  .ant-modal-content {
    height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
  }

  .ant-modal-body {
    flex: 1;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }
}
</style>

