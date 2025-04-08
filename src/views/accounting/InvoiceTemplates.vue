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
import { useLayout } from '@/layout/composables/layout';

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
  try {
    if (customerListType.value) {
      await customerStore.fetchActiveCustomers();
    } else {
      await customerStore.fetchCustomers();
    }
    
    // Clear any previously selected customers when the list changes
    selectedCustomer.value = null;
    selectedCustomerInvoice.value = null;
    selectedTemplate.value = null;
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
async function onCustomerChange() {
  selectedCustomerInvoice.value = null;
  selectedTemplate.value = null;
  activeDocumentTab.value = 'customer';
  await loadCustomerInvoices();
  
  // Load available templates for the selected customer
  if (selectedCustomer.value) {
    await loadAvailableTemplates(selectedCustomer.value.id);
    // Load customer documents using the customer number
    await loadCustomerDocuments(selectedCustomer.value.number);
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
  if (selectedCustomerInvoice.value) {
    activeDocumentTab.value = 'invoice';
    // Load generated files for the selected invoice
    await loadGeneratedFiles(selectedCustomerInvoice.value.number);
    
    // If there's a customer ID, refine the template list
    if (selectedCustomer.value && selectedCustomerInvoice.value.number) {
      await loadAvailableTemplates(selectedCustomer.value.id, selectedCustomerInvoice.value.number);
    }
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
  } else if (file.filename) {
    const filename = file.filename.toLowerCase();
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      fileType = 'excel';
    } else if (filename.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      fileType = 'word';
    }
  } else if (file.originalData?.type) {
    fileType = file.originalData.type;
  }
  
  try {
    const success = await invoiceStore.downloadGeneratedFile(fileId, fileType);
    if (!success) {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to download file', 
        life: 3000 
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
</script>

<template>
    <Toast position="bottom-center" />
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
                                    <Button 
                                        label="Generate Template" 
                                        icon="pi pi-file-export" 
                                        class="w-full" 
                                        :disabled="!selectedTemplate || !selectedCustomerInvoice || isGeneratingTemplate" 
                                        :loading="isGeneratingTemplate"
                                        @click="generateTemplateDocument" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Generated Files Section -->
                    <div class="col-span-12 md:col-span-7 xl:col-span-8">
                        <div class="card">
                            <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Document Library</div>
                            
                            <!-- Document Type Tabs -->
                            <div class="flex justify-between items-center mb-4 border-b border-surface-200 dark:border-surface-700">
                                <div class="flex">
                                    <div class="pb-3 px-4 cursor-pointer font-medium border-b-2 transition-colors duration-200"
                                         :class="[activeDocumentTab === 'customer' ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400']"
                                         @click="activeDocumentTab = 'customer'">
                                        Customer Documents
                                    </div>
                                    <div class="pb-3 px-4 font-medium border-b-2 transition-colors duration-200"
                                         :class="[
                                            activeDocumentTab === 'invoice' ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400',
                                            !selectedCustomerInvoice ? 'text-surface-400 cursor-not-allowed' : 'cursor-pointer'
                                         ]"
                                         @click="selectedCustomerInvoice && (activeDocumentTab = 'invoice')">
                                        Invoice Documents
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Loading files message -->
                            <div v-if="isLoadingGeneratedFiles || isLoadingCustomerDocuments" class="flex justify-center items-center p-4">
                                <ProgressSpinner style="width: 50px; height: 50px" />
                                <span class="ml-3">Loading documents...</span>
                            </div>
                            
                            <!-- Error loading files -->
                            <div v-else-if="generatedFilesError || customerDocumentsError" class="p-4 flex flex-col items-center justify-center">
                                <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-3"></i>
                                <div class="text-lg text-yellow-500">{{ generatedFilesError || customerDocumentsError }}</div>
                            </div>
                            
                            <!-- No customer selected message -->
                            <div v-else-if="!selectedCustomer" class="p-4 flex flex-col items-center justify-center">
                                <i class="pi pi-users text-4xl text-primary mb-3"></i>
                                <div class="text-lg">Select a customer to see documents</div>
                            </div>
                            
                            <!-- Invoice Documents View -->
                            <div v-else-if="activeDocumentTab === 'invoice'">
                                <!-- No files generated message -->
                                <div v-if="generatedFiles.length === 0" class="p-4 flex flex-col items-center justify-center">
                                    <i class="pi pi-info-circle text-4xl text-primary mb-3"></i>
                                    <div class="text-lg">No documents have been generated for this invoice</div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400 mt-2">
                                        Select a template and click "Generate Template" to create documents
                                    </div>
                                </div>
                                
                                <!-- Files grid for invoice documents -->
                                <div v-else>
                                    <div class="mb-3 text-lg font-medium">
                                        Invoice #{{ selectedCustomerInvoice.number }} Documents
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                        <div v-for="(file, index) in generatedFiles" :key="file?.id || index" 
                                             class="border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
                                            <div v-if="file" class="flex flex-col h-full">
                                                <!-- File header with icon and background, color-coded by file type -->
                                                <div class="py-2 px-3" 
                                                     :class="[
                                                        file.fileType === 'excel' || (file.originalData?.type === 'excel') ? 
                                                            'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800' : 
                                                        file.fileType === 'pdf' || (file.originalData?.type === 'pdf') ? 
                                                            'bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800' :
                                                            'bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700'
                                                     ]">
                                                    <div class="flex items-center">
                                                        <i :class="[getFileIcon(file), 'text-xl mr-2']"></i>
                                                        <span class="font-medium truncate flex-1 text-sm">
                                                            {{ file.filename || file.fullPath?.split('/').pop() || 'Unnamed file' }}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <!-- File metadata -->
                                                <div class="p-3 text-sm text-surface-600 dark:text-surface-400 flex-1">
                                                    <div class="mb-2 flex items-center">
                                                        <i class="pi pi-calendar text-sm mr-2"></i>
                                                        <span>{{ file.created_at ? formatDate(file.created_at) : 'No date' }}</span>
                                                    </div>
                                                    <div v-if="file.fileCategory" class="mb-2 flex items-center">
                                                        <i class="pi pi-file text-sm mr-2"></i>
                                                        <span class="capitalize">{{ file.fileCategory }} {{ file.fileType?.toUpperCase() }}</span>
                                                    </div>
                                                    <div v-if="file.template_name" class="flex items-center truncate">
                                                        <i class="pi pi-tag text-sm mr-2"></i>
                                                        <span>{{ file.template_name }}</span>
                                                    </div>
                                                </div>
                                                
                                                <!-- File actions -->
                                                <div class="flex border-t border-surface-200 dark:border-surface-700">
                                                    <Button icon="pi pi-eye" label="Preview" text class="flex-1 justify-center border-right" @click="previewFile(file)" />
                                                    <div class="border-l border-surface-200 dark:border-surface-700"></div>
                                                    <Button icon="pi pi-download" label="Download" text class="flex-1 justify-center" @click="downloadFile(file)" />
                                                </div>
                                            </div>
                                            <div v-else class="flex flex-col h-full justify-center items-center text-surface-400 p-6">
                                                <i class="pi pi-file-excel text-3xl mb-2"></i>
                                                <span>Invalid file data</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Customer Documents View -->
                            <div v-else-if="activeDocumentTab === 'customer'">
                                <!-- No customer documents message -->
                                <div v-if="customerDocuments.length === 0" class="p-4 flex flex-col items-center justify-center">
                                    <i class="pi pi-info-circle text-4xl text-primary mb-3"></i>
                                    <div class="text-lg">No documents found for this customer</div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400 mt-2">
                                        Select an invoice and generate templates to create documents
                                    </div>
                                </div>
                                
                                <!-- Files grid for customer documents -->
                                <div v-else>
                                    <div class="mb-3 text-lg font-medium">
                                        {{ selectedCustomer.name }} Documents
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                        <div v-for="(file, index) in customerDocuments" :key="file?.id || index" 
                                             class="border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
                                            <div v-if="file" class="flex flex-col h-full">
                                                <!-- File header with icon and background, color-coded by file type -->
                                                <div class="py-2 px-3" 
                                                     :class="[
                                                        file.fileType === 'excel' || (file.originalData?.type === 'excel') ? 
                                                            'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800' : 
                                                        file.fileType === 'pdf' || (file.originalData?.type === 'pdf') ? 
                                                            'bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800' :
                                                            'bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700'
                                                     ]">
                                                    <div class="flex items-center">
                                                        <i :class="[getFileIcon(file), 'text-xl mr-2']"></i>
                                                        <span class="font-medium truncate flex-1 text-sm">
                                                            {{ file.filename || file.fullPath?.split('/').pop() || 'Unnamed file' }}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <!-- File metadata -->
                                                <div class="p-3 text-sm text-surface-600 dark:text-surface-400 flex-1">
                                                    <div class="mb-2 flex items-center">
                                                        <i class="pi pi-calendar text-sm mr-2"></i>
                                                        <span>{{ file.created_at ? formatDate(file.created_at) : 'No date' }}</span>
                                                    </div>
                                                    <div class="mb-2 flex items-center" v-if="file.invoice_number">
                                                        <i class="pi pi-file-invoice text-sm mr-2"></i>
                                                        <span>Invoice #{{ file.invoice_number }}</span>
                                                    </div>
                                                    <div v-if="file.fileCategory" class="mb-2 flex items-center">
                                                        <i class="pi pi-file text-sm mr-2"></i>
                                                        <span class="capitalize">{{ file.fileCategory }} {{ file.fileType?.toUpperCase() }}</span>
                                                    </div>
                                                    <div v-if="file.template_name" class="flex items-center truncate">
                                                        <i class="pi pi-tag text-sm mr-2"></i>
                                                        <span>{{ file.template_name }}</span>
                                                    </div>
                                                </div>
                                                
                                                <!-- File actions -->
                                                <div class="flex border-t border-surface-200 dark:border-surface-700">
                                                    <Button icon="pi pi-eye" label="Preview" text class="flex-1 justify-center border-right" @click="previewFile(file)" />
                                                    <div class="border-l border-surface-200 dark:border-surface-700"></div>
                                                    <Button icon="pi pi-download" label="Download" text class="flex-1 justify-center" @click="downloadFile(file)" />
                                                </div>
                                            </div>
                                            <div v-else class="flex flex-col h-full justify-center items-center text-surface-400 p-6">
                                                <i class="pi pi-file-excel text-3xl mb-2"></i>
                                                <span>Invalid file data</span>
                                            </div>
                                        </div>
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
                <!-- PDF Preview using embed - only for PDFs -->
                <div v-if="selectedFile && (selectedFile.fileType === 'pdf' || selectedFile.originalData?.type === 'pdf')" 
                     class="w-full h-full relative">
                    <div v-if="!previewError" class="absolute inset-0 flex items-center justify-center bg-surface-50 dark:bg-surface-800 z-0">
                        <ProgressSpinner class="w-12 h-12" />
                        <span class="ml-2">Loading preview...</span>
                    </div>
                    
                    <embed 
                        v-if="!previewError"
                        :src="previewUrl" 
                        type="application/pdf"
                        class="w-full h-full relative z-10"
                        style="min-height: 100%;"
                    />
                    
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
</template>

<style scoped>
/* Fix for PDF preview to take up full modal height */
:deep(.p-dialog-content) {
  display: flex;
  flex-direction: column;
  height: calc(80vh - 6rem) !important; /* Account for header and footer */
  padding: 0 1.5rem 1.5rem 1.5rem;
  overflow: hidden;
}

/* Ensure the content container takes full height */
:deep(.p-dialog-content) > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Fix for embed to correctly display PDF */
embed {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
}

/* For dark mode PDF preview contrast */
:deep(.p-dialog) {
  background-color: var(--surface-card);
}

/* Fix padding for dialogs on mobile */
@media (max-width: 768px) {
  :deep(.p-dialog-content) {
    padding: 0 1rem 1rem 1rem;
  }
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
</style>
