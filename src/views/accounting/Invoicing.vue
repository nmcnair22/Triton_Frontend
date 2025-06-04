<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { formatCurrency, formatDate, formatDueDate, groupInvoiceItems } from '@/lib/utils';
import { useToast } from 'primevue/usetoast';
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import { useLayout } from '@/layout/composables/layout';
import { Chart as ChartJS } from 'chart.js';

// Optional import of ChartDataLabels - will use if available
let ChartDataLabels;
try {
  ChartDataLabels = require('chartjs-plugin-datalabels');
  if (ChartDataLabels.default) {
    ChartDataLabels = ChartDataLabels.default;
  }
  // Register Chart.js plugins if available
  ChartJS.register(ChartDataLabels);
} catch (e) {
  console.warn('chartjs-plugin-datalabels not available, labels will not be shown');
}

// Initialize the layout
const { layoutConfig, isDarkTheme } = useLayout();

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
const selectedCustomer = ref(null);
const customerInvoices = computed(() => invoiceStore.customerInvoices || []);
const selectedCustomerInvoice = ref(null);
const isLoadingCustomers = computed(() => customerStore.loading);
const customerError = computed(() => customerStore.error);
const isLoadingCustomerInvoices = computed(() => invoiceStore.loadingCustomerInvoices);

// Chart data loading state
const isLoadingChartData = ref(false);

// Dashboard customer stats
const customerStats = reactive({
  totalOpen: 0,
  totalPaid: 0,
  totalOverdue: 0,
  overdueCount: 0,
  avgDaysToPay: 0,
  openChange: 5, // Example values
  paidChange: 10 // Example values
});

// Chart data and options
const invoiceStatusData = ref(null);
const invoiceStatusOptions = ref(null);
const paymentHistoryData = ref(null);
const paymentHistoryOptions = ref(null);

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
    selectedCustomer.value = null;
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
  if (!selectedCustomer.value) {
    return;
  }
  
  try {
    // Build a filter query for the selected customer
    const filterCondition = `customerId eq ${selectedCustomer.value.id}`;
    
    await invoiceStore.fetchCustomerInvoices(filterCondition, {
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
  refreshChartData();
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
        
        // Log the same fields from the mapped data for comparison
        if (enrichedInvoice.enrichedItems && enrichedInvoice.enrichedItems.length > 0) {
          const firstMappedItem = enrichedInvoice.enrichedItems[0];
          console.log('Same fields from first mapped item:');
          console.log('  documentNo:', firstMappedItem.documentNo);
          console.log('  genProdPostingGroup:', firstMappedItem.genProdPostingGroup);
          console.log('  jobNo:', firstMappedItem.jobNo);
          console.log('  jobTaskNo:', firstMappedItem.jobTaskNo);
          console.log('  cisId:', firstMappedItem.cisId);
          console.log('  jobContractEntryNo:', firstMappedItem.jobContractEntryNo);
        }
      }
      
      // Update products with the enriched data
      if (enrichedInvoice.enrichedItems && enrichedInvoice.enrichedItems.length > 0) {
        products.value = enrichedInvoice.enrichedItems.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          price: formatCurrency(item.unitPrice),
          total: formatCurrency(item.amountIncludingTax),
          // Store the original item data for grouping
          rawItem: item
        }));
        
        // Apply grouping if needed
        applyGrouping();
      }
    }
  } catch (err) {
    console.error('Error fetching enriched invoice data:', err);
  }
}

// Function to apply grouping to products
function applyGrouping() {
  if (selectedGroupBy.value.value === 'none' || !products.value || products.value.length === 0) {
    isRegrouping.value = false;
    groupedProducts.value = [];
    groupNames.value = [];
    return;
  }
  
  isRegrouping.value = true;
  
  // Small delay to ensure the loading spinner shows
  setTimeout(() => {
    // Get raw item data for grouping
    const rawItems = products.value.map(product => product.rawItem);
    
    // Group items using the utility function
    const { groups, groupNames: names } = groupInvoiceItems(rawItems, selectedGroupBy.value.value);
    
    // Add the groupType to each group for display
    const groupsWithType = groups.map(group => ({
      ...group,
      groupType: selectedGroupBy.value.name
    }));
    
    // Update reactive state
    groupedProducts.value = groupsWithType;
    groupNames.value = names;
    
    isRegrouping.value = false;
  }, 300);
}

// Watch for changes in selectedGroupBy
watch(selectedGroupBy, () => {
  applyGrouping();
});

// Watch for changes in selected invoice
watch(selectedInvoice, (newInvoice) => {
  if (newInvoice && isInteractive.value) {
    // If interactive mode is already on when invoice selection changes
    fetchEnrichedInvoiceData(newInvoice.number || newInvoice.id);
  }
});

// Function to refresh chart data
function refreshChartData() {
  if (!selectedCustomer.value) return;
  
  isLoadingChartData.value = true;
  
  // This would ideally fetch real data from the API
  setTimeout(() => {
    setupChartData();
    isLoadingChartData.value = false;
  }, 500);
}

// Setup chart data with computed styles
function setupChartData() {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
  const fontFamily = documentStyle.getPropertyValue('--font-family');
  
  // Update customer stats based on customer invoices
  updateCustomerStats();
  
  // Create gradients for pie chart
  const ctx = document.createElement('canvas').getContext('2d');
  
  const createGradient = (colorStart, colorEnd) => {
    if (!ctx) return colorStart;
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };
  
  // Gradient colors for pie chart
  const paidGradient = createGradient(
    documentStyle.getPropertyValue('--p-green-400'),
    documentStyle.getPropertyValue('--p-green-600')
  );
  
  const openGradient = createGradient(
    documentStyle.getPropertyValue('--p-blue-400'),
    documentStyle.getPropertyValue('--p-blue-600')
  );
  
  const overdueGradient = createGradient(
    documentStyle.getPropertyValue('--p-red-400'),
    documentStyle.getPropertyValue('--p-red-600')
  );
  
  // Invoice Status Pie Chart
  invoiceStatusData.value = {
    labels: ['Paid', 'Open', 'Overdue'],
    datasets: [
      {
        data: [
          customerStats.totalPaid,
          customerStats.totalOpen - customerStats.totalOverdue,
          customerStats.totalOverdue
        ],
        backgroundColor: [
          paidGradient,
          openGradient,
          overdueGradient
        ],
        hoverBackgroundColor: [
          documentStyle.getPropertyValue('--p-green-300'),
          documentStyle.getPropertyValue('--p-blue-300'),
          documentStyle.getPropertyValue('--p-red-300')
        ],
        borderColor: 'white',
        borderWidth: 1
      }
    ]
  };

  // Base options for the pie chart
  invoiceStatusOptions.value = {
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: textColor,
          font: {
            family: fontFamily || "'Inter', sans-serif",
            size: 11,
            weight: '500'
          },
          padding: 10,
          boxWidth: 8,
          boxHeight: 8,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((acc, value) => acc + value, 0);
              
              return data.labels.map((label, i) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                // Use 1 decimal place max for the currency display in legend
                const formattedValue = formatCurrency(value, true, 1);
                
                return {
                  text: `${label}: ${formattedValue} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: documentStyle.getPropertyValue('--surface-900'),
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: fontFamily || "'Inter', sans-serif",
          size: 12,
          weight: '600'
        },
        bodyFont: {
          family: fontFamily || "'Inter', sans-serif",
          size: 11
        },
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            // Use 1 decimal place max for the currency display in tooltip
            return `${context.label}: ${formatCurrency(value, true, 1)} (${percentage}%)`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };
  
  // Add datalabels plugin configuration if available - but we're setting display to false
  if (typeof ChartDataLabels !== 'undefined') {
    invoiceStatusOptions.value.plugins.datalabels = {
      display: false // Turn off datalabels in favor of tooltips and legend
    };
  }
  
  // 6 Month Payment History Line Chart
  const months = getLast6Months();
  
  // Generate sample data for the past 6 months
  const paidData = months.map(() => Math.floor(Math.random() * 10000));
  const openData = months.map(() => Math.floor(Math.random() * 5000));
  const overdueData = months.map(() => Math.floor(Math.random() * 2000));
  
  // Create gradient backgrounds for line charts
  const paidBgGradient = createGradient(
    documentStyle.getPropertyValue('--p-green-400') + '20', // 20 is hex for 12% opacity
    'rgba(0, 0, 0, 0)'
  );
  
  const openBgGradient = createGradient(
    documentStyle.getPropertyValue('--p-blue-400') + '20',
    'rgba(0, 0, 0, 0)'
  );
  
  const overdueBgGradient = createGradient(
    documentStyle.getPropertyValue('--p-red-400') + '20',
    'rgba(0, 0, 0, 0)'
  );
  
  paymentHistoryData.value = {
    labels: months,
    datasets: [
      {
        label: 'Paid',
        data: paidData,
        fill: true,
        backgroundColor: paidBgGradient,
        borderColor: documentStyle.getPropertyValue('--p-green-500'),
        borderWidth: 2,
        pointBackgroundColor: documentStyle.getPropertyValue('--p-green-500'),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: documentStyle.getPropertyValue('--p-green-500'),
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4
      },
      {
        label: 'Open',
        data: openData,
        fill: true,
        backgroundColor: openBgGradient,
        borderColor: documentStyle.getPropertyValue('--p-blue-500'),
        borderWidth: 2,
        pointBackgroundColor: documentStyle.getPropertyValue('--p-blue-500'),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: documentStyle.getPropertyValue('--p-blue-500'),
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4
      },
      {
        label: 'Overdue',
        data: overdueData,
        fill: true,
        backgroundColor: overdueBgGradient,
        borderColor: documentStyle.getPropertyValue('--p-red-500'),
        borderWidth: 2,
        pointBackgroundColor: documentStyle.getPropertyValue('--p-red-500'),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: documentStyle.getPropertyValue('--p-red-500'),
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4
      }
    ]
  };

  paymentHistoryOptions.value = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'center',
        labels: {
          usePointStyle: true,
          color: textColor,
          font: {
            family: fontFamily || "'Inter', sans-serif",
            size: 11,
            weight: '500'
          },
          padding: 15,
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: documentStyle.getPropertyValue('--surface-900'),
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: documentStyle.getPropertyValue('--surface-border'),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        titleFont: {
          family: fontFamily || "'Inter', sans-serif",
          size: 12,
          weight: '600'
        },
        bodyFont: {
          family: fontFamily || "'Inter', sans-serif",
          size: 11
        },
        callbacks: {
          label: function(context) {
            // Use 1 decimal place max for the currency display in tooltip
            return `${context.dataset.label}: ${formatCurrency(context.raw, true, 1)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
          font: {
            family: fontFamily || "'Inter', sans-serif",
            size: 10
          }
        },
        grid: {
          color: surfaceBorder + '30', // 30 is hex for 18% opacity
          display: true,
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: textColorSecondary,
          font: {
            family: fontFamily || "'Inter', sans-serif",
            size: 10
          },
          callback: function(value) {
            // Format with no more than 1 decimal place
            return formatCurrency(value, false, 1);
          },
          maxTicksLimit: 5
        },
        grid: {
          color: surfaceBorder + '40', // 40 is hex for 25% opacity
          display: true,
          drawBorder: false
        },
        beginAtZero: true
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeOutQuad',
        from: 0.8,
        to: 0.4
      }
    }
  };
}

// Function to get last 6 months names
function getLast6Months() {
  const months = [];
  const date = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push(month.toLocaleString('default', { month: 'short' }));
  }
  return months;
}

// Update customer stats based on selected customer's invoices
function updateCustomerStats() {
  if (!customerInvoices.value || customerInvoices.value.length === 0) {
    // Set default values if no invoices
    customerStats.totalOpen = 0;
    customerStats.totalPaid = 0;
    customerStats.totalOverdue = 0;
    customerStats.overdueCount = 0;
    customerStats.avgDaysToPay = 0;
    return;
  }

  // Calculate total open and paid amounts
  let openAmount = 0;
  let paidAmount = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  
  // Current date for overdue calculation
  const currentDate = new Date();

  customerInvoices.value.forEach(invoice => {
    if (invoice.status === 'paid') {
      paidAmount += invoice.total;
    } else {
      openAmount += invoice.total;
      
      // Check if invoice is overdue
      const dueDate = new Date(invoice.dueDate);
      if (dueDate < currentDate) {
        overdueAmount += invoice.remainingAmount;
        overdueCount++;
      }
    }
  });

  // Update stats
  customerStats.totalOpen = openAmount;
  customerStats.totalPaid = paidAmount;
  customerStats.totalOverdue = overdueAmount;
  customerStats.overdueCount = overdueCount;
  
  // Calculate average days to pay (sample calculation - would be more accurate with real data)
  customerStats.avgDaysToPay = 15; // Example value
}

// Watch for changes in selected customer or theme to update charts
watch([selectedCustomer, () => layoutConfig.primary, isDarkTheme], () => {
  if (selectedCustomer.value) {
    setupChartData();
  }
});

// Watch for changes in customer invoices to update dashboard stats
watch(customerInvoices, () => {
  if (customerInvoices.value && selectedCustomer.value) {
    updateCustomerStats();
    setupChartData();
  }
});
</script>
<template>
    <Toast position="bottom-center" group="invoice-bottom" />
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Invoicing</h5>
                
                <div class="mb-4 p-2" style="display: flex; align-items: center;">
                    <!-- Select taking exactly 35% width -->
                    <div style="width: 35%;">
                        <Select 
                            v-model="selectedCustomer" 
                            :options="customerStore.customers" 
                            optionLabel="name" 
                            placeholder="Select Customer"
                            filter
                            :disabled="isLoadingCustomers"
                            @change="onCustomerChange"
                            class="w-full" />
                    </div>
                    
                    <!-- Fixed spacing between Select and toggle -->
                    <div style="margin-left: 2rem; display: flex; align-items: center;">
                        <label style="margin-right: 0.5rem;">Full list / Only active customers</label>
                        <ToggleSwitch v-model="customerListType" @change="onCustomerListTypeChange" />
                    </div>
                </div>
                
                <!-- Invoice Dashboard Charts - Only visible when a customer is selected -->
                <div v-if="selectedCustomer" class="card mb-4">
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-surface-900 dark:text-surface-0 text-xl font-semibold">{{ selectedCustomer.name }}'s Invoice Summary</span>
                        <Button icon="pi pi-refresh" text rounded @click="refreshChartData" :disabled="isLoadingChartData" />
                    </div>
                    
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Stats Cards - 4 cards in a 2x2 grid spanning 4 columns -->
                        <div class="col-span-12 lg:col-span-4 xl:col-span-3">
                            <div class="grid grid-cols-2 gap-3">
                                <!-- Total Open -->
                                <div class="col-span-1">
                                    <div class="p-3 rounded bg-white dark:bg-surface-800 shadow-sm h-full border border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-surface-600 dark:text-surface-300 text-sm">Total Open</span>
                                                <div class="text-surface-900 dark:text-surface-0 text-lg font-medium mt-1">{{ formatCurrency(customerStats.totalOpen) }}</div>
                                            </div>
                                            <i class="pi pi-dollar text-green-500 text-xl"></i>
                                        </div>
                                        <div class="mt-2 flex items-center">
                                            <i class="pi pi-arrow-up text-green-500 text-xs mr-1" v-if="customerStats.openChange > 0"></i>
                                            <i class="pi pi-arrow-down text-red-500 text-xs mr-1" v-else-if="customerStats.openChange < 0"></i>
                                            <i class="pi pi-minus text-500 text-xs mr-1" v-else></i>
                                            <span class="text-xs" :class="customerStats.openChange > 0 ? 'text-green-500' : (customerStats.openChange < 0 ? 'text-red-500' : 'text-500')">
                                                {{ Math.abs(customerStats.openChange) }}% since last month
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Total Paid -->
                                <div class="col-span-1">
                                    <div class="p-3 rounded bg-white dark:bg-surface-800 shadow-sm h-full border border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-surface-600 dark:text-surface-300 text-sm">Total Paid</span>
                                                <div class="text-surface-900 dark:text-surface-0 text-lg font-medium mt-1">{{ formatCurrency(customerStats.totalPaid) }}</div>
                                            </div>
                                            <i class="pi pi-check-circle text-blue-500 text-xl"></i>
                                        </div>
                                        <div class="mt-2 flex items-center">
                                            <i class="pi pi-arrow-up text-green-500 text-xs mr-1" v-if="customerStats.paidChange > 0"></i>
                                            <i class="pi pi-arrow-down text-red-500 text-xs mr-1" v-else-if="customerStats.paidChange < 0"></i>
                                            <i class="pi pi-minus text-500 text-xs mr-1" v-else></i>
                                            <span class="text-xs" :class="customerStats.paidChange > 0 ? 'text-green-500' : (customerStats.paidChange < 0 ? 'text-red-500' : 'text-500')">
                                                {{ Math.abs(customerStats.paidChange) }}% since last month
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Overdue -->
                                <div class="col-span-1">
                                    <div class="p-3 rounded bg-white dark:bg-surface-800 shadow-sm h-full border border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-surface-600 dark:text-surface-300 text-sm">Overdue</span>
                                                <div class="text-red-500 text-lg font-medium mt-1">{{ formatCurrency(customerStats.totalOverdue) }}</div>
                                            </div>
                                            <i class="pi pi-exclamation-circle text-red-500 text-xl"></i>
                                        </div>
                                        <div class="mt-2 flex items-center">
                                            <i class="pi pi-calendar text-500 text-xs mr-1"></i>
                                            <span class="text-xs text-500">{{ customerStats.overdueCount }} invoice(s) overdue</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Average Days to Pay -->
                                <div class="col-span-1">
                                    <div class="p-3 rounded bg-white dark:bg-surface-800 shadow-sm h-full border border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-surface-600 dark:text-surface-300 text-sm">Avg Days to Pay</span>
                                                <div class="text-surface-900 dark:text-surface-0 text-lg font-medium mt-1">{{ customerStats.avgDaysToPay }} days</div>
                                            </div>
                                            <i class="pi pi-calendar-check text-primary text-xl"></i>
                                        </div>
                                        <div class="mt-2 flex items-center">
                                            <i class="pi pi-chart-line text-500 text-xs mr-1"></i>
                                            <span class="text-xs text-500">Based on last 6 months</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Invoice Status Pie Chart -->
                        <div class="col-span-12 lg:col-span-3">
                            <div class="p-3 rounded bg-white dark:bg-surface-800 shadow-sm h-full border border-surface-200 dark:border-surface-700">
                                <span class="text-surface-900 dark:text-surface-0 text-sm font-semibold">Invoice Status</span>
                                <div style="height: 180px" class="flex justify-center">
                                    <Chart type="pie" :data="invoiceStatusData" :options="invoiceStatusOptions" />
                                </div>
                            </div>
                        </div>
                        
                        <!-- 6 Month Payment History Line Chart -->
                        <div class="col-span-12 lg:col-span-5 xl:col-span-6">
                            <div class="p-3 rounded bg-white dark:bg-surface-800 shadow-sm h-full border border-surface-200 dark:border-surface-700">
                                <span class="text-surface-900 dark:text-surface-0 text-sm font-semibold">6 Month Payment History</span>
                                <div style="height: 180px">
                                    <Chart type="line" :data="paymentHistoryData" :options="paymentHistoryOptions" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card p-4 mb-4">
                    <DataTable v-model:selection="selectedCustomerInvoice" :value="customerInvoices || []" dataKey="id"
                             :paginator="true" :rows="lazyParams.rows" :totalRecords="totalInvoiceRecords"
                             :loading="isLoadingCustomerInvoices" :rowHover="true" stripedRows
                             :metaKeySelection="false" selectionMode="single"
                             filterDisplay="menu" v-model:filters="filters"
                             :globalFilterFields="['number', 'customerName', 'dueDate', 'total', 'remainingAmount', 'status']"
                             @page="onPage" @row-select="onCustomerInvoiceSelect" @sort="onSort"
                             :rowsPerPageOptions="rowsPerPageOptions" @rows-change="onRowsPerPageChange"
                             :rowClass="getRowClass"
                             tableStyle="min-width: 50rem">
                        <template #header>
                            <div class="flex justify-between">
                                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                                <IconField>
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="filters['global'].value" placeholder="Search Invoice" />
                                </IconField>
                            </div>
                        </template>
                        <template #empty>
                            <div class="flex flex-column align-items-center p-5">
                                <i class="pi pi-file text-5xl text-primary mb-3"></i>
                                <span v-if="!selectedCustomer" class="text-lg">Please select a customer above to view invoices</span>
                                <span v-else class="text-lg">No invoices found for the selected customer</span>
                            </div>
                        </template>
                        <template #loading>Loading customer invoices...</template>
                        
                        <Column field="customerName" header="Customer" style="min-width: 10rem" sortable>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by customer" class="p-column-filter" />
                            </template>
                        </Column>
                        <Column field="number" header="Invoice #" style="min-width: 8rem" sortable>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by number" class="p-column-filter" />
                            </template>
                        </Column>
                        <Column field="dueDate" header="Due Date" style="min-width: 10rem" sortable>
                            <template #body="slotProps">
                                <span :class="formatDueDate(slotProps.data.dueDate, slotProps.data.status).class">
                                    {{ formatDueDate(slotProps.data.dueDate, slotProps.data.status).message }}
                                </span>
                            </template>
                            <template #filter="{ filterModel }">
                                <DatePicker v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                            </template>
                        </Column>
                        <Column field="total" header="Invoice Total" dataType="numeric" style="min-width: 10rem" sortable
                               :showFilterMatchModes="true" 
                               :filterMatchModeOptions="[
                                 {label: 'Equals', value: FilterMatchMode.EQUALS},
                                 {label: 'Less Than', value: FilterMatchMode.LESS_THAN},
                                 {label: 'Greater Than', value: FilterMatchMode.GREATER_THAN},
                                 {label: 'Less Than or Equal To', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO},
                                 {label: 'Greater Than or Equal To', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
                               ]">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.total) }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputNumber v-model="filterModel.value" mode="currency" currency="USD" locale="en-US" class="p-column-filter" placeholder="Search by amount" />
                            </template>
                        </Column>
                        <Column field="remainingAmount" header="Amount Due" dataType="numeric" style="min-width: 10rem" sortable
                               :showFilterMatchModes="true" 
                               :filterMatchModeOptions="[
                                 {label: 'Equals', value: FilterMatchMode.EQUALS},
                                 {label: 'Less Than', value: FilterMatchMode.LESS_THAN},
                                 {label: 'Greater Than', value: FilterMatchMode.GREATER_THAN},
                                 {label: 'Less Than or Equal To', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO},
                                 {label: 'Greater Than or Equal To', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
                               ]">
                            <template #body="slotProps">
                                <span :class="{'text-red-500 font-medium': slotProps.data.remainingAmount > 0}">
                                    {{ formatCurrency(slotProps.data.remainingAmount) }}
                                </span>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputNumber v-model="filterModel.value" mode="currency" currency="USD" locale="en-US" class="p-column-filter" placeholder="Search by amount" />
                            </template>
                        </Column>
                        <Column field="status" header="Status" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status" :severity="slotProps.data.status === 'open' ? 'info' : (slotProps.data.status === 'paid' ? 'success' : 'warning')" />
                            </template>
                            <template #filter="{ filterModel }">
                                <Select v-model="filterModel.value" :options="['open', 'unpaid', 'paid']" placeholder="Select Status" class="p-column-filter" showClear>
                                    <template #option="slotProps">
                                        <Tag :value="slotProps.option" 
                                             :severity="slotProps.option === 'open' ? 'info' : (slotProps.option === 'paid' ? 'success' : 'warning')" />
                                    </template>
                                </Select>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
            
            <div class="col-12 mt-4">
                <div class="card p-0 overflow-hidden shadow-lg border-0 rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
                    <!-- Loading state -->
                    <div v-if="isLoading" class="flex justify-center items-center p-12">
                        <div class="text-center">
                            <ProgressSpinner class="w-16 h-16" />
                            <div class="mt-6 text-lg font-medium text-surface-600 dark:text-surface-400">Loading invoice details...</div>
                            <div class="mt-2 text-sm text-surface-500 dark:text-surface-500">Please wait while we fetch the invoice information</div>
                        </div>
                    </div>
                    
                    <!-- Error message -->
                    <div v-else-if="error" class="flex justify-center items-center p-12">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="pi pi-info-circle text-2xl text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <div class="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">No Invoice Selected</div>
                            <div class="text-sm text-surface-500 dark:text-surface-500">Please select an invoice from the table above to view details</div>
                        </div>
                    </div>
                    
                    <!-- Invoice content -->
                    <div v-else-if="selectedInvoice">
                        <!-- Modern Invoice Header with Gradient Background -->
                        <div class="relative text-white" style="background: linear-gradient(135deg, #082944 0%, #297FB7 100%);">
                            <div class="absolute inset-0 bg-black/10"></div>
                            <div class="relative px-8 py-10">
                                <div class="flex items-start justify-between mb-8">
                                    <!-- Company Branding Section -->
                                    <div class="flex-1">
                                        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                            <img src="/layout/images/cis-logo-tagline-white.png" alt="CIS Logo" width="180" height="45" class="mb-4" />
                                            <div class="text-white/90 text-sm leading-relaxed">
                                                <div>1023 Calle Sombra Unit B</div>
                                                <div>San Clemente, CA 92673</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Invoice Title & Interactive Toggle -->
                                    <div class="flex flex-col items-end gap-4">
                                        <ToggleButton 
                                            v-model="isInteractive" 
                                            onLabel="Interactive Mode" 
                                            offLabel="Standard View" 
                                            onIcon="pi pi-cog" 
                                            offIcon="pi pi-eye" 
                                            :class="isInteractive ? 'p-button-success' : 'p-button-secondary'"
                                            class="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                                        />
                                        <div class="text-right">
                                            <div class="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">Invoice</div>
                                            <div class="text-3xl font-bold text-white">{{ selectedInvoice?.number || selectedInvoice?.id || '' }}</div>
                                            <div class="mt-2">
                                                <Tag :value="selectedInvoice?.status?.toUpperCase() || 'UNKNOWN'" 
                                                     :severity="selectedInvoice?.status === 'paid' ? 'success' : selectedInvoice?.status === 'open' ? 'info' : 'warning'"
                                                     class="text-sm font-medium px-3 py-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Invoice Details Section -->
                        <div class="px-8 py-8">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <!-- Bill To Section -->
                                <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
                                    <div class="flex items-center gap-2 mb-4">
                                        <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                            <i class="pi pi-user text-primary-600 dark:text-primary-400 text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Bill To</h3>
                                    </div>
                                    <div class="space-y-3">
                                        <div class="text-xl font-bold text-surface-900 dark:text-surface-0">
                                            {{ selectedInvoice?.customer?.company || selectedInvoice?.customer?.name || 'N/A' }}
                                        </div>
                                        <div class="text-surface-600 dark:text-surface-400 leading-relaxed" 
                                             v-html="selectedInvoice?.customer?.address?.replace(/\n/g, '<br />') || 'No address provided'">
                                        </div>
                                        <div v-if="selectedInvoice?.customer?.id" class="inline-flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-sm">
                                            <i class="pi pi-id-card text-xs text-surface-500"></i>
                                            <span class="text-surface-700 dark:text-surface-300">ID: {{ selectedInvoice.customer.id }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Invoice Information -->
                                <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
                                    <div class="flex items-center gap-2 mb-4">
                                        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                            <i class="pi pi-calendar text-blue-600 dark:text-blue-400 text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Invoice Details</h3>
                                    </div>
                                    <div class="space-y-4">
                                        <div class="flex justify-between items-center py-2 border-b border-surface-100 dark:border-surface-700">
                                            <span class="text-surface-600 dark:text-surface-400 font-medium">Issue Date</span>
                                            <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ formatDate(selectedInvoice?.date) || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center py-2 border-b border-surface-100 dark:border-surface-700">
                                            <span class="text-surface-600 dark:text-surface-400 font-medium">Due Date</span>
                                            <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ formatDate(selectedInvoice?.dueDate) || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center py-2 border-b border-surface-100 dark:border-surface-700">
                                            <span class="text-surface-600 dark:text-surface-400 font-medium">Customer ID</span>
                                            <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ selectedInvoice?.customer?.id || 'N/A' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center py-2">
                                            <span class="text-surface-600 dark:text-surface-400 font-medium">Payment Status</span>
                                            <Tag :value="selectedInvoice?.status?.toUpperCase() || 'UNKNOWN'" 
                                                 :severity="selectedInvoice?.status === 'paid' ? 'success' : selectedInvoice?.status === 'open' ? 'info' : 'warning'"
                                                 class="font-medium" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Interactive Tools Panel -->
                            <div v-if="isInteractive" class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <i class="pi pi-cog text-white"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Interactive Analysis Tools</h3>
                                        <p class="text-sm text-surface-600 dark:text-surface-400">Group and analyze invoice line items by different criteria</p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label for="groupBy" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Group By Category</label>
                                        <Select 
                                            id="groupBy"
                                            v-model="selectedGroupBy" 
                                            :options="groupByOptions" 
                                            optionLabel="name" 
                                            placeholder="Select Grouping Method"
                                            class="w-full"
                                        />
                                    </div>
                                    <div class="flex items-end">
                                        <div class="text-sm text-surface-600 dark:text-surface-400">
                                            <i class="pi pi-info-circle mr-1"></i>
                                            Grouping helps analyze spending patterns and service categories
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Invoice Items Section -->
                            <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
                                <div class="bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-700 px-6 py-4 border-b border-surface-200 dark:border-surface-600">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                            <i class="pi pi-list text-green-600 dark:text-green-400 text-sm"></i>
                                        </div>
                                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Line Items</h3>
                                        <div v-if="products.length > 0" class="ml-auto">
                                            <Tag :value="`${products.length} items`" severity="info" class="text-xs" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="p-6">
                                    <!-- Regrouping loading state -->
                                    <div v-if="isRegrouping" class="flex justify-center items-center py-12">
                                        <div class="text-center">
                                            <ProgressSpinner class="w-12 h-12" />
                                            <div class="mt-4 text-surface-600 dark:text-surface-400">Analyzing and grouping items...</div>
                                        </div>
                                    </div>

                                    <!-- Standard non-grouped display -->
                                    <DataTable v-else-if="!isInteractive || selectedGroupBy.value === 'none'" 
                                             :value="products" 
                                             tableStyle="min-width: 50rem"
                                             :rowHover="true"
                                             stripedRows
                                             responsiveLayout="scroll"
                                             class="modern-invoice-table">
                                        <Column field="description" header="Description" class="font-medium">
                                            <template #body="slotProps">
                                                <div class="py-2">
                                                    <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.description }}</div>
                                                </div>
                                            </template>
                                        </Column>
                                        <Column field="quantity" header="Qty" class="text-center" style="width: 100px">
                                            <template #body="slotProps">
                                                <div class="text-center">
                                                    <span class="inline-flex items-center justify-center w-12 h-8 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm font-medium">
                                                        {{ slotProps.data.quantity }}
                                                    </span>
                                                </div>
                                            </template>
                                        </Column>
                                        <Column field="price" header="Unit Price" class="text-right" style="width: 120px">
                                            <template #body="slotProps">
                                                <div class="text-right font-medium text-surface-700 dark:text-surface-300">{{ slotProps.data.price }}</div>
                                            </template>
                                        </Column>
                                        <Column field="total" header="Amount" class="text-right" style="width: 120px">
                                            <template #body="slotProps">
                                                <div class="text-right font-bold text-surface-900 dark:text-surface-0">{{ slotProps.data.total }}</div>
                                            </template>
                                        </Column>
                                    </DataTable>

                                    <!-- Grouped display -->
                                    <div v-else-if="groupedProducts.length > 0" class="space-y-6">
                                        <div v-for="(group, index) in groupedProducts" :key="index" class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                                            <!-- Group Header -->
                                            <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 px-6 py-4 border-b border-primary-200 dark:border-primary-700">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                                                            <i class="pi pi-tag text-white text-sm"></i>
                                                        </div>
                                                        <div>
                                                            <h4 class="text-lg font-bold text-primary-900 dark:text-primary-100">{{ group.name }}</h4>
                                                            <p class="text-sm text-primary-700 dark:text-primary-300">{{ group.groupType }} • {{ group.items.length }} items</p>
                                                        </div>
                                                    </div>
                                                    <div class="text-right">
                                                        <div class="text-2xl font-bold text-primary-900 dark:text-primary-100">{{ formatCurrency(group.total) }}</div>
                                                        <div class="text-sm text-primary-700 dark:text-primary-300">Group Total</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Group Items DataTable -->
                                            <div class="bg-white dark:bg-surface-800">
                                                <DataTable :value="group.items.map(item => ({
                                                    description: item.description,
                                                    quantity: item.quantity.toString(),
                                                    price: formatCurrency(item.unitPrice),
                                                    total: formatCurrency(item.amountIncludingTax)
                                                }))" 
                                                tableStyle="min-width: 50rem"
                                                :rowHover="true"
                                                class="modern-invoice-table group-table">
                                                    <Column field="description" header="Description" class="font-medium">
                                                        <template #body="slotProps">
                                                            <div class="py-2">
                                                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.description }}</div>
                                                            </div>
                                                        </template>
                                                    </Column>
                                                    <Column field="quantity" header="Qty" class="text-center" style="width: 100px">
                                                        <template #body="slotProps">
                                                            <div class="text-center">
                                                                <span class="inline-flex items-center justify-center w-12 h-8 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm font-medium">
                                                                    {{ slotProps.data.quantity }}
                                                                </span>
                                                            </div>
                                                        </template>
                                                    </Column>
                                                    <Column field="price" header="Unit Price" class="text-right" style="width: 120px">
                                                        <template #body="slotProps">
                                                            <div class="text-right font-medium text-surface-700 dark:text-surface-300">{{ slotProps.data.price }}</div>
                                                        </template>
                                                    </Column>
                                                    <Column field="total" header="Amount" class="text-right" style="width: 120px">
                                                        <template #body="slotProps">
                                                            <div class="text-right font-bold text-surface-900 dark:text-surface-0">{{ slotProps.data.total }}</div>
                                                        </template>
                                                    </Column>
                                                </DataTable>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- No items message -->
                                    <div v-else class="text-center py-12">
                                        <div class="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <i class="pi pi-inbox text-2xl text-surface-400"></i>
                                        </div>
                                        <div class="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">No items found</div>
                                        <div class="text-sm text-surface-500 dark:text-surface-500">This invoice doesn't contain any line items</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Invoice Totals Section -->
                            <div class="mt-8 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-700 rounded-2xl p-8 border border-surface-200 dark:border-surface-700">
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <!-- Payment Information -->
                                    <div>
                                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                                            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <i class="pi pi-credit-card text-blue-600 dark:text-blue-400 text-sm"></i>
                                            </div>
                                            Payment Information
                                        </h3>
                                        <div class="space-y-3 text-sm">
                                            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                                                <i class="pi pi-building text-xs"></i>
                                                <span>Wire Transfer: CIS Business Account</span>
                                            </div>
                                            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                                                <i class="pi pi-credit-card text-xs"></i>
                                                <span>ACH: Routing 123456789</span>
                                            </div>
                                            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                                                <i class="pi pi-envelope text-xs"></i>
                                                <span>Questions? billing@cis.com</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Financial Summary -->
                                    <div class="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700">
                                        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-6">Invoice Summary</h3>
                                        <div class="space-y-4">
                                            <div class="flex justify-between items-center py-2 border-b border-surface-100 dark:border-surface-700">
                                                <span class="text-surface-600 dark:text-surface-400 font-medium">Subtotal</span>
                                                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(selectedInvoice?.subtotal) }}</span>
                                            </div>
                                            <div class="flex justify-between items-center py-2 border-b border-surface-100 dark:border-surface-700">
                                                <span class="text-surface-600 dark:text-surface-400 font-medium">Tax ({{ selectedInvoice?.vatRate || 0 }}%)</span>
                                                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(selectedInvoice?.vat) }}</span>
                                            </div>
                                            <div class="flex justify-between items-center py-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-4 border border-primary-200 dark:border-primary-800">
                                                <span class="text-lg font-bold text-primary-900 dark:text-primary-100">Total Amount</span>
                                                <span class="text-2xl font-bold text-primary-900 dark:text-primary-100">{{ formatCurrency(selectedInvoice?.total) }}</span>
                                            </div>
                                            <div v-if="selectedInvoice?.remainingAmount > 0" class="flex justify-between items-center py-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 border border-red-200 dark:border-red-800">
                                                <span class="text-lg font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                                                    <i class="pi pi-exclamation-triangle text-sm"></i>
                                                    Amount Due
                                                </span>
                                                <span class="text-2xl font-bold text-red-900 dark:text-red-100">{{ formatCurrency(selectedInvoice?.remainingAmount) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- No invoice selected state -->
                    <div v-else class="flex justify-center items-center p-12">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="pi pi-file text-2xl text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <div class="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">No Invoice Selected</div>
                            <div class="text-sm text-surface-500 dark:text-surface-500">Please select an invoice from the table above to view details</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Enhanced selected row styling */
:deep(.p-datatable .p-datatable-tbody > tr.p-datatable-row-selected) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%) !important;
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(59, 130, 246, 0.2) !important;
  transition: all 0.2s ease;
}

/* Dark mode selected row styling */
:deep(.dark .p-datatable .p-datatable-tbody > tr.p-datatable-row-selected) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%) !important;
  box-shadow: inset 0 0 0 2px rgba(96, 165, 250, 0.4), 0 2px 8px rgba(59, 130, 246, 0.3) !important;
}

/* Hover effect for selected rows */
:deep(.p-datatable .p-datatable-tbody > tr.p-datatable-row-selected:hover) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%) !important;
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

/* Dark mode hover effect for selected rows */
:deep(.dark .p-datatable .p-datatable-tbody > tr.p-datatable-row-selected:hover) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%) !important;
  box-shadow: inset 0 0 0 2px rgba(96, 165, 250, 0.5), 0 4px 12px rgba(59, 130, 246, 0.4) !important;
}

/* Remove the ::before pseudo-element that was creating the left border */
:deep(.p-datatable .p-datatable-tbody > tr.p-datatable-row-selected::before) {
  display: none;
}

/* Modern Invoice Table Styling */
:deep(.modern-invoice-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.modern-invoice-table .p-datatable-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e2e8f0;
  padding: 1rem;
}

:deep(.dark .modern-invoice-table .p-datatable-header) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-bottom: 2px solid #475569;
}

:deep(.modern-invoice-table .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e2e8f0;
  padding: 1rem 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
}

:deep(.dark .modern-invoice-table .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-bottom: 2px solid #475569;
  color: #cbd5e1;
}

:deep(.modern-invoice-table .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.dark .modern-invoice-table .p-datatable-tbody > tr) {
  border-bottom: 1px solid #334155;
}

:deep(.modern-invoice-table .p-datatable-tbody > tr:hover) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.dark .modern-invoice-table .p-datatable-tbody > tr:hover) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

:deep(.modern-invoice-table .p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  vertical-align: middle;
  border: none;
}

/* Group table specific styling */
:deep(.group-table .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  font-size: 0.875rem;
}

:deep(.group-table .p-datatable-thead > tr > th) {
  padding: 0.75rem;
  font-size: 0.8rem;
  background: #f8fafc;
}

:deep(.dark .group-table .p-datatable-thead > tr > th) {
  background: #1e293b;
}

/* Smooth animations for all interactive elements */
:deep(.p-button) {
  transition: all 0.2s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.p-card) {
  transition: all 0.2s ease;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.p-card:hover) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Enhanced tag styling */
:deep(.p-tag) {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Professional gradient backgrounds */
.invoice-gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.invoice-card-shadow {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
}

/* Responsive design improvements */
@media (max-width: 768px) {
  :deep(.modern-invoice-table .p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
    font-size: 0.875rem;
  }
  
  :deep(.modern-invoice-table .p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
}

/* Print-friendly styles */
@media print {
  .card {
    position: static !important;
    width: 100% !important;
    height: auto !important;
    box-shadow: none !important;
  }
  
  .bg-gradient-to-r {
    background: #1e40af !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .modern-invoice-table {
    box-shadow: none !important;
  }
}
</style>
