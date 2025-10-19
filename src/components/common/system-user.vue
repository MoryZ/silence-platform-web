<template>
  <div class="system-user">
    <Select
      v-model:value="selectedValue"
      :options="userOptions"
      :placeholder="placeholder"
      :allow-clear="clearable"
      :loading="loading"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Select } from 'ant-design-vue';
import { fetchSystemUser } from '@/api/job/systemUser';

defineOptions({
  name: 'SystemUser'
});

interface Props {
  modelValue?: string;
  clearable?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  clearable: false,
  placeholder: '请选择用户'
});

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const emit = defineEmits<Emits>();

const selectedValue = ref(props.modelValue);
const userOptions = ref<Array<{ label: string; value: string }>>([]);
const loading = ref(false);

const loadUsers = async () => {
  loading.value = true;
  try {
    const data = await fetchSystemUser();
    userOptions.value = (data || []).map((user: any) => ({
      label: user.name || user.username || user.id,
      value: user.id || user.username
    }));
  } catch (error) {
    console.error('Failed to load users:', error);
    userOptions.value = [];
  } finally {
    loading.value = false;
  }
};

const handleChange = (value: string) => {
  selectedValue.value = value;
  emit('update:modelValue', value);
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.system-user {
  width: 100%;
}
</style>
