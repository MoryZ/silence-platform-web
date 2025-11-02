<template>
  <div class="workbench-container">
    <!-- 最近访问 -->
    <div class="section recent-section">
      <div class="section-title">最近访问</div>
      <div class="recent-tags">
        <a-tag
          v-for="item in recentVisited"
          :key="item.path"
          class="recent-tag"
          @click="handleRecentClick(item)"
        >
          <component :is="item.icon" />
          <span>{{ item.title }}</span>
        </a-tag>
      </div>
    </div>

    <!-- 资源统计 -->
    <div class="section stats-section">
      <div class="section-title">资源统计</div>
      <div class="stats-grid">
        <!-- 配置中心CC -->
        <div class="stats-card">
          <div class="card-header">配置中心CC</div>
          <div class="stats-content">
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.configCenter?.namespaceCount ?? '-' }}</div>
              <div class="stats-label">命名空间</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.configCenter?.listenerInstanceCount ?? '-' }}</div>
              <div class="stats-label">监听实例</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.configCenter?.componentCount ?? '-' }}</div>
              <div class="stats-label">组件</div>
            </div>
          </div>
        </div>

        <!-- 任务调度SilenceJob -->
        <div class="stats-card">
          <div class="card-header">任务调度SilenceJob</div>
          <div class="stats-content">
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.jobCenter?.localJobCount ?? '-' }}</div>
              <div class="stats-label">本地任务</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.jobCenter?.remoteJobCount ?? '-' }}</div>
              <div class="stats-label">远程任务</div>
            </div>
          </div>
        </div>

        <!-- 消息队列RocketMQ -->
        <div class="stats-card">
          <div class="card-header">消息队列RocketMQ</div>
          <div class="stats-content">
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.mqCenter?.topicCount ?? '-' }}</div>
              <div class="stats-label">Topic</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ statistics?.mqCenter?.publishRelationCount ?? '-' }}</div>
              <div class="stats-label">发布关系</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 监管概览 -->
    <div class="section monitor-section">
      <div class="section-header">
        <div class="section-title">监管概览</div>
        <div class="section-actions">
          <a-select v-model:value="selectedEnv" style="width: 120px">
            <a-select-option value="3">生产环境</a-select-option>
            <a-select-option value="2">测试环境</a-select-option>
            <a-select-option value="1">开发环境</a-select-option>
          </a-select>
          <a-select v-model:value="selectedProduct" style="width: 200px">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="ehis">SILENCE-CONTENT</a-select-option>
          </a-select>
          <a href="#" class="more-link">更多 >></a>
        </div>
      </div>
      <div class="monitor-content">
        <div class="monitor-chart">
          <!-- 这里可以添加图表组件 -->
          <div class="chart-placeholder">图表区域</div>
        </div>
        <div class="monitor-legend">
          <div class="legend-item">
            <span class="dot warning"></span>
            <span>严重</span>
          </div>
          <div class="legend-item">
            <span class="dot error"></span>
            <span>重大</span>
          </div>
          <div class="legend-item">
            <span class="dot success"></span>
            <span>次要</span>
          </div>
          <div class="legend-item">
            <span class="dot info"></span>
            <span>警告</span>
          </div>
          <div class="legend-item">
            <span class="dot default"></span>
            <span>提示</span>
          </div>
        </div>
        <div class="current-value">当前容量数：5条</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { ls } from '@/utils/stoarge'
import { RECENT_VISITED_PRODUCTS } from '@/utils/constant'
import { getStatistics, Statistics } from '@/api/auth/dashboard'
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const router = useRouter();
const recentVisited = ref<any[]>([]);
const selectedEnv = ref('3');
const selectedProduct = ref('all');
const statistics = ref<Statistics>()

const emit = defineEmits(['selectModule'])

// 加载最近访问记录
const loadRecentVisited = () => {
  const recent = ls.get(RECENT_VISITED_PRODUCTS)
  if (recent) {
    recentVisited.value = recent as any[]
  }
};

// 处理最近访问项点击
const handleRecentClick = (item: any) => {
  // recentVisited 里已在保存时尽量补齐 module/moduleType
  emit('selectModule', item)
  router.push(item.path)
};

// 组件挂载时加载最近访问记录
onMounted(async () => {
  loadRecentVisited();
  const res = await getStatistics();
  statistics.value = res;
});
</script>

<style lang="scss" scoped>
.workbench-container {
  padding: 24px;
  background-color: #f0f2f5;

  .section {
    background: #fff;
    border-radius: 4px;
    padding: 24px;
    margin-bottom: 24px;

    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      margin-bottom: 16px;
    }
  }

  .recent-section {
    .recent-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .recent-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        background: #f0f2f5;
        border: none;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          color: var(--primary-color);
          background: #e6f7ff;
        }

        .anticon {
          font-size: 14px;
        }
      }
    }
  }

  .stats-section {
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;

      .stats-card {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        overflow: hidden;

        .card-header {
          padding: 12px 16px;
          background: #e6f7ff;
          color: #1677ff;
          font-weight: 500;
          border-radius: 4px 4px 0 0;
        }

        .stats-content {
          padding: 16px;
          display: flex;
          justify-content: space-around;

          .stats-item {
            text-align: center;

            .stats-value {
              font-size: 24px;
              color: #1890ff;
              font-weight: 500;
              line-height: 1.2;
            }

            .stats-label {
              font-size: 14px;
              color: rgba(0, 0, 0, 0.45);
              margin-top: 4px;
            }
          }
        }
      }
    }
  }

  .monitor-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .section-actions {
        display: flex;
        align-items: center;
        gap: 16px;

        .more-link {
          color: #1890ff;
          text-decoration: none;

          &:hover {
            color: #40a9ff;
          }
        }
      }
    }

    .monitor-content {
      position: relative;

      .monitor-chart {
        height: 300px;
        background: #fafafa;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .monitor-legend {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin-top: 16px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;

            &.warning { background-color: #faad14; }
            &.error { background-color: #ff4d4f; }
            &.success { background-color: #52c41a; }
            &.info { background-color: #1890ff; }
            &.default { background-color: #d9d9d9; }
          }
        }
      }

      .current-value {
        position: absolute;
        right: 0;
        bottom: -24px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
      }
    }
  }
}
</style> 