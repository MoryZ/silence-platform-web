import { nextTick, onUnmounted, Ref, shallowRef } from 'vue';
import type { ECharts, EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { DatasetComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GridComponent, TooltipComponent, LegendComponent, DatasetComponent, LineChart, BarChart, PieChart, CanvasRenderer]);

export function useEcharts(domRef: Ref<HTMLElement | null>, theme?: 'light' | 'dark') {
  const chartRef = shallowRef<ECharts | null>(null);
  let resizeObserver: ResizeObserver | null = null;

  const initChart = () => {
    if (!domRef.value) {
      return;
    }
    chartRef.value?.dispose();
    chartRef.value = echarts.init(domRef.value, theme) as unknown as ECharts;

    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => chartRef.value?.resize());
    resizeObserver.observe(domRef.value);
  };

  const setOptions = (options: EChartsOption) => {
    nextTick(() => {
      if (!domRef.value) {
        return;
      }
      if (!chartRef.value) {
        initChart();
      }
      chartRef.value?.setOption(options, true);
    });
  };

  const getInstance = () => chartRef.value;

  onUnmounted(() => {
    resizeObserver?.disconnect();
    chartRef.value?.dispose();
    chartRef.value = null;
  });

  return {
    setOptions,
    getInstance
  };
}

