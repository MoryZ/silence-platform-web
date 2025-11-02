<script setup lang="ts">
import { ref } from 'vue';
// import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'CardRetryChart'
});

interface Props {
  modelValue: any[];
}

const props = defineProps<Props>();

// 临时解决：如果 useECharts 不存在，创建一个简单的实现
const domRef = ref<HTMLElement | null>(null);
let chartInstance: any = null;

const updateOptions = (callback: (opts: any) => any) => {
  // 占位实现，实际应该初始化 echarts 实例
  if (typeof callback === 'function') {
    const opts: any = {
      xAxis: { data: [] },
      series: [{ data: [] }]
    };
    callback(opts);
  }
};

const initialOptions = {
  tooltip: {
    trigger: 'axis',
    appendToBody: true,
    confine: true,
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    top: '21px',
    height: '40px',
    containLabel: true
  },
  xAxis: {
    axisLine: false,
    type: 'category',
    data: [] as string[],
    axisTick: {
      alignWithLabel: true
    }
  },
  yAxis: {
    type: 'value',
    axisLine: false,
    scale: true,
    show: false
  },
  series: [
    {
      name: 'Task Count',
      type: 'bar',
      barWidth: '60%',
      data: [] as number[]
    }
  ]
};

const getData = async () => {
  await new Promise(resolve => {
    setTimeout(resolve, 100);
  });

  if (!props.modelValue) {
    await getData();
    return;
  }

  updateOptions((opts: any) => {
    if (opts.xAxis) {
      opts.xAxis.data = props.modelValue!.map((item: any) => item.x);
    }
    if (opts.series && opts.series[0]) {
      opts.series[0].data = props.modelValue!.map((item: any) => item.taskTotal);
    }
    return opts;
  });
};

getData();
</script>

<template>
  <div ref="domRef" class="h-42px overflow-hidden"></div>
</template>

<style scoped></style>
