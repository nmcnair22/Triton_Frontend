<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { formatCurrency, formatDate, formatDueDate, groupInvoiceItems } from '@/lib/utils';
import { useToast } from 'primevue/usetoast';
import { InvoiceService } from '@/service/ApiService';
import ExcelPreview from '@/components/ExcelPreview.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import Select from 'primevue/select';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import Drawer from 'primevue/drawer';
import ToggleButton from 'primevue/togglebutton';
import { useLayout } from '@/layout/composables/layout';
import Checkbox from 'primevue/checkbox';

// Initialize the stores
const invoiceStore = useInvoiceStore();
const customerStore = useCustomerStore();

// Initialize the layout
const { isDarkTheme } = useLayout();

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

// Template state
const selectedTemplate = ref(null);
const availableTemplates = computed(() => invoiceStore.availableTemplates || []);
const isLoadingTemplates = computed(() => invoiceStore.loadingTemplates);
const templatesError = computed(() => invoiceStore.templatesError);
const generatedFiles = computed(() => invoiceStore.generatedFiles || []);
const isLoadingGeneratedFiles = computed(() => invoiceStore.loadingGeneratedFiles);
const generatedFilesError = computed(() => invoiceStore.generatedFilesError);
const isGeneratingTemplate = computed(() => invoiceStore.generatingTemplate);
const generateTemplateError = computed(() => invoiceStore.generateTemplateError);
const customerDocuments = computed(() => invoiceStore.customerDocuments || []);
const isLoadingCustomerDocuments = computed(() => invoiceStore.loadingCustomerDocuments);
const customerDocumentsError = computed(() => invoiceStore.customerDocumentsError);

// File preview
const selectedFile = ref(null);
const showFilePreview = ref(false);
const activeDocumentTab = ref('customer'); // 'customer' or 'invoice'
const previewUrl = ref('');
const previewIframe = ref(null);
const previewError = ref(false);
const previewErrorMessage = ref('');
const previewLoaded = ref(false);

// Invoice detail drawer
const showInvoiceDrawer = ref(false);
const drawerSelectedInvoice = ref(null);
const drawerProducts = ref([]);
const drawerIsInteractive = ref(false);
const drawerSelectedGroupBy = ref({ name: 'None', value: 'none' });
const drawerGroupedProducts = ref([]);
const drawerIsRegrouping = ref(false);

// Merge functionality
const isMergeMode = ref(false);
const selectedInvoicesForMerge = ref([]);
const isMergingInvoices = ref(false);
const mergeResult = ref(null);
const mergeError = ref(null);
const showMergeHistory = ref(false);
const mergeHistoryData = ref([]);
const isLoadingMergeHistory = ref(false);

// Duplicate merge detection
const showDuplicateConfirmation = ref(false);
const duplicateDetails = ref(null);
const pendingMergeRequest = ref(null);

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
  try {
    // Only load customers initially, wait for customer selection to fetch invoices
    await loadCustomers();
  } catch (error) {
    console.error('Error loading initial data:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load initial data', 
      life: 3000 
    });
  }
});

// Function to load customers based on selected list type
async function loadCustomers() {
  console.log('👥 loadCustomers called - customer list type:', customerListType.value ? 'active' : 'full');
  
  try {
    if (customerListType.value) {
      await customerStore.fetchActiveCustomers();
    } else {
      await customerStore.fetchCustomers();
    }
    
    // Clear any previously selected customers when the list changes
    console.log('📄 Before clearing (loadCustomers) - generatedFiles:', generatedFiles.value.length, 'customerDocuments:', customerDocuments.value.length);
    selectedCustomer.value = null;
    selectedCustomerInvoice.value = null;
    selectedTemplate.value = null;
    // Clear documents when customer list changes
    invoiceStore.resetTemplateState();
    console.log('📄 After clearing (loadCustomers) - generatedFiles:', generatedFiles.value.length, 'customerDocuments:', customerDocuments.value.length);
  } catch (err) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load customers', 
      life: 3000 
    });
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
    
    await invoiceStore.fetchCustomerInvoices(filterCondition);
  } catch (err) {
    console.error('Failed to load customer invoices:', err);
  }
}

// Handle customer selection change
async function onCustomerChange() {
  console.log('🔄 onCustomerChange called - clearing documents');
  
  // Clear previous invoice selection and documents immediately
  selectedCustomerInvoice.value = null;
  selectedTemplate.value = null;
  
  // Ensure documents are cleared before proceeding
  console.log('📄 Before reset - generatedFiles:', generatedFiles.value.length, 'customerDocuments:', customerDocuments.value.length);
  invoiceStore.resetTemplateState();
  console.log('📄 After reset - generatedFiles:', generatedFiles.value.length, 'customerDocuments:', customerDocuments.value.length);
  
  // Set the active tab to customer documents
  activeDocumentTab.value = 'customer';
  
  // Load customer invoices
  await loadCustomerInvoices();
  
  // Load available templates and customer documents for the selected customer
  if (selectedCustomer.value) {
    console.log('👤 Loading data for customer:', selectedCustomer.value.name, 'ID:', selectedCustomer.value.id);
    await loadAvailableTemplates(selectedCustomer.value.id);
    // Load customer documents using the customer number
    console.log('📂 About to load customer documents for:', selectedCustomer.value.number);
    await loadCustomerDocuments(selectedCustomer.value.number);
    console.log('📂 After loading customer documents:', customerDocuments.value.length);
  } else {
    console.log('❌ No customer selected, skipping document load');
  }
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
async function onCustomerInvoiceSelect() {
  console.log('🧾 onCustomerInvoiceSelect called');
  
  if (selectedCustomerInvoice.value) {
    console.log('📋 Selected invoice:', selectedCustomerInvoice.value.number);
    
    // Clear previous documents immediately to prevent showing old data
    console.log('📄 Before reset (invoice) - generatedFiles:', generatedFiles.value.length, 'customerDocuments:', customerDocuments.value.length);
    invoiceStore.resetTemplateState();
    console.log('📄 After reset (invoice) - generatedFiles:', generatedFiles.value.length, 'customerDocuments:', customerDocuments.value.length);
    
    activeDocumentTab.value = 'invoice';
    // Load generated files for the selected invoice
    console.log('📂 About to load generated files for invoice:', selectedCustomerInvoice.value.number);
    await loadGeneratedFiles(selectedCustomerInvoice.value.number);
    console.log('📂 After loading generated files:', generatedFiles.value.length);
    
    // If there's a customer ID, refine the template list
    if (selectedCustomer.value && selectedCustomerInvoice.value.number) {
      await loadAvailableTemplates(selectedCustomer.value.id, selectedCustomerInvoice.value.number);
    }
  } else {
    console.log('❌ No invoice selected - clearing all documents');
    // If no invoice is selected, clear all documents
    invoiceStore.resetTemplateState();
    console.log('📄 After clearing (no invoice):', generatedFiles.value.length, customerDocuments.value.length);
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

// Function to get due date information with context
function getDueDateInfo(dueDate, status) {
  const date = new Date(dueDate);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  let contextInfo = '';
  let contextClass = 'text-surface-600 dark:text-surface-400';
  
  if (status === 'paid') {
    contextInfo = 'Paid';
    contextClass = 'text-green-600 dark:text-green-400';
  } else if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    contextInfo = `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;
    contextClass = 'text-red-600 dark:text-red-400 font-medium';
  } else if (diffDays === 0) {
    contextInfo = 'Due today';
    contextClass = 'text-orange-600 dark:text-orange-400 font-medium';
  } else if (diffDays <= 3) {
    contextInfo = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    contextClass = 'text-yellow-600 dark:text-yellow-400';
  } else if (diffDays <= 7) {
    contextInfo = `Due in ${diffDays} days`;
    contextClass = 'text-blue-600 dark:text-blue-400';
  } else {
    contextInfo = `Due in ${diffDays} days`;
  }
  
  return {
    date: formattedDate,
    context: contextInfo,
    contextClass
  };
}

// Watch for changes to interactive mode
watch(isInteractive, async (newValue) => {
  if (newValue) {
    // Show toast message when interactive mode is enabled
    toast.add({ severity: 'success', summary: 'Interactive Mode', detail: 'Interactive Mode has been enabled', life: 3000 });
    
    if (selectedInvoice.value) {
      // When interactive mode is enabled and an invoice is selected
      await fetchEnrichedInvoiceData(selectedInvoice.value.number || selectedInvoice.value.id);
    }
  } else {
    // Show toast message when interactive mode is disabled
    toast.add({ severity: 'info', summary: 'Interactive Mode', detail: 'Interactive Mode has been disabled', life: 3000 });
  }
});

// Function to fetch enriched invoice data
async function fetchEnrichedInvoiceData(documentNumber) {
  if (!documentNumber) return;
  
  try {
    await invoiceStore.fetchEnrichedInvoiceLines(documentNumber);
    
    const enrichedInvoice = invoiceStore.currentEnrichedInvoice;
    if (enrichedInvoice) {
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
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load enriched invoice data', 
      life: 3000 
    });
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
watch([selectedCustomer, () => document.documentElement.getAttribute('data-theme') === 'dark'], () => {
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

// Function to load available templates
async function loadAvailableTemplates(clientId, invoiceNumber = null) {
  if (!clientId) return;
  
  try {
    await invoiceStore.fetchAvailableTemplates(clientId, invoiceNumber);
    
    // Auto-select template if only one is available
    if (availableTemplates.value.length === 1) {
      selectedTemplate.value = availableTemplates.value[0];
    } else if (availableTemplates.value.length === 0) {
      selectedTemplate.value = null;
    }
  } catch (err) {
    console.error('Error loading available templates:', err);
    selectedTemplate.value = null;
  }
}

// Function to load customer documents
async function loadCustomerDocuments(customerNumber) {
  if (!customerNumber) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Warning', 
      detail: 'Customer number is required to load documents', 
      life: 3000 
    });
    return;
  }
  
  try {
    await invoiceStore.fetchCustomerDocuments(customerNumber);
    
    // Check for errors after loading
    if (invoiceStore.customerDocumentsError) {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: invoiceStore.customerDocumentsError, 
        life: 3000 
      });
    }
  } catch (err) {
    console.error('Error loading customer documents:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.message || 'Failed to load customer documents', 
      life: 3000 
    });
  }
}

// Function to load generated files for an invoice
async function loadGeneratedFiles(invoiceNumber) {
  if (!invoiceNumber) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Warning', 
      detail: 'Invoice number is required to load documents', 
      life: 3000 
    });
    return;
  }
  
  try {
    await invoiceStore.fetchGeneratedFiles(invoiceNumber);
    
    // Check for errors after loading
    if (invoiceStore.generatedFilesError) {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: invoiceStore.generatedFilesError, 
        life: 3000 
      });
    }
  } catch (err) {
    console.error('Error loading generated files:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.message || 'Failed to load invoice documents', 
      life: 3000 
    });
  }
}

// Function to generate a template document
async function generateTemplateDocument() {
  if (!selectedCustomerInvoice.value || !selectedTemplate.value) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Please select both an invoice and a template to generate', 
      life: 3000 
    });
    return;
  }
  
  try {
    const result = await invoiceStore.generateTemplate(
      selectedCustomerInvoice.value.number, 
      selectedTemplate.value.id
    );
    
    if (result) {
      toast.add({ 
        severity: 'success', 
        summary: 'Template Generated', 
        detail: 'Template document has been generated successfully', 
        life: 3000 
      });
      
      // Refresh the file list
      await loadGeneratedFiles(selectedCustomerInvoice.value.number);
      
      // Switch to the invoice documents tab
      activeDocumentTab.value = 'invoice';
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: generateTemplateError.value || 'Failed to generate template document', 
        life: 3000 
      });
    }
  } catch (err) {
    console.error('Error generating template:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.message || 'Failed to generate template document', 
      life: 3000 
    });
  }
}

// Function to download a generated file
async function downloadFile(file) {
  if (!file || (!file.id && !file.originalData?.id)) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'File ID is missing', 
      life: 3000 
    });
    return;
  }
  
  // Get the file ID from either the main object or the original data
  const fileId = file.id || file.originalData?.id || 'unknown';
  
  // Determine file type based on various properties
  let fileType = 'pdf'; // default
  if (file.fileType) {
    fileType = file.fileType;
  } else if (file.originalData?.type) {
    fileType = file.originalData.type;
  } else if (file.filename) {
    const filename = file.filename.toLowerCase();
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      fileType = 'excel';
    } else if (filename.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      fileType = 'word';
    }
  }
  
  // Get the subtype/fileCategory if available (important for PDF downloads)
  let subtype = null;
  if (file.fileCategory) {
    subtype = file.fileCategory;
  } else if (file.originalData?.subtype) {
    subtype = file.originalData.subtype;
  } else if (typeof fileId === 'string' && fileId.includes('_') && fileId.split('_').length > 2) {
    // Try to extract subtype from composite ID (jobId_type_subtype)
    const parts = fileId.split('_');
    if (parts.length > 2) {
      subtype = parts.slice(2).join('_');
    }
  }
  
  console.log('Downloading file with:', { fileId, fileType, subtype, filename: file.filename });
  
  try {
    const success = await invoiceStore.downloadGeneratedFile(fileId, fileType, subtype);
    if (!success) {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to download file', 
        life: 3000 
      });
    } else {
      toast.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: 'File downloaded successfully', 
        life: 2000 
      });
    }
  } catch (err) {
    console.error('Error downloading file:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: err.message || 'Failed to download file', 
      life: 3000 
    });
  }
}

// Function to preview a file
function previewFile(file) {
  if (!file) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Invalid file data', 
      life: 3000 
    });
    return;
  }
  
  // Check if the file has an ID for preview
  if (!file.id && !file.originalData?.id) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Warning', 
      detail: 'This file cannot be previewed', 
      life: 3000 
    });
    return;
  }
  
  // Reset error states
  previewError.value = false;
  previewErrorMessage.value = '';
  
  // Generate the preview URL ahead of time
  previewUrl.value = InvoiceService.getFilePreviewUrl(
    file.id, 
    file.fileType || file.originalData?.type, 
    file.fileCategory || file.originalData?.subtype
  );
  
  selectedFile.value = file;
  showFilePreview.value = true;
}

// Get file icon based on file type
function getFileIcon(file) {
  if (!file) {
    return 'pi pi-file'; // Default icon if file is missing
  }
  
  // First check if we already assigned an icon when processing the file
  if (file.icon) {
    return file.icon;
  }
  
  // Then check the fileType property
  if (file.fileType) {
    if (file.fileType === 'pdf') return 'pi pi-file-pdf';
    if (file.fileType === 'excel') return 'pi pi-file-excel';
    if (file.fileType === 'word') return 'pi pi-file-word';
  }
  
  // Then check filename
  if (file.filename) {
    const filename = file.filename.toLowerCase();
    if (filename.endsWith('.pdf')) return 'pi pi-file-pdf';
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return 'pi pi-file-excel';
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return 'pi pi-file-word';
  }
  
  // Finally check fullPath if available
  if (file.fullPath) {
    const path = file.fullPath.toLowerCase();
    if (path.endsWith('.pdf')) return 'pi pi-file-pdf';
    if (path.endsWith('.xlsx') || path.endsWith('.xls')) return 'pi pi-file-excel';
    if (path.endsWith('.docx') || path.endsWith('.doc')) return 'pi pi-file-word';
  }
  
  return 'pi pi-file'; // Default icon
}

// Function to get a badge for template type
function getTemplateTypeBadge(type) {
  if (!type) return { severity: 'info', label: 'Unknown' };
  
  const typeMap = {
    'nrc': { severity: 'success', label: 'NRC' },
    'mrc': { severity: 'info', label: 'MRC' },
    'invoice': { severity: 'primary', label: 'Invoice' },
    'report': { severity: 'warning', label: 'Report' }
  };
  
  return typeMap[type.toLowerCase()] || { severity: 'secondary', label: type };
}

// Watch for changes in selectedCustomerInvoice to update the available templates
watch(selectedCustomerInvoice, async (newInvoice) => {
  if (newInvoice && selectedCustomer.value) {
    await loadAvailableTemplates(selectedCustomer.value.id, newInvoice.number);
  }
});

// Watch for changes in selectedCustomer to update the available templates
watch(selectedCustomer, (newCustomer) => {
  if (newCustomer) {
    // Reset selected invoice and template
    selectedCustomerInvoice.value = null;
    selectedTemplate.value = null;
  }
});

// Inside the component, add a function to load templates
async function loadTemplates() {
  if (!selectedCustomer.value) {
    return;
  }
  
  try {
    await invoiceStore.fetchAvailableTemplates(selectedCustomer.value.id);
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load templates', 
      life: 3000 
    });
  }
}

// Customer selection change handler
async function onCustomerSelect(event) {
  selectedCustomer.value = event.value;
  selectedTemplate.value = null;
  
  // Reset invoice selection
  selectedCustomerInvoice.value = null;
  
  // Load customer's invoices
  await loadCustomerInvoices();
  
  // Load templates for this customer
  await loadTemplates();
}

// Function to handle iframe load success
function onIframeLoad(event) {
  previewLoaded.value = true;
  previewError.value = false;
}

// Function to handle iframe load failure
function onIframeError(event) {
  previewError.value = true;
  previewLoaded.value = false;
  previewErrorMessage.value = 'Failed to load preview';
}

// Function to open invoice detail drawer
async function openInvoiceDrawer(invoice) {
  try {
    showInvoiceDrawer.value = true;
    drawerSelectedInvoice.value = null;
    drawerProducts.value = [];
    drawerIsInteractive.value = false;
    drawerSelectedGroupBy.value = { name: 'None', value: 'none' };
    drawerGroupedProducts.value = [];
    
    // Load the full invoice details
    const fullInvoice = await invoiceStore.fetchInvoice(invoice.id);
    if (fullInvoice) {
      drawerSelectedInvoice.value = fullInvoice;
      drawerProducts.value = fullInvoice.items || [];
    }
  } catch (err) {
    console.error(`Failed to load invoice #${invoice.id}:`, err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load invoice details', 
      life: 3000 
    });
  }
}

// Function to handle drawer interactive mode toggle
async function onDrawerInteractiveToggle() {
  if (drawerIsInteractive.value && drawerSelectedInvoice.value) {
    await fetchDrawerEnrichedInvoiceData(drawerSelectedInvoice.value.number || drawerSelectedInvoice.value.id);
  } else {
    // Reset to basic products when interactive mode is turned off
    if (drawerSelectedInvoice.value) {
      drawerProducts.value = drawerSelectedInvoice.value.items || [];
    }
    drawerSelectedGroupBy.value = { name: 'None', value: 'none' };
    drawerGroupedProducts.value = [];
  }
}

// Function to fetch enriched invoice data for drawer
async function fetchDrawerEnrichedInvoiceData(documentNumber) {
  if (!documentNumber) return;
  
  try {
    await invoiceStore.fetchEnrichedInvoiceLines(documentNumber);
    
    const enrichedInvoice = invoiceStore.currentEnrichedInvoice;
    if (enrichedInvoice && enrichedInvoice.enrichedItems && enrichedInvoice.enrichedItems.length > 0) {
      drawerProducts.value = enrichedInvoice.enrichedItems.map(item => ({
        description: item.description,
        quantity: item.quantity.toString(),
        price: formatCurrency(item.unitPrice),
        total: formatCurrency(item.amountIncludingTax),
        rawItem: item
      }));
      
      applyDrawerGrouping();
    }
  } catch (err) {
    console.error('Error fetching enriched invoice data for drawer:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load enriched invoice data', 
      life: 3000 
    });
  }
}

// Function to apply grouping to drawer products
function applyDrawerGrouping() {
  if (drawerSelectedGroupBy.value.value === 'none' || !drawerProducts.value || drawerProducts.value.length === 0) {
    drawerIsRegrouping.value = false;
    drawerGroupedProducts.value = [];
    return;
  }
  
  drawerIsRegrouping.value = true;
  
  setTimeout(() => {
    const rawItems = drawerProducts.value.map(product => product.rawItem);
    const { groups, groupNames } = groupInvoiceItems(rawItems, drawerSelectedGroupBy.value.value);
    
    const groupsWithType = groups.map(group => ({
      ...group,
      groupType: drawerSelectedGroupBy.value.name
    }));
    
    drawerGroupedProducts.value = groupsWithType;
    drawerIsRegrouping.value = false;
  }, 300);
}

// Watch for changes in drawer groupBy
watch(drawerSelectedGroupBy, () => {
  if (drawerIsInteractive.value) {
    applyDrawerGrouping();
  }
});

// Watch for merge mode changes to ensure proper table behavior
watch(isMergeMode, (newValue) => {
  // Clear selections when switching modes
  if (newValue) {
    // Switching to merge mode - clear single selection
    selectedCustomerInvoice.value = null;
    selectedInvoicesForMerge.value = [];
  } else {
    // Switching to single mode - clear multi selection
    selectedInvoicesForMerge.value = [];
    selectedCustomerInvoice.value = null;
  }
});

// Merge functionality functions
function toggleMergeMode() {
  // The isMergeMode.value has already been updated by the v-model when this function is called
  if (isMergeMode.value) {
    // Entering merge mode
    toast.add({ 
      severity: 'success', 
      summary: 'Merge Mode Enabled', 
      detail: 'Select 2-50 invoices to merge into a single template', 
      life: 4000 
    });
  } else {
    // Exiting merge mode
    toast.add({ 
      severity: 'info', 
      summary: 'Merge Mode Disabled', 
      detail: 'Returned to single invoice selection', 
      life: 3000 
    });
  }
}

function validateMergeSelection() {
  const errors = [];
  
  if (!selectedInvoicesForMerge.value || selectedInvoicesForMerge.value.length < 2) {
    errors.push('Please select at least 2 invoices to merge');
  }
  
  if (selectedInvoicesForMerge.value.length > 50) {
    errors.push('Maximum 50 invoices can be merged at once');
  }
  
  if (!selectedTemplate.value) {
    errors.push('Please select a template for the merge');
  }
  
  // Check if all invoices belong to the same customer
  if (selectedInvoicesForMerge.value.length > 1) {
    const firstCustomer = selectedInvoicesForMerge.value[0].customerId;
    const differentCustomer = selectedInvoicesForMerge.value.find(invoice => invoice.customerId !== firstCustomer);
    if (differentCustomer) {
      errors.push('All invoices must belong to the same customer');
    }
  }
  
  return errors;
}

async function mergeSelectedInvoices() {
  const validationErrors = validateMergeSelection();
  if (validationErrors.length > 0) {
    validationErrors.forEach(error => {
      toast.add({ 
        severity: 'error', 
        summary: 'Validation Error', 
        detail: error, 
        life: 4000 
      });
    });
    return;
  }
  
  // Define mergeRequest outside try block so it's accessible in catch block
  const invoiceNumbers = selectedInvoicesForMerge.value.map(invoice => invoice.number);
  
  // Determine template override based on invoice types or user selection
  let templateOverride = null;
  if (selectedTemplate.value.type) {
    templateOverride = selectedTemplate.value.type.toLowerCase();
  }
  
  const mergeRequest = {
    invoice_numbers: invoiceNumbers,
    template_id: selectedTemplate.value.id,
    template_override: templateOverride,
    options: {
      format: 'both' // Generate both PDF and Excel
    }
  };
  
  try {
    isMergingInvoices.value = true;
    mergeError.value = null;
    
    // Debug: Log the initial merge request
    console.log('Initial merge request:', mergeRequest);
    
    const result = await invoiceStore.mergeInvoices(mergeRequest);
    
    if (result && result.success) {
      mergeResult.value = result;
      
      toast.add({ 
        severity: 'success', 
        summary: 'Merge Successful', 
        detail: `Created merged invoice ${result.data.merged_invoice_number} from ${result.data.merge_count} invoices`, 
        life: 5000 
      });
      
      // Reset selections
      selectedInvoicesForMerge.value = [];
      
      // Refresh the invoice list to show the new merged invoice
      await loadCustomerInvoices();
      
      // Switch to invoice documents tab to show the generated files
      activeDocumentTab.value = 'invoice';
      
      // Load the generated files for the merged invoice if we have the invoice number
      if (result.data && result.data.merged_invoice_number) {
        try {
          await loadGeneratedFiles(result.data.merged_invoice_number);
        } catch (fileError) {
          console.warn('Could not load generated files:', fileError);
          // Don't fail the whole operation if file loading fails
        }
      }
      
    } else {
      throw new Error(result?.message || 'Merge operation failed');
    }
    
  } catch (err) {
    console.error('Error merging invoices:', err);
    mergeError.value = err.message;
    
    // Debug: Log the full error object to see what we're getting
    console.log('Full error object:', err);
    console.log('Error response:', err.response);
    console.log('Error response status:', err.response?.status);
    console.log('Error response data:', err.response?.data);
    
    // Check if this is a duplicate merge error (HTTP 409)
    if (err.response && err.response.status === 409) {
      const errorData = err.response.data;
      console.log('409 error detected, checking errorData:', errorData);
      console.log('error_type:', errorData?.error_type);
      console.log('requires_confirmation:', errorData?.requires_confirmation);
      
      if (errorData.error_type === 'duplicate_merge' && errorData.requires_confirmation) {
        // Store the pending request and show confirmation dialog
        pendingMergeRequest.value = {
          ...mergeRequest,
          force_overwrite: true // Add the overwrite flag for retry
        };
        
        // Debug: Log the pending merge request creation
        console.log('Created pendingMergeRequest with force_overwrite:', pendingMergeRequest.value);
        
        duplicateDetails.value = errorData;
        showDuplicateConfirmation.value = true;
        
        toast.add({ 
          severity: 'warn', 
          summary: 'Duplicate Merge Detected', 
          detail: 'A merge already exists for these invoices. Please choose how to proceed.', 
          life: 5000 
        });
        return; // Don't show error toast, let user decide
      } else {
        console.log('409 error but not duplicate_merge format. ErrorData structure:', JSON.stringify(errorData, null, 2));
      }
    }
    
    // Show error toast for other types of errors
    toast.add({ 
      severity: 'error', 
      summary: 'Merge Failed', 
      detail: err.message || 'Failed to merge invoices', 
      life: 5000 
    });
  } finally {
    isMergingInvoices.value = false;
  }
}

// Function to handle duplicate confirmation
async function handleDuplicateConfirmation(overwrite) {
  showDuplicateConfirmation.value = false;
  
  if (!overwrite) {
    // User chose to keep existing merge
    toast.add({ 
      severity: 'info', 
      summary: 'Merge Cancelled', 
      detail: 'Keeping existing merge. No new merge was created.', 
      life: 3000 
    });
    duplicateDetails.value = null;
    pendingMergeRequest.value = null;
    return;
  }
  
  // User chose to overwrite - retry with force_overwrite flag
  if (!pendingMergeRequest.value) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No pending merge request found', 
      life: 3000 
    });
    return;
  }
  
  try {
    isMergingInvoices.value = true;
    mergeError.value = null;
    
    // Debug: Log the pending merge request to see what's being sent
    console.log('Sending merge request with force_overwrite:', pendingMergeRequest.value);
    
    const result = await invoiceStore.mergeInvoices(pendingMergeRequest.value);
    
    if (result && result.success) {
      mergeResult.value = result;
      
      toast.add({ 
        severity: 'success', 
        summary: 'Merge Regenerated', 
        detail: `Regenerated merged invoice ${result.data.merged_invoice_number} from ${result.data.merge_count} invoices`, 
        life: 5000 
      });
      
      // Reset selections
      selectedInvoicesForMerge.value = [];
      
      // Refresh the invoice list
      await loadCustomerInvoices();
      
      // Switch to invoice documents tab
      activeDocumentTab.value = 'invoice';
      
      // Load the generated files for the merged invoice
      if (result.data && result.data.merged_invoice_number) {
        try {
          await loadGeneratedFiles(result.data.merged_invoice_number);
        } catch (fileError) {
          console.warn('Could not load generated files:', fileError);
        }
      }
      
    } else {
      throw new Error(result?.message || 'Merge regeneration failed');
    }
    
  } catch (err) {
    console.error('Error regenerating merge:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Regeneration Failed', 
      detail: err.message || 'Failed to regenerate merged invoice', 
      life: 5000 
    });
  } finally {
    isMergingInvoices.value = false;
    duplicateDetails.value = null;
    pendingMergeRequest.value = null;
  }
}

async function loadMergeHistory() {
  if (!selectedCustomer.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'No Customer Selected', 
      detail: 'Please select a customer to view merge history', 
      life: 3000 
    });
    return;
  }
  
  try {
    isLoadingMergeHistory.value = true;
    const history = await invoiceStore.getCustomerMergeHistory(selectedCustomer.value.number);
    mergeHistoryData.value = history.data || [];
    showMergeHistory.value = true;
  } catch (err) {
    console.error('Error loading merge history:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load merge history', 
      life: 3000 
    });
  } finally {
    isLoadingMergeHistory.value = false;
  }
}

function getMergeStatusSeverity(status) {
  switch (status) {
    case 'completed': return 'success';
    case 'processing': return 'info';
    case 'failed': return 'danger';
    default: return 'secondary';
  }
}

// Computed properties for merge functionality
const canMerge = computed(() => {
  return isMergeMode.value && 
         selectedInvoicesForMerge.value.length >= 2 && 
         selectedInvoicesForMerge.value.length <= 50 && 
         selectedTemplate.value &&
         !isMergingInvoices.value;
});

const mergeButtonLabel = computed(() => {
  if (isMergingInvoices.value) {
    return 'Merging...';
  }
  if (selectedInvoicesForMerge.value.length === 0) {
    return 'Select Invoices to Merge';
  }
  if (selectedInvoicesForMerge.value.length === 1) {
    return 'Select More Invoices';
  }
  return `Merge ${selectedInvoicesForMerge.value.length} Invoices`;
});

const mergeSelectionSummary = computed(() => {
  if (!isMergeMode.value || selectedInvoicesForMerge.value.length === 0) {
    return '';
  }
  
  const count = selectedInvoicesForMerge.value.length;
  const totalAmount = selectedInvoicesForMerge.value.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  
  return `${count} invoice${count !== 1 ? 's' : ''} selected • Total: ${formatCurrency(totalAmount)}`;
});

// Function to view merge details
function viewMergeDetails(mergeData) {
  toast.add({ 
    severity: 'info', 
    summary: 'Merge Details', 
    detail: `Original invoices: ${mergeData.original_invoices.join(', ')}`, 
    life: 5000 
  });
}

// Function to download merged files
async function downloadMergedFiles(mergeData) {
  try {
    // Load the generated files for the merged invoice
    await loadGeneratedFiles(mergeData.merged_invoice);
    
    // Switch to invoice documents tab
    activeDocumentTab.value = 'invoice';
    
    // Close the merge history dialog
    showMergeHistory.value = false;
    
    toast.add({ 
      severity: 'success', 
      summary: 'Files Loaded', 
      detail: `Loaded files for merged invoice ${mergeData.merged_invoice}`, 
      life: 3000 
    });
  } catch (err) {
    console.error('Error loading merged files:', err);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to load merged invoice files', 
      life: 3000 
    });
  }
}

// Computed property for DataTable selection model
const tableSelection = computed({
  get() {
    return isMergeMode.value ? selectedInvoicesForMerge.value : selectedCustomerInvoice.value;
  },
  set(value) {
    if (isMergeMode.value) {
      selectedInvoicesForMerge.value = Array.isArray(value) ? value : [];
    } else {
      selectedCustomerInvoice.value = value;
    }
  }
});

function getRemainingAmountClass(remainingAmount) {
  if (remainingAmount > 0) {
    return 'font-semibold text-red-600 dark:text-red-400';
  } else if (remainingAmount < 0) {
    return 'font-semibold text-green-600 dark:text-green-400';
  } else {
    return 'font-medium text-green-600 dark:text-green-400';
  }
}

// Enhanced Document Management Section
const selectedDocuments = ref([]);
const documentSearchTerm = ref('');
const documentTypeFilter = ref('');
const documentSortOptions = ref([
  { label: 'Date Created', value: 'created_at' },
  { label: 'Invoice Number', value: 'invoice_number' },
  { label: 'Template Name', value: 'template_name' },
  { label: 'Generated By', value: 'generated_by' },
  { label: 'File Type', value: 'file_type' }
]);
const documentTypeOptions = ref([
  { label: 'All Types', value: '' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel', value: 'excel' },
  { label: 'Word', value: 'word' }
]);
const documentSortBy = ref('created_at');

// Document Content Views
const filteredCustomerDocuments = computed(() => {
  let documents = customerDocuments.value || [];
  
  if (documentSearchTerm.value) {
    const searchTerm = documentSearchTerm.value.toLowerCase();
    documents = documents.filter(file => 
      (file.filename || '').toLowerCase().includes(searchTerm) ||
      (file.template_name || '').toLowerCase().includes(searchTerm) ||
      (file.generated_by || '').toLowerCase().includes(searchTerm) ||
      (file.invoice_number || '').toLowerCase().includes(searchTerm)
    );
  }
  
  if (documentTypeFilter.value) {
    const typeFilter = documentTypeFilter.value.toLowerCase();
    documents = documents.filter(file => 
      (file.fileType || '').toLowerCase().includes(typeFilter) ||
      (file.filename || '').toLowerCase().includes(typeFilter)
    );
  }
  
  // Sort documents
  if (documentSortBy.value) {
    documents.sort((a, b) => {
      const aVal = a[documentSortBy.value] || '';
      const bVal = b[documentSortBy.value] || '';
      return aVal.localeCompare(bVal);
    });
  }
  
  return documents;
});

const filteredInvoiceDocuments = computed(() => {
  let documents = generatedFiles.value || [];
  
  if (documentSearchTerm.value) {
    const searchTerm = documentSearchTerm.value.toLowerCase();
    documents = documents.filter(file => 
      (file.filename || '').toLowerCase().includes(searchTerm) ||
      (file.template_name || '').toLowerCase().includes(searchTerm) ||
      (file.generated_by || '').toLowerCase().includes(searchTerm) ||
      (file.fileCategory || '').toLowerCase().includes(searchTerm)
    );
  }
  
  if (documentTypeFilter.value) {
    const typeFilter = documentTypeFilter.value.toLowerCase();
    documents = documents.filter(file => 
      (file.fileType || '').toLowerCase().includes(typeFilter) ||
      (file.filename || '').toLowerCase().includes(typeFilter)
    );
  }
  
  // Sort documents
  if (documentSortBy.value) {
    documents.sort((a, b) => {
      const aVal = a[documentSortBy.value] || '';
      const bVal = b[documentSortBy.value] || '';
      return aVal.localeCompare(bVal);
    });
  }
  
  return documents;
});

const filteredMergedDocuments = computed(() => {
  let documents = mergeHistoryData.value || [];
  
  if (documentSearchTerm.value) {
    const searchTerm = documentSearchTerm.value.toLowerCase();
    documents = documents.filter(document => 
      (document.merged_invoice || '').toLowerCase().includes(searchTerm) ||
      (document.template_used || '').toLowerCase().includes(searchTerm) ||
      (document.original_count || '').toString().includes(searchTerm) ||
      (document.total_amount || '').toString().includes(searchTerm)
    );
  }
  
  if (documentTypeFilter.value) {
    const typeFilter = documentTypeFilter.value.toLowerCase();
    documents = documents.filter(document => 
      (document.template_used || '').toLowerCase().includes(typeFilter)
    );
  }
  
  // Sort documents
  if (documentSortBy.value === 'merge_date') {
    documents.sort((a, b) => new Date(b.merge_date) - new Date(a.merge_date));
  } else if (documentSortBy.value) {
    documents.sort((a, b) => {
      const aVal = a[documentSortBy.value] || '';
      const bVal = b[documentSortBy.value] || '';
      return aVal.localeCompare(bVal);
    });
  }
  
  return documents;
});

// Document Actions
function downloadAllCustomerDocuments() {
  filteredCustomerDocuments.value.forEach(file => {
    downloadFile(file);
  });
  toast.add({ 
    severity: 'success', 
    summary: 'Download Started', 
    detail: `Downloading ${filteredCustomerDocuments.value.length} customer documents`, 
    life: 3000 
  });
}

function downloadAllInvoiceDocuments() {
  filteredInvoiceDocuments.value.forEach(file => {
    downloadFile(file);
  });
  toast.add({ 
    severity: 'success', 
    summary: 'Download Started', 
    detail: `Downloading ${filteredInvoiceDocuments.value.length} invoice documents`, 
    life: 3000 
  });
}

function downloadSelectedFiles() {
  const filesToDownload = [];
  
  // Find selected files from both customer and invoice documents
  [...filteredCustomerDocuments.value, ...filteredInvoiceDocuments.value].forEach(file => {
    if (selectedDocuments.value.includes(file.id)) {
      filesToDownload.push(file);
    }
  });
  
  filesToDownload.forEach(file => {
    downloadFile(file);
  });
  
  toast.add({ 
    severity: 'success', 
    summary: 'Download Started', 
    detail: `Downloading ${filesToDownload.length} selected files`, 
    life: 3000 
  });
}

function clearDocumentSelection() {
  selectedDocuments.value = [];
}

function refreshDocuments() {
  if (selectedCustomer.value) {
    loadCustomerDocuments(selectedCustomer.value.number);
  }
  if (selectedCustomerInvoice.value) {
    loadGeneratedFiles(selectedCustomerInvoice.value.number);
  }
  if (activeDocumentTab.value === 'merged') {
    loadMergeHistory();
  }
}

function shareFile(file) {
  // Implement sharing functionality - could open a dialog with sharing options
  toast.add({ 
    severity: 'info', 
    summary: 'Share Feature', 
    detail: 'File sharing functionality coming soon', 
    life: 3000 
  });
}

function getFileTypeHeaderClass(file) {
  const fileType = file.fileType || file.originalData?.type || '';
  if (fileType === 'excel' || file.filename?.toLowerCase().includes('.xlsx') || file.filename?.toLowerCase().includes('.xls')) {
    return 'bg-gradient-to-br from-green-500 to-green-600';
  }
  if (fileType === 'pdf' || file.filename?.toLowerCase().includes('.pdf')) {
    return 'bg-gradient-to-br from-red-500 to-red-600';
  }
  if (fileType === 'word' || file.filename?.toLowerCase().includes('.docx') || file.filename?.toLowerCase().includes('.doc')) {
    return 'bg-gradient-to-br from-blue-500 to-blue-600';
  }
  return 'bg-gradient-to-br from-gray-500 to-gray-600';
}

function getFileTypeLabel(file) {
  const fileType = file.fileType || file.originalData?.type || '';
  if (fileType === 'excel' || file.filename?.toLowerCase().includes('.xlsx') || file.filename?.toLowerCase().includes('.xls')) {
    return 'Excel';
  }
  if (fileType === 'pdf' || file.filename?.toLowerCase().includes('.pdf')) {
    return 'PDF';
  }
  if (fileType === 'word' || file.filename?.toLowerCase().includes('.docx') || file.filename?.toLowerCase().includes('.doc')) {
    return 'Word';
  }
  return 'Document';
}

function formatFileDate(date) {
  if (!date) return 'No date';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

function formatTimeAgo(date) {
  if (!date) return '';
  try {
    const now = new Date();
    const diff = Math.abs(now - new Date(date));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diff / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'just now';
  } catch (error) {
    return '';
  }
}

function hasAnyDocuments() {
  return (filteredCustomerDocuments.value && filteredCustomerDocuments.value.length > 0) ||
         (filteredInvoiceDocuments.value && filteredInvoiceDocuments.value.length > 0) ||
         (filteredMergedDocuments.value && filteredMergedDocuments.value.length > 0);
}

function switchDocumentTab(tab) {
  activeDocumentTab.value = tab;
  
  // Load merge history when switching to merged tab
  if (tab === 'merged' && selectedCustomer.value) {
    loadMergeHistory();
  }
  
  // Clear search and filters when switching tabs
  documentSearchTerm.value = '';
  documentTypeFilter.value = '';
  selectedDocuments.value = [];
}

function viewSourceInvoices(mergeData) {
  // Show a dialog or expand details to show the original invoices that were merged
  toast.add({ 
    severity: 'info', 
    summary: 'Source Invoices', 
    detail: `This merged invoice was created from ${mergeData.original_count} original invoices`, 
    life: 4000 
  });
  
  // You could implement a dialog here to show the list of original invoice numbers
  console.log('Viewing source invoices for merge:', mergeData);
}

function getCompactFileHeaderClass(file) {
  const fileType = file.fileType || file.originalData?.type || '';
  if (fileType === 'excel' || file.filename?.toLowerCase().includes('.xlsx') || file.filename?.toLowerCase().includes('.xls')) {
    return 'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 text-green-700 dark:text-green-300';
  }
  if (fileType === 'pdf' || file.filename?.toLowerCase().includes('.pdf')) {
    return 'bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 text-red-700 dark:text-red-300';
  }
  if (fileType === 'word' || file.filename?.toLowerCase().includes('.docx') || file.filename?.toLowerCase().includes('.doc')) {
    return 'bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300';
  }
  return 'bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300';
}
</script>

<template>
    <Toast position="top-right" />
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Invoice Templates</h5>
                
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
                
                <!-- Invoice Table -->
                <div class="card p-4 mb-4">
                    <DataTable v-model:selection="tableSelection" 
                             :value="customerInvoices || []" dataKey="id"
                             :loading="isLoadingCustomerInvoices" :rowHover="true" stripedRows
                             :metaKeySelection="false" 
                             :selectionMode="isMergeMode ? 'multiple' : 'single'"
                             filterDisplay="menu" v-model:filters="filters"
                             :globalFilterFields="['number', 'customerName', 'dueDate', 'total', 'remainingAmount', 'status']"
                             @row-select="isMergeMode ? null : onCustomerInvoiceSelect" 
                             @row-unselect="isMergeMode ? null : onCustomerInvoiceSelect"
                             @sort="onSort"
                             :rowClass="getRowClass"
                             tableStyle="min-width: 50rem"
                             :scrollable="true" 
                             scrollHeight="500px"
                             :virtualScrollerOptions="customerInvoices?.length > 20 ? { itemSize: 65, lazy: false } : null"
                             responsiveLayout="scroll"
                             showGridlines
                             :resizableColumns="true"
                             columnResizeMode="fit"
                             stateStorage="session"
                             stateKey="invoice-templates-table-state">
                        <template #header>
                            <div class="flex flex-col gap-3 p-2">
                                <!-- Top row with controls -->
                                <div class="flex flex-col sm:flex-row justify-between gap-3">
                                    <div class="flex gap-2">
                                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" size="small" />
                                        <Button type="button" icon="pi pi-refresh" label="Refresh" outlined @click="loadCustomerInvoices()" size="small" :loading="isLoadingCustomerInvoices" />
                                        <Button type="button" icon="pi pi-history" label="Merge History" outlined @click="loadMergeHistory()" size="small" :disabled="!selectedCustomer" />
                                    </div>
                                    <div class="flex gap-2">
                                        <IconField>
                                            <InputIcon>
                                                <i class="pi pi-search" />
                                            </InputIcon>
                                            <InputText v-model="filters['global'].value" placeholder="Search invoices..." class="w-full sm:w-auto" />
                                        </IconField>
                                    </div>
                                </div>
                                
                                <!-- Merge Mode Toggle -->
                                <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                                    <div class="flex items-center gap-3">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-objects-column text-lg" :class="isMergeMode ? 'text-primary-500' : 'text-surface-400'"></i>
                                            <span class="font-semibold text-surface-900 dark:text-surface-0">Merge Mode</span>
                                        </div>
                                        <ToggleSwitch v-model="isMergeMode" @update:modelValue="toggleMergeMode" />
                                        <div v-if="isMergeMode" class="flex items-center gap-2">
                                            <Tag :value="`${selectedInvoicesForMerge.length} selected`" 
                                                 :severity="selectedInvoicesForMerge.length >= 2 ? 'success' : 'secondary'" />
                                            <span v-if="mergeSelectionSummary" class="text-sm text-surface-600 dark:text-surface-400">
                                                {{ mergeSelectionSummary }}
                                            </span>
                                        </div>
                                    </div>
                                    <div v-if="isMergeMode" class="text-sm text-surface-600 dark:text-surface-400">
                                        Select 2-50 invoices to merge
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template #empty>
                            <div class="flex flex-column align-items-center p-6">
                                <i class="pi pi-file text-6xl text-surface-400 mb-4"></i>
                                <span v-if="!selectedCustomer" class="text-lg text-surface-600 dark:text-surface-400">Please select a customer above to view invoices</span>
                                <span v-else class="text-lg text-surface-600 dark:text-surface-400">No invoices found for the selected customer</span>
                                <span v-if="selectedCustomer" class="text-sm text-surface-500 dark:text-surface-500 mt-2">
                                    Try adjusting your search criteria or filters
                                </span>
                            </div>
                        </template>
                        <template #loading>
                            <div class="flex items-center justify-center p-6">
                                <ProgressSpinner style="width: 40px; height: 40px" />
                                <span class="ml-3 text-surface-600 dark:text-surface-400">Loading invoices...</span>
                            </div>
                        </template>
                        
                        <Column field="customerName" header="Customer" style="min-width: 12rem" sortable frozen>
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-user text-surface-500 text-sm"></i>
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.customerName }}</span>
                                </div>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by customer" class="p-column-filter" />
                            </template>
                        </Column>
                        <Column field="number" header="Invoice #" style="min-width: 10rem" sortable>
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-file text-blue-500 text-sm"></i>
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.number }}</span>
                                </div>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by number" class="p-column-filter" />
                            </template>
                        </Column>
                        <Column field="dueDate" header="Due Date" style="min-width: 10rem" sortable>
                            <template #body="slotProps">
                                <div class="flex flex-col">
                                    <span class="font-medium text-surface-900 dark:text-surface-0">
                                        {{ getDueDateInfo(slotProps.data.dueDate, slotProps.data.status).date }}
                                    </span>
                                    <span class="text-xs" :class="getDueDateInfo(slotProps.data.dueDate, slotProps.data.status).contextClass">
                                        {{ getDueDateInfo(slotProps.data.dueDate, slotProps.data.status).context }}
                                    </span>
                                </div>
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
                                <div class="text-right">
                                    <span class="font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(slotProps.data.total) }}</span>
                                </div>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputNumber v-model="filterModel.value" placeholder="Search by amount" class="p-column-filter" />
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
                                <div class="text-right">
                                    <span :class="getRemainingAmountClass(slotProps.data.remainingAmount)">
                                        {{ formatCurrency(slotProps.data.remainingAmount) }}
                                    </span>
                                </div>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputNumber v-model="filterModel.value" placeholder="Search by amount" class="p-column-filter" />
                            </template>
                        </Column>
                        <Column field="status" header="Status" style="min-width: 8rem" sortable>
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status" 
                                     :severity="slotProps.data.status === 'open' ? 'info' : (slotProps.data.status === 'paid' ? 'success' : 'warning')"
                                     class="font-medium" />
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
                        <Column headerStyle="width: 4rem" bodyStyle="text-align: center" frozen alignFrozen="right">
                            <template #body="slotProps">
                                <Button icon="pi pi-eye" 
                                        size="small" 
                                        text 
                                        rounded 
                                        severity="secondary"
                                        v-tooltip.top="'View Invoice Details'"
                                        @click="openInvoiceDrawer(slotProps.data)" />
                            </template>
                        </Column>
                        
                        <template #footer>
                            <div class="flex justify-between items-center p-2 bg-surface-50 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700">
                                <div class="flex items-center gap-4">
                                    <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
                                        {{ customerInvoices?.length || 0 }} invoices
                                    </span>
                                    <span v-if="selectedCustomer" class="text-xs text-surface-500 dark:text-surface-400">
                                        for {{ selectedCustomer.name }}
                                    </span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Button icon="pi pi-download" text size="small" v-tooltip.top="'Export Data'" severity="secondary" />
                                    <Button icon="pi pi-refresh" text size="small" @click="loadCustomerInvoices()" v-tooltip.top="'Refresh'" severity="secondary" :loading="isLoadingCustomerInvoices" />
                                </div>
                            </div>
                        </template>
                    </DataTable>
                </div>
                
                <!-- Template and Files Section -->
                <div class="grid grid-cols-12 gap-4">
                    <!-- Available Templates Section -->
                    <div class="col-span-12 md:col-span-5 xl:col-span-4">
                        <div class="card">
                            <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Available Templates</div>
                            
                            <!-- Loading templates message -->
                            <div v-if="isLoadingTemplates" class="flex justify-center items-center p-4">
                                <ProgressSpinner style="width: 50px; height: 50px" />
                                <span class="ml-3">Loading templates...</span>
                            </div>
                            
                            <!-- Error loading templates -->
                            <div v-else-if="templatesError" class="p-4 flex flex-col items-center justify-center">
                                <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-3"></i>
                                <div class="text-lg text-yellow-500">{{ templatesError }}</div>
                            </div>
                            
                            <!-- No templates available message -->
                            <div v-else-if="!selectedCustomer" class="p-4 flex flex-col items-center justify-center">
                                <i class="pi pi-users text-4xl text-primary mb-3"></i>
                                <div class="text-lg">Select a customer to see available templates</div>
                            </div>
                            
                            <!-- No templates for selected customer -->
                            <div v-else-if="availableTemplates.length === 0" class="p-4 flex flex-col items-center justify-center">
                                <i class="pi pi-info-circle text-4xl text-primary mb-3"></i>
                                <div class="text-lg">No templates available for this customer</div>
                                <div v-if="selectedCustomerInvoice" class="text-sm text-surface-600 dark:text-surface-400 mt-2">
                                    Try selecting a different invoice or customer
                                </div>
                            </div>
                            
                            <!-- Templates list -->
                            <div v-else>
                                <ul class="list-none p-0 m-0">
                                    <li v-for="template in availableTemplates" :key="template.id" 
                                        class="p-3 mb-2 flex items-center justify-between cursor-pointer border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm transition-all hover:shadow hover:bg-surface-50 dark:hover:bg-surface-800"
                                        :class="{ 'bg-surface-50 dark:bg-surface-800 border-primary-300 dark:border-primary-700': selectedTemplate?.id === template.id }"
                                        @click="selectedTemplate = template">
                                        <div class="flex items-center">
                                            <i class="pi pi-file-pdf text-2xl mr-3 text-primary-500" v-if="template.output_format === 'pdf'"></i>
                                            <i class="pi pi-file-excel text-2xl mr-3 text-green-500" v-else-if="template.output_format === 'excel'"></i>
                                            <i class="pi pi-file text-2xl mr-3 text-blue-500" v-else></i>
                                            <div>
                                                <div class="text-surface-900 dark:text-surface-0 font-medium">{{ template.name }}</div>
                                                <div class="text-surface-600 dark:text-surface-400 text-sm">{{ template.description || 'No description' }}</div>
                                            </div>
                                        </div>
                                        <Tag v-if="template.type" :severity="getTemplateTypeBadge(template.type).severity">
                                            {{ getTemplateTypeBadge(template.type).label }}
                                        </Tag>
                                    </li>
                                </ul>
                                
                                <!-- Generate template button -->
                                <div class="mt-4">
                                    <Button v-if="!isMergeMode"
                                        label="Generate Template" 
                                        icon="pi pi-file-export" 
                                        class="w-full" 
                                        :disabled="!selectedTemplate || !selectedCustomerInvoice || isGeneratingTemplate" 
                                        :loading="isGeneratingTemplate"
                                        @click="generateTemplateDocument" />
                                    
                                    <Button v-else
                                        :label="mergeButtonLabel" 
                                        icon="pi pi-objects-column" 
                                        class="w-full" 
                                        :disabled="!canMerge" 
                                        :loading="isMergingInvoices"
                                        severity="success"
                                        @click="mergeSelectedInvoices" />
                                </div>
                                
                                <!-- Merge validation messages -->
                                <div v-if="isMergeMode" class="mt-3">
                                    <div v-if="selectedInvoicesForMerge.length === 0" class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                        <i class="pi pi-info-circle"></i>
                                        <span>Select invoices from the table above to merge</span>
                                    </div>
                                    <div v-else-if="selectedInvoicesForMerge.length === 1" class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                        <i class="pi pi-exclamation-triangle"></i>
                                        <span>Select at least one more invoice to merge</span>
                                    </div>
                                    <div v-else-if="selectedInvoicesForMerge.length > 50" class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <i class="pi pi-times-circle"></i>
                                        <span>Maximum 50 invoices allowed for merge</span>
                                    </div>
                                    <div v-else-if="!selectedTemplate" class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                        <i class="pi pi-exclamation-triangle"></i>
                                        <span>Select a template to proceed with merge</span>
                                    </div>
                                    <div v-else class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                        <i class="pi pi-check-circle"></i>
                                        <span>Ready to merge {{ selectedInvoicesForMerge.length }} invoices</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Generated Files Section -->
                    <div class="col-span-12 md:col-span-7 xl:col-span-8">
                        <div class="card">
                            <!-- Document Center Header with Generation Tools -->
                            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <i class="pi pi-folder text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">Document Center</h2>
                                        <p class="text-sm text-surface-600 dark:text-surface-400 m-0">Generate, manage, and organize invoice documents</p>
                                    </div>
                                </div>
                                
                                <!-- Template Generation Toolbar -->
                                <div class="flex flex-col sm:flex-row gap-3">
                                    <!-- Template Selection -->
                                    <div class="flex items-center gap-2">
                                        <Select 
                                            v-model="selectedTemplate" 
                                            :options="availableTemplates" 
                                            optionLabel="name" 
                                            placeholder="Select Template"
                                            class="w-48"
                                            :disabled="!selectedCustomer || (!selectedCustomerInvoice && !isMergeMode)"
                                            :loading="isLoadingTemplates">
                                            <template #option="slotProps">
                                                <div class="flex items-center gap-2">
                                                    <i class="pi pi-file-pdf text-red-500" v-if="slotProps.option.output_format === 'pdf'"></i>
                                                    <i class="pi pi-file-excel text-green-500" v-else-if="slotProps.option.output_format === 'excel'"></i>
                                                    <i class="pi pi-file text-blue-500" v-else></i>
                                                    <div>
                                                        <div class="font-medium">{{ slotProps.option.name }}</div>
                                                        <div class="text-xs text-surface-500">{{ slotProps.option.description || 'No description' }}</div>
                                                    </div>
                                                </div>
                                            </template>
                                        </Select>
                                    </div>
                                    
                                    <!-- Generation Actions -->
                                    <div class="flex gap-2">
                                        <!-- Single Invoice Generation -->
                                        <Button v-if="!isMergeMode"
                                            label="Generate" 
                                            icon="pi pi-file-export" 
                                            size="small"
                                            :disabled="!selectedTemplate || !selectedCustomerInvoice || isGeneratingTemplate" 
                                            :loading="isGeneratingTemplate"
                                            @click="generateTemplateDocument" />
                                        
                                        <!-- Merge Generation -->
                                        <Button v-else
                                            :label="mergeButtonLabel" 
                                            icon="pi pi-objects-column" 
                                            size="small"
                                            :disabled="!canMerge" 
                                            :loading="isMergingInvoices"
                                            severity="success"
                                            @click="mergeSelectedInvoices" />
                                        
                                        <!-- Toggle Merge Mode -->
                                        <Button 
                                            :label="isMergeMode ? 'Exit Merge' : 'Merge Mode'"
                                            :icon="isMergeMode ? 'pi pi-times' : 'pi pi-objects-column'"
                                            size="small"
                                            :severity="isMergeMode ? 'secondary' : 'info'"
                                            outlined
                                            @click="toggleMergeMode" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Merge Status Banner -->
                            <div v-if="isMergeMode" class="mb-4 p-3 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-info-circle text-orange-600"></i>
                                        <span class="font-medium text-orange-800 dark:text-orange-200">Merge Mode Active</span>
                                    </div>
                                    <div class="text-sm text-orange-700 dark:text-orange-300">
                                        {{ mergeSelectionSummary || 'Select invoices from the table to merge' }}
                                    </div>
                                </div>
                                
                                <!-- Merge validation messages -->
                                <div v-if="selectedInvoicesForMerge.length > 0" class="mt-2 text-sm">
                                    <div v-if="selectedInvoicesForMerge.length === 1" class="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                        <i class="pi pi-exclamation-triangle"></i>
                                        <span>Select at least one more invoice to merge</span>
                                    </div>
                                    <div v-else-if="selectedInvoicesForMerge.length > 50" class="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <i class="pi pi-times-circle"></i>
                                        <span>Maximum 50 invoices allowed for merge</span>
                                    </div>
                                    <div v-else-if="!selectedTemplate" class="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                        <i class="pi pi-exclamation-triangle"></i>
                                        <span>Select a template to proceed with merge</span>
                                    </div>
                                    <div v-else class="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <i class="pi pi-check-circle"></i>
                                        <span>Ready to merge {{ selectedInvoicesForMerge.length }} invoices</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Document Management Actions -->
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <!-- Document Type Tabs -->
                                <div class="flex border-b border-surface-200 dark:border-surface-700">
                                    <button class="pb-3 px-4 font-medium border-b-2 transition-colors duration-200 text-sm"
                                            :class="[
                                                activeDocumentTab === 'customer' 
                                                    ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400 text-surface-600 dark:text-surface-400'
                                            ]"
                                            @click="switchDocumentTab('customer')">
                                        Customer Documents
                                        <span v-if="filteredCustomerDocuments.length > 0" 
                                              class="ml-2 px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                                            {{ filteredCustomerDocuments.length }}
                                        </span>
                                    </button>
                                    <button class="pb-3 px-4 font-medium border-b-2 transition-colors duration-200 text-sm"
                                            :class="[
                                                activeDocumentTab === 'invoice' 
                                                    ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400',
                                                !selectedCustomerInvoice && !isMergeMode ? 'text-surface-400 cursor-not-allowed' : 'cursor-pointer text-surface-600 dark:text-surface-400'
                                            ]"
                                            @click="(selectedCustomerInvoice || isMergeMode) && switchDocumentTab('invoice')">
                                        Invoice Documents
                                        <span v-if="filteredInvoiceDocuments.length > 0" 
                                              class="ml-2 px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                                            {{ filteredInvoiceDocuments.length }}
                                        </span>
                                    </button>
                                    <button class="pb-3 px-4 font-medium border-b-2 transition-colors duration-200 text-sm"
                                            :class="[
                                                activeDocumentTab === 'merged' 
                                                    ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400 text-surface-600 dark:text-surface-400'
                                            ]"
                                            @click="switchDocumentTab('merged')">
                                        Merged Invoices
                                        <span v-if="filteredMergedDocuments.length > 0" 
                                              class="ml-2 px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                                            {{ filteredMergedDocuments.length }}
                                        </span>
                                    </button>
                                </div>
                                
                                <!-- Document Actions Toolbar -->
                                <div class="flex items-center gap-2">
                                    <!-- Search -->
                                    <div class="relative">
                                        <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 text-sm"></i>
                                        <InputText v-model="documentSearchTerm" 
                                                   placeholder="Search documents..." 
                                                   class="pl-10 text-sm w-48" 
                                                   size="small" />
                                    </div>
                                    
                                    <!-- Filter -->
                                    <Select v-model="documentTypeFilter" 
                                            :options="documentTypeOptions" 
                                            optionLabel="label" 
                                            optionValue="value"
                                            placeholder="Filter"
                                            class="w-32"
                                            size="small" />
                                    
                                    <!-- Sort -->
                                    <Select v-model="documentSortBy" 
                                            :options="documentSortOptions" 
                                            optionLabel="label" 
                                            optionValue="value"
                                            placeholder="Sort"
                                            class="w-36"
                                            size="small" />
                                    
                                    <!-- Bulk Actions -->
                                    <div class="flex gap-1">
                                        <Button v-if="selectedDocuments.length > 0"
                                                icon="pi pi-download" 
                                                size="small"
                                                severity="success"
                                                outlined
                                                v-tooltip.top="'Download Selected'"
                                                @click="downloadSelectedFiles" />
                                        
                                        <Button v-if="activeDocumentTab === 'customer'"
                                                icon="pi pi-download" 
                                                size="small"
                                                outlined
                                                v-tooltip.top="'Download All Customer Documents'"
                                                @click="downloadAllCustomerDocuments" />
                                        
                                        <Button v-if="activeDocumentTab === 'invoice'"
                                                icon="pi pi-download" 
                                                size="small"
                                                outlined
                                                v-tooltip.top="'Download All Invoice Documents'"
                                                @click="downloadAllInvoiceDocuments" />
                                        
                                        <Button icon="pi pi-refresh" 
                                                size="small"
                                                outlined
                                                v-tooltip.top="'Refresh Documents'"
                                                @click="refreshDocuments" />
                                        
                                        <Button v-if="selectedDocuments.length > 0"
                                                icon="pi pi-times" 
                                                size="small"
                                                severity="secondary"
                                                outlined
                                                v-tooltip.top="'Clear Selection'"
                                                @click="clearDocumentSelection" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Loading State -->
                            <div v-if="isLoadingGeneratedFiles || isLoadingCustomerDocuments" 
                                 class="flex justify-center items-center p-12">
                                <div class="text-center">
                                    <ProgressSpinner class="w-12 h-12 mb-4" />
                                    <div class="font-medium text-surface-600 dark:text-surface-400">Loading documents...</div>
                                    <div class="text-sm text-surface-500 dark:text-surface-500 mt-1">Please wait while we fetch your files</div>
                                </div>
                            </div>
                            
                            <!-- Error State -->
                            <div v-else-if="generatedFilesError || customerDocumentsError" 
                                 class="flex flex-col items-center justify-center p-12">
                                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                    <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
                                </div>
                                <div class="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Error Loading Documents</div>
                                <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md">
                                    {{ generatedFilesError || customerDocumentsError }}
                                </div>
                                <Button label="Try Again" 
                                        icon="pi pi-refresh" 
                                        class="mt-4" 
                                        size="small" 
                                        @click="refreshDocuments" />
                            </div>
                            
                            <!-- No Customer Selected -->
                            <div v-else-if="!selectedCustomer" 
                                 class="flex flex-col items-center justify-center p-12">
                                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                                    <i class="pi pi-users text-blue-500 text-2xl"></i>
                                </div>
                                <div class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Select a Customer</div>
                                <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md">
                                    Choose a customer from the dropdown above to view their documents and generate new templates
                                </div>
                            </div>
                            
                            <!-- Document Content Views -->
                            <div v-else>
                                <!-- Customer Documents View -->
                                <div v-if="activeDocumentTab === 'customer'">
                                    <div v-if="filteredCustomerDocuments.length === 0" 
                                         class="flex flex-col items-center justify-center p-12">
                                        <div class="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mb-4">
                                            <i class="pi pi-folder-open text-surface-400 text-2xl"></i>
                                        </div>
                        <div class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Customer Documents</div>
                        <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md">
                            {{ selectedCustomer.name }} doesn't have any documents yet. Generate templates from invoices to create documents.
                        </div>
                    </div>
                    
                    <div v-else>
                        <!-- Customer Documents Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <i class="pi pi-user text-blue-600 dark:text-blue-400"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-surface-900 dark:text-surface-0">{{ selectedCustomer.name }}</h3>
                                    <p class="text-sm text-surface-600 dark:text-surface-400">{{ filteredCustomerDocuments.length }} documents</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Button v-if="filteredCustomerDocuments.length > 0" 
                                        icon="pi pi-download" 
                                        label="Download All"
                                        size="small" 
                                        outlined
                                        @click="downloadAllCustomerDocuments" />
                            </div>
                        </div>
                        
                        <!-- Customer Documents Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="(file, index) in filteredCustomerDocuments" 
                                 :key="file?.id || index" 
                                 class="group relative border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600"
                                 :class="{ 'ring-2 ring-primary-500': selectedDocuments.includes(file.id) }">
                                
                                <!-- Document Selection Checkbox -->
                                <div class="absolute top-2 right-2 z-10">
                                    <Checkbox v-model="selectedDocuments" 
                                              :value="file.id" 
                                              class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                              :class="{ 'opacity-100': selectedDocuments.includes(file.id) }" />
                                </div>
                                
                                <!-- Compact File Header with Icon and Invoice Number -->
                                <div class="py-2 px-3 flex items-center gap-2"
                                     :class="getCompactFileHeaderClass(file)">
                                    <i :class="[getFileIcon(file), 'text-lg']"></i>
                                    <span class="font-medium truncate flex-1 text-sm">
                                        {{ file.invoice_number ? `Invoice #${file.invoice_number}` : 'No Invoice Number' }}
                                    </span>
                                </div>
                                
                                <!-- Compact Document Info -->
                                <div class="p-3 space-y-2">
                                    <!-- Filename (Bold and Prominent) -->
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 text-sm truncate" 
                                         :title="file.filename || 'Unnamed file'">
                                        {{ file.filename || file.fullPath?.split('/').pop() || 'Unnamed file' }}
                                    </div>
                                    
                                    <!-- Date and Type -->
                                    <div class="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                                        <span>{{ formatFileDate(file.created_at) }}</span>
                                        <span class="font-medium">{{ getFileTypeLabel(file) }}</span>
                                    </div>
                                    
                                    <!-- Template Name -->
                                    <div v-if="file.template_name" class="flex items-center gap-2 text-xs">
                                        <i class="pi pi-tag text-orange-500"></i>
                                        <span class="text-surface-600 dark:text-surface-400 truncate">{{ file.template_name }}</span>
                                    </div>
                                    
                                    <!-- Document Actions -->
                                    <div class="flex gap-1 pt-2 border-t border-surface-200 dark:border-surface-700">
                                        <Button icon="pi pi-eye" 
                                                size="small" 
                                                text 
                                                class="flex-1"
                                                v-tooltip.top="'Preview'"
                                                @click="previewFile(file)" />
                                        <Button icon="pi pi-download" 
                                                size="small" 
                                                text 
                                                class="flex-1"
                                                v-tooltip.top="'Download'"
                                                @click="downloadFile(file)" />
                                        <Button icon="pi pi-share-alt" 
                                                size="small" 
                                                text 
                                                class="flex-1"
                                                v-tooltip.top="'Share'"
                                                @click="shareFile(file)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Invoice Documents View -->
                <div v-else-if="activeDocumentTab === 'invoice'">
                    <div v-if="!selectedCustomerInvoice" 
                         class="flex flex-col items-center justify-center p-12">
                        <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                            <i class="pi pi-file-invoice text-orange-500 text-2xl"></i>
                        </div>
                        <div class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Select an Invoice</div>
                        <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md">
                            Choose an invoice from the table above to view its generated documents
                        </div>
                    </div>
                    
                    <div v-else-if="filteredInvoiceDocuments.length === 0" 
                         class="flex flex-col items-center justify-center p-12">
                        <div class="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mb-4">
                            <i class="pi pi-file-plus text-surface-400 text-2xl"></i>
                        </div>
                        <div class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Documents Generated</div>
                        <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md mb-4">
                            No documents have been generated for invoice #{{ selectedCustomerInvoice.number }}. Select a template and click "Generate Template" to create documents.
                        </div>
                        <Button label="Generate Template" 
                                icon="pi pi-plus" 
                                @click="generateTemplate" 
                                :disabled="!selectedTemplate" />
                    </div>
                    
                    <div v-else>
                        <!-- Invoice Documents Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                    <i class="pi pi-file-invoice text-green-600 dark:text-green-400"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-surface-900 dark:text-surface-0">Invoice #{{ selectedCustomerInvoice.number }}</h3>
                                    <p class="text-sm text-surface-600 dark:text-surface-400">{{ filteredInvoiceDocuments.length }} documents</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Button v-if="filteredInvoiceDocuments.length > 0" 
                                        icon="pi pi-download" 
                                        label="Download All"
                                        size="small" 
                                        outlined
                                        @click="downloadAllInvoiceDocuments" />
                            </div>
                        </div>
                        
                        <!-- Invoice Documents Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="(file, index) in filteredInvoiceDocuments" 
                                 :key="file?.id || index" 
                                 class="group relative border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600"
                                 :class="{ 'ring-2 ring-primary-500': selectedDocuments.includes(file.id) }">
                                
                                <!-- Document Selection Checkbox -->
                                <div class="absolute top-2 right-2 z-10">
                                    <Checkbox v-model="selectedDocuments" 
                                              :value="file.id" 
                                              class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                              :class="{ 'opacity-100': selectedDocuments.includes(file.id) }" />
                                </div>
                                
                                <!-- Compact File Header with Icon and Invoice Number -->
                                <div class="py-2 px-3 flex items-center gap-2"
                                     :class="getCompactFileHeaderClass(file)">
                                    <i :class="[getFileIcon(file), 'text-lg']"></i>
                                    <span class="font-medium truncate flex-1 text-sm">
                                        {{ file.invoice_number ? `Invoice #${file.invoice_number}` : 'No Invoice Number' }}
                                    </span>
                                </div>
                                
                                <!-- Compact Document Info -->
                                <div class="p-3 space-y-2">
                                    <!-- Filename (Bold and Prominent) -->
                                    <div class="font-semibold text-surface-900 dark:text-surface-0 text-sm truncate" 
                                         :title="file.filename || 'Unnamed file'">
                                        {{ file.filename || file.fullPath?.split('/').pop() || 'Unnamed file' }}
                                    </div>
                                    
                                    <!-- Date and Type -->
                                    <div class="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                                        <span>{{ formatFileDate(file.created_at) }}</span>
                                        <span class="font-medium">{{ getFileTypeLabel(file) }}</span>
                                    </div>
                                    
                                    <!-- Template Name -->
                                    <div v-if="file.template_name" class="flex items-center gap-2 text-xs">
                                        <i class="pi pi-tag text-orange-500"></i>
                                        <span class="text-surface-600 dark:text-surface-400 truncate">{{ file.template_name }}</span>
                                    </div>
                                    
                                    <!-- Document Actions -->
                                    <div class="flex gap-1 pt-2 border-t border-surface-200 dark:border-surface-700">
                                        <Button icon="pi pi-eye" 
                                                size="small" 
                                                text 
                                                class="flex-1"
                                                v-tooltip.top="'Preview'"
                                                @click="previewFile(file)" />
                                        <Button icon="pi pi-download" 
                                                size="small" 
                                                text 
                                                class="flex-1"
                                                v-tooltip.top="'Download'"
                                                @click="downloadFile(file)" />
                                        <Button icon="pi pi-share-alt" 
                                                size="small" 
                                                text 
                                                class="flex-1"
                                                v-tooltip.top="'Share'"
                                                @click="shareFile(file)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Merged Invoices View -->
                <div v-else-if="activeDocumentTab === 'merged'">
                    <div v-if="filteredMergedDocuments.length === 0" 
                         class="flex flex-col items-center justify-center p-12">
                        <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                            <i class="pi pi-objects-column text-purple-500 text-2xl"></i>
                        </div>
                        <div class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Merged Invoices</div>
                        <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md mb-4">
                            {{ selectedCustomer?.name || 'This customer' }} hasn't created any merged invoices yet. Use the merge mode to combine multiple invoices.
                        </div>
                        <Button label="Enable Merge Mode" 
                                icon="pi pi-objects-column" 
                                @click="isMergeMode = true" 
                                outlined />
                    </div>
                    
                    <div v-else>
                        <!-- Merged Documents Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                    <i class="pi pi-objects-column text-purple-600 dark:text-purple-400"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-surface-900 dark:text-surface-0">Merged Invoices</h3>
                                    <p class="text-sm text-surface-600 dark:text-surface-400">{{ filteredMergedDocuments.length }} merged documents</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Merged Documents Table -->
                        <DataTable :value="filteredMergedDocuments" 
                                   responsiveLayout="scroll" 
                                   :paginator="true" 
                                   :rows="10"
                                   class="modern-table">
                            <Column field="merged_invoice" header="Merged Invoice" sortable>
                                <template #body="slotProps">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                            <i class="pi pi-objects-column text-purple-600 dark:text-purple-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.merged_invoice }}</div>
                                            <div class="text-xs text-surface-500 dark:text-surface-400">Merged Invoice</div>
                                        </div>
                                    </div>
                                </template>
                            </Column>
                            <Column field="original_count" header="Source Invoices" sortable>
                                <template #body="slotProps">
                                    <Tag :value="`${slotProps.data.original_count} invoices`" severity="info" />
                                </template>
                            </Column>
                            <Column field="total_amount" header="Total Amount" sortable>
                                <template #body="slotProps">
                                    <span class="font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(slotProps.data.total_amount) }}</span>
                                </template>
                            </Column>
                            <Column field="merge_date" header="Created" sortable>
                                <template #body="slotProps">
                                    <div class="flex flex-col">
                                        <span class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ formatDate(slotProps.data.merge_date) }}</span>
                                        <span class="text-xs text-surface-500 dark:text-surface-400">{{ formatTimeAgo(slotProps.data.merge_date) }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="template_used" header="Template" sortable>
                                <template #body="slotProps">
                                    <div class="flex flex-col">
                                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.template_used }}</span>
                                        <span v-if="slotProps.data.template_override" class="text-xs text-orange-600 dark:text-orange-400 uppercase">
                                            {{ slotProps.data.template_override }}
                                        </span>
                                    </div>
                                </template>
                            </Column>
                            <Column header="Actions" style="width: 12rem">
                                <template #body="slotProps">
                                    <div class="flex gap-1">
                                        <Button icon="pi pi-eye" 
                                                size="small" 
                                                text 
                                                rounded 
                                                v-tooltip.top="'View Details'"
                                                @click="viewMergeDetails(slotProps.data)" />
                                        <Button icon="pi pi-download" 
                                                size="small" 
                                                text 
                                                rounded 
                                                v-tooltip.top="'Download Files'"
                                                @click="downloadMergedFiles(slotProps.data)" />
                                        <Button icon="pi pi-history" 
                                                size="small" 
                                                text 
                                                rounded 
                                                v-tooltip.top="'View Source Invoices'"
                                                @click="viewSourceInvoices(slotProps.data)" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>
</div>
</div>


<!-- File Preview Dialog -->
<Dialog v-model:visible="showFilePreview" :style="{ width: '90vw', height: '80vh' }" modal header="File Preview" :closable="true">
    <div v-if="selectedFile" class="w-full h-full flex flex-col">
        <div class="flex justify-between items-center mb-3">
            <div class="font-medium text-lg flex items-center">
                <i :class="[getFileIcon(selectedFile), 'mr-2']"></i>
                {{ selectedFile.filename || selectedFile.fullPath?.split('/').pop() || 'Unnamed file' }}
                <span class="ml-3 text-sm text-400">{{ formatDate(selectedFile.created_at) }}</span>
            </div>
            <Button icon="pi pi-download" text @click="downloadFile(selectedFile)" />
        </div>
        
        <!-- Error display if preview fails -->
        <Message v-if="previewError" severity="error" :closable="false" class="mb-4 w-full">
            <div class="flex flex-col">
                <span class="font-bold">Failed to load preview</span>
                <span>{{ previewErrorMessage }}</span>
                <div class="mt-2">
                    <Button label="Try downloading instead" icon="pi pi-download" 
                            @click="downloadFile(selectedFile)" class="p-button-sm" />
                </div>
            </div>
        </Message>
        
        <div class="flex-1 overflow-hidden">
            <!-- PDF Preview iframe - only for PDFs -->
            <div v-if="selectedFile && (selectedFile.fileType === 'pdf' || selectedFile.originalData?.type === 'pdf')" 
                 class="w-full h-full relative" style="height: calc(70vh - 6rem);">
                <div v-if="!previewError" class="absolute inset-0 flex items-center justify-center bg-surface-50 dark:bg-surface-800 z-0">
                    <ProgressSpinner class="w-12 h-12" />
                    <span class="ml-2">Loading preview...</span>
                </div>
                
                <iframe 
                    v-if="!previewError"
                    :src="previewUrl" 
                    class="w-full h-full border-0 relative z-10"
                    title="PDF Preview"
                    @load="onIframeLoad"
                    @error="onIframeError"
                    ref="previewIframe"
                    style="height: calc(70vh - 6rem) !important; min-height: 400px !important;"
                ></iframe>
                
                <!-- Fallback if preview fails -->
                <div v-if="previewError" class="flex flex-col items-center justify-center h-full">
                    <i :class="[getFileIcon(selectedFile), 'text-7xl mb-4']"></i>
                    <p class="text-xl mb-4">Preview failed to load</p>
                    <p class="text-sm text-surface-600 dark:text-surface-400 mb-4 max-w-lg text-center">
                        The server returned an error while trying to preview this file. 
                        You can try downloading it instead.
                    </p>
                    <Button label="Download File" icon="pi pi-download" @click="downloadFile(selectedFile)" />
                </div>
            </div>
            
            <!-- Excel Preview - only for Excel files -->
            <div v-else-if="selectedFile && (selectedFile.fileType === 'excel' || selectedFile.originalData?.type === 'excel')"
                 class="w-full h-full">
                <ExcelPreview :file="selectedFile" :fileUrl="previewUrl" />
            </div>
            
            <!-- For other file types, show a download prompt -->
            <div v-else class="flex flex-col items-center justify-center h-full">
                <i :class="[getFileIcon(selectedFile), 'text-7xl mb-4']"></i>
                <p class="text-xl mb-4">This file type cannot be previewed directly</p>
                <Button label="Download File" icon="pi pi-download" @click="downloadFile(selectedFile)" />
            </div>
        </div>
    </div>
</Dialog>

<!-- Invoice Detail Drawer -->
<Drawer v-model:visible="showInvoiceDrawer" header="Invoice Details" position="right" class="!w-full md:!w-[90vw] lg:!w-[80vw] xl:!w-[75vw]">
    <div v-if="drawerSelectedInvoice" class="h-full overflow-auto bg-surface-50 dark:bg-surface-900">
        <!-- Compact Professional Header -->
        <div class="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shadow-sm">
            <div class="px-4 py-3">
                <!-- Top Row: Company Info & Invoice Number -->
                <div class="flex items-start justify-between mb-3">
                    <!-- Company Branding - Compact -->
                    <div class="flex items-center gap-3">
                        <div class="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-3" style="background: linear-gradient(135deg, #082944 0%, #1a3a5c 100%);">
                            <img src="/layout/images/cis-logo-tagline-white.png" alt="CIS Logo" width="120" height="30" class="opacity-95" />
                        </div>
                        <div class="text-xs text-surface-600 dark:text-surface-400 leading-tight">
                            <div>1023 Calle Sombra Unit B, San Clemente, CA 92673</div>
                        </div>
                    </div>
                    
                    <!-- Invoice Number & Status -->
                    <div class="text-right">
                        <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Invoice</div>
                        <div class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice?.number || drawerSelectedInvoice?.id || '' }}</div>
                        <Tag :value="drawerSelectedInvoice?.status?.toUpperCase() || 'UNKNOWN'" 
                             :severity="drawerSelectedInvoice?.status === 'paid' ? 'success' : drawerSelectedInvoice?.status === 'open' ? 'info' : 'warning'"
                             class="text-xs mt-1" />
                    </div>
                </div>
                
                <!-- Bottom Row: Controls & Key Info -->
                <div class="flex items-center justify-between">
                    <!-- Interactive Toggle -->
                    <ToggleButton 
                        v-model="drawerIsInteractive" 
                        onLabel="Interactive" 
                        offLabel="Standard" 
                        onIcon="pi pi-cog" 
                        offIcon="pi pi-eye" 
                        :class="drawerIsInteractive ? 'p-button-success' : 'p-button-secondary'"
                        class="text-xs"
                        size="small"
                        @change="onDrawerInteractiveToggle"
                    />
                    
                    <!-- Key Invoice Info - Compact -->
                    <div class="flex items-center gap-4 text-xs">
                        <div class="text-center">
                            <div class="text-surface-500 dark:text-surface-400">Issue Date</div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(drawerSelectedInvoice?.date) || 'N/A' }}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-surface-500 dark:text-surface-400">Due Date</div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(drawerSelectedInvoice?.dueDate) || 'N/A' }}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-surface-500 dark:text-surface-400">Amount</div>
                            <div class="font-bold text-lg" style="color: #FF9400;">{{ formatCurrency(drawerSelectedInvoice?.total) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Content Area -->
        <div class="p-4 space-y-4">
            <!-- Bill To & Invoice Details - Side by Side -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Bill To Section - Compact -->
                <div class="bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="pi pi-user text-primary-600 dark:text-primary-400 text-sm"></i>
                        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0">Bill To</h3>
                    </div>
                    <div class="space-y-2">
                        <div class="font-bold text-surface-900 dark:text-surface-0">
                            {{ drawerSelectedInvoice?.customer?.company || drawerSelectedInvoice?.customer?.name || 'N/A' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed" 
                             v-html="drawerSelectedInvoice?.customer?.address?.replace(/\n/g, '<br />') || 'No address provided'">
                        </div>
                        <div v-if="drawerSelectedInvoice?.customer?.id" class="inline-flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded text-xs">
                            <i class="pi pi-id-card text-xs text-surface-500"></i>
                            <span class="text-surface-700 dark:text-surface-300">ID: {{ drawerSelectedInvoice.customer.id }}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Invoice Details - Compact -->
                <div class="bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 text-sm"></i>
                        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0">Invoice Information</h3>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Customer ID</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice?.customer?.id || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Payment Status</span>
                            <Tag :value="drawerSelectedInvoice?.status?.toUpperCase() || 'UNKNOWN'" 
                                 :severity="drawerSelectedInvoice?.status === 'paid' ? 'success' : drawerSelectedInvoice?.status === 'open' ? 'info' : 'warning'"
                                 class="text-xs" />
                        </div>
                        <div v-if="drawerSelectedInvoice?.terms" class="flex justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Payment Terms</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice.terms }}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Interactive Tools Panel - Compact -->
            <div v-if="drawerIsInteractive" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-cog text-blue-600 dark:text-blue-400"></i>
                        <span class="text-sm font-medium text-surface-900 dark:text-surface-0">Interactive Analysis</span>
                    </div>
                    <div class="w-48">
                        <Select 
                            v-model="drawerSelectedGroupBy" 
                            :options="groupByOptions" 
                            optionLabel="name" 
                            placeholder="Group By"
                            class="w-full text-xs"
                            size="small"
                        />
                    </div>
                </div>
            </div>
            
            <!-- Invoice Items Section - Compact -->
            <div class="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                <div class="bg-surface-50 dark:bg-surface-700 px-4 py-3 border-b border-surface-200 dark:border-surface-600">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-list text-green-600 dark:text-green-400 text-sm"></i>
                            <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0">Line Items</h3>
                        </div>
                        <div v-if="drawerProducts.length > 0">
                            <Tag :value="`${drawerProducts.length} items`" severity="info" class="text-xs" />
                        </div>
                    </div>
                </div>
                
                <div class="p-4">
                    <!-- Regrouping loading state -->
                    <div v-if="drawerIsRegrouping" class="flex justify-center items-center py-8">
                        <div class="text-center">
                            <ProgressSpinner class="w-8 h-8" />
                            <div class="mt-2 text-sm text-surface-600 dark:text-surface-400">Analyzing items...</div>
                        </div>
                    </div>

                    <!-- Standard non-grouped display -->
                    <DataTable v-else-if="!drawerIsInteractive || drawerSelectedGroupBy.value === 'none'" 
                             :value="drawerProducts" 
                             tableStyle="min-width: 50rem"
                             :rowHover="true"
                             stripedRows
                             responsiveLayout="scroll"
                             class="compact-invoice-table"
                             size="small">
                        <Column field="description" header="Description" class="font-medium">
                            <template #body="slotProps">
                                <div class="py-1">
                                    <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.description }}</div>
                                </div>
                            </template>
                        </Column>
                        <Column field="quantity" header="Qty" class="text-center" style="width: 80px">
                            <template #body="slotProps">
                                <div class="text-center">
                                    <span class="inline-flex items-center justify-center w-10 h-6 bg-surface-100 dark:bg-surface-700 rounded text-xs font-medium">
                                        {{ slotProps.data.quantity }}
                                    </span>
                                </div>
                            </template>
                        </Column>
                        <Column field="price" header="Unit Price" class="text-right" style="width: 100px">
                            <template #body="slotProps">
                                <div class="text-right font-medium text-surface-700 dark:text-surface-300 text-sm">{{ slotProps.data.price }}</div>
                            </template>
                        </Column>
                        <Column field="total" header="Amount" class="text-right" style="width: 100px">
                            <template #body="slotProps">
                                <div class="text-right font-bold text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.total }}</div>
                            </template>
                        </Column>
                    </DataTable>

                    <!-- Grouped display -->
                    <div v-else-if="drawerGroupedProducts.length > 0" class="space-y-4">
                        <div v-for="(group, index) in drawerGroupedProducts" :key="index" class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                            <!-- Group Header - Compact -->
                            <div class="bg-primary-50 dark:bg-primary-900/30 px-4 py-2 border-b border-primary-200 dark:border-primary-700">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-tag text-primary-600 dark:text-primary-400 text-sm"></i>
                                        <div>
                                            <h4 class="font-bold text-primary-900 dark:text-primary-100 text-sm">{{ group.name }}</h4>
                                            <p class="text-xs text-primary-700 dark:text-primary-300">{{ group.groupType }} • {{ group.items.length }} items</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-primary-900 dark:text-primary-100">{{ formatCurrency(group.total) }}</div>
                                        <div class="text-xs text-primary-700 dark:text-primary-300">Group Total</div>
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
                                class="compact-invoice-table group-table"
                                size="small">
                                    <Column field="description" header="Description" class="font-medium">
                                        <template #body="slotProps">
                                            <div class="py-1">
                                                <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.description }}</div>
                                            </div>
                                        </template>
                                    </Column>
                                    <Column field="quantity" header="Qty" class="text-center" style="width: 80px">
                                        <template #body="slotProps">
                                            <div class="text-center">
                                                <span class="inline-flex items-center justify-center w-10 h-6 bg-surface-100 dark:bg-surface-700 rounded text-xs font-medium">
                                                    {{ slotProps.data.quantity }}
                                                </span>
                                            </div>
                                        </template>
                                    </Column>
                                    <Column field="price" header="Unit Price" class="text-right" style="width: 100px">
                                        <template #body="slotProps">
                                            <div class="text-right font-medium text-surface-700 dark:text-surface-300 text-sm">{{ slotProps.data.price }}</div>
                                        </template>
                                    </Column>
                                    <Column field="total" header="Amount" class="text-right" style="width: 100px">
                                        <template #body="slotProps">
                                            <div class="text-right font-bold text-surface-900 dark:text-surface-0 text-sm">{{ slotProps.data.total }}</div>
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </div>
                    </div>
                    
                    <!-- No items message -->
                    <div v-else class="text-center py-8">
                        <div class="w-12 h-12 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="pi pi-inbox text-lg text-surface-400"></i>
                        </div>
                        <div class="font-medium text-surface-600 dark:text-surface-400 mb-1">No items found</div>
                        <div class="text-sm text-surface-500 dark:text-surface-500">This invoice doesn't contain any line items</div>
                    </div>
                </div>
            </div>
            
            <!-- Invoice Totals Section - Compact -->
            <div class="bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <!-- Invoice Metadata - Compact -->
                    <div>
                        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                            <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 text-sm"></i>
                            Invoice Details
                        </h3>
                        <div class="space-y-2 text-xs text-surface-600 dark:text-surface-400">
                            <div class="flex items-center justify-between">
                                <span>Invoice Date:</span>
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(drawerSelectedInvoice?.date) || 'N/A' }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>Due Date:</span>
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(drawerSelectedInvoice?.dueDate) || 'N/A' }}</span>
                            </div>
                            <div v-if="drawerSelectedInvoice?.poNumber" class="flex items-center justify-between">
                                <span>PO Number:</span>
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice.poNumber }}</span>
                            </div>
                            <div v-if="drawerSelectedInvoice?.terms" class="flex items-center justify-between">
                                <span>Terms:</span>
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ drawerSelectedInvoice.terms }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Financial Summary - Compact -->
                    <div>
                        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-0 mb-3">Invoice Summary</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center py-1 border-b border-surface-100 dark:border-surface-700">
                                <span class="text-sm text-surface-600 dark:text-surface-400">Subtotal</span>
                                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(drawerSelectedInvoice?.subtotal) }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-surface-100 dark:border-surface-700">
                                <span class="text-sm text-surface-600 dark:text-surface-400">Tax ({{ drawerSelectedInvoice?.vatRate || 0 }}%)</span>
                                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ formatCurrency(drawerSelectedInvoice?.vat) }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 border border-primary-200 dark:border-primary-800">
                                <span class="font-bold text-primary-900 dark:text-primary-100">Total Amount</span>
                                <span class="text-xl font-bold" style="color: #FF9400;">{{ formatCurrency(drawerSelectedInvoice?.total) }}</span>
                            </div>
                            <div v-if="drawerSelectedInvoice?.remainingAmount > 0" class="flex justify-between items-center py-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 border border-red-200 dark:border-red-800">
                                <span class="font-bold text-red-900 dark:text-red-100 flex items-center gap-1">
                                    <i class="pi pi-exclamation-triangle text-xs"></i>
                                    Amount Due
                                </span>
                                <span class="text-xl font-bold text-red-900 dark:text-red-100">{{ formatCurrency(drawerSelectedInvoice?.remainingAmount) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Loading state -->
    <div v-else class="flex justify-center items-center p-8 h-full">
        <div class="text-center">
            <ProgressSpinner class="w-12 h-12" />
            <div class="mt-4 font-medium text-surface-600 dark:text-surface-400">Loading invoice details...</div>
            <div class="mt-1 text-sm text-surface-500 dark:text-surface-500">Please wait while we fetch the invoice information</div>
        </div>
    </div>
</Drawer>

<!-- Merge History Dialog -->
<Dialog v-model:visible="showMergeHistory" header="Merge History" :style="{ width: '80vw', maxWidth: '1000px' }" modal>
    <div v-if="isLoadingMergeHistory" class="flex justify-center items-center p-6">
        <ProgressSpinner />
        <span class="ml-3">Loading merge history...</span>
    </div>
    
    <div v-else-if="mergeHistoryData.length === 0" class="text-center p-6">
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-3"></i>
        <div class="text-lg text-surface-600 dark:text-surface-400">No merge history found</div>
        <div class="text-sm text-surface-500 dark:text-surface-500 mt-2">
            {{ selectedCustomer?.name || 'This customer' }} has not performed any invoice merges yet
        </div>
    </div>
    
    <div v-else>
        <DataTable :value="mergeHistoryData" responsiveLayout="scroll" :paginator="true" :rows="10">
            <Column field="merged_invoice" header="Merged Invoice" sortable>
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-objects-column text-primary-500"></i>
                        <span class="font-medium">{{ slotProps.data.merged_invoice }}</span>
                    </div>
                </template>
            </Column>
            <Column field="original_count" header="Invoices Merged" sortable>
                <template #body="slotProps">
                    <Tag :value="`${slotProps.data.original_count} invoices`" severity="info" />
                </template>
            </Column>
            <Column field="total_amount" header="Total Amount" sortable>
                <template #body="slotProps">
                    <span class="font-semibold">{{ formatCurrency(slotProps.data.total_amount) }}</span>
                </template>
            </Column>
            <Column field="merge_date" header="Merge Date" sortable>
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.merge_date) }}
                </template>
            </Column>
            <Column field="template_used" header="Template" sortable>
                <template #body="slotProps">
                    <div class="flex flex-col">
                        <span class="font-medium">{{ slotProps.data.template_used }}</span>
                        <span v-if="slotProps.data.template_override" class="text-xs text-surface-500 uppercase">
                            {{ slotProps.data.template_override }}
                        </span>
                    </div>
                </template>
            </Column>
            <Column header="Actions" style="width: 8rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-eye" size="small" text rounded 
                                v-tooltip.top="'View Original Invoices'"
                                @click="viewMergeDetails(slotProps.data)" />
                        <Button icon="pi pi-download" size="small" text rounded 
                                v-tooltip.top="'Download Merged Files'"
                                @click="downloadMergedFiles(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</Dialog>

<!-- Duplicate Merge Confirmation Dialog -->
<Dialog v-model:visible="showDuplicateConfirmation" header="Merge Already Exists" :style="{ width: '600px' }" modal>
    <div v-if="duplicateDetails" class="space-y-4">
        <div class="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-xl mt-1"></i>
            <div class="flex-1">
                <div class="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Duplicate Merge Detected
                </div>
                <div class="text-amber-700 dark:text-amber-300 text-sm">
                    A merged invoice already exists for the selected invoices. You can either keep the existing merge or regenerate it with new settings.
                </div>
            </div>
        </div>
        
        <div class="space-y-3">
            <div class="font-medium text-surface-900 dark:text-surface-0">
                Selected Invoices for Merge:
            </div>
            <div class="flex flex-wrap gap-2">
                <span v-for="invoice in selectedInvoicesForMerge" :key="invoice.id" 
                      class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                    {{ invoice.number }}
                </span>
            </div>
            
            <div class="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">
                    What would you like to do?
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-400">
                    • <strong>Keep Existing:</strong> Cancel this merge and use the existing merged invoice<br>
                    • <strong>Regenerate:</strong> Create a new merged invoice, replacing the existing one
                </div>
            </div>
        </div>
    </div>
    
    <template #footer>
        <div class="flex justify-end gap-2">
            <Button label="Keep Existing" icon="pi pi-check" 
                    @click="handleDuplicateConfirmation(false)" 
                    class="p-button-secondary" />
            <Button label="Regenerate" icon="pi pi-refresh" 
                    @click="handleDuplicateConfirmation(true)" 
                    class="p-button-warning" />
        </div>
    </template>
</Dialog>
</template>
<style scoped>
/* Fix for PDF preview to take up full modal height */
:deep(.p-dialog-content) {
  overflow: hidden;
  height: auto !important;
  padding-bottom: 0 !important;
}

/* Make sure iframe takes full height */
iframe {
  width: 100%; 
  height: 100%;
  border: none;
  display: block;
}

/* Excel preview container styles */
.excel-preview :deep(.p-datatable) {
  height: 100%;
}

/* Fix spacing for file cards */
.file-card-header {
  display: flex;
  align-items: center;
}

/* Ensure consistent spacing in file cards */
.file-metadata {
  min-height: 120px;
}

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

/* Hover effect for rows */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(59, 130, 246, 0.05) !important;
  transition: all 0.2s ease;
}

/* Dark mode hover effect */
:deep(.dark .p-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(59, 130, 246, 0.1) !important;
}

/* Compact invoice table styling */
:deep(.compact-invoice-table) {
  font-size: 0.875rem;
}

:deep(.compact-invoice-table .p-datatable-thead > tr > th) {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-200);
}

:deep(.dark .compact-invoice-table .p-datatable-thead > tr > th) {
  background: var(--surface-800);
  border-bottom: 1px solid var(--surface-700);
}

:deep(.compact-invoice-table .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-100);
}

:deep(.dark .compact-invoice-table .p-datatable-tbody > tr > td) {
  border-bottom: 1px solid var(--surface-700);
}

/* Group table specific styling */
:deep(.group-table .p-datatable-thead > tr > th) {
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-200);
}

:deep(.dark .group-table .p-datatable-thead > tr > th) {
  background: var(--surface-800);
  border-bottom: 1px solid var(--surface-600);
}

/* Modern document management styling */
.document-card {
  transition: all 0.2s ease;
  border: 1px solid var(--surface-200);
  background: var(--surface-0);
  border-radius: 0.5rem;
}

.dark .document-card {
  border: 1px solid var(--surface-700);
  background: var(--surface-800);
}

.document-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-300);
}

.dark .document-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: var(--primary-600);
}

.document-card.selected {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 1px rgba(var(--primary-500), 0.2);
}

/* Compact file header styling */
.compact-file-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 1px solid var(--surface-200);
}

.dark .compact-file-header {
  border-bottom: 1px solid var(--surface-700);
}

/* Remove the old chunky file type headers */
.file-header-pdf,
.file-header-excel,
.file-header-word,
.file-header-default {
  display: none;
}

/* Enhanced tab navigation */
.document-tabs {
  background: var(--surface-50);
  border-radius: 0.75rem;
  padding: 0.25rem;
}

.dark .document-tabs {
  background: var(--surface-800);
}

.document-tab {
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.document-tab.active {
  background: var(--surface-0);
  color: var(--primary-600);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .document-tab.active {
  background: var(--surface-700);
  color: var(--primary-400);
}

.document-tab:not(.active) {
  color: var(--surface-600);
}

.dark .document-tab:not(.active) {
  color: var(--surface-400);
}

.document-tab:not(.active):hover {
  color: var(--surface-900);
}

.dark .document-tab:not(.active):hover {
  color: var(--surface-100);
}

/* Search and filter bar styling */
.search-filter-bar {
  background: var(--surface-50);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--surface-200);
}

.dark .search-filter-bar {
  background: var(--surface-800);
  border: 1px solid var(--surface-700);
}

/* Document grid improvements - more compact */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .document-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

/* Document metadata styling - more compact */
.document-metadata {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--surface-600);
  line-height: 1.3;
}

.dark .document-metadata {
  color: var(--surface-400);
}

.document-metadata i {
  width: 0.875rem;
  text-align: center;
  flex-shrink: 0;
}

/* Action buttons styling - more compact */
.document-actions {
  display: flex;
  gap: 0.125rem;
  margin-top: 0.5rem;
}

.document-actions .p-button {
  flex: 1;
  justify-content: center;
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
  min-height: auto;
}

/* Compact spacing */
.compact-spacing {
  padding: 0.75rem;
}

.compact-spacing > * + * {
  margin-top: 0.5rem;
}

/* Better visual hierarchy for compact design */
.compact-title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.compact-subtitle {
  font-size: 0.75rem;
  color: var(--surface-500);
  line-height: 1.3;
}

.dark .compact-subtitle {
  color: var(--surface-400);
}

/* Empty state styling */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-state-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.375rem;
  color: var(--surface-900);
}

.dark .empty-state-title {
  color: var(--surface-0);
}

.empty-state-description {
  font-size: 0.875rem;
  color: var(--surface-600);
  max-width: 20rem;
  margin: 0 auto;
  line-height: 1.4;
}

.dark .empty-state-description {
  color: var(--surface-400);
}

/* Modern table styling */
:deep(.modern-table) {
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--surface-200);
}

:deep(.dark .modern-table) {
  border: 1px solid var(--surface-700);
}

:deep(.modern-table .p-datatable-thead > tr > th) {
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-200);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.75rem;
}

:deep(.dark .modern-table .p-datatable-thead > tr > th) {
  background: var(--surface-800);
  border-bottom: 1px solid var(--surface-700);
}

:deep(.modern-table .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-100);
  font-size: 0.875rem;
}

:deep(.dark .modern-table .p-datatable-tbody > tr > td) {
  border-bottom: 1px solid var(--surface-700);
}

:deep(.modern-table .p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

:deep(.dark .modern-table .p-datatable-tbody > tr:hover) {
  background: var(--surface-800);
}

/* Checkbox styling improvements */
:deep(.p-checkbox) {
  transition: all 0.2s ease;
}

:deep(.p-checkbox:hover) {
  transform: scale(1.05);
}

/* Loading spinner improvements */
:deep(.p-progress-spinner) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive improvements */
@media (max-width: 640px) {
  .document-library-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .document-actions-toolbar {
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .search-filter-bar {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }
  
  .compact-spacing {
    padding: 0.5rem;
  }
}
</style>
