<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import {
  getTopicInfo,
  getTopicInfoWithTopic,
  getBrokerInfo,
  getCurrentTopic
} from '@/api/mq/dashboard'
import * as echarts from 'echarts'


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

// 处理 broker 数据
const processBrokerData = (data: Record<string, string[]>) => {
  try {
    // 保存原始数据
    brokerRawData.value = data
    
    // 提取 broker 列表和最新值用于 TOP 10 图表
    const brokerList: { name: string; value: number }[] = []
    
    for (const [brokerName, metricsData] of Object.entries(data)) {
      if (metricsData.length > 0) {
        // 取最新的一条数据
        const latestData = metricsData[metricsData.length - 1]
        const value = parseFloat(latestData.split(',')[1])
        
        brokerList.push({
          name: brokerName,
          value: value
        })
      }
    }
    
    // 渲染图表
    renderBrokerTopChart(brokerList)
    renderBrokerTrendChart(data)
  } catch (error) {
    console.error('Error processing broker data:', error)
  }
}

// 处理 topic 数据
const processTopicData = (data: any[]) => {
  try {
    // 保存原始数据 - 注意修改了类型
    topicRawData.value = data.reduce((acc, curr) => {
      const parts = curr.split(',')
      const timestamp = parts[0]
      const value = parseFloat(parts[1])
      
      if (!acc[selectedTopic.value]) {
        acc[selectedTopic.value] = []
      }
      
      acc[selectedTopic.value].push(`${timestamp},${value}`)
      return acc
    }, {})
    
    // 提取 topic 列表和最新值用于 TOP 10 图表
    const topicItemList: { name: string; value: number }[] = []
    
    if (selectedTopic.value && topicRawData.value[selectedTopic.value]) {
      const latestData = topicRawData.value[selectedTopic.value][topicRawData.value[selectedTopic.value].length - 1]
      const value = parseFloat(latestData.split(',')[1])
      
      topicItemList.push({
        name: selectedTopic.value,
        value: value
      })
    }
    
    // 渲染图表
    renderTopicTopChart(topicItemList)
    
    // 如果已选择主题，渲染该主题的趋势
    if (selectedTopic.value && topicRawData.value[selectedTopic.value]) {
      renderTopicTrendChart(selectedTopic.value, topicRawData.value[selectedTopic.value])
    }
  } catch (error) {
    console.error('Error processing topic data:', error)
  }
}

// 处理当前主题列表
const processTopicList = (data: string[]) => {
  try {
    // 保存原始数据
    topicCurrentList.value = data
    
    // 处理主题列表
    topicList.value = data.map(item => item.split(',')[0])
    
    // 如果还没有选择主题且有主题列表，默认选择第一个
    if (!selectedTopic.value && topicList.value.length > 0) {
      selectedTopic.value = topicList.value[0]
      loadTopicData(selectedTopic.value)
    }
  } catch (error) {
    console.error('Error processing topic list:', error)
  }
}

// 加载特定主题的数据
const loadTopicData = async (topicName: string) => {
  try {
    const topicData = await getTopicInfoWithTopic(currentDate.value, topicName)
    if (topicData && topicData.length > 0) {
      processTopicData(topicData)
    }
  } catch (error) {
    console.error(`Error loading data for topic ${topicName}:`, error)
  }
}

// Methods
const loadData = async () => {
  try {
    // 获取主题列表
    const topicList = await getCurrentTopic()
    if (topicList.length > 0) {
      processTopicList(topicList)
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
  if (selectedTopic.value) {
    loadTopicData(selectedTopic.value)
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