<template>
  <div class="job-container">
    <div class="search-bar">
      <a-row :gutter="16">
        <a-col :span="4">
          <a-select
            v-model:value="searchForm.env"
            placeholder="请选择环境"
            style="width: 100%"
            @change="handleEnvChange"
          >
            <a-select-option value="1">开发环境</a-select-option>
            <a-select-option value="2">测试环境</a-select-option>
            <a-select-option value="3">生产环境</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="searchForm.executor"
            placeholder="请选择执行器"
            style="width: 100%"
            :loading="executorLoading"
            :disabled="!searchForm.env"
          >
            <a-select-option v-for="item in executorList" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-input v-model:value="searchForm.jobDesc" placeholder="请输入任务描述" />
        </a-col>
        <a-col :span="4">
          <a-input v-model:value="searchForm.author" placeholder="请输入负责人" />
        </a-col>
        <a-col :span="2">
          <a-button type="primary" @click="handleSearch">搜索</a-button>
        </a-col>
        <a-col :span="2">
          <a-button type="primary" @click="handleAdd">新增</a-button>
        </a-col>
      </a-row>
    </div>

    <a-table
      :columns="columns"
      :data-source="jobList"
      :pagination="pagination"
      :loading="loading"
      :scroll="{ x: 1300 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'triggerStatus'">
          <a-tag :color="getStatusColor(record.triggerStatus)">
            {{ getStatusText(record.triggerStatus) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleExecute(record)">
              执行
            </a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">
              编辑
            </a-button>
            <a-button type="link" size="small" @click="handleDelete(record)">
              删除
            </a-button>
            <a-button type="link" size="small" @click="handleViewLog(record)">
              日志
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增弹框 -->
    <a-modal
      title="新增任务"
      :visible="addModalVisible"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleAddOk"
      @cancel="handleAddCancel"
      width="800px"
    >
      <a-steps :current="currentStep" style="margin-bottom: 24px">
        <a-step title="基础配置" />
        <a-step title="调度配置" />
        <a-step title="任务配置" />
        <a-step title="高级配置" />
      </a-steps>

      <a-form :model="addForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <!-- 基础配置 -->
        <div v-show="currentStep === 0">
          <a-form-item label="环境" required>
            <a-select
              v-model:value="addForm.env"
              placeholder="请选择环境"
              @change="handleAddEnvChange"
            >
              <a-select-option value="1">开发环境</a-select-option>
              <a-select-option value="2">测试环境</a-select-option>
              <a-select-option value="3">生产环境</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="执行器" required>
            <a-select
              v-model:value="addForm.jobGroupId"
              placeholder="请选择执行器"
              :loading="addExecutorLoading"
              :disabled="!addForm.env"
            >
              <a-select-option v-for="item in addExecutorList" :key="item.id" :value="item.id">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="任务描述" required>
            <a-input v-model:value="addForm.jobDesc" placeholder="请输入任务描述" />
          </a-form-item>
          <a-form-item label="负责人" required>
            <a-input v-model:value="addForm.author" placeholder="请输入负责人" />
          </a-form-item>
          <a-form-item label="报警邮件" required>
            <a-input v-model:value="addForm.alarmEmail" placeholder="请输入报警邮件，多个邮件地址则逗号分隔" />
          </a-form-item>
        </div>

        <!-- 调度配置 -->
        <div v-show="currentStep === 1">
          <a-form-item label="调度类型" required>
            <a-select v-model:value="addForm.scheduleType" placeholder="CRON">
              <a-select-option value=1>CRON</a-select-option>
              <a-select-option value=2>GLUE</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Cron" required>
            <a-input v-model:value="addForm.scheduleConf" placeholder="cron表达式..." @click="showCronModal">
              <template #suffix>
                <a-button type="link">
                  <sync-outlined />
                </a-button>
              </template>
            </a-input>
          </a-form-item>
        </div>

        <!-- 任务配置 -->
        <div v-show="currentStep === 2">
          <a-form-item label="运行模式" required>
            <a-select v-model:value="addForm.executorMode" placeholder="BEAN">
              <a-select-option value="BEAN">BEAN</a-select-option>
              <a-select-option value="GLUE_GROOVY">GLUE(Java)</a-select-option>
              <a-select-option value="GLUE_SHELL">GLUE(Shell)</a-select-option>
              <a-select-option value="GLUE_PYTHON">GLUE(Python)</a-select-option>
              <a-select-option value="GLUE_PHP">GLUE(PHP)</a-select-option>
              <a-select-option value="GLUE_NODEJS">GLUE(Nodejs)</a-select-option>
              <a-select-option value="GLUE(PowerShell)">GLUE(PowerShell)</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="JobHandler" required>
            <a-input v-model:value="addForm.executorHandler" placeholder="请输入JobHandler" />
          </a-form-item>
          <a-form-item label="任务参数">
            <a-textarea v-model:value="addForm.executorParam" placeholder="请输入任务参数" :rows="4" />
          </a-form-item>
        </div>

        <!-- 高级配置 -->
        <div v-show="currentStep === 3">
          <a-form-item label="路由策略" required>
            <a-select v-model:value="addForm.executorRouteStrategy" placeholder="第一个">
              <a-select-option value="FIRST">第一个</a-select-option>
              <a-select-option value="LAST">最后一个</a-select-option>
              <a-select-option value="ROUND">轮询</a-select-option>
              <a-select-option value="RANDOM">随机</a-select-option>
              <a-select-option value="CONSISTENT_HASH">一致性HASH</a-select-option>
              <a-select-option value="LEAST_FREQUENTLY_USED">最不经常使用</a-select-option>
              <a-select-option value="LEAST_RECENTLY_USED">最近最久未使用</a-select-option>
              <a-select-option value="FAILOVER">故障转移</a-select-option>
              <a-select-option value="BUSY_OVER">忙碌转移</a-select-option>
              <a-select-option value="BROADCAST">分片广播</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="调度过期策略" required>
            <a-select v-model:value="addForm.misfireStrategy" placeholder="忽略">
              <a-select-option value="DO_NOTHING">忽略</a-select-option>
              <a-select-option value="FIRE_ONCE_NOW">立即执行一次</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="子任务ID">
            <a-input v-model:value="addForm.childJobId" placeholder="请输入子任务的任务ID,如存在多个则逗号分隔" />
          </a-form-item>
          <a-form-item label="阻塞处理策略" required>
            <a-select v-model:value="addForm.executorBlockStrategy" placeholder="单机串行">
              <a-select-option value="SERIAL_EXECUTION">单机串行</a-select-option>
              <a-select-option value="DISCARD_LATER">丢弃后续调度</a-select-option>
              <a-select-option value="COVER_EARLY">覆盖之前调度</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="任务超时时间">
            <a-input-number
              v-model:value="addForm.executorTimeout"
              placeholder="任务超时时间"
              :min="0"
              :max="10"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="失败重试次数">
            <a-input-number
              v-model:value="addForm.executorFailRetryCount"
              placeholder="失败重试次数"
              :min="0"
              :max="3"
              style="width: 100%"
            />
          </a-form-item>
        </div>
      </a-form>

      <div class="steps-action" style="margin-top: 24px; text-align: center;">
        <a-button v-if="currentStep > 0" style="margin-right: 8px" @click="prev">
          上一步
        </a-button>
        <a-button
          v-if="currentStep < 3"
          type="primary"
          @click="next"
        >
          下一步
        </a-button>
        <a-button
          v-if="currentStep === 3"
          type="primary"
          @click="handleAddOk"
        >
          完成
        </a-button>
      </div>
    </a-modal>

    <!-- Cron表达式选择器弹窗 -->
    <a-modal
      v-model:visible="cronModalVisible"
      title="Cron表达式生成器"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleCronOk"
      @cancel="handleCronCancel"
      width="800px"
    >
      <a-tabs v-model:activeKey="activeTabKey">
        <a-tab-pane key="second" tab="秒">
          <a-radio-group v-model:value="cronConfig.second.type">
            <a-radio value="every">每秒</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="beginInterval">从几秒开始，每几秒执行一次</a-radio>
            <a-radio value="specific">指定</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.second.type === 'period'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.second.start" :min="0" :max="59" />
              <span>到</span>
              <a-input-number v-model:value="cronConfig.second.end" :min="0" :max="59" />
              <span>秒</span>
            </template>
            <template v-if="cronConfig.second.type === 'beginInterval'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.second.begin" :min="0" :max="59" />
              <span>秒开始，每</span>
              <a-input-number v-model:value="cronConfig.second.interval" :min="1" :max="59" />
              <span>秒执行一次</span>
            </template>
            <template v-if="cronConfig.second.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.second.specificValues">
                  <a-row>
                    <a-col v-for="i in 60" :key="i-1" :span="4">
                      <a-checkbox :value="i-1">{{ i-1 }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>

        <a-tab-pane key="minute" tab="分钟">
          <a-radio-group v-model:value="cronConfig.minute.type">
            <a-radio value="every">每分</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="beginInterval">从几分钟开始，每几分钟执行一次</a-radio>
            <a-radio value="specific">指定</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.minute.type === 'period'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.minute.start" :min="0" :max="59" />
              <span>到</span>
              <a-input-number v-model:value="cronConfig.minute.end" :min="0" :max="59" />
              <span>分</span>
            </template>
            <template v-if="cronConfig.minute.type === 'beginInterval'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.minute.begin" :min="0" :max="59" />
              <span>分钟开始，每</span>
              <a-input-number v-model:value="cronConfig.minute.interval" :min="1" :max="59" />
              <span>分钟执行一次</span>
            </template>
            <template v-if="cronConfig.minute.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.minute.specificValues">
                  <a-row>
                    <a-col v-for="i in 60" :key="i-1" :span="4">
                      <a-checkbox :value="i-1">{{ i-1 }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>

        <a-tab-pane key="hour" tab="小时">
          <a-radio-group v-model:value="cronConfig.hour.type">
            <a-radio value="every">每小时</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="beginInterval">从几点开始，每几小时执行一次</a-radio>
            <a-radio value="specific">指定</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.hour.type === 'period'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.hour.start" :min="0" :max="23" />
              <span>到</span>
              <a-input-number v-model:value="cronConfig.hour.end" :min="0" :max="23" />
              <span>点</span>
            </template>
            <template v-if="cronConfig.hour.type === 'beginInterval'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.hour.begin" :min="0" :max="23" />
              <span>点开始，每</span>
              <a-input-number v-model:value="cronConfig.hour.interval" :min="1" :max="23" />
              <span>小时执行一次</span>
            </template>
            <template v-if="cronConfig.hour.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.hour.specificValues">
                  <a-row>
                    <a-col v-for="i in 24" :key="i-1" :span="4">
                      <a-checkbox :value="i-1">{{ i-1 }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>

        <a-tab-pane key="day" tab="日">
          <a-radio-group v-model:value="cronConfig.day.type">
            <a-radio value="every">每日</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="beginInterval">从几号开始，每几天执行一次</a-radio>
            <a-radio value="specific">指定</a-radio>
            <a-radio value="lastDay">本月最后一天</a-radio>
            <a-radio value="lastWorkDay">本月最后一个工作日</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.day.type === 'period'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.day.start" :min="1" :max="31" />
              <span>到</span>
              <a-input-number v-model:value="cronConfig.day.end" :min="1" :max="31" />
              <span>日</span>
            </template>
            <template v-if="cronConfig.day.type === 'beginInterval'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.day.begin" :min="1" :max="31" />
              <span>日开始，每</span>
              <a-input-number v-model:value="cronConfig.day.interval" :min="1" :max="31" />
              <span>天执行一次</span>
            </template>
            <template v-if="cronConfig.day.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.day.specificValues">
                  <a-row>
                    <a-col v-for="i in 31" :key="i" :span="4">
                      <a-checkbox :value="i">{{ i }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>

        <a-tab-pane key="month" tab="月">
          <a-radio-group v-model:value="cronConfig.month.type">
            <a-radio value="every">每月</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="beginInterval">从几月开始，每几个月执行一次</a-radio>
            <a-radio value="specific">指定</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.month.type === 'period'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.month.start" :min="1" :max="12" />
              <span>到</span>
              <a-input-number v-model:value="cronConfig.month.end" :min="1" :max="12" />
              <span>月</span>
            </template>
            <template v-if="cronConfig.month.type === 'beginInterval'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.month.begin" :min="1" :max="12" />
              <span>月开始，每</span>
              <a-input-number v-model:value="cronConfig.month.interval" :min="1" :max="12" />
              <span>个月执行一次</span>
            </template>
            <template v-if="cronConfig.month.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.month.specificValues">
                  <a-row>
                    <a-col v-for="i in 12" :key="i" :span="4">
                      <a-checkbox :value="i">{{ i }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>

        <a-tab-pane key="week" tab="周">
          <a-radio-group v-model:value="cronConfig.week.type">
            <a-radio value="every">每周</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="lastWeek">本月最后一个星期几</a-radio>
            <a-radio value="specific">指定</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.week.type === 'period'">
              <span>从星期</span>
              <a-input-number v-model:value="cronConfig.week.start" :min="1" :max="7" />
              <span>到星期</span>
              <a-input-number v-model:value="cronConfig.week.end" :min="1" :max="7" />
            </template>
            <template v-if="cronConfig.week.type === 'lastWeek'">
              <span>本月最后一个星期</span>
              <a-select v-model:value="cronConfig.week.last" style="width: 100px">
                <a-select-option value="1">一</a-select-option>
                <a-select-option value="2">二</a-select-option>
                <a-select-option value="3">三</a-select-option>
                <a-select-option value="4">四</a-select-option>
                <a-select-option value="5">五</a-select-option>
                <a-select-option value="6">六</a-select-option>
                <a-select-option value="7">日</a-select-option>
              </a-select>
            </template>
            <template v-if="cronConfig.week.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.week.specificValues">
                  <a-row>
                    <a-col v-for="(day, index) in ['日', '一', '二', '三', '四', '五', '六']" :key="index" :span="4">
                      <a-checkbox :value="index === 0 ? 7 : index">星期{{ day }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>

        <a-tab-pane key="year" tab="年">
          <a-radio-group v-model:value="cronConfig.year.type">
            <a-radio value="every">每年</a-radio>
            <a-radio value="period">周期</a-radio>
            <a-radio value="specific">指定</a-radio>
          </a-radio-group>
          <div class="cron-config-content">
            <template v-if="cronConfig.year.type === 'period'">
              <span>从</span>
              <a-input-number v-model:value="cronConfig.year.start" :min="2000" :max="2100" />
              <span>到</span>
              <a-input-number v-model:value="cronConfig.year.end" :min="2000" :max="2100" />
              <span>年</span>
            </template>
            <template v-if="cronConfig.year.type === 'specific'">
              <div class="specific-values">
                <a-checkbox-group v-model:value="cronConfig.year.specificValues">
                  <a-row>
                    <a-col v-for="i in 10" :key="i+2020" :span="4">
                      <a-checkbox :value="i+2020">{{ i+2020 }}</a-checkbox>
                    </a-col>
                  </a-row>
                </a-checkbox-group>
              </div>
            </template>
          </div>
        </a-tab-pane>
      </a-tabs>

      <div class="cron-result">
        <div class="result-title">表达式字段</div>
        <div class="result-fields">
          <span>秒</span>
          <span>分</span>
          <span>时</span>
          <span>日</span>
          <span>月</span>
          <span>周</span>
          <span>年</span>
        </div>
        <a-input v-model:value="cronExpression" readonly>
          <template #addonAfter>
            <a-button type="link" size="small" @click="handleAnalyze">
              反解析
            </a-button>
          </template>
        </a-input>
        <div class="next-execute-time" v-if="nextExecuteTimes.length > 0">
          <div class="title">最近5次执行时间</div>
          <div v-for="(time, index) in nextExecuteTimes" :key="index" class="time-item">
            {{ time }}
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { DownOutlined, SyncOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { getJobList, createJob, runJob, pauseJob, resumeJob } from '../../api/job';
import type { JobInfo } from '../../api/job';
import { ConfigEnvironment, getConfigEnvironments } from '../../api/configEnvironment';
import { Steps, InputNumber, Tabs } from 'ant-design-vue';

const getStatusColor = (status: number) => {
  const statusMap: Record<number, string> = {
    0: 'red',
    1: 'green',
    2: 'blue',
  };
  return statusMap[status] || 'gray';
};
// 定义表格列
const columns: TableColumnsType = [
  {
    title: '任务ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '任务描述',
    dataIndex: 'jobDesc',
    key: 'jobDesc',
    width: 200,
  },
  {
    title: '调度类型',
    dataIndex: 'scheduleType',
    key: 'scheduleType',
    width: 200,
    customRender: ({ text }) => getScheduleTypeText(text),
  },
  {
    title: '运行模式',
    dataIndex: 'executorHandler',
    key: 'executorHandler',
    width: 200,
  },
  {
    title: '负责人',
    dataIndex: 'author',
    key: 'author',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'triggerStatus',
    key: 'triggerStatus',
    width: 100,
    customRender: ({ text }) => getStatusText(text),
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    fixed: 'right',
  },
];

// 搜索表单数据
const searchForm = reactive({
  env: '1', // 默认选择开发环境
  executor: '',
  jobDesc: '',
  author: '',
});

// 环境名称映射
const envNameMap: Record<string, string> = {
  '1': '开发环境',
  '2': '测试环境',
  '3': '生产环境',
};

// 配置列表
const configList = ref<ConfigEnvironment[]>([]);
const configLoading = ref(false);

// 获取配置列表
const fetchConfigEnvironments = async (envType: number, isAdd = false) => {
  const loading = isAdd ? addExecutorLoading : configLoading;
  const list = isAdd ? addExecutorList : configList;
  
  loading.value = true;
  try {
    const response = await getConfigEnvironments({ configComponentId: envType });
    if (response.data) {
      list.value = response.data;
    }
  } catch (error) {
    message.error('获取配置列表失败');
    list.value = [];
  } finally {
    loading.value = false;
  }
};

// 环境变更处理
const handleEnvChange = (value: string) => {
  searchForm.executor = '';
  if (value) {
    fetchConfigEnvironments(parseInt(value));
  } else {
    configList.value = [];
  }
};

// 调度类型映射
const getScheduleTypeText = (type: number) => {
  const typeMap: Record<number, string> = {
    1: 'CRON',
    2: '固定频率',
  };
  return typeMap[type] || '未知类型';
};

// 状态文本映射
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '停止',
    1: '运行',
  };
  return statusMap[status] || '未知状态';
};

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 加载状态
const loading = ref(false);

// 任务列表数据
const jobList = ref<JobInfo[]>([]);

// 执行器（环境配置）列表
const executorList = ref<ConfigEnvironment[]>([]);
const executorLoading = ref(false);
const addExecutorList = ref<ConfigEnvironment[]>([]);
const addExecutorLoading = ref(false);

// 新增表单环境变更处理
const handleAddEnvChange = (value: string) => {
  addForm.executorHandler = '';
  if (value) {
    fetchConfigEnvironments(parseInt(value), true);
  }
};

// 搜索方法
const handleSearch = () => {
  pagination.current = 1;
  fetchJobList();
};

// 新增弹框显示状态
const addModalVisible = ref(false);
// 新增表单数据
const addForm = reactive({
  env: '',
  jobGroupId: '',
  executorHandler: '',
  jobDesc: '',
  author: '',
  alarmEmail: '',
  scheduleType: 1,
  scheduleConf: '',
  executorMode: 'BEAN',
  jobHandler: '',
  executorParam: '',
  executorRouteStrategy: 'FIRST',
  misfireStrategy: 'IGNORE',
  childJobId: '',
  executorBlockStrategy: 'SERIAL',
  executorTimeout: '',
  executorFailRetryCount: '',
});

// 步骤控制
const currentStep = ref(0);
const next = () => {
  currentStep.value++;
};
const prev = () => {
  currentStep.value--;
};

// Cron表达式配置
const cronModalVisible = ref(false);
const activeTabKey = ref('second');
const cronExpression = ref('* * * * * ? *');
const nextExecuteTimes = ref<string[]>([]);

const cronConfig = reactive({
  second: {
    type: 'every',
    start: 0,
    end: 59,
    begin: 0,
    interval: 1,
    specificValues: [],
  },
  minute: {
    type: 'every',
    start: 0,
    end: 59,
    begin: 0,
    interval: 1,
    specificValues: [],
  },
  hour: {
    type: 'every',
    start: 0,
    end: 23,
    begin: 0,
    interval: 1,
    specificValues: [],
  },
  day: {
    type: 'every',
    start: 1,
    end: 31,
    begin: 1,
    interval: 1,
    specificValues: [],
  },
  month: {
    type: 'every',
    start: 1,
    end: 12,
    begin: 1,
    interval: 1,
    specificValues: [],
  },
  week: {
    type: 'every',
    start: 1,
    end: 7,
    last: '1',
    specificValues: [],
  },
  year: {
    type: 'every',
    start: 2023,
    end: 2030,
    specificValues: [],
  },
});

// 监听配置变化，更新表达式
watch(cronConfig, () => {
  cronExpression.value = generateCronExpression();
  calculateNextExecuteTimes();
}, { deep: true });

const generateCronExpression = () => {
  const parts = [];
  
  // 秒
  parts.push(generatePartExpression('second', 0, 59));
  // 分
  parts.push(generatePartExpression('minute', 0, 59));
  // 时
  parts.push(generatePartExpression('hour', 0, 23));
  // 日
  parts.push(generateDayExpression());
  // 月
  parts.push(generatePartExpression('month', 1, 12));
  // 周
  parts.push(generateWeekExpression());
  // 年
  parts.push(generateYearExpression());

  return parts.join(' ');
};

const generatePartExpression = (part: string, min: number, max: number) => {
  const config = cronConfig[part];
  switch (config.type) {
    case 'every':
      return '*';
    case 'period':
      return `${config.start}-${config.end}`;
    case 'beginInterval':
      return `${config.begin}/${config.interval}`;
    case 'specific':
      return config.specificValues.length > 0 ? config.specificValues.sort((a, b) => a - b).join(',') : '*';
    default:
      return '*';
  }
};

const generateDayExpression = () => {
  const config = cronConfig.day;
  switch (config.type) {
    case 'lastDay':
      return 'L';
    case 'lastWorkDay':
      return 'LW';
    default:
      return generatePartExpression('day', 1, 31);
  }
};

const generateWeekExpression = () => {
  const config = cronConfig.week;
  switch (config.type) {
    case 'every':
      return '?';
    case 'period':
      return `${config.start}-${config.end}`;
    case 'lastWeek':
      return `${config.last}L`;
    case 'specific':
      return config.specificValues.length > 0 ? config.specificValues.sort((a, b) => a - b).join(',') : '?';
    default:
      return '?';
  }
};

const generateYearExpression = () => {
  const config = cronConfig.year;
  switch (config.type) {
    case 'every':
      return '*';
    case 'period':
      return `${config.start}-${config.end}`;
    case 'specific':
      return config.specificValues.length > 0 ? config.specificValues.sort((a, b) => a - b).join(',') : '*';
    default:
      return '*';
  }
};

const calculateNextExecuteTimes = () => {
  // 这里应该调用后端API来计算下次执行时间
  // 临时模拟数据
  const now = new Date();
  nextExecuteTimes.value = Array(5).fill(0).map((_, index) => {
    const date = new Date(now.getTime() + index * 60000);
    return date.toLocaleString();
  });
};

const handleAnalyze = () => {
  // 这里应该调用后端API来解析表达式
  message.info('解析cron表达式：' + cronExpression.value);
};

// 新增任务
const handleAdd = () => {
  addModalVisible.value = true;
};

// 处理新增弹框确认
const handleAddOk = async () => {
  try {
    // 表单验证
    if (!addForm.env || !addForm.jobGroupId || !addForm.jobDesc || !addForm.author || !addForm.alarmEmail || !addForm.scheduleConf) {
      message.error('请填写必填项');
      return;
    }

    // 构造请求数据
    const jobData = {
      jobGroupId: Number(addForm.jobGroupId),
      jobDesc: addForm.jobDesc,
      author: addForm.author,
      alarmEmail: addForm.alarmEmail,
      scheduleType: addForm.scheduleType,
      scheduleConf: addForm.scheduleConf,
      executorRouteStrategy: addForm.executorRouteStrategy,
      executorHandler: addForm.executorHandler,
      executorParam: addForm.executorParam,
      misfireStrategy: addForm.misfireStrategy,
      executorBlockStrategy: addForm.executorBlockStrategy,
      childJobId: addForm.childJobId,
      executorTimeout: addForm.executorTimeout ? Number(addForm.executorTimeout) : 0,
      executorFailRetryCount: addForm.executorFailRetryCount ? Number(addForm.executorFailRetryCount) : 0,
      glueType: addForm.executorMode,
      triggerStatus: 0, // 默认停止状态
    };

    // 调用创建接口
    await createJob(jobData);
    message.success('新增任务成功');
    addModalVisible.value = false;
    
    // 重置表单
    Object.keys(addForm).forEach(key => {
      addForm[key] = '';
    });
    addForm.scheduleType = 1;
    addForm.executorMode = 'BEAN';
    addForm.executorRouteStrategy = 'FIRST';
    addForm.misfireStrategy = 'IGNORE';
    addForm.executorBlockStrategy = 'SERIAL';
    currentStep.value = 0;
    
    // 重新获取任务列表
    fetchJobList();
  } catch (error) {
    message.error('新增任务失败：' + (error.message || '未知错误'));
  }
};

// 处理新增弹框取消
const handleAddCancel = () => {
  addModalVisible.value = false;
};

// 表格变化处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchJobList();
};

// 获取任务列表数据
const fetchJobList = async () => {
  loading.value = true;
  try {
    const response = await getJobList(pagination.current, pagination.pageSize);
    if (typeof response.data === 'object' && response.data!== null) {
      jobList.value = response.data.data;
      pagination.total = response.data.total;
    } else {
      message.error('Invalid API response format');
    }
  } catch (error) {
    message.error('Failed to fetch job list');
  } finally {
    loading.value = false;
  }
};

// 执行任务
const handleExecute = (record: any) => {
  message.success(`执行任务: ${record.id}`);
  runJob(record.id);
};

// 编辑任务
const handleEdit = (record: any) => {
  message.info(`编辑任务: ${record.id}`);
};

// 删除任务
const handleDelete = (record: any) => {
  message.warning(`删除任务: ${record.id}`);
};

// 查看日志
const handleViewLog = (record: any) => {
  message.info(`查看任务日志: ${record.id}`);
};

// 显示Cron表达式生成器
const showCronModal = () => {
  cronModalVisible.value = true;
};

// 处理Cron表达式确认
const handleCronOk = () => {
  addForm.scheduleConf = cronExpression.value;
  cronModalVisible.value = false;
};

// 处理Cron表达式取消
const handleCronCancel = () => {
  cronModalVisible.value = false;
};

// 组件挂载时获取数据
onMounted(() => {
  // 默认加载开发环境的数据
  fetchConfigEnvironments(parseInt(searchForm.env));
  fetchJobList();
});
</script>

<style lang="less" scoped>
.job-container {
  padding: 24px;
  background: #fff;

  .search-bar {
    margin-bottom: 16px;
  }

  .table-operations {
    margin-bottom: 16px;
  }

  .operation-button {
    padding: 0;
    height: auto;
    line-height: 1;
    color: #1890ff;

    &:hover {
      color: #40a9ff;
    }
  }

  :deep(.ant-table) {
    .ant-table-cell {
      white-space: nowrap;
    }
  }

  :deep(.ant-table-pagination) {
    margin: 16px 0;
  }

  .form-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
      padding-left: 8px;
      border-left: 4px solid #1890ff;
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }

  .steps-action {
    margin-top: 24px;
    text-align: center;
  }

  :deep(.ant-btn-link) {
    padding: 0 8px;
    height: auto;
    line-height: 1;
    
    &:hover {
      color: #40a9ff;
    }
  }

  .cron-config-content {
    margin-top: 16px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 4px;

    .specific-values {
      max-height: 200px;
      overflow-y: auto;
    }

    :deep(.ant-input-number) {
      width: 80px;
      margin: 0 8px;
    }
  }

  .cron-result {
    margin-top: 24px;
    padding: 16px;
    background: #f8f8f8;
    border-radius: 4px;

    .result-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .result-fields {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 0 24px;

      span {
        flex: 1;
        text-align: center;
        color: #666;
      }
    }

    .next-execute-time {
      margin-top: 16px;

      .title {
        font-weight: 500;
        margin-bottom: 8px;
      }

      .time-item {
        padding: 4px 0;
        color: #666;
      }
    }
  }
}
</style>