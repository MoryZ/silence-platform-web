export interface Menu {
  id: number;
  type: number;
  parentId: number;
  name: string;
  status: boolean;
  sort: number;
  path: string;
  component: string;
  redirect: string;
  moduleType?: string;
  meta: {
    title: string;
    icon: string;
    show: boolean;
    requiresAuth: boolean;
  };
  children: Menu[];
}

export interface MenuResponse {
  key: string;
  type: number;
  parentId: number;
  name: string;
  status: boolean;
  sort: number;
  path: string;
  component: string;
  redirect: string;
  meta: {
    title: string;
    icon: string;
    show: boolean;
    requiresAuth: boolean;
  };
  children: MenuResponse[];
}