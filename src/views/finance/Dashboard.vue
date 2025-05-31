<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';

const financeStore = useFinanceStore();
const toast = useToast();

// Computed properties from store
const isLoading = computed(() => financeStore.isLoading);
const dashboardStats = computed(() => financeStore.dashboardStats);

// Computed metrics
const totalRevenue = computed(() => financeStore.totalRevenue);
const totalReceivables = computed(() => financeStore.totalReceivables);
const totalPayables = computed(() => financeStore.totalPayables);
const netIncome = computed(() => financeStore.netIncome);

// Local state for UI
const refreshing = ref(false);

// Loading states for individual sections
const loadingInvoicing = ref(false);
const loadingReceivables = ref(false);
const loadingPayables = ref(false);

// Formatted currency values
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
};

// Load dashboard data
async function loadDashboardData() {
  try {
    // Use the new optimized summary endpoint
    await financeStore.fetchDashboardStats();
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Dashboard data loaded successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dashboard data. Please try again.',
      life: 5000
    });
  }
}

// Refresh dashboard data
async function refreshDashboard() {
  refreshing.value = true;
  try {
    await financeStore.fetchDashboardStats();
    
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Dashboard data has been refreshed',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to refresh dashboard:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh dashboard data',
      life: 5000
    });
  } finally {
    refreshing.value = false;
  }
}

// Export data
async function exportData() {
  try {
    await financeStore.exportInvoices();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Data exported successfully',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: error.message || 'Failed to export data',
      life: 5000
    });
  }
}

function refreshData() {
  loadDashboardData();
}

// Initialize data on component mount
onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div class="finance-dashboard">
    <Toast />
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h1 class="font-semibold text-3xl text-surface-900 dark:text-surface-0 mb-2">Finance Dashboard</h1>
        <p class="text-surface-600 dark:text-surface-400">Overview of your financial metrics and key performance indicators</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          label="Refresh" 
          icon="pi pi-refresh" 
          :loading="refreshing"
          @click="refreshDashboard"
          outlined
        />
        <Button 
          label="Export Data" 
          icon="pi pi-download" 
          @click="exportData"
        />
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Revenue -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Revenue</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="8rem" height="2rem" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ formatCurrency(totalRevenue) }}
              </div>
              <div class="text-green-500 text-sm font-medium">
                <i class="pi pi-chart-line mr-1"></i>
                From optimized endpoints
              </div>
            </div>
            <div class="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3">
              <i class="pi pi-dollar text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Total Receivables -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Receivables</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="8rem" height="2rem" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ formatCurrency(totalReceivables) }}
              </div>
              <div class="text-green-500 text-sm font-medium">
                <i class="pi pi-check-circle mr-1"></i>
                Live data available
              </div>
            </div>
            <div class="bg-orange-100 dark:bg-orange-900/20 rounded-full p-3">
              <i class="pi pi-arrow-down text-orange-600 dark:text-orange-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Total Payables -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Payables</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="8rem" height="2rem" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ formatCurrency(totalPayables) }}
              </div>
              <div class="text-green-500 text-sm font-medium">
                <i class="pi pi-check-circle mr-1"></i>
                Live data available
              </div>
            </div>
            <div class="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
              <i class="pi pi-arrow-up text-red-600 dark:text-red-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Net Income -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Net Income</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="8rem" height="2rem" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ formatCurrency(netIncome) }}
              </div>
              <div class="text-green-500 text-sm font-medium">
                <i class="pi pi-chart-line mr-1"></i>
                Revenue only
              </div>
            </div>
            <div class="bg-green-100 dark:bg-green-900/20 rounded-full p-3">
              <i class="pi pi-chart-line text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Detailed Statistics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Invoicing Statistics -->
      <Card class="shadow-sm">
        <template #header>
          <div class="p-6 pb-0">
            <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Invoicing</h3>
            <p class="text-surface-600 dark:text-surface-400 text-sm">Sales invoice data from optimized endpoints</p>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Total Invoiced</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ formatCurrency(dashboardStats.invoicing.totalInvoiced) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Outstanding Amount</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-orange-600">
                {{ formatCurrency(dashboardStats.invoicing.outstandingAmount) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Total Invoices</span>
              <span v-if="isLoading"><Skeleton width="3rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ dashboardStats.invoicing.invoiceCount || 0 }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Overdue Invoices</span>
              <span v-if="isLoading"><Skeleton width="3rem" height="1rem" /></span>
              <span v-else class="font-semibold text-red-600">
                {{ dashboardStats.invoicing.overdueCount || 0 }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Average Invoice</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ formatCurrency(dashboardStats.invoicing.averageInvoice) }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Receivables Statistics -->
      <Card class="shadow-sm">
        <template #header>
          <div class="p-6 pb-0">
            <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Receivables</h3>
            <p class="text-surface-600 dark:text-surface-400 text-sm">Customer payment data from optimized endpoints</p>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Total Receivables</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ formatCurrency(dashboardStats.receivables.totalReceivables) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Customer Count</span>
              <span v-if="isLoading"><Skeleton width="3rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ dashboardStats.receivables.customerCount || 0 }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Monthly Payments</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-green-600">
                {{ formatCurrency(dashboardStats.receivables.monthlyPayments) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Payment Count</span>
              <span v-if="isLoading"><Skeleton width="3rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ dashboardStats.receivables.paymentCount || 0 }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Payables Statistics -->
      <Card class="shadow-sm">
        <template #header>
          <div class="p-6 pb-0">
            <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Payables</h3>
            <p class="text-surface-600 dark:text-surface-400 text-sm">Vendor payment data from optimized endpoints</p>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Total Outstanding</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ formatCurrency(dashboardStats.payables.totalOutstanding) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Vendor Count</span>
              <span v-if="isLoading"><Skeleton width="3rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ dashboardStats.payables.vendorCount || 0 }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Monthly Payments</span>
              <span v-if="isLoading"><Skeleton width="5rem" height="1rem" /></span>
              <span v-else class="font-semibold text-red-600">
                {{ formatCurrency(dashboardStats.payables.monthlyPayments) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-surface-600 dark:text-surface-400">Payment Count</span>
              <span v-if="isLoading"><Skeleton width="3rem" height="1rem" /></span>
              <span v-else class="font-semibold text-surface-900 dark:text-surface-0">
                {{ dashboardStats.payables.paymentCount || 0 }}
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Cash Management Section -->
    <div class="mt-6">
      <Card class="shadow-sm">
        <template #header>
          <div class="p-6 pb-0">
            <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Cash Management</h3>
            <p class="text-surface-600 dark:text-surface-400 text-sm">Bank accounts and cash flow from optimized endpoints</p>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Bank Accounts</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="3rem" height="2rem" class="mx-auto" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ dashboardStats.cashManagement.accountCount || 0 }}
              </div>
              <div class="text-blue-500 text-sm font-medium">
                <i class="pi pi-building mr-1"></i>
                Active accounts
              </div>
            </div>
            
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Net Cash Flow</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="8rem" height="2rem" class="mx-auto" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ formatCurrency(dashboardStats.cashManagement.netCashFlow) }}
              </div>
              <div class="text-green-500 text-sm font-medium">
                <i class="pi pi-arrow-up mr-1"></i>
                Current period
              </div>
            </div>
            
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Transactions</div>
              <div v-if="isLoading" class="mb-2">
                <Skeleton width="4rem" height="2rem" class="mx-auto" />
              </div>
              <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ dashboardStats.cashManagement.transactionCount || 0 }}
              </div>
              <div class="text-purple-500 text-sm font-medium">
                <i class="pi pi-list mr-1"></i>
                Total transactions
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="shadow-sm mt-6">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Quick Actions</h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm">Available financial operations</p>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            label="Create Invoice" 
            icon="pi pi-plus" 
            class="w-full"
            @click="$router.push('/finance/invoicing')"
          />
          <Button 
            label="View Invoices" 
            icon="pi pi-file" 
            class="w-full"
            outlined
            @click="$router.push('/finance/invoicing')"
          />
          <Button 
            label="Receivables" 
            icon="pi pi-arrow-down" 
            class="w-full"
            outlined
            disabled
            @click="$router.push('/finance/receivables')"
            v-tooltip="'Receivables API not yet implemented'"
          />
          <Button 
            label="Payables" 
            icon="pi pi-arrow-up" 
            class="w-full"
            outlined
            disabled
            @click="$router.push('/finance/payables')"
            v-tooltip="'Payables API not yet implemented'"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.finance-dashboard {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .finance-dashboard {
    padding: 1rem;
  }
}
</style> 