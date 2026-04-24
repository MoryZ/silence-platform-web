export interface MenuItem {
    key: string;
    title: string;
    icon?: any;
    type?: number; // 1/2: 菜单；3: 按钮（不应渲染到左侧导航）
    moduleType?: string;
    children?: MenuItem[];
    path?: string;
    meta?: {
      title?: string;
      icon?: string;
      show?: boolean;
      hideChildrenInMenu?: boolean;
      permission?: string;
    };
  }
  