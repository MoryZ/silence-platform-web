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

const props = defineProps<{
  permission?: string;
  role?: string;
  tag?: string;
}>();

const userStore = useUserStore();

const hasAccess = computed(() => {
  if (props.permission && !userStore.hasPermission(props.permission)) {
    return false;
  }
  if (props.role && !userStore.hasRole(props.role)) {
    return false;
  }
  return true;
});
</script> 