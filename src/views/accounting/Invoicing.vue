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
        titleColor: documentStyle.getPropertyValue('--text-color'),
        bodyColor: documentStyle.getPropertyValue('--text-color'),
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
                <div class="card p-5 overflow-auto shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05)]">
                    <!-- Loading state -->
                    <div v-if="isLoading" class="flex justify-center items-center p-4">
                        <ProgressSpinner />
                    </div>
                    
                    <!-- Error message -->
                    <div v-else-if="error" class="flex justify-center items-center p-4">
                        <Message severity="info">Please select an invoice from the table above to view details</Message>
                    </div>
                    
                    <!-- Invoice content -->
                    <div v-else-if="selectedInvoice">
                        <!-- Interactive tools panel - only shows when interactive mode is enabled -->
                        <div v-if="isInteractive" class="mb-4 p-3 border-1 border-surface-200 dark:border-surface-700">
                            <h5>Interactive Tools</h5>
                            <div class="field grid">
                                <label for="groupBy" class="col-12 md:col-2 md:mb-0 mb-2 font-medium">Group By:</label>
                                <div class="col-12 md:col-10">
                                    <Select 
                                        id="groupBy"
                                        v-model="selectedGroupBy" 
                                        :options="groupByOptions" 
                                        optionLabel="name" 
                                        placeholder="Select Grouping"
                                        class="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-start pt-6 px-6 pb-9 gap-6 flex-wrap-reverse">
                            <div class="flex-1">
                                <svg class="fill-surface-950 dark:fill-surface-0" width="125" height="32" viewBox="0 0 125 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M26.8844 16C27.5005 16 28.0045 15.4997 27.9555 14.8856C27.7658 12.5094 26.9717 10.2143 25.6405 8.222C24.1022 5.91972 21.9157 4.12531 19.3575 3.06569C16.7994 2.00607 13.9844 1.72882 11.2687 2.26901C8.55298 2.8092 6.05843 4.14257 4.1005 6.1005C2.14257 8.05843 0.809203 10.553 0.269011 13.2687C-0.27118 15.9844 0.00606599 18.7994 1.06569 21.3575C2.12531 23.9157 3.91972 26.1022 6.222 27.6405C8.21425 28.9717 10.5094 29.7658 12.8856 29.9555C13.4997 30.0045 14 29.5005 14 28.8844V25.5155C14 24.8994 13.4983 24.4076 12.8877 24.326C11.6208 24.1567 10.4041 23.6998 9.33319 22.9843C7.95182 22.0613 6.87517 20.7494 6.2394 19.2145C5.60362 17.6796 5.43728 15.9906 5.76139 14.3612C6.08551 12.7318 6.88553 11.235 8.06028 10.0603C9.23504 8.88553 10.7318 8.08551 12.3612 7.76139C13.9906 7.43728 15.6796 7.60362 17.2145 8.2394C18.7494 8.87517 20.0613 9.95182 20.9843 11.3332C21.6998 12.4041 22.1567 13.6208 22.326 14.8877C22.4076 15.4983 22.8994 16 23.5155 16H26.8844Z"
                                    />
                                    <path
                                        d="M20.3442 17.9561C20.4501 17.6123 20.1787 17.2829 19.819 17.2829H16.3982C15.7821 17.2829 15.2826 17.7823 15.2826 18.3984V21.8191C15.2826 22.1788 15.612 22.4502 15.9558 22.3443C18.0484 21.6999 19.6997 20.0487 20.3442 17.9561Z"
                                    />
                                    <path
                                        d="M23.1621 17.2829C22.6154 17.2829 22.1582 17.6844 22.013 18.2115C21.2385 21.0236 19.0234 23.2387 16.2113 24.0131C15.6842 24.1582 15.2826 24.6155 15.2826 25.1622V28.8845C15.2826 29.5006 15.7821 30 16.3982 30H18.6292C19.2453 30 19.7448 29.5006 19.7448 28.8845V25.0941C19.7448 24.8904 19.991 24.7885 20.135 24.9325L24.4655 29.263C24.9011 29.6986 25.6075 29.6986 26.0431 29.263L27.2627 28.0434C27.6983 27.6077 27.6983 26.9014 27.2627 26.4658L22.9322 22.1353C22.7882 21.9913 22.8902 21.745 23.0938 21.745H26.8842C27.5003 21.745 27.9997 21.2456 27.9997 20.6295V18.3984C27.9997 17.7823 27.5003 17.2829 26.8842 17.2829H23.1621Z"
                                    />
                                    <path
                                        d="M47.624 10.048C44.144 10.048 42.152 12.568 42.152 16.36C42.152 20.272 44.408 22.408 47.648 22.408C50.696 22.408 52.544 20.728 52.544 17.92V17.848H47.24V15.136H55.4V25H52.808L52.616 22.984C51.656 24.328 49.664 25.264 47.288 25.264C42.368 25.264 38.936 21.688 38.936 16.288C38.936 10.96 42.416 7.168 47.696 7.168C51.704 7.168 54.8 9.496 55.304 13.072H52.064C51.512 11.008 49.736 10.048 47.624 10.048ZM63.3494 25.312C59.8214 25.312 57.3494 22.744 57.3494 19.072C57.3494 15.352 59.7734 12.784 63.2534 12.784C66.8054 12.784 69.0614 15.16 69.0614 18.856V19.744L60.1334 19.768C60.3494 21.856 61.4534 22.912 63.3974 22.912C65.0054 22.912 66.0614 22.288 66.3974 21.16H69.1094C68.6054 23.752 66.4454 25.312 63.3494 25.312ZM63.2774 15.184C61.5494 15.184 60.4934 16.12 60.2054 17.896H66.1574C66.1574 16.264 65.0294 15.184 63.2774 15.184ZM74.0928 25H71.1648V13.144H73.8768L74.1168 14.68C74.8608 13.48 76.3008 12.784 77.9088 12.784C80.8848 12.784 82.4208 14.632 82.4208 17.704V25H79.4928V18.4C79.4928 16.408 78.5088 15.448 76.9968 15.448C75.1968 15.448 74.0928 16.696 74.0928 18.616V25ZM90.3616 25.312C86.8336 25.312 84.3616 22.744 84.3616 19.072C84.3616 15.352 86.7856 12.784 90.2656 12.784C93.8176 12.784 96.0736 15.16 96.0736 18.856V19.744L87.1456 19.768C87.3616 21.856 88.4656 22.912 90.4096 22.912C92.0176 22.912 93.0736 22.288 93.4096 21.16H96.1216C95.6176 23.752 93.4576 25.312 90.3616 25.312ZM90.2896 15.184C88.5616 15.184 87.5056 16.12 87.2176 17.896H93.1696C93.1696 16.264 92.0416 15.184 90.2896 15.184ZM97.265 21.4H100.049C100.073 22.432 100.841 23.08 102.185 23.08C103.553 23.08 104.297 22.528 104.297 21.664C104.297 21.064 103.985 20.632 102.929 20.392L100.793 19.888C98.657 19.408 97.625 18.4 97.625 16.504C97.625 14.176 99.593 12.784 102.329 12.784C104.993 12.784 106.793 14.32 106.817 16.624H104.033C104.009 15.616 103.337 14.968 102.209 14.968C101.057 14.968 100.385 15.496 100.385 16.384C100.385 17.056 100.913 17.488 101.921 17.728L104.057 18.232C106.049 18.688 107.057 19.6 107.057 21.424C107.057 23.824 105.017 25.312 102.089 25.312C99.137 25.312 97.265 23.728 97.265 21.4ZM110.51 10.768C109.502 10.768 108.71 9.976 108.71 8.992C108.71 8.008 109.502 7.24 110.51 7.24C111.47 7.24 112.262 8.008 112.262 8.992C112.262 9.976 111.47 10.768 110.51 10.768ZM109.046 25V13.144H111.974V25H109.046ZM113.847 21.4H116.631C116.655 22.432 117.423 23.08 118.767 23.08C120.135 23.08 120.879 22.528 120.879 21.664C120.879 21.064 120.567 20.632 119.511 20.392L117.375 19.888C115.239 19.408 114.207 18.4 114.207 16.504C114.207 14.176 116.175 12.784 118.911 12.784C121.575 12.784 123.375 14.32 123.399 16.624H120.615C120.591 15.616 119.919 14.968 118.791 14.968C117.639 14.968 116.967 15.496 116.967 16.384C116.967 17.056 117.495 17.488 118.503 17.728L120.639 18.232C122.631 18.688 123.639 19.6 123.639 21.424C123.639 23.824 121.599 25.312 118.671 25.312C115.719 25.312 113.847 23.728 113.847 21.4Z"
                                    />
                                </svg>
                                <div class="mt-3 body-xsmall text-left">CIS<br>1023 Calle Sombra Unit B San Clemente, CA 92673</div>
                            </div>
                            <div class="flex flex-col text-right">
                                <ToggleButton 
                                    v-model="isInteractive" 
                                    onLabel="Interactive On" 
                                    offLabel="Interactive Off" 
                                    onIcon="pi pi-check" 
                                    offIcon="pi pi-times" 
                                    :class="isInteractive ? 'p-button-outlined p-button-success' : 'p-button-outlined p-button-help'"
                                    class="mb-4"
                                />
                                <h1 class="title-h6">Invoice</h1>
                                <span class="mt-1.5 body-medium">{{ selectedInvoice?.number || selectedInvoice?.id || '' }}</span>
                            </div>
                        </div>
                        <Divider />
                        <div class="px-6 pb-9 pt-6 flex items-start gap-6 flex-wrap-reverse">
                            <div class="flex-1">
                                <div class="label-medium text-surface-500">Bill To:</div>
                                <div class="mt-2 label-medium">{{ selectedInvoice?.customer?.company || '' }}</div>
                                <div class="body-small text-left mt-0.5" v-html="selectedInvoice?.customer?.address.replace(/\n/g, '<br />') || ''"></div>
                            </div>
                            <div class="flex flex-col gap-3 min-w-64">
                                <div class="flex items-center justify-between gap-6">
                                    <span class="body-small">Client Name</span>
                                    <span class="label-small text-surface-950 dark:text-surface-0">{{ selectedInvoice?.customer?.name || '' }}</span>
                                </div>
                                <div class="flex items-center justify-between gap-6">
                                    <span class="body-small">Date</span>
                                    <span class="label-small text-surface-950 dark:text-surface-0">{{ formatDate(selectedInvoice?.date) || '' }}</span>
                                </div>
                                <div class="flex items-center justify-between gap-6">
                                    <span class="body-small">Due Date</span>
                                    <span class="label-small text-surface-950 dark:text-surface-0">{{ formatDate(selectedInvoice?.dueDate) || '' }}</span>
                                </div>
                                <div class="flex items-center justify-between gap-6">
                                    <span class="body-small">Customer</span>
                                    <span class="label-small text-surface-950 dark:text-surface-0">{{ selectedInvoice?.customer?.id || '' }}</span>
                                </div>
                            </div>
                        </div>
                        <Divider />
                        <!-- Invoice Items Section -->
                        <div>
                            <!-- Regrouping loading state -->
                            <div v-if="isRegrouping" class="flex justify-center items-center p-4">
                                <ProgressSpinner />
                            </div>

                            <!-- Standard non-grouped display (when interactive is off or no grouping selected) -->
                            <DataTable v-else-if="!isInteractive || selectedGroupBy.value === 'none'" 
                                     :value="products" tableStyle="min-width: 50rem">
                                <Column field="description" header="Description" />
                                <Column field="quantity" header="Quantity" />
                                <Column field="price" header="Unit Price" />
                                <Column field="total" header="Amount" />
                            </DataTable>

                            <!-- Grouped display (when interactive is on and grouping is selected) -->
                            <div v-else-if="groupedProducts.length > 0" class="grouped-invoice">
                                <div v-for="(group, index) in groupedProducts" :key="index" class="mb-5">
                                    <!-- Group Header -->
                                    <div class="flex justify-content-between align-items-center p-3 bg-surface-100 dark:bg-surface-800 mb-2 rounded">
                                        <h3 class="m-0 text-lg font-medium">
                                            <span class="font-bold">{{ group.groupType }}</span> : {{ group.name }}
                                        </h3>
                                    </div>
                                    
                                    <!-- Group Items DataTable -->
                                    <DataTable :value="group.items.map(item => ({
                                        description: item.description,
                                        quantity: item.quantity.toString(),
                                        price: formatCurrency(item.unitPrice),
                                        total: formatCurrency(item.amountIncludingTax)
                                    }))" class="mb-0" tableStyle="min-width: 50rem">
                                        <Column field="description" header="Description" />
                                        <Column field="quantity" header="Quantity" class="text-center" style="text-align: center;" />
                                        <Column field="price" header="Unit Price" />
                                        <Column field="total" header="Amount" />
                                    </DataTable>
                                    
                                    <!-- Group Subtotal with simple bottom border -->
                                    <div class="border-top-2 border-surface-200 dark:border-surface-700 mb-4">
                                        <div class="py-3" style="text-align: right; padding-right: 32px;">
                                            <span class="font-medium">{{ group.groupType }} Subtotal: <span class="font-bold">{{ formatCurrency(group.total) }}</span></span>
                                        </div>
                                    </div>
                                    
                                    <!-- Divider between groups (except for the last one) -->
                                    <Divider v-if="index < groupedProducts.length - 1" class="border-2 border-surface-200 dark:border-surface-700 my-4" />
                                </div>
                            </div>
                            
                            <!-- No items message -->
                            <div v-else class="p-4 text-center text-surface-400">
                                No items found for this invoice
                            </div>
                            
                            <div class="py-6 px-4 flex items-start gap-6 flex-wrap sm:flex-row flex-col">
                                <div class="flex-1 body-small text-left text-surface-950 dark:text-surface-0">
                                    <div v-if="selectedInvoice?.status" class="flex align-items-center gap-2">
                                        <span class="font-bold">Status:</span>
                                        <Tag :value="selectedInvoice.status" 
                                             :severity="selectedInvoice.status === 'open' ? 'info' : (selectedInvoice.status === 'paid' ? 'success' : 'warning')"
                                             class="text-base"></Tag>
                                    </div>
                                </div>
                                <div class="flex flex-col gap-3 min-w-52">
                                    <div class="flex items-center justify-between">
                                        <span class="label-small text-surface-950 dark:text-surface-0">Subtotal</span>
                                        <span>{{ formatCurrency(selectedInvoice?.subtotal) }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="label-small text-surface-950 dark:text-surface-0">Tax ({{ selectedInvoice?.vatRate || 0 }}%)</span>
                                        <span>{{ formatCurrency(selectedInvoice?.vat) }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="label-small text-surface-950 dark:text-surface-0">Total</span>
                                        <span>{{ formatCurrency(selectedInvoice?.total) }}</span>
                                    </div>
                                    <div class="flex items-center justify-between" v-if="selectedInvoice?.remainingAmount > 0">
                                        <span class="label-small text-red-500 font-medium">Amount Due</span>
                                        <span class="text-red-500 font-medium">{{ formatCurrency(selectedInvoice?.remainingAmount) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- No invoice selected state -->
                    <div v-else class="flex flex-column align-items-center p-5">
                        <i class="pi pi-file text-5xl text-primary mb-3"></i>
                        <span class="text-lg">Please select an invoice from the table above to view details</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
