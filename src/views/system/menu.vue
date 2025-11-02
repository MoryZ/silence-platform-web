<template>
  <div class="menu-manager">
    <a-card v-permission="MENU_PERMISSIONS.PAGE" title="菜单管理" :bordered="false">
      <template #extra>
        <a-button 
          v-permission="'system:menu:add'"
          type="primary" 
          @click="handleAdd"
        > 
          <plus-outlined /> 新增 
        </a-button>
      </template>

      <!-- 搜索面板 -->
      <SearchPanel 
        :model-value="searchForm" 
        :fields="searchFields" 
        @search="handleSearch" 
        @reset="handleReset"
        @update:model-value="handleSearchFormUpdate"
      />

      <!-- 表格和分页 -->
      <CommonPagination
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :page-no="pagination.pageNo"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        row-key="id"
        @change="handlePageChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag v-if="record.type === 1" color="blue">目录</a-tag>
            <a-tag v-else-if="record.type === 2" color="green">菜单</a-tag>
            <a-tag v-else-if="record.type === 3" color="orange">按钮</a-tag>
            <span v-else>-</span>
          </template>

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
              <a v-permission="'system:menu:add'" @click="handleAdd(record)">新增</a>
              <a v-permission="'system:menu:edit'" @click="handleEdit(record)">编辑</a>
              <a-popconfirm title="确定要删除这个菜单吗？" @confirm="handleDelete(record)">
                <a v-permission="'system:menu:delete'" class="danger-text">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </CommonPagination>
    </a-card>

    <!-- 菜单编辑对话框 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleModalOk" @cancel="modalVisible = false" width="700px">
      <a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="所属模块" name="moduleType">
          <a-select 
            v-model:value="formState.moduleType" 
            placeholder="请选择所属模块" 
            allow-clear
            :disabled="formState.type === 3"
          >
            <a-select-option value="SYSTEM">系统管理</a-select-option>
            <a-select-option value="CONFIG">配置中心</a-select-option>
            <a-select-option value="MQ">消息队列</a-select-option>
            <a-select-option value="JOB">任务调度</a-select-option>
          </a-select>
        </a-form-item>

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

        <a-form-item :label="formState.type === 3 ? '按钮名称' : '菜单名称'" name="name">
          <a-input 
            v-model:value="formState.name" 
            :placeholder="formState.type === 3 ? '请输入按钮名称' : '请输入菜单名称'" 
          />
        </a-form-item>

        <template v-if="formState.type !== 3">
          <a-form-item label="图标" name="icon">
            <a-input 
              placeholder="请选择图标" 
              readonly 
              @click="showIconModal = true"
            >
              <template #prefix>
                <component v-if="formState.icon" :is="getIconComp(formState.icon)" />
              </template>
              <template #suffix>
                <a-button type="text" size="small" @click="showIconModal = true">
                  选择图标
                </a-button>
              </template>
            </a-input>
          </a-form-item>

          <a-form-item v-if="formState.type !== 3" label="路由路径" name="path">
            <a-input 
              v-model:value="formState.path" 
              placeholder="请输入路由路径" 
              :addon-before="formState.type === 2 ? '' : formState.parentPath" 
            />
          </a-form-item>

          <a-form-item v-if="formState.type === 2" label="组件路径" name="component">
            <a-input v-model:value="formState.component" placeholder="请输入组件路径，例如: system/user/index" />
          </a-form-item>

          <a-form-item v-if="formState.type !== 3" label="重定向" name="redirect">
            <a-input v-model:value="formState.redirect" placeholder="请输入重定向地址" />
          </a-form-item>
        </template>

        <a-form-item v-if="formState.type === 3" label="权限标识" name="permission" :required="true">
          <a-input v-model:value="formState.permission" placeholder="请输入权限标识，例如: system:user:add" />
        </a-form-item>

        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="formState.sort" :min="1" placeholder="请输入排序" style="width: 100%" />
        </a-form-item>

        <a-form-item label="菜单状态">
          <a-switch v-model:checked="formState.visible" checked-children="显示" un-checked-children="隐藏" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图标选择弹框 -->
    <a-modal
      v-model:open="showIconModal"
      title="选择图标"
      width="800px"
      :footer="null"
      @cancel="showIconModal = false"
    >
      <div class="icon-selector">
        <!-- 搜索框 -->
        <div class="icon-search">
          <a-input
            v-model:value="iconSearchText"
            placeholder="搜索图标名称"
            allow-clear
            @input="handleIconSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </div>

        <!-- 图标分类选择 -->
        <div class="icon-categories">
          <a-radio-group v-model:value="selectedIconCategory" @change="handleCategoryChange">
            <a-radio-button value="all">全部</a-radio-button>
            <a-radio-button value="outlined">线框风格</a-radio-button>
            <a-radio-button value="filled">实底风格</a-radio-button>
            <a-radio-button value="twotone">双色风格</a-radio-button>
          </a-radio-group>
        </div>

        <!-- 图标网格 -->
        <div class="icon-grid">
          <div
            v-for="icon in filteredIconList"
            :key="icon.name"
            class="icon-item"
            :class="{ 'icon-item-selected': formState.icon === icon.name }"
            @click="selectIcon(icon.name)"
          >
            <div class="icon-display" :class="`icon-${icon.style}`">
              <component :is="getIconComp(icon.name)" />
            </div>
            <div class="icon-name">{{ icon.baseName }}</div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="icon-pagination">
          <a-pagination
            v-model:current="currentIconPage"
            :total="filteredIconList.length"
            :page-size="iconPageSize"
            :show-size-changer="false"
            :show-quick-jumper="false"
            size="small"
            @change="handleIconPageChange"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, h, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import type { FormInstance } from 'ant-design-vue/es/form'
import * as Icons from '@ant-design/icons-vue'
import SearchPanel from '@/components/SearchPanel.vue'
import CommonPagination from '@/components/CommonPagination.vue'
import { MENU_PERMISSIONS } from '@/utils/permissionConstants'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { getMenuList, addMenu, updateMenu, deleteMenu } from '@/api/auth/menu'
import type { Menu } from '@/api/auth/menu'
import { ls } from '@/utils/stoarge'
import { MENUS } from '@/utils/constant'

// 表格列定义
const columns = [
  {
    title: '菜单名称',
    dataIndex: 'name',
    key: 'name',
    width: 220
  },
  {
    title: '菜单类型',
    key: 'type',
    width: 100
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
    title: '所属模块',
    dataIndex: 'moduleType',
    key: 'moduleType',
    width: 120
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
const menus = ref<Menu[]>([])
const tableData = ref<Menu[]>([])
const modalVisible = ref(false)
const formRef = ref<FormInstance>()
const currentRecord = ref<Menu | null>(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  type: undefined,
  moduleType: undefined,
  status: undefined
})

// 搜索字段配置
const searchFields = [
  {
    key: 'name',
    label: '菜单名称',
    type: 'input' as const,
    placeholder: '请输入菜单名称'
  },
  {
    key: 'type',
    label: '菜单类型',
    type: 'select' as const,
    placeholder: '请选择菜单类型',
    options: [
      { label: '目录', value: '1' },
      { label: '菜单', value: '2' },
      { label: '按钮', value: '3' }
    ]
  },
  {
    key: 'moduleType',
    label: '所属模块',
    type: 'select' as const,
    placeholder: '请选择所属模块',
    options: [
      { label: '系统管理', value: 'SYSTEM' },
      { label: '配置中心', value: 'CONFIG' },
      { label: '消息队列', value: 'MQ' },
      { label: '任务调度', value: 'JOB' }
    ]
  },
  {
    key: 'status',
    label: '显示状态',
    type: 'select' as const,
    placeholder: '请选择显示状态',
    options: [
      { label: '显示', value: 'true' },
      { label: '隐藏', value: 'false' }
    ]
  }
]

// 分页状态
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

// 图标选择相关状态
const showIconModal = ref(false)
const iconSearchText = ref('')
const selectedIconCategory = ref('all')
const currentIconPage = ref(1)
const iconPageSize = 48 // 每页显示48个图标

// 表单状态
const formState = reactive({
  id: undefined as number | undefined,
  parentId: 0 as number, // 默认为根菜单
  parentPath: '',
  type: 1, // 1-目录，2-菜单，3-按钮
  name: '',
  path: '',
  component: '',
  redirect: '',
  moduleType: 'SYSTEM', // 菜单所属模块
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
  component: [
    {
      required: (formState: any) => formState.type === 2,
      message: '请输入组件路径',
      trigger: 'blur'
    }
  ],
  permission: [
    {
      required: (formState: any) => formState.type === 3, // 按钮类型时必填
      message: '请输入权限标识',
      trigger: 'blur'
    }
  ]
}

// 计算属性
const modalTitle = computed(() => {
  return formState.id ? '编辑菜单' : '新增菜单'
})

// 查找菜单的函数
const findMenuById = (menuList: Menu[], id: number): Menu | null => {
  for (const menu of menuList) {
    if (menu.id === id) {
      return menu
    }
    if (menu.children && menu.children.length > 0) {
      const found = findMenuById(menu.children, id)
      if (found) return found
    }
  }
  return null
}

// 监听菜单类型变化
watch(() => formState.type, (newType) => {
  // 当菜单类型为按钮时，自动使用父菜单的模块
  if (newType === 3 && formState.parentId) {
    const parentMenu = findMenuById(menus.value, formState.parentId)
    if (parentMenu && parentMenu.moduleType) {
      formState.moduleType = parentMenu.moduleType
    }
  }
})

// 转换数据为树形结构供选择器使用
const treeData = computed(() => {
  // 添加一个根节点选项
  const rootNode = { id: 0, name: '根菜单', children: convertMenusToTree(menus.value) }
  return [rootNode]
})

// 图标列表 - 按基础名称组织，支持多种风格
const iconList = ref<Array<{baseName: string, name: string, style: string}>>([])

onMounted(() => {
  // 基础图标名称列表（不包含风格后缀）
  const baseIconNames = [
    'Home', 'User', 'Team', 'Setting', 'Menu', 'Dashboard', 'File', 'Folder',
    'Database', 'Cloud', 'Api', 'Tool', 'Monitor', 'SecurityScan', 'Safety', 'Shield',
    'Key', 'Lock', 'Unlock', 'Eye', 'EyeInvisible', 'Idcard', 'Contacts',
    'Book', 'Read', 'Edit', 'Delete', 'FileText', 'FilePdf', 'FileWord', 'FileExcel',
    'FilePpt', 'FileZip', 'FileImage', 'Plus', 'Minus', 'Check', 'Close',
    'Search', 'Filter', 'SortAscending', 'SortDescending', 'Download', 'Upload',
    'Export', 'Import', 'Reload', 'Sync', 'Loading', 'ClockCircle', 'Calendar',
    'Schedule', 'History', 'Time', 'Bell', 'Notification', 'Message', 'Mail',
    'Phone', 'Mobile', 'Desktop', 'Laptop', 'Tablet', 'Camera', 'VideoCamera',
    'Audio', 'Picture', 'Printer', 'Scan', 'Qrcode', 'Barcode', 'Link',
    'ShareAlt', 'Copy', 'Scissor', 'Wifi', 'Global', 'Internet', 'Disconnect',
    'CloudServer', 'CloudUpload', 'CloudDownload', 'CloudSync', 'InfoCircle',
    'QuestionCircle', 'ExclamationCircle', 'CheckCircle', 'CloseCircle',
    'Warning', 'Stop', 'PlayCircle', 'PauseCircle', 'StepForward', 'StepBackward',
    'FastForward', 'FastBackward', 'CaretUp', 'CaretDown', 'CaretLeft', 'CaretRight',
    'Up', 'Down', 'Left', 'Right', 'VerticalAlignTop', 'VerticalAlignBottom',
    'VerticalAlignMiddle', 'HorizontalAlignLeft', 'HorizontalAlignCenter',
    'HorizontalAlignRight', 'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify',
    'Bold', 'Italic', 'Underline', 'Strikethrough', 'FontSize', 'FontColors',
    'BgColors', 'Highlight', 'OrderedList', 'UnorderedList', 'Indent', 'Outdent',
    'Table', 'Border', 'BorderInner', 'BorderOuter', 'BorderTop', 'BorderBottom',
    'BorderLeft', 'BorderRight', 'Line', 'ColumnWidth', 'ColumnHeight', 'MergeCells',
    'SplitCells', 'InsertRowBelow', 'InsertRowAbove', 'DeleteRow', 'InsertColumnLeft',
    'InsertColumnRight', 'DeleteColumn', 'NodeIndex', 'Cluster', 'DeploymentUnit',
    'Partition', 'Subnode', 'Gateway', 'Experiment', 'Fund', 'Insurance',
    'PropertySafety', 'SafetyCertificate', 'Crown', 'Trophy', 'Gift', 'Heart',
    'Like', 'Dislike', 'Smile', 'Frown', 'Meh', 'Laughing', 'Thunderbolt',
    'Fire', 'Bug', 'Rocket', 'Car', 'Truck', 'Ship', 'Plane', 'Train',
    'Subway', 'Bus', 'Taxi', 'Bike', 'Motorcycle'
  ]
  
  // 为每个基础图标创建不同风格的版本
  const allIcons: Array<{baseName: string, name: string, style: string}> = []
  
  baseIconNames.forEach(baseName => {
    // 检查哪些风格的图标存在
    const outlinedName = `${baseName}Outlined`
    const filledName = `${baseName}Filled`
    const twoToneName = `${baseName}TwoTone`
    
    if ((Icons as any)[outlinedName]) {
      allIcons.push({ baseName, name: outlinedName, style: 'outlined' })
    }
    if ((Icons as any)[filledName]) {
      allIcons.push({ baseName, name: filledName, style: 'filled' })
    }
    if ((Icons as any)[twoToneName]) {
      allIcons.push({ baseName, name: twoToneName, style: 'twotone' })
    }
  })
  
  iconList.value = allIcons

  // 加载菜单数据
  fetchMenus()
})

// 获取图标组件
const getIconComp = (name: string) => {
  if (!name) return null
  try {
    const Icon = (Icons as Record<string, any>)[name]
    if (!Icon) return null
    
    // 根据图标风格设置不同的属性
    const props: any = {
      style: { fontSize: '20px' }
    }
    
    if (name.endsWith('TwoTone')) {
      // 双色图标使用双色属性
      props.twoToneColor = ['#e6f7ff', '#1890ff']
    } else if (name.endsWith('Filled')) {
      // 实底图标使用主色调
      props.style = { ...props.style, color: '#1890ff' }
    } else {
      // 线框图标使用默认颜色
      props.style = { ...props.style, color: '#666' }
    }
    
    return h(Icon, props)
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
    // 获取数据后应用过滤条件
    filterMenus()
  } catch (error) {
    console.error('获取菜单失败', error)
    message.error('获取菜单数据失败')
  } finally {
    loading.value = false
  }
}

// 同步菜单数据到本地存储
async function syncMenusToLocalStorage() {
  try {
    // 重新获取最新的菜单数据
    const data = await getMenuList()
    if (data && Array.isArray(data)) {
      // 更新本地存储的菜单数据
      ls.set(MENUS, data)
      console.log('菜单数据已同步到本地存储')
    }
  } catch (error) {
    console.error('同步菜单数据到本地存储失败', error)
  }
}

// 搜索
const handleSearchFormUpdate = (newForm: any) => {
  Object.assign(searchForm, newForm)
}

function handleSearch() {
  // 重置分页到第一页
  pagination.pageNo = 1
  filterMenus()
}

// 重置搜索
function handleReset() {
  // 重置分页到第一页
  pagination.pageNo = 1
  filterMenus()
}

// 分页变化
function handlePageChange(pageNo: number, pageSize: number) {
  pagination.pageNo = pageNo
  pagination.pageSize = pageSize
  filterMenus()
}

// 过滤菜单数据
function filterMenus() {
  if (!searchForm.name && !searchForm.type && !searchForm.moduleType && searchForm.status === undefined) {
    // 没有搜索条件，显示所有数据
    tableData.value = menus.value
    pagination.total = menus.value.length
    return
  }

  // 根据搜索条件过滤数据
  const search = (items: Menu[]): Menu[] => {
    const result: Menu[] = []

    for (const item of items) {
      let match = true

      // 菜单名称匹配
      if (searchForm.name && !item.meta?.title?.includes(searchForm.name)) {
        match = false
      }

      // 菜单类型匹配
      if (searchForm.type !== undefined && item.type !== Number(searchForm.type)) {
        match = false
      }

      // 所属模块匹配
      if (searchForm.moduleType && item.moduleType !== searchForm.moduleType) {
        match = false
      }

      // 显示状态匹配
      if (searchForm.status !== undefined && item.status !== (searchForm.status === 'true')) {
        match = false
      }

      if (match) {
        result.push({ ...item })
      }

      // 递归搜索子菜单
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

  const filteredMenus = search(menus.value)
  tableData.value = filteredMenus
  pagination.total = filteredMenus.length
}

// 转换菜单为树形结构
function convertMenusToTree(menus: Menu[]): any[] {
  if (!menus || !Array.isArray(menus)) {
    return []
  }
  
  return menus.map((menu) => ({
    id: menu.id,
    name: menu.meta?.title || menu.name, // 使用 meta.title 作为显示名称
    children: menu.children && menu.children.length > 0 ? convertMenusToTree(menu.children) : []
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
  formState.parentId = record.parentId || 0 // 保持原始值，0表示根菜单
  formState.type = record.type // 设置菜单类型
  formState.name = record.name
  // 菜单类型时直接使用完整路径，目录类型时拆分路径
  formState.path = record.type === 2 ? record.path : record.path.split('/').pop() || ''
  formState.component = record.component
  formState.redirect = record.redirect || ''
  formState.moduleType = record.moduleType || ''

  // meta 信息
  formState.title = record.meta?.title || ''
  formState.icon = record.meta?.icon || ''
  formState.permission = (record.meta as any)?.permission || ''
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
    await fetchMenus()
    // 同步更新本地存储的菜单数据，确保左侧导航显示最新数据
    await syncMenusToLocalStorage()
  } catch (error) {
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
      // 按钮类型不需要 path 字段
      ...(formState.type !== 3 && {
        path: formState.type === 2 ? formState.path : buildFullPath(formState.path, formState.parentId)
      }),
      // 直接使用用户输入的组件路径，不自动赋值
      component: formState.component || '',
      redirect: formState.redirect,
      moduleType: formState.moduleType,
      sort: formState.sort,
      meta: {
        title: formState.title || formState.name, // 如果 title 为空，使用菜单名称
        icon: formState.icon || '',
        show: formState.visible,
        requiresAuth: true,
        ...(formState.permission && { permission: formState.permission })
      } as any,
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
      // 新增菜单
      await addMenu(menuData)
      message.success('新增成功')
    }

    modalVisible.value = false
    await fetchMenus()
    // 同步更新本地存储的菜单数据，确保左侧导航显示最新数据
    await syncMenusToLocalStorage()
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
  if (!parentPath) {
    return `/${path}`
  }
  
  // 确保父路径和子路径之间只有一个斜杠
  const cleanParentPath = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${cleanParentPath}/${cleanPath}`
}

// 重置表单
function resetForm() {
  currentRecord.value = null
  formState.id = undefined
  formState.parentId = 0 // 默认为根菜单
  formState.parentPath = ''
  formState.type = 1 // 默认为目录类型
  formState.name = ''
  formState.path = ''
  formState.component = ''
  formState.redirect = ''
  formState.moduleType = ''
  formState.title = ''
  formState.icon = ''
  formState.permission = ''
  formState.sort = 1
  formState.status = true
  formState.visible = true

  formRef.value?.resetFields()
}

// 图标选择相关方法
// 过滤图标列表
const filteredIconList = computed(() => {
  let filtered = iconList.value

  // 按分类过滤
  if (selectedIconCategory.value !== 'all') {
    filtered = filtered.filter(icon => icon.style === selectedIconCategory.value)
  }

  // 按搜索文本过滤
  if (iconSearchText.value) {
    filtered = filtered.filter(icon => 
      icon.baseName.toLowerCase().includes(iconSearchText.value.toLowerCase()) ||
      icon.name.toLowerCase().includes(iconSearchText.value.toLowerCase())
    )
  }

  return filtered
})

// 选择图标
function selectIcon(icon: string) {
  formState.icon = icon
  showIconModal.value = false
}

// 处理图标搜索
function handleIconSearch() {
  currentIconPage.value = 1
}

// 处理分类变化
function handleCategoryChange() {
  currentIconPage.value = 1
}

// 处理分页变化
function handleIconPageChange(page: number) {
  currentIconPage.value = page
}
</script>

<style scoped>
.menu-manager {
  padding: 24px;
}
.danger-text {
  color: #ff4d4f;
}

/* 图标选择器样式 */
.icon-selector {
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.icon-search {
  margin-bottom: 16px;
}

.icon-categories {
  margin-bottom: 16px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 16px;
  width: 100%;
  table-layout: fixed;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  min-height: 60px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.icon-item:hover {
  border-color: #1890ff;
  background: #f6ffed;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-item-selected {
  border-color: #1890ff;
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.icon-display {
  font-size: 20px;
  margin-bottom: 4px;
  color: #666;
  flex-shrink: 0;
}

.icon-item:hover .icon-display {
  color: #1890ff;
}

.icon-item-selected .icon-display {
  color: #1890ff;
}

/* 不同风格图标的颜色 */
.icon-outlined {
  color: #666;
}

.icon-filled {
  color: #1890ff;
}

.icon-twotone {
  color: #1890ff;
}

.icon-twotone .anticon {
  color: #1890ff;
}

/* 双色图标的特殊处理 */
.icon-twotone .anticon :is(svg) {
  fill: #1890ff;
}

.icon-twotone .anticon :is(svg) path:first-child {
  fill: #e6f7ff;
}

.icon-twotone .anticon :is(svg) path:last-child {
  fill: #1890ff;
}

.icon-name {
  font-size: 10px;
  color: #666;
  text-align: center;
  word-break: break-word;
  line-height: 1.1;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  max-width: 100%;
  box-sizing: border-box;
}

.icon-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .icon-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
  }
  
  .icon-item {
    padding: 6px 3px;
    min-height: 50px;
  }
  
  .icon-display {
    font-size: 18px;
    margin-bottom: 3px;
  }
  
  .icon-name {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .icon-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .icon-item {
    min-height: 45px;
  }
  
  .icon-display {
    font-size: 16px;
  }
  
  .icon-name {
    font-size: 8px;
  }
}
</style>
