<script setup>
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Chart from 'primevue/chart';

// Mock data for the finance dashboard
const financialData = ref({
  // Top KPI Cards
  totalRevenue: {
    value: '$2,345,678',
    target: '$2,500,000',
    percentOfTarget: 93.8,
    change: 12.5,
    trend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [145000, 178000, 192000, 202000, 195000, 210000],
          borderColor: '#3B82F6',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    }
  },
  grossProfitMargin: {
    value: '42.8%',
    change: 2.1,
    trend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [40.2, 39.8, 41.5, 42.1, 42.5, 42.8],
          borderColor: '#10B981',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    }
  },
  ebitda: {
    value: '$587,245',
    change: 8.3,
    trend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [48000, 52000, 54000, 57000, 56000, 59000],
          borderColor: '#8B5CF6',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    }
  },
  netProfitMargin: {
    value: '18.5%',
    change: 1.2,
    trend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [16.8, 17.2, 17.5, 17.9, 18.2, 18.5],
          borderColor: '#F59E0B',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    }
  },
  cashBalance: {
    value: '$1,245,678',
    change: 5.2,
    trend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [980000, 1050000, 1120000, 1180000, 1210000, 1245678],
          borderColor: '#64748B',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        }
      ]
    }
  },
  
  // AR/AP Summary
  arBalance: {
    value: '$485,320',
    change: -3.2,
    aging: {
      '0-30': 254000,
      '31-60': 112000,
      '61-90': 78000,
      '90+': 41320
    }
  },
  apBalance: {
    value: '$312,450',
    change: 2.1,
    aging: {
      '0-30': 180000,
      '31-60': 95000,
      '61-90': 28000,
      '90+': 9450
    }
  }
});

// Chart options for the small sparklines
const sparklineOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    }
  },
  scales: {
    x: {
      display: false
    },
    y: {
      display: false
    }
  },
  responsive: true,
  maintainAspectRatio: false,
  elements: {
    point: {
      radius: 0
    }
  }
};

// Chart options for the revenue vs target gauge
const gaugeOptions = {
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    },
    datalabels: {
      formatter: (value) => `${value}%`,
      color: '#fff',
      font: {
        weight: 'bold',
        size: 16
      }
    }
  },
  cutout: '75%',
  circumference: 180,
  rotation: 270,
  responsive: true,
  maintainAspectRatio: false
};

// Prepare gauge chart data for revenue vs target
const revenueVsTargetData = ref({
  labels: ['Met', 'Remaining'],
  datasets: [
    {
      data: [financialData.value.totalRevenue.percentOfTarget, 100 - financialData.value.totalRevenue.percentOfTarget],
      backgroundColor: ['#3B82F6', '#E5E7EB'],
      borderWidth: 0
    }
  ]
});

// Helper function to format values with appropriate prefix
const formatChange = (value) => {
  return value >= 0 ? `+${value}%` : `${value}%`;
};

// Helper function to determine the trend color based on value and whether higher is better
const getTrendColor = (value, higherIsBetter = true) => {
  if (value === 0) return 'text-gray-500';
  return (value > 0 && higherIsBetter) || (value < 0 && !higherIsBetter) 
    ? 'text-green-500' 
    : 'text-red-500';
};

// Helper function to determine the trend icon based on value
const getTrendIcon = (value, higherIsBetter = true) => {
  if (value === 0) return 'pi pi-minus';
  return (value > 0 && higherIsBetter) || (value < 0 && !higherIsBetter) 
    ? 'pi pi-arrow-up' 
    : 'pi pi-arrow-down';
};
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Finance Dashboard</h1>
      <p class="text-gray-600">Executive overview of key financial metrics and performance indicators</p>
    </div>
    
    <!-- Top KPI Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <!-- Total Revenue -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
            <div class="text-2xl font-bold mt-1">{{ financialData.totalRevenue.value }}</div>
            <div class="flex items-center mt-1">
              <i :class="getTrendIcon(financialData.totalRevenue.change) + ' mr-1 text-sm ' + getTrendColor(financialData.totalRevenue.change)"></i>
              <span :class="getTrendColor(financialData.totalRevenue.change)">{{ formatChange(financialData.totalRevenue.change) }}</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="h-12 w-24">
            <Chart type="line" :data="financialData.totalRevenue.trend" :options="sparklineOptions" class="h-full w-full" />
          </div>
        </div>
      </div>
      
      <!-- Revenue vs Target -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex flex-col items-center">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 self-start">Revenue vs Target</h3>
          <div class="mt-1 h-24 w-48 relative">
            <Chart type="doughnut" :data="revenueVsTargetData" :options="gaugeOptions" class="h-full w-full" />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-2xl font-bold">{{ financialData.totalRevenue.percentOfTarget }}%</div>
                <div class="text-xs text-gray-500">of target</div>
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-2">Target: {{ financialData.totalRevenue.target }}</div>
        </div>
      </div>
      
      <!-- Gross Profit Margin -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Gross Profit Margin</h3>
            <div class="text-2xl font-bold mt-1">{{ financialData.grossProfitMargin.value }}</div>
            <div class="flex items-center mt-1">
              <i :class="getTrendIcon(financialData.grossProfitMargin.change) + ' mr-1 text-sm ' + getTrendColor(financialData.grossProfitMargin.change)"></i>
              <span :class="getTrendColor(financialData.grossProfitMargin.change)">{{ formatChange(financialData.grossProfitMargin.change) }}</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="h-12 w-24">
            <Chart type="line" :data="financialData.grossProfitMargin.trend" :options="sparklineOptions" class="h-full w-full" />
          </div>
        </div>
      </div>
      
      <!-- EBITDA -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">EBITDA</h3>
            <div class="text-2xl font-bold mt-1">{{ financialData.ebitda.value }}</div>
            <div class="flex items-center mt-1">
              <i :class="getTrendIcon(financialData.ebitda.change) + ' mr-1 text-sm ' + getTrendColor(financialData.ebitda.change)"></i>
              <span :class="getTrendColor(financialData.ebitda.change)">{{ formatChange(financialData.ebitda.change) }}</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="h-12 w-24">
            <Chart type="line" :data="financialData.ebitda.trend" :options="sparklineOptions" class="h-full w-full" />
          </div>
        </div>
      </div>
      
      <!-- Net Profit Margin -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit Margin</h3>
            <div class="text-2xl font-bold mt-1">{{ financialData.netProfitMargin.value }}</div>
            <div class="flex items-center mt-1">
              <i :class="getTrendIcon(financialData.netProfitMargin.change) + ' mr-1 text-sm ' + getTrendColor(financialData.netProfitMargin.change)"></i>
              <span :class="getTrendColor(financialData.netProfitMargin.change)">{{ formatChange(financialData.netProfitMargin.change) }}</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="h-12 w-24">
            <Chart type="line" :data="financialData.netProfitMargin.trend" :options="sparklineOptions" class="h-full w-full" />
          </div>
        </div>
      </div>
      
      <!-- Cash Balance -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Balance</h3>
            <div class="text-2xl font-bold mt-1">{{ financialData.cashBalance.value }}</div>
            <div class="flex items-center mt-1">
              <i :class="getTrendIcon(financialData.cashBalance.change) + ' mr-1 text-sm ' + getTrendColor(financialData.cashBalance.change)"></i>
              <span :class="getTrendColor(financialData.cashBalance.change)">{{ formatChange(financialData.cashBalance.change) }}</span>
              <span class="text-gray-500 text-xs ml-2">vs last period</span>
            </div>
          </div>
          <div class="h-12 w-24">
            <Chart type="line" :data="financialData.cashBalance.trend" :options="sparklineOptions" class="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- AR/AP Summary Row -->
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">Accounts Summary</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- AR Balance -->
        <router-link to="/finance/accounts-receivable" class="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Accounts Receivable</h3>
              <div class="text-2xl font-bold mt-1">{{ financialData.arBalance.value }}</div>
              <div class="flex items-center mt-1">
                <!-- For AR, a negative change is good (collecting more) -->
                <i :class="getTrendIcon(financialData.arBalance.change, false) + ' mr-1 text-sm ' + getTrendColor(financialData.arBalance.change, false)"></i>
                <span :class="getTrendColor(financialData.arBalance.change, false)">{{ formatChange(financialData.arBalance.change) }}%</span>
                <span class="text-gray-500 text-xs ml-2">vs last period</span>
              </div>
            </div>
            <div class="text-blue-600 font-medium text-sm">View Details →</div>
          </div>
          
          <!-- AR Aging Summary -->
          <div class="mt-4">
            <div class="text-xs font-medium text-gray-500 mb-2">Aging Summary</div>
            <div class="flex justify-between items-center">
              <div class="bg-blue-100 dark:bg-blue-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">0-30 days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.arBalance.aging['0-30'] / 1000).toFixed(0) }}k</div>
              </div>
              <div class="bg-green-100 dark:bg-green-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">31-60 days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.arBalance.aging['31-60'] / 1000).toFixed(0) }}k</div>
              </div>
              <div class="bg-yellow-100 dark:bg-yellow-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">61-90 days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.arBalance.aging['61-90'] / 1000).toFixed(0) }}k</div>
              </div>
              <div class="bg-red-100 dark:bg-red-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">90+ days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.arBalance.aging['90+'] / 1000).toFixed(0) }}k</div>
              </div>
            </div>
          </div>
        </router-link>
        
        <!-- AP Balance -->
        <router-link to="/finance/accounts-payable" class="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div class="flex justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Accounts Payable</h3>
              <div class="text-2xl font-bold mt-1">{{ financialData.apBalance.value }}</div>
              <div class="flex items-center mt-1">
                <!-- For AP, a positive change is bad (owing more) -->
                <i :class="getTrendIcon(financialData.apBalance.change, false) + ' mr-1 text-sm ' + getTrendColor(financialData.apBalance.change, false)"></i>
                <span :class="getTrendColor(financialData.apBalance.change, false)">{{ formatChange(financialData.apBalance.change) }}%</span>
                <span class="text-gray-500 text-xs ml-2">vs last period</span>
              </div>
            </div>
            <div class="text-blue-600 font-medium text-sm">View Details →</div>
          </div>
          
          <!-- AP Aging Summary -->
          <div class="mt-4">
            <div class="text-xs font-medium text-gray-500 mb-2">Aging Summary</div>
            <div class="flex justify-between items-center">
              <div class="bg-blue-100 dark:bg-blue-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">0-30 days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.apBalance.aging['0-30'] / 1000).toFixed(0) }}k</div>
              </div>
              <div class="bg-green-100 dark:bg-green-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">31-60 days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.apBalance.aging['31-60'] / 1000).toFixed(0) }}k</div>
              </div>
              <div class="bg-yellow-100 dark:bg-yellow-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">61-90 days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.apBalance.aging['61-90'] / 1000).toFixed(0) }}k</div>
              </div>
              <div class="bg-red-100 dark:bg-red-900 rounded p-2 text-center flex-1 mx-1">
                <div class="text-xs text-gray-600 dark:text-gray-300">90+ days</div>
                <div class="font-bold text-sm mt-1">${{ (financialData.apBalance.aging['90+'] / 1000).toFixed(0) }}k</div>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>
    
    <!-- Quick Links Section -->
    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">Quick Links</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="#" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <i class="pi pi-chart-line text-3xl text-blue-600 mb-2"></i>
          <span class="text-gray-700 dark:text-gray-200 font-medium">Financial Reports</span>
        </a>
        <router-link to="/finance/accounts-receivable" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <i class="pi pi-dollar text-3xl text-green-600 mb-2"></i>
          <span class="text-gray-700 dark:text-gray-200 font-medium">Accounts Receivable</span>
        </router-link>
        <router-link to="/finance/accounts-payable" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <i class="pi pi-credit-card text-3xl text-purple-600 mb-2"></i>
          <span class="text-gray-700 dark:text-gray-200 font-medium">Accounts Payable</span>
        </router-link>
        <a href="#" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <i class="pi pi-wallet text-3xl text-orange-600 mb-2"></i>
          <span class="text-gray-700 dark:text-gray-200 font-medium">Cash Management</span>
        </a>
        <router-link to="/finance/customer/ACME001" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <i class="pi pi-users text-3xl text-blue-600 mb-2"></i>
          <span class="text-gray-700 dark:text-gray-200 font-medium">View Customers</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dark mode adjustments */
:deep(.dark .p-card) {
  background-color: #1e293b;
  color: #f8fafc;
}

:deep(.dark .p-card-title) {
  color: #f8fafc;
}

:deep(.dark .p-card-content) {
  color: #cbd5e1;
}
</style> 