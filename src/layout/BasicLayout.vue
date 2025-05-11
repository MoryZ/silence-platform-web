<template>
  <a-layout class="layout-container">
    <LayoutSider
      v-if="!isDashboard"
      :menuKey="menuKey"
      :menuList="menuList"
    />
    <a-layout class="main-layout">
      <LayoutHeader :collapsed="collapsed" @showAllProducts="drawerOpen = true" />
      <LayoutContent :cachedViews="cachedViews" @selectModule="onSelectModule" />
      <LayoutFooter />
      <AllProductsDrawer
        v-model:open="drawerOpen"
        @selectModule="onSelectModule"
      />
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ls } from '@/utils/stoarge'
import { MENUS } from '@/utils/constant'
import LayoutHeader from './LayoutHeader.vue'
import LayoutSider from './LayoutSider.vue'
import LayoutContent from './LayoutContent.vue'
import LayoutFooter from './LayoutFooter.vue'
import AllProductsDrawer from '../components/AllProductsDrawer.vue'

const route = useRoute()
const router = useRouter()
const isDashboard = computed(() => route.path === '/dashboard')
const menuKey = ref('side-menu-' + Date.now())
const menuList = ref([{ path: '/dashboard', title: '仪表盘', key: 'dashboard' }])
const collapsed = ref(false)
const drawerOpen = ref(false)

const cachedViews = computed(() => {
  const menus = ls.get(MENUS)
  if (!menus || !Array.isArray(menus)) return []
  const extractComponentNames = (menuItems: any[]) => {
    let names: string[] = []
    menuItems.forEach(item => {
      if (item.path) {
        const derivedName = item.name || item.path.replace(/^\//, '').replace(/\//g, '-')
        names.push(derivedName)
      }
      if (item.children && item.children.length > 0) {
        names = names.concat(extractComponentNames(item.children))
      }
    })
    return names
  }
  return ['Dashboard', ...extractComponentNames(menus)]
})

function getCurrentModuleByPath(path: string) {
  const allMenus = ls.get(MENUS)
  if (!allMenus || !Array.isArray(allMenus)) return null
  return allMenus.find(item => path.startsWith(item.path))
}

onMounted(() => {
  if (!isDashboard.value) {
    const currentModule = getCurrentModuleByPath(route.path)
    if (currentModule) {
      menuList.value = [currentModule]
    }
  }
})

function getMenusByModule(module: any) {
  // 读取 localStorage
  const allMenus = ls.get(MENUS)
  if (!allMenus || !Array.isArray(allMenus)) return []
  const filtered = allMenus.filter(item => item.path === module.module)
  return filtered

}

function onSelectModule(module: any) {
  menuList.value = getMenusByModule(module)
  router.push(module.path) // 如需自动跳转
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
}
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
}
.layout-content {
  flex: 1;
  padding: 24px;
  min-height: 0;
  background: #f6fbfa;
}
.layout-sider {
  background: #001529;
  height: 100vh;
}
.side-menu-container {
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>