<template>
  <a-modal
    :open="open"
    title="克隆命名空间"
    ok-text="确定"
    cancel-text="取消"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    @update:open="emit('update:open', $event)"
  >
    <a-form :model="form" ref="formRef">
      <a-form-item label="源环境" name="sourceEnvironmentId">
        <a-input :value="sourceEnvironmentName" disabled />
      </a-form-item>
      
      <a-form-item 
        label="目标环境" 
        name="targetEnvironmentId" 
        :rules="[{ required: true, message: '请选择目标环境' }]"
      >
        <a-select
          v-model:value="form.targetEnvironmentId"
          placeholder="请选择目标环境"
        >
          <a-select-option
            v-for="env in targetEnvironments"
            :key="env.id"
            :value="env.id"
          >
            {{ env.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      
      <a-form-item 
        label="克隆模式" 
        name="cloneMode" 
        :rules="[{ required: true, message: '请选择克隆模式' }]"
      >
        <a-radio-group v-model:value="form.cloneMode">
          <a-radio :value="1">覆盖文件</a-radio>
          <a-radio :value="2">跳过同名文件</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { cloneNamespace } from '@/api/config/configNamespace';
import type { ConfigEnvironment } from '@/api/config/configEnvironment';

interface Props {
  open: boolean;
  sourceEnvironmentId: number | string;
  sourceEnvironmentName: string;
  targetEnvironments: ConfigEnvironment[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = ref({
  targetEnvironmentId: undefined as number | undefined,
  cloneMode: 1
});

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;
    
    await cloneNamespace({
      sourceEnvironmentId: Number(props.sourceEnvironmentId),
      targetEnvironmentId: form.value.targetEnvironmentId!,
      cloneMode: form.value.cloneMode
    });
    
    message.success('克隆成功');
    emit('update:open', false);
    emit('success');
    resetForm();
  } catch (error) {
    console.error('克隆失败:', error);
    message.error('克隆失败');
  } finally {
    loading.value = false;
  }
};

// 处理取消
const handleCancel = () => {
  emit('update:open', false);
  resetForm();
};

// 重置表单
const resetForm = () => {
  form.value = {
    targetEnvironmentId: undefined,
    cloneMode: 1
  };
  formRef.value?.resetFields();
};
</script>
