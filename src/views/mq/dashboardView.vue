<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import {
  getTopicInfo,
  getBrokerInfo
} from '@/api/mq/dashboard'
import * as echarts from 'echarts'
import type { BrokerDashboardData, TopicDashboardData } from '@/types/mq/dashboard'


const topicList = ref<string[]>([])
const selectedTopic = ref('')
const currentDate = ref(formatDateForQuery(new Date()))

const refreshInterval = ref(30) // seconds
let timer: number | undefined

// Chart refs
const brokerTrendChartRef = ref<HTMLElement | null>(null)
const topicTrendChartRef = ref<HTMLElement | null>(null)
const brokerTopChartRef = ref<HTMLElement | null>(null)
const topicTopChartRef = ref<HTMLElement | null>(null)
let brokerTrendChart: echarts.ECharts | null = null
let topicTrendChart: echarts.ECharts | null = null
let brokerTopChart: echarts.ECharts | null = null
let topicTopChart: echarts.ECharts | null = null

// 原始数据存储
const brokerRawData = ref<Record<string, string[]>>({})
const topicRawData = ref<Record<string, string[]>>({})
const topicCurrentList = ref<string[]>([])

// 格式化日期为 "YYYY-MM-DD" 格式
function formatDateForQuery(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const clearBrokerTrendChart = () => {
  if (!brokerTrendChart) return

  brokerTrendChart.setOption({
    title: {
      text: 'Broker 5min trend',
      left: 'left'
    },
    tooltip: { trigger: 'axis' },
    legend: { data: [] },
    xAxis: { type: 'category', data: [] },
    yAxis: { type: 'value' },
    series: []
  }, true)
}

const clearTopicTrendChart = () => {
  if (!topicTrendChart) return

  topicTrendChart.setOption({
    title: {
      text: '主题 5min trend',
      left: 'left'
    },
    tooltip: { trigger: 'axis' },
    legend: { data: [] },
    xAxis: { type: 'category', data: [] },
    yAxis: { type: 'value' },
    series: []
  }, true)
}

// 处理 broker 数据
const processBrokerData = (data: BrokerDashboardData) => {
  try {
    const brokerSeries = data.series || {}
    const brokerRealtime = data.brokerRealtime || {}
    const brokerOrder = (data.brokers || []).filter(Boolean)

    // 保存原始数据
    brokerRawData.value = brokerSeries
    
    const rankedBrokers = brokerOrder.length > 0
      ? brokerOrder
      : Object.keys(brokerRealtime).sort((a, b) => (Number(brokerRealtime[b] || 0) - Number(brokerRealtime[a] || 0)))

    const brokerList: { name: string; value: number }[] = rankedBrokers
      .slice(0, 10)
      .map(name => ({
        name,
        value: Number(brokerRealtime[name] || 0)
      }))
    
    // 渲染图表
    renderBrokerTopChart(brokerList)

    if (Object.keys(brokerSeries).length > 0) {
      renderBrokerTrendChart(brokerSeries)
    } else {
      clearBrokerTrendChart()
    }
  } catch (error) {
    console.error('Error processing broker data:', error)
  }
}

// 处理 topic 数据
const processTopicData = (data: TopicDashboardData) => {
  try {
    const topicSeries = data.series || {}
    const topicRealtime = data.topicRealtime || {}
    const rankedTopics = (data.topics || []).filter(Boolean)

    topicRawData.value = topicSeries
    topicList.value = rankedTopics
    
    const topTopics = rankedTopics.length > 0
      ? rankedTopics
      : Object.keys(topicRealtime).sort((a, b) => (Number(topicRealtime[b] || 0) - Number(topicRealtime[a] || 0)))

    const topicItemList: { name: string; value: number }[] = topTopics
      .slice(0, 10)
      .map(name => ({
        name,
        value: Number(topicRealtime[name] || 0)
      }))
    
    // 渲染图表
    renderTopicTopChart(topicItemList)

    const shouldResetSelection = !selectedTopic.value || !topicList.value.includes(selectedTopic.value)
    if (shouldResetSelection) {
      selectedTopic.value = topicList.value.length > 0 ? topicList.value[0] : ''
    }

    if (selectedTopic.value && topicSeries[selectedTopic.value]?.length) {
      renderTopicTrendChart(selectedTopic.value, topicSeries[selectedTopic.value])
    } else {
      clearTopicTrendChart()
    }
  } catch (error) {
    console.error('Error processing topic data:', error)
  }
}

// Methods
const loadData = async () => {
  try {
    const topicData = await getTopicInfo(currentDate.value)
    if (topicData) {
      processTopicData(topicData)
    }
    
    // 获取 broker 数据
    const brokers = await getBrokerInfo(currentDate.value)
    if (brokers) {
      processBrokerData(brokers)
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

// 当选定的主题变化时处理
const handleTopicChange = () => {
  if (selectedTopic.value && topicRawData.value[selectedTopic.value]?.length) {
    renderTopicTrendChart(selectedTopic.value, topicRawData.value[selectedTopic.value])
  } else {
    clearTopicTrendChart()
  }
}

const refreshData = async () => {
  await loadData()
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  if (refreshInterval.value > 0) {
    timer = window.setInterval(refreshData, refreshInterval.value * 1000)
  }
}

const stopAutoRefresh = () => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

// Charts initialization and rendering
const initCharts = () => {
  if (brokerTrendChartRef.value) {
    brokerTrendChart = echarts.init(brokerTrendChartRef.value)
  }
  
  if (topicTrendChartRef.value) {
    topicTrendChart = echarts.init(topicTrendChartRef.value)
  }
  
  if (brokerTopChartRef.value) {
    brokerTopChart = echarts.init(brokerTopChartRef.value)
  }
  
  if (topicTopChartRef.value) {
    topicTopChart = echarts.init(topicTopChartRef.value)
  }
}

// 渲染 Broker TOP 10 柱状图
const renderBrokerTopChart = (data: { name: string; value: number }[]) => {
  if (!brokerTopChart) return
  
  // 按值排序
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10)
  
  const option = {
    title: {
      text: 'Broker TOP 10',
      left: 'left'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'TotalMsg',
        type: 'bar',
        data: sortedData.map(item => item.value),
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  }
  
  brokerTopChart.setOption(option)
}

// 渲染 Broker 5min 趋势图
const renderBrokerTrendChart = (data: Record<string, string[]>) => {
  if (!brokerTrendChart) return
  
  const series: any[] = []
  let xAxisData: string[] = []
  
  // 假设所有 broker 的时间点相同，取第一个 broker 的时间点
  const firstBrokerKey = Object.keys(data)[0]
  if (firstBrokerKey) {
    const timestamps = data[firstBrokerKey].map(item => parseInt(item.split(',')[0]))
    xAxisData = timestamps.map(ts => {
      const date = new Date(ts)
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
    })
  }
  
  for (const [brokerName, metricsData] of Object.entries(data)) {
    series.push({
      name: brokerName,
      type: 'line',
      data: metricsData.map(item => parseFloat(item.split(',')[1])),
      smooth: true,
      showSymbol: false
    })
  }
  
  const option = {
    title: {
      text: 'Broker 5min trend',
      left: 'left'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        let res = params[0].axisValue + '<br/>'
        params.forEach((param: any) => {
          res += param.seriesName + ': ' + param.value.toFixed(2) + '<br/>'
        })
        return res
      }
    },
    legend: {
      data: Object.keys(data),
      right: 10,
      type: 'scroll',
      orient: 'horizontal'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: series,
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 5,
        height: 20,
        borderColor: 'rgba(160,197,232,0.3)',
        fillerColor: 'rgba(160,197,232,0.2)',
        handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      }
    ]
  }
  
  brokerTrendChart.setOption(option)
}

// 渲染 Topic TOP 10 柱状图
const renderTopicTopChart = (data: { name: string; value: number }[]) => {
  if (!topicTopChart) return
  
  // 按值排序
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10)
  
  const option = {
    title: {
      text: '主题 TOP 10',
      left: 'left'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'TotalMsg',
        type: 'bar',
        data: sortedData.map(item => item.value),
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  }
  
  topicTopChart.setOption(option)
}

// 渲染 Topic 5min 趋势图
const renderTopicTrendChart = (topicName: string, data: string[]) => {
  if (!topicTrendChart) return
  
  const parsedData = data.map(item => {
    const parts = item.split(',')
    return {
      timestamp: parseInt(parts[0]),
      value: parseFloat(parts[1])
    }
  })
  
  // 按时间戳排序，确保数据点按时间顺序
  parsedData.sort((a, b) => a.timestamp - b.timestamp)
  
  const xAxisData = parsedData.map(item => {
    const date = new Date(item.timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  
  const option = {
    title: {
      text: '主题 5min trend',
      left: 'left'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const value = params[0].value
        return `${params[0].axisValue}<br/>${topicName}: ${value.toFixed(5)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: topicName,
        type: 'line',
        data: parsedData.map(item => item.value),
        smooth: true,
        showSymbol: false,
        itemStyle: {
          color: '#ee6666'
        },
        lineStyle: {
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(238,102,102,0.3)'
              },
              {
                offset: 1,
                color: 'rgba(238,102,102,0.1)'
              }
            ]
          }
        }
      }
    ],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 5,
        height: 20,
        borderColor: 'rgba(160,197,232,0.3)',
        fillerColor: 'rgba(160,197,232,0.2)',
        handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      }
    ]
  }
  
  topicTrendChart.setOption(option)
}

// 窗口调整大小时重置图表
const handleResize = () => {
  if (brokerTrendChart) brokerTrendChart.resize()
  if (topicTrendChart) topicTrendChart.resize()
  if (brokerTopChart) brokerTopChart.resize()
  if (topicTopChart) topicTopChart.resize()
}

// Watch for changes 
watch(selectedTopic, (newTopic) => {
  if (newTopic) {
    handleTopicChange()
  }
})

watch(currentDate, (newDate) => {
  refreshData()
})

// Lifecycle hooks
onMounted(() => {
  nextTick(() => {
    initCharts()
  })
  
  // 添加窗口大小变化事件监听
  window.addEventListener('resize', handleResize)
  
  // 加载数据
  refreshData()
  
  // 开始自动刷新
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
  window.removeEventListener('resize', handleResize)
  
  // 销毁图表实例
  if (brokerTrendChart) {
    brokerTrendChart.dispose()
    brokerTrendChart = null
  }
  if (topicTrendChart) {
    topicTrendChart.dispose()
    topicTrendChart = null
  }
  if (brokerTopChart) {
    brokerTopChart.dispose()
    brokerTopChart = null
  }
  if (topicTopChart) {
    topicTopChart.dispose()
    topicTopChart = null
  }
})

// 格式化函数
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}

const formatTps = (tps: number) => {
  return `${tps.toFixed(2)}/s`
}

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="dashboard-page">
    <div class="header">
      <h2>Dashboard</h2>
      <div class="date-selector">
        <label>日期：</label>
        <input 
          type="date" 
          v-model="currentDate" 
          class="form-control" 
          @change="refreshData"
        />
      </div>
    </div>

    <!-- Broker 部分 -->
    <div class="broker-section">
      <div class="chart-row">
        <div class="chart-cell">
          <div class="chart-container" ref="brokerTopChartRef"></div>
        </div>
        <div class="chart-cell">
          <div class="chart-container" ref="brokerTrendChartRef"></div>
        </div>
      </div>
    </div>
    
    <!-- Topic 部分 -->
    <div class="topic-section">
      <div class="chart-row">
        <div class="chart-cell">
          <div class="chart-container" ref="topicTopChartRef"></div>
        </div>
        <div class="chart-cell">
          <div class="topic-trend-wrapper">
            <div class="topic-selection">
              <label>主题：</label>
              <select 
                v-model="selectedTopic" 
                class="form-control"
                @change="handleTopicChange"
              >
                <option v-for="topic in topicList" :key="topic" :value="topic">
                  {{ topic }}
                </option>
              </select>
            </div>
            <div class="chart-container" ref="topicTrendChartRef"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 20px;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-selector input {
  width: 160px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 8px;
}

.broker-section,
.topic-section {
  margin-bottom: 30px;
}

.chart-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

.chart-cell {
  flex: 1;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding-bottom: 10px;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.topic-trend-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.topic-selection {
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.topic-selection label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.topic-selection select {
  flex: 1;
  min-width: 200px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 8px;
}

@media (max-width: 768px) {
  .chart-row {
    flex-direction: column;
  }
}
</style> 