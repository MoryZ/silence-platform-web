<template>
  <a-drawer
    :visible="visible"
    :title="title"
    placement="right"
    :width="width"
    @close="onClose"
  >
    <div class="detail-table">
      <div 
        v-for="field in fields" 
        :key="field.key" 
        class="detail-row"
      >
        <div class="detail-label">{{ field.label }}</div>
        <div class="detail-value">
          <!-- 复制类型 -->
          <template v-if="field.type === 'copy'">
            <div class="token-wrapper">
              <span class="token-text">{{ getFieldValue(field.key) || '-' }}</span>
              <button
                v-if="getFieldValue(field.key)"
                class="custom-copy-btn"
                @click="copyText(getFieldValue(field.key))"
              >
                <span class="copy-icon">📋</span> 复制
              </button>
            </div>
          </template>

          <!-- 状态类型 -->
          <template v-else-if="field.type === 'status'">
            <span
              class="status-tag"
              :class="getFieldValue(field.key) ? 'status-enabled' : 'status-disabled'"
            >
              {{ field.format ? field.format(getFieldValue(field.key)) : (getFieldValue(field.key) ? '是' : '否') }}
            </span>
          </template>

          <!-- 默认文本类型 -->
          <template v-else>
            {{ field.format ? field.format(getFieldValue(field.key)) : (getFieldValue(field.key) || '-') }}
          </template>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'copy' | 'status';
  format?: (value: any) => string;
}

interface Props {
  visible: boolean;
  title?: string;
  width?: number | string;
  detail: Record<string, any>;
  fields: Field[];
}

const props = withDefaults(defineProps<Props>(), {
  title: '详情',
  width: 520,
});

const emit = defineEmits(['update:visible', 'close']);

const onClose = () => {
  emit('update:visible', false);
  emit('close');
};

const getFieldValue = (key: string) => {
  return props.detail?.[key];
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch (err) {
    message.error('复制失败，请手动复制');
  }
};
</script>

<style scoped>
.detail-table {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.detail-row {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 120px;
  padding: 12px 16px;
  background: #f0f5ff;
  font-weight: 500;
  color: #1d39c4;
  border-right: 1px solid #d6e4ff;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  padding: 12px 16px;
  min-height: 44px;
  line-height: 20px;
  color: #262626;
  background: #fff;
}

.token-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-text {
  flex: 1;
  word-break: break-all;
}

.custom-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 4px;
  color: #2f54eb;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-copy-btn:hover {
  background: #d6e4ff;
  color: #1d39c4;
}

.copy-icon {
  margin-right: 4px;
  font-size: 14px;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 20px;
}

.status-enabled {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}

.status-disabled {
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  color: #8c8c8c;
}
</style>