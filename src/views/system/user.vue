<template>
  <div class="user-management">
    <a-card :bordered="false">
      <template #title>用户管理</template>
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          新增用户
        </a-button>
      </template>
      
      <!-- 搜索表单 -->
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="searchForm.username" placeholder="请输入用户名" allow-clear />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" style="width: 120px" allow-clear>
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>

      <!-- 用户表格 -->
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        style="margin-top: 16px"
      >
        <template #avatar="{ text }">
          <a-avatar :src="text" />
        </template>
        <template #status="{ text }">
          <a-tag :color="text == 1 ? 'success' : 'error'">
            {{ text == 1 ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template #roles="{ record }">
          <span v-if="record.username === 'admin'">超级管理员</span>
          <span v-else>
            {{ record.roleIds?.map((id: number) => roleOptions.find(role => role.id === id)?.name).filter(Boolean).join(', ') }}
          </span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-button type="link" size="small" @click="handleEdit(record)">
              <template #icon><edit-outlined /></template>
              编辑
            </a-button>
            <a-button type="link" size="small" @click="handleToggleStatus(record)">
              <template #icon>
                <component :is="record.status == 1 ? 'stop-outlined' : 'check-outlined'" />
              </template>
              {{ record.status == 1 ? '禁用' : '启用' }}
            </a-button>
            <a-button type="link" status="danger" size="small" @click="handleDelete(record)">
              <template #icon><delete-outlined /></template>
              删除
            </a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 用户表单弹窗 -->
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
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" name="password" v-if="!form.id">
          <a-input-password v-model:value="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="昵称" name="nickname">
          <a-input v-model:value="form.nickname" placeholder="请输入昵称" />
        </a-form-item>
        <a-form-item label="头像" name="avatar">
          <a-radio-group v-model:value="form.avatar" button-style="solid">
            <a-radio-button v-for="img in avatarOptions" :key="img.value" :value="img.value">
              <a-avatar :src="img.value" :size="24" style="margin-right: 4px" />
              {{ img.label }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="form.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="电话" name="phone">
          <a-input v-model:value="form.phone" placeholder="请输入电话号码" />
        </a-form-item>
        <a-form-item label="角色" name="roleIds">
          <a-select
            v-model:value="form.roleIds"
            mode="multiple"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <a-select-option v-for="role in roleOptions" :key="role.id" :value="role.id">
              {{ role.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-switch v-model:checked="form.status" :checked-value="true" :unchecked-value="false" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  StopOutlined
} from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import { 
  disableUser, 
  enableUser, 
  deleteUser, 
  getUserList, 
  addUser,
  updateUser,
  User 
} from '@/api/auth/user'
import { getRoleList, getRoles, Role, RoleResponse } from '@/api/auth/role'

// 表格列定义
const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '角色',
    dataIndex: 'roles',
    key: 'roles',
    slots: { customRender: 'roles' },
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
  },
  {
    title: '头像',
    dataIndex: 'avatar',
    key: 'avatar',
    slots: { customRender: 'avatar' },
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '电话',
    dataIndex: 'phone',
    key: 'phone',
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
    width: 200,
    fixed: 'right'
  },
];

// 搜索表单数据
const searchForm = reactive({
  username: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10,
});

// 表格数据和分页
const tableData = ref<User[]>([]);
const loading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 头像选项
const avatarOptions = [
  { label: '气球', value: '/src/assets/images/bubble.png' },
  { label: '机器猫', value: '/src/assets/images/doraemon.png' },
  { label: '可爱', value: '/src/assets/images/cute.png' },
  { label: '女孩', value: '/src/assets/images/girl.png' },
  { label: '工作', value: '/src/assets/images/work.png' },
];

// 表单相关
const showModal = ref(false);
const modalTitle = ref('新增用户');
const formRef = ref<FormInstance>();
const form = reactive<Partial<User>>({
  id: undefined,
  username: '',
  password: '',
  nickname: '',
  avatar: '/src/assets/images/doraemon.png',
  email: '',
  phone: '',
  status: true,
  roleIds: []
});

// 表单验证规则
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  avatar: [{ required: true, message: '请选择头像', trigger: 'change' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
      message: '请输入正确的邮箱格式', 
      trigger: 'blur' 
    }
  ],
  phone: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { 
      pattern: /^1[3-9]\d{9}$/, 
      message: '请输入正确的手机号码格式', 
      trigger: 'blur' 
    }
  ],
  roleIds: [{ required: true, message: '请选择角色', type: 'array', trigger: 'change' }],
};

// 角色选项
const roleOptions = ref<Role[]>([]);

// 方法定义
const handleSearch = () => {
  getUserList(searchForm).then((res) => {
    tableData.value = res.data;
    pagination.total = res.data;
  });
};

const handleReset = () => {
  searchForm.username = '';
  searchForm.status = undefined;
  handleSearch();
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  handleSearch();
};

const handleAdd = () => {
  modalTitle.value = '新增用户';
  form.id = undefined;
  form.username = '';
  form.password = '';
  form.nickname = '';
  form.avatar = '/src/assets/images/doraemon.png';
  form.email = '';
  form.phone = '';
  form.roleIds = [];
  form.status = true;
  showModal.value = true;
  
};

const handleEdit = (record: any) => {
  modalTitle.value = '编辑用户';
  Object.assign(form, record);
  showModal.value = true;
};

const handleModalOk = async () => {
  try {
    await formRef.value?.validate();
    const userData: User = {
      id: form.id!,
      username: form.username!,
      password: form.password!,
      nickname: form.nickname!,
      avatar: form.avatar!,
      email: form.email!,
      phone: form.phone!,
      status: form.status!,
      roleIds: form.roleIds || []
    };

    if (form.id) {
      // 编辑用户
      await updateUser(userData);
      message.success('更新成功');
    } else {
      // 新增用户
      await addUser(userData);
      message.success('新增成功');
    }
    showModal.value = false;
    handleSearch();
  } catch (error: any) {
    message.error(form.id ? '更新失败' : '新增失败');
    console.error('操作失败:', error);
  }
};

const handleModalCancel = () => {
  showModal.value = false;
  formRef.value?.resetFields();
};

const handleToggleStatus = async (record: any) => {
  try {
    if (record.status === 1) {
      await disableUser(record.id);
      message.success('禁用成功');
    } else {
      await enableUser(record.id);
      message.success('启用成功');
    }
    handleSearch();
  } catch (error: any) {
    message.error(record.status === 1 ? '禁用失败' : '启用失败');
    console.error('操作失败:', error);
  }
};

const handleDelete = async (record: any) => {
  try {
    await deleteUser(record.id);
    message.success('删除成功');
    handleSearch();
  } catch (error: any) {
    message.error('删除失败');
    console.error('删除失败:', error);
  }
};

// 初始化
onMounted(() => {
  handleSearch();
  getRoleList().then((res) => {
    roleOptions.value = res.data;
  });
});
</script>

<style lang="scss" scoped>
.user-management {
  padding: 24px;

  :deep(.ant-btn-link) {
    padding: 0 4px;
    
    &[status="danger"] {
      color: #ff4d4f;
      
      &:hover {
        color: #ff7875;
      }
    }
  }
}
</style>