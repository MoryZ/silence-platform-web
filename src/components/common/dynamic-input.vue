<template>
  <div class="dynamic-input">
    <Input.TextArea
      v-model:value="inputValue"
      :placeholder="placeholder"
      :auto-size="{ minRows: 3, maxRows: 8 }"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from 'ant-design-vue';

defineOptions({
  name: 'DynamicInput'
});

interface Props {
  modelValue?: any;
  path?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  path: '',
  placeholder: '请输入内容'
});

interface Emits {
  (e: 'update:modelValue', value: any): void;
}

const emit = defineEmits<Emits>();

const inputValue = ref('');

// 将 modelValue 转换为字符串显示
watch(() => props.modelValue, (newValue) => {
  if (Array.isArray(newValue)) {
    inputValue.value = JSON.stringify(newValue, null, 2);
  } else if (typeof newValue === 'object' && newValue !== null) {
    inputValue.value = JSON.stringify(newValue, null, 2);
  } else {
    inputValue.value = String(newValue || '');
  }
}, { immediate: true });

const handleInput = () => {
  try {
    // 尝试解析 JSON
    const parsed = JSON.parse(inputValue.value);
    emit('update:modelValue', parsed);
  } catch (error) {
    // 如果解析失败，直接传递字符串
    emit('update:modelValue', inputValue.value);
  }
};
</script>

<style scoped lang="scss">
.dynamic-input {
  width: 100%;
}
</style>
