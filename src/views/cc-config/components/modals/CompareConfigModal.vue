<template>
  <a-modal
    :open="open"
    title="比较配置"
    ok-text="确定"
    cancel-text="取消"
    :width="600"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    @update:open="emit('update:open', $event)"
  >
    <a-spin :spinning="loading">
      <a-form :model="form" ref="formRef">
        <!-- 第一行: 命名空间 (固定，不能更改) -->
        <a-form-item label="命名空间" name="sourceNamespace">
          <a-input 
            :value="sourceNamespaceName" 
            disabled 
            placeholder="application.yml"
          />
        </a-form-item>
        
        <!-- 第二行: 对象信息 (组件列表 getConfigComponents) -->
        <a-form-item 
          label="对象信息" 
          name="targetComponentId" 
          :rules="[{ required: true, message: '请选择对象信息' }]"
        >
          <a-select
            v-model:value="form.targetComponentId"
            placeholder="请选择对象信息"
            :loading="componentsLoading"
            @change="handleComponentChange"
          >
            <a-select-option
              v-for="component in components"
              :key="component.id"
              :value="component.id"
            >
              {{ component.code }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <!-- 第三行: 环境信息 (查询 getConfigEnvironments) -->
        <a-form-item 
          label="环境信息" 
          name="targetEnvironmentName" 
          :rules="[{ required: true, message: '请选择环境信息' }]"
        >
          <a-select
            v-model:value="form.targetEnvironmentName"
            placeholder="请选择环境信息"
            :loading="environmentsLoading"
            @change="handleEnvironmentChange"
          >
            <a-select-option
              v-for="env in targetEnvironments"
              :key="env.id"
              :value="env.name"
            >
              {{ env.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <!-- 第四行: 命名空间 (查询 getConfigItemList) -->
        <a-form-item 
          label="命名空间" 
          name="targetNamespaceId" 
          :rules="[{ required: true, message: '请选择命名空间' }]"
        >
          <a-select
            v-model:value="form.targetNamespaceId"
            placeholder="请选择命名空间"
            :loading="namespacesLoading"
            :disabled="!form.targetEnvironmentName"
          >
            <a-select-option
              v-for="namespace in availableNamespaces"
              :key="namespace.id"
              :value="namespace.namespaceId"
            >
              {{ namespace.namespaceId }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import type { ConfigEnvironment, ConfigItem, ConfigComponent } from '@/types/config';
import { getConfigItemList } from '@/api/config/configItem';
import { getConfigComponents } from '@/api/config/configComponent';

interface Props {
  open: boolean;
  loading: boolean;
  sourceItem: ConfigItem | null;
  sourceEnvironmentName: string;
  targetEnvironments: ConfigEnvironment[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', data: { targetItem: ConfigItem; targetEnvironmentName: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();

const form = ref({
  targetComponentId: undefined as number | undefined,
  targetEnvironmentName: '',
  targetNamespaceId: ''
});

// 加载状态
const componentsLoading = ref(false);
const environmentsLoading = ref(false);
const namespacesLoading = ref(false);

// 数据列表
const components = ref<ConfigComponent[]>([]);
const availableNamespaces = ref<ConfigItem[]>([]);

// 第一行: 源命名空间名称（固定）
const sourceNamespaceName = computed(() => {
  return props.sourceItem?.namespaceId || 'application.yml';
});

// 监听环境变化，加载对应的命名空间列表
watch(() => form.value.targetEnvironmentName, async (newEnvName) => {
  if (!newEnvName) {
    availableNamespaces.value = [];
    form.value.targetNamespaceId = '';
    return;
  }

  try {
    namespacesLoading.value = true;
    // 调用 getConfigItemList 获取该环境下的所有配置项（命名空间）
    const response = await getConfigItemList(form.value.targetComponentId || 0, form.value.targetEnvironmentName || '');
    availableNamespaces.value = response || [];
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
    availableNamespaces.value = [];
  } finally {
    namespacesLoading.value = false;
  }
});

// 加载对象信息（组件列表）
const loadComponents = async () => {
  try {
    componentsLoading.value = true;
    const response = await getConfigComponents({});
    components.value = response || [];
  } catch (error) {
    console.error('加载对象信息失败:', error);
    components.value = [];
  } finally {
    componentsLoading.value = false;
  }
};

// 对象信息变化时的处理
const handleComponentChange = async () => {
  // 重置环境和命名空间
  form.value.targetEnvironmentName = '';
  form.value.targetNamespaceId = '';
  availableNamespaces.value = [];
};

// 环境信息变化时的处理
const handleEnvironmentChange = async () => {
  // 重置命名空间
  form.value.targetNamespaceId = '';
  
  if (!form.value.targetEnvironmentName || !form.value.targetComponentId) {
    availableNamespaces.value = [];
    return;
  }
  
  // 监听器会自动加载命名空间列表，这里只需要重置
};

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    // 找到选中的目标配置项
    const targetItem = availableNamespaces.value.find(item => item.namespaceId === form.value.targetNamespaceId);
    if (!targetItem) {
      console.error('未找到选中的目标配置项');
      return;
    }
    
    emit('confirm', {
      targetItem: targetItem,
      targetEnvironmentName: form.value.targetEnvironmentName
    });
  } catch (error) {
    console.error('表单验证失败:', error);
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
    targetComponentId: undefined,
    targetEnvironmentName: '',
    targetNamespaceId: ''
  };
  availableNamespaces.value = [];
  formRef.value?.resetFields();
};

// 模态框打开时加载数据
onMounted(() => {
  loadComponents();
});

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    loadComponents();
  } else {
    resetForm();
  }
});

// 设置表单初始值
const setInitialValues = (namespaceId: string) => {
  form.value.targetNamespaceId = namespaceId;
};

defineExpose({
  setInitialValues
});
</script>
