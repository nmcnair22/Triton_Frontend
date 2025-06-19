<template>
  <div class="stats-card">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <i v-if="icon" :class="[icon, iconColorClass]" class="text-lg"></i>
          <span class="text-sm font-medium text-surface-600 dark:text-surface-300">
            {{ title }}
          </span>
        </div>
        
        <div class="flex items-baseline gap-2">
          <span :class="valueClasses">{{ value }}</span>
        </div>
        
        <div v-if="trend !== null && trend !== undefined" class="flex items-center gap-1 mt-2">
          <i :class="trendIcon" :style="{ color: trendColor }"></i>
          <span :class="trendTextClass">
            {{ Math.abs(trend) }}% {{ trendDirection }}
          </span>
        </div>
      </div>
      
      <div v-if="$slots.chart" class="ml-4">
        <slot name="chart" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue';

// Vue 3.5 Reactive Props Destructure
const { 
  title,
  value,
  icon,
  color = 'primary',
  trend
} = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'primary'
  },
  trend: {
    type: Number,
    default: null
  }
});

// Vue 3.5 useId() for accessibility
const cardId = useId();

// Computed properties for styling
const iconColorClass = computed(() => {
  const colors = {
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400'
  };
  return colors[color] || colors.primary;
});

const valueClasses = computed(() => [
  'text-2xl font-bold text-surface-900 dark:text-surface-0'
]);

const trendIcon = computed(() => {
  if (trend === undefined) return '';
  if (trend > 0) return 'pi pi-arrow-up';
  if (trend < 0) return 'pi pi-arrow-down';
  return 'pi pi-minus';
});

const trendColor = computed(() => {
  if (trend === undefined) return '';
  if (trend > 0) return '#22c55e'; // green
  if (trend < 0) return '#ef4444'; // red
  return '#6b7280'; // gray
});

const trendTextClass = computed(() => [
  'text-xs font-medium',
  {
    'text-green-600 dark:text-green-400': trend > 0,
    'text-red-600 dark:text-red-400': trend < 0,
    'text-gray-600 dark:text-gray-400': trend === 0
  }
]);

const trendDirection = computed(() => {
  if (trend === undefined) return '';
  if (trend > 0) return 'increase';
  if (trend < 0) return 'decrease';
  return 'no change';
});
</script>

<style scoped>
.stats-card {
  @apply bg-white dark:bg-surface-900 rounded-lg p-4 border border-surface-200 dark:border-surface-700 transition-all duration-200 hover:shadow-md;
}
</style> 