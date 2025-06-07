export const jobStatusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
];

export const taskTypeEnum = {
  1: { label: '集群', color: 'blue' },
  2: { label: '单机', color: 'green' }
};

export const triggerTypeEnum = {
  2: { label: '固定时间', color: 'purple' },
  3: { label: 'CRON', color: 'orange' },
  99: { label: 'WORKFLOW', color: 'green' }
};

export const blockStrategyEnum = {
  1: { label: '丢弃', color: 'blue' },
  2: { label: '覆盖', color: 'green' },
  3: { label: '并行', color: 'green' }
};
