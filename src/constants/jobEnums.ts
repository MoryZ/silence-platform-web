export const jobStatusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
];

export const taskTypeEnum = {
  1: { label: '集群', color: 'blue' },
  2: { label: '广播', color: 'green' },
  3: { label: '静态分片', color: 'green' },
  4: { label: 'Map', color: 'green' },
  5: { label: 'MapReduce', color: 'green' }
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

export const routeKeyEnum = {
  1: { label: '一致性HASH', color: 'green' },
  2: { label: '随机', color: 'green' },
  3: { label: 'LRU', color: 'blue' },
  4: { label: '轮询', color: 'blue' },
  5: { label: '第一个', color: 'green' },
  6: { label: '最后一个', color: 'green' }

  
};

export const executorTypeEnum = {
  1: { label: 'Java', color: 'blue' },
  2: { label: 'Python', color: 'green' },
  3: { label: 'Go', color: 'green' }
};

export const executorNameOptions = [
    { label: '自定义执行器', value: '1' },
    { label: '内置执行器', value: '2' },
  ];

