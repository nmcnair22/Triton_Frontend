<template>
  <div class="client-revenue-chart h-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <Skeleton height="3rem" class="mb-2" />
      <Skeleton height="20rem" />
    </div>
    
    <!-- Empty State -->
    <div v-else-if="!hasData" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-bar text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No client revenue data available</p>
    </div>
    
    <!-- Data View -->
    <div v-else class="h-full flex flex-column">
      <!-- Controls -->
      <div class="controls flex justify-content-between mb-3">
        <!-- View Type Toggle -->
        <Dropdown 
          v-model="selectedView" 
          :options="viewOptions" 
          optionLabel="label" 
          optionValue="value"
          class="p-inputtext-sm" />
          
        <!-- Metric Toggle -->
        <div class="metric-selector flex p-2 bg-surface-100 dark:bg-surface-800 border-round">
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'revenue'}"
            @click="selectMetric('revenue')">
            Revenue
          </button>
          <button 
            class="btn p-2 px-3 border-none text-sm" 
            :class="{'active bg-primary text-white font-medium border-round': selectedMetric === 'margin'}"
            @click="selectMetric('margin')">
            Margin
          </button>
        </div>
      </div>
      
      <!-- Chart View -->
      <div v-if="selectedView === 'chart'" class="chart-container flex-grow-1">
        <Chart :type="chartType" :data="chartData" :options="chartOptions" class="h-full" />
      </div>
      
      <!-- Table View -->
      <div v-else class="table-container flex-grow-1">
        <DataTable 
          :value="sortedClients" 
          stripedRows 
          size="small"
          :sortField="sortField"
          :sortOrder="sortOrder"
          @sort="onSort"
          responsiveLayout="scroll"
          class="p-datatable-sm">
          
          <Column field="name" header="Client" :sortable="true">
            <template #body="slotProps">
              <div class="flex align-items-center">
                <span class="mr-2">{{ slotProps.data.name }}</span>
                <Badge v-if="slotProps.data.dispatch_count" :value="slotProps.data.dispatch_count" size="small" />
              </div>
            </template>
          </Column>
          
          <Column field="total_revenue" header="Revenue" :sortable="true">
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.total_revenue) }}
            </template>
          </Column>
          
          <Column field="profit" header="Profit" :sortable="true">
            <template #body="slotProps">
              <span :class="slotProps.data.profit < 0 ? 'text-red-500' : 'text-green-500'">
                {{ formatCurrency(slotProps.data.profit) }}
              </span>
            </template>
          </Column>
          
          <Column field="margin_percent" header="Margin" :sortable="true">
            <template #body="slotProps">
              <Tag 
                :value="formatPercentage(slotProps.data.margin_percent)" 
                :severity="getMarginSeverity(slotProps.data.margin_percent)" />
            </template>
          </Column>
        </DataTable>
      </div>
      
      <!-- Summary -->
      <div class="summary-stats mt-3 p-3 bg-surface-50 dark:bg-surface-800 border-round">
        <div class="flex flex-wrap justify-content-between gap-3">
          <div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Total Clients</div>
            <div class="text-xl font-medium">{{ clientRevenueData.length }}</div>
          </div>
          
          <div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Total Revenue</div>
            <div class="text-xl font-medium">{{ formatCurrency(totalClientRevenue) }}</div>
          </div>
          
          <div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Average Margin</div>
            <div class="flex align-items-center">
              <Tag 
                :value="formatPercentage(averageClientMargin)" 
                :severity="getMarginSeverity(averageClientMargin)"
                class="text-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Skeleton from 'primevue/skeleton';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';

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
    default: 'clientRevenueData'
  }
});

const dispatchStore = useDispatchStore();

// State
const selectedView = ref('chart'); // 'chart' or 'table'
const selectedMetric = ref('revenue'); // 'revenue' or 'margin'
const chartType = ref('bar');
const sortField = ref('total_revenue');
const sortOrder = ref(-1); // Descending

// Options
const viewOptions = [
  { label: 'Chart View', value: 'chart' },
  { label: 'Table View', value: 'table' }
];

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const clientRevenueData = computed(() => {
  return props.data && props.data.length > 0 
    ? props.data 
    : dispatchStore.clientRevenueData;
});

const hasData = computed(() => {
  return clientRevenueData.value && clientRevenueData.value.length > 0;
});

const sortedClients = computed(() => {
  if (!hasData.value) return [];
  
  return [...clientRevenueData.value]
    .sort((a, b) => {
      const fieldA = a[sortField.value] || 0;
      const fieldB = b[sortField.value] || 0;
      return (fieldA - fieldB) * sortOrder.value;
    })
    .slice(0, 10); // Top 10
});

const totalClientRevenue = computed(() => {
  if (!hasData.value) return 0;
  return clientRevenueData.value.reduce((sum, client) => sum + (client.total_revenue || 0), 0);
});

const averageClientMargin = computed(() => {
  if (!hasData.value) return 0;
  
  // Calculate weighted average (by revenue)
  const totalRevenue = totalClientRevenue.value;
  if (totalRevenue === 0) return 0;
  
  const weightedMarginSum = clientRevenueData.value.reduce((sum, client) => {
    const revenue = client.total_revenue || 0;
    const margin = client.margin_percent || 0;
    return sum + (revenue * margin);
  }, 0);
  
  return weightedMarginSum / totalRevenue;
});

const chartData = computed(() => {
  if (!hasData.value) return null;
  
  // Get top 10 clients by selected metric
  const clients = sortedClients.value;
  
  if (selectedMetric.value === 'revenue') {
    return {
      labels: clients.map(client => client.name),
      datasets: [
        {
          label: 'Revenue',
          backgroundColor: '#3B82F6', // blue-500
          data: clients.map(client => client.total_revenue),
          borderRadius: 4
        }
      ]
    };
  } else { // margin
    return {
      labels: clients.map(client => client.name),
      datasets: [
        {
          label: 'Margin %',
          backgroundColor: clients.map(client => getMarginColor(client.margin_percent)),
          data: clients.map(client => client.margin_percent),
          borderRadius: 4
        }
      ]
    };
  }
});

const chartOptions = computed(() => {
  const baseOptions = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw || 0;
            
            if (selectedMetric.value === 'margin') {
              return `Margin: ${formatPercentage(value)}`;
            } else {
              return `Revenue: ${formatCurrency(value)}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'var(--surface-border)',
          drawBorder: false
        },
        ticks: {
          color: 'var(--text-color-secondary)',
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
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-color-secondary)'
        }
      }
    }
  };
  
  return baseOptions;
});

// Helper functions
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatPercentage(value) {
  return `${(value || 0).toFixed(1)}%`;
}

function getMarginColor(margin) {
  if (!margin || margin < 0) return '#EF4444'; // red-500
  if (margin < 20) return '#F97316'; // orange-500
  if (margin < 40) return '#FBBF24'; // amber-400
  if (margin < 60) return '#A3E635'; // lime-400
  return '#22C55E'; // green-500
}

function getMarginSeverity(margin) {
  if (!margin || margin < 0) return 'danger';
  if (margin < 20) return 'warning';
  if (margin < 40) return 'warning';
  if (margin < 60) return 'success';
  return 'success';
}

function selectMetric(metric) {
  selectedMetric.value = metric;
  
  if (metric === 'revenue') {
    sortField.value = 'total_revenue';
  } else {
    sortField.value = 'margin_percent';
  }
}

function onSort(event) {
  sortField.value = event.field;
  sortOrder.value = event.order;
}
</script>

<style scoped>
.chart-container, .table-container {
  min-height: 300px;
  height: 100%;
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