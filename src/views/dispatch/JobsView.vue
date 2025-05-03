<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { FilterMatchMode, FilterOperator, FilterService } from '@primevue/core/api';
import { useCustomerStore } from '@/stores/customerStore';
import { useDispatchStore } from '@/stores/dispatchStore';
import { format, startOfToday, endOfToday, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import KpiCard from '@/components/KpiCard.vue';
import Drawer from 'primevue/drawer';

// Custom filter for date ranges
FilterService.register('dateRange', (value, filter) => {
  if (!filter || !filter[0] || !filter[1] || !value) return true;
  const date = new Date(value);
  return date >= filter[0] && date <= filter[1];
});

// Initialize the stores
const customerStore = useCustomerStore();
const dispatchStore = useDispatchStore();
const router = useRouter();

// Selected values
const selectedCustomer = ref(null);

// Date range state
const dateRangeOptions = ref([
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom Range', value: 'custom' }
]);
const selectedDateRange = ref('thisWeek');
const customDateRange = ref([]);
const isCustomDateRange = computed(() => selectedDateRange.value === 'custom');

// Computed properties for store state
const customerOptions = computed(() => [
  { name: 'All Customers', number: null },
  ...customerStore.customers
]);
const isLoadingCustomers = computed(() => customerStore.loading);

// DataTable state
const expandedRows = ref({});
const filters = ref({});
const loading = computed(() => dispatchStore.loading.details);
const globalFilterValue = ref('');
const rowsPerPage = ref(10);

// Filter options
const statusOptions = ref([
  'Completed',
  'In Progress',
  'Scheduled',
  'On Hold',
  'Confirmed',
  'Closed'
]);

// Billing status options
const billingStatusOptions = ref(['Billed', 'Not Billed', 'Invoiced', 'Paid']);

// Initialize filters with advanced filtering
function initFilters() {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    customerName: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    },
    subject: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    },
    status: {
      operator: FilterOperator.OR,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
    },
    billingStatus: {
      operator: FilterOperator.OR,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
    },
    cityState: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    },
    serviceDate: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: 'dateRange' }]
    }
  };
  globalFilterValue.value = '';
}

// Methods
const clearFilter = () => {
  initFilters();
  globalFilterValue.value = '';
};

const computePredefinedRange = (range) => {
  const today = new Date();
  switch (range) {
    case 'today':
      return { start: startOfToday(), end: endOfToday() };
    case 'yesterday': {
      const yesterday = subDays(today, 1);
      return { start: startOfToday(yesterday), end: endOfToday(yesterday) };
    }
    case 'thisWeek':
      return { start: startOfWeek(today), end: endOfWeek(today) };
    case 'lastWeek': {
      const lastWeekStart = subDays(startOfWeek(today), 7);
      const lastWeekEnd = subDays(endOfWeek(today), 7);
      return { start: lastWeekStart, end: lastWeekEnd };
    }
    case 'thisMonth':
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'lastMonth': {
      const lastMonthDate = subDays(startOfMonth(today), 1);
      return { start: startOfMonth(lastMonthDate), end: endOfMonth(lastMonthDate) };
    }
    default:
      return null;
  }
};

const applyFilters = async () => {
  const params = {
    // only send customer_id if a specific customer chosen
    ...(selectedCustomer.value ? { customer_id: parseInt(selectedCustomer.value, 10) } : {})
  };
  // Handle date range
  let dateFrom, dateTo;
  if (isCustomDateRange.value && customDateRange.value.length === 2) {
    dateFrom = customDateRange.value[0];
    dateTo = customDateRange.value[1];
  } else {
    const range = computePredefinedRange(selectedDateRange.value);
    if (range) {
      dateFrom = range.start;
      dateTo = range.end;
    }
  }
  if (dateFrom && dateTo) {
    params.date_from = format(dateFrom, 'yyyy-MM-dd');
    params.date_to = format(dateTo, 'yyyy-MM-dd');
  }

  await dispatchStore.fetchDispatchData(params);
};

const resetFilters = () => {
  selectedDateRange.value = 'thisWeek';
  customDateRange.value = [];
  clearFilter();
  dispatchStore.dispatchRows = [];
  focusFilter.value = null;
};

const clearFocus = () => {
  focusFilter.value = null;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const getSeverity = (status) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'info';
    case 'Scheduled':
      return 'warning';
    case 'On Hold':
      return 'danger';
    case 'Confirmed':
      return 'info';
    case 'Closed':
      return 'success';
    default:
      return null;
  }
};

const getBillingSeverity = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'billed':
    case 'paid':
      return 'success';
    case 'invoiced':
      return 'info';
    case 'not billed':
      return 'warning';
    default:
      return null;
  }
};

const expandAll = () => {
  const expandedRowsObj = {};
  jobs.value.forEach(job => expandedRowsObj[job.id] = true);
  expandedRows.value = expandedRowsObj;
};

const collapseAll = () => {
  expandedRows.value = {};
};

// Export to CSV
const exportCSV = (ref) => {
  if (ref?.value) {
    ref.value.exportCSV();
  }
};

const dtRef = ref(null);

// Fetch active customers on component mount
onMounted(() => {
  customerStore.fetchActiveCustomers();
  initFilters();
  // auto initial load this week all customers
  applyFilters();
});

// define jobs computed
const jobs = computed(() => dispatchStore.dispatchRows);

// after jobs computed define metrics
const totalDispatches = computed(() => jobs.value.length);

const statusSummary = computed(() => {
  const map = {};
  jobs.value.forEach(j => {
    if (!map[j.status]) map[j.status] = 0;
    map[j.status]++;
  });
  return Object.entries(map).map(([k,v])=>`${k}: ${v}`).join(' | ');
});

const billedRecords = computed(() => jobs.value.filter(j => (j.billing?.billingStatus || '').toLowerCase() === 'billed'));
const totalBilledCount = computed(() => billedRecords.value.length);
const totalBilledAmount = computed(() => billedRecords.value.reduce((sum,j)=>{
  const amt = parseFloat((j.billing?.finalBilledAmount || '').replace(/[^0-9.-]+/g,''));
  return sum + (isNaN(amt)?0:amt);
},0));

const unbilledCount = computed(() => jobs.value.length - totalBilledCount.value);

const daysToInvoiceStats = computed(() => {
  const arr = jobs.value.map(j => j.daysToInvoice).filter(d=>d!==null && d!==undefined);
  if (!arr.length) return {avg:0,min:0,max:0};
  const sum = arr.reduce((a,b)=>a+Number(b),0);
  return {avg: (sum/arr.length), min: Math.min(...arr), max: Math.max(...arr)};
});

// New state
const visibleFocus = ref(false);
const focusFilter = ref(null); // key of selected focus area

const focusAreas = [
  {
    key: 'unbilled7',
    label: 'Unbilled >7 Days',
    predicate: (r) => (r.billing?.billingStatus || '').toLowerCase() === 'not billed' && daysBetween(r.serviceDate) > 7,
    accent: '#f97316', icon: 'pi-clock'
  },
  {
    key: 'zeroDuration',
    label: 'Tech No Show / Zero Duration',
    predicate: (r) => (r.schedule?.duration ?? '00:00:00') === '00:00:00',
    accent: '#ef4444', icon: 'pi-user'
  },
  {
    key: 'missingTech',
    label: 'Missing Tech Data',
    predicate: (r)=> !(r.technicianInfo?.name) || !(r.technicianInfo?.grade),
    accent: '#a855f7', icon: 'pi-user-edit'
  },
  {
    key: 'pmReview',
    label: 'Jobs With PM Review',
    predicate: (r)=> r.pmReview === 1,
    accent: '#3b82f6', icon:'pi-star'
  },
  {
    key: 'longDuration',
    label: 'Overtime / Long Duration',
    predicate: (r)=> durationHours(r.schedule?.duration)>=8,
    accent:'#10b981', icon:'pi-clock'
  },
  {
    key:'onholdOld',
    label:'On Hold / Cancelled & Aged',
    predicate:(r)=> ['on hold','cancelled'].includes((r.status||'').toLowerCase()) && daysBetween(r.serviceDate)>7,
    accent:'#64748b', icon:'pi-ban'
  }
];

function daysBetween(dateStr){
  if(!dateStr) return 0;
  const d= new Date(dateStr);
  return Math.floor((Date.now()-d.getTime())/(1000*60*60*24));
}
function durationHours(dur){
  if(!dur) return 0;
  const parts = dur.split(':').map(Number);
  return parts[0]+parts[1]/60+parts[2]/3600;
}

const baseJobs = computed(()=>dispatchStore.dispatchRows);
const jobsFiltered = computed(()=>{
  if(!focusFilter.value) return baseJobs.value;
  const fa = focusAreas.find(f=>f.key===focusFilter.value);
  if(!fa) return baseJobs.value;
  return baseJobs.value.filter(fa.predicate);
});

const focusCounts = computed(()=>{
  const counts={};
  focusAreas.forEach(f=>{counts[f.key]=baseJobs.value.filter(f.predicate).length;});
  return counts;
});

const viewDetails = (row) => {
  const plainRow = JSON.parse(JSON.stringify(row));
  router.push({ name: 'dispatch-job-details', params: { id: row.id }, state: { dispatch: plainRow } });
};

// Enhance the dtPtOptions with more comprehensive styling
const dtPtOptions = {
  // Allow horizontal scroll within the root if needed
  root: { class: 'border border-surface-200 dark:border-surface-700 rounded-lg overflow-x-auto' },
  thead: { class: 'bg-surface-50 dark:bg-surface-800' },
  // Ensure consistent padding using 'p-3', adjust text size/weight
  th: { root: { class: 'text-sm font-semibold text-surface-700 dark:text-white/80 p-3 text-left' } },
  tbody: { class: 'divide-y divide-surface-200 dark:divide-surface-700' },
  tr: { class: 'hover:bg-surface-50 dark:hover:bg-surface-700/50' }, // Adjusted hover for better contrast
  // Ensure consistent padding using 'p-3', adjust text size
  td: { root: { class: 'text-sm text-surface-700 dark:text-white/80 p-3' } },
  paginator: {
    template: {
      layout: 'RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport',
      CurrentPageReport: ({ currentPage, totalPages, first, last, totalRecords }) => (
        `Page ${currentPage} of ${totalPages} (${first + 1} - ${last} of ${totalRecords})`
      )
    },
    // Add some padding around the paginator itself
    root: { class: 'border-t border-surface-200 dark:border-surface-700 bg-transparent px-3 py-2' },
    // Style tweaks for paginator buttons for consistency
    firstPageButton: { class: 'relative inline-flex items-center justify-center p-2 m-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700' },
    prevPageButton: { class: 'relative inline-flex items-center justify-center p-2 m-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700' },
    nextPageButton: { class: 'relative inline-flex items-center justify-center p-2 m-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700' },
    lastPageButton: { class: 'relative inline-flex items-center justify-center p-2 m-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700' },
    // Ensure page buttons have consistent size/spacing
    pageButton: ({ context }) => ({
        class: [
          'relative inline-flex items-center justify-center leading-none rounded-full min-w-[2.5rem] h-10 m-1',
          'border',
          context.active ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-surface-700 dark:border-surface-600 dark:text-white' : 'border-surface-200 bg-white text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-white/80 dark:hover:bg-surface-700'
        ]
    }),
    currentPageReport: { class: 'text-sm text-surface-600 dark:text-surface-300 mx-3' },
    rowsPerPageDropdown: {
      root: { class: 'mx-1' } // Add spacing
    }
  },
  // Global filter styling
  globalFilter: {
    root: { class: 'relative' }, // Let InputGroup handle styling
    input: { class: 'p-inputtext-sm' } // Keep input small
  }
};

const toggleFocusFilter = (key) => {
  focusFilter.value = focusFilter.value === key ? null : key;
  visibleFocus.value = false;
};

// Add a new function to handle clearing focus and closing the drawer
const clearFocusAndCloseDrawer = () => {
  clearFocus();
  visibleFocus.value = false;
};
</script>

<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Field Service Jobs</h1>
      <p class="text-color-secondary">Track and manage field service jobs with multiple visits</p>
    </div>

    <!-- Filter section -->
    <div class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 mb-4 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
        <div>
          <label for="customerSelect" class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">Customer</label>
          <Select 
            id="customerSelect"
            v-model="selectedCustomer"
            :options="customerOptions"
            optionLabel="name" 
            optionValue="number" 
            placeholder="Select customer" 
            class="w-full" 
            filter
            :loading="isLoadingCustomers"
            :disabled="isLoadingCustomers"
          />
        </div>
        <div>
          <label for="dateRangeSelect" class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">Date Range</label>
          <Select 
            id="dateRangeSelect"
            v-model="selectedDateRange"
            :options="dateRangeOptions"
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select date range" 
            class="w-full"
          />
        </div>
        <div>
          <label for="customRangePicker" class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">Custom Range</label>
          <DatePicker 
            id="customRangePicker"
            v-model="customDateRange" 
            selectionMode="range"
            :disabled="!isCustomDateRange" 
            placeholder="Select date range" 
            class="w-full"
            dateFormat="mm/dd/yy"
          />
        </div>
        
        <div class="lg:col-span-1 xl:col-span-2 hidden lg:block"></div>

        <div class="flex items-center gap-2 justify-self-end">
          <Button label="Load Data" icon="pi pi-download" @click="applyFilters" :disabled="!selectedCustomer" size="small" />
          <Button label="Reset" icon="pi pi-undo" severity="secondary" outlined @click="resetFilters" size="small" />
        </div>
      </div>
    </div>

    <!-- KPI Metrics -->
    <div v-if="jobs.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <KpiCard title="Total Dispatches" :value="totalDispatches" :subtitle="statusSummary" icon="pi-list" accentColor="#60a5fa" />
      <KpiCard title="Total Billed" :value="totalBilledCount" :subtitle="`$${totalBilledAmount.toLocaleString()}`" icon="pi-wallet" accentColor="#22c55e" />
      <KpiCard title="Total Unbilled" :value="unbilledCount" icon="pi-exclamation-circle" accentColor="#f59e0b" />
      <KpiCard title="Avg Days to Invoice" :value="daysToInvoiceStats.avg.toFixed(1)" :subtitle="`Min ${daysToInvoiceStats.min} / Max ${daysToInvoiceStats.max}`" icon="pi-clock" accentColor="#a855f7" />
    </div>

    <!-- Jobs Table with Filtering and Row Expansion -->
    <div class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700">
      <div class="flex justify-between items-center flex-wrap gap-4 p-4 border-b border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-2">
          <Button type="button" icon="pi pi-filter-slash" label="Clear Filters" outlined @click="clearFilter" size="small" />
          <Button type="button" icon="pi pi-plus" label="Expand All" outlined @click="expandAll" size="small" />
          <Button type="button" icon="pi pi-minus" label="Collapse All" outlined @click="collapseAll" size="small" />
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <InputGroup size="small">
            <InputGroupAddon>
              <i class="pi pi-search" />
            </InputGroupAddon>
            <InputText v-model="globalFilterValue" placeholder="Search jobs..." @input="filters.global.value = globalFilterValue" />
          </InputGroup>
          <Button label="Focus Areas" icon="pi pi-filter" outlined @click="visibleFocus=true" size="small" />
          <Button label="Remove Focus" icon="pi pi-times" outlined severity="secondary" @click="clearFocus" size="small" />
          <Button label="Export CSV" icon="pi pi-file-export" outlined @click="exportCSV(dtRef)" size="small" />
        </div>
      </div>
      
      <DataTable 
        ref="dtRef"
        v-model:expandedRows="expandedRows"
        :value="jobsFiltered" 
        paginator 
        :rows="rowsPerPage"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        dataKey="id" 
        :rowHover="true"
        :filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['id', 'customerName', 'subject', 'status', 'billingStatus', 'cityState', 'serviceDate']"
        showGridlines
        stripedRows
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        stateStorage="local"
        stateKey="dispatch-jobs-table-state"
        :pt="dtPtOptions"
      >
        <template #empty>No jobs found matching your criteria.</template>
        <template #loading>Loading job data. Please wait...</template>

        <Column expander style="width: 3rem" />
        
        <Column field="id" header="Ticket ID" sortable style="min-width: 8rem">
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search by ID" class="w-full" v-if="!filterModel.constraints" />
            <InputText type="text" placeholder="Search by ID" class="w-full" 
                     :value="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : ''"
                     @input="e => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = e.target.value : null"
                     v-else />
          </template>
        </Column>
        
        <Column field="customerName" header="Customer Name" sortable style="min-width: 12rem">
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search by customer" class="w-full" v-if="!filterModel.constraints" />
            <InputText type="text" placeholder="Search by customer" class="w-full" 
                     :value="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : ''"
                     @input="e => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = e.target.value : null"
                     v-else />
          </template>
        </Column>
        
        <Column field="subject" header="Subject" sortable style="min-width: 15rem">
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search by subject" class="w-full" v-if="!filterModel.constraints" />
            <InputText type="text" placeholder="Search by subject" class="w-full" 
                     :value="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : ''"
                     @input="e => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = e.target.value : null"
                     v-else />
          </template>
        </Column>
        
        <Column field="status" header="Status" sortable style="min-width: 8rem">
          <template #filter="{ filterModel }">
            <Select v-model="filterModel.value" :options="statusOptions" placeholder="Select status" class="w-full" showClear v-if="!filterModel.constraints" />
            <Select :options="statusOptions" placeholder="Select status" class="w-full" showClear
                  :modelValue="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : null"
                  @update:modelValue="val => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = val : null"
                  v-else />
          </template>
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getSeverity(data.status)" />
          </template>
        </Column>
        
        <Column field="billingStatus" header="Billing" sortable style="min-width: 8rem">
          <template #filter="{ filterModel }">
            <Select v-model="filterModel.value" :options="billingStatusOptions" placeholder="Billing status" class="w-full" showClear v-if="!filterModel.constraints" />
            <Select :options="billingStatusOptions" placeholder="Billing status" class="w-full" showClear
                  :modelValue="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : null"
                  @update:modelValue="val => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = val : null"
                  v-else />
          </template>
          <template #body="{ data }">
            <Tag :value="data.billing?.billingStatus" :severity="getBillingSeverity(data.billing?.billingStatus)" />
          </template>
        </Column>
        
        <Column field="cityState" header="City / State" sortable style="min-width: 10rem">
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search by location" class="w-full" v-if="!filterModel.constraints" />
            <InputText type="text" placeholder="Search by location" class="w-full" 
                     :value="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : ''"
                     @input="e => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = e.target.value : null"
                     v-else />
          </template>
        </Column>
        
        <Column field="serviceDate" header="Service Date" sortable style="min-width: 8rem">
          <template #filter="{ filterModel }">
            <DatePicker v-model="filterModel.value" selectionMode="range" dateFormat="mm/dd/yy" placeholder="Select date range" class="w-full" v-if="!filterModel.constraints" />
            <DatePicker selectionMode="range" dateFormat="mm/dd/yy" placeholder="Select date range" class="w-full"
                      :modelValue="filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value : null"
                      @update:modelValue="val => filterModel.constraints && filterModel.constraints[0] ? filterModel.constraints[0].value = val : null"
                      v-else />
          </template>
          <template #body="{ data }">
            {{ formatDate(data.serviceDate) }}
          </template>
        </Column>
        
        <Column header="Actions" style="min-width: 8rem">
          <template #body="{ data }">
            <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm mr-2" tooltip="View Details" @click="viewDetails(data)" />
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" tooltip="Edit" />
            <Button icon="pi pi-calendar" class="p-button-rounded p-button-text p-button-sm" tooltip="Schedule" />
          </template>
        </Column>

        <template #expansion="slotProps">
          <div class="bg-surface-50 dark:bg-surface-800 p-4 border-round mx-1">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
                  <h5 class="text-base font-semibold m-0 mb-2 flex items-center">
                    <i class="pi pi-info-circle mr-2 text-primary"></i>Job Details
                  </h5>
                  <div class="flex flex-column gap-2">
                    <div>
                      <span class="text-xs text-color-secondary">Job ID:</span>
                      <p class="m-0 font-semibold">{{slotProps.data.id}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Customer:</span>
                      <p class="m-0 font-semibold">{{slotProps.data.customerName}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Subject:</span>
                      <p class="m-0 line-clamp-2 hover:line-clamp-none">{{slotProps.data.subject}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Status:</span>
                      <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                    </div>
                  </div>
                  <div class="flex justify-content-end mt-3">
                    <Button icon="pi pi-arrow-right" label="View Details" size="small" @click="viewDetails(slotProps.data)" />
                  </div>
                </div>
              </div>

              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
                  <h5 class="text-base font-semibold m-0 mb-2 flex items-center">
                    <i class="pi pi-calendar mr-2 text-primary"></i>Schedule
                  </h5>
                  <div class="flex flex-column gap-2">
                    <div>
                      <span class="text-xs text-color-secondary">Service Date:</span>
                      <p class="m-0 font-semibold">{{formatDate(slotProps.data.serviceDate)}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Arrival Window:</span>
                      <p class="m-0">{{slotProps.data.arrivalWindow || 'Not specified'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Location:</span>
                      <p class="m-0">{{slotProps.data.cityState || 'Unknown'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Time on Site:</span>
                      <p class="m-0">{{slotProps.data.timeOnSite || 'N/A'}}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
                  <h5 class="text-base font-semibold m-0 mb-2 flex items-center">
                    <i class="pi pi-user mr-2 text-primary"></i>Technician
                  </h5>
                  <div class="flex flex-column gap-2">
                    <div>
                      <span class="text-xs text-color-secondary">Assigned To:</span>
                      <p class="m-0 font-semibold">{{slotProps.data.technicianInfo?.name || 'Unassigned'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Technician Notes:</span>
                      <p class="m-0 line-clamp-3 hover:line-clamp-none">{{slotProps.data.technicianInfo?.comments || 'No notes provided'}}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
                  <h5 class="text-base font-semibold m-0 mb-2 flex items-center">
                    <i class="pi pi-wallet mr-2 text-primary"></i>Billing
                  </h5>
                  <div class="flex flex-column gap-2">
                    <div>
                      <span class="text-xs text-color-secondary">Billing Status:</span>
                      <Tag :value="slotProps.data.billing?.billingStatus || 'Not Billed'" :severity="getBillingSeverity(slotProps.data.billing?.billingStatus)" />
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Amount:</span>
                      <p class="m-0 font-semibold">{{slotProps.data.billing?.finalBilledAmount || '$0.00'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-color-secondary">Invoice #:</span>
                      <p class="m-0">{{slotProps.data.billing?.invoiceNumber || 'Not invoiced'}}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
                  <h5 class="text-base font-semibold m-0 mb-2 flex items-center">
                    <i class="pi pi-file-edit mr-2 text-primary"></i>Notes
                  </h5>
                  <p class="m-0 line-clamp-3 hover:line-clamp-none">{{slotProps.data.jobDetails?.dispatchNotes || 'No notes available'}}</p>
                </div>
              </div>

              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
                  <h5 class="text-base font-semibold m-0 mb-2 flex items-center">
                    <i class="pi pi-wrench mr-2 text-primary"></i>Scope of Work
                  </h5>
                  <p class="m-0 line-clamp-3 hover:line-clamp-none">
                    {{slotProps.data.jobDetails?.scopeOfWork || 'No scope of work provided'}}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataTable>
      <div class="px-3 py-2 text-sm text-right text-surface-500 dark:text-surface-400 border-t border-surface-200 dark:border-surface-700">
        Showing {{ jobsFiltered.length }} records
      </div>
    </div>

    <!-- Focus Areas Drawer -->
    <Drawer v-model:visible="visibleFocus" position="right" class="max-w-md !w-full">
      <template #header>
        <span class="text-xl font-semibold">Focus Areas</span>
      </template>
      <div class="grid grid-cols-1 gap-3 mt-4">
        <KpiCard v-for="fa in focusAreas" :key="fa.key"
                 :title="fa.label"
                 :value="focusCounts[fa.key]"
                 :accentColor="fa.accent"
                 :icon="fa.icon"
                 :subtitle="focusFilter===fa.key ? 'Active' : ''"
                 :hasChange="false"
                 @click="toggleFocusFilter(fa.key)"/>
      </div>
      <template #footer>
        <Button label="Clear Focus" class="w-full" @click="clearFocusAndCloseDrawer" />
      </template>
    </Drawer>
  </div>
</template>

<style scoped>
/* Remove all @apply directives and replace with direct classes in the template */
/* Keep only the line-clamp utilities since they're specialized */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hover\:line-clamp-none:hover {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  overflow: visible;
}
</style> 