<template>
  <a-modal
    :open="open"
    title="同步配置"
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
        
        <!-- 第三行: 环境信息 -->
        <a-form-item 
          label="环境信息" 
          name="targetEnvironmentId" 
          :rules="[{ required: true, message: '请选择环境信息' }]"
        >
          <a-select
            v-model:value="form.targetEnvironmentId"
            placeholder="请选择环境信息"
            :loading="environmentsLoading"
            @change="handleEnvironmentChange"
          >
            <a-select-option
              v-for="env in targetEnvironments"
              :key="env.id"
              :value="env.id"
            >
              {{ env.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <!-- 第四行: 目标命名空间 (多选) -->
        <a-form-item 
          label="目标命名空间" 
          name="targetNamespaceIds" 
          :rules="[{ required: true, message: '请选择目标命名空间' }]"
        >
          <a-select
            v-model:value="form.targetNamespaceIds"
            mode="multiple"
            placeholder="请选择目标命名空间"
            :loading="namespacesLoading"
            :disabled="!form.targetEnvironmentId"
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
        
        <!-- 第五行: 相同配置的处理策略 -->
        <a-form-item 
          label="相同配置处理策略" 
          name="conflictStrategy" 
          :rules="[{ required: true, message: '请选择处理策略' }]"
        >
          <a-select
            v-model:value="form.conflictStrategy"
            placeholder="请选择处理策略"
          >
            <a-select-option :value="1">终止导入</a-select-option>
            <a-select-option :value="2">跳过</a-select-option>
            <a-select-option :value="3">覆盖</a-select-option>
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
  (e: 'confirm', data: { 
    targetEnvironmentId: number; 
    targetNamespaceIds: string[];
    conflictStrategy: number;
  }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();

const form = ref({
  targetComponentId: undefined as number | undefined,
  targetEnvironmentId: undefined as number | undefined,
  targetNamespaceIds: [] as string[],
  conflictStrategy: 2 as number // 1: 终止导入, 2: 跳过, 3: 覆盖
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
watch(() => form.value.targetEnvironmentId, async (newEnvId) => {
  if (!newEnvId) {
    availableNamespaces.value = [];
    form.value.targetNamespaceIds = [];
    return;
  }

  try {
    namespacesLoading.value = true;
    // 获取目标环境对象找到其name
    const targetEnv = props.targetEnvironments.find(env => env.id === newEnvId);
    // 调用 getConfigItemList 获取该环境下的所有配置项（命名空间）
    const response = await getConfigItemList(form.value.targetComponentId || 0, targetEnv?.name || '');
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
  form.value.targetEnvironmentId = undefined;
  form.value.targetNamespaceIds = [];
  availableNamespaces.value = [];
};

// 环境信息变化时的处理
const handleEnvironmentChange = async () => {
  // 重置命名空间
  form.value.targetNamespaceIds = [];
  
  if (!form.value.targetEnvironmentId || !form.value.targetComponentId) {
    availableNamespaces.value = [];
    return;
  }
  
  // 监听器会自动加载命名空间列表
};

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    emit('confirm', {
      targetEnvironmentId: form.value.targetEnvironmentId!,
      targetNamespaceIds: form.value.targetNamespaceIds,
      conflictStrategy: form.value.conflictStrategy
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
    targetEnvironmentId: undefined,
    targetNamespaceIds: [],
    conflictStrategy: 2
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
  // 同步配置时不需要设置初始命名空间
};

defineExpose({
  setInitialValues
});
</script>
