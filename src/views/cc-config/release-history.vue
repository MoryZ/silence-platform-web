<template>
  <ReleaseHistory
    :config-item-id="configItemId"
    :config-environment-id="configEnvironmentId"
    :namespace-id="namespaceId"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ReleaseHistory from './components/release-history.vue';

const route = useRoute();

const configItemId = computed(() => {
  const rawValue = route.query.configItemId;
  const parsedValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const numericValue = Number(parsedValue);
  return Number.isFinite(numericValue) ? numericValue : null;
});

const configEnvironmentId = computed(() => {
  const rawValue = route.query.configEnvironmentId;
  const parsedValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const numericValue = Number(parsedValue);
  return Number.isFinite(numericValue) ? numericValue : null;
});

const namespaceId = computed(() => {
  const rawValue = route.query.namespaceId;
  return Array.isArray(rawValue) ? rawValue[0] || '' : rawValue || '';
});
</script>