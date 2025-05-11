<template>
  <a-layout-sider width="220" class="layout-sider">
    <SideMenu
      v-if="!isDashboard"
      :menuList="menuList"
      :menuKey="menuKey"
    />
  </a-layout-sider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SideMenu from '../components/SideMenu.vue'

const props = defineProps<{ menuKey: string, menuList: Array<any> }>()
const route = useRoute()
const isDashboard = computed(() => route.path === '/dashboard')
</script>