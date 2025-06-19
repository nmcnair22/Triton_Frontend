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
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import Divider from 'primevue/divider';
import ProgressBar from 'primevue/progressbar';
import ToggleButton from 'primevue/togglebutton';
import Toolbar from 'primevue/toolbar';
import { FilterMatchMode } from '@primevue/core/api';

const router = useRouter();
const activeTab = ref(0);
const filterView = ref('all');
const sortField = ref('revenue');
const sortOrder = ref(-1); // -1 for descending
const chartType = ref('treemap');

// Time period options for filtering data
const timeOptions = ref([
  { name: 'Last 30 Days', code: '30D' },
  { name: 'Last Quarter', code: 'LQ' },
  { name: 'Year to Date', code: 'YTD' },
  { name: 'Last Year', code: 'LY' }
]);
const selectedTimePeriod = ref(timeOptions.value[2]); // Year to Date default

// Product category options for filtering data
const categoryOptions = ref([
  { name: 'All Categories', code: 'ALL' },
  { name: 'Software', code: 'SW' },
  { name: 'Hardware', code: 'HW' },
  { name: 'Services', code: 'SV' },
  { name: 'Subscriptions', code: 'SB' }
]);
const selectedCategories = ref([categoryOptions.value[0]]);

// Product data
const productData = ref({
  // Summary stats
  summary: {
    totalRevenue: 4125600,
    totalCost: 2567800,
    grossProfit: 1557800,
    avgMargin: 37.8,
    yearOverYearGrowth: 12.5
  },

  // Product revenue by category for treemap
  revenueByCategoryData: [
    {
      name: 'Software',
      value: 1560000,
      color: 'rgba(59, 130, 246, 0.8)',
      children: [
        { name: 'Enterprise License', value: 850000, color: 'rgba(59, 130, 246, 0.9)' },
        { name: 'SMB License', value: 420000, color: 'rgba(59, 130, 246, 0.7)' },
        { name: 'Developer Tools', value: 290000, color: 'rgba(59, 130, 246, 0.6)' }
      ]
    },
    {
      name: 'Hardware',
      value: 1230000,
      color: 'rgba(239, 68, 68, 0.8)',
      children: [
        { name: 'Servers', value: 580000, color: 'rgba(239, 68, 68, 0.9)' },
        { name: 'Network Equipment', value: 410000, color: 'rgba(239, 68, 68, 0.7)' },
        { name: 'Storage Systems', value: 240000, color: 'rgba(239, 68, 68, 0.6)' }
      ]
    },
    {
      name: 'Services',
      value: 875000,
      color: 'rgba(34, 197, 94, 0.8)',
      children: [
        { name: 'Implementation', value: 420000, color: 'rgba(34, 197, 94, 0.9)' },
        { name: 'Support', value: 315000, color: 'rgba(34, 197, 94, 0.7)' },
        { name: 'Training', value: 140000, color: 'rgba(34, 197, 94, 0.6)' }
      ]
    },
    {
      name: 'Subscriptions',
      value: 460600,
      color: 'rgba(168, 85, 247, 0.8)',
      children: [
        { name: 'Cloud Services', value: 280000, color: 'rgba(168, 85, 247, 0.9)' },
        { name: 'Software as a Service', value: 180600, color: 'rgba(168, 85, 247, 0.7)' }
      ]
    }
  ],

  // Category performance for bar chart
  categoryPerformance: {
    labels: ['Software', 'Hardware', 'Services', 'Subscriptions'],
    revenue: [1560000, 1230000, 875000, 460600],
    cost: [780000, 920000, 525000, 342800],
    previousYearRevenue: [1325000, 1150000, 740000, 390000]
  },

  // Top performing products
  topProducts: [
    { id: 1, name: 'Enterprise Software License', category: 'Software', revenue: 850000, cost: 340000, margin: 60.0, growth: 18.5 },
    { id: 2, name: 'Server Hardware - Model X', category: 'Hardware', revenue: 580000, cost: 435000, margin: 25.0, growth: 8.2 },
    { id: 3, name: 'Implementation Services', category: 'Services', revenue: 420000, cost: 252000, margin: 40.0, growth: 15.3 },
    { id: 4, name: 'Cloud Services - Premium', category: 'Subscriptions', revenue: 280000, cost: 196000, margin: 30.0, growth: 22.8 },
    { id: 5, name: 'SMB Software License', category: 'Software', revenue: 420000, cost: 210000, margin: 50.0, growth: 12.4 },
    { id: 6, name: 'Network Equipment', category: 'Hardware', revenue: 410000, cost: 307500, margin: 25.0, growth: 7.6 },
    { id: 7, name: 'Support Services', category: 'Services', revenue: 315000, cost: 189000, margin: 40.0, growth: 9.2 },
    { id: 8, name: 'Developer Tools', category: 'Software', revenue: 290000, cost: 130500, margin: 55.0, growth: 16.8 },
    { id: 9, name: 'Storage Systems', category: 'Hardware', revenue: 240000, cost: 177600, margin: 26.0, growth: 5.4 },
    { id: 10, name: 'SaaS Products', category: 'Subscriptions', revenue: 180600, cost: 146800, margin: 18.7, growth: 32.5 },
    { id: 11, name: 'Training Services', category: 'Services', revenue: 140000, cost: 84000, margin: 40.0, growth: 12.0 },
  ],

  // Monthly trend data
  monthlyTrend: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    software: [124000, 128000, 132000, 129000, 135000, 138000, 142000, 140000, 138000, 136000, 132000, 134000],
    hardware: [96000, 98000, 102000, 105000, 108000, 112000, 110000, 106000, 104000, 100000, 98000, 102000],
    services: [68000, 70000, 72000, 74000, 76000, 78000, 80000, 76000, 74000, 72000, 70000, 72000],
    subscriptions: [34000, 36000, 37000, 38000, 39000, 40000, 41000, 40000, 38000, 36000, 35000, 36000]
  }
});

// Format currency helper function
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

// Format percent helper function
const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// Get color for trend indicators
const getTrendColor = (value) => {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
};

// Get icon for trend indicators
const getTrendIcon = (value) => {
  if (value > 0) return 'pi pi-arrow-up';
  if (value < 0) return 'pi pi-arrow-down';
  return 'pi pi-minus';
};

// Calculate margin
const calculateMargin = (revenue, cost) => {
  return ((revenue - cost) / revenue) * 100;
};

// Treemap chart configuration
const treemapChartData = computed(() => {
  return {
    datasets: [{
      tree: productData.value.revenueByCategoryData,
      key: 'value',
      groups: ['name'],
      spacing: 2,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      backgroundColor: (ctx) => {
        if (!ctx.element.options) return 'rgba(0, 0, 0, 0.1)';
        return ctx.element.options.color || 'rgba(0, 0, 0, 0.1)';
      },
      labels: {
        display: true,
        align: 'center',
        position: 'center',
        font: {
          weight: 'bold'
        },
        formatter: (ctx) => {
          return [ctx.raw.name, formatCurrency(ctx.raw.value)];
        },
        color: 'white'
      }
    }]
  };
});

const treemapChartOptions = {
  plugins: {
    title: {
      display: true,
      text: 'Product Revenue by Category',
      font: {
        size: 16
      }
    },
    tooltip: {
      callbacks: {
        label: (item) => {
          return [
            `Category: ${item.raw.name}`,
            `Revenue: ${formatCurrency(item.raw.value)}`
          ];
        }
      }
    },
    legend: {
      display: false
    }
  },
  responsive: true,
  maintainAspectRatio: false
};

// Bar chart configuration
const barChartData = computed(() => {
  return {
    labels: productData.value.categoryPerformance.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Revenue',
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        data: productData.value.categoryPerformance.revenue
      },
      {
        type: 'bar',
        label: 'Cost',
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        data: productData.value.categoryPerformance.cost
      },
      {
        type: 'line',
        label: 'Previous Year',
        borderColor: 'rgba(107, 114, 128, 0.7)',
        pointBackgroundColor: 'rgba(107, 114, 128, 0.7)',
        data: productData.value.categoryPerformance.previousYearRevenue,
        fill: false,
        tension: 0.2
      }
    ]
  };
});

const barChartOptions = {
  plugins: {
    title: {
      display: true,
      text: 'Revenue & Cost by Category',
      font: {
        size: 16
      }
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
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Product Category'
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.8)'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Amount'
      },
      ticks: {
        callback: function(value) {
          return '$' + (value/1000) + 'k';
        }
      },
      beginAtZero: true
    }
  }
};

// Monthly trend chart configuration
const trendChartData = computed(() => {
  return {
    labels: productData.value.monthlyTrend.labels,
    datasets: [
      {
        label: 'Software',
        data: productData.value.monthlyTrend.software,
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Hardware',
        data: productData.value.monthlyTrend.hardware,
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Services',
        data: productData.value.monthlyTrend.services,
        borderColor: 'rgba(34, 197, 94, 0.8)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Subscriptions',
        data: productData.value.monthlyTrend.subscriptions,
        borderColor: 'rgba(168, 85, 247, 0.8)',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };
});

const trendChartOptions = {
  plugins: {
    title: {
      display: true,
      text: 'Monthly Revenue Trend by Category',
      font: {
        size: 16
      }
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
  responsive: true,
  maintainAspectRatio: false,
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
        text: 'Revenue'
      },
      ticks: {
        callback: function(value) {
          return '$' + (value/1000) + 'k';
        }
      },
      beginAtZero: true
    }
  }
};

// Table filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  category: { value: null, matchMode: FilterMatchMode.IN }
});
const globalFilterValue = ref('');

// Handle global filter change
const onGlobalFilterChange = (e) => {
  const value = e.target.value;
  filters.value.global.value = value;
  globalFilterValue.value = value;
};

// Filter products based on selected categories
const filteredProducts = computed(() => {
  if (selectedCategories.value.length === 0 || 
      (selectedCategories.value.length === 1 && selectedCategories.value[0].code === 'ALL')) {
    return productData.value.topProducts;
  }
  
  const selectedCategoryCodes = selectedCategories.value.map(c => c.code);
  return productData.value.topProducts.filter(product => {
    const categoryCode = getCategoryCode(product.category);
    return selectedCategoryCodes.includes(categoryCode);
  });
});

// Helper function to get category code from name
const getCategoryCode = (categoryName) => {
  const category = categoryOptions.value.find(c => c.name === categoryName);
  return category ? category.code : null;
};

// Apply filter changes
const applyFilters = () => {
  console.log('Applied filters:', {
    timePeriod: selectedTimePeriod.value.name,
    categories: selectedCategories.value.map(c => c.name)
  });
  // In a real app, this would trigger an API call to refresh data
};

// Toggle chart type
const toggleChartType = () => {
  chartType.value = chartType.value === 'treemap' ? 'bar' : 'treemap';
};
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="mb-5">
      <h1 class="text-3xl font-bold mb-2">Product & Service Performance</h1>
      <p class="text-gray-600 dark:text-gray-400">Revenue, margin, and performance analysis by product and service category</p>
    </div>

    <!-- Filters Section -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Time Period Selection -->
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Period</label>
                            <Select v-model="selectedTimePeriod" :options="timeOptions" optionLabel="name" 
                      class="w-full" />
          </div>
          
          <!-- Category Selection -->
          <div class="md:col-span-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Categories</label>
            <MultiSelect v-model="selectedCategories" :options="categoryOptions" optionLabel="name" 
                          class="w-full" display="chip" />
          </div>
          
          <!-- Apply Button -->
          <div class="md:col-span-3 flex items-end">
            <Button label="Apply Filters" icon="pi pi-filter" class="w-full" @click="applyFilters" />
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Key Metrics Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <!-- Total Revenue -->
      <Card>
        <template #content>
          <div class="text-center p-3">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</div>
            <div class="text-2xl font-bold mb-2">{{ formatCurrency(productData.summary.totalRevenue) }}</div>
            <div class="flex justify-center items-center">
              <i :class="getTrendIcon(productData.summary.yearOverYearGrowth) + ' mr-1 ' + getTrendColor(productData.summary.yearOverYearGrowth)"></i>
              <span :class="getTrendColor(productData.summary.yearOverYearGrowth)">{{ productData.summary.yearOverYearGrowth }}%</span>
              <span class="text-xs text-gray-500 ml-1">vs prev year</span>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Total Cost -->
      <Card>
        <template #content>
          <div class="text-center p-3">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Cost</div>
            <div class="text-2xl font-bold mb-2">{{ formatCurrency(productData.summary.totalCost) }}</div>
            <div class="text-sm text-gray-500">
              {{ formatPercent(productData.summary.totalCost / productData.summary.totalRevenue) }} of Revenue
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Gross Profit -->
      <Card>
        <template #content>
          <div class="text-center p-3">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross Profit</div>
            <div class="text-2xl font-bold mb-2">{{ formatCurrency(productData.summary.grossProfit) }}</div>
            <div class="text-sm text-gray-500">
              {{ (productData.summary.totalRevenue - productData.summary.totalCost) / productData.summary.totalCost * 100 | 0 }}% Return on Cost
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Average Margin -->
      <Card>
        <template #content>
          <div class="text-center p-3">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Average Margin</div>
            <div class="text-2xl font-bold mb-2">{{ productData.summary.avgMargin }}%</div>
            <div class="flex justify-center">
              <div class="bg-gray-200 dark:bg-gray-700 w-full rounded-full h-2 mt-2">
                <div class="bg-green-500 h-2 rounded-full" :style="`width: ${productData.summary.avgMargin}%`"></div>
              </div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Growth Rate -->
      <Card>
        <template #content>
          <div class="text-center p-3">
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Annual Growth</div>
            <div class="text-2xl font-bold mb-2">{{ productData.summary.yearOverYearGrowth }}%</div>
            <div class="text-sm" :class="getTrendColor(productData.summary.yearOverYearGrowth)">
              {{ productData.summary.yearOverYearGrowth > 0 ? 'Positive Trend' : 'Negative Trend' }}
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Revenue Distribution Visualization -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <!-- Revenue by Category Chart -->
      <Card class="h-full">
        <template #title>
          <div class="flex justify-between items-center">
            <span>Revenue by Category</span>
            <Button :label="chartType === 'treemap' ? 'Switch to Bar Chart' : 'Switch to Treemap'" 
                    class="p-button-text p-button-sm" 
                    @click="toggleChartType" />
          </div>
        </template>
        <template #content>
          <div class="h-80">
            <Chart v-if="chartType === 'treemap'" type="treemap" :data="treemapChartData" :options="treemapChartOptions" />
            <Chart v-else type="bar" :data="barChartData" :options="barChartOptions" />
          </div>
        </template>
      </Card>
      
      <!-- Monthly Trend Chart -->
      <Card class="h-full">
        <template #title>
          <span>Monthly Revenue Trend</span>
        </template>
        <template #content>
          <div class="h-80">
            <Chart type="line" :data="trendChartData" :options="trendChartOptions" />
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Top Products Table -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>Top Performing Products & Services</span>
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="globalFilterValue" placeholder="Search" @input="onGlobalFilterChange" />
          </span>
        </div>
      </template>
      <template #content>
        <DataTable :value="filteredProducts" 
                   :filters="filters"
                   :sortField="sortField"
                   :sortOrder="sortOrder"
                   stripedRows 
                   paginator 
                   :rows="10"
                   responsiveLayout="scroll"
                   class="p-datatable-sm">
          <Column field="name" header="Product/Service" sortable style="width: 30%">
            <template #body="{ data }">
              <div class="font-medium">{{ data.name }}</div>
              <div class="text-xs text-gray-500">{{ data.category }}</div>
            </template>
          </Column>
          <Column field="revenue" header="Revenue" sortable style="width: 15%">
            <template #body="{ data }">
              {{ formatCurrency(data.revenue) }}
            </template>
          </Column>
          <Column field="cost" header="Cost" sortable style="width: 15%">
            <template #body="{ data }">
              {{ formatCurrency(data.cost) }}
            </template>
          </Column>
          <Column field="margin" header="Margin" sortable style="width: 15%">
            <template #body="{ data }">
              <div class="flex items-center">
                <div class="flex-1 mr-2">
                  <div class="bg-gray-200 dark:bg-gray-700 w-full rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" :style="`width: ${data.margin}%`"></div>
                  </div>
                </div>
                <span class="font-medium">{{ data.margin }}%</span>
              </div>
            </template>
          </Column>
          <Column field="growth" header="Growth" sortable style="width: 15%">
            <template #body="{ data }">
              <span :class="getTrendColor(data.growth)">
                <i :class="getTrendIcon(data.growth) + ' mr-1'"></i>
                {{ data.growth }}%
              </span>
            </template>
          </Column>
          <Column style="width: 10%">
            <template #body>
              <Button icon="pi pi-search" text rounded />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
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
</style> 