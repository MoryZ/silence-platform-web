<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EChartsOption } from 'echarts';
import { $t } from '@/locales';
import { useAppStore } from '@/stores/app';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'TaskLineChart'
});

interface Props {
  type?: string;
  modelValue: any;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'JOB'
});

const appStore = useAppStore();

const domRef = ref<HTMLElement | null>(null);
const { setOptions } = useEcharts(domRef);

const getLegend = () => {
  if (props.type === 'RETRY') {
    return [
      $t('common.success'),
      $t('common.running'),
      $t('page.home.retryTask.status.maxRetryTimes'),
      $t('page.home.retryTask.status.pauseRetry')
    ];
  }
  return [$t('common.success'), $t('common.fail'), $t('common.stop'), $t('common.cancel')];
};

const getSeriesNames = () => {
  if (props.type === 'RETRY') {
    return [
      { key: 'successNum', name: $t('common.success') },
      { key: 'runningNum', name: $t('common.running') },
      { key: 'maxCountNum', name: $t('page.home.retryTask.status.maxRetryTimes') },
      { key: 'suspendNum', name: $t('page.home.retryTask.status.pauseRetry') }
    ];
  }
  return [
    { key: 'success', name: $t('common.success') },
    { key: 'fail', name: $t('common.fail') },
    { key: 'stop', name: $t('common.stop') },
    { key: 'cancel', name: $t('common.cancel') }
  ];
};

const gradientColors = ['#f5b386', '#40e9c5', '#b686d4', '#ec6f6f'];

const buildOptions = (): EChartsOption => {
  const lineList = props.modelValue?.dashboardLineResponseDOList ?? [];
  const seriesNames = getSeriesNames();

  return {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
      data: getLegend()
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
      data: lineList.map(item => item.createDt)
  },
  yAxis: {
    type: 'value'
  },
    series: seriesNames.map(({ key, name }, index) => ({
      name,
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0.2, color: gradientColors[index] },
            { offset: 1, color: '#ffffff' }
          ]
        }
      },
      emphasis: { focus: 'series' },
      data: lineList.map(item => item[key] ?? 0),
      color: gradientColors[index]
    }))
  };
};

const renderChart = () => {
  setOptions(buildOptions());
};

watch(
  [() => appStore.language, () => props.type, () => props.modelValue],
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
