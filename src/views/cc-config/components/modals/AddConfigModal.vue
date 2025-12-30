<template>
  <a-modal
    :open="open"
    title="新增配置"
    ok-text="确定"
    cancel-text="取消"
    :width="800"
    :mask-closable="false"
    @ok="handleSubmit"
    @cancel="handleCancel"
    @update:open="emit('update:open', $event)"
  >
    <a-form :model="form" :rules="rules" ref="formRef">
      <a-form-item label="命名空间类型" name="type">
        <a-radio-group v-model:value="form.type">
          <a-radio :value="1">私有</a-radio>
          <a-radio :value="2">公共</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="命名空间ID" name="namespaceId">
        <a-input v-model:value="form.namespaceId" placeholder="请输入命名空间ID" />
      </a-form-item>

      <a-form-item label="格式类型" name="formatType">
        <a-select v-model:value="form.formatType" placeholder="请选择格式类型">
          <a-select-option :value="1">YML</a-select-option>
          <a-select-option :value="2">Properties</a-select-option>
          <a-select-option :value="3">TXT</a-select-option>
          <a-select-option :value="4">JSON</a-select-option>
          <a-select-option :value="5">XML</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="配置内容" name="content">
        <div ref="editorContainer" class="config-editor"></div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { createConfigItem } from '@/api/config/configItem';
import { useConfigEditor } from '../composables/useConfigEditor';

interface Props {
  open: boolean;
  environmentId: number | string;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const editorContainer = ref<HTMLElement | null>(null);

const form = ref({
  type: 1,
  namespaceId: '',
  formatType: 1,
  content: '',
});

const rules = {
  type: [{ required: true, message: '请选择命名空间类型', trigger: 'change' }],
  namespaceId: [{ required: true, message: '请输入命名空间ID', trigger: 'blur' }],
  formatType: [{ required: true, message: '请选择格式类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入配置内容', trigger: 'blur' }]
};

const { initEditor, getValue, disposeEditor, getLanguage, setLanguage } = useConfigEditor();
let editor: any = null;

// 监听弹窗打开状态
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (editorContainer.value) {
          editor = initEditor(editorContainer.value, {
            value: form.value.content || '',
            language: getLanguage(form.value.formatType),
            onContentChange: (value) => {
              form.value.content = value;
            }
          });
        }
      }, 50);
    });
  } else {
    disposeEditor();
    editor = null;
  }
});

// 监听格式类型变化，更新编辑器语言
watch(() => form.value.formatType, (newType) => {
  if (editor) {
    setLanguage(getLanguage(newType));
  }
});

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    const params = {
      type: form.value.type,
      namespaceId: form.value.namespaceId,
      formatType: form.value.formatType,
      content: getValue(),
      configEnvironmentId: Number(props.environmentId),
      namespaceStatus: 1,
    };
    
    await createConfigItem(params);
    message.success('新增配置成功');
    
    emit('update:open', false);
    emit('success');
    resetForm();
  } catch (error) {
    console.error('新增配置失败:', error);
    message.error('新增配置失败');
  }
};

// 处理取消
const handleCancel = () => {
  disposeEditor();
  editor = null;
  emit('update:open', false);
  resetForm();
};

// 重置表单
const resetForm = () => {
  form.value = {
    type: 1,
    namespaceId: '',
    formatType: 1,
    content: '',
  };
  formRef.value?.resetFields();
};
</script>

<style lang="scss" scoped>
.config-editor {
  height: 400px;
  min-height: 400px;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  width: 100%;
}
</style>
