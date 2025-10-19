<script setup lang="tsx">
import { ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { Tag, Tooltip, message } from 'ant-design-vue';
import { failStrategyOptions, taskTypeRecord, workFlowNodeStatusOptions } from '@/constants/business';
import type { Job } from '@/api/job/job';
import { useWorkflowStore } from '@/stores/workflow';
import { $t } from '@/locales';
import EditableInput from '@/components/common/editable-input.vue';

defineOptions({
  name: 'TaskDrawer'
});

interface Props {
  modelValue?: Workflow.ConditionNodeType;
  open?: boolean;
  len?: number;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  len: 0,
  modelValue: () => ({})
});

interface Emits {
  (e: 'update:open', open: boolean): void;
  (e: 'save', form: Workflow.ConditionNodeType): void;
}

const emit = defineEmits<Emits>();

const store = useWorkflowStore();
const drawer = ref<boolean>(false);
const form = ref<Workflow.ConditionNodeType>({});
const jobList = ref<Array<{
  id?: string;
  jobName?: string;
  executorInfo?: string;
  taskType?: number;
}>>([]);

watch(
  () => store.jobList,
  val => {
    jobList.value = val;
  },
  { immediate: true }
);

watch(
  () => props.open,
  val => {
    drawer.value = val;
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  val => {
    form.value = val;
  },
  { immediate: true }
);

const formRef = ref<FormInstance>();

const close = () => {
  emit('update:open', false);
  drawer.value = false;
};

const save = async () => {
  try {
    await formRef.value?.validate();
    close();
    emit('save', form.value);
  } catch (error) {
    message.warning('请检查表单信息');
  }
};

const rules = {
  failStrategy: [{ required: true, message: '请选择失败策略' }],
  workflowNodeStatus: [{ required: true, message: '请选择工作流状态' }],
  jobTask: {
    jobId: [{ required: true, message: '请选择任务' }]
  }
};

const jobTaskChange = (_: string, option: { jobName: string; labels: string }) => {
  form.value.jobTask!.jobName = option.jobName;
  form.value.jobTask!.labels = option.labels;
};

const renderTaskLabel = (option: Job) => {
  return (
    <div className="flex-y-center gap-6px">
      {option.taskType ? (
        <span className="tag-info">
          {$t(taskTypeRecord[option.taskType])}
        </span>
      ) : null}
      <span>{option.jobName}</span>
    </div>
  );
};
</script>

<template>
  <NDrawer v-model:show="drawer" display-directive="if" :width="500" @after-leave="close">
    <NDrawerContent>
      <template #header>
        <div class="w-460px flex-center">
          <EditableInput v-model="form.nodeName" class="mr-16px max-w-320px min-w-320px" />

          <NSelect
            v-model:value="form.priorityLevel"
            class="max-w-110px"
            :options="
              Array(len)
                .fill(0)
                .map((_, index) => {
                  return {
                    label: '优先级 ' + (index + 1),
                    value: index + 1
                  };
                })
            "
          />
        </div>
      </template>

      <NForm ref="formRef" :model="form" :rules="rules" label-align="left" label-width="100px">
        <NFormItem path="jobTask.jobId" label="所属任务" placeholder="请选择任务">
          <NSelect
            v-model:value="form.jobTask!.jobId"
            filterable
            :render-label="renderTaskLabel"
            label-field="jobName"
            value-field="id"
            :options="jobList"
            @update:value="jobTaskChange"
          />
        </NFormItem>
        <NFormItem path="failStrategy" label="失败策略">
          <NRadioGroup v-model:value="form.failStrategy">
            <NSpace>
              <NRadio
                v-for="(options, index) in failStrategyOptions"
                :key="index"
                :label="$t(options.label)"
                :value="options.value"
              />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem path="workflowNodeStatus" label="任务状态">
          <NRadioGroup v-model:value="form.workflowNodeStatus">
            <NSpace>
              <NRadio
                v-for="(options, index) in workFlowNodeStatusOptions"
                :key="index"
                :label="$t(options.label)"
                :value="options.value"
              />
            </NSpace>
          </NRadioGroup>
        </NFormItem>
      </NForm>

      <template #footer>
        <NButton type="primary" @click="save">保存</NButton>
        <NButton class="ml-12px" @click="close">取消</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
