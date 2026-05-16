<template>
  <div class="dynamic-input">
    <div v-for="(item, index) in rows" :key="`${index}-${item.key}`" class="row-wrap">
      <div class="row">
        <NInput v-model:value="item.key" placeholder="key" class="key-input" />
        <span class="equal">=</span>
        <NInput v-model:value="item.value" placeholder="value" class="value-input" />
        <span class="type-wrap">(
          <NSelect v-model:value="item.type" :options="typeOptions" class="type-select" />
        )</span>
        <NSpace :size="6">
          <NButton quaternary circle type="primary" @click="addRow(index)">+</NButton>
          <NButton quaternary circle type="error" :disabled="rows.length === 1" @click="removeRow(index)">-</NButton>
        </NSpace>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

defineOptions({
  name: 'DynamicInput'
});

interface ContentItem {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'boolean' | 'number';
}

interface Props {
  value?: any;
  modelValue?: any;
  path?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  modelValue: null,
  path: '',
  placeholder: '请输入内容'
});

interface Emits {
  (e: 'update:modelValue', value: any): void;
  (e: 'update:value', value: any): void;
}

const emit = defineEmits<Emits>();

const rows = ref<ContentItem[]>([{ key: 'init', value: '', type: 'string' }]);

const typeOptions = [
  { label: 'string', value: 'string' },
  { label: 'boolean', value: 'boolean' },
  { label: 'number', value: 'number' }
];

const normalize = (input: any): ContentItem[] => {
  if (!Array.isArray(input) || input.length === 0) {
    return [{ key: 'init', value: '', type: 'string' }];
  }

  return input.map(item => {
    const type = item?.type === 'boolean' || item?.type === 'number' ? item.type : 'string';
    return {
      key: item?.key ?? '',
      value: item?.value ?? '',
      type
    } as ContentItem;
  });
};

const emitChange = (next: ContentItem[]) => {
  emit('update:modelValue', next);
  emit('update:value', next);
};

const addRow = (index: number) => {
  rows.value.splice(index + 1, 0, { key: '', value: '', type: 'string' });
};

const removeRow = (index: number) => {
  if (rows.value.length === 1) return;
  rows.value.splice(index, 1);
};

watch(
  () => props.value,
  newValue => {
    if (newValue !== undefined) {
      rows.value = normalize(newValue);
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  newValue => {
    if (props.value === undefined) {
      rows.value = normalize(newValue);
    }
  },
  { immediate: true }
);

watch(
  rows,
  newValue => {
    emitChange(newValue);
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.dynamic-input {
  width: 100%;

  .row-wrap {
    margin-bottom: 8px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto auto;
    align-items: center;
    gap: 8px;

    .equal {
      color: #666;
    }

    .type-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;

      .type-select {
        width: 110px;
      }
    }
  }
}
</style>
