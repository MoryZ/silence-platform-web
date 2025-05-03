<template>
  <a-breadcrumb class="breadcrumb">
    <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
      <router-link :to="item.path">{{ item.title }}</router-link>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

interface BreadcrumbItem {
  title: string;
  path: string;
}

const route = useRoute();
const breadcrumbs = ref<BreadcrumbItem[]>([]);

const routeMap = {
  dashboard: { title: '仪表盘', path: '/dashboard' },
  'cc-config': { title: 'CC配置', path: '/cc-config' },
  'cc-config-basic': { title: '基础配置', path: '/cc-config/basic' },
  'silence-job': { title: 'SilenceJob', path: '/silence-job' },
  'silence-job-list': { title: '任务列表', path: '/silence-job/list' },
  'silence-job-history': { title: '执行历史', path: '/silence-job/history' },
  'silence-job-log': { title: '任务日志', path: '/silence-job/log' },
  'silence-mq': { title: 'SilenceMQ', path: '/silence-mq' },
  'silence-mq-queue': { title: '队列管理', path: '/silence-mq/queue' },
  'silence-mq-message': { title: '消息管理', path: '/silence-mq/message' },
  'silence-mq-monitor': { title: '监控统计', path: '/silence-mq/monitor' },
  settings: { title: '设置', path: '/settings' },
  'settings-general': { title: '通用设置', path: '/settings/general' },
  'settings-security': { title: '安全设置', path: '/settings/security' },
  'settings-backup': { title: '备份设置', path: '/settings/backup' },
};

const updateBreadcrumbs = () => {
  const pathSegments = route.path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const routeKey = pathSegments.slice(0, index + 1).join('-');
    const routeInfo = routeMap[routeKey];
    
    if (routeInfo) {
      items.push({
        title: routeInfo.title,
        path: routeInfo.path,
      });
    }
  });
  
  breadcrumbs.value = items;
};

watch(() => route.path, updateBreadcrumbs, { immediate: true });
</script>

<style lang="scss" scoped>
.breadcrumb {
  display: inline-block;
  
  :deep(.ant-breadcrumb-link) {
    a {
      color: var(--text-color);
      opacity: 0.85;
      transition: color 0.3s;
      
      &:hover {
        color: var(--primary-color);
      }
    }
  }
  
  :deep(.ant-breadcrumb-separator) {
    color: var(--text-color);
    opacity: 0.45;
  }
}
</style> 