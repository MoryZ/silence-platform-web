<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { FormInstance, InputNumber } from 'ant-design-vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import OperateDrawer from '@/components/common/operate-drawer.vue';
import { $t } from '@/locales';
import { enableStatusNumberOptions } from '@/constants/business';
import { fetchAddJob, fetchEditJob, fetchGetNotifyConfigSystemTaskTypeList } from '@/service/api';
import RouteKey from '@/components/common/route-key.vue';
import BlockStrategy from '@/components/common/block-strategy.vue';
import ExecutorType from '@/components/common/executor-type.vue';
import TaskType from '@/components/common/task-type.vue';
import CodeMirror from '@/components/common/code-mirror.vue';
import JobTriggerInterval from '@/components/common/job-trigger-interval.vue';
import { isNotNull } from '@/utils/common';
import SelectGroup from '@/components/common/select-group.vue';

defineOptions({
  name: 'JobTaskOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Job.Job | null;
}

const notifyNameList = ref<CommonType.Option<number>[]>([]);
const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const executorCustomType = ref<0 | 1>(0);
const visible = defineModel<boolean>('visible', {
  default: false
});
// const argsTags = ref<string[]>([]);
const dynamicForm = reactive({
  args: [{ arg: '' }]
});
const shardNum = ref(0);

const customformRef = ref<FormInstance | null>(null);
const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.jobTask.addJobTask'),
    edit: $t('page.jobTask.editJobTask')
  };
  return titles[props.operateType];
});

type Model = Pick<
  Api.Job.Job,
  | 'id'
  | 'groupName'
  | 'ownerId'
  | 'ownerName'
  | 'notifyIds'
  | 'jobName'
  | 'argsStr'
  | 'argsType'
  | 'jobStatus'
  | 'routeKey'
  | 'executorType'
  | 'executorInfo'
  | 'triggerType'
  | 'triggerInterval'
  | 'blockStrategy'
  | 'executorTimeout'
  | 'maxRetryTimes'
  | 'retryInterval'
  | 'taskType'
  | 'parallelNum'
  | 'description'
  | 'notifyScene'
>;

async function getNotifyConfigSystemTaskTypeList() {
  const res = await fetchGetNotifyConfigSystemTaskTypeList(3);
  notifyNameList.value = res.data as CommonType.Option<number>[];
}

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    // @ts-expect-error groupName is required
    groupName: undefined,
    // @ts-expect-error owerId is required
    ownerId: undefined,
    notifyIds: [],
    jobName: '',
    argsStr: '',
    argsType: 1,
    jobStatus: 1,
    routeKey: 4,
    executorType: 1,
    triggerType: 2,
    // @ts-expect-error groupName is required
    executorInfo: undefined,
    triggerInterval: '60',
    blockStrategy: 1,
    executorTimeout: 60,
    maxRetryTimes: 3,
    retryInterval: 1,
    taskType: 1,
    parallelNum: 1,
    description: ''
  };
}

type RuleKey = Extract<
  keyof Model,
  | 'groupName'
  | 'jobName'
  | 'argsType'
  | 'jobStatus'
  | 'routeKey'
  | 'executorType'
  | 'triggerType'
  | 'executorInfo'
  | 'triggerInterval'
  | 'blockStrategy'
  | 'executorTimeout'
  | 'maxRetryTimes'
  | 'retryInterval'
  | 'taskType'
  | 'parallelNum'
>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  groupName: defaultRequiredRule,
  jobName: defaultRequiredRule,
  argsType: defaultRequiredRule,
  jobStatus: defaultRequiredRule,
  routeKey: defaultRequiredRule,
  executorType: defaultRequiredRule,
  executorInfo: defaultRequiredRule,
  triggerType: defaultRequiredRule,
  triggerInterval: defaultRequiredRule,
  blockStrategy: defaultRequiredRule,
  executorTimeout: defaultRequiredRule,
  maxRetryTimes: defaultRequiredRule,
  retryInterval: defaultRequiredRule,
  taskType: defaultRequiredRule,
  parallelNum: defaultRequiredRule
};

type HttpParams = {
  method: string;
  url: string;
  mediaType: string;
  body?: string;
  headers: {
    [key in string]: string;
  };
  timeout: number;
};

const httpHeaders = ref<{ key: string; value: string }[]>([]);

const httpParams = reactive<HttpParams>(createDefaultHttpParams());

function createDefaultHttpParams() {
  return {
    method: 'POST',
    url: '',
    headers: {},
    body: '',
    mediaType: 'application/json',
    timeout: 60
  };
}

const executorCustomOptions = [
  {
    label: 'Http 执行器',
    value: 'snailJobHttpExecutor'
  },
  {
    label: 'CMD 执行器',
    value: 'snailJobCMDJobExecutor'
  },
  {
    label: 'PowerShell 执行器',
    value: 'snailJobPowerShellJobExecutor'
  },
  {
    label: 'Shell 执行器',
    value: 'snailJobShellJobExecutor'
  }
];

type ScriptParams = {
  method: string;
  scriptParams: string;
  charset: string;
};

const scriptParams = reactive<ScriptParams>(createDefaultScriptParams());

function createDefaultScriptParams() {
  return {
    method: 'LOCAL_SCRIPT',
    scriptParams: '',
    charset: ''
  };
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add' && !props.rowData) {
    Object.assign(model, createDefaultModel());
    executorCustomType.value = 0;
    httpHeaders.value = [];
    Object.assign(httpParams, createDefaultHttpParams());
    Object.assign(scriptParams, createDefaultScriptParams());
    return;
  }

  if (props.rowData) {
    Object.assign(model, props.rowData);
    if (model.taskType === 3 && model.argsStr) {
      Object.assign(dynamicForm, {
        args: JSON.parse(model.argsStr).map((item: string) => {
          return { arg: item };
        })
      });
    }

    if (model.taskType === 5 && model.argsStr) {
      const argsJson = JSON.parse(model.argsStr);
      shardNum.value = argsJson.shardNum;
      model.argsStr = argsJson.argsStr;
    }

    if (executorCustomOptions.map(item => item.value).includes(model.executorInfo)) {
      executorCustomType.value = 1;
      if (model.executorInfo === 'snailJobHttpExecutor') {
        Object.assign(httpParams, JSON.parse(model.argsStr));
        if (httpParams.headers) {
          httpHeaders.value = Object.keys(httpParams.headers).map((item: string) => {
            return { key: item, value: httpParams.headers![item] };
          });
        }
      } else {
        Object.assign(scriptParams, JSON.parse(model.argsStr));
      }
    }
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  const {
    id,
    groupName,
    ownerId,
    ownerName,
    notifyIds,
    jobName,
    argsType,
    jobStatus,
    routeKey,
    executorType,
    executorInfo,
    triggerType,
    triggerInterval,
    blockStrategy,
    executorTimeout,
    maxRetryTimes,
    retryInterval,
    taskType,
    parallelNum,
    description
  } = model;

  let argsStr = taskType === 5 ? JSON.stringify({ shardNum: shardNum.value, argsStr: model.argsStr }) : model.argsStr;

  if (executorCustomType.value === 1) {
    await customformRef.value?.validate();
    if (model.executorInfo === 'snailJobHttpExecutor') {
      httpHeaders.value.forEach(item => {
        httpParams.headers[item.key] = item.value;
      });
      argsStr = JSON.stringify(httpParams);
    } else {
      argsStr = JSON.stringify(scriptParams);
    }
  }

  if (props.operateType === 'add') {
    const { error } = await fetchAddJob({
      groupName,
      ownerId,
      ownerName,
      notifyIds,
      jobName,
      argsStr,
      argsType,
      jobStatus,
      routeKey,
      executorType,
      executorInfo,
      triggerType,
      triggerInterval,
      blockStrategy,
      executorTimeout,
      maxRetryTimes,
      retryInterval,
      taskType,
      parallelNum,
      description
    });
    if (error) return;
    window.$message?.success($t('common.addSuccess'));
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchEditJob({
      id,
      groupName,
      ownerId,
      ownerName,
      notifyIds,
      jobName,
      argsStr,
      argsType,
      jobStatus,
      routeKey,
      executorType,
      executorInfo,
      triggerType,
      triggerInterval,
      blockStrategy,
      executorTimeout,
      maxRetryTimes,
      retryInterval,
      taskType,
      parallelNum,
      description
    });
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
  }

  closeDrawer();
  emit('submitted');
}

function parseArgsStr() {
  if (model.taskType === 3 && dynamicForm.args) {
    const slices = dynamicForm.args.map(item => item.arg.trim()).filter(item => Boolean(item));
    model.argsStr = slices.length > 0 ? JSON.stringify(slices) : '';
  }
  return model.argsStr;
}

const removeItem = (index: number) => {
  dynamicForm.args.splice(index, 1);
};

const addItem = () => {
  dynamicForm.args.push({ arg: '' });
};

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
    getNotifyConfigSystemTaskTypeList();
    customformRef.value?.restoreValidation();
  }
});

/** 分片参数变化, 解析并序列化到model.argsStr */
watch(dynamicForm, () => {
  if (visible.value && model.taskType === 3) {
    parseArgsStr();
  }
});

/** 任务类型变化, 清理分片参数/方法参数 */
watch(
  () => model.taskType,
  taskType => {
    if (props.operateType === 'add') {
      if (visible.value) {
        if (taskType !== 3) {
          dynamicForm.args = [];
        }
        if (taskType !== 5) {
          shardNum.value = 1;
        }
        model.argsStr = '';
      }
    }
  }
);

function handleChangeExecutorCustomType() {
  if (executorCustomType.value === 0) {
    model.executorInfo = '';
    return;
  }
  model.executorInfo = 'snailJobHttpExecutor';
}

const httpMethodOptions = [
  {
    label: 'GET',
    value: 'get'
  },
  {
    label: 'POST',
    value: 'post'
  },
  {
    label: 'PUT',
    value: 'put'
  },
  {
    label: 'DELETE',
    value: 'delete'
  }
];

const scriptMethodOptions = [
  {
    label: '需下载脚本',
    value: 'DOWNLOAD'
  },
  {
    label: '脚本代码',
    value: 'SCRIPT_CODE'
  },
  {
    label: '使用本地脚本',
    value: 'LOCAL_SCRIPT'
  }
];
</script>

<template>
  <OperateDrawer
    v-model:open="visible"
    :title="title"
    :show-footer="true"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <a-form
      ref="formRef"
      :model="model"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item :label="$t('page.jobTask.groupName')" name="groupName">
        <SelectGroup v-model:value="model.groupName" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.jobName')" name="jobName">
        <a-input v-model:value="model.jobName" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.taskType')" name="taskType">
        <TaskType v-model:value="model.taskType" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.executorType')" name="executorType">
        <ExecutorType v-model:value="model.executorType" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.executorInfo')" name="executorInfo">
        <a-input v-model:value="model.executorInfo" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.triggerType')" name="triggerType">
        <a-select v-model:value="model.triggerType">
          <a-select-option :value="1">{{ $t('page.jobTask.triggerType.1') }}</a-select-option>
          <a-select-option :value="2">{{ $t('page.jobTask.triggerType.2') }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.triggerInterval')" name="triggerInterval">
        <JobTriggerInterval v-model:value="model.triggerInterval" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.routeKey')" name="routeKey">
        <RouteKey v-model:value="model.routeKey" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.blockStrategy')" name="blockStrategy">
        <BlockStrategy v-model:value="model.blockStrategy" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.executorTimeout')" name="executorTimeout">
        <a-input-number v-model:value="model.executorTimeout" :min="1" :max="3600" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.maxRetryTimes')" name="maxRetryTimes">
        <a-input-number v-model:value="model.maxRetryTimes" :min="0" :max="10" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.retryInterval')" name="retryInterval">
        <a-input-number v-model:value="model.retryInterval" :min="1" :max="60" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.parallelNum')" name="parallelNum">
        <a-input-number v-model:value="model.parallelNum" :min="1" :max="10" />
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.jobStatus')" name="jobStatus">
        <a-select v-model:value="model.jobStatus">
          <a-select-option v-for="item in enableStatusNumberOptions" :key="item.value" :value="item.value">
            {{ $t(item.label) }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="$t('page.jobTask.description')" name="description">
        <a-textarea v-model:value="model.description" :rows="3" />
      </a-form-item>
    </a-form>
  </OperateDrawer>
</template>

<style scoped>
.http-method {
  width: 130px !important;
}
</style>
