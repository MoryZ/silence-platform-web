<template>
  <div class="role-management">
    <a-card :bordered="false">
      <template #title>角色管理</template>
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增角色
        </a-button>
      </template>

      <!-- 搜索表单 -->
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="角色名称" name="name">
          <a-input v-model:value="searchForm.name" placeholder="请输入角色名称" allow-clear />
        </a-form-item>
        <a-form-item label="角色名称" name="code">
          <a-input v-model:value="searchForm.code" placeholder="请输入角色编码" allow-clear />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" style="width: 120px" allow-clear>
            <a-select-option :value="true">启用</a-select-option>
            <a-select-option :value="false">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>

      <!-- 角色表格 -->
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        style="margin-top: 16px"
      >
        <template #status="{ text }">
          <a-tag :color="text ? 'success' : 'error'">
            {{ text ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template #action="{ record }">
          <a-space>
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="handlePermission(record)">权限设置</a>
            <a-divider type="vertical" />
            <a-popconfirm
              :title="'确定要' + (record.status ? '禁用' : '启用') + '该角色吗？'"
              @confirm="handleToggleStatus(record)"
            >
              <a>{{ record.status ? '禁用' : '启用' }}</a>
            </a-popconfirm>
            <a-divider type="vertical" />
            <a-popconfirm title="确定要删除该角色吗？" @confirm="handleDelete(record)">
              <a class="danger">删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
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
            <template #title="{ title, icon }">
              <span class="tree-node-title">
                <component :is="icon || 'apartment-outlined'" />
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
import { getMenuTree, MenuResponse } from '@/api/auth/menu';

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
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' },
  },
  {
    title: '创建时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

// 搜索表单数据
const searchForm = reactive<RoleParams>({
  name: '',
  code: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
});

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
  description: '',
  status: true,
});

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
};

// 权限设置相关
const showPermissionModal = ref(false);
const permissionTree = ref<MenuResponse[]>([]);
const checkedPermissions = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const currentRole = ref<any>(null);

// 计算所有可选的权限key
const allPermissionKeys = computed(() => {
  const keys: string[] = [];
  const traverse = (nodes: MenuResponse[]) => {
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
  checkedPermissions.value = checkedKeys;
  // 如果是父节点被选中/取消，可以自动选中/取消所有子节点
  if (e.node.children?.length) {
    const childKeys = getChildKeys(e.node);
    if (e.checked) {
      checkedPermissions.value = [...new Set([...checkedPermissions.value, ...childKeys])];
    } else {
      checkedPermissions.value = checkedPermissions.value.filter(key => !childKeys.includes(key));
    }
  }
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

// 方法定义
const handleSearch = () => {
  getRoles(searchForm).then((res) => {
    tableData.value = res.data;
    pagination.total = res.total;
  });
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.status = 1;
  handleSearch();
};

const handleTableChange = (pag: any) => {
  pagination.pageNo = pag.current;
  pagination.pageSize = pag.pageSize;
  handleSearch();
};

const handleAdd = () => {
  modalTitle.value = '新增角色';
  form.id = undefined;
  form.name = '';
  form.code = '';
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
        description: form.description,
        status: form.status
      });
    } else {
      // 新增角色
      await createRole({
        name: form.name,
        code: form.code,
        description: form.description,
        status: form.status
      });
    }
    showModal.value = false;
    message.success('保存成功');
    handleSearch();
  } catch (error) {
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
    // 获取角色的权限列表
    const res = await getRolePermissions(record.id);
    // 确保返回的是数组，如果为空则初始化为空数组
    checkedPermissions.value = Array.isArray(res.data) ? res.data : [];
    
    // 如果权限树已加载，设置展开所有节点
    if (permissionTree.value.length > 0) {
      expandedKeys.value = permissionTree.value.map(node => node.key as string);
    }
  } catch (error) {
    console.error('获取权限列表失败:', error);
    message.error('获取权限列表失败');
    // 即使获取权限失败，也保持空数组状态
    checkedPermissions.value = [];
  }
};

const handlePermissionOk = async () => {
  try {
    await setRolePermissions(currentRole.value.id, checkedPermissions.value);
    showPermissionModal.value = false;
    message.success('权限设置成功');
  } catch (error) {
    console.error('设置权限失败:', error);
    message.error('设置权限失败');
  }
};

const handlePermissionCancel = () => {
  showPermissionModal.value = false;
  checkedPermissions.value = [];
  currentRole.value = null;
};

const handleToggleStatus = async (record: Role) => {
  try {
    if (record.status) {
        await disableRole(record.id);
    } else {
        await enableRole(record.id);
    }
    message.success('操作成功');
    handleSearch();
  } catch (error) {
    console.error('状态切换失败:', error);
    message.error('状态切换失败');
  }
};

const handleDelete = async (record: Role) => {
  try {
    await deleteRole(record.id);
    message.success('删除成功');
    handleSearch();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

// 初始化
onMounted(async () => {
  handleSearch();
  try {
    // 获取权限树数据
    const data = await getMenuTree();
    permissionTree.value = data;
    // 初始化展开所有节点
    expandedKeys.value = permissionTree.value.map(node => node.key as string);
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
}
</style>
