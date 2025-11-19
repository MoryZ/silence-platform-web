<template>
  <div>
    <a-button
      type="link"
      class="env-button"
      @click="showComponentFilter = true"
    >
      <apartment-outlined />
      <span v-if="selectedComponents.length && selectedComponentName">
        {{ selectedSystemName }} / {{ selectedComponentName }}
      </span>
      <span v-else>
        {{ selectedSystemName || '请选择子系统/组件' }}
      </span>
      <down-outlined />
    </a-button>

    <a-modal
      v-model:open="showComponentFilter"
      :footer="null"
      :closable="false"
      :mask-closable="true"
      :width="720"
      class="system-component-selector-modal"
    >
      <template #title>
        <div class="modal-header">
          <span class="modal-title">选择系统/组件</span>
          <close-outlined class="close-icon" @click="showComponentFilter = false" />
        </div>
      </template>
      
      <div class="component-filter">
        <a-tabs v-model:activeKey="activeFilterTab" class="selector-tabs">
          <a-tab-pane key="system" tab="子系统列表" />
          <a-tab-pane key="component" tab="组件列表" />
        </a-tabs>
        <div v-if="activeFilterTab === 'system'" class="system-list grid">
          <div
            v-for="system in filteredSystems"
            :key="system.id"
            class="system-card"
            :class="{ active: system.id === selectedSystem }"
            @click="handleSystemSelect(system)"
          >
            <div class="system-title">{{ system.name }}</div>
            <div class="system-code">编码: {{ system.code }}</div>
            <div class="system-desc">{{ system.description }}</div>
          </div>
        </div>
        <div v-else class="component-list grid">
          <div
            v-for="component in filteredComponents"
            :key="component.id"
            class="component-card"
            :class="{ active: selectedComponents.includes(component.id) }"
            @click="handleComponentSelect(component)"
          >
            <div class="component-title">{{ component.name }}</div>
            <div class="component-code">编码: {{ component.code }}</div>
            <div class="component-desc">{{ component.description }}</div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ApartmentOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { useConfigStore } from '@/stores/config'
import { getAllConfigSubsystem, type ConfigSubsystem } from '@/api/config/configSubsystem'
import { getConfigComponents, type ConfigComponent } from '@/api/config/configComponent'

const configStore = useConfigStore()
const showComponentFilter = ref(false)
const activeFilterTab = ref('system')
const systemSearchValue = ref('')
const componentSearchValue = ref('')
const subsystems = ref<ConfigSubsystem[]>([])
const components = ref<ConfigComponent[]>([])
const selectedSystem = computed({
  get: () => configStore.selectedSystemId,
  set: (val) => configStore.setSelectedSystem(val)
})
const selectedComponents = computed({
  get: () => configStore.selectedComponentIds,
  set: (val) => configStore.setSelectedComponents(val)
})

const fetchSubsystems = async () => {
  const res = await getAllConfigSubsystem()
  subsystems.value = Array.isArray(res) ? res : []
}
const fetchComponents = async (systemId: number) => {
  const res = await getConfigComponents({ subsystemId: systemId })
  components.value = Array.isArray(res) ? res : []
}

onMounted(async () => {
  await fetchSubsystems();
  // 如果有已选中的系统，自动加载其组件
  if (selectedSystem.value) {
    await fetchComponents(selectedSystem.value);
  }
});

watch(
  () => selectedSystem.value,
  async (newVal) => {
    if (newVal) {
      await fetchComponents(newVal);
    } else {
      components.value = [];
    }
  },
  { immediate: true }
);

const filteredSystems = computed(() =>
  !systemSearchValue.value
    ? subsystems.value
    : subsystems.value.filter(sys =>
        sys.name?.toLowerCase().includes(systemSearchValue.value.toLowerCase()) ||
        sys.code?.toLowerCase().includes(systemSearchValue.value.toLowerCase()) ||
        sys.description?.toLowerCase().includes(systemSearchValue.value.toLowerCase())
      )
)
const filteredComponents = computed(() =>
  !componentSearchValue.value
    ? components.value
    : components.value.filter(comp =>
        comp.name?.toLowerCase().includes(componentSearchValue.value.toLowerCase()) ||
        comp.code?.toLowerCase().includes(componentSearchValue.value.toLowerCase()) ||
        comp.description?.toLowerCase().includes(componentSearchValue.value.toLowerCase())
      )
)

const selectedSystemName = computed(() => {
  const sys = subsystems.value.find(sys => sys.id === selectedSystem.value)
  return sys?.name || '请选择子系统'
})
const selectedComponentName = computed(() => {
  const comp = components.value.find(comp => comp.id === selectedComponents.value[0])
  return comp?.name || '请选择组件'
})

const handleSystemSelect = async (system: ConfigSubsystem) => {
  selectedSystem.value = system.id
  await fetchComponents(system.id)
  activeFilterTab.value = 'component'
}
const handleComponentSelect = (component: ConfigComponent) => {
  selectedComponents.value = [component.id]
  showComponentFilter.value = false
}
</script>

<style scoped>
.env-button {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 4px 8px;
}

:deep(.system-component-selector-modal .ant-modal-content) {
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.system-component-selector-modal .ant-modal-header) {
  background: #f0f5ff;
  padding: 16px 48px 16px 20px;
  margin: 0;
  border-bottom: 1px solid #e6ebf1;
  position: relative;
}

:deep(.system-component-selector-modal .ant-modal-title) {
  margin: 0;
  width: 100%;
}

:deep(.system-component-selector-modal .ant-modal-body) {
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: relative;
}

.modal-title {
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.close-icon {
  color: #666;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
}

.close-icon:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}

.component-filter {
  background: #fff;
}

:deep(.selector-tabs) {
  padding: 0 20px;
  margin-top: 0;
}

:deep(.selector-tabs .ant-tabs-nav) {
  margin: 0;
  padding: 0;
}

:deep(.selector-tabs .ant-tabs-tab) {
  padding: 12px 16px;
  font-size: 14px;
}

:deep(.selector-tabs .ant-tabs-ink-bar) {
  background: #1677ff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 24px 20px;
}

.system-list.grid {
  padding-left: 32px;
  padding-right: 32px;
}

.system-card, .component-card {
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  min-height: 100px;
}

.system-card:hover, .component-card:hover {
  border-color: #722ed1;
  box-shadow: 0 2px 8px rgba(114, 46, 209, 0.15);
}

.system-card.active, .component-card.active {
  border-color: #722ed1;
  background: #f9f0ff;
}

.system-title, .component-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.5;
}

.system-code, .component-code {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  line-height: 1.4;
}

.system-desc, .component-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  word-break: break-all;
  flex: 1;
}
</style>