<template>
  <div class="tabs-view">
    <div class="tabs-wrapper">
      <a-tabs
        v-model:activeKey="activeKey"
        type="editable-card"
        :hide-add="true"
        @edit="onEdit"
        @contextmenu.prevent
      >
        <a-tab-pane
          v-for="tab in visitedTabs"
          :key="tab.path"
          :closable="!tab.fixed"
        >
          <template #tab>
            <div
              class="tab-item"
              @contextmenu.prevent="(e) => handleContextMenu(e, tab)"
            >
              <component :is="tab.icon" v-if="tab.icon" />
              <span>{{ tab.title }}</span>
            </div>
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 右键菜单 -->
    <a-dropdown
      v-model:open="contextMenuVisible"
      :trigger="['contextmenu']"
      @openChange="onOpenChange"
    >
      <div
        class="context-menu-wrapper"
        :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
      ></div>
      <template #overlay>
        <a-menu @click="onContextMenuClick">
          <a-menu-item key="refresh">
            <reload-outlined />
            <span>刷新页面</span>
          </a-menu-item>
          <a-menu-item key="fixCurrent" v-if="!currentTab?.fixed">
            <push-pin-outlined />
            <span>固定标签</span>
          </a-menu-item>
          <a-menu-item key="unfixCurrent" v-else>
            <push-pin-outlined />
            <span>取消固定</span>
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="closeOthers" :disabled="visitedTabs.length <= 1">
            <close-outlined />
            <span>关闭其他</span>
          </a-menu-item>
          <a-menu-item key="closeRight" :disabled="isLastTab">
            <close-circle-outlined />
            <span>关闭右侧</span>
          </a-menu-item>
          <a-menu-item key="closeAll" :disabled="!hasClosableTabs">
            <close-square-outlined />
            <span>关闭所有</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script lang="ts" setup>
import {
  ReloadOutlined,
  PushpinOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  CloseSquareOutlined,
} from '@ant-design/icons-vue';
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

interface TabItem {
  title: string;
  path: string;
  icon?: any;
  fixed?: boolean;
}

const router = useRouter();
const route = useRoute();

const activeKey = ref(route.path);
const visitedTabs = ref<TabItem[]>([
  {
    title: '工作台',
    path: '/',
    fixed: true,
  },
]);

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuLeft = ref(0);
const contextMenuTop = ref(0);
const currentTab = ref<TabItem | null>(null);

// 计算属性
const isLastTab = computed(() => {
  const currentIndex = visitedTabs.value.findIndex(tab => tab.path === currentTab.value?.path);
  return currentIndex === visitedTabs.value.length - 1;
});

const hasClosableTabs = computed(() => {
  return visitedTabs.value.some(tab => !tab.fixed);
});

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    activeKey.value = newPath;
    const title = route.meta?.title || route.name || '未命名';
    const icon = route.meta?.icon;
    
    // 检查是否已存在相同路径的标签
    const existingTab = visitedTabs.value.find(t => t.path === newPath);
    if (existingTab) {
      // 更新已存在标签的标题和图标
      if (existingTab.title !== title || existingTab.icon !== icon) {
        Object.assign(existingTab, {
          title: String(title),
          icon: icon,
        });
      }
    } else {
      // 添加新标签
      visitedTabs.value.push({
        title: String(title),
        path: newPath,
        icon: icon,
      });
    }
  },
  { immediate: true }
);

// 关闭标签
const closeTab = (targetPath: string) => {
  const tabs = visitedTabs.value;
  let activeIndex = tabs.findIndex(tab => tab.path === activeKey.value);
  
  if (targetPath === activeKey.value) {
    tabs.forEach((tab, index) => {
      if (tab.path === targetPath) {
        const nextTab = tabs[index + 1] || tabs[index - 1];
        if (nextTab) {
          activeKey.value = nextTab.path;
          router.push(nextTab.path);
        }
      }
    });
  }
  visitedTabs.value = tabs.filter(tab => tab.path !== targetPath);
};

// 处理标签编辑
const onEdit = (targetPath: string | MouseEvent, action: 'add' | 'remove') => {
  if (action === 'remove' && typeof targetPath === 'string') {
    closeTab(targetPath);
  }
};

// 处理右键菜单
const handleContextMenu = (e: MouseEvent, tab: TabItem) => {
  e.preventDefault();
  contextMenuLeft.value = e.clientX;
  contextMenuTop.value = e.clientY;
  contextMenuVisible.value = true;
  currentTab.value = tab;
};

// 右键菜单可见性变化
const onOpenChange = (visible: boolean) => {
  if (!visible) {
    currentTab.value = null;
  }
};

// 处理右键菜单点击
const onContextMenuClick = ({ key }: { key: string }) => {
  if (!currentTab.value) return;
  
  switch (key) {
    case 'refresh':
      router.go(0);
      break;
    case 'fixCurrent':
      currentTab.value.fixed = true;
      break;
    case 'unfixCurrent':
      currentTab.value.fixed = false;
      break;
    case 'closeOthers':
      visitedTabs.value = visitedTabs.value.filter(
        tab => tab.fixed || tab.path === currentTab.value?.path
      );
      break;
    case 'closeRight':
      const currentIndex = visitedTabs.value.findIndex(
        tab => tab.path === currentTab.value?.path
      );
      visitedTabs.value = visitedTabs.value.filter(
        (tab, index) => index <= currentIndex || tab.fixed
      );
      break;
    case 'closeAll':
      visitedTabs.value = visitedTabs.value.filter(tab => tab.fixed);
      break;
  }
  contextMenuVisible.value = false;
};
</script>

<style lang="scss" scoped>
.tabs-view {
  position: relative;
  background-color: var(--component-background);
  border-bottom: 1px solid var(--border-color);
  
  .tabs-wrapper {
    padding: 6px 16px 0;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    
    :deep(.ant-tabs) {
      .ant-tabs-nav {
        margin: 0;
        
        &::before {
          border-bottom-color: var(--border-color);
        }

        .ant-tabs-nav-wrap {
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          margin-bottom: -1px; // 防止出现水平滚动条
        }
        
        .ant-tabs-nav-list {
          display: flex;
          flex-wrap: nowrap;
          padding: 0;
        }
        
        .ant-tabs-tab {
          background: transparent;
          border-color: transparent;
          color: var(--text-color);
          opacity: 0.65;
          transition: all 0.3s;
          flex-shrink: 0;
          padding: 8px 12px;
          margin: 0 4px 0 0;
          border: 1px solid transparent;
          border-radius: 4px 4px 0 0;
          height: 32px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          
          &:hover {
            color: var(--text-color);
            opacity: 1;
            background: var(--menu-item-hover-bg);
          }
          
          &.ant-tabs-tab-active {
            background: var(--menu-item-active-bg);
            border-color: var(--border-color);
            border-bottom-color: transparent;
            
            .ant-tabs-tab-btn {
              color: var(--primary-color);
              opacity: 1;
            }
          }
          
          .tab-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            margin-right: 4px;
            
            .anticon {
              font-size: 14px;
            }
          }

          :deep(.ant-tabs-tab-remove) {
            margin: 0;
            padding: 4px;
            color: var(--text-color);
            opacity: 0.45;
            font-size: 12px;
            background: transparent;
            border-radius: 50%;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: -4px;
            
            &:hover {
              color: #ff4d4f;
              opacity: 1;
              background: rgba(255, 77, 79, 0.1);
            }
          }
        }
      }
    }
  }
}

.context-menu-wrapper {
  position: fixed;
  z-index: 100;
}

:deep(.ant-dropdown-menu) {
  background-color: var(--component-background);
  
  .ant-dropdown-menu-item {
    color: var(--text-color);
    
    &:hover {
      background-color: var(--menu-item-hover-bg);
    }
    
    .anticon {
      margin-right: 8px;
    }
  }
  
  .ant-dropdown-menu-divider {
    background-color: var(--border-color);
  }
}
</style> 