<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { FormInstance, InputNumber } from 'ant-design-vue';
import { useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import { fetchTriggerJobParams } from '@/service/api';
import CodeMirror from '@/components/common/code-mirror.vue';
import { isNotNull } from '@/utils/common';

defineOptions({
  name: 'JobTaskTriggerModal'
});

interface Props {
  /** the edit row data */
  rowData?: Api.Job.Job | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const dynamicForm = reactive({
  args: [{ arg: '' }]
});

const shardNum = ref(0);
const customformRef = ref<FormInstance | null>(null);
const { defaultRequiredRule } = useFormRules();

type Model = Api.Job.TriggerJobParams;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    jobId: props.rowData?.id,
    tmpArgsStr: ''
  };
}

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
  if (!props.rowData) {
    Object.assign(model, createDefaultModel());
    httpHeaders.value = [];
    Object.assign(httpParams, createDefaultHttpParams());
    Object.assign(scriptParams, createDefaultScriptParams());
    return;
  }

  Object.assign(model, props.rowData);

  const taskType = props.rowData.taskType;
  const argsStr = props.rowData.argsStr;
  if (!argsStr) {
    return;
  }

  // 1:集群 2:广播 4:Map
  model.tmpArgsStr = argsStr;

  // 任务类型 3:切片
  if (taskType === 3) {
    Object.assign(dynamicForm, {
      args: JSON.parse(argsStr).map((item: string) => {
        return { arg: item };
      })
    });
  }

  // 5:MapReduce
  if (taskType === 5) {
    const argsJson = JSON.parse(argsStr);
    shardNum.value = argsJson.shardNum;
    model.tmpArgsStr = argsJson.argsStr;
  }

  if (executorCustomOptions.map(item => item.value).includes(props.rowData.executorInfo)) {
    if (props.rowData.executorInfo === 'snailJobHttpExecutor') {
      Object.assign(httpParams, JSON.parse(argsStr));
      if (httpParams.headers) {
        httpHeaders.value = Object.keys(httpParams.headers).map((item: string) => {
          return { key: item, value: httpParams.headers![item] };
        });
      }
    } else {
      Object.assign(scriptParams, JSON.parse(argsStr));
    }
  }
}

function closeDrawer() {
  visible.value = false;
}

function parseArgsStr() {
  if (props.rowData?.taskType === 3 && dynamicForm.args) {
    const slices = dynamicForm.args.map(item => item.arg.trim()).filter(item => Boolean(item));
    model.tmpArgsStr = slices.length > 0 ? JSON.stringify(slices) : '';
  }
  return model.tmpArgsStr;
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
    customformRef.value?.restoreValidation();
  }
});

/** 分片参数变化, 解析并序列化到model.argsStr */
watch(dynamicForm, () => {
  if (visible.value && props.rowData?.taskType === 3) {
    parseArgsStr();
  }
});

/** 任务类型变化, 清理分片参数/方法参数 */
watch(
  () => props.rowData?.taskType,
  taskType => {
    if (visible.value) {
      if (taskType !== 3) {
        dynamicForm.args = [{ arg: '' }];
      }
      if (taskType !== 5) {
        shardNum.value = 0;
      }
    }
  }
);

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

const executorCustomType = computed(() => {
  if (executorCustomOptions.map(item => item.value).includes(props.rowData!.executorInfo)) {
    return 1;
  }
  return 0;
});

async function handleSubmit() {
  let argsStr =
    props.rowData?.taskType === 5
      ? JSON.stringify({ shardNum: shardNum.value, argsStr: model.tmpArgsStr })
      : model.tmpArgsStr;

  if (executorCustomType.value === 1) {
    await customformRef.value?.validate();
    if (props.rowData?.executorInfo === 'snailJobHttpExecutor') {
      httpHeaders.value.forEach(item => {
        httpParams.headers[item.key] = item.value;
      });
      argsStr = JSON.stringify(httpParams);
    } else {
      argsStr = JSON.stringify(scriptParams);
    }
  }

  const { error } = await fetchTriggerJobParams({ jobId: props.rowData?.id, tmpArgsStr: argsStr });
  if (error) return;

  window.$message?.success($t('common.executeSuccess'));

  closeDrawer();
  emit('submitted');
}
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="$t('page.jobTask.trigger')"
    :width="800"
    :maskClosable="false"
    @cancel="closeDrawer"
    @ok="handleSubmit"
  >
    <Form
      ref="customformRef"
      :model="model"
      :labelCol="{ span: 6 }"
      :wrapperCol="{ span: 18 }"
    >
      <FormItem :label="$t('page.jobTask.argsStr')" name="tmpArgsStr">
        <template v-if="props.rowData?.taskType === 3">
          <Card class="flex-col">
            <FormItem
              v-for="(item, index) in dynamicForm.args"
              :key="index"
              :label="`分片参数 ${index + 1}`"
              :name="`args[${index}].arg`"
              :rules="[
                {
                  required: true,
                  message: `${$t('page.jobTask.form.argsStr')} ${index + 1}`,
                  trigger: ['input', 'blur'],
                  validator: () => !!item.arg
                }
              ]"
              class="m-b-12px"
            >
              <div class="flex">
                <CodeMirror v-model="item.arg" lang="json" :placeholder="$t('page.jobTask.form.argsStr')" />
                <Button class="ml-12px" type="primary" danger @click="removeItem(index)">
                  <icon-ic-round-delete class="text-icon" />
                </Button>
              </div>
            </FormItem>
            <Button block type="dashed" @click="addItem">
              <icon-ic-round-plus class="text-icon" />
            </Button>
          </Card>
        </template>
        <template v-else-if="props.rowData?.executorInfo === 'snailJobHttpExecutor'">
          <Form :model="httpParams" class="w-full">
            <FormItem label="请求参数" :rules="defaultRequiredRule" name="url">
              <InputGroup>
                <Select v-model:value="httpParams.method" class="http-method" :options="httpMethodOptions" />
                <Input v-model:value="httpParams.url" placeholder="请输入请求地址" class="w-full" />
              </InputGroup>
            </FormItem>
            <FormItem label="Media Type">
              <Input v-model:value="httpParams.mediaType" placeholder="请输入 Media Type" />
            </FormItem>
            <div class="ant-form-item-label">Header 参数</div>
            <DynamicInput
              v-model:value="httpHeaders"
              :class="httpHeaders.length ? undefined : 'mb-24px'"
              itemStyle="margin-bottom: 0;"
              :onCreate="() => ({ key: '', value: '' })"
              #="{ index }"
            >
              <div class="flex">
                <FormItem
                  :name="`headers[${index}].key`"
                  :rules="[
                    {
                      required: true,
                      message: `请输入键`,
                      trigger: ['input', 'blur'],
                      validator: () => isNotNull(httpHeaders[index].key)
                    }
                  ]"
                >
                  <Input v-model:value="httpHeaders[index].key" placeholder="Key" @keydown.enter.prevent />
                </FormItem>
                <div class="mx-8px h-34px text-center line-height-34px">=</div>
                <FormItem
                  :name="`headers[${index}].value`"
                  :rules="[
                    {
                      required: true,
                      message: `请输入值`,
                      trigger: ['input', 'blur'],
                      validator: () => isNotNull(httpHeaders[index].value)
                    }
                  ]"
                >
                  <Input v-model:value="httpHeaders[index].value" placeholder="Value" @keydown.enter.prevent />
                </FormItem>
              </div>
            </DynamicInput>
            <FormItem label="Body 参数">
              <CodeMirror v-model="httpParams.body" lang="json" placeholder="请输入 Body 参数" />
            </FormItem>
            <FormItem label="接口超时时间">
              <InputGroup>
                <InputNumber
                  v-model:value="httpParams.timeout"
                  class="w-full"
                  :min="1"
                  :max="99999999"
                  :placeholder="$t('page.jobTask.form.executorTimeout')"
                />
                <InputGroupLabel>{{ $t('common.second') }}</InputGroupLabel>
              </InputGroup>
            </FormItem>
          </Form>
        </template>
        <template v-else>
          <Form :model="scriptParams" class="w-full">
            <FormItem label="脚本类型">
              <Select v-model:value="scriptParams.method" :options="scriptMethodOptions" />
            </FormItem>
            <FormItem label="脚本参数">
              <CodeMirror v-model="scriptParams.scriptParams" lang="json" placeholder="请输入脚本参数" />
            </FormItem>
            <FormItem label="编码格式">
              <Input v-model:value="scriptParams.charset" placeholder="请输入编码格式" />
            </FormItem>
          </Form>
        </template>
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.http-method {
  width: 130px !important;
}
</style>
