<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
  icon?: string;
  localIcon?: string;
  size?: number | string;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: '1em',
  color: undefined
});

const sizeValue = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
const colorStyle = computed(() => (props.color ? { color: props.color } : {}));

const localIconModules = import.meta.glob('../../assets/icons/*.svg', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

const localIconSrc = computed(() => {
  if (!props.localIcon) {
    return '';
  }
  const entry = Object.entries(localIconModules).find(([path]) => path.endsWith(`${props.localIcon}.svg`));
  return entry ? entry[1] : '';
});
</script>

<template>
  <span class="svg-icon" :style="colorStyle">
    <Icon
      v-if="icon"
      :icon="icon"
      :width="sizeValue"
      :height="sizeValue"
      aria-hidden="true"
    />
    <img
      v-else-if="localIconSrc"
      :src="localIconSrc"
      :alt="localIcon"
      :style="{ width: sizeValue, height: sizeValue }"
      aria-hidden="true"
    />
    <slot v-else />
  </span>
</template>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.svg-icon img {
  display: inline-block;
  object-fit: contain;
}
</style>

