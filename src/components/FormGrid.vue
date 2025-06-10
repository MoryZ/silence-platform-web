<template>
  <div class="form-grid">
    <div v-for="field in fields" :key="field.key" class="form-row">
      <div class="form-label">
        <span v-if="field.required" class="form-required">*</span>{{ field.label }}
      </div>
      <div class="form-control form-control-with-addon" :class="{ 'has-addon': field.renderAddon }">
        <template v-if="field.renderAddon && field.type === 'input'">
          <div class="input-with-addon">
            <component
              :is="getComponent(field)"
              v-model:value="model[field.key]"
              v-bind="getComponentProps(field)"
              :placeholder="field.placeholder"
              :options="field.options"
              :rows="field.type === 'textarea' ? 3 : undefined"
              @change="(val: any) => handleFieldChange(field, val)"
            />
            <span class="addon-slot">
              <slot :name="field.renderAddon" />
            </span>
          </div>
        </template>
        <template v-else>
          <component
            v-if="field.type !== 'radio'"
            :is="getComponent(field)"
            v-model:value="model[field.key]"
            v-bind="getComponentProps(field)"
            :placeholder="field.placeholder"
            :options="field.options"
            :rows="field.type === 'textarea' ? 3 : undefined"
            @change="(val: any) => handleFieldChange(field, val)"
          />
          <a-radio-group
            v-else
            v-model:value="model[field.key]"
            :options="field.options"
            @change="(val: any) => handleFieldChange(field, val)"
          />
        </template>
      </div>
      <div class="form-divider" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, watch, onMounted } from 'vue';
import { Input, Select, InputNumber, Radio } from 'ant-design-vue';

interface FieldConfig {
  key: string;
  label: string;
  type: 'input' | 'select' | 'number' | 'textarea' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }> | (() => Promise<Array<{ label: string; value: string | number }>>);
  min?: number;
  max?: number;
  step?: number;
  renderAddon?: string;
}

const props = defineProps({
  fields: {
    type: Array as PropType<FieldConfig[]>,
    required: true
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    required: true
  }
});
const emit = defineEmits(['change']);

// 处理 options 为异步函数的情况
onMounted(async () => {
  for (const field of props.fields) {
    if (typeof field.options === 'function') {
      const opts = await field.options();
      field.options = opts;
      // 默认选中第一个 radio
      if (field.type === 'radio' && opts.length > 0 && !props.model[field.key]) {
        props.model[field.key] = opts[0].value;
      }
    } else if (field.type === 'radio' && Array.isArray(field.options) && field.options.length > 0 && !props.model[field.key]) {
      props.model[field.key] = field.options[0].value;
    }
  }
});

function getComponent(field: FieldConfig) {
  if (field.type === 'input') return Input;
  if (field.type === 'select') return Select;
  if (field.type === 'number') return InputNumber;
  if (field.type === 'textarea') return Input.TextArea;
  return Input;
}
function getComponentProps(field: FieldConfig) {
  const props: Record<string, any> = {};
  if (field.type === 'number') {
    if (field.min !== undefined) props.min = field.min;
    if (field.max !== undefined) props.max = field.max;
    if (field.step !== undefined) props.step = field.step;
    props.style = 'width: 100%';
  }
  if (field.type === 'select') {
    props.options = field.options || [];
    props.style = 'width: 100%';
    props.allowClear = true;
  }
  if (field.type === 'input' || field.type === 'textarea') {
    props.allowClear = true;
  }
  return props;
}
function handleFieldChange(field: FieldConfig, val: any) {
  emit('change', { key: field.key, value: val });
}
</script>

<style scoped>
.form-grid {
  width: 100%;
}
.form-row {
  display: block;
  margin-bottom: 0;
  position: relative;
  padding: 14px 0 0 0;
}
.form-label {
  display: block;
  width: 110px;
  min-width: 110px;
  color: #222;
  font-weight: 600;
  text-align: left;
  padding-right: 12px;
  line-height: 22px;
  margin-bottom: 4px;
}
.form-required {
  color: #ff4d4f;
  margin-right: 2px;
}
.form-control {
  width: 100%;
  color: #333;
  word-break: break-all;
  line-height: 22px;
}
.input-with-addon {
  display: flex;
  align-items: center;
}
.addon-slot {
  margin-left: 4px;
  display: flex;
  align-items: center;
}
.form-divider {
  width: 100%;
  height: 1px;
  background: #f0f0f0;
  margin: 14px 0 0 0;
}
</style> 