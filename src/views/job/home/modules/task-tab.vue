<script setup lang="tsx">
import { $t } from '@/locales';
import { fetchAllGroupName, fetchJobLine, fetchRetryLine } from '@/api/job/dashboard';
import TaskLineChart from './task-line-chart.vue';
import TaskPieChart from './task-pie-chart.vue';

defineOptions({
  name: 'TaskTab'
});

interface Props {
  modelValue: Api.Dashboard.CardCount;
}

defineProps<Props>();

const taskType = ref<Api.Dashboard.TaskType>('JOB');
const appStore = useAppStore();
const gap = computed(() => (appStore.isMobile ? 0 : 16));
const data = ref<Api.Dashboard.DashboardLine>();
const groupOptions = ref();
const tabParams = ref({
  pageNo: 1,
  pageSize: 10,
  taskType: 1
});

const getData = async () => {
  const { data: lineData, error } =
    taskType.value === 'RETRY' ? await fetchRetryLine(tabParams.value) : await fetchJobLine(tabParams.value);

  if (!error) {
    data.value = lineData;
  }
};

const getGroupNames = async () => {
  const { data: groupNames, error } = await fetchAllGroupName();

  if (!error) {
    groupOptions.value = groupNames.map(groupName => {
      return { label: groupName, value: groupName };
    });
  }
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

const onUpdateDate = (value: [string, string] | null) => {
  if (value) {
    tabParams.value.type = 'OTHERS';
  }
};

const onClearDate = () => {
  tabParams.value.type = 'WEEK';
};

const onUpdateType = (value: string) => {
  if (value !== 'OTHERS') {
    tabParams.value.datetimeRange = null;
  }
};

const pagination = reactive({
  current: 1,
  pageSize: tabParams.value.pageSize,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '15', '20', '25', '30'],
  onChange: async (page: number, pageSize: number) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    tabParams.value.pageNo = page;
    tabParams.value.pageSize = pageSize;
    await getData();
  },
  onShowSizeChange: async (current: number, pageSize: number) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
    tabParams.value.pageNo = current;
    tabParams.value.pageSize = pageSize;
    await getData();
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

const createColumns = (): TableColumnsType<Api.Dashboard.Task> => [
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
    customRender: ({ text }) => <span class="task-table-number">{text}</span>
  },
  {
    title: $t('page.home.retryTab.task.total'),
    dataIndex: 'total',
    key: 'total',
    align: 'center',
    customRender: ({ text }) => <span class="task-table-number">{text}</span>
  }
];

const columns = ref(createColumns());

watch(
  () => appStore.locale,
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
    <a-tabs type="line" animated @change="onUpdateTab">
      <a-tab-pane v-for="panel in panels" :key="panel.name" :tab="panel.tab" :name="panel.name">
        <a-row :gutter="[gap, 16]">
          <a-col :xs="24" :sm="24" :md="16">
            <TaskLineChart v-model="data!" :type="taskType" />
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
            <TaskPieChart v-model="modelValue!" :type="taskType" />
          </a-col>
        </a-row>
      </a-tab-pane>
    </a-tabs>
    <div
      class="absolute top--136px flex flex-col flex-wrap gap-16px 2xl:right-40px 2xl:top-0 lg:top--36px md:top--90px md:flex-row 2xl:flex-nowrap"
    >
      <a-radio-group v-model:value="tabParams.type" @change="onUpdateType">
        <a-radio-button value="DAY">{{ $t('page.home.retryTab.params.day') }}</a-radio-button>
        <a-radio-button value="WEEK">{{ $t('page.home.retryTab.params.week') }}</a-radio-button>
        <a-radio-button value="MONTH">{{ $t('page.home.retryTab.params.month') }}</a-radio-button>
        <a-radio-button value="YEAR">{{ $t('page.home.retryTab.params.year') }}</a-radio-button>
      </a-radio-group>
      <DatetimeRange
        v-model:value="tabParams.datetimeRange"
        class="w-300px lg:w-250px md:w-275px sm:w-300px xl:w-400px"
        @update:value="onUpdateDate"
        @clear="onClearDate"
      />
      <a-select v-model:value="tabParams.groupName" :options="groupOptions" class="w-200px lg:w-150px md:w-170px" />
    </div>
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

  &__list {
    @include scrollbar();
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

    &__list {
      @include scrollbar();
    }
  }
}

.n-divider:not(.n-divider--vertical) {
  margin-top: 16px;
  margin-bottom: 12px;
}
</style>
