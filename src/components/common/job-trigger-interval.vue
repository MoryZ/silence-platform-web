<template>
  <div class="job-trigger-interval">
    <Input
      v-if="triggerType === 2"
      v-model:value="intervalValue"
      placeholder="请输入间隔时间（秒）"
      type="number"
      :min="60"
      @change="(e: any) => handleChange(e.target.value)"
    />
    <div v-else-if="triggerType === 3" class="cron-wrap">
      <div class="cron-input-row">
        <Input
          v-model:value="cronValue"
          placeholder="请输入 Cron 表达式"
          @change="(e: any) => handleChange(e.target.value)"
        />
        <Button @click="openCronDialog">可视化编辑</Button>
      </div>

      <a-modal
        v-model:open="cronDialogVisible"
        title="CRON表达式配置"
        :width="760"
        :getContainer="props.innerModal ? false : undefined"
        ok-text="确定"
        cancel-text="取消"
        @ok="handleCronConfirm"
        @cancel="handleCronCancel"
      >
        <div class="cron-builder">
        <a-tabs v-model:activeKey="activeCronTab">
          <a-tab-pane v-for="item in fieldMeta" :key="item.key" :tab="item.label" />
        </a-tabs>

        <div class="cron-config-panel">
          <a-radio-group v-model:value="activeField.mode" class="mode-group">
            <a-radio value="every">每{{ activeFieldMeta.label }}</a-radio>
            <a-radio value="cycle">区间</a-radio>
            <a-radio value="step">间隔</a-radio>
            <a-radio value="assign">指定</a-radio>
            <a-radio v-if="activeFieldMeta.allowNone" value="none">不指定</a-radio>
          </a-radio-group>

          <div v-if="activeField.mode === 'cycle'" class="inline-config">
            <span>从</span>
            <a-input-number v-model:value="activeField.start" :min="activeFieldMeta.min" :max="activeFieldMeta.max" />
            <span>到</span>
            <a-input-number v-model:value="activeField.end" :min="activeFieldMeta.min" :max="activeFieldMeta.max" />
          </div>

          <div v-if="activeField.mode === 'step'" class="inline-config">
            <span>从</span>
            <a-input-number v-model:value="activeField.start" :min="activeFieldMeta.min" :max="activeFieldMeta.max" />
            <span>开始，每</span>
            <a-input-number v-model:value="activeField.step" :min="1" :max="activeFieldMeta.max - activeFieldMeta.min + 1" />
            <span>{{ activeFieldMeta.label }}执行一次</span>
          </div>

          <div v-if="activeField.mode === 'assign'" class="assign-grid">
            <a-checkbox-group v-model:value="activeField.selected">
              <div class="assign-items">
                <a-checkbox
                  v-for="value in activeFieldOptions"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
        </div>

        <div class="cron-expression-bar">
          <span class="label">CRON表达式</span>
          <Input
            v-model:value="cronEditorValue"
            placeholder="如：0/5 * * * * ? *"
            @change="handleManualCronChange"
          />
        </div>

        <div class="next-runs">
          <div class="next-runs-title">最近5次运行时间</div>
          <ol class="next-run-list">
            <li v-for="item in nextRunTimes" :key="item">{{ item }}</li>
            <li v-if="nextRunTimes.length === 0" class="empty">当前表达式无法计算运行时间</li>
          </ol>
        </div>
      </div>
      </a-modal>
    </div>
    <Input
      v-else
      v-model:value="customValue"
      placeholder="请输入触发间隔"
      @change="(e: any) => handleChange(e.target.value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Input, Button } from 'ant-design-vue';

defineOptions({
  name: 'JobTriggerInterval'
});

interface Props {
  modelValue?: string;
  triggerType?: number;
  innerModal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  triggerType: 2,
  innerModal: false
});

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const emit = defineEmits<Emits>();

const intervalValue = ref('');
const cronValue = ref('');
const customValue = ref('');
const cronDialogVisible = ref(false);
const cronEditorValue = ref('');
const activeCronTab = ref<'sec' | 'min' | 'hour' | 'day' | 'month' | 'week' | 'year'>('sec');

type CronFieldKey = 'sec' | 'min' | 'hour' | 'day' | 'month' | 'week' | 'year';
type CronMode = 'every' | 'cycle' | 'step' | 'assign' | 'none';

interface CronFieldState {
  mode: CronMode;
  start: number;
  end: number;
  step: number;
  selected: number[];
}

interface CronFieldMeta {
  key: CronFieldKey;
  label: string;
  min: number;
  max: number;
  allowNone?: boolean;
}

const fieldMeta: CronFieldMeta[] = [
  { key: 'sec', label: '秒', min: 0, max: 59 },
  { key: 'min', label: '分', min: 0, max: 59 },
  { key: 'hour', label: '时', min: 0, max: 23 },
  { key: 'day', label: '日', min: 1, max: 31, allowNone: true },
  { key: 'month', label: '月', min: 1, max: 12 },
  { key: 'week', label: '周', min: 1, max: 7, allowNone: true },
  { key: 'year', label: '年', min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }
];

const createDefaultFieldState = (key: CronFieldKey): CronFieldState => {
  const meta = fieldMeta.find(item => item.key === key)!;
  if (key === 'week') {
    return { mode: 'none', start: meta.min, end: meta.max, step: 1, selected: [meta.min] };
  }
  return { mode: 'every', start: meta.min, end: meta.max, step: 1, selected: [meta.min] };
};

const cronFields = reactive<Record<CronFieldKey, CronFieldState>>({
  sec: createDefaultFieldState('sec'),
  min: createDefaultFieldState('min'),
  hour: createDefaultFieldState('hour'),
  day: createDefaultFieldState('day'),
  month: createDefaultFieldState('month'),
  week: createDefaultFieldState('week'),
  year: createDefaultFieldState('year')
});

const activeField = computed(() => cronFields[activeCronTab.value]);
const activeFieldMeta = computed(() => fieldMeta.find(item => item.key === activeCronTab.value)!);
const activeFieldOptions = computed(() => {
  const values: number[] = [];
  for (let i = activeFieldMeta.value.min; i <= activeFieldMeta.value.max; i += 1) {
    values.push(i);
  }
  return values;
});

const nextRunTimes = ref<string[]>([]);

const handleChange = (value: string) => {
  emit('update:modelValue', value);
};

const getTokenFromField = (field: CronFieldState, meta: CronFieldMeta) => {
  if (field.mode === 'none' && meta.allowNone) return '?';
  if (field.mode === 'every') return '*';
  if (field.mode === 'cycle') {
    const start = Math.min(field.start, field.end);
    const end = Math.max(field.start, field.end);
    return `${start}-${end}`;
  }
  if (field.mode === 'step') {
    return `${field.start}/${Math.max(1, field.step)}`;
  }
  if (field.mode === 'assign') {
    const list = [...new Set(field.selected)].sort((a, b) => a - b);
    return list.length ? list.join(',') : String(meta.min);
  }
  return '*';
};

const buildCronExpression = () => {
  const dayToken = getTokenFromField(cronFields.day, fieldMeta[3]);
  let weekToken = getTokenFromField(cronFields.week, fieldMeta[5]);
  if (dayToken !== '?' && weekToken !== '?') {
    weekToken = '?';
  }

  return [
    getTokenFromField(cronFields.sec, fieldMeta[0]),
    getTokenFromField(cronFields.min, fieldMeta[1]),
    getTokenFromField(cronFields.hour, fieldMeta[2]),
    dayToken,
    getTokenFromField(cronFields.month, fieldMeta[4]),
    weekToken,
    getTokenFromField(cronFields.year, fieldMeta[6])
  ].join(' ');
};

const applyTokenToField = (token: string, key: CronFieldKey) => {
  const meta = fieldMeta.find(item => item.key === key)!;
  const target = cronFields[key];

  if (token === '?' && meta.allowNone) {
    target.mode = 'none';
    return;
  }
  if (token === '*') {
    target.mode = 'every';
    return;
  }
  if (token.includes('/')) {
    const [start, step] = token.split('/');
    target.mode = 'step';
    target.start = Number.isNaN(Number(start)) ? meta.min : Number(start);
    target.step = Number.isNaN(Number(step)) ? 1 : Number(step);
    return;
  }
  if (token.includes('-')) {
    const [start, end] = token.split('-');
    target.mode = 'cycle';
    target.start = Number.isNaN(Number(start)) ? meta.min : Number(start);
    target.end = Number.isNaN(Number(end)) ? meta.max : Number(end);
    return;
  }

  target.mode = 'assign';
  target.selected = token
    .split(',')
    .map(item => Number(item))
    .filter(item => !Number.isNaN(item));
};

const syncFieldsFromCron = (expr: string) => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 6) return;
  const normalized = parts.length === 6 ? [...parts, '*'] : parts.slice(0, 7);
  const [sec, min, hour, day, month, week, year] = normalized;

  applyTokenToField(sec, 'sec');
  applyTokenToField(min, 'min');
  applyTokenToField(hour, 'hour');
  applyTokenToField(day, 'day');
  applyTokenToField(month, 'month');
  applyTokenToField(week, 'week');
  applyTokenToField(year, 'year');
};

const matchSegment = (value: number, segment: string, min: number, max: number) => {
  if (segment === '*' || segment === '?') return true;

  if (segment.includes('/')) {
    const [base, stepRaw] = segment.split('/');
    const step = Number(stepRaw);
    if (!step || step < 1) return false;

    if (base === '*') {
      return (value - min) % step === 0;
    }

    if (base.includes('-')) {
      const [startRaw, endRaw] = base.split('-');
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return value >= start && value <= end && (value - start) % step === 0;
    }

    const start = Number(base);
    if (Number.isNaN(start)) return false;
    return value >= start && value <= max && (value - start) % step === 0;
  }

  if (segment.includes('-')) {
    const [startRaw, endRaw] = segment.split('-');
    const start = Number(startRaw);
    const end = Number(endRaw);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return value >= start && value <= end;
  }

  const exact = Number(segment);
  if (Number.isNaN(exact)) return false;
  return value === exact;
};

const matchToken = (value: number, token: string, min: number, max: number) => {
  if (token === '*' || token === '?') return true;
  const segments = token.split(',');
  return segments.some(segment => matchSegment(value, segment.trim(), min, max));
};

const dateToDisplay = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const computeNextRunTimes = (expr: string, count: number) => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 6 || parts.length > 7) return [] as string[];
  const normalized = parts.length === 6 ? [...parts, '*'] : parts;
  const [sec, min, hour, day, month, week, year] = normalized;

  const result: string[] = [];
  let cursor = new Date(Date.now() + 1000);
  let safeGuard = 0;

  while (result.length < count && safeGuard < 800000) {
    safeGuard += 1;

    const yearNum = cursor.getFullYear();
    const monthNum = cursor.getMonth() + 1;
    const dayNum = cursor.getDate();
    const weekNum = cursor.getDay() + 1;
    const hourNum = cursor.getHours();
    const minuteNum = cursor.getMinutes();
    const secondNum = cursor.getSeconds();

    const secondMatched = matchToken(secondNum, sec, 0, 59);
    const minuteMatched = matchToken(minuteNum, min, 0, 59);
    const hourMatched = matchToken(hourNum, hour, 0, 23);
    const monthMatched = matchToken(monthNum, month, 1, 12);
    const yearMatched = matchToken(yearNum, year, fieldMeta[6].min, fieldMeta[6].max);

    const dayIgnored = day === '?';
    const weekIgnored = week === '?';
    const dayMatched = dayIgnored ? true : matchToken(dayNum, day, 1, 31);
    const weekMatched = weekIgnored ? true : matchToken(weekNum, week, 1, 7);

    if (
      secondMatched && minuteMatched && hourMatched && monthMatched && yearMatched && dayMatched && weekMatched
    ) {
      result.push(dateToDisplay(cursor));
    }

    cursor = new Date(cursor.getTime() + 1000);
  }

  return result;
};

const refreshPreview = () => {
  nextRunTimes.value = computeNextRunTimes(cronEditorValue.value, 5);
};

const openCronDialog = () => {
  cronEditorValue.value = cronValue.value || buildCronExpression();
  syncFieldsFromCron(cronEditorValue.value);
  refreshPreview();
  cronDialogVisible.value = true;
};

const handleCronCancel = () => {
  cronDialogVisible.value = false;
};

const handleCronConfirm = () => {
  cronValue.value = cronEditorValue.value.trim();
  emit('update:modelValue', cronValue.value);
  cronDialogVisible.value = false;
};

const handleManualCronChange = () => {
  const value = cronEditorValue.value.trim();
  if (!value) {
    nextRunTimes.value = [];
    return;
  }

  syncFieldsFromCron(value);
  refreshPreview();
};

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (props.triggerType === 2) {
    intervalValue.value = newValue || '';
  } else if (props.triggerType === 3) {
    cronValue.value = newValue || '';
    cronEditorValue.value = cronValue.value;
    if (cronEditorValue.value && cronDialogVisible.value) {
      syncFieldsFromCron(cronEditorValue.value);
      refreshPreview();
    }
  } else {
    customValue.value = newValue || '';
  }
}, { immediate: true });

watch(cronFields, () => {
  const built = buildCronExpression();
  cronEditorValue.value = built;
  refreshPreview();
}, { deep: true });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
watch(() => props.triggerType, (newType, oldType) => {
  if (newType === 2) {
    cronDialogVisible.value = false;
    emit('update:modelValue', intervalValue.value);
  } else if (newType === 3) {
    emit('update:modelValue', cronValue.value);
    cronEditorValue.value = cronValue.value;
    // 切换到 CRON 时只准备数据，不自动弹窗；弹窗由用户主动点击打开
    if (!cronEditorValue.value) {
      cronEditorValue.value = buildCronExpression();
    }
    syncFieldsFromCron(cronEditorValue.value);
    refreshPreview();
  } else {
    cronDialogVisible.value = false;
    emit('update:modelValue', customValue.value);
  }
});
</script>

<style scoped lang="scss">
.job-trigger-interval {
  width: 100%;

  .cron-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cron-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.cron-builder {
  .cron-config-panel {
    padding: 8px 4px;
  }

  .mode-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-bottom: 12px;
  }

  .inline-config {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .assign-grid {
    border: 1px solid #f0f0f0;
    border-radius: var(--radius-lg);
    padding: 12px;

    .assign-items {
      display: grid;
      grid-template-columns: repeat(8, minmax(0, 1fr));
      gap: 8px;
    }
  }

  .cron-expression-bar {
    margin-top: 14px;

    .label {
      display: inline-block;
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }
  }

  .next-runs {
    margin-top: 14px;
    border: 1px solid #f0f0f0;
    border-radius: var(--radius-lg);
    padding: 10px 12px;
    background: #fafafa;

    .next-runs-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .next-run-list {
      margin: 0;
      padding-left: 20px;
      display: grid;
      row-gap: 4px;

      .empty {
        color: #999;
      }
    }
  }
}
</style>
