// 配置状态映射
export const STATUS_MAP: Record<number, { text: string; color: string }> = {
  1: { text: '已保存', color: 'warning' },
  2: { text: '发布中', color: 'processing' },
  3: { text: '已发布', color: 'success' },
};

// 格式类型映射
export const FORMAT_MAP: Record<number, string> = {
  1: 'YML',
  2: 'Properties',
  3: 'TXT',
  4: 'JSON',
  5: 'XML'
};

// 类型映射
export const TYPE_MAP: Record<number, string> = {
  1: '私有',
  2: '公共',
};

// 格式类型选项
export const FORMAT_TYPE_OPTIONS = [
  { label: 'YML', value: 1 },
  { label: 'Properties', value: 2 },
  { label: 'TXT', value: 3 },
  { label: 'JSON', value: 4 },
  { label: 'XML', value: 5 },
];

// 命名空间类型选项
export const NAMESPACE_TYPE_OPTIONS = [
  { label: '私有', value: 1 },
  { label: '公共', value: 2 },
];

// 表格列定义
export const TABLE_COLUMNS = [
  {
    title: '命名空间',
    dataIndex: 'namespaceId',
    width: '20%',
  },
  {
    title: '发布状态',
    dataIndex: 'namespaceStatus',
    width: '10%',
  },
  {
    title: '监听设备',
    dataIndex: 'ips',
    width: '10%',
  },
  {
    title: '格式类型',
    dataIndex: 'formatType',
    width: '10%',
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: '10%',
  },
  {
    title: '操作人',
    dataIndex: 'updatedBy',
    width: '15%',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedDate',
    width: '20%',
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '15%',
    fixed: 'right',
  },
];
