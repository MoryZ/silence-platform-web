<script setup lang="ts">
import { computed, nextTick, onUnmounted, reactive } from 'vue';
import { createReusableTemplate } from '@vueuse/core';
import { $t } from '../../../..//locales';
import { useRouter } from 'vue-router';
import { useThemeStore } from '@/stores/theme/index';
import DardRetryChart from './card-retry-chart.vue';
import { generate } from '@ant-design/colors';

const router = useRouter();
const themeStore = useThemeStore()


defineOptions({
  name: 'CardData'
});

interface Props {
  modelValue?: any;
}

const state = reactive({ width: 0 });
const gridCol = computed(() => {
  if (state.width >= 1600) {
    return 4;
  } else if (state.width >= 1024) {
    return 2;
  }
  return 1;
});

const colSpan = computed(() => 24 / gridCol.value);

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) {
    return '0';
  }
  return Number(value).toLocaleString();
};

const getState = () => {
  state.width = document.documentElement.clientWidth;
};

nextTick(() => {
  getState();
  window.addEventListener('resize', getState);
});

onUnmounted(() => {
  // 移除监听事件
  window.removeEventListener('resize', getState);
});

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    jobTask: {
      successNum: 0,
      failNum: 0,
      cancelNum: 0,
      stopNum: 0,
      totalNum: 0,
      successRate: 0
    },
    workFlowTask: {
      successNum: 0,
      failNum: 0,
      cancelNum: 0,
      stopNum: 0,
      totalNum: 0,
      successRate: 0
    },
    retryTask: {
      totalNum: 0,
      runningNum: 0,
      finishNum: 0,
      maxCountNum: 0,
      suspendNum: 0
    },
    retryTaskBarList: [],
    onLineService: {
      total: 0,
      clientTotal: 0,
      serverTotal: 0
    }
  })
});

interface CardData {
  key: string;
  title: string;
  tip: string;
  value: number;
  click?: () => void;
  color: {
    start: string;
    end: string;
  };
  icon: string;
  bottom: { label: string; value: number; click?: () => void }[];
}

// eslint-disable-next-line complexity
const cardData = computed<CardData[]>(() => [
  {
    key: 'job_task',
    title: $t('page.home.jobTask'),
    tip: $t('page.home.jobTaskTip'),
    value: props.modelValue?.jobTask.totalNum ?? 0,
    click: () => router.replace('job_task'),
    color: {
      start: '#f5b386',
      end: '#FFD6BA'
    },
    icon: 'ant-design:profile-outlined',
    bottom: [
      {
        label: $t('common.success'),
        value: props.modelValue?.jobTask.successNum ?? 0,
        click: () => router.replace({ path: 'job_batch', state: { taskBatchStatus: 3 } } as any)
      },
      {
        label: $t('common.fail'),
        value: props.modelValue?.jobTask.failNum ?? 0,
        click: () => router.replace({ path: 'job_batch', state: { taskBatchStatus: 4 } } as any)
      },
      {
        label: $t('common.stop'),
        value: props.modelValue?.jobTask.stopNum ?? 0,
        click: () => router.replace({ path: 'job_batch', state: { taskBatchStatus: 5 } } as any)
      },
      {
        label: $t('common.cancel'),
        value: props.modelValue?.jobTask.cancelNum ?? 0,
        click: () => router.replace({ path: 'job_batch', state: { taskBatchStatus: 6 } } as any)
      }
    ]
  },
  {
    key: 'retry_task',
    title: $t('page.home.retryTask.title'),
    tip: $t('page.home.retryTaskTip'),
    value: props.modelValue?.retryTask.totalNum ?? 0,
    click: () => router.replace('retry_task'),
    unit: '',
    color: {
      start: '#40e9c5',
      end: '#BEE3DB'
    },
    icon: 'ant-design:schedule-outlined',
    bottom: [
      {
        label: $t('common.success'),
        value: props.modelValue?.retryTask.finishNum ?? 0,
        click: () => router.replace({ path: 'retry_info', state: { retryStatus: 1 } } as any)
      },
      {
        label: $t('common.running'),
        value: props.modelValue?.retryTask.runningNum ?? 0,
        click: () => router.replace({ path: 'retry_info', state: { retryStatus: 0 } } as any)
      },
      {
        label: $t('page.home.retryTask.status.maxRetryTimes'),
        value: props.modelValue?.retryTask.maxCountNum ?? 0,
        click: () => router.replace({ path: 'retry_info', state: { retryStatus: 2 } } as any)
      },
      {
        label: $t('page.home.retryTask.status.pauseRetry'),
        value: props.modelValue?.retryTask.suspendNum ?? 0,
        click: () => router.replace({ path: 'retry_info', state: { retryStatus: 3 } } as any)
      }
    ]
  },
  {
    key: 'workflow_task',
    title: $t('page.home.workflow'),
    tip: $t('page.home.workflowTip'),
    value: props.modelValue?.workFlowTask.totalNum,
    click: () => router.replace('workflow_task'),
    unit: '',
    color: {
      start: '#ec6f6f',
      end: '#f99797'
    },
    icon: 'typcn:flow-merge',
    bottom: [
      {
        label: $t('common.success'),
        value: props.modelValue?.workFlowTask.successNum ?? 0,
        click: () => router.replace({ path: 'workflow_batch', state: { taskBatchStatus: 3 } } as any)
      },
      {
        label: $t('common.fail'),
        value: props.modelValue?.workFlowTask.failNum ?? 0,
        click: () => router.replace({ path: 'workflow_batch', state: { taskBatchStatus: 4 } } as any)
      },
      {
        label: $t('common.stop'),
        value: props.modelValue?.workFlowTask.stopNum ?? 0,
        click: () => router.replace({ path: 'workflow_batch', state: { taskBatchStatus: 5 } } as any)
      },
      {
        label: $t('common.cancel'),
        value: props.modelValue?.workFlowTask.cancelNum ?? 0,
        click: () => router.replace({ path: 'workflow_batch', state: { taskBatchStatus: 6 } } as any)
      }
    ]
  },
  {
    key: 'pods',
    title: $t('page.home.onlineServiceCount'),
    tip: $t('page.home.onlineServiceTip'),
    value: props.modelValue?.onLineService.total ?? 0,
    click: () => router.replace('pods'),
    unit: '',
    color: {
      start: '#b686d4',
      end: '#c5a5d8'
    },
    icon: 'ant-design:database-outlined',
    bottom: [
      {
        label: $t('page.home.machine.type.client'),
        value: props.modelValue?.onLineService.clientTotal ?? 0,
        click: () => router.replace('pods')
      },
      {
        label: $t('page.home.machine.type.server'),
        value: props.modelValue?.onLineService.serverTotal ?? 0,
        click: () => router.replace('pods')
      }
    ]
  }
]);

interface GradientBgProps {
  gradientColor: string;
}

const [DefineGradientBg, GradientBg] = createReusableTemplate<GradientBgProps>();

function getGradientColor(color: CardData['color']) {
  const start = (themeStore as any).darkMode ? getPaletteColorByNumber(color.start, 700) : color.start;
  const end = (themeStore as any).darkMode ? getPaletteColorByNumber(color.end, 700) : color.end;
  return `linear-gradient(to bottom right, ${start}, ${end})`;
}

// 获取主题色
const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

function getPaletteColorByNumber(baseColor, index = 5) {
  const colors = generate(baseColor);
  return colors[index]; // index 0-9
}

// 用法
const color = getPaletteColorByNumber('#1890ff', 7); // 比如 7 是较深的蓝色
</script>

<template>
  <a-card :bordered="false" size="small" class="card-wrapper">
    <DefineGradientBg v-slot="{ $slots, gradientColor }">
      <div class="rd-8px px-16px pb-4px pt-8px text-white" :style="{ backgroundImage: gradientColor }">
        <component :is="$slots.default" />
      </div>
    </DefineGradientBg>

    <a-row :gutter="[16, 16]">
      <a-col v-for="item in cardData" :key="item.key" :span="colSpan" class="home-card">
        <GradientBg :gradient-color="getGradientColor(item.color)" class="home-card__gradient">
          <div class="home-card__inner" :class="{ 'cursor-pointer': item.click }" @click="item.click">
            <div class="home-card__header">
              <div class="home-card__title">
                <SvgIcon :icon="item.icon" class="home-card__icon" />
                <h3>{{ item.title }}</h3>
              </div>
              <a-popover trigger="hover">
                <template #content>
                  {{ item.tip }}
                </template>
                <a-button type="text" class="home-card__info">
                  <SvgIcon icon="ant-design:info-circle-outlined" class="text-20px color-white" />
                </a-button>
              </a-popover>
            </div>
            <div class="home-card__value">
              <span>{{ formatNumber(item.value) }}</span>
            </div>
          </div>
          <a-progress
            v-if="item.key === 'job_task'"
            class="progress-custom"
            :percent="props.modelValue?.jobTask.successRate ?? 0"
            :show-info="false"
            stroke-color="#728bf9"
          />
          <a-progress
            v-else-if="item.key === 'workflow_task'"
            class="progress-custom"
            :percent="props.modelValue?.workFlowTask.successRate ?? 0"
            :show-info="false"
            stroke-color="#728bf9"
          />
          <DardRetryChart v-else-if="item.key === 'retry_task'" :model-value="props.modelValue?.retryTaskBarList" />
          <div v-else class="home-card__placeholder"></div>
          <a-divider class="home-card__divider" />
          <div class="home-card__footer">
            <template v-for="(bottomItem, bottomIndex) in item.bottom" :key="bottomIndex">
              <a-divider v-if="bottomIndex !== 0" type="vertical" />
              <span :class="bottomItem.click ? 'cursor-pointer home-card-footer' : null" @click="bottomItem.click">
                {{ bottomItem.label }}
                <span class="home-card__footer-value">{{ formatNumber(bottomItem.value as number) }}</span>
              </span>
            </template>
          </div>
        </GradientBg>
      </a-col>
    </a-row>
  </a-card>
</template>

<style scoped>
.n-divider {
  margin: 0px 0 6px;
}

.n-divider--vertical {
  margin: 0 5px 0 5px;
}

:deep(.n-progress-icon--as-text) {
  width: 60px !important;
}

.home-card {
  min-height: 195px;
}

.home-card__gradient {
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  padding: 20px 18px 12px;
  height: 100%;
  transition: all 0.25s ease-in;
}

.home-card__gradient:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
}

.home-card__inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: #fff;
}

.home-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-card__title h3 {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.home-card__icon {
  font-size: 26px;
}

.home-card__info {
  padding: 0;
  color: #fff;
}

.home-card__value {
  color: #fff;
  font-size: 34px;
  font-weight: 600;
}

.home-card__value span {
  line-height: 1;
}

.progress-custom {
  margin-top: 12px;
}

.home-card__placeholder {
  height: 32px;
}

.home-card__divider {
  margin: 12px 0 8px;
  border-color: rgba(255, 255, 255, 0.35);
}

.home-card__footer {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 14px;
}

.home-card__footer :deep(.ant-divider-vertical) {
  height: 16px;
  border-color: rgba(255, 255, 255, 0.45);
}

.home-card-footer:hover {
  color: #fff;
  font-size: 14px;
  transition: all 0.25s ease-in;
}

.home-card-footer:hover {
  color: #1366ff !important;
  font-size: 15px;
}

.home-card__footer-value {
  display: inline-block;
  margin-left: 4px;
  font-weight: 600;
}
</style>
