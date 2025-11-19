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
    workflowStatus: 1,
    blockStrategy: 1,
    description: undefined,
    executorTimeout: 60,
    wfContext: '{"init":""}'
  };
}

async function loadDetail() {
  if (!props.recordId) {
    formModel.value = {};
    return;
  }
  spinning.value = true;
  const { data, error } = await fetchWorkflowInfo(props.recordId);
  if (!error && data) {
    if (props.mode === 'copy') {
      formModel.value = {
        ...data,
        workflowName: `Copy of ${data.workflowName}`
      };
    } else {
      formModel.value = data;
    }
  }
  spinning.value = false;
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
  saving.value = true;
  let result;
  if (props.mode === 'add' || props.mode === 'copy') {
    result = await fetchAddWorkflow(formModel.value);
  } else {
    result = await fetchUpdateWorkflow(formModel.value);
  }
  saving.value = false;
  if (!result?.error) {
    const successMsg =
      props.mode === 'edit' ? $t('common.updateSuccess') : $t('common.addSuccess');
    message.success(successMsg);
    emit('submitted');
    handleClose();
  }
}
</script>

<template>
  <a-drawer
    :open="visible"
    :width="1100"
    :title="drawerTitle"
    destroy-on-close
    @close="handleClose"
  >
    <Workflow
      v-model="formModel"
      :spinning="spinning || saving"
      :disabled="isDetail"
      @save="handleSave"
      @cancel="handleClose"
    />
  </a-drawer>
</template>

