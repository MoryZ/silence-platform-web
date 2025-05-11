<template>
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
  <a-drawer
    title="选择系统/组件"
    :width="600"
    v-model:open="showComponentFilter"
    :body-style="{ padding: '0' }"
    class="selector-drawer"
  >
    <div class="component-filter">
      <a-tabs v-model:activeKey="activeFilterTab">
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
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ApartmentOutlined, DownOutlined } from '@ant-design/icons-vue'
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

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px 24px;
}

.system-card, .component-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px 20px 12px 20px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  min-height: 90px;
}

.system-card:hover, .component-card:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 8px rgba(22,119,255,0.08);
}

.system-card.active, .component-card.active {
  border-color: #1677ff;
  background: #e6f7ff;
}

.system-title, .component-title {
  font-weight: 600;
  font-size: 16px;
  color: #222;
  margin-bottom: 6px;
}

.system-code, .component-code {
  font-size: 13px;
  color: #888;
  margin-bottom: 2px;
}

.system-desc, .component-desc {
  font-size: 13px;
  color: #666;
  opacity: 0.85;
  margin-top: 2px;
  word-break: break-all;
}
</style>