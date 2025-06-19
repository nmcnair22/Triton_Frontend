<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Divider from 'primevue/divider';
import ProgressBar from 'primevue/progressbar';
import ToggleButton from 'primevue/togglebutton';
import Toolbar from 'primevue/toolbar';
import Dialog from 'primevue/dialog';
import OverlayPanel from 'primevue/overlaypanel';
import Panel from 'primevue/panel';
import Badge from 'primevue/badge';
import { FilterMatchMode } from '@primevue/core/api';

const router = useRouter();
const activeTab = ref(0);
const showDetailDialog = ref(false);
const selectedEntry = ref(null);
const detailsPanel = ref(null);
const comparisonEnabled = ref(false);

// Dimensions and filters
const periodOptions = ref([
  { name: 'Current Month', code: 'CM' },
  { name: 'Current Quarter', code: 'CQ' },
  { name: 'Current Year', code: 'CY' },
  { name: 'Previous Month', code: 'PM' },
  { name: 'Previous Quarter', code: 'PQ' },
  { name: 'Previous Year', code: 'PY' },
  { name: 'Custom Range', code: 'CR' }
]);
const selectedPeriod = ref(periodOptions.value[2]); // Default to Current Year

const dateRange = ref([
  new Date(new Date().getFullYear(), 0, 1), // Jan 1 of current year
  new Date()
]);

const comparisonPeriodOptions = ref([
  { name: 'Previous Period', code: 'PP' },
  { name: 'Previous Year Same Period', code: 'PY' },
  { name: 'Budget', code: 'BG' },
  { name: 'Forecast', code: 'FC' }
]);
const selectedComparisonPeriod = ref(comparisonPeriodOptions.value[0]);

const departmentOptions = ref([
  { name: 'All Departments', code: 'ALL' },
  { name: 'Sales', code: 'SALES' },
  { name: 'Marketing', code: 'MKTG' },
  { name: 'Operations', code: 'OPS' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Research & Development', code: 'RND' }
]);
const selectedDepartments = ref([departmentOptions.value[0]]);

const projectOptions = ref([
  { name: 'All Projects', code: 'ALL' },
  { name: 'Website Redesign', code: 'WEB01' },
  { name: 'ERP Implementation', code: 'ERP01' },
  { name: 'Market Expansion', code: 'MKT01' },
  { name: 'Product Launch', code: 'PRD01' },
  { name: 'Facility Upgrade', code: 'FAC01' }
]);
const selectedProjects = ref([projectOptions.value[0]]);

// Financial data structure
const financialData = ref({
  // P&L Statement data
  profitAndLoss: {
    summary: {
      revenue: 5678900,
      cogs: 3124500,
      grossProfit: 2554400,
      expenses: 1876200,
      operatingIncome: 678200,
      otherIncome: 45600,
      otherExpenses: 85400,
      netIncome: 638400
    },
    comparison: {
      revenue: 5328700,
      cogs: 2987600,
      grossProfit: 2341100,
      expenses: 1798400,
      operatingIncome: 542700,
      otherIncome: 38900,
      otherExpenses: 79800,
      netIncome: 501800
    },
    details: {
      revenue: [
        { account: '4000', description: 'Product Sales', amount: 4125600, comparison: 3856700, budget: 4200000 },
        { account: '4100', description: 'Service Revenue', amount: 1246300, comparison: 1175000, budget: 1300000 },
        { account: '4200', description: 'Subscription Revenue', amount: 307000, comparison: 297000, budget: 325000 }
      ],
      cogs: [
        { account: '5000', description: 'Direct Materials', amount: 1856700, comparison: 1756200, budget: 1900000 },
        { account: '5100', description: 'Direct Labor', amount: 978300, comparison: 942000, budget: 1000000 },
        { account: '5200', description: 'Manufacturing Overhead', amount: 289500, comparison: 289400, budget: 300000 }
      ],
      expenses: [
        { account: '6000', description: 'Salaries & Wages', amount: 945600, comparison: 912800, budget: 950000 },
        { account: '6100', description: 'Marketing & Advertising', amount: 289700, comparison: 277500, budget: 300000 },
        { account: '6200', description: 'Rent & Utilities', amount: 167800, comparison: 165400, budget: 170000 },
        { account: '6300', description: 'Professional Services', amount: 142300, comparison: 134700, budget: 150000 },
        { account: '6400', description: 'Travel & Entertainment', amount: 87600, comparison: 98500, budget: 100000 },
        { account: '6500', description: 'Office Supplies', amount: 56900, comparison: 54200, budget: 60000 },
        { account: '6600', description: 'IT & Software', amount: 98300, comparison: 89300, budget: 100000 },
        { account: '6700', description: 'Depreciation', amount: 88000, comparison: 66000, budget: 90000 }
      ],
      otherItems: [
        { account: '7000', description: 'Interest Income', amount: 45600, comparison: 38900, budget: 40000, type: 'income' },
        { account: '8000', description: 'Interest Expense', amount: 62400, comparison: 58800, budget: 65000, type: 'expense' },
        { account: '8100', description: 'Foreign Exchange Loss', amount: 23000, comparison: 21000, budget: 0, type: 'expense' }
      ]
    },
    monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      revenue: [430000, 445000, 470000, 464000, 475000, 490000, 502000, 495000, 485000, 478000, 470000, 475000],
      expenses: [386000, 392000, 405000, 402000, 410000, 418000, 425000, 422000, 418000, 415000, 412000, 417000],
      netIncome: [44000, 53000, 65000, 62000, 65000, 72000, 77000, 73000, 67000, 63000, 58000, 58000]
    }
  },
  
  // Balance Sheet data
  balanceSheet: {
    summary: {
      totalAssets: 8965400,
      totalLiabilities: 3245600,
      totalEquity: 5719800
    },
    comparison: {
      totalAssets: 8456200,
      totalLiabilities: 3374900,
      totalEquity: 5081300
    },
    details: {
      assets: [
        { account: '1000', description: 'Cash & Cash Equivalents', amount: 1245600, comparison: 1156800, budget: 1200000 },
        { account: '1100', description: 'Accounts Receivable', amount: 875400, comparison: 932100, budget: 850000 },
        { account: '1200', description: 'Inventory', amount: 1456300, comparison: 1389500, budget: 1500000 },
        { account: '1300', description: 'Prepaid Expenses', amount: 145800, comparison: 134200, budget: 150000 },
        { account: '1400', description: 'Property & Equipment', amount: 3856200, comparison: 3576400, budget: 4000000 },
        { account: '1500', description: 'Accumulated Depreciation', amount: -789400, comparison: -701300, budget: -800000 },
        { account: '1600', description: 'Intangible Assets', amount: 1245900, comparison: 1198600, budget: 1250000 },
        { account: '1700', description: 'Long-term Investments', amount: 929600, comparison: 769900, budget: 950000 }
      ],
      liabilities: [
        { account: '2000', description: 'Accounts Payable', amount: 678500, comparison: 724300, budget: 650000 },
        { account: '2100', description: 'Accrued Expenses', amount: 245600, comparison: 235700, budget: 250000 },
        { account: '2200', description: 'Short-term Debt', amount: 345000, comparison: 395000, budget: 300000 },
        { account: '2300', description: 'Deferred Revenue', amount: 187500, comparison: 176500, budget: 200000 },
        { account: '2400', description: 'Long-term Debt', amount: 1456000, comparison: 1564000, budget: 1400000 },
        { account: '2500', description: 'Deferred Tax Liabilities', amount: 333000, comparison: 279400, budget: 350000 }
      ],
      equity: [
        { account: '3000', description: 'Common Stock', amount: 2500000, comparison: 2500000, budget: 2500000 },
        { account: '3100', description: 'Additional Paid-in Capital', amount: 1250000, comparison: 1250000, budget: 1250000 },
        { account: '3200', description: 'Retained Earnings', amount: 1969800, comparison: 1331300, budget: 2000000 }
      ]
    },
    quarterly: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      assets: [8521300, 8654200, 8765900, 8965400],
      liabilities: [3321500, 3287400, 3256900, 3245600],
      equity: [5199800, 5366800, 5509000, 5719800]
    }
  },
  
  // General Ledger entries for drilldown
  generalLedger: {
    // This would typically be loaded on demand based on the selected account
    entries: [
      { id: 1, date: '2023-01-15', account: '4000', description: 'Product Sales - Retail', reference: 'INV-10045', debit: 0, credit: 125600 },
      { id: 2, date: '2023-01-18', account: '4000', description: 'Product Sales - Wholesale', reference: 'INV-10046', debit: 0, credit: 237800 },
      { id: 3, date: '2023-01-20', account: '4000', description: 'Product Sales - Online', reference: 'INV-10047', debit: 0, credit: 87500 },
      { id: 4, date: '2023-01-25', account: '4000', description: 'Product Sales - Retail', reference: 'INV-10048', debit: 0, credit: 134200 },
      { id: 5, date: '2023-01-27', account: '4000', description: 'Product Sales - Wholesale', reference: 'INV-10049', debit: 0, credit: 195700 },
      { id: 6, date: '2023-01-31', account: '4000', description: 'Product Sales - Online', reference: 'INV-10050', debit: 0, credit: 93500 },
      { id: 7, date: '2023-01-31', account: '4000', description: 'Product Sales - Returns', reference: 'CM-10002', debit: 12500, credit: 0 },
      { id: 8, date: '2023-01-10', account: '5000', description: 'Material Purchase - Hardware', reference: 'PO-2023-156', debit: 86700, credit: 0 },
      { id: 9, date: '2023-01-12', account: '5000', description: 'Material Purchase - Components', reference: 'PO-2023-157', debit: 124300, credit: 0 },
      { id: 10, date: '2023-01-24', account: '5000', description: 'Material Purchase - Packaging', reference: 'PO-2023-158', debit: 35600, credit: 0 }
    ]
  }
});

// Format all currency values
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

// Calculate percent change
const calculateChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

// Format percent changes
const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// Get color class based on value (positive is good for income items)
const getChangeColorClass = (value, inverseColor = false) => {
  if (value === 0) return 'text-gray-500';
  
  // For expenses, negative change is good (inverse logic)
  if (inverseColor) {
    return value < 0 ? 'text-green-500' : 'text-red-500';
  }
  
  return value > 0 ? 'text-green-500' : 'text-red-500';
};

// Get change icon based on value
const getChangeIcon = (value, inverseIcon = false) => {
  if (value === 0) return 'pi pi-minus';
  
  // For expenses, negative change is good (inverse logic)
  if (inverseIcon) {
    return value < 0 ? 'pi pi-arrow-down' : 'pi pi-arrow-up';
  }
  
  return value > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
};

// P&L chart data
const plChartData = computed(() => {
  return {
    labels: financialData.value.profitAndLoss.monthly.labels,
    datasets: [
      {
        type: 'line',
        label: 'Net Income',
        data: financialData.value.profitAndLoss.monthly.netIncome,
        borderColor: '#22c55e',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        type: 'bar',
        label: 'Revenue',
        data: financialData.value.profitAndLoss.monthly.revenue,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3b82f6',
        borderWidth: 1
      },
      {
        type: 'bar',
        label: 'Expenses',
        data: financialData.value.profitAndLoss.monthly.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: '#ef4444',
        borderWidth: 1
      }
    ]
  };
});

// P&L chart options
const plChartOptions = {
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += formatCurrency(context.raw);
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Month'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Amount'
      },
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '$' + (value/1000) + 'k';
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Balance Sheet chart data
const bsChartData = computed(() => {
  return {
    labels: financialData.value.balanceSheet.quarterly.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Assets',
        data: financialData.value.balanceSheet.quarterly.assets,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3b82f6',
        borderWidth: 1
      },
      {
        type: 'bar',
        label: 'Liabilities',
        data: financialData.value.balanceSheet.quarterly.liabilities,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: '#ef4444',
        borderWidth: 1
      },
      {
        type: 'bar',
        label: 'Equity',
        data: financialData.value.balanceSheet.quarterly.equity,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: '#22c55e',
        borderWidth: 1
      }
    ]
  };
});

// Balance Sheet chart options
const bsChartOptions = {
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += formatCurrency(context.raw);
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Quarter'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Amount'
      },
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '$' + (value/1000) + 'k';
        }
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Display the GL entries for a selected account
const showGLEntries = (account) => {
  selectedEntry.value = account;
  showDetailDialog.value = true;
};

// Filters for the GL entries table
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const globalFilterValue = ref('');

// Update global filter value
const onGlobalFilterChange = (e) => {
  const value = e.target.value;
  filters.value.global.value = value;
  globalFilterValue.value = value;
};

// Compute total for GL entries
const entryTotal = computed(() => {
  if (!selectedEntry.value) return { debit: 0, credit: 0, net: 0 };
  
  const entries = financialData.value.generalLedger.entries.filter(
    e => e.account === selectedEntry.value.account
  );
  
  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
  
  return {
    debit: totalDebit,
    credit: totalCredit,
    net: totalCredit - totalDebit
  };
});

// Handle period change
const handlePeriodChange = (period) => {
  if (period.code === 'CR') {
    // If custom range is selected, we'd show date picker
    // In a real app, this would trigger an API request
    console.log('Custom date range selected:', dateRange.value);
  } else {
    // In a real app, this would trigger an API request
    console.log('Period changed to:', period.name);
  }
};

// Handle dimension filters change
const applyDimensionFilters = () => {
  // In a real app, this would trigger an API request to filter data
  console.log('Applying filters:', {
    departments: selectedDepartments.value.map(d => d.name),
    projects: selectedProjects.value.map(p => p.name)
  });
};
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="mb-5">
      <h1 class="text-3xl font-bold mb-2">Financial Analysis</h1>
      <p class="text-gray-600 dark:text-gray-400">Interactive financial statement analysis with drill-down capabilities</p>
    </div>

    <!-- Filters Toolbar -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Period Selection -->
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                            <Select v-model="selectedPeriod" :options="periodOptions" optionLabel="name" 
                     class="w-full" @change="handlePeriodChange" />
          </div>
          
          <!-- Date Range (visible only for Custom Range) -->
          <div class="md:col-span-3" v-if="selectedPeriod.code === 'CR'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
                                            <DatePicker v-model="dateRange" selectionMode="range" dateFormat="mm/dd/yy" 
                     class="w-full" showIcon />
          </div>
          
          <!-- Comparison Toggle -->
          <div class="md:col-span-3 flex flex-column justify-content-end">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enable Comparison</label>
            <ToggleButton v-model="comparisonEnabled" onLabel="Comparison On" offLabel="Comparison Off" 
                          class="w-full" />
          </div>
          
          <!-- Comparison Period (visible only when comparison is enabled) -->
          <div class="md:col-span-3" v-if="comparisonEnabled">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compare To</label>
                            <Select v-model="selectedComparisonPeriod" :options="comparisonPeriodOptions" 
                     optionLabel="name" class="w-full" />
          </div>
        </div>
        
        <Divider />
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Department Filter -->
          <div class="md:col-span-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <MultiSelect v-model="selectedDepartments" :options="departmentOptions" optionLabel="name" 
                        class="w-full" display="chip" />
          </div>
          
          <!-- Project Filter -->
          <div class="md:col-span-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
            <MultiSelect v-model="selectedProjects" :options="projectOptions" optionLabel="name" 
                        class="w-full" display="chip" />
          </div>
          
          <!-- Apply Button -->
          <div class="md:col-span-4 flex items-end">
            <Button label="Apply Filters" icon="pi pi-filter" class="w-full" @click="applyDimensionFilters" />
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Financial Statement Tabs -->
    <TabView v-model:activeIndex="activeTab">
      <!-- Profit & Loss Tab -->
      <TabPanel header="Profit & Loss">
        <div class="grid grid-cols-1 gap-4">
          <!-- P&L Summary Card -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Profit & Loss Summary</span>
                <div class="flex gap-2">
                  <Button icon="pi pi-file-excel" text rounded tooltip="Export to Excel" />
                  <Button icon="pi pi-file-pdf" text rounded tooltip="Export to PDF" />
                </div>
              </div>
            </template>
            <template #content>
              <!-- Summary Table -->
              <div class="overflow-x-auto">
                <table class="min-w-full bg-white dark:bg-gray-800 border-collapse">
                  <thead>
                    <tr>
                      <th class="py-2 px-4 border-b text-left">Item</th>
                      <th class="py-2 px-4 border-b text-right">Amount</th>
                      <th v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">Comparison</th>
                      <th v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Revenue -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="py-2 px-4 border-b font-medium">Revenue</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.revenue) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.revenue) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.revenue, financialData.profitAndLoss.comparison.revenue))">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.revenue, financialData.profitAndLoss.comparison.revenue))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.revenue, financialData.profitAndLoss.comparison.revenue)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- COGS -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="py-2 px-4 border-b">Cost of Goods Sold</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.cogs) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.cogs) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.cogs, financialData.profitAndLoss.comparison.cogs), true)">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.cogs, financialData.profitAndLoss.comparison.cogs), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.cogs, financialData.profitAndLoss.comparison.cogs)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Gross Profit -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-900">
                      <td class="py-2 px-4 border-b font-medium">Gross Profit</td>
                      <td class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.profitAndLoss.summary.grossProfit) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.profitAndLoss.comparison.grossProfit) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.grossProfit, financialData.profitAndLoss.comparison.grossProfit))">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.grossProfit, financialData.profitAndLoss.comparison.grossProfit))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.grossProfit, financialData.profitAndLoss.comparison.grossProfit)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Expenses -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="py-2 px-4 border-b">Operating Expenses</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.expenses) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.expenses) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.expenses, financialData.profitAndLoss.comparison.expenses), true)">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.expenses, financialData.profitAndLoss.comparison.expenses), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.expenses, financialData.profitAndLoss.comparison.expenses)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Operating Income -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="py-2 px-4 border-b font-medium">Operating Income</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.operatingIncome) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.operatingIncome) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.operatingIncome, financialData.profitAndLoss.comparison.operatingIncome))">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.operatingIncome, financialData.profitAndLoss.comparison.operatingIncome))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.operatingIncome, financialData.profitAndLoss.comparison.operatingIncome)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Other Income -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="py-2 px-4 border-b">Other Income</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.otherIncome) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.otherIncome) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.otherIncome, financialData.profitAndLoss.comparison.otherIncome))">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.otherIncome, financialData.profitAndLoss.comparison.otherIncome))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.otherIncome, financialData.profitAndLoss.comparison.otherIncome)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Other Expenses -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="py-2 px-4 border-b">Other Expenses</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.otherExpenses) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.otherExpenses) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.otherExpenses, financialData.profitAndLoss.comparison.otherExpenses), true)">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.otherExpenses, financialData.profitAndLoss.comparison.otherExpenses), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.otherExpenses, financialData.profitAndLoss.comparison.otherExpenses)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Net Income -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-900 font-bold">
                      <td class="py-2 px-4 border-b">Net Income</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.summary.netIncome) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.profitAndLoss.comparison.netIncome) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.profitAndLoss.summary.netIncome, financialData.profitAndLoss.comparison.netIncome))">
                          <i :class="getChangeIcon(calculateChange(financialData.profitAndLoss.summary.netIncome, financialData.profitAndLoss.comparison.netIncome))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.profitAndLoss.summary.netIncome, financialData.profitAndLoss.comparison.netIncome)) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </Card>
          
          <!-- P&L Monthly Chart -->
          <Card>
            <template #title>
              <span>Profit & Loss Trend</span>
            </template>
            <template #content>
              <div class="h-80">
                <Chart type="bar" :data="plChartData" :options="plChartOptions" />
              </div>
            </template>
          </Card>
          
          <!-- P&L Detail Sections -->
          <Card>
            <template #title>
              <span>Profit & Loss Details</span>
            </template>
            <template #content>
              <TabView>
                <!-- Revenue Details -->
                <TabPanel header="Revenue">
                  <DataTable :value="financialData.profitAndLoss.details.revenue" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 40%"></Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison))">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
                
                <!-- COGS Details -->
                <TabPanel header="Cost of Goods Sold">
                  <DataTable :value="financialData.profitAndLoss.details.cogs" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 40%"></Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison), true)">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
                
                <!-- Expenses Details -->
                <TabPanel header="Operating Expenses">
                  <DataTable :value="financialData.profitAndLoss.details.expenses" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 40%"></Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison), true)">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
                
                <!-- Other Items Details -->
                <TabPanel header="Other Items">
                  <DataTable :value="financialData.profitAndLoss.details.otherItems" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 35%"></Column>
                    <Column field="type" header="Type" style="width: 10%">
                      <template #body="{ data }">
                        <Badge :value="data.type === 'income' ? 'Income' : 'Expense'" 
                               :severity="data.type === 'income' ? 'success' : 'danger'" />
                      </template>
                    </Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison), data.type === 'expense')">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison), data.type === 'expense')" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
              </TabView>
            </template>
          </Card>
        </div>
      </TabPanel>
      
      <!-- Balance Sheet Tab -->
      <TabPanel header="Balance Sheet">
        <div class="grid grid-cols-1 gap-4">
          <!-- Balance Sheet Summary Card -->
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <span>Balance Sheet Summary</span>
                <div class="flex gap-2">
                  <Button icon="pi pi-file-excel" text rounded tooltip="Export to Excel" />
                  <Button icon="pi pi-file-pdf" text rounded tooltip="Export to PDF" />
                </div>
              </div>
            </template>
            <template #content>
              <!-- Summary Table -->
              <div class="overflow-x-auto">
                <table class="min-w-full bg-white dark:bg-gray-800 border-collapse">
                  <thead>
                    <tr>
                      <th class="py-2 px-4 border-b text-left">Item</th>
                      <th class="py-2 px-4 border-b text-right">Amount</th>
                      <th v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">Comparison</th>
                      <th v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Total Assets -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-900">
                      <td class="py-2 px-4 border-b font-medium">Total Assets</td>
                      <td class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.balanceSheet.summary.totalAssets) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.balanceSheet.comparison.totalAssets) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.balanceSheet.summary.totalAssets, financialData.balanceSheet.comparison.totalAssets))">
                          <i :class="getChangeIcon(calculateChange(financialData.balanceSheet.summary.totalAssets, financialData.balanceSheet.comparison.totalAssets))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.balanceSheet.summary.totalAssets, financialData.balanceSheet.comparison.totalAssets)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Total Liabilities -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-900">
                      <td class="py-2 px-4 border-b font-medium">Total Liabilities</td>
                      <td class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.balanceSheet.summary.totalLiabilities) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.balanceSheet.comparison.totalLiabilities) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.balanceSheet.summary.totalLiabilities, financialData.balanceSheet.comparison.totalLiabilities), true)">
                          <i :class="getChangeIcon(calculateChange(financialData.balanceSheet.summary.totalLiabilities, financialData.balanceSheet.comparison.totalLiabilities), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.balanceSheet.summary.totalLiabilities, financialData.balanceSheet.comparison.totalLiabilities)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Total Equity -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-900">
                      <td class="py-2 px-4 border-b font-medium">Total Equity</td>
                      <td class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.balanceSheet.summary.totalEquity) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right font-medium">{{ formatCurrency(financialData.balanceSheet.comparison.totalEquity) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(financialData.balanceSheet.summary.totalEquity, financialData.balanceSheet.comparison.totalEquity))">
                          <i :class="getChangeIcon(calculateChange(financialData.balanceSheet.summary.totalEquity, financialData.balanceSheet.comparison.totalEquity))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(financialData.balanceSheet.summary.totalEquity, financialData.balanceSheet.comparison.totalEquity)) }}
                        </span>
                      </td>
                    </tr>
                    
                    <!-- Liability + Equity -->
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 font-bold">
                      <td class="py-2 px-4 border-b">Liabilities + Equity</td>
                      <td class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.balanceSheet.summary.totalLiabilities + financialData.balanceSheet.summary.totalEquity) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">{{ formatCurrency(financialData.balanceSheet.comparison.totalLiabilities + financialData.balanceSheet.comparison.totalEquity) }}</td>
                      <td v-if="comparisonEnabled" class="py-2 px-4 border-b text-right">
                        <span :class="getChangeColorClass(calculateChange(
                          financialData.balanceSheet.summary.totalLiabilities + financialData.balanceSheet.summary.totalEquity, 
                          financialData.balanceSheet.comparison.totalLiabilities + financialData.balanceSheet.comparison.totalEquity))">
                          <i :class="getChangeIcon(calculateChange(
                            financialData.balanceSheet.summary.totalLiabilities + financialData.balanceSheet.summary.totalEquity,
                            financialData.balanceSheet.comparison.totalLiabilities + financialData.balanceSheet.comparison.totalEquity))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(
                            financialData.balanceSheet.summary.totalLiabilities + financialData.balanceSheet.summary.totalEquity,
                            financialData.balanceSheet.comparison.totalLiabilities + financialData.balanceSheet.comparison.totalEquity)) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </Card>
          
          <!-- Balance Sheet Quarterly Chart -->
          <Card>
            <template #title>
              <span>Balance Sheet Trend</span>
            </template>
            <template #content>
              <div class="h-80">
                <Chart type="bar" :data="bsChartData" :options="bsChartOptions" />
              </div>
            </template>
          </Card>
          
          <!-- Balance Sheet Details -->
          <Card>
            <template #title>
              <span>Balance Sheet Details</span>
            </template>
            <template #content>
              <TabView>
                <!-- Assets -->
                <TabPanel header="Assets">
                  <DataTable :value="financialData.balanceSheet.details.assets" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 40%"></Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison))">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
                
                <!-- Liabilities -->
                <TabPanel header="Liabilities">
                  <DataTable :value="financialData.balanceSheet.details.liabilities" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 40%"></Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison), true)">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison), true)" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
                
                <!-- Equity -->
                <TabPanel header="Equity">
                  <DataTable :value="financialData.balanceSheet.details.equity" 
                            stripedRows 
                            class="p-datatable-sm">
                    <Column field="account" header="Account" style="width: 15%"></Column>
                    <Column field="description" header="Description" style="width: 40%"></Column>
                    <Column field="amount" header="Amount" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.amount) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="comparison" header="Comparison" style="width: 15%">
                      <template #body="{ data }">
                        {{ formatCurrency(data.comparison) }}
                      </template>
                    </Column>
                    <Column v-if="comparisonEnabled" field="change" header="Change" style="width: 15%">
                      <template #body="{ data }">
                        <span :class="getChangeColorClass(calculateChange(data.amount, data.comparison))">
                          <i :class="getChangeIcon(calculateChange(data.amount, data.comparison))" class="mr-1"></i>
                          {{ formatPercent(calculateChange(data.amount, data.comparison)) }}
                        </span>
                      </template>
                    </Column>
                    <Column style="width: 10%">
                      <template #body="{ data }">
                        <Button icon="pi pi-search" text rounded @click="showGLEntries(data)" />
                      </template>
                    </Column>
                  </DataTable>
                </TabPanel>
              </TabView>
            </template>
          </Card>
        </div>
      </TabPanel>
    </TabView>
    
    <!-- G/L Details Dialog -->
    <Dialog v-model:visible="showDetailDialog" 
            header="General Ledger Entries" 
            modal 
            :style="{width: '80vw'}" 
            :maximizable="true">
      <div class="p-fluid" v-if="selectedEntry">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <div class="text-sm text-gray-500 dark:text-gray-400">Account</div>
            <div class="text-xl font-bold">{{ selectedEntry.account }}</div>
            <div class="text-sm">{{ selectedEntry.description }}</div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <div class="text-sm text-gray-500 dark:text-gray-400">Current Amount</div>
            <div class="text-xl font-bold">{{ formatCurrency(selectedEntry.amount) }}</div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <div class="text-sm text-gray-500 dark:text-gray-400">Period</div>
            <div class="text-xl font-bold">{{ selectedPeriod.name }}</div>
          </div>
        </div>
        
        <div class="mb-4">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-search"></i>
            </span>
            <InputText v-model="globalFilterValue" placeholder="Search entries" @input="onGlobalFilterChange" />
          </div>
        </div>
        
        <DataTable :value="financialData.generalLedger.entries.filter(e => e.account === selectedEntry.account)" 
                  :filters="filters"
                  stripedRows 
                  sortField="date" 
                  :sortOrder="-1"
                  class="p-datatable-sm">
          <Column field="date" header="Date" sortable>
            <template #body="{ data }">
              {{ new Date(data.date).toLocaleDateString() }}
            </template>
          </Column>
          <Column field="description" header="Description" sortable></Column>
          <Column field="reference" header="Reference" sortable></Column>
          <Column field="debit" header="Debit" sortable>
            <template #body="{ data }">
              {{ data.debit > 0 ? formatCurrency(data.debit) : '' }}
            </template>
          </Column>
          <Column field="credit" header="Credit" sortable>
            <template #body="{ data }">
              {{ data.credit > 0 ? formatCurrency(data.credit) : '' }}
            </template>
          </Column>
        </DataTable>
        
        <div class="flex justify-content-end mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div class="grid grid-cols-3 gap-4 w-1/2">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total Debits</div>
              <div class="font-medium">{{ formatCurrency(entryTotal.debit) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total Credits</div>
              <div class="font-medium">{{ formatCurrency(entryTotal.credit) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Net Amount</div>
              <div class="font-medium">{{ formatCurrency(entryTotal.net) }}</div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-card .p-card-title) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

:deep(.p-card .p-card-content) {
  padding: 0;
}

:deep(.p-tabview .p-tabview-nav) {
  border-width: 0 0 1px 0;
  border-color: var(--surface-border);
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  padding: 1rem;
  font-weight: 500;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background-color: #1f2937;
  color: #e5e7eb;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
  border-width: 0 0 1px 0;
}

:deep(.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #1f2937;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr) {
  background-color: #111827;
  color: #e5e7eb;
}

:deep(.p-button.p-button-text) {
  color: #6b7280;
}

:deep(.dark .p-button.p-button-text) {
  color: #9ca3af;
}
</style> 