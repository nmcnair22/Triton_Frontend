<template>
  <div class="card w-full h-full">
    <div class="flex justify-content-between align-items-start mb-3">
      <div class="flex align-items-center">
        <i :class="icon" class="text-xl mr-2 text-primary"></i>
        <h3 class="text-lg font-semibold m-0">{{ title }}</h3>
      </div>
      <div v-if="loading" class="flex align-items-center">
        <i class="pi pi-spin pi-spinner text-surface-400"></i>
      </div>
    </div>

    <div v-if="loading" class="flex flex-column">
      <div class="skeleton-loader w-8 h-2rem mb-2"></div>
      <div class="skeleton-loader w-4 h-1rem"></div>
    </div>
    <div v-else class="flex flex-column">
      <div class="text-3xl font-bold mb-2">
        <span v-if="metricType === 'currency'">$</span>{{ formattedValue }}
        <span v-if="metricType === 'percentage'">%</span>
      </div>
      <div class="flex align-items-center">
        <i :class="changeIconClass" class="mr-1"></i>
        <span :class="changeTextClass">{{ formattedChange }}</span>
        <span class="text-xs text-surface-500 dark:text-surface-400 ml-1">vs. previous period</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  metricType: {
    type: String,
    default: 'numeric',
    validator: value => ['numeric', 'currency', 'percentage'].includes(value)
  },
  loadingKey: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'pi pi-chart-bar'
  }
});

const dispatchStore = useDispatchStore();

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const formattedValue = computed(() => {
  const val = Number(props.value);
  if (isNaN(val)) return props.value;
  
  switch (props.metricType) {
    case 'currency':
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'percentage':
      return val.toFixed(1);
    default:
      return val.toLocaleString();
  }
});

const formattedChange = computed(() => {
  const change = Math.abs(props.change);
  const prefix = props.change >= 0 ? '+' : '-';
  
  if (props.metricType === 'percentage') {
    return `${prefix}${change.toFixed(1)}%`;
  }
  
  return `${prefix}${change.toLocaleString()}${props.metricType === 'percentage' ? '%' : ''}`;
});

const changeIconClass = computed(() => {
  const direction = props.change >= 0 ? 'up' : 'down';
  return `pi pi-arrow-${direction} ${direction === 'up' ? 'text-green-500' : 'text-red-500'}`;
});

const changeTextClass = computed(() => {
  return props.change >= 0 ? 'text-green-500' : 'text-red-500';
});
</script>

<style scoped>
.card {
  @apply p-4 rounded-lg bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700;
}

.skeleton-loader {
  @apply bg-surface-200 dark:bg-surface-700 animate-pulse rounded;
}
</style> 