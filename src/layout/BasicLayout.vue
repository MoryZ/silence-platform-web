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
import { ref, computed, onMounted, watch } from 'vue'
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

// 强制刷新菜单的 key
const refreshMenuKey = () => {
  menuKey.value = 'side-menu-' + Date.now()
}
const menuList = ref<any[]>([])
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

  const pathMatches = (base: string, target: string) => {
    if (!base) return false
    if (target === base) return true
    if (target.startsWith(base)) {
      const rest = target.substring(base.length)
      return rest === '' || rest.startsWith('/')
    }
    return false
  }

  // 返回“最接近当前路径且拥有子菜单”的祖先作为模块根；如果没有，则返回匹配的最高祖先
  const findBestAncestorWithChildren = (menus: any[], targetPath: string): any => {
    for (const root of menus) {
      if (!pathMatches(root.path, targetPath)) continue

      // 逐层向下，尽量贴近 targetPath，同时记录最近一个拥有 children 的节点
      let current: any = root
      let best: any = current.children && current.children.length > 0 ? current : null

      let progressed = true
      while (progressed && current && current.children && current.children.length > 0) {
        progressed = false
        for (const child of current.children) {
          if (pathMatches(child.path, targetPath)) {
            current = child
            if (child.children && child.children.length > 0) best = child
            progressed = true
            break
          }
        }
      }

      // 优先返回拥有 children 的最近祖先，否则返回匹配到的最高层 root
      return best || root
    }
    return null
  }

  return findBestAncestorWithChildren(allMenus, path)
}

onMounted(() => {
  updateMenuList()
})

// 监听路由变化，更新菜单
watch(() => route.path, () => {
  updateMenuList()
})

function updateMenuList() {
  // 始终展示完整菜单树（与图一一致），不按当前路由裁剪模块
  const allMenus = ls.get(MENUS)
  if (Array.isArray(allMenus)) {
    menuList.value = allMenus
  } else {
    menuList.value = []
  }
  refreshMenuKey()
}

// 清理菜单数据，移除重复项
function cleanMenuData(menu: any): any {
  if (!menu) return menu
  
  // 如果有子菜单，递归清理
  if (menu.children && Array.isArray(menu.children)) {
    const seen = new Set()
    const cleanChildren = menu.children.filter((child: any) => {
      const key = `${child.path || ''}-${child.title || child.meta?.title || ''}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    }).map((child: any) => cleanMenuData(child))
    
    return {
      ...menu,
      children: cleanChildren
    }
  }
  
  return menu
}

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