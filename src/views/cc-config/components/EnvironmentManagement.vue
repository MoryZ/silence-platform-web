<template>
  <div class="environment-management">
    <!-- 环境标签页 -->
    <div class="environment-tabs">
      <a-tabs
        v-model:activeKey="activeTabKey"
        type="editable-card"
        @edit="handleTabEdit"
        :animated="{ tabPane: true }"
        :tabBarGutter="8"
      >
        <a-tab-pane
          v-for="env in environments"
          :key="env.id"
          :tab="env.name"
          :closable="environments.length > 1"
          :forceRender="true"
        >
          <slot name="tab-content" :environment="env"></slot>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 新增环境对话框 -->
    <a-modal
      v-model:open="showAddModal"
      title="新增环境"
      @ok="handleAddEnvironment"
      @cancel="handleAddEnvironmentCancel"
      cancelText="取消"
      okText="确定"
    >
      <a-form :model="newEnvironment" :rules="rules" ref="formRef">
        <a-form-item label="环境名称" name="name">
          <a-input v-model:value="newEnvironment.name" placeholder="请输入环境名称" />
        </a-form-item>
        <a-form-item label="显示名称" name="displayName">
          <a-input v-model:value="newEnvironment.displayName" placeholder="请输入显示名称" />
        </a-form-item>
        <a-form-item label="环境类型" name="envType">
          <span class="env-type-text">{{ currentEnvTypeLabel }}</span>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getConfigEnvironments, createConfigEnvironment, deleteConfigEnvironment } from '../../../api/config/configEnvironment';
import type { ConfigEnvironment } from '../../../api/config/configEnvironment';
import { useEnvStore } from '../../../stores/env';

interface Props {
  selectedComponents: number[];
  currentEnv: string;
}

interface Emits {
  (e: 'update:environments', environments: ConfigEnvironment[]): void;
  (e: 'update:activeTabKey', key: string | number): void;
  (e: 'refresh-data'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const envStore = useEnvStore();

// 环境标签页相关
const activeTabKey = ref<string | number>('');
const environments = ref<ConfigEnvironment[]>([]);
const showAddModal = ref(false);
const formRef = ref<FormInstance>();
const newEnvironment = ref({
  name: '',
  displayName: '',
  envType: Number(props.currentEnv),
  configComponentId: 1,
  display: true
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入环境名称', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  envType: [{ required: true, message: '请选择环境类型', trigger: 'blur' }],
};

// 计算属性
const currentEnvTypeLabel = computed(() => {
  const envTypeMap = {
    '1': '开发环境',
    '2': '测试环境',
    '3': '生产环境'
  };
  return envTypeMap[props.currentEnv] || '未知环境';
});

// 监听 props 变化
watch(
  () => [props.selectedComponents, props.currentEnv],
  () => {
    if (props.selectedComponents.length && props.currentEnv) {
      fetchEnvironments();
    }
  },
  { immediate: true }
);

// 获取环境列表
const fetchEnvironments = async () => {
  if (!props.selectedComponents.length) {
    return;
  }
  
  try {
    const componentId = props.selectedComponents[0];
    
    const response = await getConfigEnvironments({ 
      configComponentId: componentId, 
      envType: Number(props.currentEnv)
    });
    
    // 处理不同格式的API响应
    if (response) {
      let envData = [];
      
      // 处理标准响应格式 { code, data, message }
      if (typeof response === 'object' && response !== null) {
        if ('data' in response && Array.isArray(response.data)) {
          envData = response.data;
        } else if (Array.isArray(response)) {
          envData = response;
        } else {
          console.warn('Unknown response format:', response);
        }
      } else {
        console.warn('Response is not an object:', typeof response);
      }
      
      // 确保环境数据为数组
      const newEnvironments = Array.isArray(envData) ? envData : [];
      environments.value = newEnvironments;
      emit('update:environments', newEnvironments);
      
      // 如果有环境数据，设置默认选中第一个环境
      if (newEnvironments.length > 0) {
        // 重置 activeTabKey 为第一个环境的 id
        const newActiveTabKey = newEnvironments[0].id;
        activeTabKey.value = newActiveTabKey;
        emit('update:activeTabKey', newActiveTabKey);
        // 立即获取配置项列表
        emit('refresh-data');
      } else {
        console.warn('No environments found');
        activeTabKey.value = '';
        emit('update:activeTabKey', '');
      }
    } else {
      environments.value = [];
      activeTabKey.value = '';
      emit('update:environments', []);
      emit('update:activeTabKey', '');
    }
  } catch (error) {
    message.error('获取环境列表失败');
    environments.value = [];
    activeTabKey.value = '';
    emit('update:environments', []);
    emit('update:activeTabKey', '');
  }
};

// 处理标签页编辑（新增/删除）
const handleTabEdit = async (targetKey: string | number, action: 'add' | 'remove') => {
  if (action === 'add') {
    // 检查是否有选中的组件
    if (!props.selectedComponents.length) {
      message.error('请先选择组件');
      return;
    }
    // 设置默认的组件ID和环境类型
    newEnvironment.value = {
      name: '',
      displayName: '',
      envType: Number(props.currentEnv),
      configComponentId: props.selectedComponents[0],
      display: true
    };
    showAddModal.value = true;
  } else if (action === 'remove' && targetKey) {
    try {
      await deleteConfigEnvironment(Number(targetKey));
      message.success('删除环境成功');
      await fetchEnvironments();
      // 如果删除的是当前激活的标签页，自动切换到第一个标签页
      if (targetKey === activeTabKey.value) {
        if (environments.value.length > 0) {
          const newActiveTabKey = environments.value[0].id;
          activeTabKey.value = newActiveTabKey;
          emit('update:activeTabKey', newActiveTabKey);
          if (newActiveTabKey) {
            emit('refresh-data');
          }
        } else {
          activeTabKey.value = '';
          emit('update:activeTabKey', '');
        }
      }
    } catch (error) {
      console.error('删除环境失败:', error);
      message.error('删除环境失败');
    }
  }
};

// 处理新增环境
const handleAddEnvironment = async () => {
  try {
    // 先进行表单验证
    if (!formRef.value) {
      return;
    }
    await formRef.value.validate();

    // 检查组件选择
    if (!props.selectedComponents.length) {
      message.error('请先选择组件');
      return;
    }
    
    // 设置组件ID
    const componentId = props.selectedComponents[0];
    const params = {
      ...newEnvironment.value,
      configComponentId: componentId
    };
    
    const response = await createConfigEnvironment(params);
    if (response?.data) {
      // 先重置表单
      formRef.value.resetFields();
      newEnvironment.value = { 
        name: '', 
        displayName: '', 
        envType: Number(props.currentEnv), 
        configComponentId: componentId, 
        display: true 
      };
      
      // 关闭弹窗
      showAddModal.value = false;
      
      // 显示成功消息
      message.success('新增环境成功');
      
      // 重新获取环境列表
      await fetchEnvironments();
      
      // 如果有新环境，设置为当前激活的环境
      if (environments.value.length > 0) {
        const newEnv = environments.value.find(env => env.id === response.data.id);
        if (newEnv) {
          activeTabKey.value = newEnv.id;
          emit('update:activeTabKey', newEnv.id);
          emit('refresh-data');
        }
      }
    }
  } catch (error) {
    console.error('新增环境失败:', error);
    message.error('新增环境失败');
  }
};

// 添加取消处理函数
const handleAddEnvironmentCancel = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  newEnvironment.value = { 
    name: '', 
    displayName: '', 
    envType: Number(props.currentEnv),
    configComponentId: props.selectedComponents[0] || 1, 
    display: true 
  };
  showAddModal.value = false;
};

// 暴露方法给父组件
defineExpose({
  fetchEnvironments,
  activeTabKey: computed(() => activeTabKey.value)
});
</script>

<style lang="scss" scoped>
.environment-management {
  .environment-tabs {
    margin-bottom: 24px;
    
    :deep(.ant-tabs-nav) {
      margin-bottom: 16px;
      
      .ant-tabs-tab {
        margin: 0;
        padding: 8px 16px;
        transition: all 0.3s;
        
        &.ant-tabs-tab-active {
          background: var(--primary-1);
          border-color: var(--primary-color);
          
          .ant-tabs-tab-btn {
            color: var(--primary-color);
            font-weight: 500;
          }
        }
        
        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }

  .env-type-text {
    display: inline-block;
    padding: 4px 8px;
    background-color: var(--primary-1);
    color: var(--primary-color);
    border-radius: 4px;
    font-size: 14px;
  }
}
</style>
