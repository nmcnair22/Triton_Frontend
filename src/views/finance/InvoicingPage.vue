<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import Badge from 'primevue/badge';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import Tag from 'primevue/tag';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

const financeStore = useFinanceStore();
const toast = useToast();

// Computed properties from store
const invoices = computed(() => financeStore.invoices);
const invoicingStats = computed(() => financeStore.invoicingStats);
const isLoading = computed(() => financeStore.isLoading);

// Local state
const showCreateDialog = ref(false);
const selectedInvoice = ref(null);
const expandedRows = ref([]);
const globalFilter = ref('');
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  number: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  customer_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  'invoice_date.formatted': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  'due_date.formatted': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  total_amount: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] }
});

// Date range filters
const dateFilters = ref({
  fromDate: null,
  toDate: null
});

// Status filter options
const statusOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Paid', value: 'Paid' },
  { label: 'Open', value: 'Open' },
  { label: 'Overdue', value: 'Overdue' }
];

const selectedStatus = ref(null);

// New invoice form
const newInvoice = ref({
  customer_name: '',
  customer_email: '',
  invoice_number: '',
  amount: 0,
  due_date: null,
  description: '',
  status: 'pending'
});

// Initialize filters
const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    number: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    customer_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    'invoice_date.formatted': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    'due_date.formatted': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    total_amount: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] }
  };
};

// Computed properties for summary cards
const totalInvoices = computed(() => {
  const total = invoicingStats.value.total || 0;
  console.log('📊 Total invoices computed:', total);
  return total;
});
const totalAmount = computed(() => {
  const amount = invoicingStats.value.total_amount || 0;
  console.log('💰 Total amount computed:', amount);
  return amount;
});
const paidInvoices = computed(() => invoicingStats.value.paid || 0);
const pendingInvoices = computed(() => invoicingStats.value.pending || 0);
const overdueInvoices = computed(() => invoicingStats.value.overdue || 0);

// Utility functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
};

const formatDate = (dateObj) => {
  if (!dateObj) return '';
  if (typeof dateObj === 'object' && dateObj.formatted) {
    return dateObj.formatted;
  }
  if (typeof dateObj === 'string') {
    return new Date(dateObj).toLocaleDateString();
  }
  return '';
};

const getStatusSeverity = (status, isOverdue = false) => {
  if (isOverdue) return 'danger';
  
  const normalizedStatus = (status || '').toString().toLowerCase();
  switch (normalizedStatus) {
    case 'paid': 
    case 'completed': 
      return 'success';
    case 'open': 
    case 'pending': 
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

const formatAddress = (address) => {
  if (!address) return '';
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ].filter(Boolean);
  return parts.join(', ');
};

// Actions
async function loadInvoices() {
  try {
    console.log('🔄 Loading invoices...');
    
    // Build filters for API call
    const apiFilters = {};
    if (dateFilters.value.fromDate) {
      apiFilters.from_date = dateFilters.value.fromDate.toISOString().split('T')[0];
    }
    if (dateFilters.value.toDate) {
      apiFilters.to_date = dateFilters.value.toDate.toISOString().split('T')[0];
    }
    
    const result = await financeStore.fetchInvoices(apiFilters);
    
    console.log('📊 API Result:', result);
    console.log('📋 Store invoices count:', financeStore.invoices?.length || 0);
    
    if (financeStore.invoices?.length > 0) {
      console.log('🔍 First invoice structure:', financeStore.invoices[0]);
      console.log('📊 Invoice fields check:', {
        number: financeStore.invoices[0]?.number,
        customer_name: financeStore.invoices[0]?.customer_name,
        status: financeStore.invoices[0]?.status,
        total_amount: financeStore.invoices[0]?.total_amount,
        formatted_total: financeStore.invoices[0]?.formatted_total,
        invoice_date: financeStore.invoices[0]?.invoice_date,
        due_date: financeStore.invoices[0]?.due_date,
        details: financeStore.invoices[0]?.details
      });
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Loaded ${financeStore.invoices.length} invoices`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'info',
        summary: 'No Data',
        detail: 'No invoices found for the selected criteria',
        life: 3000
      });
    }
  } catch (error) {
    console.error('❌ Error loading invoices:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load invoices',
      life: 3000
    });
  }
}

async function createInvoice() {
  try {
    // Generate invoice number if not provided
    if (!newInvoice.value.invoice_number) {
      newInvoice.value.invoice_number = `INV-${Date.now()}`;
    }

    await financeStore.createInvoice(newInvoice.value);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Invoice created successfully',
      life: 3000
    });
    
    // Reset form and close dialog
    resetForm();
    showCreateDialog.value = false;
    
    // Reload invoices to get updated list
    await loadInvoices();
  } catch (error) {
    console.error('Error creating invoice:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create invoice',
      life: 3000
    });
  }
}

async function updateInvoiceStatus(invoice, newStatus) {
  try {
    await financeStore.updateInvoice(invoice.id, { status: newStatus });
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Invoice status updated to ${newStatus}`,
      life: 3000
    });
    
    // Reload invoices to get updated stats
    await loadInvoices();
  } catch (error) {
    console.error('Error updating invoice:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update invoice status',
      life: 3000
    });
  }
}

async function markAsOverdue(invoice) {
  try {
    await financeStore.updateInvoice(invoice.id, { is_overdue: true });
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Invoice marked as overdue',
      life: 3000
    });
    
    // Reload invoices to get updated stats
    await loadInvoices();
  } catch (error) {
    console.error('Error marking invoice as overdue:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to mark invoice as overdue',
      life: 3000
    });
  }
}

async function exportInvoices() {
  try {
    await financeStore.exportInvoices();
    toast.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: 'Invoices exported successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Export error:', error);
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: 'Failed to export invoices',
      life: 3000
    });
  }
}

function resetForm() {
  newInvoice.value = {
    customer_name: '',
    customer_email: '',
    invoice_number: '',
    amount: 0,
    due_date: null,
    description: '',
    status: 'pending'
  };
}

function openCreateDialog() {
  resetForm();
  showCreateDialog.value = true;
}

function clearFilters() {
  // Reset all filter values
  filters.value.global.value = null;
  filters.value.number.constraints[0].value = null;
  filters.value.customer_name.constraints[0].value = null;
  filters.value.status.constraints[0].value = null;
  filters.value['invoice_date.formatted'].constraints[0].value = null;
  filters.value['due_date.formatted'].constraints[0].value = null;
  filters.value.total_amount.constraints[0].value = null;
  
  globalFilter.value = '';
  dateFilters.value = { fromDate: null, toDate: null };
  selectedStatus.value = null;
}

function applyDateFilter() {
  loadInvoices();
}

// Watch for status filter changes
watch(selectedStatus, (newStatus) => {
  if (filters.value && filters.value.status && filters.value.status.constraints && filters.value.status.constraints[0]) {
    if (newStatus) {
      filters.value.status.constraints[0].value = newStatus;
    } else {
      filters.value.status.constraints[0].value = null;
    }
  }
});

// Initialize data on component mount
onMounted(() => {
  console.log('🚀 InvoicingPage mounted, loading invoices...');
  loadInvoices();
});
</script>

<template>
  <div class="invoicing-page">
    <Toast />
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h1 class="font-semibold text-3xl text-surface-900 dark:text-surface-0 mb-2">Invoice Management</h1>
        <p class="text-surface-600 dark:text-surface-400">View and analyze your invoice data</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          label="Export" 
          icon="pi pi-download" 
          outlined
          @click="exportInvoices"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Invoices</div>
            <div v-if="isLoading">
              <Skeleton width="3rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-xl">
              {{ totalInvoices }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Amount</div>
            <div v-if="isLoading">
              <Skeleton width="5rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-surface-900 dark:text-surface-0 font-semibold text-xl">
              {{ formatCurrency(totalAmount) }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Paid</div>
            <div v-if="isLoading">
              <Skeleton width="2rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-green-600 font-semibold text-xl">
              {{ paidInvoices }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Open</div>
            <div v-if="isLoading">
              <Skeleton width="2rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-orange-600 font-semibold text-xl">
              {{ pendingInvoices }}
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm">
        <template #content>
          <div class="text-center">
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Overdue</div>
            <div v-if="isLoading">
              <Skeleton width="2rem" height="1.5rem" class="mx-auto" />
            </div>
            <div v-else class="text-red-600 font-semibold text-xl">
              {{ overdueInvoices }}
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Advanced Filters -->
    <Card class="shadow-sm mb-6">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-2">Filters</h3>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Global Search -->
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Search</label>
            <InputText 
              v-model="filters['global'].value" 
              placeholder="Search all fields..." 
              class="w-full"
            />
          </div>

          <!-- Date Range -->
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">From Date</label>
            <DatePicker 
              v-model="dateFilters.fromDate" 
              placeholder="Select start date"
              dateFormat="mm/dd/yy"
              @update:modelValue="applyDateFilter"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">To Date</label>
            <DatePicker 
              v-model="dateFilters.toDate" 
              placeholder="Select end date"
              dateFormat="mm/dd/yy"
              @update:modelValue="applyDateFilter"
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
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <Button 
            label="Clear Filters" 
            icon="pi pi-filter-slash" 
            outlined
            @click="clearFilters"
          />
          <Button 
            label="Refresh" 
            icon="pi pi-refresh" 
            @click="loadInvoices"
          />
        </div>
      </template>
    </Card>

    <!-- Enhanced DataTable -->
    <Card class="shadow-sm">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="font-semibold text-xl text-surface-900 dark:text-surface-0">Invoices</h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">Click on any row to view detailed information</p>
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="invoices" 
          v-model:expandedRows="expandedRows"
          :loading="isLoading"
          :filters="filters"
          :globalFilterFields="['number', 'customer_name', 'status']"
          paginator 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          tableStyle="min-width: 60rem"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          responsiveLayout="scroll"
          :emptyMessage="isLoading ? 'Loading invoices...' : 'No invoices found.'"
          sortMode="multiple"
          removableSort
          dataKey="id"
        >
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
              <p class="text-surface-600 dark:text-surface-400 mb-2">No invoices found</p>
              <p class="text-sm text-surface-500 dark:text-surface-500">
                Try adjusting your search criteria or date filters.
              </p>
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
              <p class="text-surface-600 dark:text-surface-400">Loading invoices...</p>
            </div>
          </template>

          <!-- Expand/Collapse Column -->
          <Column expander style="width: 5rem" />

          <!-- Primary Row Fields -->
          <Column field="number" header="Invoice #" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <span class="font-semibold text-primary">
                {{ data.number || data.invoice_number || data.id }}
              </span>
            </template>
            <template #filter="{ filterModel }">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by invoice #" />
            </template>
          </Column>
          
          <Column field="customer_name" header="Customer" sortable style="min-width: 16rem">
            <template #body="{ data }">
              <div>
                <div class="font-semibold">
                  {{ data.customer_name || 'Unknown Customer' }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                  #{{ data.customer_number || 'N/A' }}
                </div>
              </div>
            </template>
            <template #filter="{ filterModel }">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by customer" />
            </template>
          </Column>
          
          <Column field="invoice_date" header="Invoice Date" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ formatDate(data.invoice_date) }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                  {{ data.invoice_date?.relative || '' }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="due_date" header="Due Date" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <div>
                <div class="font-medium" :class="{ 'text-red-600': data.is_overdue }">
                  {{ formatDate(data.due_date) }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                  {{ data.due_date?.relative || '' }}
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="status" header="Status" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Badge 
                  :value="data.status || 'Unknown'" 
                  :severity="getStatusSeverity(data.status, data.is_overdue)"
                />
                <Tag 
                  v-if="data.is_overdue" 
                  value="OVERDUE" 
                  severity="danger"
                  class="text-xs"
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

          <Column field="total_amount" header="Total Amount" sortable style="min-width: 12rem">
            <template #body="{ data }">
              <div class="text-right">
                <div class="font-semibold text-lg">
                  {{ data.formatted_total || formatCurrency(data.total_amount) }}
                </div>
                <div v-if="data.remaining_amount > 0" class="text-sm text-orange-600">
                  {{ data.formatted_remaining || formatCurrency(data.remaining_amount) }} due
                </div>
              </div>
            </template>
          </Column>

          <!-- Expansion Row Template -->
          <template #expansion="{ data }">
            <div class="p-6 bg-surface-50 dark:bg-surface-800">
              <h4 class="font-semibold text-lg mb-4 text-surface-900 dark:text-surface-0">Invoice Details</h4>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- General Information -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">General Information</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Posting Date:</span>
                      <span class="font-medium">{{ formatDate(data.details?.general?.posting_date || data.posting_date) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">External Doc #:</span>
                      <span class="font-medium">{{ data.details?.general?.external_document_number || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Order Number:</span>
                      <span class="font-medium">{{ data.details?.general?.order_number || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Currency:</span>
                      <span class="font-medium">{{ data.details?.general?.currency_code || 'USD' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Last Modified:</span>
                      <span class="font-medium text-sm">{{ new Date(data.details?.general?.last_modified).toLocaleString() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Amount Breakdown -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Amount Breakdown</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Subtotal (Excl. Tax):</span>
                      <span class="font-medium">{{ data.details?.amounts?.formatted_excluding_tax || formatCurrency(data.details?.amounts?.total_excluding_tax) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Tax Amount:</span>
                      <span class="font-medium">{{ data.details?.amounts?.formatted_tax || formatCurrency(data.details?.amounts?.tax_amount) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Discount:</span>
                      <span class="font-medium">{{ data.details?.amounts?.formatted_discount || formatCurrency(data.details?.amounts?.discount_amount) }}</span>
                    </div>
                    <div class="border-t pt-2 mt-2">
                      <div class="flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span>{{ data.formatted_total || formatCurrency(data.total_amount) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Customer Information -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Customer Information</h5>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Email:</span>
                      <span class="font-medium">{{ data.details?.customer_info?.email || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Phone:</span>
                      <span class="font-medium">{{ data.details?.customer_info?.phone || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Payment Terms:</span>
                      <span class="font-medium">{{ data.details?.additional?.payment_terms_id || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Salesperson:</span>
                      <span class="font-medium">{{ data.details?.additional?.salesperson || 'N/A' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Addresses -->
                <div>
                  <h5 class="font-semibold mb-3 text-surface-700 dark:text-surface-300">Addresses</h5>
                  <div class="space-y-4">
                    <div>
                      <h6 class="font-medium text-sm text-surface-600 dark:text-surface-400 mb-1">Billing Address:</h6>
                      <p class="text-sm">{{ formatAddress(data.details?.billing_address) || 'N/A' }}</p>
                    </div>
                    <div>
                      <h6 class="font-medium text-sm text-surface-600 dark:text-surface-400 mb-1">Shipping Address:</h6>
                      <p class="text-sm">{{ formatAddress(data.details?.shipping_address) || 'Same as billing' }}</p>
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
.invoicing-page {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .invoicing-page {
    padding: 1rem;
  }
}
</style> 