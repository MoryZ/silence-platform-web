<script setup lang="tsx">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/stores/app';
import TaskLineChart from './task-line-chart.vue';
import TaskPieChart from './task-pie-chart.vue';

defineOptions({
  name: 'TaskTab'
});

interface Props {
  modelValue: any;
}

const props = defineProps<Props>();

const taskType = ref<string>('JOB');
const activePanel = ref<'jobTask' | 'retryTask' | 'workflow'>('jobTask');
const appStore = useAppStore();
const gap = computed(() => {
  // 检测是否为移动设备
  const isMobile = window.innerWidth < 768;
  return isMobile ? 0 : 16;
});
const data = ref<any>();
const groupOptions = ref<any[]>([]);
const tabParams = ref<any>({
  pageNo: 1,
  pageSize: 10,
  taskType: 1,
  type: 'WEEK',
  datetimeRange: null,
  groupName: undefined
});

const mockGroupNames = ['默认集群', '夜间任务集群', '核心调度集群', '边缘节点集群'];

const mockLineDataMap: Record<string, any> = {
  JOB: {
    dashboardLineResponseDOList: [
      { createDt: '周一', success: 120, fail: 25, stop: 5, cancel: 2 },
      { createDt: '周二', success: 98, fail: 40, stop: 6, cancel: 4 },
      { createDt: '周三', success: 135, fail: 30, stop: 4, cancel: 3 },
      { createDt: '周四', success: 150, fail: 35, stop: 8, cancel: 6 },
      { createDt: '周五', success: 168, fail: 28, stop: 6, cancel: 3 },
      { createDt: '周六', success: 110, fail: 22, stop: 4, cancel: 2 },
      { createDt: '周日', success: 140, fail: 18, stop: 3, cancel: 1 }
    ],
    rankList: [
      { name: '默认集群', total: 560 },
      { name: '夜间任务集群', total: 436 },
      { name: '核心调度集群', total: 318 }
    ],
    taskList: {
      data: [
        { groupName: '默认集群', run: 320, total: 420 },
        { groupName: '夜间任务集群', run: 250, total: 340 },
        { groupName: '核心调度集群', run: 210, total: 280 },
        { groupName: '边缘节点集群', run: 165, total: 220 }
      ]
    }
  },
  RETRY: {
    dashboardLineResponseDOList: [
      { createDt: '周一', successNum: 42, runningNum: 18, maxCountNum: 6, suspendNum: 2 },
      { createDt: '周二', successNum: 50, runningNum: 22, maxCountNum: 8, suspendNum: 3 },
      { createDt: '周三', successNum: 38, runningNum: 16, maxCountNum: 7, suspendNum: 4 },
      { createDt: '周四', successNum: 60, runningNum: 20, maxCountNum: 6, suspendNum: 2 },
      { createDt: '周五', successNum: 58, runningNum: 24, maxCountNum: 5, suspendNum: 1 },
      { createDt: '周六', successNum: 35, runningNum: 12, maxCountNum: 4, suspendNum: 1 },
      { createDt: '周日', successNum: 44, runningNum: 18, maxCountNum: 5, suspendNum: 2 }
    ],
    rankList: [
      { name: '默认集群', total: 120 },
      { name: '夜间任务集群', total: 105 },
      { name: '核心调度集群', total: 96 }
    ],
    taskList: {
      data: [
        { groupName: '默认集群', run: 48, total: 120 },
        { groupName: '夜间任务集群', run: 40, total: 105 },
        { groupName: '核心调度集群', run: 38, total: 96 }
      ]
    }
  },
  WORKFLOW: {
    dashboardLineResponseDOList: [
      { createDt: '周一', success: 36, fail: 8, stop: 1, cancel: 0 },
      { createDt: '周二', success: 42, fail: 10, stop: 2, cancel: 1 },
      { createDt: '周三', success: 40, fail: 7, stop: 1, cancel: 1 },
      { createDt: '周四', success: 48, fail: 9, stop: 2, cancel: 1 },
      { createDt: '周五', success: 55, fail: 11, stop: 2, cancel: 1 },
      { createDt: '周六', success: 30, fail: 6, stop: 1, cancel: 0 },
      { createDt: '周日', success: 34, fail: 5, stop: 1, cancel: 0 }
    ],
    rankList: [
      { name: '核心调度集群', total: 220 },
      { name: '默认集群', total: 198 },
      { name: '夜间任务集群', total: 150 }
    ],
    taskList: {
      data: [
        { groupName: '核心调度集群', run: 120, total: 180 },
        { groupName: '默认集群', run: 102, total: 150 },
        { groupName: '夜间任务集群', run: 80, total: 110 }
      ]
    }
  }
};

const getData = () => {
  const key = taskType.value || 'JOB';
  data.value = mockLineDataMap[key] || mockLineDataMap.JOB;
};

const getGroupNames = () => {
  groupOptions.value = mockGroupNames.map(groupName => ({ label: groupName, value: groupName }));
};

const onUpdateTab = (value: string) => {
  if (value === 'jobTask') {
    taskType.value = 'JOB';
    tabParams.value.mode = 'JOB';
  }
  if (value === 'retryTask') {
    taskType.value = 'RETRY';
    tabParams.value.mode = undefined;
  }
  if (value === 'workflow') {
    taskType.value = 'WORKFLOW';
    tabParams.value.mode = 'WORKFLOW';
  }
};

watch(
  () => activePanel.value,
  value => {
    onUpdateTab(value);
  },
  { immediate: true }
);

const onUpdateDate = (value: [string, string] | null) => {
  if (value && value[0] && value[1]) {
    tabParams.value.type = 'OTHERS';
    tabParams.value.datetimeRange = value;
  } else {
    tabParams.value.datetimeRange = null;
  }
};

const onClearDate = () => {
  tabParams.value.type = 'WEEK';
  tabParams.value.datetimeRange = null;
};

const onUpdateType = (value: string) => {
  tabParams.value.type = value;
  if (value !== 'OTHERS') {
    tabParams.value.datetimeRange = null;
  }
};

const onRangeChange = (_dates: any, dateStrings: [string, string]) => {
  if (dateStrings?.[0] && dateStrings?.[1]) {
    onUpdateDate(dateStrings);
  } else {
    onClearDate();
  }
};

const pagination = reactive({
  current: 1,
  pageSize: tabParams.value.pageSize,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '15', '20', '25', '30'],
  onChange: (page: number, pageSize: number) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    tabParams.value.pageNo = page;
    tabParams.value.pageSize = pageSize;
    getData();
  },
  onShowSizeChange: (current: number, pageSize: number) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
    tabParams.value.pageNo = current;
    tabParams.value.pageSize = pageSize;
    getData();
  }
});

const createPanels = () => [
  {
    name: 'jobTask',
    tab: $t('page.home.jobTask')
  },
  {
    name: 'retryTask',
    tab: $t('page.home.retryTask.title')
  },
  {
    name: 'workflow',
    tab: $t('page.home.workflow')
  }
];

const panels = ref(createPanels());

const createColumns = (): any[] => [
  {
    title: $t('page.home.retryTab.task.groupName'),
    dataIndex: 'groupName',
    key: 'groupName'
  },
  {
    title: $t('page.home.retryTab.task.run'),
    dataIndex: 'run',
    key: 'run',
    align: 'center',
    customRender: ({ text }: any) => <span className="task-table-number">{text}</span>
  },
  {
    title: $t('page.home.retryTab.task.total'),
    dataIndex: 'total',
    key: 'total',
    align: 'center',
    customRender: ({ text }: any) => <span className="task-table-number">{text}</span>
  }
];

const columns = ref(createColumns());

watch(
  () => appStore.language,
  () => {
    panels.value = createPanels();
    columns.value = createColumns();
  }
);

watch(
  () => tabParams.value,
  () => {
    getData();
  },
  { deep: true }
);

getData();
getGroupNames();
</script>

<template>
  <div class="relative">
    <a-tabs v-model:activeKey="activePanel" type="line" animated class="task-tab__tabs">
      <template #rightExtra>
        <div class="task-tab__filters">
          <a-radio-group v-model:value="tabParams.type" @change="onUpdateType">
            <a-radio-button value="DAY">{{ $t('page.home.retryTab.params.day') }}</a-radio-button>
            <a-radio-button value="WEEK">{{ $t('page.home.retryTab.params.week') }}</a-radio-button>
            <a-radio-button value="MONTH">{{ $t('page.home.retryTab.params.month') }}</a-radio-button>
            <a-radio-button value="YEAR">{{ $t('page.home.retryTab.params.year') }}</a-radio-button>
          </a-radio-group>
          <a-range-picker
            v-model:value="tabParams.datetimeRange"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="task-tab__range"
            show-time
            :placeholder="['开始日期时间', '结束日期时间']"
            @change="onRangeChange"
          />
          <a-select v-model:value="tabParams.groupName" :options="groupOptions" class="task-tab__select" allow-clear />
        </div>
      </template>
      <a-tab-pane
        v-for="panel in panels"
        :key="panel.name"
        :tab="panel.tab"
        :name="panel.name"
        :force-render="true"
      >
        <a-row :gutter="[gap, 16]">
          <a-col :xs="24" :sm="24" :md="16">
            <TaskLineChart :model-value="data" :type="taskType" />
          </a-col>
          <a-col :xs="24" :sm="24" :md="8">
            <div class="task-tab-rank">
              <h4 class="task-tab-title">
                {{
                  taskType === 'RETRY' ? $t('page.home.retryTab.rank.titleRetry') : $t('page.home.retryTab.rank.title')
                }}
              </h4>
              <ul class="task-tab-rank__list">
                <li v-for="(item, index) in data?.rankList" :key="index" class="task-tab-rank__list--item">
                  <span>
                    <span class="task-tab-rank__list--index">
                      {{ index + 1 }}
                    </span>
                    <span>{{ item.name }}</span>
                  </span>
                  <span class="task-tab-badge">{{ item.total }}</span>
                </li>
              </ul>
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="[gap, 16]" class="p-t-16px">
          <a-col :xs="24" :sm="24" :md="16">
            <h4 class="task-tab-title">{{ $t('page.home.retryTab.task.title') }}</h4>
            <a-divider />
            <a-table
              :style="{ minHeight: '300px', maxHeight: '300px' }"
              :columns="columns"
              :data-source="data?.taskList.data"
              :bordered="false"
              :pagination="pagination"
            />
          </a-col>
          <a-col :xs="24" :sm="24" :md="8">
            <h4 class="task-tab-title">{{ $t('page.home.retryTab.pie.title') }}</h4>
            <a-divider />
            <TaskPieChart :model-value="props.modelValue" :type="taskType" />
          </a-col>
        </a-row>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style>
.task-table-number {
  padding: 3px 7px;
  background-color: #f4f4f4;
  color: #555;
  text-shadow: none !important;
  font-weight: 400;
  border-radius: 4px;
}

.dark .task-table-number {
  background: #2c2c2c;
  color: #d6d6d6;
}
</style>

<style scoped lang="scss">
.task-tab-title {
  font-size: 16px;
  font-weight: 600;
}

.task-tab-badge {
  float: right;
  padding: 3px 7px;
  background-color: #f4f4f4;
  color: #555;
  text-shadow: none !important;
  font-weight: 400;
  border-radius: 4px;
}

.task-tab-rank {
  height: 360px;
  overflow: hidden;

  &__list {
    padding: 0;
    height: 332px;
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.5) transparent;

    &--index {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      border-radius: 50%;
      background-color: #314659;
      color: #fff;
      margin-right: 10px;
      font-size: 13px;
    }

    &--item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 15px;
      margin: 3px 0;
      border: 1px solid #efefefd2;
      border-radius: 4px;
      box-shadow: none;
      transition: all 0.5s;
    }

    &--item:hover {
      box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.1);
    }
  }

}

.dark {
  .task-tab-badge {
    background: #2c2c2c;
    color: #d6d6d6;
  }

  .task-tab-rank {
    &__list {
      &--index {
        color: #d6d6d6;
      }

      &--item {
        border: 1px solid #646464;
      }

      &--item:hover {
        box-shadow: 1px 1px 8px transparent;
      }
    }
  }
}

.task-tab__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.task-tab__range {
  min-width: 260px;
}

.task-tab__select {
  min-width: 160px;
}

.task-tab__tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.ant-divider {
  margin-top: 16px;
  margin-bottom: 12px;
}
</style>
