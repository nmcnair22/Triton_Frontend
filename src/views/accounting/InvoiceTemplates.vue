<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { formatCurrency, formatDate, formatDueDate, groupInvoiceItems } from '@/lib/utils';
import { useToast } from 'primevue/usetoast';
import ToggleSwitch from 'primevue/toggleswitch';

// Initialize the stores
const invoiceStore = useInvoiceStore();
const customerStore = useCustomerStore();

// Initialize the toast service with a specific group
const toast = useToast();

// Reactive data
const invoices = ref([]);
const selectedInvoice = ref(null);
const isLoading = computed(() => invoiceStore.loading);
const error = computed(() => invoiceStore.error);
const isInteractive = ref(false); // Toggle state for interactive mode
const isLoadingEnrichedData = computed(() => invoiceStore.loadingEnrichedInvoice);
const enrichedError = computed(() => invoiceStore.enrichedInvoiceError);

// Table products for the selected invoice
const products = ref([]);

// Customer selection and invoices table
const customers = computed(() => customerStore.customers);
const selectedCustomers = ref(null);
const customerInvoices = computed(() => invoiceStore.customerInvoices || []);
const selectedCustomerInvoice = ref(null);
const isLoadingCustomers = computed(() => customerStore.loading);
const customerError = computed(() => customerStore.error);
const isLoadingCustomerInvoices = computed(() => invoiceStore.loadingCustomerInvoices);

// Filters for the invoice table
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    number: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    customerName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    dueDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    total: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    remainingAmount: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

// Pagination for invoices table
const totalInvoiceRecords = ref(0);
const lazyParams = reactive({
  first: 0,
  rows: 10,
  page: 1,
  sortField: null,
  sortOrder: null,
  status: ['open', 'unpaid']
});

// Available row per page options
const rowsPerPageOptions = [5, 10, 20, 50];

// Interactive mode
const groupByOptions = ref([
  { name: 'None', value: 'none' },
  { name: 'Product', value: 'product' },
  { name: 'Location', value: 'location' },
  { name: 'Service', value: 'service' }
]);
const selectedGroupBy = ref({ name: 'None', value: 'none' });
const groupedProducts = ref([]);
const groupNames = ref([]);
const isRegrouping = ref(false);

// Customer list type toggle - true = active, false = full
const customerListType = ref(true);

// Function to handle rows per page change
function onRowsPerPageChange(event) {
  lazyParams.rows = event.rows;
  loadCustomerInvoices();
}

// Handle sorting
function onSort(event) {
  lazyParams.sortField = event.sortField;
  lazyParams.sortOrder = event.sortOrder;
  loadCustomerInvoices();
}

// Fetch customers when component mounts
onMounted(async () => {
  // Only load customers initially, wait for customer selection to fetch invoices
  await loadCustomers();
});

// Function to load customers based on selected list type
async function loadCustomers() {
  try {
    if (customerListType.value) {
      console.log('Loading active customers');
      await customerStore.fetchActiveCustomers();
    } else {
      console.log('Loading all customers');
      await customerStore.fetchCustomers();
    }
    
    // Clear any previously selected customers when the list changes
    selectedCustomers.value = null;
  } catch (err) {
    console.error('Failed to load customers:', err);
  }
}

// Function to handle customer list type change
function onCustomerListTypeChange() {
  loadCustomers();
}

// Function to load customer invoices
async function loadCustomerInvoices() {
  if (!selectedCustomers.value || selectedCustomers.value.length === 0) {
    return;
  }
  
  try {
    // Build a filter query for multiple customer selections using 'or' conditions
    const filterConditions = selectedCustomers.value.map(customer => 
      `customerId eq ${customer.id}`
    ).join(' or ');
    
    await invoiceStore.fetchCustomerInvoices(filterConditions, {
      page: lazyParams.page,
      limit: lazyParams.rows,
      sortField: lazyParams.sortField,
      sortOrder: lazyParams.sortOrder
    });
    
    totalInvoiceRecords.value = invoiceStore.totalCustomerInvoices;
  } catch (err) {
    console.error('Failed to load customer invoices:', err);
  }
}

// Handle customer selection change
function onCustomerChange() {
  selectedCustomerInvoice.value = null;
  loadCustomerInvoices();
}

// Handle pagination, sorting, filtering
function onPage(event) {
  lazyParams.first = event.first;
  lazyParams.rows = event.rows;
  lazyParams.page = event.page + 1;
  loadCustomerInvoices();
}

// Clear filters
function clearFilter() {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    number: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    customerName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    dueDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    total: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    remainingAmount: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
  };
}

// Handle customer invoice selection change
function onCustomerInvoiceSelect() {
  if (selectedCustomerInvoice.value) {
    selectInvoice(selectedCustomerInvoice.value.id);
  }
}

// Function to select and load a specific invoice
async function selectInvoice(id) {
  try {
    const invoice = await invoiceStore.fetchInvoice(id);
    if (invoice) {
      selectedInvoice.value = invoice;
      products.value = invoice.items || [];
    }
  } catch (err) {
    console.error(`Failed to load invoice #${id}:`, err);
    // Don't fallback to demo data, just set error state
    selectedInvoice.value = null;
    products.value = [];
  }
}

// Function to determine row class based on due date and status
function getRowClass(data) {
  if (data.status === 'open' && new Date(data.dueDate) < new Date()) {
    return 'bg-red-50 dark:bg-red-900/20';
  }
  if (data.status === 'open' && (new Date(data.dueDate) - new Date()) <= 3 * 24 * 60 * 60 * 1000) {
    return 'bg-yellow-50 dark:bg-yellow-900/20';
  }
  if (data.status === 'draft') {
    return 'bg-blue-50 dark:bg-blue-900/20';
  }
  if (data.status === 'paid') {
    return 'bg-green-50 dark:bg-green-900/20';
  }
  return '';
}

// Watch for changes to interactive mode
watch(isInteractive, async (newValue) => {
  if (newValue) {
    // Show toast message when interactive mode is enabled with specific group
    toast.add({ severity: 'success', summary: 'Interactive Mode', detail: 'Interactive Mode has been enabled', life: 3000, group: 'invoice-bottom' });
    
    if (selectedInvoice.value) {
      // When interactive mode is enabled and an invoice is selected
      await fetchEnrichedInvoiceData(selectedInvoice.value.number || selectedInvoice.value.id);
    }
  } else {
    // Show toast message when interactive mode is disabled with specific group
    toast.add({ severity: 'info', summary: 'Interactive Mode', detail: 'Interactive Mode has been disabled', life: 3000, group: 'invoice-bottom' });
  }
});

// Function to fetch enriched invoice data
async function fetchEnrichedInvoiceData(documentNumber) {
  if (!documentNumber) return;
  
  try {
    await invoiceStore.fetchEnrichedInvoiceLines(documentNumber);
    
    // Enhanced logging to show all data
    const enrichedInvoice = invoiceStore.currentEnrichedInvoice;
    if (enrichedInvoice) {
      console.log('Fetched enriched invoice data:');
      
      // Log normalized data
      console.log('- Normalized data:', enrichedInvoice.enrichedItems);
      
      // Log raw data
      console.log('- Raw data:', enrichedInvoice.rawEnrichedItems);
      
      // Log specific fields from the first item to verify they're being captured
      if (enrichedInvoice.rawEnrichedItems && enrichedInvoice.rawEnrichedItems.length > 0) {
        const firstItem = enrichedInvoice.rawEnrichedItems[0];
        console.log('Specific fields from first raw item:');
        console.log('  Document_No:', firstItem.Document_No);
        console.log('  Gen_Prod_Posting_Group:', firstItem.Gen_Prod_Posting_Group);
        console.log('  Job_No:', firstItem.Job_No);
        console.log('  Job_Task_No:', firstItem.Job_Task_No);
        console.log('  CIS_ID:', firstItem.CIS_ID);
        console.log('  Job_Contract_Entry_No:', firstItem.Job_Contract_Entry_No);
      }
      
      // Group the data according to the current grouping option
      groupEnrichedData();
    }
  } catch (err) {
    console.error(`Failed to fetch enriched data for document ${documentNumber}:`, err);
  }
}

// Watch for changes to the groupBy selector
watch(selectedGroupBy, () => {
  if (isInteractive.value) {
    groupEnrichedData();
  }
});

// Function to group enriched data
function groupEnrichedData() {
  isRegrouping.value = true;
  
  try {
    const enrichedItems = invoiceStore.currentEnrichedInvoice?.enrichedItems || [];
    if (!enrichedItems.length) {
      groupedProducts.value = [];
      groupNames.value = [];
      return;
    }
    
    // If no grouping is selected, just use the enriched items directly
    if (selectedGroupBy.value.value === 'none') {
      groupedProducts.value = enrichedItems;
      groupNames.value = ['All Items'];
    } else {
      // Otherwise, group the items by the selected property
      const { groupedData, groupLabels } = groupInvoiceItems(
        enrichedItems,
        selectedGroupBy.value.value
      );
      
      groupedProducts.value = groupedData;
      groupNames.value = groupLabels;
      
      console.log(`Grouped data by ${selectedGroupBy.value.name}:`, groupedData);
      console.log('Group names:', groupLabels);
    }
  } catch (error) {
    console.error('Error while grouping data:', error);
    groupedProducts.value = [];
    groupNames.value = [];
  } finally {
    isRegrouping.value = false;
  }
}

function formatStatus(status) {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'Unpaid';
    case 'paid':
      return 'Paid';
    case 'draft':
      return 'Draft';
    case 'void':
      return 'Void';
    default:
      return status || 'Unknown';
  }
}

// Function to determine status badge severity
function getStatusSeverity(status) {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'warning';
    case 'paid':
      return 'success';
    case 'draft':
      return 'info';
    case 'void':
      return 'danger';
    default:
      return 'secondary';
  }
}
</script>

<template>
  <div class="card">
    <!-- Header -->
    <div class="flex flex-column md:flex-row justify-content-between align-items-start pb-4 mb-4 border-bottom-1 surface-border">
      <div>
        <h1 class="mt-0 mb-2">Invoice Templates</h1>
        <h2 class="mt-0 mb-2 text-xl text-600 font-normal">Select a template to use for invoice generation</h2>
      </div>
      
      <div class="flex align-items-center mt-3 md:mt-0">
        <div class="flex align-items-center" v-if="selectedInvoice">
          <span class="mr-2">Interactive:</span>
          <ToggleSwitch v-model="isInteractive" />
        </div>
      </div>
    </div>
    
    <!-- Customer Selection and Filter Area -->
    <div class="flex align-items-center mb-4">
      <div style="width: 35%; margin-right: 2rem;">
        <MultiSelect 
          v-model="selectedCustomers" 
          :options="customers" 
          optionLabel="name" 
          placeholder="Select Customers" 
          filter 
          display="chip"
          class="w-full"
          :loading="isLoadingCustomers"
          @change="onCustomerChange" 
        />
      </div>
      <div class="flex align-items-center">
        <ToggleSwitch v-model="customerListType" @change="onCustomerListTypeChange" class="mr-2" />
        <label class="font-medium">Full list / Only active customers</label>
      </div>
    </div>
    
    <!-- Invoices Data Table -->
    <DataTable 
      v-model:selection="selectedCustomerInvoice"
      v-model:filters="filters" 
      :value="customerInvoices" 
      selectionMode="single" 
      dataKey="id" 
      class="p-datatable-sm" 
      :rows="lazyParams.rows" 
      :totalRecords="totalInvoiceRecords"
      :loading="isLoadingCustomerInvoices" 
      :rowsPerPageOptions="rowsPerPageOptions"
      paginator
      :lazy="true"
      :rowClass="getRowClass"
      stripedRows
      removableSort
      filterDisplay="menu"
      responsiveLayout="scroll"
      @page="onPage"
      @sort="onSort"
      @row-select="onCustomerInvoiceSelect"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center">
          <h2 class="m-0">Invoices</h2>
          <div>
            <Button 
              type="button" 
              icon="pi pi-filter-slash" 
              label="Clear" 
              outlined 
              @click="clearFilter"
              class="mr-2"
            />
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText 
                v-model="filters['global'].value" 
                placeholder="Search" 
                class="w-full sm:w-auto"
              />
            </span>
          </div>
        </div>
      </template>
      
      <Column field="number" header="Number" :sortable="true">
        <template #body="{ data }">
          <div class="flex flex-column">
            <span class="font-bold">{{ data.number }}</span>
            <span class="text-sm text-600">{{ data.reference || 'No reference' }}</span>
          </div>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText 
            v-model="filterModel.value" 
            type="text" 
            @input="filterCallback()" 
            class="p-column-filter" 
            placeholder="Search by number"
          />
        </template>
      </Column>
      
      <Column field="customerName" header="Customer" :sortable="true">
        <template #filter="{ filterModel, filterCallback }">
          <InputText 
            v-model="filterModel.value" 
            type="text" 
            @input="filterCallback()" 
            class="p-column-filter" 
            placeholder="Search by customer"
          />
        </template>
      </Column>
      
      <Column field="dueDate" header="Due Date" :sortable="true">
        <template #body="{ data }">
          {{ formatDueDate(data.dueDate) }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Calendar 
            v-model="filterModel.value" 
            dateFormat="mm/dd/yy" 
            placeholder="mm/dd/yyyy" 
            @date-select="filterCallback()" 
            showButtonBar
          />
        </template>
      </Column>
      
      <Column field="total" header="Amount" :sortable="true">
        <template #body="{ data }">
          {{ formatCurrency(data.total) }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputNumber 
            v-model="filterModel.value" 
            @input="filterCallback()" 
            mode="currency" 
            currency="USD" 
            locale="en-US" 
            placeholder="Amount"
          />
        </template>
      </Column>
      
      <Column field="remainingAmount" header="Balance" :sortable="true">
        <template #body="{ data }">
          {{ formatCurrency(data.remainingAmount) }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputNumber 
            v-model="filterModel.value" 
            @input="filterCallback()" 
            mode="currency" 
            currency="USD" 
            locale="en-US" 
            placeholder="Balance"
          />
        </template>
      </Column>
      
      <Column field="status" header="Status" :sortable="true">
        <template #body="{ data }">
          <Tag 
            :value="formatStatus(data.status)" 
            :severity="getStatusSeverity(data.status)" 
          />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown 
            v-model="filterModel.value" 
            @change="filterCallback()" 
            :options="['draft', 'open', 'paid', 'void']" 
            placeholder="Select a Status" 
            class="p-column-filter" 
            showClear
          />
        </template>
      </Column>
      
      <template #paginatorstart>
        <Dropdown 
          v-model="lazyParams.rows" 
          :options="rowsPerPageOptions" 
          @change="onRowsPerPageChange" 
          optionLabel="" 
          placeholder="Items per page" 
          class="mr-2"
        />
      </template>
      
      <template #paginatorend>
        <span class="text-sm">
          Total {{ totalInvoiceRecords }} invoices
        </span>
      </template>
      
      <template #empty>
        <div class="flex flex-column align-items-center p-4">
          <i class="pi pi-inbox text-6xl text-300 mb-4"></i>
          <span v-if="selectedCustomers && selectedCustomers.length > 0">
            No invoices found for the selected customer(s).
          </span>
          <span v-else>
            Select one or more customers to view their invoices.
          </span>
        </div>
      </template>
      
      <template #loading>
        <div class="flex flex-column align-items-center p-4">
          <i class="pi pi-spin pi-spinner text-5xl text-primary mb-4"></i>
          <span>Loading invoices...</span>
        </div>
      </template>
    </DataTable>
    
    <!-- Invoice Details Section -->
    <div v-if="selectedInvoice" class="mt-4">
      <div class="flex justify-content-between align-items-center mb-3">
        <h2 class="m-0">Invoice Details: {{ selectedInvoice.number }}</h2>
        
        <div class="flex align-items-center" v-if="isInteractive">
          <Dropdown 
            v-model="selectedGroupBy" 
            :options="groupByOptions" 
            optionLabel="name" 
            placeholder="Group by" 
            class="w-full md:w-14rem"
          />
        </div>
      </div>
      
      <!-- Simple View (Non-Interactive) -->
      <div v-if="!isInteractive">
        <!-- Invoice Summary Section -->
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-3">
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Number:</span>
                <span>{{ selectedInvoice.number }}</span>
              </div>
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Customer:</span>
                <span>{{ selectedInvoice.customerName }}</span>
              </div>
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Issue Date:</span>
                <span>{{ formatDate(selectedInvoice.issueDate) }}</span>
              </div>
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Due Date:</span>
                <span>{{ formatDate(selectedInvoice.dueDate) }}</span>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-3">
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Status:</span>
                <Tag 
                  :value="formatStatus(selectedInvoice.status)" 
                  :severity="getStatusSeverity(selectedInvoice.status)" 
                />
              </div>
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Total:</span>
                <span>{{ formatCurrency(selectedInvoice.total) }}</span>
              </div>
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Paid Amount:</span>
                <span>{{ formatCurrency(selectedInvoice.paidAmount) }}</span>
              </div>
              <div class="flex align-items-center">
                <span class="font-bold text-900 w-10rem">Balance:</span>
                <span class="font-bold">{{ formatCurrency(selectedInvoice.remainingAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Invoice Line Items -->
        <h3>Invoice Items</h3>
        <DataTable 
          :value="products" 
          stripedRows 
          showGridlines 
          class="p-datatable-sm"
        >
          <Column field="description" header="Description"></Column>
          <Column field="quantity" header="Quantity" style="width: 10%"></Column>
          <Column field="rate" header="Rate" style="width: 15%">
            <template #body="{ data }">
              {{ formatCurrency(data.rate) }}
            </template>
          </Column>
          <Column field="amount" header="Amount" style="width: 15%">
            <template #body="{ data }">
              {{ formatCurrency(data.amount) }}
            </template>
          </Column>
        </DataTable>
      </div>
      
      <!-- Interactive View -->
      <div v-else>
        <!-- Loading State -->
        <div v-if="isLoadingEnrichedData || isRegrouping" class="flex flex-column align-items-center py-5">
          <i class="pi pi-spin pi-spinner text-5xl text-primary mb-4"></i>
          <span>Processing invoice data...</span>
        </div>
        
        <!-- Error State -->
        <div v-else-if="enrichedError" class="p-4 border-round bg-red-50 text-red-700 my-4">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          <span>Failed to load enriched invoice data. Please try again later.</span>
        </div>
        
        <!-- Grouped Data Display -->
        <div v-else>
          <!-- When grouping is applied -->
          <TabView v-if="selectedGroupBy.value !== 'none' && groupNames.length > 0">
            <TabPanel v-for="(groupName, i) in groupNames" :key="i" :header="groupName">
              <DataTable 
                :value="groupedProducts[i]" 
                stripedRows 
                showGridlines 
                class="p-datatable-sm"
              >
                <Column field="description" header="Description"></Column>
                <Column field="quantity" header="Quantity" style="width: 8%"></Column>
                <Column field="rate" header="Rate" style="width: 12%">
                  <template #body="{ data }">
                    {{ formatCurrency(data.rate) }}
                  </template>
                </Column>
                <Column field="amount" header="Amount" style="width: 12%">
                  <template #body="{ data }">
                    {{ formatCurrency(data.amount) }}
                  </template>
                </Column>
                <Column v-if="selectedGroupBy.value === 'product'" field="location" header="Location"></Column>
                <Column v-if="selectedGroupBy.value === 'location'" field="product" header="Product"></Column>
                <Column v-if="selectedGroupBy.value !== 'service'" field="service" header="Service"></Column>
              </DataTable>
            </TabPanel>
          </TabView>
          
          <!-- When no grouping is applied -->
          <DataTable 
            v-else
            :value="groupedProducts" 
            stripedRows 
            showGridlines 
            class="p-datatable-sm"
          >
            <Column field="description" header="Description"></Column>
            <Column field="quantity" header="Quantity" style="width: 8%"></Column>
            <Column field="rate" header="Rate" style="width: 12%">
              <template #body="{ data }">
                {{ formatCurrency(data.rate) }}
              </template>
            </Column>
            <Column field="amount" header="Amount" style="width: 12%">
              <template #body="{ data }">
                {{ formatCurrency(data.amount) }}
              </template>
            </Column>
            <Column field="product" header="Product"></Column>
            <Column field="location" header="Location"></Column>
            <Column field="service" header="Service"></Column>
          </DataTable>
        </div>
      </div>
    </div>
    
    <!-- Loading State for Invoice Selection -->
    <div v-else-if="selectedCustomerInvoice" class="flex flex-column align-items-center p-5">
      <i class="pi pi-spin pi-spinner text-5xl text-primary mb-4"></i>
      <span>Loading invoice details...</span>
    </div>
  </div>
  
  <!-- Toast for notifications -->
  <Toast position="bottom-right" group="invoice-bottom" />
</template>

<style scoped>
/* Customer badge styling */
.customer-badge {
  border-radius: 2px;
  padding: 0.25em 0.5rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.3px;
}

/* Input styling */
.p-input-icon-left {
  width: 100%;
}

.p-inputtext {
  width: 100%;
}

/* Custom overflow handling for tables */
.max-h-20rem {
  max-height: 20rem;
  overflow-y: auto;
}

/* PrimeVue component overrides */
:deep(.p-multiselect-token) {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.p-tabview-panels) {
  padding: 1.25rem 0 !important;
}
</style> 