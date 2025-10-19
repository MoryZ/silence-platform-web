<template>
  <div class="editable-input">
    <Input
      v-if="isEditing"
      ref="inputRef"
      v-model:value="editValue"
      :placeholder="placeholder"
      size="small"
      @blur="handleBlur"
      @keydown.enter="handleConfirm"
      @keydown.escape="handleCancel"
    />
    <div
      v-else
      class="editable-display"
      :class="{ 'editable-placeholder': !modelValue }"
      @click="startEdit"
    >
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';
import { Input } from 'ant-design-vue';

defineOptions({
  name: 'EditableInput'
});

interface Props {
  modelValue?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入'
});

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const emit = defineEmits<Emits>();

const isEditing = ref(false);
const editValue = ref('');
const inputRef = ref();

const displayValue = computed(() => {
  return props.modelValue || props.placeholder;
});

const startEdit = async () => {
  isEditing.value = true;
  editValue.value = props.modelValue || '';
  await nextTick();
  inputRef.value?.focus();
};

const handleConfirm = () => {
  emit('update:modelValue', editValue.value);
  isEditing.value = false;
};

const handleBlur = () => {
  handleConfirm();
};

const handleCancel = () => {
  editValue.value = props.modelValue || '';
  isEditing.value = false;
};

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (!isEditing.value) {
    editValue.value = newValue || '';
  }
});
</script>

<style scoped lang="scss">
.editable-input {
  .editable-display {
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    min-height: 28px;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #d9d9d9;
      background-color: #fafafa;
    }
    
    &.editable-placeholder {
      color: #999;
      font-style: italic;
    }
  }
}
</style>
