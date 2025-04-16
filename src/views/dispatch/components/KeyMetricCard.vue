<template>
  <div class="key-metric-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
    <div class="flex flex-col h-full">
      <div class="p-2 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center mb-1">
          <i :class="['mr-1 text-gray-400 dark:text-gray-500', icon]"></i>
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ label }}</span>
        </div>
        <div class="flex items-baseline">
          <span class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ formattedValue }}</span>
          <ChangeIndicator v-if="change !== null && !isNaN(change)" :value="change" class="ml-2" :invert="invertChange" />
        </div>
      </div>
      
      <div class="flex-grow p-2 pt-1">
        <MiniChart 
          v-if="data && data.length" 
          :data="data" 
          :is-loading="loading" 
          :color="getChartColor" 
          height="26px"
          :stroke-width="1"
        />
        <div v-else-if="loading" class="h-[26px] w-full flex items-center justify-center">
          <div class="w-full h-[1px] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        </div>
        <div v-else class="h-[26px] flex items-center justify-center">
          <span class="text-xs text-gray-400 dark:text-gray-500">No data</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import MiniChart from './MiniChart.vue';
import ChangeIndicator from './ChangeIndicator.vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Metric'
  },
  value: {
    type: [Number, String],
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  format: {
    type: String,
    default: 'number' // 'number', 'currency', 'percent'
  },
  icon: {
    type: String,
    default: 'pi pi-chart-line'
  },
  data: {
    type: Array,
    default: () => []
  },
  change: {
    type: Number,
    default: null
  },
  invertChange: {
    type: Boolean,
    default: false
  },
  thresholds: {
    type: Object,
    default: () => ({
      good: 0,
      warning: -5,
      bad: -10
    })
  },
  chartColor: {
    type: String,
    default: null
  }
});

const getChartColor = computed(() => {
  if (props.chartColor) return props.chartColor;
  
  // Default colors based on value type
  if (props.format === 'currency') return '#297FB7'; // blue for money
  if (props.format === 'percent') return '#14B8A6'; // teal for percentages
  
  // Otherwise, determine color by change if available
  if (props.change !== null && !isNaN(props.change)) {
    const actualChange = props.invertChange ? -props.change : props.change;
    if (actualChange >= props.thresholds.good) return '#10B981'; // green for good
    if (actualChange >= props.thresholds.warning) return '#F59E0B'; // amber for warning
    return '#EF4444'; // red for bad
  }
  
  return '#64748B'; // default slate
});

const isNumber = (value) => {
  return typeof value === 'number' && !isNaN(value);
};

const formattedValue = computed(() => {
  if (props.loading) return '—';
  
  if (props.value === null || props.value === undefined) {
    return 'N/A';
  }
  
  switch (props.format) {
    case 'currency':
      return formatCurrency(props.value);
    case 'percent':
      return formatPercent(props.value);
    default:
      return formatNumber(props.value);
  }
});

function formatCurrency(value) {
  try {
    // Handle string values that might be already formatted
    if (typeof value === 'string') {
      if (value.startsWith('$')) return value;
      const numeric = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numeric)) return '$0';
      value = numeric;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0';
  }
}

function formatPercent(value) {
  try {
    // Handle string values
    if (typeof value === 'string') {
      if (value.endsWith('%')) return value;
      const numeric = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numeric)) return '0.0%';
      value = numeric;
    }
    
    // Convert to decimal if needed (e.g., 42 -> 0.42)
    const normalizedValue = value > 1 ? value / 100 : value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(normalizedValue);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0.0%';
  }
}

function formatNumber(value) {
  try {
    // Handle string values
    if (typeof value === 'string') {
      const numeric = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numeric)) return '0';
      value = numeric;
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
}
</script>

<style scoped>
.key-metric-card {
  height: 100%;
  min-height: 90px;
}
</style> 