<template>
    <a-drawer
      :open="open"
      @update:open="val => $emit('update:open', val)"
      placement="left"
      width="800"
      :closable="false"
      :mask="true"
      :maskClosable="true"
      class="all-products-drawer"
    >
      <!-- 搜索框 -->
      <div class="drawer-search">
        <a-input
          v-model:value="search"
          placeholder="请输入关键字搜索产品"
          allow-clear
          @input="onSearch"
          prefix-icon="search"
        />
      </div>
      <!-- 最近访问/收藏/分组 -->
      <div class="drawer-section" v-if="recentVisited.length">
        <div class="section-title">最近访问产品</div>
        <div class="recent-tags">
          <a-tag
            v-for="item in recentVisited"
            :key="item.path"
            @click="goTo(item.path, item)"
          >
            <span>{{ item.title }}</span>
          </a-tag>
        </div>
      </div>
      <div class="drawer-section" v-if="favorites.length">
        <div class="section-title">我的收藏</div>
        <div class="favorite-tags">
          <a-tag
            v-for="item in favorites"
            :key="item.path"
            @click="goTo(item.path, item)"
          >
            <span>{{ item.title }}</span>
          </a-tag>
        </div>
      </div>
      <!-- 产品分组多列 -->
      <div class="products-grid">
        <div
          v-for="group in filteredGroups"
          :key="group.name"
          class="product-group"
        >
          <div class="group-title">{{ group.name }}</div>
          <div class="group-items">
            <div
              v-for="item in group.items"
              :key="item.path"
              class="product-item"
            >
              <a @click="selectModule(group.module, item)">
                {{ item.title }}
              </a>
              <component
                :is="isFavorite(item) ? StarFilled : StarOutlined"
                @click.stop="toggleFavorite(item)"
                :title="isFavorite(item) ? '取消收藏' : '点击收藏'"
                class="star"
              />
            </div>
          </div>
        </div>
      </div>
    </a-drawer>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { RECENT_VISITED_PRODUCTS, FAVORITE_PRODUCTS } from '@/utils/constant'
  import { ls } from '@/utils/stoarge'
  import { StarOutlined, StarFilled } from '@ant-design/icons-vue'
  
  interface ProductItem {
    title: string
    path: string
    [key: string]: any
  }
  
  const props = defineProps({
    open: Boolean
  })
  const emit = defineEmits(['update:open', 'selectModule'])
  
  const router = useRouter()
  const search = ref('')
  const recentVisited = ref<ProductItem[]>([])
  const favorites = ref<ProductItem[]>([])
  
  // 示例分组数据
  const groups = ref([
    {
      name: '配置中心CC',
      module: '/cc-config',
      items: [
        { title: '基础配置', path: '/cc-config/center' },
        { title: '子系统管理', path: '/cc-config/subsystem' },
        // ...
      ]
    },
    {
      name: '任务调度SilenceJob',
      module: '/job',
      items: [
        { title: '命名空间', path: '/job/namespace' },
        // ...
      ]
    },
    {
      name: '消息队列SilenceMQ',
      module: '/mq',
      items: [
        { title: 'TOPIC管理', path: '/mq/topic' },
        { title: '消息管理', path: '/mq/message' },
      ]
    },
    {
      name: '系统管理',
      module: '/system',
      items: [
        { title: '用户管理', path: '/system/user' },
        { title: '角色管理', path: '/system/role' },
        { title: '菜单管理', path: '/system/menu' },
        { title: '通知管理', path: '/system/notice' },
      ]
    },
  ])
  
  const filteredGroups = computed(() => {
    if (!search.value) return groups.value
    return groups.value
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.title.includes(search.value)
        )
      }))
      .filter(group => group.items.length)
  })
  
  function goTo(path: string, item?: ProductItem) {
    emit('update:open', false)
    if (item && item.module) {
      emit('selectModule', item)
    }
    router.push(path)
    if (item) {
      addRecentVisited(item)
    }
  }
  
  function loadFavorites() {
    const list = ls.get(FAVORITE_PRODUCTS) || []
    favorites.value = Array.isArray(list) ? list : []
  }
  
  function saveFavorites() {
    ls.set(FAVORITE_PRODUCTS, favorites.value)
  }
  
  function isFavorite(item: any) {
    return favorites.value.some(fav => fav.path === item.path)
  }
  
  function toggleFavorite(item: any) {
    if (isFavorite(item)) {
      favorites.value = favorites.value.filter(fav => fav.path !== item.path)
    } else {
      favorites.value.push(item)
    }
    saveFavorites()
  }
  
  function onSearch() {
    // 可做高亮等
  }
  
  function selectModule(module: string, item: any) {
    emit('update:open', false)
    emit('selectModule', { ...item, module })
    addRecentVisited({ ...item, module })
  }
  
  function addRecentVisited(item: ProductItem) {
    let list = ls.get(RECENT_VISITED_PRODUCTS) || []
    list = Array.isArray(list) ? list : []
    list = list.filter((i: any) => i.path !== item.path)
    list.unshift(item)
    if (list.length > 8) list = list.slice(0, 8)
    ls.set(RECENT_VISITED_PRODUCTS, list)
    recentVisited.value = list
    // 确保 item.module 存在
    if (!item.module) {
      // 尝试根据 path 匹配 groups，补全 module 字段
      const group = groups.value.find(g => item.path.startsWith(g.module))
      if (group) item.module = group.module
    }
  }
  
  onMounted(() => {
    const list = ls.get(RECENT_VISITED_PRODUCTS) || []
    recentVisited.value = Array.isArray(list) ? list : []
    loadFavorites()
  })
  </script>
  
  <style scoped>
  .all-products-drawer { background: #fff; }
  .drawer-search { padding: 16px 24px; }
  .drawer-section { padding: 0 24px 16px 24px; }
  .section-title { font-weight: bold; margin-bottom: 8px; }
  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 两列 */
    gap: 32px 24px; /* 行间距32px，列间距24px */
    padding: 0 24px;
  }
  .product-group {
    background: #fafbfc;
    border-radius: 8px;
    padding: 12px 16px 8px 16px;
    min-width: 180px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .group-title {
    color: #1890ff;
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 15px;
  }
  .group-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .product-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 0;
    min-height: 32px;
  }
  .product-item a {
    color: #222;
    cursor: pointer;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .star {
    margin-left: 8px;
    font-size: 18px;
    color: #faad14;
    cursor: pointer;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .star:hover {
    color: #fadb14;
  }
  .all-products-btn {
    width: 40px;
    height: 40px;
    background: #fff;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .all-products-btn.active,
  .all-products-btn:hover {
    background: #1677ff;
  }
  .all-products-btn .icon-x {
    color: #1677ff;
    font-size: 24px;
    transition: color 0.2s;
  }
  .all-products-btn.active .icon-x,
  .all-products-btn:hover .icon-x {
    color: #fff;
  }
  </style>