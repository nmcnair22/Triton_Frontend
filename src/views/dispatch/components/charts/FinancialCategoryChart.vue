<script setup>
import { ref, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';

const props = defineProps({
  loadingKey: {
    type: String,
    default: 'financialCategories'
  }
});

// Store
const dispatchStore = useDispatchStore();

// Data handling
const selectedView = ref('chart'); // Options: 'chart', 'table'
const selectedMetric = ref('revenue'); // Options: 'revenue', 'profit', 'margin'
const sortField = ref('total_revenue');
const sortOrder = ref(-1); // Descending

// View options
const viewOptions = [
  { label: 'Chart View', value: 'chart' },
  { label: 'Table View', value: 'table' }
];

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const categories = computed(() => {
  return dispatchStore.financialCategories || [];
});

const sortedCategories = computed(() => {
  if (!categories.value || categories.value.length === 0) return [];
  
  return [...categories.value]
    .filter(cat => cat.category) // Remove null categories
    .sort((a, b) => {
      const fieldA = a[sortField.value] || 0;
      const fieldB = b[sortField.value] || 0;
      return (fieldA - fieldB) * sortOrder.value;
    })
    .slice(0, 10); // Top 10
});

const chartData = computed(() => {
  if (!sortedCategories.value || sortedCategories.value.length === 0) return null;
  
  // For revenue and profit, show stacked bars (cost + profit = revenue)
  if (selectedMetric.value === 'revenue' || selectedMetric.value === 'profit') {
    return {
      labels: sortedCategories.value.map(cat => shortenCategoryName(cat.category)),
      datasets: [
        {
          label: 'Profit',
          backgroundColor: '#22C55E', // green-500
          data: sortedCategories.value.map(cat => cat.profit)
        },
        {
          label: 'Cost',
          backgroundColor: '#3B82F6', // blue-500
          data: sortedCategories.value.map(cat => cat.total_cost)
        }
      ]
    };
  } 
  // For margin, show simple bars of margin percentages
  else {
    return {
      labels: sortedCategories.value.map(cat => shortenCategoryName(cat.category)),
      datasets: [
        {
          label: 'Margin %',
          backgroundColor: sortedCategories.value.map(cat => getMarginColor(cat.margin_percentage)),
          data: sortedCategories.value.map(cat => cat.margin_percentage)
        }
      ]
    };
  }
});

const chartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.raw || 0;
            
            if (selectedMetric.value === 'margin') {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            } else {
              return `${datasetLabel}: $${value.toLocaleString()}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (selectedMetric.value === 'margin') {
              return `${value}%`;
            } else {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
              } else {
                return `$${value}`;
              }
            }
          }
        }
      }
    }
  };
  
  // Add stacked options for revenue and profit view
  if (selectedMetric.value === 'revenue' || selectedMetric.value === 'profit') {
    baseOptions.scales.x.stacked = true;
    baseOptions.scales.y = {
      stacked: true
    };
  }
  
  return baseOptions;
});

// Helper functions
function shortenCategoryName(category) {
  // Shorten long category names for better display
  if (category && category.length > 20) {
    return category.substring(0, 17) + '...';
  }
  return category || 'Uncategorized';
}

function formatCurrency(value) {
  return '$' + (value || 0).toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}

function formatPercentage(value) {
  return (value || 0).toFixed(1) + '%';
}

function getMarginColor(margin) {
  if (!margin || margin < 0) return 'danger';
  if (margin < 20) return 'warning';
  if (margin < 40) return 'warning';
  if (margin < 60) return 'success';
  return 'success';
}

function getMarginSeverity(margin) {
  if (!margin || margin < 0) return 'danger';
  if (margin < 20) return 'warning';
  if (margin < 40) return 'warning';
  if (margin < 60) return 'success';
  return 'success';
}

function changeMetric(metric) {
  selectedMetric.value = metric;
  
  switch (metric) {
    case 'revenue':
      sortField.value = 'total_revenue';
      break;
    case 'profit':
      sortField.value = 'profit';
      break;
    case 'margin':
      sortField.value = 'margin_percentage';
      break;
  }
}

function onSort(event) {
  sortField.value = event.field;
  sortOrder.value = event.order;
}
</script>

<template>
  <div class="financial-category-chart h-full">
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <div v-for="i in 3" :key="i" class="w-full">
        <Skeleton height="6rem" />
      </div>
    </div>
    
    <div v-else-if="!categories || categories.length === 0" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-bar text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No financial category data available</p>
    </div>
    
    <div v-else class="h-full flex flex-column">
      <!-- Controls -->
      <div class="controls flex justify-content-between mb-3">
        <!-- Metric Selector -->
        <div class="metric-selector flex p-2 bg-surface-100 dark:bg-surface-800 border-round">
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'revenue'}"
            @click="changeMetric('revenue')">
            Revenue
          </button>
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'profit'}"
            @click="changeMetric('profit')">
            Profit
          </button>
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'margin'}"
            @click="changeMetric('margin')">
            Margin %
          </button>
        </div>
        
        <!-- View Selector -->
        <Dropdown 
          v-model="selectedView" 
          :options="viewOptions" 
          optionLabel="label" 
          optionValue="value"
          class="p-inputtext-sm" />
      </div>
      
      <!-- Chart View -->
      <div v-if="selectedView === 'chart'" class="chart-container flex-grow-1 h-20rem">
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>
      
      <!-- Table View -->
      <div v-else class="table-container flex-grow-1">
        <DataTable 
          :value="sortedCategories" 
          stripedRows 
          size="small"
          :sortField="sortField"
          :sortOrder="sortOrder"
          @sort="onSort"
          class="p-datatable-sm">
          
          <Column field="category" header="Category" sortable>
            <template #body="slotProps">
              {{ shortenCategoryName(slotProps.data.category) }}
            </template>
          </Column>
          
          <Column field="total_revenue" header="Revenue" sortable>
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.total_revenue) }}
            </template>
          </Column>
          
          <Column field="total_cost" header="Cost" sortable>
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.total_cost) }}
            </template>
          </Column>
          
          <Column field="profit" header="Profit" sortable>
            <template #body="slotProps">
              <span :class="slotProps.data.profit < 0 ? 'text-red-500' : 'text-green-500'">
                {{ formatCurrency(slotProps.data.profit) }}
              </span>
            </template>
          </Column>
          
          <Column field="margin_percentage" header="Margin %" sortable>
            <template #body="slotProps">
              <Tag 
                :value="formatPercentage(slotProps.data.margin_percentage)"
                :severity="getMarginSeverity(slotProps.data.margin_percentage)" />
            </template>
          </Column>
        </DataTable>
      </div>
      
      <!-- Summary Stats -->
      <div class="summary-stats mt-3 p-3 bg-surface-50 dark:bg-surface-800 border-round text-sm flex justify-content-between">
        <div>
          <span class="font-medium">Total Revenue:</span> 
          <span>{{ formatCurrency(dispatchStore.totalRevenue) }}</span>
        </div>
        <div>
          <span class="font-medium">Overall Margin:</span> 
          <Tag 
            :value="formatPercentage(dispatchStore.averageMargin)"
            :severity="getMarginSeverity(dispatchStore.averageMargin)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container, .table-container {
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.btn {
  cursor: pointer;
  transition: all 0.2s;
}

.btn:not(.active) {
  background: transparent;
  color: var(--text-color);
}

.btn:not(.active):hover {
  background: var(--surface-200);
}

.active {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style> 