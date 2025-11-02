<script setup lang="ts">
import { ref, watch } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/stores/app';
// import { useEcharts } from '@/hooks/common/echarts';

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

// 临时解决：如果 useEcharts 不存在，创建一个简单的实现
const domRef = ref<HTMLElement | null>(null);
const updateOptions = (callback: (opts: any, factory?: () => any) => any) => {
  // 占位实现，实际应该初始化 echarts 实例
  if (typeof callback === 'function') {
    const opts: any = {
      legend: { data: [] },
      xAxis: { data: [] },
      series: [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]
    };
    const factory = () => ({
      legend: { data: [] },
      series: [{ name: '' }, { name: '' }, { name: '' }, { name: '' }]
    });
    callback(opts, factory);
  }
};

const initialOptions = {
  tabIndex: props.type,
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
    data:
      props.type === 'RETRY'
        ? [
            $t('common.success'),
            $t('common.running'),
            $t('page.home.retryTask.status.maxRetryTimes'),
            $t('page.home.retryTask.status.pauseRetry')
          ]
        : [$t('common.success'), $t('common.fail'), $t('common.stop'), $t('common.cancel')]
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
    data: [] as string[]
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      color: '#f5b386',
      name: $t('common.success'),
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
            {
              offset: 0.25,
              color: '#f5b386'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: [] as number[]
    },
    {
      color: '#40e9c5',
      name: props.type === 'RETRY' ? $t('common.running') : $t('common.fail'),
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
            {
              offset: 0.25,
              color: '#40e9c5'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    },
    {
      color: '#b686d4',
      name: props.type === 'RETRY' ? $t('page.home.retryTask.status.maxRetryTimes') : $t('common.stop'),
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
            {
              offset: 0.25,
              color: '#b686d4'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: [] as number[]
    },
    {
      color: '#ec6f6f',
      name: props.type === 'RETRY' ? $t('page.home.retryTask.status.pauseRetry') : $t('common.cancel'),
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
            {
              offset: 0.25,
              color: '#ec6f6f'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    }
  ]
};

const getData = () => {
  updateOptions((opts, factory) => {
    const originOpts = factory();
    opts.legend.data = originOpts.legend.data;
    opts.series[0].name = originOpts.series[0].name;
    opts.series[1].name = originOpts.series[1].name;
    opts.series[2].name = originOpts.series[2].name;
    opts.series[3].name = originOpts.series[3].name;

    opts.xAxis.data = props.modelValue?.dashboardLineResponseDOList.map(x => x.createDt);
    opts.series[0].data = props.modelValue?.dashboardLineResponseDOList.map(x =>
      opts.tabIndex === 'RETRY' ? x.successNum : x.success
    );
    opts.series[1].data = props.modelValue?.dashboardLineResponseDOList.map(x =>
      opts.tabIndex === 'RETRY' ? x.runningNum : x.fail
    );
    opts.series[2].data = props.modelValue?.dashboardLineResponseDOList.map(x =>
      opts.tabIndex === 'RETRY' ? x.maxCountNum : x.stop
    );
    opts.series[3].data = props.modelValue?.dashboardLineResponseDOList.map(x =>
      opts.tabIndex === 'RETRY' ? x.suspendNum : x.cancel
    );
    return opts;
  });
};

watch(
  [() => appStore.language, props],
  () => {
    getData();
  },
  { immediate: true }
);
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </NCard>
</template>

<style scoped></style>
