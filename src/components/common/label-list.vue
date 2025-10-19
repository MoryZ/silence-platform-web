<template>
  <div class="label-list">
    <Tag
      v-for="[key, value] in labelEntries"
      :key="key"
      color="blue"
    >
      {{ key }}:{{ value }}
    </Tag>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Tag } from 'ant-design-vue';

defineOptions({
  name: 'LabelList'
});

interface Props {
  labels?: string;
}

const props = withDefaults(defineProps<Props>(), {
  labels: '{}'
});

const labelEntries = computed(() => {
  try {
    const parsed = JSON.parse(props.labels || '{}');
    return Object.entries(parsed);
  } catch (error) {
    console.warn('Failed to parse labels:', props.labels);
    return [];
  }
});
</script>

<style scoped lang="scss">
.label-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
</style>
