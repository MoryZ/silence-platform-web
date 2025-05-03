<template>
  <div class="menu-manager">
    <a-card title="菜单管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd"> <plus-outlined /> 新增 </a-button>
      </template>

      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="8">
          <a-input-search v-model:value="searchValue" placeholder="请输入菜单名称" @search="handleSearch" />
        </a-col>
      </a-row>

      <a-table :columns="columns" :data-source="tableData" :row-key="(record: Menu) => record.id" :loading="loading" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">
            <span v-if="record.meta.icon">
              <component :is="getIconComp(record.meta.icon)" />
            </span>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'status'">
            <a-tag v-if="record.status" color="green">显示</a-tag>
            <a-tag v-else color="red">隐藏</a-tag>
          </template>

          <template v-if="column.key === 'permission'">
            <a-tag v-if="record.meta.permission" color="blue">{{ record.meta.permission }}</a-tag>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="handleAdd(record)">新增子菜单</a>
              <a @click="handleEdit(record)">编辑</a>
              <a-popconfirm title="确定要删除这个菜单吗？" @confirm="handleDelete(record)">
                <a class="danger-text">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 菜单编辑对话框 -->
    <a-modal v-model:visible="modalVisible" :title="modalTitle" @ok="handleModalOk" @cancel="modalVisible = false" width="700px">
      <a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="上级菜单" name="parentId">
          <a-tree-select
            v-model:value="formState.parentId"
            :tree-data="treeData"
            placeholder="请选择上级菜单"
            allow-clear
            tree-default-expand-all
            :field-names="{ label: 'name', value: 'id', children: 'children' }"
          />
        </a-form-item>

        <a-form-item label="菜单类型" name="type">
          <a-radio-group v-model:value="formState.type">
            <a-radio :value="1">目录</a-radio>
            <a-radio :value="2">菜单</a-radio>
            <a-radio :value="3">按钮/权限</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="菜单名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入菜单名称" />
        </a-form-item>

        <template v-if="formState.type !== 3">
          <a-form-item label="图标" name="icon">
            <a-select v-model:value="formState.icon" placeholder="请选择图标" allow-clear show-search>
              <a-select-option v-for="icon in iconList" :key="icon" :value="icon"> <component :is="getIconComp(icon)" /> {{ icon }} </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="路由路径" name="path">
            <a-input v-model:value="formState.path" placeholder="请输入路由路径" :addon-before="formState.parentPath" />
          </a-form-item>

          <a-form-item v-if="formState.type !== 3" label="组件路径" name="component">
            <a-input v-model:value="formState.component" placeholder="请输入组件路径，例如: system/user/index" />
          </a-form-item>

          <a-form-item v-if="formState.type !== 3" label="重定向" name="redirect">
            <a-input v-model:value="formState.redirect" placeholder="请输入重定向地址" />
          </a-form-item>
        </template>

        <a-form-item v-if="formState.type === 2" label="权限标识" name="permission" :required="true">
          <a-input v-model:value="formState.permission" placeholder="请输入权限标识，例如: system:user:view" />
        </a-form-item>

        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="formState.sort" :min="1" placeholder="请输入排序" style="width: 100%" />
        </a-form-item>

        <a-form-item label="菜单状态">
          <a-switch v-model:checked="formState.visible" checked-children="显示" un-checked-children="隐藏" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import message from 'ant-design-vue/es/message'
import type { FormInstance } from 'ant-design-vue/es/form'
import * as Icons from '@ant-design/icons-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getMenuList, addMenu, updateMenu, deleteMenu } from '@/api/menu'
import type { Menu } from '@/api/menu'

// 表格列定义
const columns = [
  {
    title: '菜单名称',
    dataIndex: 'name',
    key: 'name',
    width: 220
  },
  {
    title: '图标',
    key: 'icon',
    width: 150
  },
  {
    title: '路由路径',
    dataIndex: 'path',
    key: 'path'
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    key: 'component'
  },
  {
    title: '权限标识',
    key: 'permission',
    width: 180
  },
  {
    title: '显示状态',
    key: 'status',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
]

// 状态变量
const loading = ref(false)
const searchValue = ref('')
const menus = ref<Menu[]>([])
const tableData = ref<Menu[]>([])
const modalVisible = ref(false)
const formRef = ref<FormInstance>()
const currentRecord = ref<Menu | null>(null)

// 表单状态
const formState = reactive({
  id: undefined as number | undefined,
  parentId: null as number | null,
  parentPath: '',
  type: 1, // 1-目录，2-菜单，3-按钮
  name: '',
  path: '',
  component: '',
  redirect: '',

  title: '',
  icon: '',
  permission: '',

  sort: 1,
  status: true, // 默认启用
  visible: true // 默认显示
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
  permission: [
    {
      required: (formState: any) => formState.type === 2,
      message: '请输入权限标识',
      trigger: 'blur'
    }
  ]
}

// 计算属性
const modalTitle = computed(() => {
  return formState.id ? '编辑菜单' : '新增菜单'
})

// 转换数据为树形结构供选择器使用
const treeData = computed(() => {
  // 添加一个根节点选项
  return [{ id: 0, name: '根菜单', children: convertMenusToTree(menus.value) }]
})

// 图标列表
const iconList = ref<string[]>([])
onMounted(() => {
  // 获取所有图标
  const icons = Object.keys(Icons)
    .filter((key) => key.endsWith('Outlined') && !key.startsWith('Icon'))
    .sort()
  iconList.value = icons

  // 加载菜单数据
  fetchMenus()
})

// 获取图标组件
const getIconComp = (name: string) => {
  if (!name) return null
  try {
    const Icon = (Icons as Record<string, any>)[name]
    return Icon ? h(Icon) : null
  } catch (error) {
    console.warn(`Icon ${name} not found`)
    return null
  }
}

// 获取菜单数据
async function fetchMenus() {
  loading.value = true
  try {
    const data = await getMenuList()
    menus.value = data || []
    tableData.value = menus.value
  } catch (error) {
    console.error('获取菜单失败', error)
    message.error('获取菜单数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch(value: string) {
  if (!value) {
    tableData.value = menus.value
    return
  }

  // 简单的前端搜索
  const search = (items: Menu[]): Menu[] => {
    const result: Menu[] = []

    for (const item of items) {
      if (item.meta.title.includes(value)) {
        result.push({ ...item })
      }

      if (item.children && item.children.length > 0) {
        const children = search(item.children)
        if (children.length > 0) {
          result.push({
            ...item,
            children
          })
        }
      }
    }

    return result
  }

  tableData.value = search(menus.value)
}

// 转换菜单为树形结构
function convertMenusToTree(menus: Menu[]): any[] {
  return menus.map((menu) => ({
    id: menu.id,
    name: menu.name,
    children: menu.children ? convertMenusToTree(menu.children) : []
  }))
}

// 新增菜单
function handleAdd(parent?: Menu) {
  resetForm()

  if (parent) {
    formState.parentId = parent.id
    formState.parentPath = parent.path
    // 如果父级是目录，默认为菜单类型
    formState.type = 2
  } else {
    formState.type = 1 // 默认为目录
  }

  modalVisible.value = true
}

// 编辑菜单
function handleEdit(record: Menu) {
  resetForm()
  currentRecord.value = record

  // 基本信息
  formState.id = record.id
  formState.parentId = record.parentId === 0 ? null : record.parentId
  formState.name = record.name
  formState.path = record.path.split('/').pop() || ''
  formState.component = record.component
  formState.redirect = record.redirect || ''

  // meta 信息
  formState.title = record.meta?.title || ''
  formState.icon = record.meta?.icon || ''
  formState.permission = record.meta?.permission || ''
  formState.visible = record.meta?.show !== false

  // 状态
  formState.status = record.status !== false

  // 查找父级路径
  if (record.parentId) {
    const findParentPath = (items: Menu[], id: number): string => {
      for (const item of items) {
        if (item.id === id) {
          return item.path
        }
        if (item.children) {
          const path = findParentPath(item.children, id)
          if (path) return path
        }
      }
      return ''
    }

    formState.parentPath = findParentPath(menus.value, record.parentId)
  }

  modalVisible.value = true
}

// 删除菜单
async function handleDelete(record: Menu) {
  try {
    await deleteMenu(record.id)
    message.success('删除成功')
    fetchMenus()
  } catch (error) {
    console.error('删除菜单失败', error)
    message.error('删除菜单失败')
  }
}

// 保存菜单
async function handleModalOk() {
  try {
    await formRef.value?.validate()

    // 构建菜单数据
    const menuData: Partial<Menu> = {
      type: formState.type,
      parentId: formState.parentId || 0,
      name: formState.name,
      path: buildFullPath(formState.path, formState.parentId),
      component: formState.type === 1 ? 'RouteView' : formState.type === 2 ? formState.component : '',
      redirect: formState.redirect,
      sort: formState.sort,
      meta: {
        title: formState.title,
        ...(formState.icon && { icon: formState.icon }),
        ...(formState.permission && { permission: formState.permission }),
        show: formState.visible
      },
      status: formState.status
    }

    // 根据类型设置重定向
    if (formState.type === 1 && formState.redirect) {
      menuData.redirect = formState.redirect
    }

    if (formState.id) {
      // 更新菜单
      await updateMenu(formState.id, menuData)
      message.success('更新成功')
    } else {
      debugger
      // 新增菜单
      await addMenu(menuData)
      message.success('新增成功')
    }

    modalVisible.value = false
    fetchMenus()
  } catch (error) {
    console.error('保存菜单失败', error)
  }
}

// 构建完整路径
function buildFullPath(path: string, parentId: number | null): string {
  if (!parentId) {
    return `/${path}`
  }

  // 查找父级路径
  const findParentPath = (items: Menu[], id: number): string => {
    for (const item of items) {
      if (item.id === id) {
        return item.path
      }
      if (item.children) {
        const parentPath = findParentPath(item.children, id)
        if (parentPath) return parentPath
      }
    }
    return ''
  }

  const parentPath = findParentPath(menus.value, parentId)
  return parentPath ? `${parentPath}/${path}` : `/${path}`
}

// 重置表单
function resetForm() {
  currentRecord.value = null
  formState.id = undefined
  formState.parentId = null
  formState.parentPath = ''
  formState.type = 1 // 默认为目录类型
  formState.name = ''
  formState.path = ''
  formState.component = ''
  formState.redirect = ''
  formState.title = ''
  formState.icon = ''
  formState.permission = ''
  formState.sort = 1
  formState.status = true
  formState.visible = true

  formRef.value?.resetFields()
}
</script>

<style scoped>
.menu-manager {
  padding: 24px;
}
.danger-text {
  color: #ff4d4f;
}
</style>
