export interface MenuItem {
    key: string;
    title: string;
    icon?: any;
    children?: MenuItem[];
    path?: string;
    meta?: {
      title?: string;
      icon?: string;
      show?: boolean;
      hideChildrenInMenu?: boolean;
    };
  }
  