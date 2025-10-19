<script setup lang="tsx">
import { nextTick, ref, useSlots, watch } from 'vue';
import { Tag, message } from 'ant-design-vue';
// import hljs from 'highlight.js/lib/core';
// import json from 'highlight.js/lib/languages/json';
import { jobExecutorEnum, jobOperationReasonEnum, jobStatusEnum, taskBatchStatusEnum } from '@/constants/business';
import { fetchWorkflowNodeRetry } from '@/api/job/workflow';
import { getJobDetail } from '@/api/job/job';
import { findById } from '@/api/job/job-batch';
import { useWorkflowStore } from '@/stores/workflow';
import { isNotNull } from '@/utils/common';
import { $t } from '@/locales';

defineOptions({
  name: 'DetailCard'
});

// hljs.registerLanguage('json', json);

interface Props {
  id?: string;
  ids?: string[];
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  show: false,
  ids: () => []
});

interface Emits {
  (e: 'update:show', show: boolean): void;
}

const emit = defineEmits<Emits>();

const slots = useSlots();

const store = useWorkflowStore();
const visible = ref(false);
const logOpen = ref(false);
const spinning = ref(false);
const currentIndex = ref(1);
const jobData = ref<Workflow.JobTaskType>({});

const pagination = ref({
  page: 1,
  pageCount: 0,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onUpdatePage: async (page: number) => {
    pagination.value.page = page;
    const id = props.ids[currentIndex.value - 1];
    getBatchDetail(id);
  },
  onUpdatePageSize: async (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    const id = props.ids[currentIndex.value - 1];
    getBatchDetail(id);
  }
});

watch(
  () => props.show,
  val => {
    visible.value = val;
    if (val) {
      onLoad();
    }
  },
  { immediate: true }
);

const onUpdateShow = () => {
  emit('update:show', false);
};

async function getDetail(id: string) {
  spinning.value = true;
  try {
    const data = await getJobDetail(id);
    jobData.value = data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
  } finally {
    spinning.value = false;
  }
}

async function getBatchDetail(id: string) {
  spinning.value = true;
  try {
    const data = await findById(id);
    // 转换类型以匹配 JobTaskType
    jobData.value = {
      ...data,
      id: data.id?.toString(),
      taskBatchId: data.id?.toString(),
      createDt: data.createdDate,
      executionAt: data.updatedDate
    } as Workflow.JobTaskType;
  } catch (error) {
    console.error('获取批次详情失败:', error);
  } finally {
    spinning.value = false;
  }
}

const idList = ref<string[]>([]);

function onLoad() {
  idList.value = props.ids;

  nextTick(() => {
    if (props.ids.length > 0) {
      getBatchDetail(props.ids[0]);
    } else if (props.id) {
      idList.value = [jobData.value.taskBatchId!];
      getDetail(props.id);
    }
  });
}

const record = ref<Workflow.JobTaskType>({});

const getLogRows = (task: Workflow.JobTaskType) => {
  record.value = task;
  logOpen.value = true;
};

const retry = async () => {
  try {
    await fetchWorkflowNodeRetry(store.id!, jobData.value.workflowNodeId!);
    message.success('执行重试成功');
  } catch (error) {
    console.error('重试失败:', error);
    message.error('重试失败');
  }
};

function getTagColor(color: string) {
  return {
    color: `${color}18`,
    textColor: color,
    borderColor: `${color}58`
  };
}

const onUpdatePage = (page: number) => {
  currentIndex.value = page;
  const id = props.ids[page - 1];
  getBatchDetail(id);
};
</script>

<template>
  <DetailDrawer v-model="visible" title="任务批次详情" :width="['800px', '90%']" @update:show="onUpdateShow">
    <NTabs v-if="idList && idList.length > 0" v-model:value="currentIndex" type="segment" animated>
      <NTabPane v-for="(item, index) in idList" :key="index" :name="index + 1" :tab="item">
        <NTabs class="detail-tabs" type="segment" animated>
          <NTabPane name="info" :tab="$t('page.log.info')">
            <NSpin :show="spinning">
              <NDescriptions class="pt-12px" label-placement="left" bordered :column="2">
                <NDescriptionsItem :label="$t('page.jobBatch.groupName')">{{ jobData?.groupName }}</NDescriptionsItem>

                <NDescriptionsItem :label="$t('page.jobBatch.jobName')">{{ jobData?.jobName }}</NDescriptionsItem>

                <NDescriptionsItem :label="$t('page.jobBatch.taskBatchStatus')">
                  <NTag
                    v-if="isNotNull(jobData.taskBatchStatus)"
                    :color="getTagColor(taskBatchStatusEnum[jobData.taskBatchStatus!].color )"
                  >
                    {{ taskBatchStatusEnum[jobData.taskBatchStatus!].title }}
                  </NTag>
                  <NTag
                    v-if="isNotNull(jobData.jobStatus)"
                    :color="getTagColor(jobStatusEnum[jobData.jobStatus!].color)"
                  >
                    {{ $t(jobStatusEnum[jobData.jobStatus!].name) }}
                  </NTag>
                </NDescriptionsItem>

                <NDescriptionsItem :label="$t('page.jobBatch.executionAt')">
                  {{ jobData?.executionAt }}
                </NDescriptionsItem>

                <NDescriptionsItem :label="$t('page.jobBatch.operationReason')">
                  <NTag
                    v-if="isNotNull(jobData.operationReason)"
                    :color="getTagColor(jobOperationReasonEnum[jobData.operationReason!].color)"
                  >
                    {{ $t(jobOperationReasonEnum[jobData.operationReason!].name) }}
                  </NTag>
                </NDescriptionsItem>

                <NDescriptionsItem v-if="!slots.default" :label="$t('page.jobBatch.executorType')">
                  <NTag
                    v-if="isNotNull(jobData.executorType)"
                    :color="getTagColor(jobExecutorEnum[jobData.executorType!].color)"
                  >
                    {{ $t(jobExecutorEnum[jobData.executorType!].name) }}
                  </NTag>
                </NDescriptionsItem>

                <NDescriptionsItem :label="$t('page.jobBatch.executorInfo')" :span="2">
                  {{ jobData?.executorInfo }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="$t('common.createDt')" :span="2">
                  {{ jobData?.createDt }}
                </NDescriptionsItem>
              </NDescriptions>
            </NSpin>
            <slot></slot>
          </NTabPane>
          <NTabPane name="task" tab="任务项列表" :disabled="jobData.taskBatchStatus === 99">
            <JobTaskListTable :row-data="jobData as any" @show-log="getLogRows" @retry="retry" />
          </NTabPane>
        </NTabs>
      </NTabPane>
    </NTabs>
    <template v-if="ids && ids.length > 1" #footer>
      <NPagination
        v-model:page="currentIndex"
        class="text-center"
        :page-size="1"
        :page-count="ids.length"
        @update:page="onUpdatePage"
      />
    </template>
  </DetailDrawer>
  <FlowLogDrawer v-model:show="logOpen" title="日志详情" :task-data="record" />
</template>

<style scoped lang="scss">
.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100% - 88px);
}

.header-border {
  margin: 20px 0;
  border-left: #1366ff 5px solid;
  font-size: medium;
  font-weight: bold;
}

:deep(.n-tabs-nav) {
  display: none;
}

:deep(.n-tab-pane) {
  padding-top: 0 !important;
}

.detail-tabs {
  :deep(.n-tabs-nav) {
    display: flex !important;
  }

  :deep(.n-tabs-tab__label) {
    width: 100%;
    justify-content: center;
  }
}
</style>
