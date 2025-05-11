<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { groupConfigStatusOptions, groupConfigYesOrNoOptions } from '@/constants/business';
import { fetchAddGroupConfig, fetchEditGroupConfig, fetchGetPartitionTableList } from '@/service/api/group';

defineOptions({
  name: 'GroupOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.GroupConfig.GroupConfig | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { copy, isSupported } = useClipboard();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.groupConfig.addGroupConfig'),
    edit: $t('page.groupConfig.editGroupConfig')
  };
  return titles[props.operateType];
});

const partitionList = ref<string[]>([]);

type Model = Pick<
  Api.GroupConfig.GroupConfig,
  'id' | 'groupName' | 'token' | 'groupStatus' | 'description' | 'idGeneratorMode' | 'initScene' | 'groupPartition'
>;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    groupName: '',
    token: import.meta.env.VITE_APP_DEFAULT_TOKEN || '',
    groupStatus: 1,
    description: '',
    idGeneratorMode: 2,
    initScene: 1,
    groupPartition: 0
  };
}

type RuleKey = Extract<
  keyof Model,
  'groupName' | 'token' | 'groupStatus' | 'idGeneratorMode' | 'initScene' | 'groupPartition'
>;

const rules = {
  groupName: [
    {
      required: true,
      pattern: /^[A-Za-z0-9_-]{1,64}$/,
      trigger: 'change',
      message: $t('page.groupConfig.form.groupNameRule')
    }
  ],
  token: [defaultRequiredRule],
  groupStatus: [defaultRequiredRule],
  idGeneratorMode: [defaultRequiredRule],
  initScene: [defaultRequiredRule],
  groupPartition: [defaultRequiredRule]
} satisfies Record<RuleKey, App.Global.FormRule[]>;

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, props.rowData);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  // request
  if (props.operateType === 'add') {
    const { groupName, token, groupStatus, description, idGeneratorMode, initScene, groupPartition } = model;
    const { error } = await fetchAddGroupConfig({
      groupName,
      token,
      groupStatus,
      description,
      idGeneratorMode,
      initScene,
      groupPartition
    });
    if (error) return;
    window.$message?.success($t('common.addSuccess'));
  } else {
    const { groupName, token, groupStatus, description, idGeneratorMode, initScene, groupPartition } = model;
    const { error } = await fetchEditGroupConfig({
      groupName,
      token,
      groupStatus,
      description,
      idGeneratorMode,
      initScene,
      groupPartition
    });
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
  }

  closeDrawer();
  emit('submitted');
}

/** 设置 token */
function setToken() {
  model.token = generateToken(32);
}

/** 生成 token */
function generateToken(length: number) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let token = 'SJ_';
  for (let i = 0; i < length; i += 1) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    token += chars.substring(randomNumber, randomNumber + 1);
  }
  return token;
}

const getAllPartitions = async () => {
  const { data } = await fetchGetPartitionTableList();
  partitionList.value = data!.map(p => String(p));
};

watch(visible, () => {
  if (visible.value) {
    getAllPartitions(); // 因为drawer会keepalive，onMounted不能报账每次打开drawer会调用刷新
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});

async function handleCopy(source: string) {
  if (!isSupported) {
    window.$message?.error('您的浏览器不支持 Clipboard API');
    return;
  }

  if (!source) {
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    await copy(source);
  } else {
    const range = document.createRange();
    range.selectNode(document.getElementById('tokenOperateInput')!);
    const selection = window.getSelection();
    if (selection?.rangeCount) selection.removeAllRanges();
    selection?.addRange(range);
    document.execCommand('copy');
  }
  window.$message?.success('复制成功');
}
</script>

<template>
  <OperateDrawer v-model="visible" :title="title" @submitted="handleSubmit">
    <a-form ref="formRef" :model="model" :rules="rules">
      <a-collapse :default-active-key="['1', '2']">
        <a-collapse-panel :key="1" :header="$t('page.groupConfig.commonConfig')">
          <a-form-item :label="$t('page.groupConfig.groupName')" name="groupName">
            <a-input
              v-model:value="model.groupName"
              :maxlength="64"
              show-count
              :placeholder="$t('page.groupConfig.form.groupName')"
              :disabled="props.operateType === 'edit'"
            />
          </a-form-item>
          <a-form-item :label="$t('page.groupConfig.groupStatus')" name="groupStatus">
            <a-radio-group v-model:value="model.groupStatus" name="groupStatus">
              <a-space>
                <a-radio
                  v-for="item in groupConfigStatusOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ $t(item.label) }}
                </a-radio>
              </a-space>
            </a-radio-group>
          </a-form-item>
          <a-form-item :label="$t('page.groupConfig.token')" name="token">
            <a-input-group>
              <a-input
                id="tokenOperateInput"
                v-model:value="model.token"
                :maxlength="64"
                :placeholder="$t('page.groupConfig.form.token')"
                :disabled="props.operateType === 'edit'"
              />
              <a-tooltip v-if="props.operateType === 'edit'" title="复制">
                <a-button type="default" ghost @click="handleCopy(model.token)">
                  <icon-ic:round-content-copy class="text-icon" />
                </a-button>
              </a-tooltip>
              <a-tooltip v-else :title="$t('page.groupConfig.generateToken')">
                <a-button type="default" ghost @click="setToken">
                  <icon-ic-round-refresh class="text-icon" />
                </a-button>
              </a-tooltip>
            </a-input-group>
          </a-form-item>
          <a-form-item :label="$t('page.groupConfig.description')" name="description">
            <a-textarea
              v-model:value="model.description"
              :maxlength="256"
              show-count
              :placeholder="$t('page.groupConfig.form.description')"
              allow-clear
            />
          </a-form-item>
        </a-collapse-panel>
        <a-collapse-panel :key="2" :header="$t('page.groupConfig.retryConfig')">
          <a-form-item :label="$t('page.groupConfig.initScene')" name="initScene">
            <a-radio-group v-model:value="model.initScene" name="initScene">
              <a-space>
                <a-radio
                  v-for="item in groupConfigYesOrNoOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ $t(item.label) }}
                </a-radio>
              </a-space>
            </a-radio-group>
          </a-form-item>
        </a-collapse-panel>
      </a-collapse>
    </a-form>
    <template #footer>
      <a-space :size="16">
        <a-button @click="closeDrawer">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" @click="handleSubmit">{{ $t('common.save') }}</a-button>
      </a-space>
    </template>
  </OperateDrawer>
</template>

<style scoped></style>
