<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
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
import PermissionGuard from '@/components/PermissionGuard.vue';

// Custom filter for date ranges
FilterService.register('dateRange', (value, filter) => {
  if (!filter || !filter[0] || !filter[1] || !value) return true;
  const date = new Date(value);
  return date >= filter[0] && date <= filter[1];
});

// Initialize the stores
const customerStore = useCustomerStore();
const dispatchStore = useDispatchStore();
// Extract reactive state with storeToRefs
const { customers, loading: customerLoading } = storeToRefs(customerStore);
const { dispatchRows, loading: dispatchLoading } = storeToRefs(dispatchStore);

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
  ...customers.value
]);
const isLoadingCustomers = computed(() => customerLoading.value);

// DataTable state
const expandedRows = ref({});
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  id: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
  customerName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  subject: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  'billing.billingStatus': { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  cityState: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  serviceDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: 'dateRange' }] }
});

// DataTable pass-through (pt) properties for consistent styling
const tablePassthrough = {
  root: { class: 'border border-surface-200 rounded-lg overflow-hidden' },
  header: { class: 'bg-surface-50 dark:bg-surface-800 p-4' },
  footer: { class: 'bg-surface-50 dark:bg-surface-800 p-3' }
};

// Column pass-through (pt) properties
const columnPassthrough = {
  headerCell: { class: 'bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-medium' },
  bodyCell: { class: 'p-3' }
};

// Safe global filter access with computed property
const globalFilterValue = computed({
  get: () => filters.value.global?.value || '',
  set: (val) => {
    filters.value.global.value = val;
  }
});
const loading = computed(() => dispatchLoading.value);
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
    id: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    customerName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    subject: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    'billing.billingStatus': { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    cityState: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    serviceDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: 'dateRange' }] }
  };
}

// Methods
const clearFilter = () => {
  initFilters();
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
  console.log('[DEBUG] JobsView: Starting applyFilters');
  
  const params = {};
  
  // Customer filter
  if (selectedCustomer.value && selectedCustomer.value.number) {
    console.log('[DEBUG] JobsView: Applying customer filters:', selectedCustomer.value);
    params.customer_id = parseInt(selectedCustomer.value.number, 10);
  } else {
    console.log('[DEBUG] JobsView: No customer filters selected');
  }
  
  // Status filter
  if (selectedStatuses.value && selectedStatuses.value.length > 0) {
    console.log('[DEBUG] JobsView: Applying status filters:', selectedStatuses.value);
    params.statuses = selectedStatuses.value.join(',');
  } else {
    console.log('[DEBUG] JobsView: No status filters selected');
  }
  
  // Date range filter
  let dateFrom = null;
  let dateTo = null;
  
  console.log('[DEBUG] JobsView: Selected date range:', selectedDateRange.value);
  
  if (selectedDateRange.value === 'custom' && customDateRange.value && customDateRange.value.length === 2) {
    console.log('[DEBUG] JobsView: Custom date range selected:', customDateRange.value);
    dateFrom = customDateRange.value[0];
    dateTo = customDateRange.value[1];
  } else {
    console.log('[DEBUG] JobsView: Predefined date range:', selectedDateRange.value);
    const range = computePredefinedRange(selectedDateRange.value);
    if (range) {
      console.log('[DEBUG] JobsView: Calculated date range:', 
        { start: range.start.toISOString(), end: range.end.toISOString() });
      dateFrom = range.start;
      dateTo = range.end;
    }
  }
  if (dateFrom && dateTo) {
    params.date_from = format(dateFrom, 'yyyy-MM-dd');
    params.date_to = format(dateTo, 'yyyy-MM-dd');
    console.log('[DEBUG] JobsView: Final date parameters:', 
      { date_from: params.date_from, date_to: params.date_to });
  }

  console.log('[DEBUG] JobsView: Calling dispatchStore.fetchDispatchData with params:', params);
  await dispatchStore.fetchDispatchData(params);
  console.log('[DEBUG] JobsView: fetchDispatchData completed');
  console.log('[DEBUG] JobsView: Received rows count:', dispatchStore.dispatchRows.length);
  console.log('[DEBUG] JobsView: Error state:', dispatchStore.error);
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

// Initialize filters immediately
initFilters();

// Fetch active customers on component mount
onMounted(() => {
  customerStore.fetchActiveCustomers();
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
  // Container styling
  root: { class: 'border-0 shadow-sm' },
  wrapper: { class: 'overflow-x-auto overflow-y-auto' },
  table: { class: 'w-full border-collapse' },
  
  // Header styling with sticky positioning
  thead: { class: 'bg-surface-50 dark:bg-surface-800 sticky top-0 z-10' },
  th: { 
    root: { 
      class: 'text-sm font-semibold text-surface-700 dark:text-white/80 p-3 text-left border-b border-surface-200 dark:border-surface-700' 
    }
  },
  
  // Body styling
  tbody: { class: 'divide-y divide-surface-200 dark:divide-surface-700' },
  bodyrow: ({ context }) => ({
    class: [
      'transition-colors duration-150 hover:bg-surface-50 dark:hover:bg-surface-700/50',
      { 'bg-yellow-50 dark:bg-yellow-900/20': context.data?.status === 'On Hold' },
      { 'bg-green-50 dark:bg-green-900/20': context.data?.status === 'Completed' },
      { 'bg-blue-50 dark:bg-blue-900/20': context.data?.status === 'In Progress' },
      { 'bg-orange-50 dark:bg-orange-900/20': context.data?.status === 'Scheduled' }
    ]
  }),
  td: { 
    root: { 
      class: 'text-sm text-surface-700 dark:text-white/80 p-3 align-middle border-b border-surface-200 dark:border-surface-700' 
    } 
  },
  
  // Expansion row styling
  rowexpansion: {
    class: 'bg-surface-50 dark:bg-surface-800 border-0'
  },
  rowexpander: {
    class: 'p-2 text-surface-500 dark:text-surface-400 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700'
  },
  rowtogglericon: {
    class: 'text-surface-600 dark:text-surface-400'
  },
  
  // Paginator styling
  paginator: {
    template: {
      layout: 'RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport',
      CurrentPageReport: ({ currentPage, totalPages, first, last, totalRecords }) => (
        `Page ${currentPage} of ${totalPages} (${first + 1} - ${last} of ${totalRecords})`
      )
    },
    root: { class: 'border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-2 flex items-center justify-between flex-wrap gap-2' },
    firstPageButton: { class: 'p-1.5 min-w-8 h-8 rounded-md hover:bg-surface-200 dark:hover:bg-surface-700' },
    prevPageButton: { class: 'p-1.5 min-w-8 h-8 rounded-md hover:bg-surface-200 dark:hover:bg-surface-700' },
    nextPageButton: { class: 'p-1.5 min-w-8 h-8 rounded-md hover:bg-surface-200 dark:hover:bg-surface-700' },
    lastPageButton: { class: 'p-1.5 min-w-8 h-8 rounded-md hover:bg-surface-200 dark:hover:bg-surface-700' },
    pageButton: ({ context }) => ({
        class: [
        'p-1.5 min-w-8 h-8 rounded-md',
        context.active 
          ? 'bg-primary-500 text-white hover:bg-primary-600' 
          : 'hover:bg-surface-200 dark:hover:bg-surface-700'
        ]
    }),
    currentPageReport: { class: 'text-sm text-surface-600 dark:text-surface-400 mx-2' },
    rowsPerPageDropdown: {
      root: { class: 'mx-2' },
      panel: { class: 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-md rounded-md' }
    }
  },
  
  // Filter styling
  filteroverlay: { 
    class: 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg rounded-md min-w-[250px] z-20' 
  },
  filterheader: { 
    class: 'p-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex items-center justify-between' 
  },
  filterfooter: { 
    class: 'p-3 flex gap-2 justify-end border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800' 
  },
  filterclearbutton: { 
    class: 'px-3 py-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700' 
  },
  filterapplybutton: { 
    class: 'px-3 py-1.5 rounded-md bg-primary-500 text-white hover:bg-primary-600' 
  },
  filtermenubutton: { 
    class: 'p-1.5 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700' 
  },
  filtermatchmodeoperator: {
    class: 'mb-2'
  },
  
  // Loading and empty states
  loadingoverlay: { 
    class: 'bg-white/70 dark:bg-surface-900/70 absolute inset-0 flex items-center justify-center z-10' 
  },
  loadingicon: { 
    class: 'text-primary-500 text-4xl animate-spin' 
  },
  
  // Global filter styling
  globalFilter: {
    root: { class: 'flex items-center' },
    input: { class: 'p-2 min-w-[200px]' }
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

// Add a drawerPtOptions object with similar styling to JobDetailsView.vue
const drawerPtOptions = {
  root: { 
    class: 'bg-white dark:bg-surface-900 shadow-lg',
    style: 'max-width: 32rem; width: 100%' // Using style instead of class for width
  },
  header: { 
    class: 'px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800'
  },
  title: {
    class: 'text-xl font-bold text-surface-800 dark:text-white'
  },
  content: { 
    class: 'p-4 overflow-y-auto'
  },
  footer: { 
    class: 'p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800'
  },
  closeButton: {
    class: 'p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors'
  },
  closeButtonIcon: {
    class: 'text-surface-600 dark:text-surface-400'
  },
  mask: {
    class: 'bg-black/40'
  },
  transition: {
    enterFromClass: 'translate-x-full',
    enterActiveClass: 'transition-transform duration-300 ease-out',
    enterToClass: 'translate-x-0',
    leaveFromClass: 'translate-x-0',
    leaveActiveClass: 'transition-transform duration-300 ease-in',
    leaveToClass: 'translate-x-full'
  }
};
</script>

<template>
  <div class="p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Field Service Jobs</h1>
      <p class="text-color-secondary">Track and manage field service jobs with multiple visits</p>
    </div>

    <!-- Filter section - Updated with improved form layout patterns -->
    <div class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 mb-4 p-4">
      <!-- Using flex flex-col gap-4 for the main form container -->
      <form class="flex flex-col gap-4" @submit.prevent="applyFilters">
        <!-- First row with customer and date range - using flex flex-col md:flex-row gap-4 for responsive behavior -->
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Each field group uses flex flex-col gap-2 for label and input -->
          <div class="flex flex-col gap-2 w-full">
            <label for="customerSelect" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Customer</label>
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
              aria-label="Select customer"
            />
          </div>
          
          <div class="flex flex-col gap-2 w-full">
            <label for="dateRangeSelect" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Date Range</label>
            <Select 
              id="dateRangeSelect"
              v-model="selectedDateRange"
              :options="dateRangeOptions"
              optionLabel="label" 
              optionValue="value" 
              placeholder="Select date range" 
              class="w-full"
              aria-label="Select date range"
            />
          </div>
        </div>
        
        <!-- Second row with custom date range and actions -->
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Custom date range picker -->
          <div class="flex flex-col gap-2 w-full">
            <label for="customRangePicker" class="text-xs font-semibold text-surface-600 dark:text-surface-300">Custom Range</label>
            <DatePicker 
              id="customRangePicker"
              v-model="customDateRange" 
              selectionMode="range"
              :disabled="!isCustomDateRange" 
              placeholder="Select date range" 
              class="w-full"
              dateFormat="mm/dd/yy"
              aria-label="Custom date range"
              aria-describedby="dateRangeHint"
            />
            <small id="dateRangeHint" class="text-sm text-surface-500 dark:text-surface-400">
              Select "Custom Range" above to enable this picker
            </small>
          </div>
          
          <!-- Action buttons with flex-end to align to the right -->
          <div class="flex flex-col gap-2 w-full justify-end">
            <div class="text-xs font-semibold text-surface-600 dark:text-surface-300 invisible">Actions</div>
            <div class="flex gap-2 items-center">
              <Button 
                type="submit" 
                label="Load Data" 
                icon="pi pi-download" 
                :disabled="!selectedCustomer" 
                size="small" 
              />
              <Button 
                type="button"
                label="Reset" 
                icon="pi pi-undo" 
                severity="secondary" 
                outlined 
                @click="resetFilters" 
                size="small" 
              />
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- KPI Metrics -->
    <div v-if="jobs.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <KpiCard title="Total Dispatches" :value="totalDispatches" :subtitle="statusSummary" icon="pi-list" accentColor="#60a5fa" />
      <KpiCard title="Total Billed" :value="totalBilledCount" :subtitle="`$${totalBilledAmount.toLocaleString()}`" icon="pi-wallet" accentColor="#22c55e" />
      <KpiCard title="Total Unbilled" :value="unbilledCount" icon="pi-exclamation-circle" accentColor="#f59e0b" />
      <KpiCard title="Avg Days to Invoice" :value="daysToInvoiceStats.avg.toFixed(1)" :subtitle="`Min ${daysToInvoiceStats.min} / Max ${daysToInvoiceStats.max}`" icon="pi-clock" accentColor="#a855f7" />
    </div>

    <!-- Table controls section with improved layout -->
    <div class="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-surface-200 dark:border-surface-700">
        <!-- Left side buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <Button type="button" icon="pi pi-filter-slash" label="Clear Filters" outlined @click="clearFilter" size="small" />
          <Button type="button" icon="pi pi-plus" label="Expand All" outlined @click="expandAll" size="small" />
          <Button type="button" icon="pi pi-minus" label="Collapse All" outlined @click="collapseAll" size="small" />
        </div>
        
        <!-- Right side search and actions -->
        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <InputGroup size="small" class="w-full sm:w-auto">
            <InputGroupAddon>
              <i class="pi pi-search" />
            </InputGroupAddon>
            <InputText 
              v-model="globalFilterValue" 
              placeholder="Search jobs..." 
              aria-label="Search jobs"
              class="w-full"
            />
          </InputGroup>
          <Button label="Focus Areas" icon="pi pi-filter" outlined @click="visibleFocus=true" size="small" />
          <Button label="Remove Focus" icon="pi pi-times" outlined severity="secondary" @click="clearFocus" size="small" />
          <Button label="Export CSV" icon="pi pi-file-export" outlined @click="exportCSV(dtRef)" size="small" />
          <PermissionGuard :permissions="['jobs:create']">
            <Button 
              icon="pi pi-plus" 
              label="New Job" 
              class="p-button-primary"
              @click="navigateToNewJob" 
            />
          </PermissionGuard>
        </div>
      </div>
      
      <DataTable 
        ref="dtRef"
        v-model:expandedRows="expandedRows"
        v-model:filters="filters"
        :value="jobsFiltered" 
        paginator 
        :rows="rowsPerPage"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        dataKey="id" 
        :rowHover="true"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['id', 'customerName', 'subject', 'status', 'billing.billingStatus', 'cityState', 'serviceDate']"
        showGridlines
        stripedRows
        resizableColumns
        columnResizeMode="fit"
        scrollable
        scrollHeight="calc(100vh - 420px)"
        removableSort
        tableStyle="min-width: 100%"
        :pt="dtPtOptions"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center p-6">
            <i class="pi pi-search text-4xl text-surface-400 mb-4"></i>
            <span class="text-surface-700 dark:text-surface-300">No jobs found matching your criteria.</span>
          </div>
        </template>
        <template #loading>
          <div class="flex flex-col items-center justify-center p-6">
            <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
            <span>Loading job data. Please wait...</span>
          </div>
        </template>

        <Column expander :exportable="false" style="width: 3rem; flex: 0 0 3rem;" />
        
        <Column field="id" header="Ticket ID" sortable style="width: 8rem; min-width: 8rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by ID" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
        </Column>
        
        <Column field="customerName" header="Customer Name" sortable style="width: 12rem; min-width: 12rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by customer" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
        </Column>
        
        <Column field="subject" header="Subject" sortable style="width: 15rem; min-width: 15rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by subject" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
        </Column>
        
        <Column field="status" header="Status" sortable style="width: 8rem; min-width: 8rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <Select v-model="filterModel.value" :options="statusOptions" placeholder="Select status" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getSeverity(data.status)" />
          </template>
        </Column>
        
        <Column field="billing.billingStatus" header="Billing" sortable style="width: 8rem; min-width: 8rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <Select v-model="filterModel.value" :options="billingStatusOptions" placeholder="Billing status" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
          <template #body="{ data }">
            <Tag :value="data.billing?.billingStatus" :severity="getBillingSeverity(data.billing?.billingStatus)" />
          </template>
        </Column>
        
        <Column field="cityState" header="City / State" sortable style="width: 10rem; min-width: 10rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <InputText v-model="filterModel.value" type="text" placeholder="Search by location" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
        </Column>
        
        <Column field="serviceDate" header="Service Date" sortable style="width: 10rem; min-width: 8rem;" :pt="columnPassthrough">
          <template #filter="{ filterModel, filterCallback }">
            <div class="flex flex-col gap-2">
              <DatePicker v-model="filterModel.value" selectionMode="range" dateFormat="mm/dd/yy" placeholder="Select date range" class="w-full" />
              <div class="flex justify-between">
                <Button type="button" icon="pi pi-times" label="Clear" size="small" text @click="() => { filterModel.value = null; filterCallback(); }" />
                <Button type="button" icon="pi pi-check" label="Apply" size="small" @click="filterCallback()" severity="primary" text />
              </div>
            </div>
          </template>
          <template #body="{ data }">
            {{ formatDate(data.serviceDate) }}
          </template>
        </Column>
        
        <Column header="Actions" :exportable="false" style="width: 8rem; min-width: 8rem;">
          <template #body="{ data }">
            <div class="flex justify-center">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm mr-1" tooltip="View Details" @click="viewDetails(data)" />
              <PermissionGuard :permissions="['jobs:update']">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-1" tooltip="Edit" />
              </PermissionGuard>
              <Button icon="pi pi-calendar" class="p-button-rounded p-button-text p-button-sm" tooltip="Schedule" />
            </div>
          </template>
        </Column>

        <template #expansion="slotProps">
          <div class="bg-surface-50 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Job Details Card -->
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm h-full border border-surface-200 dark:border-surface-700">
                  <h5 class="text-base font-medium m-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-info-circle text-primary-500"></i>Job Details
                  </h5>
                  <div class="space-y-2">
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Job ID:</span>
                      <p class="m-0 font-medium">{{slotProps.data.id}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Customer:</span>
                      <p class="m-0 font-medium">{{slotProps.data.customerName}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Subject:</span>
                      <p class="m-0 line-clamp-2 hover:line-clamp-none">{{slotProps.data.subject}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Status:</span>
                      <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <Button icon="pi pi-arrow-right" label="View Details" size="small" @click="viewDetails(slotProps.data)" />
                  </div>
                </div>
              </div>

              <!-- Schedule Card -->
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm h-full border border-surface-200 dark:border-surface-700">
                  <h5 class="text-base font-medium m-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-calendar text-primary-500"></i>Schedule
                  </h5>
                  <div class="space-y-2">
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Service Date:</span>
                      <p class="m-0 font-medium">{{formatDate(slotProps.data.serviceDate)}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Arrival Window:</span>
                      <p class="m-0">{{slotProps.data.arrivalWindow || 'Not specified'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Location:</span>
                      <p class="m-0">{{slotProps.data.cityState || 'Unknown'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Time on Site:</span>
                      <p class="m-0">{{slotProps.data.timeOnSite || 'N/A'}}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Technician Card -->
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm h-full border border-surface-200 dark:border-surface-700">
                  <h5 class="text-base font-medium m-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-user text-primary-500"></i>Technician
                  </h5>
                  <div class="space-y-2">
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Assigned To:</span>
                      <p class="m-0 font-medium">{{slotProps.data.technicianInfo?.name || 'Unassigned'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Technician Notes:</span>
                      <p class="m-0 line-clamp-3 hover:line-clamp-none">{{slotProps.data.technicianInfo?.comments || 'No notes provided'}}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Billing Card -->
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm h-full border border-surface-200 dark:border-surface-700">
                  <h5 class="text-base font-medium m-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-wallet text-primary-500"></i>Billing
                  </h5>
                  <div class="space-y-2">
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Billing Status:</span>
                      <Tag :value="slotProps.data.billing?.billingStatus || 'Not Billed'" :severity="getBillingSeverity(slotProps.data.billing?.billingStatus)" />
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Amount:</span>
                      <p class="m-0 font-medium">{{slotProps.data.billing?.finalBilledAmount || '$0.00'}}</p>
                    </div>
                    <div>
                      <span class="text-xs text-surface-500 dark:text-surface-400 block">Invoice #:</span>
                      <p class="m-0">{{slotProps.data.billing?.invoiceNumber || 'Not invoiced'}}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notes Card -->
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm h-full border border-surface-200 dark:border-surface-700">
                  <h5 class="text-base font-medium m-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-file-edit text-primary-500"></i>Notes
                  </h5>
                  <p class="m-0 line-clamp-4 hover:line-clamp-none">{{slotProps.data.jobDetails?.dispatchNotes || 'No notes available'}}</p>
                </div>
              </div>

              <!-- Scope of Work Card -->
              <div class="col-span-1">
                <div class="bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm h-full border border-surface-200 dark:border-surface-700">
                  <h5 class="text-base font-medium m-0 mb-3 flex items-center gap-2">
                    <i class="pi pi-wrench text-primary-500"></i>Scope of Work
                  </h5>
                  <p class="m-0 line-clamp-4 hover:line-clamp-none">
                    {{slotProps.data.jobDetails?.scopeOfWork || 'No scope of work provided'}}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataTable>
      <div class="px-4 py-3 text-sm text-right text-surface-500 dark:text-surface-400 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        Showing {{ jobsFiltered.length }} records
      </div>
    </div>

    <!-- Focus Areas Drawer -->
    <Drawer v-model:visible="visibleFocus" position="right" :pt="drawerPtOptions">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-filter text-primary-500 text-xl"></i>
          <span class="text-xl font-semibold">Focus Areas</span>
        </div>
      </template>
      <div class="flex flex-col gap-3">
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

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hover\:line-clamp-none:hover {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  overflow: visible;
}

/* DataTable Responsiveness */
:deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

:deep(.p-datatable-table) {
  min-width: 100%;
  table-layout: auto;
}

@media screen and (max-width: 768px) {
  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
  }
  
  :deep(.p-datatable .p-column-header-content),
  :deep(.p-datatable .p-column-title) {
    font-size: 0.875rem;
  }
}
</style> 