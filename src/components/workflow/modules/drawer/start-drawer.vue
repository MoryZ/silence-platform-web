<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import {
  blockStrategyRecordOptions,
  workflowTriggerTypeOptions as triggerTypeOptions,
  workFlowNodeStatusOptions
} from '@/constants/business';
import { fetchAllGroupName } from '@/api/job/dashboard';
import { fetchGetNotifyConfigSystemTaskTypeList } from '@/api/job/notify';
import { fetchSystemUser } from '@/api/job/systemUser';
import { useWorkflowStore } from '@/stores/workflow';
import { isNotNull, parseContent, stringToContent, type Option } from '@/utils/common';
import { $t } from '@/locales';
import EditableInput from '@/components/common/editable-input.vue';
import JobTriggerInterval from '@/components/common/job-trigger-interval.vue';
import DynamicInput from '@/components/common/dynamic-input.vue';

defineOptions({
  name: 'StartDrawer'
});

interface Props {
  modelValue?: Workflow.NodeDataType;
  open?: boolean;
}

type SelectOption = { label: string; value: string | number };

const notifyNameList = ref<SelectOption[]>([]);
const ownerOptions = ref<SelectOption[]>([]);
const props = withDefaults(defineProps<Props>(), {
  open: false,
  modelValue: () => ({
    wfContexts: []
  })
});

interface Emits {
  (e: 'update:open', open: boolean): void;
  (e: 'save', form: Workflow.NodeDataType): void;
}

onMounted(() => {
  nextTick(() => {
    getNotifyConfigSystemTaskTypeList();
  });
  getOwnerOptions();
});

const ensureOptionShape = (
  list: any[],
  labelResolver: (item: any) => string,
  valueResolver: (item: any) => string | number
): SelectOption[] => {
  return (list || []).map(item => ({
    label: labelResolver(item),
    value: valueResolver(item)
  }));
};

const generateWorkflowName = () => `WF-${Date.now()}`;

const normalizeWorkflowForm = (input: Workflow.NodeDataType) => {
  const normalized: Workflow.NodeDataType = {
    ...input
  };

  if (!normalized.workflowName) {
    normalized.workflowName = generateWorkflowName();
  }

  normalized.triggerType = Number(normalized.triggerType || 2);

  if (!normalized.triggerInterval) {
    normalized.triggerInterval = normalized.triggerType === 3 ? '* * * * * ?' : '60';
  }

  normalized.executorTimeout = Number(normalized.executorTimeout || 60);

  normalized.blockStrategy = Number(normalized.blockStrategy || 1);

  normalized.workflowStatus = Number(
    normalized.workflowStatus === undefined || normalized.workflowStatus === null ? 1 : normalized.workflowStatus
  );

  if (!Array.isArray(normalized.notifyIds)) {
    normalized.notifyIds = [];
  }

  if (normalized.wfContext) {
    normalized.wfContexts = stringToContent(normalized.wfContext);
  }

  if (!Array.isArray(normalized.wfContexts) || normalized.wfContexts.length === 0) {
    normalized.wfContexts = [{ key: 'init', value: '', type: 'string' }];
  }

  return normalized;
};

async function getNotifyConfigSystemTaskTypeList() {
  const res = await fetchGetNotifyConfigSystemTaskTypeList(4);
  const list = (res?.data ?? res ?? []) as any[];
  notifyNameList.value = ensureOptionShape(
    list,
    item => item?.notifyName ?? item?.label ?? item?.name ?? String(item?.value ?? item?.id ?? ''),
    item => item?.id ?? item?.value ?? item?.notifyName ?? ''
  );
}

async function getOwnerOptions() {
  const res: any = await fetchSystemUser();
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  ownerOptions.value = ensureOptionShape(
    list,
    item => item?.label ?? item?.name ?? item?.username ?? item?.nickname ?? String(item?.value ?? item?.id ?? ''),
    item => String(item?.value ?? item?.id ?? item?.userId ?? item?.username ?? item?.name ?? '')
  );
}
const emit = defineEmits<Emits>();

const store = useWorkflowStore();

let title: string = '';
const drawer = ref<boolean>(false);
const form = ref<Workflow.NodeDataType>({
  wfContexts: [],
  notifyIds: []
});
const groupNameList = ref<any[]>([]);
const groupOptions = computed(() =>
  (groupNameList.value || []).map(item => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    if (typeof item === 'object' && item !== null) {
      const label =
        item.label ??
        item.groupName ??
        item.name ??
        item.value ??
        (item.id ? String(item.id) : '');
      // 统一使用组名称作为表单值，避免页面回显出现 id
      return { label, value: label };
    }
    const str = String(item);
    return { label: str, value: str };
  })
);

const normalizeGroupNameToLabel = () => {
  const current = form.value.groupName;
  if (!current || !groupOptions.value.length) return;

  const matched = groupOptions.value.find(
    option => option.label === current || String(option.value) === String(current)
  );

  if (matched) {
    form.value.groupName = matched.label;
  }
};

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
    form.value = normalizeWorkflowForm(val || {});
    normalizeGroupNameToLabel();
    title = form.value.workflowName || form.value.groupName || '请选择组';
  },
  { immediate: true }
);

watch(
  groupOptions,
  () => {
    normalizeGroupNameToLabel();
  },
  { immediate: true }
);

watch(
  () => form.value.triggerType,
  value => {
    if (!value) return;
    if (value === 2 && !form.value.triggerInterval) {
      form.value.triggerInterval = '60';
    }
    if (value === 3 && !form.value.triggerInterval) {
      form.value.triggerInterval = '* * * * * ?';
    }
  }
);

const formRef = ref<FormInstance>();

const close = () => {
  emit('update:open', false);
  drawer.value = false;
};

const save = async () => {
  try {
    await formRef.value?.validate();
    normalizeGroupNameToLabel();
    const wfContext = JSON.stringify(parseContent(form.value.wfContexts) || {});
    const { wfContexts, ...payload } = form.value;
    payload.wfContext = wfContext;
    close();
    emit('save', payload);
  } catch (error) {
    message.warning('请检查表单信息');
  }
};

const getGroupNameList = async () => {
  try {
    const response = await fetchAllGroupName();
    let list: any = response ?? [];
    if (!Array.isArray(list) && list?.data) {
      list = list.data;
    }
    groupNameList.value = Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('获取组名列表失败:', error);
    groupNameList.value = [];
  }
};

getGroupNameList();

const typeChange = (value: number) => {
  if (value === 3) {
    form.value.triggerInterval = '* * * * * ?';
  } else if (value === 2) {
    form.value.triggerInterval = '60';
  }
};

type Model = Pick<
  Workflow.NodeDataType,
  'groupName' | 'triggerType' | 'triggerInterval' | 'executorTimeout' | 'blockStrategy' | 'workflowStatus'
>;

type RuleKey = keyof Model;

const rules: Record<RuleKey, any> = {
  groupName: { required: true, message: '请选择组' },
  triggerType: { required: true, message: '请选择触发类型' },
  triggerInterval: { required: true, message: '请输入触发间隔' },
  executorTimeout: { required: true, message: '请输入执行超时时间' },
  blockStrategy: { required: true, message: '请选择阻塞策略' },
  workflowStatus: { required: true, message: '请选择工作流状态' }
};
</script>

<template>
  <NDrawer v-model:show="drawer" display-directive="if" :width="610" @after-leave="close">
    <NDrawerContent :title="title">
      <template #header>
        <div style="width: 100%;">
          <EditableInput v-model="form.workflowName" placeholder="请输入工作流名称" style="width: 100%;" />
        </div>
      </template>
      <NForm ref="formRef" :model="form" :rules="rules" label-align="left" label-width="100px">
        <NFormItem path="groupName" label="组名称">
          <NSelect
            v-model:value="form.groupName"
            placeholder="请选择组"
            :disabled="store.type === 0 && isNotNull(store.id)"
            :options="groupOptions"
          />
        </NFormItem>
        <NGrid :cols="form.triggerType === 5 ? '1' : '2 s:1 m:2'" responsive="screen" x-gap="20">
          <NGi>
            <NFormItem path="triggerType" label="触发类型">
              <NSelect
                v-model:value="form.triggerType"
                placeholder="请选择触发类型"
                :options="
                  triggerTypeOptions.map(option => {
                    return {
                      label: $t(option.label),
                      value: option.value
                    };
                  })
                "
                @update:value="typeChange"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem :label="$t('page.jobTask.triggerInterval')" path="triggerInterval">
              <JobTriggerInterval
                v-model="form.triggerInterval"
                :trigger-type="form.triggerType ?? 2"
                :inner-modal="true"
              />
            </NFormItem>
          </NGi>
        </NGrid>
        <NGrid :cols="24" x-gap="20">
          <NGi :span="8">
            <NFormItem path="executorTimeout" label="执行超时时间">
              <NInputNumber v-model:value="form.executorTimeout" :min="1">
                <template #suffix>秒</template>
              </NInputNumber>
            </NFormItem>
          </NGi>
          <NGi :span="16">
            <NFormItem path="blockStrategy" label="阻塞策略">
              <NRadioGroup v-model:value="form.blockStrategy">
                <NSpace>
                  <NRadio
                    v-for="(options, index) in blockStrategyRecordOptions"
                    :key="index"
                    :label="$t(options.label)"
                    :value="options.value"
                  />
                </NSpace>
              </NRadioGroup>
            </NFormItem>
          </NGi>
        </NGrid>
        <NFormItem path="wfContext" label="工作流上下文" :show-feedback="form.wfContexts?.length ? false : true">
          <DynamicInput v-model:value="form.wfContexts!" path="wfContexts" />
        </NFormItem>
        <NFormItem path="workflowStatus" label="节点状态">
          <NRadioGroup v-model:value="form.workflowStatus">
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
        <NFormItem path="ownerId" label="负责人">
          <NSelect
            v-model:value="form.ownerId"
            placeholder="请选择负责人"
            :options="ownerOptions"
            clearable
            filterable
          />
        </NFormItem>
        <NFormItem path="notifyIds" label="告警通知">
          <NSelect
            v-model:value="form.notifyIds"
            placeholder="请选择告警通知名称"
            :options="notifyNameList"
            clearable
            multiple
          />
        </NFormItem>
        <NFormItem path="description" label="描述">
          <NInput
            v-model:value="form.description"
            type="textarea"
            :autosize="{ minRows: 5 }"
            placeholder="请输入描述"
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <NButton type="primary" @click="save">保存</NButton>
        <NButton class="ml-12px" @click="close">取消</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
