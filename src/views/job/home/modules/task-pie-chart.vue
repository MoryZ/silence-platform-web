<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EChartsOption } from 'echarts';
import { getPaletteColorByNumber } from '@/stores/theme/shared';
import { $t } from '@/locales';
import { useAppStore } from '@/stores/app';
import { useEcharts } from '@/hooks/common/echarts';
import { useThemeStore } from '@/stores/theme';

defineOptions({
  name: 'TaskPieChart'
});

interface Props {
  type?: string;
  modelValue: any;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'JOB'
});

const appStore = useAppStore();
const themeStore = useThemeStore();

const domRef = ref<HTMLElement | null>(null);
const { setOptions } = useEcharts(domRef);

const getColor = (color: string) => ((themeStore as any).darkMode ? getPaletteColorByNumber(color, 700) : color);

const getSeriesData = () => {
  if (!props.modelValue) {
    return [];
  }

  if (props.type === 'JOB') {
    const jobTask = props.modelValue.jobTask ?? {};
    return [
      { name: $t('common.success'), value: jobTask.successNum ?? 0 },
      { name: $t('common.fail'), value: jobTask.failNum ?? 0 },
      { name: $t('common.stop'), value: jobTask.stopNum ?? 0 },
      { name: $t('common.cancel'), value: jobTask.cancelNum ?? 0 }
    ];
  }

  if (props.type === 'RETRY') {
    const retryTask = props.modelValue.retryTask ?? {};
    return [
      { name: $t('common.success'), value: retryTask.finishNum ?? 0 },
      { name: $t('common.running'), value: retryTask.runningNum ?? 0 },
      { name: $t('page.home.retryTask.status.maxRetryTimes'), value: retryTask.maxCountNum ?? 0 },
      { name: $t('page.home.retryTask.status.pauseRetry'), value: retryTask.suspendNum ?? 0 }
    ];
  }

  const workflowTask = props.modelValue.workFlowTask ?? {};
  return [
    { name: $t('common.success'), value: workflowTask.successNum ?? 0 },
    { name: $t('common.fail'), value: workflowTask.failNum ?? 0 },
    { name: $t('common.stop'), value: workflowTask.stopNum ?? 0 },
    { name: $t('common.cancel'), value: workflowTask.cancelNum ?? 0 }
  ];
};

const buildOptions = (): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    textStyle: {
      color: (themeStore as any).darkMode ? '#dededf' : '#333639'
    },
    backgroundColor: (themeStore as any).darkMode ? '#48484e' : '#fff',
    formatter: '{a} <br/>{b}: {d}%'
  },
  legend: {
    bottom: '1%',
    left: 'center',
    itemStyle: {
      borderWidth: 0
    }
  },
  series: [
    {
      color: [getColor('#5da8ff'), getColor('#8e9dff'), getColor('#fedc69'), getColor('#26deca')],
      name: $t('page.home.retryTab.pie.title'),
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: (themeStore as any).darkMode ? '#18181c' : '#fff',
        borderWidth: 1
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12
        }
      },
      labelLine: {
        show: false
      },
      data: getSeriesData()
    }
  ]
});

const renderChart = () => {
  setOptions(buildOptions());
};

watch(
  [() => appStore.language, () => (themeStore as any).darkMode, () => props.type, () => props.modelValue],
  () => renderChart(),
  { immediate: true, deep: true }
);
</script>

<template>
  <a-card :bordered="false" class="chart-card">
    <div ref="domRef" class="chart-card__body"></div>
  </a-card>
</template>

<style scoped>
.chart-card {
  border-radius: 12px;
  box-shadow: 0 8px 25px -10px rgba(39, 80, 144, 0.25);
}

.chart-card__body {
  height: 360px;
  overflow: hidden;
}
</style>
