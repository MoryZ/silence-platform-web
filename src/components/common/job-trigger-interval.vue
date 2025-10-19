<template>
  <div class="job-trigger-interval">
    <Input
      v-if="triggerType === 2"
      v-model:value="intervalValue"
      placeholder="请输入间隔时间（秒）"
      type="number"
      :min="1"
      @change="handleChange"
    />
    <Input
      v-else-if="triggerType === 3"
      v-model:value="cronValue"
      placeholder="请输入 Cron 表达式"
      @change="handleChange"
    />
    <Input
      v-else
      v-model:value="customValue"
      placeholder="请输入触发间隔"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from 'ant-design-vue';

defineOptions({
  name: 'JobTriggerInterval'
});

interface Props {
  modelValue?: string;
  triggerType?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  triggerType: 2
});

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const emit = defineEmits<Emits>();

const intervalValue = ref('');
const cronValue = ref('');
const customValue = ref('');

const handleChange = (value: string) => {
  emit('update:modelValue', value);
};

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (props.triggerType === 2) {
    intervalValue.value = newValue || '';
  } else if (props.triggerType === 3) {
    cronValue.value = newValue || '';
  } else {
    customValue.value = newValue || '';
  }
}, { immediate: true });

// 监听 triggerType 变化
watch(() => props.triggerType, (newType) => {
  if (newType === 2) {
    emit('update:modelValue', intervalValue.value);
  } else if (newType === 3) {
    emit('update:modelValue', cronValue.value);
  } else {
    emit('update:modelValue', customValue.value);
  }
});
</script>

<style scoped lang="scss">
.job-trigger-interval {
  width: 100%;
}
</style>
