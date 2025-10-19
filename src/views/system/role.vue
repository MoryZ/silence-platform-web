<template>
  <div class="role-management">
    <a-card v-permission="ROLE_PERMISSIONS.PAGE" :bordered="false">
      <template #title>角色管理</template>
      <template #extra>
        <a-button 
          v-permission="'system:role:add'"
          type="primary" 
          @click="handleAdd"
        >
          <template #icon><plus-outlined /></template>
          新增角色
        </a-button>
      </template>

      <!-- 搜索面板 -->
      <SearchPanel
        :fields="searchFields"
        :model-value="searchForm"
        @update:model-value="handleSearchFormUpdate"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 角色表格 -->
      <CommonPagination
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :page-no="pagination.pageNo"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @change="handleTableChange"
        row-key="id"
        style="margin-top: 16px"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'status'">
            <a-switch 
              :checked="text === true"
              :loading="toggleLoading[record.id]"
              @change="(checked: boolean) => handleToggleStatus(record, checked)"
              size="small"
              :style="{
                backgroundColor: text === true ? '#1677ff' : '#d9d9d9',
                borderColor: text === true ? '#1677ff' : '#d9d9d9'
              }"
            />
          </template>
          <template v-else-if="column.key === 'createdDate'">
            {{ formatDate(text) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-permission="'system:role:edit'" @click="handleEdit(record)">编辑</a>
              <a-divider v-if="hasPermission('system:role:edit') && (hasPermission('system:role:setPermissions') || hasPermission('system:role:delete'))" type="vertical" />
              <a v-permission="'system:role:setPermissions'" @click="handlePermission(record)">权限设置</a>
              <a-divider v-if="hasPermission('system:role:setPermissions') && hasPermission('system:role:delete')" type="vertical" />
              <a-popconfirm title="确定要删除该角色吗？" @confirm="handleDelete(record)">
                <a v-permission="'system:role:delete'" class="danger">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </CommonPagination>
    </a-card>

    <!-- 角色表单弹窗 -->
    <a-modal
      v-model:open="showModal"
      :title="modalTitle"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="角色名称" name="name">
          <a-input v-model:value="form.name" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item label="角色编码" name="code">
          <a-input v-model:value="form.code" :disabled="!!form.id" placeholder="请输入角色编码" />
        </a-form-item>
        <a-form-item label="所属系统" name="appCode">
          <a-input v-model:value="form.appCode" placeholder="请输入所属系统" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入角色描述" :rows="4" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-switch v-model:checked="form.status" :checked-value="true" :unchecked-value="0" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限设置弹窗 -->
    <a-modal
      v-model:open="showPermissionModal"
      title="权限设置"
      ok-text="确定"
      cancel-text="取消"
      @ok="handlePermissionOk"
      @cancel="handlePermissionCancel"
      width="600px"
      :bodyStyle="{ padding: '12px 24px' }"
    >
      <div class="permission-tree-container">
        <!-- 操作按钮 -->
        <div class="tree-operations">
          <a-space>
            <a-button type="primary" size="small" @click="handleCheckAll">
              <template #icon><check-outlined /></template>
              全选
            </a-button>
            <a-button size="small" @click="handleUncheckAll">
              <template #icon><close-outlined /></template>
              取消全选
            </a-button>
            <a-button size="small" @click="handleExpandAll">
              <template #icon>
                <component :is="isExpandAll ? 'minus-square-outlined' : 'plus-square-outlined'" />
              </template>
              {{ isExpandAll ? '折叠' : '展开' }}
            </a-button>
          </a-space>
        </div>
        
        <!-- 权限树 -->
        <div class="tree-content">
          <a-tree
            v-model:checkedKeys="checkedPermissions"
            v-model:selectedKeys="selectedKeys"
            v-model:expandedKeys="expandedKeys"
            :tree-data="permissionTree"
            checkable
            :defaultExpandAll="true"
            :checkStrictly="false"
            :showLine="{ showLeafIcon: false }"
            @check="handleCheck"
            @select="handleSelect"
          >
            <template #title="{ title, meta }">
              <span class="tree-node-title">
                <component :is="meta?.icon || 'apartment-outlined'" />
                <span>{{ title }}</span>
              </span>
            </template>
          </a-tree>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { 
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusSquareOutlined,
  MinusSquareOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { usePermissionStore } from '@/stores/permission';

dayjs.extend(utc);
dayjs.extend(timezone);
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  setRolePermissions,
  getRolePermissions,
  Role, 
  RoleParams,
  disableRole,
  enableRole
} from '@/api/auth/role';
import { getMenuTree, Menu, MenuResponse } from '@/api/auth/menu';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import { ROLE_PERMISSIONS } from '@/utils/permissionConstants';

// 权限检查
const permissionStore = usePermissionStore();
const hasPermission = (permission: string) => permissionStore.hasPermission(permission);

// 表格列定义
const columns = [
  {
    title: '角色名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '角色编码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '所属系统',
    dataIndex: 'appCode',
    key: 'appCode',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 搜索表单数据
const searchForm = reactive<RoleParams>({
  name: '',
  code: '',
  appCode: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
});

// 搜索字段配置
const searchFields = [
  {
    label: '角色名称',
    key: 'name',
    type: 'input' as const,
    placeholder: '请输入角色名称'
  },
  {
    label: '角色编码',
    key: 'code',
    type: 'input' as const,
    placeholder: '请输入角色编码'
  },
  {
    label: '所属系统',
    key: 'appCode',
    type: 'input' as const,
    placeholder: '请输入所属系统'
  },
  {
    label: '状态',
    key: 'status',
    type: 'select' as const,
    placeholder: '请选择状态',
    options: [
      { label: '启用', value: 'true' },
      { label: '禁用', value: 'false' }
    ]
  }
];

// 表格数据和分页
const tableData = ref<Role[]>([]);
const loading = ref(false);
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0,
});

// 表单相关
const showModal = ref(false);
const modalTitle = ref('新增角色');
const formRef = ref<FormInstance>();
const form = reactive({
  id: undefined,
  name: '',
  code: '',
  appCode: '',
  description: '',
  status: true,
});

// 状态切换加载状态
const toggleLoading = ref<Record<number, boolean>>({});

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  appCode: [{ required: true, message: '请输入所属系统', trigger: 'blur' }],
};

// 权限设置相关
const showPermissionModal = ref(false);
const permissionTree = ref<any[]>([]);
const checkedPermissions = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const currentRole = ref<any>(null);

// 计算所有可选的权限key
const allPermissionKeys = computed(() => {
  const keys: string[] = [];
  const traverse = (nodes: any[]) => {
    nodes.forEach(node => {
      keys.push(node.key);
      if (node.children?.length) {
        traverse(node.children);
      }
    });
  };
  traverse(permissionTree.value);
  return keys;
});

// 计算是否全部展开
const isExpandAll = computed(() => {
  return expandedKeys.value.length === allPermissionKeys.value.length;
});

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    return dayjs(dateString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.warn('日期格式化失败:', dateString, error);
    return dateString;
  }
};

// 转换菜单数据为树组件格式
const transformMenuToTree = (menus: Menu[]): any[] => {
  return menus.map(menu => ({
    key: menu.id.toString(),
    title: menu.name,
    meta: menu.meta,
    children: menu.children?.length ? transformMenuToTree(menu.children) : undefined
  }));
};

// 全选
const handleCheckAll = () => {
  checkedPermissions.value = [...allPermissionKeys.value];
};

// 取消全选
const handleUncheckAll = () => {
  checkedPermissions.value = [];
};

// 展开/折叠所有节点
const handleExpandAll = () => {
  if (isExpandAll.value) {
    expandedKeys.value = [];
  } else {
    expandedKeys.value = [...allPermissionKeys.value];
  }
};

// 处理节点选中
const handleCheck = (checkedKeys: string[], e: any) => {
  // 获取所有权限数据
  const allPermissions = permissionTree.value;
  
  // 获取当前操作的节点信息
  const { node, checked } = e;
  const nodeKey = node.key;
  
  // 递归获取所有子节点
  const getAllChildren = (permissions: any[], parentKey: string): string[] => {
    const children: string[] = [];
    for (const permission of permissions) {
      if (permission.key === parentKey && permission.children) {
        for (const child of permission.children) {
          children.push(child.key);
          // 递归获取子节点的子节点
          if (child.children) {
            children.push(...getAllChildren([child], child.key));
          }
        }
      }
    }
    return children;
  };
  
  // 递归获取所有父节点
  const getAllParents = (permissions: any[], childKey: string): string[] => {
    const parents: string[] = [];
    for (const permission of permissions) {
      if (permission.children) {
        for (const child of permission.children) {
          if (child.key === childKey) {
            parents.push(permission.key);
            // 递归获取父节点的父节点
            parents.push(...getAllParents(allPermissions, permission.key));
          }
          // 递归检查更深层的子节点
          if (child.children) {
            const deeperParents = getAllParents([child], childKey);
            if (deeperParents.length > 0) {
              parents.push(permission.key);
            }
          }
        }
      }
    }
    return parents;
  };
  
  let newCheckedKeys = [...checkedKeys];
  
  if (checked) {
    // 选中节点时：自动选中所有子节点
    const children = getAllChildren(allPermissions, nodeKey);
    newCheckedKeys = [...new Set([...newCheckedKeys, ...children])];
  } else {
    // 取消选中节点时：自动取消选中所有子节点
    const children = getAllChildren(allPermissions, nodeKey);
    newCheckedKeys = newCheckedKeys.filter(key => !children.includes(key));
  }
  
  checkedPermissions.value = newCheckedKeys;
};

// 处理节点点击
const handleSelect = (selectedKeys: string[], e: any) => {
  // 点击节点时自动展开/折叠
  const key = e.node.key;
  const index = expandedKeys.value.indexOf(key);
  if (index > -1) {
    expandedKeys.value.splice(index, 1);
  } else {
    expandedKeys.value.push(key);
  }
};

// 获取所有子节点的key
const getChildKeys = (node: any): string[] => {
  const keys: string[] = [];
  const traverse = (node: any) => {
    if (node.children?.length) {
      node.children.forEach((child: any) => {
        keys.push(child.key);
        traverse(child);
      });
    }
  };
  traverse(node);
  return keys;
};

// 查找父节点
const findParentNode = (targetNode: any, tree: any[]): any => {
  for (const node of tree) {
    if (node.children?.length) {
      // 检查直接子节点
      if (node.children.some((child: any) => child.key === targetNode.key)) {
        return node;
      }
      // 递归查找
      const found = findParentNode(targetNode, node.children);
      if (found) return found;
    }
  }
  return null;
};

// 方法定义
const handleSearchFormUpdate = (newForm: any) => {
  Object.assign(searchForm, newForm);
};

const handleSearch = () => {
  // 转换状态字段从字符串到数字
  const searchParams = { ...searchForm };
  if (searchParams.status !== undefined && typeof searchParams.status === 'string') {
    searchParams.status = searchParams.status === 'true' ? 1 : 0;
  }
  
  getRoles(searchParams).then((res) => {
    tableData.value = res.data;
    pagination.total = res.total;
  });
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.code = '';
  searchForm.appCode = '';
  searchForm.status = undefined;
  handleSearch();
};

const handleTableChange = (pageNo: number, pageSize: number) => {
  searchForm.pageNo = pageNo;
  searchForm.pageSize = pageSize;
  handleSearch();
};

const handleAdd = () => {
  modalTitle.value = '新增角色';
  form.id = undefined;
  form.name = '';
  form.code = '';
  form.appCode = '';
  form.description = '';
  form.status = true;
  showModal.value = true;
};

const handleEdit = (record: any) => {
  modalTitle.value = '编辑角色';
  Object.assign(form, record);
  showModal.value = true;
};

const handleModalOk = async () => {
  try {
    await formRef.value?.validate();
    if (form.id) {
      // 编辑角色
      await updateRole(form.id, {
        name: form.name,
        code: form.code,
        appCode: form.appCode,
        description: form.description,
        status: form.status
      });
    } else {
      // 新增角色
      await createRole({
        name: form.name,
        code: form.code,
        appCode: form.appCode,
        description: form.description,
        status: form.status
      });
    }
    showModal.value = false;
    message.success('保存成功');
    handleSearch();
  } catch (error: any) {
    // 显示后端返回的具体错误信息
    const errorMessage = error?.response?.data?.message || error?.message || (form.id ? '更新失败' : '新增失败');
    message.error(errorMessage);
    console.error('操作失败:', error);
  }
};

const handleModalCancel = () => {
  showModal.value = false;
  formRef.value?.resetFields();
};

const handlePermission = async (record: Role) => {
  currentRole.value = record;
  showPermissionModal.value = true;
  
  try {
    // 确保权限树已加载，如果没有则重新加载
    if (permissionTree.value.length === 0) {
      const data = await getMenuTree();
      permissionTree.value = transformMenuToTree(data);
      expandedKeys.value = permissionTree.value.map(node => node.key);
    }
    
    // 获取角色的权限列表
    const res = await getRolePermissions(record.id);
    
    // 处理不同的响应格式
    let permissionIds: number[] = [];
    if (Array.isArray(res)) {
      // 直接返回数组
      permissionIds = res;
    } else if (res && Array.isArray(res.data)) {
      // 返回 {data: []} 格式
      permissionIds = res.data;
    } else if (res && res.code === 200 && Array.isArray(res.data)) {
      // 返回 {code: 200, data: []} 格式
      permissionIds = res.data;
    }
    
    // 将数字权限ID转换为字符串，以匹配树组件的key格式
    checkedPermissions.value = permissionIds.map((id: number) => id.toString());
    
    // 检查哪些权限在树中存在
    const existingKeys = permissionIds.map((id: number) => id.toString()).filter((key: string) => 
      allPermissionKeys.value.includes(key)
    );
    
    // 设置展开所有节点
    expandedKeys.value = permissionTree.value.map(node => node.key);
  } catch (error) {
    console.error('获取权限列表失败:', error);
    message.error('获取权限列表失败');
    // 即使获取权限失败，也保持空数组状态
    checkedPermissions.value = [];
  }
};

const handlePermissionOk = async () => {
  try {
    // 处理 checkedPermissions.value 可能是对象或数组的情况
    let permissionKeys: string[] = [];
    
    if (Array.isArray(checkedPermissions.value)) {
      // 如果是数组，直接使用
      permissionKeys = checkedPermissions.value;
    } else if (checkedPermissions.value && typeof checkedPermissions.value === 'object') {
      // 如果是对象，提取所有选中的keys
      const checkedObj = checkedPermissions.value as any;
      permissionKeys = [
        ...(checkedObj.checked || []),
        ...(checkedObj.halfChecked || [])
      ];
    } else {
      // 如果是其他类型，转换为数组
      permissionKeys = checkedPermissions.value ? [checkedPermissions.value] : [];
    }
    
    // 将字符串权限keys转换回数字数组，以匹配后端API期望的格式
    const permissionIds = permissionKeys.map(key => parseInt(key));
    
    await setRolePermissions(currentRole.value.id, permissionIds);
    showPermissionModal.value = false;
    message.success('权限设置成功');
  } catch (error: any) {
    // 显示后端返回的具体错误信息
    const errorMessage = error?.response?.data?.message || error?.message || '设置权限失败';
    message.error(errorMessage);
    console.error('设置权限失败:', error);
  }
};

const handlePermissionCancel = () => {
  showPermissionModal.value = false;
  checkedPermissions.value = [];
  currentRole.value = null;
};

const handleToggleStatus = async (record: Role, checked: boolean) => {
  toggleLoading.value[record.id] = true;
  try {
    if (checked) {
      await enableRole(record.id);
      message.success('启用成功');
    } else {
      await disableRole(record.id);
      message.success('禁用成功');
    }
    handleSearch();
  } catch (error: any) {
    // 显示后端返回的具体错误信息
    const errorMessage = error?.response?.data?.message || error?.message || (checked ? '启用失败' : '禁用失败');
    message.error(errorMessage);
    console.error('状态切换失败:', error);
  } finally {
    toggleLoading.value[record.id] = false;
  }
};

const handleDelete = async (record: Role) => {
  try {
    await deleteRole(record.id);
    message.success('删除成功');
    handleSearch();
  } catch (error: any) {
    // 显示后端返回的具体错误信息
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败';
    message.error(errorMessage);
    console.error('删除失败:', error);
  }
};

// 初始化
onMounted(async () => {
  handleSearch();
  try {
    // 获取权限树数据
    const data = await getMenuTree();
    permissionTree.value = transformMenuToTree(data);
    // 初始化展开所有节点
    expandedKeys.value = permissionTree.value.map(node => node.key);
  } catch (error) {
    console.error('获取权限树失败:', error);
    message.error('获取权限树失败');
  }
});
</script>

<style lang="scss" scoped>
.role-management {
  padding: 24px;

  .danger {
    color: #ff4d4f;
  }
}

.permission-tree-container {
  .tree-operations {
    margin-bottom: 12px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    .ant-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 4px;
      transition: all 0.3s;

      .anticon {
        font-size: 14px;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.ant-btn-primary {
        background: linear-gradient(45deg, #1890ff, #40a9ff);
        border: none;

        &:hover {
          background: linear-gradient(45deg, #40a9ff, #69c0ff);
        }
      }
    }
  }

  .tree-content {
    max-height: 460px;
    overflow-y: auto;
    padding: 16px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;

      &:hover {
        background: #bfbfbf;
      }
    }

    &::-webkit-scrollbar-track {
      background: #f5f5f5;
      border-radius: 3px;
    }

    :deep(.ant-tree) {
      background: transparent;

      .ant-tree-treenode {
        padding: 6px 0;
        transition: all 0.3s;
        border-radius: 4px;
        
        &:hover {
          background-color: #f0f5ff;
        }

        &.ant-tree-treenode-selected {
          background-color: #e6f7ff;
        }
      }

      .ant-tree-node-content-wrapper {
        transition: all 0.3s;
        
        &:hover {
          background-color: transparent;
        }
        
        &.ant-tree-node-selected {
          background-color: transparent;
        }
      }

      .tree-node-title {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 2px 0;

        .anticon {
          font-size: 16px;
          color: #1890ff;
          transition: all 0.3s;
        }

        span {
          color: #333;
          font-size: 14px;
        }
      }

      .ant-tree-checkbox {
        margin: 0 8px 0 0;
        transition: all 0.3s;

        &-checked {
          .ant-tree-checkbox-inner {
            background: #1890ff;
            border-color: #1890ff;
          }
        }

        &-indeterminate {
          .ant-tree-checkbox-inner {
            background: #e6f7ff;
            border-color: #1890ff;

            &::after {
              background: #1890ff;
            }
          }
        }
      }

      .ant-tree-switcher {
        width: 24px;
        height: 24px;
        line-height: 24px;
        transition: all 0.3s;

        .ant-tree-switcher-icon {
          color: #1890ff;
          font-size: 14px;
        }
      }

      .ant-tree-indent-unit {
        width: 24px;
      }
    }
  }

  // 状态切换开关样式优化
  :deep(.ant-switch) {
    &.ant-switch-checked {
      background-color: #1677ff !important;
      border-color: #1677ff !important;
      
      .ant-switch-handle {
        &::before {
          background-color: #fff;
        }
      }
    }
    
    &:not(.ant-switch-checked) {
      background-color: #d9d9d9 !important;
      border-color: #d9d9d9 !important;
      
      .ant-switch-handle {
        &::before {
          background-color: #fff;
        }
      }
    }
    
    &.ant-switch-disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .ant-switch-handle {
      &::before {
        background-color: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }
    
    .ant-switch-inner {
      color: #fff;
      font-size: 12px;
      font-weight: 500;
    }
  }
}
</style>
