<script setup>
import { ref, computed } from 'vue';
import Chart from 'primevue/chart';
import Tabs from 'primevue/tabs';
import Tab from 'primevue/tab';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

// Financial metrics data
const financialData = ref({
  totalBalance: {
    value: '$3M',
    changePercent: '+3.2%',
    subtitle: 'You made an extra $92,500 this quarter',
    income: '$625K',
    expenses: '$232K',
  },
  revenue: {
    value: '$2M',
    changePercent: '+9.6%',
    subtitle: 'You made an extra $92,500 this quarter',
    trend: generateChartData([12, 15, 18, 14, 16, 19, 22], 'blue'),
  },
  expenses: {
    value: '$2M',
    changePercent: '-2.3%',
    subtitle: 'Expenses increased by $35,000',
    trend: generateChartData([8, 12, 14, 12, 15, 16, 14], 'red'),
  },
  netProfit: {
    value: '$200K',
    changePercent: '+11.1%',
    subtitle: 'Net profit up by $20,000',
    trend: generateChartData([5, 8, 7, 9, 6, 8, 10], 'green'),
  },
});

// Chart data generator
function generateChartData(values, color) {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        data: values,
        borderColor: getColor(color),
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };
}

function getColor(name) {
  const colors = {
    blue: '#3B82F6',
    red: '#EF4444',
    green: '#10B981',
  };
  return colors[name] || colors.blue;
}

// Chart options
const chartOptions = {
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }, // Enable tooltips for better UX
  },
  scales: {
    x: {
      display: true,
      title: { display: true, text: 'Month' },
      grid: { display: true, color: 'rgba(0,0,0,0.1)' },
    },
    y: {
      display: true,
      title: { display: true, text: 'Amount ($)' },
      grid: { display: true, color: 'rgba(0,0,0,0.1)' },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
};

// Activity feed data
const activityFeed = ref([
  {
    date: 'April 29, 2023',
    transactions: [
      {
        company: 'Acme Corp',
        id: 'TRX-98765',
        description: 'Payment for invoice #INV-2023-04-001',
        status: 'Completed',
        amount: '+$13K',
        time: '02:15 AM',
        type: 'payment',
      },
      {
        company: 'TechStart Inc',
        id: 'INV-2023-04-002',
        description: 'Monthly service subscription',
        status: 'Completed',
        amount: '+$8K',
        time: '03:30 AM',
        type: 'invoice',
      },
      {
        company: 'Office Supplies Co',
        id: 'PO-2023-115',
        description: 'Office equipment and supplies',
        status: 'Completed',
        amount: '-$4K',
        time: '04:45 AM',
        type: 'expense',
      },
      {
        company: 'John Smith',
        id: 'EXP-2023-042',
        description: 'Travel expenses for client meeting',
        status: 'Pending',
        amount: '-$350',
        time: '06:20 AM',
        type: 'expense',
      },
      {
        company: 'WebDev Solutions',
        id: 'CN-2023-008',
        description: 'Credit for service outage',
        status: 'Completed',
        amount: '+$500',
        time: '07:10 AM',
        type: 'credit',
      },
    ],
  },
  {
    date: 'April 28, 2023',
    transactions: [
      {
        company: 'Global Enterprises',
        id: 'TRX-98740',
        description: 'Payment for invoice #INV-2023-03-015',
        status: 'Completed',
        amount: '+$9K',
        time: '08:45 AM',
        type: 'payment',
      },
      {
        company: 'Cloud Services Inc',
        id: 'INV-CS-2023-1204',
        description: 'Monthly cloud infrastructure',
        status: 'Completed',
        amount: '+$3K',
        time: '09:30 AM',
        type: 'invoice',
      },
    ],
  },
  {
    date: 'April 27, 2023',
    transactions: [
      {
        company: 'Customer XYZ',
        id: 'REF-2023-021',
        description: 'Refund for returned product',
        status: 'Completed',
        amount: '-$750',
        time: '03:15 AM',
        type: 'refund',
      },
      {
        company: 'Marketing Agency',
        id: 'PO-2023-116',
        description: 'Q2 Marketing Campaign',
        status: 'Completed',
        amount: '-$6K',
        time: '04:20 AM',
        type: 'expense',
      },
    ],
  },
  {
    date: 'April 26, 2023',
    transactions: [
      {
        company: 'Enterprise Client',
        id: 'INV-2023-04-003',
        description: 'Consulting services - April',
        status: 'Completed',
        amount: '+$15K',
        time: '02:45 AM',
        type: 'invoice',
      },
    ],
  },
]);

// Transaction icon mapper
const getTransactionIcon = (type) => {
  const icons = {
    payment: 'pi pi-plus-circle',
    expense: 'pi pi-minus-circle',
    invoice: 'pi pi-file',
    credit: 'pi pi-plus-circle',
    refund: 'pi pi-reply',
  };
  return icons[type] || 'pi pi-circle';
};

// Total activities
const totalActivities = computed(() => {
  return activityFeed.value.reduce((total, group) => total + group.transactions.length, 0);
});

// Active tab index
const activeIndex = ref(0);

// Date filter
const dateFilter = ref('Today');
const dateFilterOptions = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
</script>

<template>
  <div class="container mx-auto p-4 lg:p-6">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Financial Intelligence</h1>
      <p class="text-gray-600 mt-1">Generate and analyze financial reports with dynamic filtering and interactive visualizations.</p>
    </header>

    <!-- Tabs -->
    <Tabs v-model:activeIndex="activeIndex" class="border rounded-lg overflow-hidden shadow-sm">
      <Tab header="Overview">
        <div class="p-4">
          <!-- Key Metrics -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Total Balance -->
            <div class="bg-green-50 p-4 rounded-lg shadow-sm">
              <div class="mb-4">
                <span class="text-sm text-gray-600 block mb-1">Total Balance</span>
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-gray-900">{{ financialData.totalBalance.value }}</span>
                  <div class="flex items-center">
                    <i :class="financialData.totalBalance.changePercent.startsWith('+') ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'" aria-hidden="true"></i>
                    <span class="ml-1 text-sm" :class="financialData.totalBalance.changePercent.startsWith('+') ? 'text-green-500' : 'text-red-500'">{{ financialData.totalBalance.changePercent }}</span>
                  </div>
                </div>
                <span class="text-sm text-gray-600 block mt-2">{{ financialData.totalBalance.subtitle }}</span>
              </div>
              <div class="flex justify-between">
                <div>
                  <span class="text-sm text-gray-600 block">Income</span>
                  <span class="text-green-600 font-medium">{{ financialData.totalBalance.income }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-600 block">Expenses</span>
                  <span class="text-purple-600 font-medium">{{ financialData.totalBalance.expenses }}</span>
                </div>
              </div>
            </div>
            <!-- Revenue -->
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
              <div class="mb-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Revenue</span>
                  <i class="pi pi-info-circle text-gray-500 text-xs cursor-pointer" title="Revenue Info" aria-hidden="true"></i>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-gray-900">{{ financialData.revenue.value }}</span>
                  <div class="flex items-center">
                    <i :class="financialData.revenue.changePercent.startsWith('+') ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'" aria-hidden="true"></i>
                    <span class="ml-1 text-sm" :class="financialData.revenue.changePercent.startsWith('+') ? 'text-green-500' : 'text-red-500'">{{ financialData.revenue.changePercent }}</span>
                  </div>
                </div>
                <span class="text-sm text-gray-600 block mt-2">{{ financialData.revenue.subtitle }}</span>
              </div>
              <div class="h-24">
                <Chart type="line" :data="financialData.revenue.trend" :options="chartOptions" />
              </div>
            </div>
            <!-- Expenses -->
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
              <div class="mb-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Expenses</span>
                  <i class="pi pi-info-circle text-gray-500 text-xs cursor-pointer" title="Expenses Info" aria-hidden="true"></i>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-gray-900">{{ financialData.expenses.value }}</span>
                  <div class="flex items-center">
                    <i :class="financialData.expenses.changePercent.startsWith('+') ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'" aria-hidden="true"></i>
                    <span class="ml-1 text-sm" :class="financialData.expenses.changePercent.startsWith('+') ? 'text-green-500' : 'text-red-500'">{{ financialData.expenses.changePercent }}</span>
                  </div>
                </div>
                <span class="text-sm text-gray-600 block mt-2">{{ financialData.expenses.subtitle }}</span>
              </div>
              <div class="h-24">
                <Chart type="line" :data="financialData.expenses.trend" :options="chartOptions" />
              </div>
            </div>
            <!-- Net Profit -->
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
              <div class="mb-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Net Profit</span>
                  <i class="pi pi-info-circle text-gray-500 text-xs cursor-pointer" title="Net Profit Info" aria-hidden="true"></i>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-gray-900">{{ financialData.netProfit.value }}</span>
                  <div class="flex items-center">
                    <i :class="financialData.netProfit.changePercent.startsWith('+') ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'" aria-hidden="true"></i>
                    <span class="ml-1 text-sm" :class="financialData.netProfit.changePercent.startsWith('+') ? 'text-green-500' : 'text-red-500'">{{ financialData.netProfit.changePercent }}</span>
                  </div>
                </div>
                <span class="text-sm text-gray-600 block mt-2">{{ financialData.netProfit.subtitle }}</span>
              </div>
              <div class="h-24">
                <Chart type="line" :data="financialData.netProfit.trend" :options="chartOptions" />
              </div>
            </div>
          </div>

          <!-- Finance Activity Feed -->
          <div class="border rounded-lg overflow-hidden shadow-sm">
            <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-semibold text-gray-900">Finance Activity Feed</h3>
                <span class="text-gray-600 text-sm">Recent financial transactions and activities</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="p-input-icon-left">
                  <i class="pi pi-search" aria-hidden="true"></i>
                  <InputText placeholder="Search transactions..." class="w-64" aria-label="Search transactions" />
                </span>
                <Dropdown
                  v-model="dateFilter"
                  :options="dateFilterOptions"
                  class="w-32"
                  aria-label="Filter by date"
                />
                <Button icon="pi pi-filter" class="p-button-outlined" aria-label="Filter transactions" />
                <Button icon="pi pi-refresh" class="p-button-outlined" aria-label="Refresh transactions" />
              </div>
            </div>
            <div class="divide-y">
              <div v-for="(group, index) in activityFeed" :key="index">
                <div class="p-3 bg-gray-50">
                  <span class="font-medium text-gray-900">{{ group.date }}</span>
                </div>
                <div
                  v-for="(transaction, tIndex) in group.transactions"
                  :key="tIndex"
                  class="p-3 flex justify-between items-center hover:bg-gray-100"
                >
                  <div class="flex items-center">
                    <div
                      class="mr-3 flex items-center justify-center w-8 h-8 rounded-full"
                      :class="
                        transaction.amount.startsWith('+')
                          ? 'bg-green-100 text-green-600'
                          : transaction.amount.startsWith('-')
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      "
                    >
                      <i :class="getTransactionIcon(transaction.type)" aria-hidden="true"></i>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ transaction.company }}
                        <span class="text-gray-600 text-sm">{{ transaction.id }}</span>
                      </div>
                      <div class="text-gray-600 text-sm">{{ transaction.description }}</div>
                      <div v-if="transaction.status" class="mt-1">
                        <span
                          class="px-2 py-1 text-xs rounded-full"
                          :class="
                            transaction.status === 'Completed'
                              ? 'bg-green-100 text-green-600'
                              : transaction.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-600'
                              : ''
                          "
                        >
                          {{ transaction.status }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="font-medium"
                      :class="
                        transaction.amount.startsWith('+')
                          ? 'text-green-600'
                          : transaction.amount.startsWith('-')
                          ? 'text-red-600'
                          : ''
                      "
                    >
                      {{ transaction.amount }}
                    </div>
                    <div class="text-gray-600 text-sm">{{ transaction.time }}</div>
                  </div>
                </div>
              </div>
              <div class="p-3 flex justify-between items-center bg-gray-50">
                <span class="text-gray-600 text-sm">Showing {{ totalActivities }} activities</span>
                <Button
                  label="View all transactions"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  class="p-button-text"
                  aria-label="View all transactions"
                />
              </div>
            </div>
          </div>
        </div>
      </Tab>
      <Tab header="Income Statement">
        <div class="p-4">
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Income Statement</h3>
          <p class="text-gray-600 mb-3">View revenues, expenses, and profits over a specific period.</p>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <p>Income Statement report content goes here</p>
          </div>
        </div>
      </Tab>
      <Tab header="Balance Sheet">
        <div class="p-4">
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Balance Sheet</h3>
          <p class="text-gray-600 mb-3">See assets, liabilities, and equity at a specific point in time.</p>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <p>Balance Sheet report content goes here</p>
          </div>
        </div>
      </Tab>
      <Tab header="Cash Flow Statement">
        <div class="p-4">
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Cash Flow Statement</h3>
          <p class="text-gray-600 mb-3">Analyze cash inflows and outflows over a period.</p>
          <div class="bg-white p-4 rounded-lg shadow-sm">
            <p>Cash Flow Statement report content goes here</p>
          </div>
        </div>
      </Tab>
    </Tabs>
  </div>
</template>

<style scoped>
/* Custom styles for PrimeVue components if needed */
.p-tabs .p-tab-header.p-tab-header-active {
  @apply bg-gray-900 text-white;
}
</style>