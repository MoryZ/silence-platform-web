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
        
        <!-- 第二行: 对象信息 (查询 getAllConfigSubsystem) -->
        <a-form-item 
          label="对象信息" 
          name="targetSubsystemId" 
          :rules="[{ required: true, message: '请选择对象信息' }]"
        >
          <a-select
            v-model:value="form.targetSubsystemId"
            placeholder="请选择对象信息"
            :loading="subsystemsLoading"
            @change="handleSubsystemChange"
          >
            <a-select-option
              v-for="subsystem in subsystems"
              :key="subsystem.id"
              :value="subsystem.id"
            >
              {{ subsystem.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <!-- 第三行: 环境信息 (查询 getConfigEnvironments) -->
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
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import type { ConfigEnvironment } from '@/api/config/configEnvironment';
import type { ConfigItem } from '@/api/config/configItem';
import type { ConfigSubsystem } from '@/api/config/configSubsystem';
import { getAllConfigSubsystem } from '@/api/config/configSubsystem';
import { getConfigItemList } from '@/api/config/configItem';

interface Props {
  open: boolean;
  loading: boolean;
  sourceItem: ConfigItem | null;
  sourceEnvironmentName: string;
  targetEnvironments: ConfigEnvironment[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', data: { targetEnvironmentId: number; targetNamespaceId: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();

const form = ref({
  targetSubsystemId: undefined as number | undefined,
  targetEnvironmentId: undefined as number | undefined,
  targetNamespaceId: ''
});

// 加载状态
const subsystemsLoading = ref(false);
const environmentsLoading = ref(false);
const namespacesLoading = ref(false);

// 数据列表
const subsystems = ref<ConfigSubsystem[]>([]);
const availableNamespaces = ref<ConfigItem[]>([]);

// 第一行: 源命名空间名称（固定）
const sourceNamespaceName = computed(() => {
  return props.sourceItem?.namespaceId || 'application.yml';
});

// 监听环境变化，加载对应的命名空间列表
watch(() => form.value.targetEnvironmentId, async (newEnvId) => {
  if (!newEnvId) {
    availableNamespaces.value = [];
    form.value.targetNamespaceId = '';
    return;
  }

  try {
    namespacesLoading.value = true;
    // 调用 getConfigItemList 获取该环境下的所有配置项（命名空间）
    const response = await getConfigItemList(form.value.targetSubsystemId || 0, '');
    availableNamespaces.value = response.data || [];
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
    availableNamespaces.value = [];
  } finally {
    namespacesLoading.value = false;
  }
});

// 加载对象信息（ConfigSubsystem）
const loadSubsystems = async () => {
  try {
    subsystemsLoading.value = true;
    const response = await getAllConfigSubsystem();
    subsystems.value = response.data || [];
  } catch (error) {
    console.error('加载对象信息失败:', error);
    subsystems.value = [];
  } finally {
    subsystemsLoading.value = false;
  }
};

// 对象信息变化时的处理
const handleSubsystemChange = async () => {
  // 重置环境和命名空间
  form.value.targetEnvironmentId = undefined;
  form.value.targetNamespaceId = '';
  availableNamespaces.value = [];
};

// 环境信息变化时的处理
const handleEnvironmentChange = async () => {
  // 重置命名空间
  form.value.targetNamespaceId = '';
  
  if (!form.value.targetEnvironmentId || !form.value.targetSubsystemId) {
    availableNamespaces.value = [];
    return;
  }

  try {
    namespacesLoading.value = true;
    // 调用 getConfigItemList 获取该环境下的所有配置项（命名空间）
    const response = await getConfigItemList(form.value.targetSubsystemId, '');
    availableNamespaces.value = response.data || [];
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
    availableNamespaces.value = [];
  } finally {
    namespacesLoading.value = false;
  }
};

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    emit('confirm', {
      targetEnvironmentId: form.value.targetEnvironmentId!,
      targetNamespaceId: form.value.targetNamespaceId
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
    targetSubsystemId: undefined,
    targetEnvironmentId: undefined,
    targetNamespaceId: ''
  };
  availableNamespaces.value = [];
  formRef.value?.resetFields();
};

// 模态框打开时加载数据
onMounted(() => {
  loadSubsystems();
});

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    loadSubsystems();
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
