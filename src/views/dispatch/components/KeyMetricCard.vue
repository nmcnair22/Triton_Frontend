<template>
  <div class="metric-card" :class="[`${colorScheme}-card`]">
    <div class="card-content flex flex-col justify-between h-full">
      <!-- Card Header with Title and Icon -->
      <div class="card-header flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 m-0">{{ title }}</h3>
        <div class="icon-container">
          <i :class="icon" class="metric-icon"></i>
        </div>
      </div>

      <!-- Card Body with Value and Change -->
      <div class="card-body">
        <!-- Loading State -->
        <div v-if="loading" class="animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-24 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="hasError" class="error-state">
          <div class="text-xs text-red-500 mb-1 flex items-center">
            <i class="pi pi-exclamation-triangle mr-1"></i>
            <span>{{ errorMessage || 'Error loading data' }}</span>
          </div>
          <button @click="$emit('retry')" 
            class="retry-button text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
            <i class="pi pi-refresh mr-1"></i>
            <span>Retry</span>
          </button>
        </div>
        
        <!-- Value State -->
        <div v-else>
          <div class="metric-value-container">
            <span class="metric-value">
              <span v-if="metricType === 'currency' && value !== null">$</span>{{ formattedValue }}
              <span v-if="metricType === 'percentage' && value !== null">%</span>
            </span>
          </div>
          <div class="metric-change-container mt-1">
            <div v-if="change !== undefined" class="flex items-center">
              <i :class="changeIconClass" class="mr-1"></i>
              <span :class="changeTextClass" class="change-value">{{ formattedChange }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">vs. previous</span>
            </div>
            <div v-else class="text-xs text-gray-500 dark:text-gray-400">
              No previous data
            </div>
          </div>
        </div>
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
  },
  hasError: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  colorScheme: {
    type: String,
    default: 'primary',
    validator: value => ['primary', 'success', 'warning', 'danger', 'info', 'purple', 'teal', 'orange', 'indigo'].includes(value)
  }
});

const emit = defineEmits(['retry']);

const dispatchStore = useDispatchStore();

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const formattedValue = computed(() => {
  if (props.hasError) return 'Error';
  if (props.value === undefined || props.value === null) return '--';
  
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
  if (props.change === undefined) return '';
  
  const change = Math.abs(props.change);
  const prefix = props.change >= 0 ? '+' : '-';
  
  if (props.metricType === 'percentage') {
    return `${prefix}${change.toFixed(1)}%`;
  }
  
  return `${prefix}${change.toLocaleString()}${props.metricType === 'percentage' ? '%' : ''}`;
});

const changeIconClass = computed(() => {
  if (props.change === undefined) return '';
  
  const direction = props.change >= 0 ? 'up' : 'down';
  return `pi pi-arrow-${direction}`;
});

const changeTextClass = computed(() => {
  if (props.change === undefined) return '';
  
  return props.change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
});
</script>

<style scoped>
.metric-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-full transition-all relative overflow-hidden;
}

.icon-container {
  @apply flex justify-center items-center rounded-full h-8 w-8 bg-opacity-10 transition-colors;
}

.metric-icon {
  @apply text-base;
}

.metric-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.change-value {
  @apply text-xs font-medium;
}

/* Color schemes based on mockups */
.primary-card .icon-container {
  @apply bg-blue-100 dark:bg-blue-900;
}

.primary-card .metric-icon {
  @apply text-blue-600 dark:text-blue-400;
}

.success-card .icon-container {
  @apply bg-green-100 dark:bg-green-900;
}

.success-card .metric-icon {
  @apply text-green-600 dark:text-green-400;
}

.warning-card .icon-container {
  @apply bg-yellow-100 dark:bg-yellow-900;
}

.warning-card .metric-icon {
  @apply text-yellow-600 dark:text-yellow-400;
}

.danger-card .icon-container {
  @apply bg-red-100 dark:bg-red-900;
}

.danger-card .metric-icon {
  @apply text-red-600 dark:text-red-400;
}

.info-card .icon-container {
  @apply bg-blue-100 dark:bg-blue-900;
}

.info-card .metric-icon {
  @apply text-blue-600 dark:text-blue-400;
}

.purple-card .icon-container {
  @apply bg-purple-100 dark:bg-purple-900;
}

.purple-card .metric-icon {
  @apply text-purple-600 dark:text-purple-400;
}

.teal-card .icon-container {
  @apply bg-teal-100 dark:bg-teal-900;
}

.teal-card .metric-icon {
  @apply text-teal-600 dark:text-teal-400;
}

.orange-card .icon-container {
  @apply bg-orange-100 dark:bg-orange-900;
}

.orange-card .metric-icon {
  @apply text-orange-600 dark:text-orange-400;
}

.indigo-card .icon-container {
  @apply bg-indigo-100 dark:bg-indigo-900;
}

.indigo-card .metric-icon {
  @apply text-indigo-600 dark:text-indigo-400;
}
</style> 