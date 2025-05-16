<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  previousValue: {
    type: [Number, String],
    default: null
  },
  icon: {
    type: String,
    default: 'pi pi-chart-bar'
  },
  color: {
    type: String,
    default: 'primary' // primary, success, info, warning, danger
  },
  isPercentage: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  format: {
    type: String,
    default: 'number' // number, currency, percent, time
  }
});

// Format value based on format type
const formattedValue = computed(() => {
  if (props.loading) return '—';
  
  if (props.isPercentage) {
    return `${Number(props.value).toFixed(1)}%`;
  }
  
  switch (props.format) {
    case 'currency':
      return formatCurrency(props.value);
    case 'percent':
      return `${Number(props.value).toFixed(1)}%`;
    case 'time':
      return formatTime(props.value);
    default:
      return formatNumber(props.value);
  }
});

// Format change indicator
const formattedChange = computed(() => {
  if (props.loading) return '—';
  
  const change = Number(props.change);
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
});

// Determine change indicator color
const changeColor = computed(() => {
  if (props.loading) return 'text-gray-400';
  
  const change = Number(props.change);
  if (change === 0) return 'text-gray-500';
  return change > 0 ? 'text-green-500' : 'text-red-500';
});

// Determine icon color class
const iconColorClass = computed(() => {
  const colorMap = {
    'primary': 'text-blue-600',
    'success': 'text-green-600',
    'info': 'text-cyan-600',
    'warning': 'text-yellow-600',
    'danger': 'text-red-600',
    'secondary': 'text-purple-600'
  };
  
  return colorMap[props.color] || colorMap.primary;
});

// Determine icon background color class
const iconBgClass = computed(() => {
  const bgMap = {
    'primary': 'bg-blue-100',
    'success': 'bg-green-100',
    'info': 'bg-cyan-100',
    'warning': 'bg-yellow-100',
    'danger': 'bg-red-100',
    'secondary': 'bg-purple-100'
  };
  
  return bgMap[props.color] || bgMap.primary;
});

// Format number with commas
function formatNumber(value) {
  return Number(value).toLocaleString();
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Format time (for duration)
function formatTime(minutes) {
  if (!minutes || isNaN(minutes)) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
</script>

<template>
  <div class="bg-white dark:bg-surface-900 rounded-lg shadow border border-gray-200 dark:border-surface-700 p-4">
    <div class="flex items-center justify-between mb-2">
      <div class="text-sm text-gray-500 dark:text-gray-400">{{ title }}</div>
      <div :class="[iconBgClass, 'p-2 rounded-full']">
        <i :class="[icon, iconColorClass]"></i>
      </div>
    </div>
    
    <div class="flex items-end">
      <div class="text-2xl font-bold">{{ formattedValue }}</div>
      <div v-if="!loading" :class="[changeColor, 'ml-2 text-sm font-medium mb-1']">
        {{ formattedChange }}
      </div>
    </div>
    
    <div v-if="previousValue !== null && !loading" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Previous: {{ isPercentage ? `${Number(previousValue).toFixed(1)}%` : formatNumber(previousValue) }}
    </div>
  </div>
</template> 