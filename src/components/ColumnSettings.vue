<template>
  <div ref="triggerRef" class="column-settings-trigger">
    <slot name="trigger" :open="open" :toggle="toggle">
      <a-button @click="toggle">
        <template #icon>
          <!-- gear icon -->
          <svg width="1em" height="1em" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
            <path d="M512 624a112 112 0 1 0 0-224 112 112 0 0 0 0 224Z"/>
            <path d="M952 560v-96l-93.3-20.7a354.5 354.5 0 0 0-27.6-66.6l54.4-78.3-67.9-67.9-78.3 54.4a354.5 354.5 0 0 0-66.6-27.6L560 72h-96l-20.7 93.3a354.5 354.5 0 0 0-66.6 27.6l-78.3-54.4-67.9 67.9 54.4 78.3a354.5 354.5 0 0 0-27.6 66.6L72 464v96l93.3 20.7c6.7 23 15.8 45.2 27.6 66.6l-54.4 78.3 67.9 67.9 78.3-54.4c21.4 11.8 43.6 20.9 66.6 27.6L464 952h96l20.7-93.3a354.5 354.5 0 0 0 66.6-27.6l78.3 54.4 67.9-67.9-54.4-78.3c11.8-21.4 20.9-43.6 27.6-66.6L952 560ZM512 704c-106 0-192-86-192-192s86-192 192-192 192 86 192 192-86 192-192 192Z"/>
          </svg>
        </template>
        列设置
      </a-button>
    </slot>
  </div>

  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="cs-root" :style="{ zIndex: zIndex }">
        <div class="cs-mask" @click="close" />
        <div class="cs-panel" :style="panelStyle">
          <div class="cs-header">
            <span>列设置</span>
            <div class="cs-actions">
              <a-button size="small" type="link" @click="resetDefault">恢复默认</a-button>
            </div>
          </div>
          <div class="cs-body">
            <Draggable v-model="localColumns" item-key="key" handle=".drag-handle" animation="200">
              <template #item="{ element }">
                <div class="column-setting-item">
                  <span class="drag-handle">☰</span>
                  <a-checkbox :checked="localCheckedKeys.includes(element.key)" @change="onCheck(element.key, $event.target.checked)">
                    {{ getDisplayTitle(element) }}
                  </a-checkbox>
                </div>
              </template>
            </Draggable>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, PropType } from 'vue';
import Draggable from 'vuedraggable';

type Column = { key: string; dataIndex?: string; title?: string; label?: string; visible?: boolean } & Record<string, any>;

const props = defineProps({
  columns: { type: Array as PropType<Column[]>, required: true },
  modelValue: { type: Array as PropType<string[]>, default: () => [] },
  defaultKeys: { type: Array as PropType<string[]>, default: undefined },
  width: { type: Number, default: 260 },
  zIndex: { type: Number, default: 2200 },
});
const emit = defineEmits(['update:modelValue', 'update:columns']);

const open = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelTop = ref(0);
const panelLeft = ref(0);
const panelWidth = computed(() => props.width + 'px');

const localColumns = ref<Column[]>([]);
const localCheckedKeys = ref<string[]>([]);

watch(() => props.columns, (val) => { localColumns.value = [...val]; }, { immediate: true, deep: true });
watch(() => props.modelValue, (val) => { localCheckedKeys.value = [...val]; }, { immediate: true });

function updatePosition() {
  const el = triggerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  panelTop.value = rect.bottom + 8; // 8px gap
  // right align with trigger
  panelLeft.value = Math.max(8, rect.right - props.width);
}

function onWindowResize() { if (open.value) updatePosition(); }
onMounted(() => { window.addEventListener('scroll', onWindowResize, true); window.addEventListener('resize', onWindowResize); });
onBeforeUnmount(() => { window.removeEventListener('scroll', onWindowResize, true); window.removeEventListener('resize', onWindowResize); });

const panelStyle = computed(() => ({ top: panelTop.value + 'px', left: panelLeft.value + 'px', width: panelWidth.value }));

function toggle() { open.value ? close() : openPanel(); }
function openPanel() { updatePosition(); open.value = true; }
function close() { open.value = false; emit('update:columns', localColumns.value); }

function onCheck(key: string, checked: boolean) {
  const next = new Set(localCheckedKeys.value);
  if (checked) next.add(key); else next.delete(key);
  localCheckedKeys.value = Array.from(next);
  emit('update:modelValue', localCheckedKeys.value);
}
function resetDefault() {
  if (props.defaultKeys && props.defaultKeys.length) {
    localCheckedKeys.value = [...props.defaultKeys];
  } else {
    localCheckedKeys.value = localColumns.value.filter(c => c.visible !== false).map(c => c.key);
  }
  emit('update:modelValue', localCheckedKeys.value);
}

// Utilities to compute safe display title and strip non-serializable renderer
function getDisplayTitle(col: Column): string {
  const title = (col as any).title;
  if (typeof title === 'function') return (col as any).label || (col as any).dataIndex || col.key;
  if (title && typeof title === 'object') return (col as any).label || (col as any).dataIndex || col.key;
  return title || (col as any).label || (col as any).dataIndex || col.key;
}

// Strip vue vnode/function title before emitting columns to avoid circular JSON structures in devtools/logs
watch(localColumns, (cols) => {
  for (const c of cols) {
    if (typeof (c as any).title === 'function') {
      (c as any).label = getDisplayTitle(c);
      (c as any).title = (c as any).label;
    }
  }
}, { deep: true });
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .12s linear; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.cs-root { position: fixed; inset: 0; }
.cs-mask { position: absolute; inset: 0; background: transparent; }
.cs-panel {
  position: absolute;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  box-shadow: 0 6px 24px rgba(0,0,0,.15);
  overflow: hidden;
}
.cs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-weight: 600;
}
.cs-actions { display: flex; gap: 8px; }
.cs-body { max-height: 420px; overflow: auto; padding: 8px 0; }
.column-setting-item { display:flex; align-items:center; padding: 4px 12px; }
.drag-handle { cursor: grab; margin-right:8px; color:#bbb; font-size:16px; }
</style>

