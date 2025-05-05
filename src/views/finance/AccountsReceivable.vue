<script setup>
import { ref, onMounted, computed } from 'vue';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { FilterMatchMode } from '@primevue/core/api';
import { useRouter } from 'vue-router';

// Mock data for Accounts Receivable Dashboard
const arData = ref({
  // AR Aging Data
  aging: {
    labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [245000, 128500, 87500, 52300, 41200],
        backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24', '#f97316', '#ef4444'],
        borderWidth: 0
      }
    ]
  },
  
  // KPI Data
  dso: {
    value: 38.5,
    change: -2.3,
    target: 40,
    trend: [42, 41.2, 40.8, 39.5, 38.5]
  },
  totalArBalance: {
    value: '$554,500',
    change: -1.2,
    rawValue: 554500,
    trend: [562000, 558000, 570000, 561000, 554500]
  },
  arTurnover: {
    value: 9.6,
    change: 0.3,
    trend: [9.1, 9.2, 9.3, 9.5, 9.6]
  },
  badDebtRatio: {
    value: '1.8%',
    change: -0.4,
    trend: [2.3, 2.2, 2.0, 1.9, 1.8]
  },
  
  // Top Debtors List
  topDebtors: [
    { id: 1, customer: 'Acme Corporation', balance: 78500, daysOverdue: 12, risk: 'Low' },
    { id: 2, customer: 'GlobalTech Industries', balance: 65200, daysOverdue: 45, risk: 'Medium' },
    { id: 3, customer: 'Zenith Solutions', balance: 58900, daysOverdue: 5, risk: 'Low' },
    { id: 4, customer: 'Pinnacle Systems', balance: 47300, daysOverdue: 72, risk: 'High' },
    { id: 5, customer: 'Horizon Enterprises', balance: 42800, daysOverdue: 8, risk: 'Low' },
    { id: 6, customer: 'Quantum Dynamics', balance: 39600, daysOverdue: 22, risk: 'Medium' },
    { id: 7, customer: 'Stellar Networks', balance: 37900, daysOverdue: 58, risk: 'Medium' },
    { id: 8, customer: 'Atlas Manufacturing', balance: 32100, daysOverdue: 92, risk: 'High' },
    { id: 9, customer: 'Nova Technologies', balance: 28700, daysOverdue: 15, risk: 'Low' },
    { id: 10, customer: 'Apex Solutions', balance: 25800, daysOverdue: 31, risk: 'Medium' }
  ]
});

// Add router instance
const router = useRouter();

// Function to navigate to customer profile
const viewCustomerProfile = (customer) => {
  // Using a dummy ID 'ACME001' since we're working with mock data
  // In a real app, this would use customer.id
  router.push(`/finance/customer/ACME001`);
};

// Chart options for the AR Aging chart
const barChartOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
          }).format(context.raw);
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '$' + (value/1000) + 'k';
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Table filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const globalFilterValue = ref('');

// Update global filter value
const onGlobalFilterChange = (e) => {
  const value = e.target.value;
  filters.value.global.value = value;
  globalFilterValue.value = value;
};

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

// Helper function to format change values with appropriate prefix
const formatChange = (value) => {
  return value >= 0 ? `+${value}` : `${value}`;
};

// Helper function to determine the trend color based on value and whether higher is better
const getTrendColor = (value, higherIsBetter = true) => {
  if (value === 0) return 'text-gray-500';
  return (value > 0 && higherIsBetter) || (value < 0 && !higherIsBetter) 
    ? 'text-green-500' 
    : 'text-red-500';
};

// Helper function to determine the trend icon based on value
const getTrendIcon = (value, higherIsBetter = true) => {
  if (value === 0) return 'pi pi-minus';
  return (value > 0 && higherIsBetter) || (value < 0 && !higherIsBetter) 
    ? 'pi pi-arrow-up' 
    : 'pi pi-arrow-down';
};

// Calculate total AR and percent in each bucket
const agingTotals = computed(() => {
  const total = arData.value.aging.datasets[0].data.reduce((a, b) => a + b, 0);
  const percentages = arData.value.aging.datasets[0].data.map(value => 
    ((value / total) * 100).toFixed(1) + '%'
  );
  
  return {
    total: formatCurrency(total),
    percentages
  };
});

// Risk indicator component
const riskIndicator = (risk) => {
  let colorClass = 'bg-green-500';
  if (risk === 'Medium') colorClass = 'bg-yellow-500';
  if (risk === 'High') colorClass = 'bg-red-500';
  return `<span class="inline-block w-3 h-3 rounded-full ${colorClass} mr-2"></span>${risk}`;
};

// Get severity class based on days overdue
const getOverdueSeverity = (days) => {
  if (days <= 15) return 'text-green-600';
  if (days <= 45) return 'text-yellow-600';
  return 'text-red-600 font-medium';
};
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Accounts Receivable</h1>
      <p class="text-gray-600">Track, analyze, and manage outstanding customer payments</p>
    </div>
    
    <!-- KPI Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Days Sales Outstanding (DSO) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Days Sales Outstanding</h3>
            <div class="text-2xl font-bold mt-1">{{ arData.dso.value }} days</div>
            <div class="flex items-center mt-1">
              <!-- For DSO, lower is better, so negative change is good -->
              <i :class="getTrendIcon(arData.dso.change, false) + ' mr-1 text-sm ' + getTrendColor(arData.dso.change, false)"></i>
              <span :class="getTrendColor(arData.dso.change, false)">{{ formatChange(arData.dso.change) }} days</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded">
            Target: {{ arData.dso.target }} days
          </div>
        </div>
      </div>
      
      <!-- Total AR Balance -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total AR Balance</h3>
            <div class="text-2xl font-bold mt-1">{{ arData.totalArBalance.value }}</div>
            <div class="flex items-center mt-1">
              <!-- For AR Balance, lower is better -->
              <i :class="getTrendIcon(arData.totalArBalance.change, false) + ' mr-1 text-sm ' + getTrendColor(arData.totalArBalance.change, false)"></i>
              <span :class="getTrendColor(arData.totalArBalance.change, false)">{{ formatChange(arData.totalArBalance.change) }}%</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded">
            {{ arData.aging.labels.length }} aging buckets
          </div>
        </div>
      </div>
      
      <!-- AR Turnover -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">AR Turnover Ratio</h3>
            <div class="text-2xl font-bold mt-1">{{ arData.arTurnover.value }}x</div>
            <div class="flex items-center mt-1">
              <!-- For AR Turnover, higher is better -->
              <i :class="getTrendIcon(arData.arTurnover.change) + ' mr-1 text-sm ' + getTrendColor(arData.arTurnover.change)"></i>
              <span :class="getTrendColor(arData.arTurnover.change)">{{ formatChange(arData.arTurnover.change) }}x</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Annual measurement
          </div>
        </div>
      </div>
      
      <!-- Bad Debt Ratio -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Bad Debt Ratio</h3>
            <div class="text-2xl font-bold mt-1">{{ arData.badDebtRatio.value }}</div>
            <div class="flex items-center mt-1">
              <!-- For Bad Debt Ratio, lower is better -->
              <i :class="getTrendIcon(arData.badDebtRatio.change, false) + ' mr-1 text-sm ' + getTrendColor(arData.badDebtRatio.change, false)"></i>
              <span :class="getTrendColor(arData.badDebtRatio.change, false)">{{ formatChange(arData.badDebtRatio.change) }}%</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Industry avg: 2.1%
          </div>
        </div>
      </div>
    </div>
    
    <!-- AR Aging Chart and Top Debtors Row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <!-- AR Aging Chart -->
      <div class="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">AR Aging Summary</h3>
          <div class="text-sm font-medium">Total: {{ agingTotals.total }}</div>
        </div>
        
        <div class="h-72">
          <Chart type="bar" :data="arData.aging" :options="barChartOptions" class="h-full" />
        </div>
        
        <!-- Percentage Breakdown -->
        <div class="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div v-for="(percentage, i) in agingTotals.percentages" :key="i" class="text-center">
            <div class="font-medium">{{ percentage }}</div>
            <div>{{ arData.aging.labels[i] }}</div>
          </div>
        </div>
      </div>
      
      <!-- Top Debtors List -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium">Top Debtors</h3>
        </div>
        
        <div class="p-2">
          <div class="flex justify-between mb-3">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText v-model="globalFilterValue" placeholder="Search customers..." class="w-full p-2 text-sm" @input="onGlobalFilterChange" />
            </span>
          </div>
          
          <DataTable 
            :value="arData.topDebtors" 
            :filters="filters"
            :paginator="true" 
            :rows="5"
            :rowsPerPageOptions="[5, 10, 20]"
            stripedRows 
            class="p-datatable-sm" 
            responsiveLayout="scroll"
            dataKey="id"
          >
            <Column field="customer" header="Customer" sortable style="min-width: 200px">
              <template #body="{ data }">
                <a href="#" 
                   @click.prevent="viewCustomerProfile(data)"
                   class="text-blue-600 hover:text-blue-800 hover:underline">
                  {{ data.customer }}
                </a>
              </template>
            </Column>
            <Column field="balance" header="Balance" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.balance) }}
              </template>
            </Column>
            <Column field="daysOverdue" header="Days Overdue" sortable>
              <template #body="{ data }">
                <span :class="getOverdueSeverity(data.daysOverdue)">{{ data.daysOverdue }}</span>
              </template>
            </Column>
            <Column field="risk" header="Risk" sortable>
              <template #body="{ data }">
                <span v-html="riskIndicator(data.risk)"></span>
              </template>
            </Column>
            <Column style="width: 4rem">
              <template #body="{ data }">
                <Button icon="pi pi-external-link" text rounded @click="viewCustomerProfile(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <Button label="Export Report" icon="pi pi-file-export" outlined />
      <Button label="Send Reminders" icon="pi pi-envelope" />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background-color: #1f2937;
  color: #e5e7eb;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

:deep(.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #1f2937;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr) {
  background-color: #111827;
  color: #e5e7eb;
}

:deep(.p-button.p-button-text) {
  color: #6b7280;
}

:deep(.dark .p-button.p-button-text) {
  color: #9ca3af;
}
</style> 