<template>
  <div class="slide-verify" :class="{ success: isVerified }">
    <div class="verify-container" ref="container">
      <!-- 背景 -->
      <div class="verify-bg">
        <span>{{ isVerified ? '验证通过' : '向右滑动验证' }}</span>
      </div>
      <!-- 滑块 -->
      <div
        class="verify-slider"
        :style="{ left: sliderLeft + 'px' }"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
      >
        <component :is="isVerified ? CheckOutlined : RightOutlined" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { CheckOutlined, RightOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  value?: boolean;
  successDistance?: number;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'update:value', value: boolean): void;
}>();

const container = ref<HTMLElement | null>(null);
const sliderLeft = ref(0);
const isVerified = ref(false);
const isDragging = ref(false);
const startX = ref(0);
const originX = ref(0);

const handleMouseDown = (e: MouseEvent) => {
  if (isVerified.value) return;
  isDragging.value = true;
  startX.value = e.clientX;
  originX.value = sliderLeft.value;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleTouchStart = (e: TouchEvent) => {
  if (isVerified.value) return;
  isDragging.value = true;
  startX.value = e.touches[0].clientX;
  originX.value = sliderLeft.value;
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const currentX = e.clientX;
  const diff = currentX - startX.value;
  updateSliderPosition(diff);
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  const currentX = e.touches[0].clientX;
  const diff = currentX - startX.value;
  updateSliderPosition(diff);
};

const updateSliderPosition = (diff: number) => {
  const containerWidth = container.value?.clientWidth || 0;
  const sliderWidth = 40; // 滑块宽度
  const maxLeft = containerWidth - sliderWidth;
  let newLeft = originX.value + diff;
  
  // 限制滑块位置
  newLeft = Math.max(0, Math.min(newLeft, maxLeft));
  sliderLeft.value = newLeft;
  
  // 检查是否验证成功
  if (newLeft >= maxLeft - 5) {
    isVerified.value = true;
    isDragging.value = false;
    sliderLeft.value = maxLeft;
    emit('success');
    emit('update:value', true);
  }
};

const handleMouseUp = () => {
  if (!isVerified.value) {
    sliderLeft.value = 0;
  }
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

const handleTouchEnd = () => {
  if (!isVerified.value) {
    sliderLeft.value = 0;
  }
  isDragging.value = false;
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
};

// 检查预设的验证状态
onMounted(() => {
  // 如果value属性已经是true，自动完成验证
  if (props.value) {
    setTimeout(() => {
      const containerWidth = container.value?.clientWidth || 0;
      const sliderWidth = 40; // 滑块宽度
      const maxLeft = containerWidth - sliderWidth;
      isVerified.value = true;
      sliderLeft.value = maxLeft;
      emit('success');
      emit('update:value', true);
    }, 100); // 短暂延迟确保DOM已完全渲染
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
});
</script>

<style scoped>
.slide-verify {
  width: 100%;
  height: 40px;
  margin: 16px 0;
  user-select: none;
}

.verify-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1f1f1f;
  border-radius: 4px;
  overflow: hidden;
}

.verify-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #808080;
  font-size: 14px;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    background: linear-gradient(90deg, #36D1DC 0%, #5B86E5 100%);
    opacity: 0.2;
    transition: width 0.3s;
  }
}

.success .verify-bg {
  color: #fff;
  
  &::after {
    width: 100%;
    opacity: 0.3;
  }
}

.verify-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 100%;
  background: linear-gradient(90deg, #36D1DC 0%, #5B86E5 100%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  
  &:hover {
    background: linear-gradient(90deg, #5bdce6 0%, #7599e8 100%);
  }
  
  :deep(.anticon) {
    color: #fff;
    font-size: 16px;
  }
}

.success .verify-slider {
  background: #52c41a;
  cursor: default;
  
  &:hover {
    background: #52c41a;
  }
}
</style> 