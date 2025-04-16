<template>
  <div :class="['mini-chart', { 'is-loading': isLoading }]" :style="{ height }">
    <svg v-if="!isLoading && normalizedData.length > 1" width="100%" :height="height" preserveAspectRatio="none">
      <path 
        :d="pathD" 
        fill="none" 
        :stroke="color" 
        :stroke-width="strokeWidth" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      />
    </svg>
    <div v-else-if="isLoading" class="loading-indicator">
      <div class="loading-line"></div>
    </div>
    <div v-else class="no-data">
      <span>—</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  height: {
    type: String,
    default: '30px'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  strokeWidth: {
    type: Number,
    default: 1.5
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

// Normalize data to fit within the chart area
const normalizedData = computed(() => {
  if (!props.data || props.data.length < 2) return [];
  
  const values = props.data.filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length < 2) return [];
  
  return values;
});

// Create SVG path drawing command
const pathD = computed(() => {
  if (normalizedData.value.length < 2) return '';
  
  const values = normalizedData.value;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  // Get the width and height from the SVG viewBox
  const width = 100;
  const height = parseInt(props.height, 10) || 30;
  const padding = 2;
  
  const xStep = (width - padding * 2) / (values.length - 1);
  
  return values.map((value, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
});
</script>

<style scoped>
.mini-chart {
  position: relative;
  width: 100%;
  min-height: 20px;
}

.loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-line {
  height: 1px;
  width: 100%;
  background: linear-gradient(90deg, 
    rgba(203, 213, 225, 0.2),
    rgba(203, 213, 225, 0.8),
    rgba(203, 213, 225, 0.2)
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.no-data {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style> 