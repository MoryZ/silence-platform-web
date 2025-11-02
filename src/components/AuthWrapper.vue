<template>
  <component
    :is="tag"
    v-if="hasAccess"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUserStore } from '../stores/user';
import { usePermissionStore } from '../stores/permission';

const props = defineProps<{
  permission?: string;
  role?: string;
  tag?: string;
}>();

const userStore = useUserStore();
const permissionStore = usePermissionStore();

const hasAccess = computed(() => {
  // 检查权限
  if (props.permission && !permissionStore.hasPermission(props.permission)) {
    return false;
  }
  // 检查角色
  if (props.role) {
    const userInfo = userStore.userInfo;
    if (!userInfo || !userInfo.roles || !userInfo.roles.includes(props.role)) {
      return false;
    }
  }
  return true;
});
</script> 