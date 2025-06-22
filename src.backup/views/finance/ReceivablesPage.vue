<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from 'primevue/usetoast';
import { useDateFormatting } from '@/composables/useDateFormatting';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Skeleton from 'primevue/skeleton';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

const financeStore = useFinanceStore();
const toast = useToast();

// Date formatting composable
const { safeDate, formatDateTime, isEpochDate } = useDateFormatting();

// Local state
const searchTerm = ref('');
const selectedStatus = ref('all');
const expandedRows = ref([]);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  customer_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

// Computed properties from store
const isLoading = computed(() => financeStore.isLoading);
const receivables = computed(() => financeStore.receivables || []);
const customerBalances = computed(() => financeStore.dashboardStats?.receivables || {});

// Summary calculations with safety checks
const totalReceivables = computed(() => {
  const balances = customerBalances.value;
  return balances.totalReceivables || 0;
});

const customerCount = computed(() => {
  const balances = customerBalances.value;
  return balances.customerCount || 0;
});

const monthlyPayments = computed(() => {
  const balances = customerBalances.value;
  return balances.monthlyPayments || 0;
});

const overdueReceivables = computed(() => {
  if (!Array.isArray(receivables.value)) return [];
  return receivables.value.filter(receivable => {
    if (!receivable.due_date) return false;
    const dueDate = new Date(receivable.due_date);
    const today = new Date();
    return dueDate < today && receivable.status !== 'paid';
  });
});

const overdueAmount = computed(() => {
  return overdueReceivables.value.reduce((sum, receivable) => {
    return sum + (parseFloat(receivable.amount) || 0);
  }, 0);
});

// Status options
const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Paid', value: 'paid' }
];

// Utility functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  return safeDate(dateStr);
};

const getStatusSeverity = (status, isOverdue = false) => {
  if (isOverdue) return 'danger';
  
  const normalizedStatus = (status || '').toString().toLowerCase();
  switch (normalizedStatus) {
    case 'paid': 
    case 'completed': 
      return 'success';
    case 'pending': 
    case 'open': 
      return 'warn';
    case 'overdue': 
      return 'danger';
    case 'cancelled': 
    case 'void': 
      return 'secondary';
    default: 
      return 'info';
  }
};

// Methods
async function loadReceivables() {
  try {
    console.log('🔄 Loading receivables data...');
    
    // Load both customer balances and receivables list
    await Promise.all([
      financeStore.fetchCustomerBalances(),
      financeStore.fetchReceivables()
    ]);
    
    console.log('✅ Receivables data loaded successfully');
    console.log('📊 Customer balances:', customerBalances.value);
    console.log('📋 Receivables list:', receivables.value);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Receivables data loaded successfully',
      life: 3000
    });
  } catch (error) {
    console.error('❌ Error loading receivables:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load receivables data',
      life: 5000
    });
  }
}

async function sendPaymentReminder(receivableId) {
  try {
    await financeStore.sendPaymentReminder(receivableId);
    toast.add({
      severity: 'success',
      summary: 'Reminder Sent',
      detail: 'Payment reminder sent successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send payment reminder',
      life: 5000
    });
  }
}

function clearFilters() {
  filters.value.global.value = null;
  filters.value.customer_name.constraints[0].value = null;
  filters.value.status.constraints[0].value = null;
  searchTerm.value = '';
  selectedStatus.value = 'all';
}

// Initialize data on component mount
onMounted(() => {
  console.log('🚀 ReceivablesPage mounted, loading data...');
  loadReceivables();
});
</script>

<template>
  <div class="receivables-page">
    <Toast />
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h1 class="font-semibold text-3xl text-surface-900 dark:text-surface-0 mb-2">Accounts Receivable</h1>
        <p class="text-surface-600 dark:text-surface-400">Manage customer payments and outstanding balances</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          label="Refresh" 
          icon="pi pi-refresh" 
          outlined
          @click="loadReceivables"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Receivables</div>
            <div v-if="isLoading">
              <Skeleton width="6rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-xl">
              {{ formatCurrency(totalReceivables) }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Active Customers</div>
            <div v-if="isLoading">
              <Skeleton width="3rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-xl">
              {{ customerCount }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Monthly Payments</div>
            <div v-if="isLoading">
              <Skeleton width="5rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-green-600 font-semibold text-xl">
              {{ formatCurrency(monthlyPayments) }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Overdue Amount</div>
            <div v-if="isLoading">
              <Skeleton width="5rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-red-600 font-semibold text-xl">
              {{ formatCurrency(overdueAmount) }}
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="shadow-sm mb-6">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Filters</h3>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Global Search -->
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Search</label>
            <InputText 
              v-model="filters.global.value" 
              placeholder="Search customers..." 
              class="w-full"
            />
          </div>

          <!-- Status Filter -->
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Status</label>
            <Select 
              v-model="selectedStatus" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="All Statuses"
              class="w-full"
            />
          </div>

          <!-- Clear Filters -->
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">&nbsp;</label>
            <Button 
              label="Clear Filters" 
              icon="pi pi-filter-slash" 
              outlined
              @click="clearFilters"
              class="w-full"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Enhanced DataTable -->
    <Card class="shadow-sm">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0">Customer Receivables</h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">Outstanding customer balances and payment information</p>
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="receivables"
          v-model:expandedRows="expandedRows"
          :loading="isLoading"
          :filters="filters"
          :globalFilterFields="['customer_name', 'invoice_number', 'status']"
          paginator 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 60rem"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          responsiveLayout="scroll"
          :emptyMessage="isLoading ? 'Loading receivables...' : 'No receivables found.'"
          sortMode="multiple"
          removableSort
          dataKey="id"
        >
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
              <p class="text-surface-600 dark:text-surface-400 mb-2">No receivables found</p>
              <p class="text-sm text-surface-500 dark:text-surface-500">
                Try adjusting your search criteria or check back later.
              </p>
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
              <p class="text-surface-600 dark:text-surface-400">Loading receivables...</p>
            </div>
          </template>

          <!-- Expand/Collapse Column -->
          <Column expander style="width: 5rem" />

          <!-- Customer Name -->
          <Column field="customer_name" header="Customer" sortable style="min-width: 16rem">
            <template #body="{ data }">
              <div>
                <div class="font-semibold">
                  {{ data.customer_name || 'Unknown Customer' }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                  {{ data.customer_email || '' }}
                </div>
              </div>
            </template>
            <template #filter="{ filterModel }">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by customer" />
            </template>
          </Column>

          <!-- Invoice Number -->
          <Column field="invoice_number" header="Invoice #" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <span class="font-mono text-primary">
                {{ data.invoice_number || data.id || 'N/A' }}
              </span>
            </template>
          </Column>

          <!-- Amount -->
          <Column field="amount" header="Amount" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div class="text-right">
                <div class="font-semibold text-lg">
                  {{ formatCurrency(data.amount) }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Due Date -->
          <Column field="due_date" header="Due Date" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div>
                <div class="font-medium" :class="{ 'text-red-600': data.is_overdue }">
                  {{ formatDate(data.due_date) }}
                </div>
                <div v-if="data.is_overdue" class="text-xs text-red-600">
                  Overdue
                </div>
              </div>
            </template>
          </Column>

          <!-- Status -->
          <Column field="status" header="Status" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Badge 
                  :value="data.status || 'Unknown'" 
                  :severity="getStatusSeverity(data.status, data.is_overdue)"
                />
              </div>
            </template>
            <template #filter="{ filterModel }">
              <Select 
                v-model="filterModel.value" 
                :options="statusOptions" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Any"
              />
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button 
                  icon="pi pi-send"
                  size="small"
                  outlined
                  severity="info"
                  @click="sendPaymentReminder(data.id)"
                  v-tooltip="'Send Reminder'"
                  :disabled="data.status === 'paid'"
                />
              </div>
            </template>
          </Column>

          <!-- Expansion Row Template -->
          <template #expansion="{ data }">
            <div class="p-6 bg-surface-50 dark:bg-surface-800">
              <h4 class="font-semibold text-lg mb-4 text-surface-900 dark:text-surface-0">Receivable Details</h4>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Customer Information -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Customer Information</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Customer Name:</span>
                      <span class="font-medium">{{ data.customer_name || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Email:</span>
                      <span class="font-medium">{{ data.customer_email || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Phone:</span>
                      <span class="font-medium">{{ data.customer_phone || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Address:</span>
                      <span class="font-medium">{{ data.customer_address || 'N/A' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Payment Information -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Payment Information</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Invoice Date:</span>
                      <span class="font-medium">{{ formatDate(data.invoice_date) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Due Date:</span>
                      <span class="font-medium" :class="{ 'text-red-600': data.is_overdue }">
                        {{ formatDate(data.due_date) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Days Outstanding:</span>
                      <span class="font-medium">{{ data.days_outstanding || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Payment Terms:</span>
                      <span class="font-medium">{{ data.payment_terms || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.receivables-page {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .receivables-page {
    padding: 1rem;
  }
}
</style> 