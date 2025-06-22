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
  vendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

// Computed properties from store
const isLoading = computed(() => financeStore.isLoading);
const payables = computed(() => financeStore.payables || []);
const vendorOutstanding = computed(() => financeStore.dashboardStats?.payables || {});

// Summary calculations with safety checks
const totalPayables = computed(() => {
  const outstanding = vendorOutstanding.value;
  return outstanding.totalOutstanding || 0;
});

const vendorCount = computed(() => {
  const outstanding = vendorOutstanding.value;
  return outstanding.vendorCount || 0;
});

const monthlyPayments = computed(() => {
  const outstanding = vendorOutstanding.value;
  return outstanding.monthlyPayments || 0;
});

const overduePayables = computed(() => {
  if (!Array.isArray(payables.value)) return [];
  return payables.value.filter(payable => {
    if (!payable.dueDate) return false;
    const dueDate = new Date(payable.dueDate);
    const today = new Date();
    return dueDate < today && payable.status !== 'paid';
  });
});

const overdueAmount = computed(() => {
  return overduePayables.value.reduce((sum, payable) => {
    return sum + (parseFloat(payable.amount) || 0);
  }, 0);
});

// Status options
const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' }
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
    case 'approved':
      return 'info';
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

const isOverdue = (payable) => {
  if (!payable.dueDate || payable.status === 'paid') return false;
  const dueDate = new Date(payable.dueDate);
  const today = new Date();
  return dueDate < today;
};

// Methods
async function loadPayables() {
  try {
    console.log('🔄 Loading payables data...');
    
    // Load both vendor outstanding and payables list
    await Promise.all([
      financeStore.fetchVendorOutstanding(),
      financeStore.fetchPayables()
    ]);
    
    console.log('✅ Payables data loaded successfully');
    console.log('📊 Vendor outstanding:', vendorOutstanding.value);
    console.log('📋 Payables list:', payables.value);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Payables data loaded successfully',
      life: 3000
    });
  } catch (error) {
    console.error('❌ Error loading payables:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to load payables data',
      life: 5000
    });
  }
}

async function approvePayment(payableId) {
  try {
    await financeStore.approvePayment(payableId);
    toast.add({
      severity: 'success',
      summary: 'Payment Approved',
      detail: 'Payment has been approved successfully',
      life: 3000
    });
    // Reload data to reflect changes
    await loadPayables();
  } catch (error) {
    console.error('Error approving payment:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to approve payment',
      life: 5000
    });
  }
}

function clearFilters() {
  filters.value.global.value = null;
  filters.value.vendorName.constraints[0].value = null;
  filters.value.status.constraints[0].value = null;
  searchTerm.value = '';
  selectedStatus.value = 'all';
}

// Initialize data on component mount
onMounted(() => {
  console.log('🚀 PayablesPage mounted, loading data...');
  loadPayables();
});
</script>

<template>
  <div class="payables-page">
    <Toast />
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h1 class="font-semibold text-3xl text-surface-900 dark:text-surface-0 mb-2">Accounts Payable</h1>
        <p class="text-surface-600 dark:text-surface-400">Manage vendor payments and outstanding bills</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          label="Refresh" 
          icon="pi pi-refresh" 
          outlined
          @click="loadPayables"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Payables</div>
            <div v-if="isLoading">
              <Skeleton width="6rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-xl">
              {{ formatCurrency(totalPayables) }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Active Vendors</div>
            <div v-if="isLoading">
              <Skeleton width="3rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-xl">
              {{ vendorCount }}
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
              placeholder="Search vendors..." 
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
          <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0">Vendor Payables</h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">Outstanding vendor bills and payment information</p>
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="payables"
          v-model:expandedRows="expandedRows"
          :loading="isLoading"
          :filters="filters"
          :globalFilterFields="['vendorName', 'invoiceNumber', 'status']"
          paginator 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 60rem"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          responsiveLayout="scroll"
          :emptyMessage="isLoading ? 'Loading payables...' : 'No payables found.'"
          sortMode="multiple"
          removableSort
          dataKey="id"
        >
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
              <p class="text-surface-600 dark:text-surface-400 mb-2">No payables found</p>
              <p class="text-sm text-surface-500 dark:text-surface-500">
                Try adjusting your search criteria or check back later.
              </p>
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
              <p class="text-surface-600 dark:text-surface-400">Loading payables...</p>
            </div>
          </template>

          <!-- Expand/Collapse Column -->
          <Column expander style="width: 5rem" />

          <!-- Vendor Name -->
          <Column field="vendorName" header="Vendor" sortable style="min-width: 16rem">
            <template #body="{ data }">
              <div>
                <div class="font-semibold">
                  {{ data.vendorName || 'Unknown Vendor' }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                  {{ data.vendorNumber || '' }}
                </div>
              </div>
            </template>
            <template #filter="{ filterModel }">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by vendor" />
            </template>
          </Column>

          <!-- Invoice Number -->
          <Column field="invoiceNumber" header="Invoice #" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <span class="font-mono text-primary">
                {{ data.invoiceNumber || data.id || 'N/A' }}
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
                <div class="text-xs text-surface-500 dark:text-surface-400">
                  {{ data.currency || 'USD' }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Due Date -->
          <Column field="dueDate" header="Due Date" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div>
                <div class="font-medium" :class="{ 'text-red-600': isOverdue(data) }">
                  {{ data.dueDateFormatted || formatDate(data.dueDate) }}
                </div>
                <div v-if="data.dueDateRelative" class="text-xs text-surface-500 dark:text-surface-400">
                  {{ data.dueDateRelative }}
                </div>
                <div v-if="isOverdue(data)" class="text-xs text-red-600">
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
                  :severity="getStatusSeverity(data.status, isOverdue(data))"
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
                  icon="pi pi-check"
                  size="small"
                  outlined
                  severity="info"
                  @click="approvePayment(data.id)"
                  v-tooltip="'Approve Payment'"
                  :disabled="data.status === 'paid' || data.status === 'approved'"
                />
              </div>
            </template>
          </Column>

          <!-- Expansion Row Template -->
          <template #expansion="{ data }">
            <div class="p-6 bg-surface-50 dark:bg-surface-800">
              <h4 class="font-semibold text-lg mb-4 text-surface-900 dark:text-surface-0">Payable Details</h4>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Vendor Information -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Vendor Information</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Vendor Name:</span>
                      <span class="font-medium">{{ data.vendorName || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Vendor Number:</span>
                      <span class="font-medium">{{ data.vendorNumber || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Email:</span>
                      <span class="font-medium">{{ data.contact?.email || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Phone:</span>
                      <span class="font-medium">{{ data.contact?.phone || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Address:</span>
                      <span class="font-medium">
                        {{ data.address?.street ? `${data.address.street}, ${data.address.city}, ${data.address.state} ${data.address.zipCode}` : 'N/A' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Payment Information -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Payment Information</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Invoice Date:</span>
                      <span class="font-medium">{{ data.invoiceDateFormatted || formatDate(data.invoiceDate) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Due Date:</span>
                      <span class="font-medium" :class="{ 'text-red-600': isOverdue(data) }">
                        {{ data.dueDateFormatted || formatDate(data.dueDate) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Category:</span>
                      <span class="font-medium">{{ data.category || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Payment Terms:</span>
                      <span class="font-medium">{{ data.paymentTerms || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Description:</span>
                      <span class="font-medium">{{ data.description || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Currency:</span>
                      <span class="font-medium">{{ data.currency || 'USD' }}</span>
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
.payables-page {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .payables-page {
    padding: 1rem;
  }
}
</style> 