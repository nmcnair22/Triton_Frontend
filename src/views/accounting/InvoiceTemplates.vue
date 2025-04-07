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

// Function to toggle interactive mode
function toggleInteractive() {
  isInteractive.value = !isInteractive.value;
  if (isInteractive.value && selectedInvoice.value) {
    loadEnrichedInvoiceData();
  }
}

// Function to load enriched data for interactive mode
async function loadEnrichedInvoiceData() {
  if (!selectedInvoice.value) return;
  
  try {
    await invoiceStore.fetchEnrichedInvoiceData(selectedInvoice.value.id);
    // Group the data based on the selected option
    regroupData();
  } catch (err) {
    console.error('Failed to load enriched invoice data:', err);
  }
}

// Watch for group by changes
watch(selectedGroupBy, () => {
  if (isInteractive.value && selectedInvoice.value) {
    regroupData();
  }
});

// Function to regroup data based on selected option
function regroupData() {
  isRegrouping.value = true;
  const enrichedData = invoiceStore.enrichedInvoiceData;
  
  if (!enrichedData || !enrichedData.length) {
    groupedProducts.value = [];
    isRegrouping.value = false;
    return;
  }
  
  // If grouping is set to none, just use the enriched data directly
  if (selectedGroupBy.value.value === 'none') {
    groupedProducts.value = enrichedData;
    groupNames.value = ['All Items'];
    isRegrouping.value = false;
    return;
  }
  
  // Otherwise group the data
  const { groupedData, groupKeys } = groupInvoiceItems(enrichedData, selectedGroupBy.value.value);
  groupedProducts.value = groupedData;
  groupNames.value = groupKeys;
  
  isRegrouping.value = false;
}

// Function to format invoice status for display
function formatStatus(status) {
  switch (status.toLowerCase()) {
    case 'open':
      return 'Unpaid';
    case 'paid':
      return 'Paid';
    case 'draft':
      return 'Draft';
    case 'void':
      return 'Void';
    default:
      return status;
  }
}

// Function to get a status severity class
function getStatusSeverity(status) {
  switch (status.toLowerCase()) {
    case 'open':
      return 'warning';
    case 'paid':
      return 'success';
    case 'draft':
      return 'info';
    case 'void':
      return 'danger';
    default:
      return 'info';
  }
}
</script>

<template>
  <div class="card">
    <div class="flex flex-column md:flex-row justify-content-between align-items-start pb-4 mb-4 border-bottom-1 surface-border">
      <div>
        <h1 class="mt-0 mb-2">Invoice Templates</h1>
        <h2 class="mt-0 mb-2 text-xl text-600 font-normal">Select a template to use for invoice generation</h2>
      </div>
    </div>

    <!-- Customer Filter Section -->
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

    <!-- Invoices Table -->
    <DataTable 
      v-model:selection="selectedCustomerInvoice"
      v-model:filters="filters" 
      :value="customerInvoices" 
      selectionMode="single" 
      dataKey="id" 
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

    <div v-if="selectedInvoice" class="mt-5">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="m-0">Invoice Details: {{ selectedInvoice.number }}</h2>
        <ToggleSwitch v-model="isInteractive" @change="toggleInteractive" />
        <span v-if="isInteractive" class="ml-2">Interactive Mode</span>
      </div>
      
      <!-- Simple Mode Display -->
      <div v-if="!isInteractive">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-3">
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Number:</label>
                <span>{{ selectedInvoice.number }}</span>
              </div>
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Customer:</label>
                <span>{{ selectedInvoice.customerName }}</span>
              </div>
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Issue Date:</label>
                <span>{{ formatDate(selectedInvoice.issueDate) }}</span>
              </div>
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Due Date:</label>
                <span>{{ formatDate(selectedInvoice.dueDate) }}</span>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="flex flex-column gap-3">
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Status:</label>
                <Tag 
                  :value="formatStatus(selectedInvoice.status)" 
                  :severity="getStatusSeverity(selectedInvoice.status)" 
                />
              </div>
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Total:</label>
                <span>{{ formatCurrency(selectedInvoice.total) }}</span>
              </div>
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Paid Amount:</label>
                <span>{{ formatCurrency(selectedInvoice.paidAmount) }}</span>
              </div>
              <div class="flex">
                <label class="font-bold text-900 w-10rem">Balance:</label>
                <span class="font-bold">{{ formatCurrency(selectedInvoice.remainingAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <h3 class="mt-5">Invoice Items</h3>
        <DataTable 
          :value="products" 
          stripedRows 
          showGridlines 
          responsiveLayout="scroll"
          class="mb-5"
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
      
      <!-- Interactive Mode Display -->
      <div v-else>
        <div class="flex justify-content-between align-items-center mb-4">
          <Dropdown 
            v-model="selectedGroupBy" 
            :options="groupByOptions" 
            optionLabel="name" 
            placeholder="Group by" 
            class="w-full md:w-14rem"
          />
        </div>
        
        <div v-if="isLoadingEnrichedData || isRegrouping" class="flex flex-column align-items-center py-5">
          <i class="pi pi-spin pi-spinner text-5xl text-primary mb-4"></i>
          <span>Processing invoice data...</span>
        </div>
        
        <div v-else-if="enrichedError" class="p-4 border-round bg-red-50 text-red-700 my-4">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          <span>Failed to load enriched invoice data. Please try again later.</span>
        </div>
        
        <div v-else>
          <TabView v-if="selectedGroupBy.value !== 'none'">
            <TabPanel v-for="(group, index) in groupNames" :key="index" :header="group">
              <DataTable 
                :value="groupedProducts[index]" 
                stripedRows 
                showGridlines 
                responsiveLayout="scroll"
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
                <Column v-if="selectedGroupBy.value === 'product'" field="location" header="Location"></Column>
                <Column v-if="selectedGroupBy.value === 'location'" field="product" header="Product"></Column>
                <Column v-if="selectedGroupBy.value !== 'service'" field="service" header="Service"></Column>
              </DataTable>
            </TabPanel>
          </TabView>
          
          <DataTable 
            v-else
            :value="groupedProducts" 
            stripedRows 
            showGridlines 
            responsiveLayout="scroll"
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
            <Column field="product" header="Product"></Column>
            <Column field="location" header="Location"></Column>
            <Column field="service" header="Service"></Column>
          </DataTable>
        </div>
      </div>
    </div>
    
    <div v-else-if="selectedCustomerInvoice" class="flex flex-column align-items-center p-5">
      <i class="pi pi-spin pi-spinner text-5xl text-primary mb-4"></i>
      <span>Loading invoice details...</span>
    </div>
  </div>
  
  <Toast position="bottom-right" group="invoice-bottom" />
</template>

<style scoped>
.p-dropdown-label {
  display: flex;
  align-items: center;
}

.customer-badge {
  border-radius: 2px;
  padding: 0.25em 0.5rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.status-badge {
  border-radius: 2px;
  padding: 0.25em 0.5rem;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.3px;
}

.p-inputtext {
  width: 100%;
}
</style> 