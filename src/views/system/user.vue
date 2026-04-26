<template>
  <div class="user-management">
    <a-card v-permission="USER_PERMISSIONS.PAGE" :bordered="false">
      <template #title>用户管理</template>
      <template #extra>
        <a-button 
          v-permission="USER_PERMISSIONS.ADD"
          type="primary" 
          @click="handleAdd"
        >
          <template #icon><plus-outlined /></template>
          新增用户
        </a-button>
      </template>
      
      <!-- 搜索面板 -->
      <search-panel
        :model-value="searchForm"
        :fields="searchFields"
        @search="handleSearch"
        @reset="handleReset"
        @update:model-value="handleSearchFormUpdate"
      />

      <!-- 用户表格 -->
      <common-pagination
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :page-no="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        row-key="id"
        style="margin-top: 16px"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'avatar'">
            <a-avatar :src="getAvatarUrl(text)" />
          </template>
          <template v-else-if="column.key === 'status'">
            <a-switch 
              v-if="hasUserStatusPermission()"
              :checked="text === true"
              :loading="toggleLoading[record.id]"
              :disabled="record.username === 'admin'"
              @change="(checked: boolean) => handleToggleStatus(record, checked)"
              size="small"
              :style="{
                backgroundColor: text === true ? '#1677ff' : '#d9d9d9',
                borderColor: text === true ? '#1677ff' : '#d9d9d9'
              }"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'createdDate'">
            {{ formatDate(text) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button 
                v-permission="USER_PERMISSIONS.EDIT"
                type="link" 
                size="small" 
                @click="handleEdit(record)"
              >
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-button 
                v-permission="USER_PERMISSIONS.RESET_PASSWORD"
                type="link" 
                size="small" 
                @click="handleChangePassword(record)"
              >
                <template #icon><key-outlined /></template>
                修改密码
              </a-button>
              <a-button 
                v-permission="USER_PERMISSIONS.DELETE"
                type="link" 
                status="danger" 
                size="small" 
                @click="handleDelete(record)"
              >
                <template #icon><delete-outlined /></template>
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </common-pagination>
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
        id="user-form"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="form.username" placeholder="请输入用户名" autocomplete="username" />
        </a-form-item>
        <a-form-item label="密码" name="password" v-if="!form.id">
          <a-input-password v-model:value="form.password" placeholder="请输入密码" autocomplete="new-password" />
        </a-form-item>
        <a-form-item label="昵称" name="nickname">
          <a-input v-model:value="form.nickname" placeholder="请输入昵称" autocomplete="nickname" />
        </a-form-item>
        <a-form-item label="头像" name="avatar">
          <a-radio-group v-model:value="form.avatar" button-style="solid">
            <a-radio-button v-for="img in avatarOptions" :key="img.value" :value="img.value">
              <a-avatar :src="img.preview" :size="24" style="margin-right: 4px" />
              {{ img.label }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="form.email" placeholder="请输入邮箱" autocomplete="email" />
        </a-form-item>
        <a-form-item label="电话" name="phone">
          <a-input v-model:value="form.phone" placeholder="请输入电话号码" autocomplete="tel" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-switch v-model:checked="form.status" :checked-value="true" :unchecked-value="false" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:open="showPasswordModal"
      title="修改密码"
      ok-text="确定"
      cancel-text="取消"
      @ok="handlePasswordModalOk"
      @cancel="handlePasswordModalCancel"
    >
      <a-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="passwordForm.username" disabled />
        </a-form-item>
        <a-form-item label="新密码" name="newPassword">
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
} from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import SearchPanel from '@/components/SearchPanel.vue';
import CommonPagination from '@/components/CommonPagination.vue';
import { USER_PERMISSIONS } from '@/utils/permissionConstants';
import { hasPermission } from '@/utils/permissionCheck';
import { 
  disableUser, 
  enableUser, 
  deleteUser, 
  getUserList, 
  addUser,
  updateUser,
  resetPassword
} from '@/api/auth/user'
import type { User } from '@/types/auth'

// 静态导入头像图片
import bubbleImg from '@/assets/images/bubble.png'
import cuteImg from '@/assets/images/cute.png'
import doraemonImg from '@/assets/images/doraemon.png'
import girlImg from '@/assets/images/girl.png'
import workImg from '@/assets/images/work.png'

// 表格列定义
const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
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
  },
  {
    title: '创建时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
  },
  {
    title: '操作',
    key: 'action',
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
  { label: '气球', value: 'bubble', preview: bubbleImg },
  { label: '机器猫', value: 'doraemon', preview: doraemonImg },
  { label: '可爱', value: 'cute', preview: cuteImg },
  { label: '女孩', value: 'girl', preview: girlImg },
  { label: '工作', value: 'work', preview: workImg },
];

const defaultAvatarKey = 'doraemon';

// 表单相关
const showModal = ref(false);
const modalTitle = ref('新增用户');
const formRef = ref<FormInstance>();
const form = reactive<Partial<User>>({
  id: undefined,
  username: '',
  password: '',
  nickname: '',
  avatar: defaultAvatarKey,
  email: '',
  phone: '',
  status: true
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
  ]
};

// 状态切换加载状态
const toggleLoading = ref<Record<number, boolean>>({});

// 检查用户状态操作权限
const hasUserStatusPermission = () => {
  return hasPermission(USER_PERMISSIONS.ENABLE) || hasPermission(USER_PERMISSIONS.DISABLE);
};

const ensurePermission = (permission: string, actionName: string) => {
  if (!hasPermission(permission)) {
    message.warning(`暂无${actionName}权限`);
    return false;
  }
  return true;
};


// 修改密码相关
const showPasswordModal = ref(false);
const passwordFormRef = ref<FormInstance>();
const passwordForm = reactive({
  id: undefined,
  username: '',
  newPassword: '',
  confirmPassword: ''
});

// 修改密码验证规则
const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (value && value !== passwordForm.newPassword) {
          return Promise.reject(new Error('两次输入的密码不一致'));
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    }
  ]
};

// 搜索字段配置
const searchFields = [
  {
    key: 'username',
    label: '用户名',
    type: 'input' as const,
    placeholder: '请输入用户名'
  },
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    placeholder: '请选择状态',
    options: [
      { label: '启用', value: 'true' },
      { label: '禁用', value: 'false' }
    ]
  }
];

// 头像映射
const avatarMap = avatarOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.preview;
  return acc;
}, {});

const legacyAvatarPathMap = avatarOptions.reduce<Record<string, string>>((acc, option) => {
  const filename = `${option.value}.png`;
  acc[`/src/assets/images/${filename}`] = option.value;
  acc[`/assets/images/${filename}`] = option.value;
  return acc;
}, {});

const normalizeAvatarKey = (avatarPath: string) => {
  if (!avatarPath) return '';
  if (avatarMap[avatarPath]) return avatarPath;
  if (legacyAvatarPathMap[avatarPath]) return legacyAvatarPathMap[avatarPath];
  const fileName = avatarPath.split('/').pop()?.replace(/\.\w+$/, '');
  if (fileName && avatarMap[fileName]) {
    return fileName;
  }
  return avatarPath;
};

// 头像处理函数
const getAvatarUrl = (avatarPath: string) => {
  if (!avatarPath) return '';
  
  // 如果路径已经是完整的 URL，直接返回
  if (avatarPath.startsWith('http')) return avatarPath;

  const normalizedKey = normalizeAvatarKey(avatarPath);
  if (avatarMap[normalizedKey]) {
    return avatarMap[normalizedKey];
  }
  
  if (avatarPath.startsWith('/src/')) {
    return avatarPath.replace('/src', '');
  }
  
  return avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
};

// 日期格式化函数
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    // 将 UTC 时间转换为本地时间（UTC+8）
    return dayjs(dateString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.warn('日期格式化失败:', dateString, error);
    return dateString;
  }
};

// 方法定义
const handleSearchFormUpdate = (newForm: any) => {
  Object.assign(searchForm, newForm);
};

const handleSearch = () => {
  // 处理搜索参数，将字符串转换为布尔值
  const searchParams = {
    username: searchForm.username || undefined,
    status: searchForm.status === 'true' ? true : searchForm.status === 'false' ? false : undefined,
    pageNo: searchForm.pageNo,
    pageSize: searchForm.pageSize
  };
  
  getUserList(searchParams).then((res) => {
    tableData.value = res.data;
    pagination.total = res.total;
  });
};

const handleReset = () => {
  searchForm.username = '';
  searchForm.status = undefined;
  searchForm.pageNo = 1;
  pagination.current = 1;
  handleSearch();
};

const handleTableChange = (pageNo: number, pageSize: number) => {
  pagination.current = pageNo;
  pagination.pageSize = pageSize;
  searchForm.pageNo = pageNo;
  searchForm.pageSize = pageSize;
  handleSearch();
};

const handleAdd = () => {
  if (!ensurePermission(USER_PERMISSIONS.ADD, '新增用户')) return;

  modalTitle.value = '新增用户';
  form.id = undefined;
  form.username = '';
  form.password = '';
  form.nickname = '';
  form.avatar = defaultAvatarKey;
  form.email = '';
  form.phone = '';
  form.status = true;
  showModal.value = true;
  
};

const handleEdit = (record: any) => {
  if (!ensurePermission(USER_PERMISSIONS.EDIT, '编辑用户')) return;

  modalTitle.value = '编辑用户';
  Object.assign(form, record);
  form.avatar = normalizeAvatarKey(record.avatar) || defaultAvatarKey;
  showModal.value = true;
};

const handleModalOk = async () => {
  try {
    const targetPermission = form.id ? USER_PERMISSIONS.EDIT : USER_PERMISSIONS.ADD;
    const actionName = form.id ? '编辑用户' : '新增用户';
    if (!ensurePermission(targetPermission, actionName)) return;

    await formRef.value?.validate();
    const userData: User = {
      id: form.id!,
      username: form.username!,
      password: form.password!,
      nickname: form.nickname!,
      avatar: form.avatar!,
      email: form.email!,
      phone: form.phone!,
      status: form.status!
    };

    if (form.id) {
      // 编辑用户
      await updateUser(form.id, userData);
      message.success('更新成功');
    } else {
      // 新增用户
      await addUser(userData);
      message.success('新增成功');
    }
    showModal.value = false;
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

const handleToggleStatus = async (record: any, checked: boolean) => {
  const targetPermission = checked ? USER_PERMISSIONS.ENABLE : USER_PERMISSIONS.DISABLE;
  const actionName = checked ? '启用用户' : '禁用用户';
  if (!ensurePermission(targetPermission, actionName)) return;

  toggleLoading.value[record.id] = true;
  try {
    if (checked) {
      await enableUser(record.id);
      message.success('启用成功');
    } else {
      await disableUser(record.id);
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

const handleDelete = async (record: any) => {
  try {
    if (!ensurePermission(USER_PERMISSIONS.DELETE, '删除用户')) return;

    await deleteUser(record.id);
    message.success('删除成功');
    handleSearch();
  } catch (error: any) {
    // 显示后端返回的具体错误信息
    const errorMessage = error?.response?.data?.message || error?.message || '删除失败';
    message.error(errorMessage);
    console.error('删除失败:', error);
  }
};

const handleChangePassword = (record: any) => {
  if (!ensurePermission(USER_PERMISSIONS.RESET_PASSWORD, '重置密码')) return;

  passwordForm.id = record.id;
  passwordForm.username = record.username;
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  showPasswordModal.value = true;
};

const handlePasswordModalOk = async () => {
  try {
    if (!ensurePermission(USER_PERMISSIONS.RESET_PASSWORD, '重置密码')) return;

    await passwordFormRef.value?.validate();
    // 这里应该调用修改密码的 API
    await resetPassword(passwordForm.id!, passwordForm.newPassword);
    message.success('密码修改成功');
    showPasswordModal.value = false;
    passwordFormRef.value?.resetFields();
  } catch (error: any) {
    // 显示后端返回的具体错误信息
    const errorMessage = error?.response?.data?.message || error?.message || '密码修改失败';
    message.error(errorMessage);
    console.error('密码修改失败:', error);
  }
};

const handlePasswordModalCancel = () => {
  showPasswordModal.value = false;
  passwordFormRef.value?.resetFields();
};

// 初始化
onMounted(() => {
  handleSearch();
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
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
    
    .ant-switch-inner {
      color: #fff;
      font-weight: 500;
    }
  }
}
</style>