<script setup lang="ts">
import { computed } from 'vue';
import { expressionRecord } from '@/constants/business';

defineOptions({
  name: 'BranchDesc'
});

interface Props {
  modelValue?: Workflow.ConditionNodeType;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
});

const nodeExpression = computed(() => props.modelValue.decision?.nodeExpression || '');
</script>

<template>
  <NDescriptions :column="2" label-placement="left" bordered :label-style="{ width: '120px' }">
    <NDescriptionsItem label="节点名称" :span="2">{{ modelValue.nodeName }}</NDescriptionsItem>
    <NDescriptionsItem label="表达式类型">
      {{ expressionRecord[modelValue.decision?.expressionType!] }}
    </NDescriptionsItem>
    <NDescriptionsItem label="条件表达式" :span="2" :content-style="{ padding: 0 }">
      <div class="code-display">
        <pre class="code-content">{{ nodeExpression }}</pre>
      </div>
    </NDescriptionsItem>
  </NDescriptions>
</template>

<style scoped lang="scss">
.code-display {
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
}

.code-content {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
