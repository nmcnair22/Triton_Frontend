<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { FilterMatchMode } from '@primevue/core/api';

// Router for navigation
const router = useRouter();

// Mock data for Accounts Payable Dashboard
const apData = ref({
  // AP Aging Data
  aging: {
    labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [178000, 92300, 27500, 12200, 2000],
        backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24', '#f97316', '#ef4444'],
        borderWidth: 0
      }
    ]
  },
  
  // KPI Data
  dpo: {
    value: 28.3,
    change: 1.2,
    target: 30,
    trend: [26.5, 27.1, 27.5, 28.0, 28.3]
  },
  totalApBalance: {
    value: '$312,000',
    change: 2.5,
    rawValue: 312000,
    trend: [298000, 305000, 310000, 308000, 312000]
  },
  discountCaptureRate: {
    value: '87.5%',
    change: 3.2,
    trend: [83.1, 84.5, 85.0, 86.2, 87.5]
  },
  
  // Top Payables List
  topPayables: [
    { id: 1, vendor: 'ABC Supplies', balance: 47500, dueDate: '2023-11-15', status: 'Upcoming', days: 12 },
    { id: 2, vendor: 'XYZ Manufacturing', balance: 38200, dueDate: '2023-11-05', status: 'Upcoming', days: 2 },
    { id: 3, vendor: 'Global Logistics', balance: 35600, dueDate: '2023-11-20', status: 'Upcoming', days: 17 },
    { id: 4, vendor: 'City Power & Utilities', balance: 31200, dueDate: '2023-10-30', status: 'Overdue', days: -3 },
    { id: 5, vendor: 'Metro Office Supplies', balance: 28400, dueDate: '2023-11-12', status: 'Upcoming', days: 9 },
    { id: 6, vendor: 'TechEquip Inc.', balance: 25900, dueDate: '2023-11-08', status: 'Upcoming', days: 5 },
    { id: 7, vendor: 'Integrated Systems', balance: 22300, dueDate: '2023-10-25', status: 'Overdue', days: -8 },
    { id: 8, vendor: 'Western Materials', balance: 19800, dueDate: '2023-12-05', status: 'Upcoming', days: 32 },
    { id: 9, vendor: 'Premier Shipping', balance: 17500, dueDate: '2023-11-10', status: 'Upcoming', days: 7 },
    { id: 10, vendor: 'Delta Services', balance: 15600, dueDate: '2023-11-18', status: 'Upcoming', days: 15 }
  ]
});

// Chart options for the AP Aging chart
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

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Calculate total AP and percent in each bucket
const agingTotals = computed(() => {
  const total = apData.value.aging.datasets[0].data.reduce((a, b) => a + b, 0);
  const percentages = apData.value.aging.datasets[0].data.map(value => 
    ((value / total) * 100).toFixed(1) + '%'
  );
  
  return {
    total: formatCurrency(total),
    percentages
  };
});

// Get status severity for tag color
const getStatusSeverity = (status) => {
  if (status === 'Paid') return 'success';
  if (status === 'Upcoming') return 'info';
  if (status === 'Overdue') return 'danger';
  return 'secondary';
};

// Get due date class 
const getDueDateClass = (days) => {
  if (days < 0) return 'text-red-500 font-medium'; // Overdue
  if (days <= 5) return 'text-orange-500'; // Due soon
  return 'text-green-600'; // Not due soon
};

// Function to navigate to vendor profile
const viewVendorProfile = (vendor) => {
  // Using a dummy ID 'VENDOR001' since we're working with mock data
  // In a real app, this would use vendor.id
  router.push(`/finance/vendor/VENDOR001`);
};

// Calculate days remaining or overdue
const calculateDaysStatus = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `Due in ${diffDays} days`;
  }
};
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Accounts Payable</h1>
      <p class="text-gray-600">Manage and track payments to vendors and suppliers</p>
    </div>
    
    <!-- KPI Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- Days Payable Outstanding (DPO) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Days Payable Outstanding</h3>
            <div class="text-2xl font-bold mt-1">{{ apData.dpo.value }} days</div>
            <div class="flex items-center mt-1">
              <!-- For DPO, higher is better from a cash flow perspective -->
              <i :class="getTrendIcon(apData.dpo.change) + ' mr-1 text-sm ' + getTrendColor(apData.dpo.change)"></i>
              <span :class="getTrendColor(apData.dpo.change)">{{ formatChange(apData.dpo.change) }} days</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded">
            Target: {{ apData.dpo.target }} days
          </div>
        </div>
      </div>
      
      <!-- Total AP Balance -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total AP Balance</h3>
            <div class="text-2xl font-bold mt-1">{{ apData.totalApBalance.value }}</div>
            <div class="flex items-center mt-1">
              <!-- For AP Balance, lower is better for liabilities, but showing as is -->
              <i :class="getTrendIcon(apData.totalApBalance.change, false) + ' mr-1 text-sm ' + getTrendColor(apData.totalApBalance.change, false)"></i>
              <span :class="getTrendColor(apData.totalApBalance.change, false)">{{ formatChange(apData.totalApBalance.change) }}%</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded">
            {{ apData.aging.labels.length }} aging buckets
          </div>
        </div>
      </div>
      
      <!-- Discount Capture Rate -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Discount Capture Rate</h3>
            <div class="text-2xl font-bold mt-1">{{ apData.discountCaptureRate.value }}</div>
            <div class="flex items-center mt-1">
              <!-- For Discount Capture, higher is better -->
              <i :class="getTrendIcon(apData.discountCaptureRate.change) + ' mr-1 text-sm ' + getTrendColor(apData.discountCaptureRate.change)"></i>
              <span :class="getTrendColor(apData.discountCaptureRate.change)">{{ formatChange(apData.discountCaptureRate.change) }}%</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Industry avg: 78.2%
          </div>
        </div>
      </div>
    </div>
    
    <!-- AP Aging Chart and Top Payables Row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <!-- AP Aging Chart -->
      <div class="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">AP Aging Summary</h3>
          <div class="text-sm font-medium">Total: {{ agingTotals.total }}</div>
        </div>
        
        <div class="h-72">
          <Chart type="bar" :data="apData.aging" :options="barChartOptions" class="h-full" />
        </div>
        
        <!-- Percentage Breakdown -->
        <div class="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div v-for="(percentage, i) in agingTotals.percentages" :key="i" class="text-center">
            <div class="font-medium">{{ percentage }}</div>
            <div>{{ apData.aging.labels[i] }}</div>
          </div>
        </div>
      </div>
      
      <!-- Top Payables List -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium">Top Payables</h3>
        </div>
        
        <div class="p-2">
          <div class="flex justify-between mb-3">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText v-model="globalFilterValue" placeholder="Search vendors..." class="w-full p-2 text-sm" @input="onGlobalFilterChange" />
            </span>
          </div>
          
          <DataTable 
            :value="apData.topPayables" 
            :filters="filters"
            :paginator="true" 
            :rows="5"
            :rowsPerPageOptions="[5, 10, 20]"
            stripedRows 
            class="p-datatable-sm" 
            responsiveLayout="scroll"
            dataKey="id"
          >
            <Column field="vendor" header="Vendor" sortable style="min-width: 200px">
              <template #body="{ data }">
                <a href="#" 
                   @click.prevent="viewVendorProfile(data)"
                   class="text-blue-600 hover:text-blue-800 hover:underline">
                  {{ data.vendor }}
                </a>
              </template>
            </Column>
            <Column field="balance" header="Balance" sortable>
              <template #body="{ data }">
                {{ formatCurrency(data.balance) }}
              </template>
            </Column>
            <Column field="dueDate" header="Due Date" sortable>
              <template #body="{ data }">
                <div>
                  <div>{{ formatDate(data.dueDate) }}</div>
                  <div :class="getDueDateClass(data.days)" class="text-xs">
                    {{ calculateDaysStatus(data.dueDate) }}
                  </div>
                </div>
              </template>
            </Column>
            <Column field="status" header="Status" sortable>
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column style="width: 4rem">
              <template #body="{ data }">
                <Button icon="pi pi-external-link" text rounded @click="viewVendorProfile(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <Button label="Schedule Payments" icon="pi pi-calendar" outlined />
      <Button label="Pay Selected" icon="pi pi-check" />
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