<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  loadingKey: {
    type: String,
    default: 'financialCategories'
  }
});

// Store
const dispatchStore = useDispatchStore();

// Refs
const selectedTab = ref('revenue');
const selectedChartType = ref('bar');

// Constants
const chartTypeIcons = {
  bar: 'pi-chart-bar',
  pie: 'pi-chart-pie',
  doughnut: 'pi-chart-pie'
};

// Passthrough props for chart styling
const chartPt = {
  root: { class: 'rounded-lg overflow-hidden' }
};

// Category colors for pie/doughnut
const categoryColors = [
  '#297FB7', // Morning Blue
  '#3b82f6', // Lighter blue
  '#0B224A', // Night Sky
  '#4B5563', // Dark gray
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#FFB400', // Sunrise Yellow
  '#F97316'  // Orange
];

// Computed
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const categories = computed(() => {
  return dispatchStore.financialCategories || [];
});

const hasData = computed(() => {
  return categories.value && categories.value.length > 0;
});

const sortedCategories = computed(() => {
  if (!hasData.value) return [];
  
  const sortField = selectedTab.value === 'revenue' 
    ? 'total_revenue' 
    : (selectedTab.value === 'profit' ? 'profit' : 'margin_percentage');
  
  return [...categories.value]
    .filter(cat => cat.category) // Remove null categories
    .sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0)) // Descending
    .slice(0, 6); // Top 6 for readability
});

const totalRevenue = computed(() => {
  if (!hasData.value) return 0;
  return categories.value.reduce((sum, cat) => sum + (cat.total_revenue || 0), 0);
});

const totalProfit = computed(() => {
  if (!hasData.value) return 0;
  return categories.value.reduce((sum, cat) => sum + (cat.profit || 0), 0);
});

const overallMargin = computed(() => {
  if (!totalRevenue.value) return 0;
  return (totalProfit.value / totalRevenue.value) * 100;
});

// Create canvas for gradients
const canvasContext = ref(null);
const barGradient = ref(null);

// Function to create gradients for chart
function createGradients() {
  // Create a temporary canvas context if needed
  if (!canvasContext.value) {
    const canvas = document.createElement('canvas');
    canvasContext.value = canvas.getContext('2d');
  }
  
  // Create bar gradient
  barGradient.value = canvasContext.value.createLinearGradient(0, 0, 350, 0);
  
  if (selectedTab.value === 'revenue') {
    barGradient.value.addColorStop(0, '#297FB7'); // Morning Blue
    barGradient.value.addColorStop(1, '#3B82F6'); // Lighter blue
  } else if (selectedTab.value === 'profit') {
    barGradient.value.addColorStop(0, '#10B981'); // Green
    barGradient.value.addColorStop(1, '#059669'); // Darker green
  } else {
    barGradient.value.addColorStop(0, '#FFB400'); // Sunrise Yellow
    barGradient.value.addColorStop(1, '#F97316'); // Orange
  }
}

// Create gradients when component mounts or when tab changes
onMounted(createGradients);
watch(selectedTab, createGradients);

const chartData = computed(() => {
  if (!hasData.value) return null;
  
  // Ensure gradients are created
  if (!barGradient.value) {
    createGradients();
  }
  
  const labels = sortedCategories.value.map(cat => shortenCategoryName(cat.category));
  
  // For bar chart
  if (selectedChartType.value === 'bar') {
    const dataValue = sortedCategories.value.map(cat => {
      if (selectedTab.value === 'revenue') return cat.total_revenue || 0;
      if (selectedTab.value === 'profit') return cat.profit || 0;
      return cat.margin_percentage || 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: selectedTab.value.charAt(0).toUpperCase() + selectedTab.value.slice(1),
          backgroundColor: barGradient.value,
          barThickness: 24,
          borderRadius: 6,
          borderSkipped: false,
          data: dataValue,
          hoverBackgroundColor: selectedTab.value === 'margin' ? '#FFB400' : '#297FB7'
        }
      ]
    };
  } 
  // For pie/doughnut charts
  else {
    const dataValue = sortedCategories.value.map(cat => {
      if (selectedTab.value === 'revenue') return cat.total_revenue || 0;
      if (selectedTab.value === 'profit') return cat.profit || 0;
      return cat.margin_percentage || 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: selectedTab.value.charAt(0).toUpperCase() + selectedTab.value.slice(1),
          backgroundColor: categoryColors.slice(0, labels.length),
          hoverBackgroundColor: categoryColors.map(color => adjustBrightness(color, -15)),
          data: dataValue,
          borderWidth: 1,
          borderColor: 'white'
        }
      ]
    };
  }
});

const chartOptions = computed(() => {
  const suffix = selectedTab.value === 'margin' ? '%' : '';
  const prefix = selectedTab.value !== 'margin' ? '$' : '';
  
  // Base options for all chart types
  const baseOptions = {
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: selectedChartType.value !== 'bar',
        position: 'bottom',
        align: 'center',
        labels: {
          color: '#64748B',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(11, 34, 74, 0.95)',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            let formattedValue = selectedTab.value === 'margin'
              ? value.toFixed(1) + '%'
              : formatCurrency(value);
            
            if (selectedChartType.value !== 'bar') {
              const allData = context.dataset.data;
              const total = allData.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              return `${context.label}: ${formattedValue} (${percentage}%)`;
            }
            
            return `${label}: ${formattedValue}`;
          }
        }
      }
    }
  };
  
  // Additional options for bar chart
  if (selectedChartType.value === 'bar') {
    return {
      ...baseOptions,
      indexAxis: 'y',
      layout: {
        padding: {
          left: 0,
          right: 10,
          top: 10,
          bottom: 0
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#64748B',
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            display: false,
            drawBorder: false
          }
        },
        x: {
          beginAtZero: true,
          ticks: {
            color: '#64748B',
            font: {
              size: 11
            },
            callback: function(value) {
              if (selectedTab.value !== 'margin') {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}K`;
                } 
                return `$${value}`;
              }
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.4)',
            drawBorder: false
          }
        }
      }
    };
  }
  // Options for pie/doughnut charts
  else {
    return {
      ...baseOptions,
      cutout: selectedChartType.value === 'doughnut' ? '60%' : 0,
      radius: '90%',
      layout: {
        padding: 20
      }
    };
  }
});

// Helpers
function shortenCategoryName(name) {
  if (!name) return 'Uncategorized';
  if (name.length > 18) {
    return name.substring(0, 15) + '...';
  }
  return name;
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '$0';
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercentage(value) {
  if (value === undefined || value === null) return '0%';
  return value.toFixed(1) + '%';
}

function getTextColorClass(margin) {
  if (margin <= 0) return 'text-red-500 dark:text-red-400';
  if (margin < 15) return 'text-orange-500 dark:text-orange-400';
  if (margin < 30) return 'text-green-500 dark:text-green-400';
  return 'text-blue-500 dark:text-blue-400';
}

// Function to adjust brightness of a hex color for hover states
function adjustBrightness(hex, percent) {
  hex = hex.replace(/^\s*#|\s*$/g, '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
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
</script>

<template>
  <div class="financial-category-chart h-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex h-full w-full">
      <Skeleton height="100%" width="100%" class="rounded-md" />
    </div>
    
    <!-- No Data State -->
    <div v-else-if="!hasData" class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-md">
      <i class="pi pi-chart-bar text-3xl text-gray-400 mb-3"></i>
      <p class="m-0 text-gray-500 dark:text-gray-400 text-sm">No financial category data available</p>
    </div>
    
    <!-- Chart Content -->
    <div v-else class="h-full flex flex-col">
      <!-- Chart Type Controls -->
      <div class="chart-controls flex items-center justify-between mb-3">
        <div class="view-options flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
          <button 
            v-for="option in ['Revenue', 'Profit', 'Margin']" 
            :key="option"
            @click="selectedTab = option.toLowerCase()" 
            :class="[
              'chart-option px-3 py-1 text-xs rounded-md font-medium transition-all', 
              selectedTab === option.toLowerCase() 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            {{ option }}
          </button>
        </div>
        
        <div class="chart-type-options flex gap-1">
          <button 
            v-for="type in ['bar', 'pie', 'doughnut']" 
            :key="type"
            @click="selectedChartType = type" 
            :class="[
              'p-1.5 rounded-md text-xs transition-all', 
              selectedChartType === type 
                ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            :title="'Show as ' + type + ' chart'"
          >
            <i :class="`pi ${chartTypeIcons[type]}`"></i>
          </button>
        </div>
      </div>
      
      <!-- Chart Container -->
      <div class="chart-container flex-1 min-h-0">
        <Chart 
          :type="selectedChartType" 
          :data="chartData" 
          :options="chartOptions" 
          class="h-full w-full chart-instance" 
          :pt="chartPt"
        />
      </div>
      
      <!-- Stats Footer -->
      <div class="stats-footer mt-3 grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
        <div class="stat-item text-center p-2">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</div>
          <div class="text-base font-semibold" :class="getTextColorClass(overallMargin)">
            {{ formatCurrency(totalRevenue) }}
          </div>
        </div>
        <div class="stat-item text-center p-2">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Profit</div>
          <div class="text-base font-semibold" :class="getTextColorClass(overallMargin)">
            {{ formatCurrency(totalProfit) }}
          </div>
        </div>
        <div class="stat-item text-center p-2">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Overall Margin</div>
          <div class="text-base font-semibold" :class="getTextColorClass(overallMargin)">
            {{ formatPercentage(overallMargin) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.financial-category-chart {
  position: relative;
}

.chart-container {
  position: relative;
  transition: all 0.3s ease;
}

.chart-instance {
  transition: all 0.3s ease;
}

.chart-instance:hover {
  transform: translateY(-2px);
}

/* Animated transitions between chart types */
:deep(.p-chart) {
  animation: fadeIn 0.4s ease-out;
}

.chart-option, .chart-type-options button {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.chart-option:hover {
  transform: translateY(-1px);
}

.chart-option.active, .chart-type-options button.active {
  font-weight: 500;
}

.stats-footer {
  border: 1px solid rgba(226, 232, 240, 0.6);
}

@keyframes fadeIn {
  from { opacity: 0.6; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

/* Stat item hover effects */
.stat-item {
  transition: all 0.2s ease;
  border-radius: 0.375rem;
}

.stat-item:hover {
  background-color: rgba(243, 244, 246, 0.7);
}

@media (prefers-color-scheme: dark) {
  .stat-item:hover {
    background-color: rgba(55, 65, 81, 0.7);
  }
}
</style> 