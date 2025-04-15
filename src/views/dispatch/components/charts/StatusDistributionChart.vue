<template>
  <div class="h-full">
    <div v-if="loading" class="chart-skeleton flex align-items-center justify-content-center">
      <Skeleton height="20rem" class="w-full" />
    </div>
    
    <div v-else-if="!hasData" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-pie text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No status data available</p>
    </div>
    
    <Chart v-else type="pie" :data="chartData" :options="chartOptions" class="h-full" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingKey: {
    type: String,
    default: 'resultCodes'
  }
});

const dispatchStore = useDispatchStore();
const documentStyle = document.documentElement.style;

// Function to adjust brightness of colors
function adjustBrightness(hex, percent) {
  // Validate hex input
  if (!hex || typeof hex !== 'string') {
    return hex;
  }
  
  // Clean up hex value if needed
  hex = hex.replace(/^\s*#|\s*$/g, '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }
  
  // Ensure valid hex format
  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    return hex;
  }
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const adjustedR = Math.max(0, Math.min(255, Math.round(r * (1 + percent / 100))));
  const adjustedG = Math.max(0, Math.min(255, Math.round(g * (1 + percent / 100))));
  const adjustedB = Math.max(0, Math.min(255, Math.round(b * (1 + percent / 100))));
  
  // Convert back to hex
  return '#' + 
    ((1 << 24) + (adjustedR << 16) + (adjustedG << 8) + adjustedB)
    .toString(16).slice(1);
}

// Helper to safely get CSS color property with fallback
function getColorProperty(varName, fallback) {
  try {
    const value = documentStyle.getPropertyValue(varName);
    return value && value.trim() ? value.trim() : fallback;
  } catch (error) {
    console.warn(`Error getting color property ${varName}:`, error);
    return fallback;
  }
}

// Status colors mapping with comprehensive variants
const statusColors = {
  // Standard statuses
  'completed': getColorProperty('--green-500', '#22C55E'),
  'pending': getColorProperty('--yellow-500', '#EAB308'),
  'scheduled': getColorProperty('--blue-500', '#3B82F6'),
  // Support both spelling variants
  'cancelled': getColorProperty('--red-500', '#EF4444'),
  'canceled': getColorProperty('--red-500', '#EF4444'),
  // States with spaces and underscores
  'in progress': getColorProperty('--indigo-500', '#6366F1'),
  'in_progress': getColorProperty('--indigo-500', '#6366F1'),
  'in transit': getColorProperty('--blue-400', '#60A5FA'),
  'in_transit': getColorProperty('--blue-400', '#60A5FA'),
  'on hold': getColorProperty('--orange-500', '#F97316'),
  'on_hold': getColorProperty('--orange-500', '#F97316'),
  // Additional statuses
  'delayed': getColorProperty('--amber-500', '#F59E0B'),
  'approved': getColorProperty('--emerald-500', '#10B981')
};

const chartOptions = {
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: getColorProperty('--text-color', '#495057'),
        usePointStyle: true,
        font: {
          weight: 'normal'
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const dataset = context.dataset;
          const total = dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
  cutout: '40%',
  responsive: true,
  maintainAspectRatio: false
};

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const statusData = computed(() => {
  return props.data && props.data.length > 0 
    ? props.data 
    : dispatchStore.resultCodes;
});

const hasData = computed(() => {
  return statusData.value && statusData.value.length > 0;
});

const chartData = computed(() => {
  if (!hasData.value) return null;
  
  const labels = [];
  const data = [];
  const backgroundColors = [];
  const hoverBackgroundColors = [];
  
  statusData.value.forEach(item => {
    // Extract the correct properties based on data format
    const status = item.status || item.name || 'Unknown';
    const count = item.count || 0;
    
    if (count > 0) {
      labels.push(status);
      data.push(count);
      
      // Normalize the status key for matching
      // Try multiple variants of the status for lookup
      const statusLower = status.toLowerCase();
      const statusUnderscored = statusLower.replace(/ /g, '_');
      const statusSpaced = statusUnderscored.replace(/_/g, ' ');
      
      // Try different variants to find a matching color
      const baseColor = 
        statusColors[statusLower] || 
        statusColors[statusUnderscored] || 
        statusColors[statusSpaced] || 
        getColorProperty('--primary-color', '#6366F1');
      
      backgroundColors.push(baseColor);
      hoverBackgroundColors.push(adjustBrightness(baseColor, -10));
    }
  });
  
  return {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverBackgroundColors,
        borderColor: getColorProperty('--surface-ground', '#f8f9fa')
      }
    ]
  };
});
</script>

<style scoped>
.chart-skeleton {
  min-height: 20rem;
}
</style> 