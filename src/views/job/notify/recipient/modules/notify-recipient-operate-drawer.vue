<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { $t } from '@/locales';
import { fetchAddNotifyRecipient, fetchEditNotifyRecipient } from '@/api/job/notify-recipients';
import DingDingForm from './dingding-form.vue';
import EmailForm from './email-form.vue';
import WeComForm from './wecom-form.vue';
import LarkForm from './lark-form.vue';
import WebhookForm from './webhook-form.vue';

defineOptions({
  name: 'NotifyRecipientOperateDrawer'
});

// 定义类型接口
interface NotifyRecipient {
  id?: any;
  recipientName: string;
  notifyType: number;
  notifyAttribute?: string;
  description?: string;
}

type TableOperateType = 'add' | 'edit';
type AlarmType = '1' | '2' | '3' | '4' | '5';

interface Props {
  /** the type of operation */
  operateType: TableOperateType;
  /** the edit row data */
  rowData?: NotifyRecipient | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const notifyTabPane = defineModel<AlarmType>('notifyTabPane', {
  default: '1'
});

// 简化的表单处理
const formRef = ref();
const validate = async () => {
  // 简化的验证逻辑
  return true;
};
const restoreValidation = () => {
  // 简化的重置验证逻辑
};

const title = computed(() => {
  const titles: Record<TableOperateType, string> = {
    add: $t('page.notifyRecipient.addNotifyRecipient'),
    edit: $t('page.notifyRecipient.editNotifyRecipient')
  };
  return titles[props.operateType];
});

type Model = {
  id?: any;
  recipientName: string;
  notifyType: number;
  notifyAttribute?: string;
  description?: string;
};
const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    recipientName: '',
    notifyType: Number(notifyTabPane.value!),
    notifyAttribute: '{}',
    description: ''
  };
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    model.value = createDefaultModel();
    notifyTabPane.value = '1';
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    model.value = props.rowData;
    notifyTabPane.value = String(props.rowData.notifyType) as AlarmType;
  }
}

async function handleSubmit() {
  await validate();
  // request
  if (props.operateType === 'add') {
    const { recipientName, notifyAttribute, notifyType, description } = model.value;
    try {
      await fetchAddNotifyRecipient({ recipientName, notifyAttribute, notifyType, description });
      // 简化的成功提示
      console.log('添加成功');
    } catch (error) {
      console.error('添加失败:', error);
      return;
    }
  }

  if (props.operateType === 'edit') {
    const { id, recipientName, notifyAttribute, notifyType, description } = model.value;
    try {
      await fetchEditNotifyRecipient({ id, recipientName, notifyAttribute, notifyType, description });
      // 简化的成功提示
      console.log('更新成功');
    } catch (error) {
      console.error('更新失败:', error);
      return;
    }
  }
  closeDrawer();
  emit('submitted');
}

function closeDrawer() {
  visible.value = false;
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="title"
    width="600px"
    placement="right"
  >
    <a-tabs v-model:activeKey="notifyTabPane" type="card">
      <a-tab-pane key="1" tab="钉钉" :disabled="notifyTabPane !== '1' && props.operateType === 'edit'">
        <DingDingForm ref="formRef" v-model:value="model as any" />
      </a-tab-pane>
      <a-tab-pane key="2" tab="邮箱" :disabled="notifyTabPane !== '2' && props.operateType === 'edit'">
        <EmailForm ref="formRef" v-model:value="model as any" />
      </a-tab-pane>
      <a-tab-pane key="3" tab="企业微信" :disabled="notifyTabPane !== '3' && props.operateType === 'edit'">
        <WeComForm ref="formRef" v-model:value="model as any" />
      </a-tab-pane>
      <a-tab-pane key="4" tab="飞书" :disabled="notifyTabPane !== '4' && props.operateType === 'edit'">
        <LarkForm ref="formRef" v-model:value="model as any" />
      </a-tab-pane>
      <a-tab-pane key="5" tab="Webhook" :disabled="notifyTabPane !== '5' && props.operateType === 'edit'">
        <WebhookForm ref="formRef" v-model:value="model as any" />
      </a-tab-pane>
    </a-tabs>
    <template #footer>
      <a-space :size="16">
        <a-button @click="closeDrawer">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" @click="handleSubmit">{{ $t('common.save') }}</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<style scoped></style>
