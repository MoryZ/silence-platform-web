<script setup lang="ts">
import { ref, reactive, watch, computed, defineProps, defineEmits } from 'vue';

interface Point {
  x: number;
  y: number;
}

interface Segment {
  p0: Point;
  p1: Point;
  cp: Point; // 控制点
  tension: number; // 弯曲度
}

const props = defineProps<{
  points: Point[];
  width?: number;
  height?: number;
}>();
const emit = defineEmits(['update:points', 'update:segments']);

const width = computed(() => props.width || 600);
const height = computed(() => props.height || 400);

// 分段数据
const segments = ref<Segment[]>([]);

// 初始化分段和控制点
function initSegments() {
  const pts = props.points;
  const segs: Segment[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    // 默认控制点在两点连线的1/3处，初始tension为0.5
    const cp = {
      x: p0.x + (p1.x - p0.x) * 0.5 + 40,
      y: p0.y + (p1.y - p0.y) * 0.5 - 40,
    };
    segs.push({ p0, p1, cp, tension: 0.5 });
  }
  segments.value = segs;
}

watch(() => props.points, initSegments, { immediate: true });

// 拖拽状态
const drag = reactive({ type: '', segIdx: -1, ptIdx: -1, offsetX: 0, offsetY: 0 });

function onSvgMouseDown(e: MouseEvent) {
  // 释放拖拽
  drag.type = '';
}

function startDragAnchor(idx: number, e: MouseEvent) {
  drag.type = 'anchor';
  drag.ptIdx = idx;
  drag.offsetX = e.offsetX - props.points[idx].x;
  drag.offsetY = e.offsetY - props.points[idx].y;
  window.addEventListener('mousemove', onDragAnchor);
  window.addEventListener('mouseup', stopDrag);
}
function onDragAnchor(e: MouseEvent) {
  if (drag.type !== 'anchor') return;
  const pts = [...props.points];
  pts[drag.ptIdx] = {
    x: e.clientX - drag.offsetX,
    y: e.clientY - drag.offsetY,
  };
  emit('update:points', pts);
}

function startDragControl(segIdx: number, e: MouseEvent) {
  drag.type = 'control';
  drag.segIdx = segIdx;
  drag.offsetX = e.offsetX - segments.value[segIdx].cp.x;
  drag.offsetY = e.offsetY - segments.value[segIdx].cp.y;
  window.addEventListener('mousemove', onDragControl);
  window.addEventListener('mouseup', stopDrag);
}
function onDragControl(e: MouseEvent) {
  if (drag.type !== 'control') return;
  const segs = segments.value.slice();
  segs[drag.segIdx] = {
    ...segs[drag.segIdx],
    cp: {
      x: e.clientX - drag.offsetX,
      y: e.clientY - drag.offsetY,
    },
  };
  segments.value = segs;
  emit('update:segments', segs);
}

function stopDrag() {
  drag.type = '';
  window.removeEventListener('mousemove', onDragAnchor);
  window.removeEventListener('mousemove', onDragControl);
  window.removeEventListener('mouseup', stopDrag);
}

// 滑块调节弯曲度，自动更新控制点
function updateControlPoint(segIdx: number) {
  const seg = segments.value[segIdx];
  const { p0, p1, tension } = seg;
  // 控制点在p0-p1连线的中点，偏移量由tension决定
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const mx = p0.x + dx * 0.5;
  const my = p0.y + dy * 0.5;
  const offset = 80 * (tension - 0.5); // -40~+40
  const angle = Math.atan2(dy, dx) - Math.PI / 2;
  const cp = {
    x: mx + Math.cos(angle) * offset,
    y: my + Math.sin(angle) * offset,
  };
  segments.value[segIdx] = { ...seg, cp };
  emit('update:segments', segments.value.slice());
}

// 生成SVG贝塞尔曲线路径
function getBezierPath(seg: Segment) {
  return `M${seg.p0.x},${seg.p0.y} Q${seg.cp.x},${seg.cp.y} ${seg.p1.x},${seg.p1.y}`;
}
</script>

<template>
  <div>
    <svg :width="width" :height="height" style="background:#f8f9fa;border-radius:8px;" @mousedown="onSvgMouseDown">
      <!-- 锚点 -->
      <circle
        v-for="(pt, idx) in props.points"
        :key="'anchor-' + idx"
        :cx="pt.x"
        :cy="pt.y"
        r="7"
        fill="#1976d2"
        style="cursor:pointer;stroke:#fff;stroke-width:2;"
        @mousedown.stop="startDragAnchor(idx, $event)"
      />
      <!-- 控制点 -->
      <circle
        v-for="(seg, idx) in segments"
        :key="'ctrl-' + idx"
        :cx="seg.cp.x"
        :cy="seg.cp.y"
        r="6"
        fill="#ff9800"
        style="cursor:pointer;stroke:#fff;stroke-width:2;"
        @mousedown.stop="startDragControl(idx, $event)"
      />
      <!-- 辅助线 -->
      <line
        v-for="(seg, idx) in segments"
        :key="'line1-' + idx"
        :x1="seg.p0.x" :y1="seg.p0.y"
        :x2="seg.cp.x" :y2="seg.cp.y"
        stroke="#bbb" stroke-dasharray="4" />
      <line
        v-for="(seg, idx) in segments"
        :key="'line2-' + idx"
        :x1="seg.cp.x" :y1="seg.cp.y"
        :x2="seg.p1.x" :y2="seg.p1.y"
        stroke="#bbb" stroke-dasharray="4" />
      <!-- 贝塞尔曲线 -->
      <path
        v-for="(seg, idx) in segments"
        :key="'curve-' + idx"
        :d="getBezierPath(seg)"
        stroke="#333"
        fill="none"
        stroke-width="3"
      />
    </svg>
    <!-- 滑块调节每段曲线的弯曲度 -->
    <div v-for="(seg, idx) in segments" :key="'slider-' + idx" style="margin:8px 0;display:flex;align-items:center;gap:8px;">
      <span style="width:80px;">曲线{{ idx + 1 }}弯曲度</span>
      <input type="range" min="0" max="1" step="0.01" v-model.number="seg.tension" @input="() => updateControlPoint(idx)" style="flex:1;" />
      <span style="width:40px;">{{ seg.tension.toFixed(2) }}</span>
    </div>
  </div>
</template>

<style scoped>
</style> 