<script setup lang="ts">
import { ref, watch } from 'vue';
import type { EChartsOption } from 'echarts';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'CardRetryChart'
});

interface Props {
  modelValue: any[];
}

const props = defineProps<Props>();

const domRef = ref<HTMLElement | null>(null);
const { setOptions } = useEcharts(domRef);

const renderChart = () => {
  const dataSource = props.modelValue ?? [];
  const labels = dataSource.map(item => item.name ?? item.x ?? '');
  const values = dataSource.map(item => item.value ?? item.taskTotal ?? 0);

  const options: EChartsOption = {
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
      containLabel: true,
      left: 0,
      right: 0
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: {
        show: false
      },
      axisTick: {
        alignWithLabel: true,
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        show: false
      }
    },
    series: [
      {
        name: 'Task Count',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: 4,
          color: '#40e9c5'
        },
        data: values
      }
    ]
  };

  setOptions(options);
};

watch(
  () => props.modelValue,
  () => renderChart(),
  { deep: true, immediate: true }
);
</script>

<template>
  <div ref="domRef" class="h-42px overflow-hidden"></div>
</template>

<style scoped></style>
