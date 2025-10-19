<template>
  <slot v-if="hasPermission"></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { hasPermission as checkPermission, hasAnyPermission } from '@/utils/permissionCheck'

const props = defineProps({
  value: {
    type: [String, Array] as any,
    required: true
  }
})

const hasPermission = computed(() => {
  if (!props.value) return true
  
  if (Array.isArray(props.value)) {
    return hasAnyPermission(props.value)
  }
  
  return checkPermission(props.value)
})
</script>
