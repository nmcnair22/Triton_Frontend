<script setup>
import { ref, computed, onMounted } from 'vue';
import Chart from 'primevue/chart';
import LineChart from '@/components/dashboard/charts/LineChart.vue';
import 'chartjs-adapter-date-fns';
import { generateRandomData } from '@/lib/utils';

// Component state
const viewMode = ref('table'); // 'table' or 'chart'
const dateRange = ref({
    start: new Date('2023-01-01'),
    end: new Date('2023-03-31')
});
const isRefreshing = ref(false);

// Filter selections
const filters = ref({
    operating: {
        netIncome: true,
        depreciation: true,
        accountsReceivable: true,
        inventory: true,
        accountsPayable: true,
        accrued: true
    },
    investing: {
        capitalExpenditures: true,
        acquisitions: true,
        investments: true,
        proceedsAssetSales: true
    },
    financing: {
        debtIssuance: true,
        debtRepayment: true,
        dividendsPaid: true,
        stockIssuance: true,
        stockRepurchase: true
    }
});

// Cash flow data
const cashFlowData = ref({
    period: '1/1/2023 - 3/31/2023',
    netCashFlow: {
        operating: '+$450K',
        investing: '-$250K',
        financing: '+$75K',
        total: '+$275K'
    },
    operatingActivities: {
        total: '+$450K',
        items: [
            { name: 'Net Income', value: '+$200K' },
            { name: 'Depreciation & Amortization', value: '+$80K' },
            { name: 'Changes in Accounts Receivable', value: '-$50K' },
            { name: 'Changes in Inventory', value: '-$30K' },
            { name: 'Changes in Accounts Payable', value: '+$150K' },
            { name: 'Changes in Accrued Expenses', value: '+$100K' }
        ]
    },
    investingActivities: {
        total: '-$250K',
        items: [
            { name: 'Capital Expenditures', value: '-$180K' },
            { name: 'Acquisitions', value: '-$100K' },
            { name: 'Investments', value: '-$50K' },
            { name: 'Proceeds from Asset Sales', value: '+$80K' }
        ]
    },
    financingActivities: {
        total: '+$75K',
        items: [
            { name: 'Debt Issuance', value: '+$200K' },
            { name: 'Debt Repayment', value: '-$75K' },
            { name: 'Dividends Paid', value: '-$50K' },
            { name: 'Stock Issuance', value: '+$50K' },
            { name: 'Stock Repurchase', value: '-$50K' }
        ]
    }
});

// Generate line chart data for cash flow trends
const operatingCashFlowData = generateRandomData('2023-01-01T00:00:00', '2023-03-31T00:00:00', 12, 200, 500);
const investingCashFlowData = generateRandomData('2023-01-01T00:00:00', '2023-03-31T00:00:00', 12, -300, -100);
const financingCashFlowData = generateRandomData('2023-01-01T00:00:00', '2023-03-31T00:00:00', 12, 50, 100);

// Chart data
const chartData = ref({
    labels: ['Operating', 'Investing', 'Financing', 'Net Cash Flow'],
    datasets: [
        {
            label: 'Cash Flow',
            data: [450, -250, 75, 275],
            backgroundColor: [
                '#10B981', // Green (Operating)
                '#EF4444', // Red (Investing)
                '#3B82F6', // Blue (Financing)
                '#8B5CF6'  // Purple (Net)
            ],
            borderColor: [
                '#047857',
                '#B91C1C',
                '#1D4ED8',
                '#6D28D9'
            ],
            borderWidth: 1
        }
    ]
});

// Chart options
const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const value = context.raw;
                    const sign = value >= 0 ? '+' : '';
                    return `${context.label}: ${sign}$${Math.abs(value)}K`;
                }
            }
        }
    },
    scales: {
        y: {
            ticks: {
                callback: (value) => {
                    return `$${value}K`;
                }
            }
        }
    }
});

// Methods
const refresh = () => {
    isRefreshing.value = true;
    
    // Simulate API call
    setTimeout(() => {
        isRefreshing.value = false;
    }, 1000);
};

const toggleViewMode = (mode) => {
    viewMode.value = mode;
};

const exportReport = () => {
    // Implement export functionality
    console.log('Exporting cash flow statement');
};

const printReport = () => {
    // Implement print functionality
    window.print();
};

const shareReport = () => {
    // Implement share functionality
    console.log('Sharing cash flow statement');
};

// Handle date range change
const onDateRangeChange = () => {
    console.log('Date range changed:', dateRange.value);
    // In a real app, this would trigger an API call to get updated data
};

// Format date for display
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
};

// Computed formatted date range
const formattedDateRange = computed(() => {
    return `${formatDate(dateRange.value.start)} - ${formatDate(dateRange.value.end)}`;
});

// Toggle all filters in a category
const toggleAllInCategory = (category) => {
    const allChecked = Object.values(filters.value[category]).every(value => value);
    const newValue = !allChecked;
    
    Object.keys(filters.value[category]).forEach(key => {
        filters.value[category][key] = newValue;
    });
};
</script>

<template>
    <div class="card">
        <div class="flex flex-column gap-4">
            <!-- Header -->
            <div>
                <h1 class="text-3xl font-bold mb-2">Cash Flow Statement</h1>
                <p class="text-color-secondary">Analyze cash inflows and outflows over a period.</p>
            </div>

            <!-- View Toggle -->
            <div class="flex justify-content-end">
                <div class="p-buttonset">
                    <Button 
                        :class="{ 'p-button-primary': viewMode === 'table', 'p-button-secondary': viewMode !== 'table' }"
                        icon="pi pi-table"
                        label="Table" 
                        @click="toggleViewMode('table')" 
                    />
                    <Button 
                        :class="{ 'p-button-primary': viewMode === 'chart', 'p-button-secondary': viewMode !== 'chart' }"
                        icon="pi pi-chart-bar"
                        label="Chart" 
                        @click="toggleViewMode('chart')" 
                    />
                </div>
            </div>

            <div class="grid">
                <!-- Left Sidebar for Filters -->
                <div class="col-12 md:col-3">
                    <div class="flex flex-column gap-4">
                        <!-- Date Range -->
                        <div class="p-card">
                            <div class="p-card-body">
                                <h3 class="text-xl font-semibold mb-4">Date Range</h3>
                                
                                <div class="mb-3">
                                    <label class="block text-sm font-medium mb-2">Select Period</label>
                                    <Calendar 
                                        v-model="dateRange" 
                                        selectionMode="range" 
                                        dateFormat="M/d/yy" 
                                        class="w-full"
                                        placeholder="Select date range"
                                        @date-select="onDateRangeChange"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <!-- Filters -->
                        <div class="p-card">
                            <div class="p-card-body">
                                <h3 class="text-xl font-semibold mb-4">Filters</h3>
                                <p class="text-sm text-color-secondary mb-3">Select which items to include in the report</p>
                                
                                <!-- Operating Activities Filters -->
                                <div class="mb-4">
                                    <div class="flex align-items-center justify-content-between mb-2">
                                        <h4 class="text-lg font-medium m-0">Operating Activities</h4>
                                        <Button 
                                            icon="pi pi-check-square" 
                                            text 
                                            size="small" 
                                            @click="toggleAllInCategory('operating')"
                                            class="p-0"
                                        />
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="netIncome" 
                                            v-model="filters.operating.netIncome" 
                                            :binary="true"
                                        />
                                        <label for="netIncome" class="ml-2">Net Income</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="depreciation" 
                                            v-model="filters.operating.depreciation" 
                                            :binary="true"
                                        />
                                        <label for="depreciation" class="ml-2">Depreciation & Amortization</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="accountsReceivable" 
                                            v-model="filters.operating.accountsReceivable" 
                                            :binary="true"
                                        />
                                        <label for="accountsReceivable" class="ml-2">Changes in Accounts Receivable</label>
                                    </div>
                                </div>
                                
                                <!-- Investing Activities Filters -->
                                <div class="mb-4">
                                    <div class="flex align-items-center justify-content-between mb-2">
                                        <h4 class="text-lg font-medium m-0">Investing Activities</h4>
                                        <Button 
                                            icon="pi pi-check-square" 
                                            text 
                                            size="small" 
                                            @click="toggleAllInCategory('investing')"
                                            class="p-0"
                                        />
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="capitalExpenditures" 
                                            v-model="filters.investing.capitalExpenditures" 
                                            :binary="true"
                                        />
                                        <label for="capitalExpenditures" class="ml-2">Capital Expenditures</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="acquisitions" 
                                            v-model="filters.investing.acquisitions" 
                                            :binary="true"
                                        />
                                        <label for="acquisitions" class="ml-2">Acquisitions</label>
                                    </div>
                                </div>
                                
                                <!-- Financing Activities Filters -->
                                <div class="mb-4">
                                    <div class="flex align-items-center justify-content-between mb-2">
                                        <h4 class="text-lg font-medium m-0">Financing Activities</h4>
                                        <Button 
                                            icon="pi pi-check-square" 
                                            text 
                                            size="small" 
                                            @click="toggleAllInCategory('financing')"
                                            class="p-0"
                                        />
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="debtIssuance" 
                                            v-model="filters.financing.debtIssuance" 
                                            :binary="true"
                                        />
                                        <label for="debtIssuance" class="ml-2">Debt Issuance</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="debtRepayment" 
                                            v-model="filters.financing.debtRepayment" 
                                            :binary="true"
                                        />
                                        <label for="debtRepayment" class="ml-2">Debt Repayment</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="p-card">
                            <div class="p-card-body">
                                <h3 class="text-xl font-semibold mb-4">Actions</h3>
                                
                                <div class="mb-2 w-full">
                                    <Button 
                                        icon="pi pi-download" 
                                        label="Export" 
                                        @click="exportReport" 
                                        class="p-button-outlined w-full mb-2 justify-content-start"
                                    />
                                </div>
                                
                                <div class="mb-2 w-full">
                                    <Button 
                                        icon="pi pi-print" 
                                        label="Print" 
                                        @click="printReport" 
                                        class="p-button-outlined w-full mb-2 justify-content-start"
                                    />
                                </div>
                                
                                <div class="mb-2 w-full">
                                    <Button 
                                        icon="pi pi-share-alt" 
                                        label="Share" 
                                        @click="shareReport" 
                                        class="p-button-outlined w-full justify-content-start"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="col-12 md:col-9">
                    <div class="p-card">
                        <div class="p-card-body">
                            <div class="flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h2 class="text-2xl font-bold mb-1">Cash Flow Statement</h2>
                                    <p class="text-color-secondary">{{ formattedDateRange }}</p>
                                </div>
                                <div class="flex gap-2">
                                    <Button 
                                        icon="pi pi-refresh" 
                                        @click="refresh" 
                                        :loading="isRefreshing"
                                        aria-label="Refresh" 
                                    />
                                </div>
                            </div>
                            
                            <!-- Table View Mode -->
                            <div v-if="viewMode === 'table'">
                                <!-- Operating Activities Section -->
                                <div class="mb-4">
                                    <div class="flex justify-content-between align-items-center p-3 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 border-round-lg">
                                        <h3 class="text-xl font-semibold m-0">Operating Activities</h3>
                                        <span class="font-semibold">{{ cashFlowData.netCashFlow.operating }}</span>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div v-for="(item, index) in cashFlowData.operatingActivities.items" :key="index" class="py-2 border-bottom-1 border-gray-200 dark:border-gray-800 flex justify-content-between">
                                            <span>{{ item.name }}</span>
                                            <span :class="{ 
                                                'text-green-500': item.value.startsWith('+'),
                                                'text-red-500': item.value.startsWith('-')
                                            }">{{ item.value }}</span>
                                        </div>
                                        
                                        <div class="py-3 flex justify-content-between font-semibold">
                                            <span>Net Cash from Operating Activities</span>
                                            <span class="text-green-500">{{ cashFlowData.operatingActivities.total }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Investing Activities Section -->
                                <div class="mb-4">
                                    <div class="flex justify-content-between align-items-center p-3 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 border-round-lg">
                                        <h3 class="text-xl font-semibold m-0">Investing Activities</h3>
                                        <span class="font-semibold">{{ cashFlowData.netCashFlow.investing }}</span>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div v-for="(item, index) in cashFlowData.investingActivities.items" :key="index" class="py-2 border-bottom-1 border-gray-200 dark:border-gray-800 flex justify-content-between">
                                            <span>{{ item.name }}</span>
                                            <span :class="{ 
                                                'text-green-500': item.value.startsWith('+'),
                                                'text-red-500': item.value.startsWith('-')
                                            }">{{ item.value }}</span>
                                        </div>
                                        
                                        <div class="py-3 flex justify-content-between font-semibold">
                                            <span>Net Cash from Investing Activities</span>
                                            <span class="text-red-500">{{ cashFlowData.investingActivities.total }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Financing Activities Section -->
                                <div class="mb-4">
                                    <div class="flex justify-content-between align-items-center p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-round-lg">
                                        <h3 class="text-xl font-semibold m-0">Financing Activities</h3>
                                        <span class="font-semibold">{{ cashFlowData.netCashFlow.financing }}</span>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div v-for="(item, index) in cashFlowData.financingActivities.items" :key="index" class="py-2 border-bottom-1 border-gray-200 dark:border-gray-800 flex justify-content-between">
                                            <span>{{ item.name }}</span>
                                            <span :class="{ 
                                                'text-green-500': item.value.startsWith('+'),
                                                'text-red-500': item.value.startsWith('-')
                                            }">{{ item.value }}</span>
                                        </div>
                                        
                                        <div class="py-3 flex justify-content-between font-semibold">
                                            <span>Net Cash from Financing Activities</span>
                                            <span class="text-blue-500">{{ cashFlowData.financingActivities.total }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Net Cash Flow Section -->
                                <div class="p-3 flex justify-content-between align-items-center bg-purple-50 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-round-lg font-bold text-xl">
                                    <span>Net Change in Cash</span>
                                    <span>{{ cashFlowData.netCashFlow.total }}</span>
                                </div>
                            </div>
                            
                            <!-- Chart View Mode -->
                            <div v-else class="mt-4">
                                <div class="grid">
                                    <div class="col-12 mb-4">
                                        <div class="p-card h-full">
                                            <div class="p-card-header px-3 pt-3">
                                                <h3 class="text-xl font-semibold">Operating Cash Flow</h3>
                                            </div>
                                            <div class="p-card-body" style="height: 200px">
                                                <LineChart 
                                                    :datasets="operatingCashFlowData" 
                                                    borderColor="#10B981" 
                                                    :bgColor="['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0)']"
                                                    option="day" 
                                                    tooltipPrefix="$" 
                                                    class="h-full" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 mb-4">
                                        <div class="p-card h-full">
                                            <div class="p-card-header px-3 pt-3">
                                                <h3 class="text-xl font-semibold">Investing Cash Flow</h3>
                                            </div>
                                            <div class="p-card-body" style="height: 200px">
                                                <LineChart 
                                                    :datasets="investingCashFlowData" 
                                                    borderColor="#EF4444" 
                                                    :bgColor="['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)']"
                                                    option="day" 
                                                    tooltipPrefix="$" 
                                                    class="h-full" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 mb-4">
                                        <div class="p-card h-full">
                                            <div class="p-card-header px-3 pt-3">
                                                <h3 class="text-xl font-semibold">Financing Cash Flow</h3>
                                            </div>
                                            <div class="p-card-body" style="height: 200px">
                                                <LineChart 
                                                    :datasets="financingCashFlowData" 
                                                    borderColor="#3B82F6" 
                                                    :bgColor="['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0)']"
                                                    option="day" 
                                                    tooltipPrefix="$" 
                                                    class="h-full" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Cash Flow Summary -->
                                <div class="grid mt-4">
                                    <div class="col-12 md:col-3">
                                        <div class="p-3 border-round-lg bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 text-center">
                                            <h4 class="font-medium mb-2">Operating</h4>
                                            <div class="text-xl font-bold">{{ cashFlowData.netCashFlow.operating }}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 md:col-3">
                                        <div class="p-3 border-round-lg bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 text-center">
                                            <h4 class="font-medium mb-2">Investing</h4>
                                            <div class="text-xl font-bold">{{ cashFlowData.netCashFlow.investing }}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 md:col-3">
                                        <div class="p-3 border-round-lg bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-center">
                                            <h4 class="font-medium mb-2">Financing</h4>
                                            <div class="text-xl font-bold">{{ cashFlowData.netCashFlow.financing }}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12 md:col-3">
                                        <div class="p-3 border-round-lg bg-purple-50 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-center">
                                            <h4 class="font-medium mb-2">Net Change</h4>
                                            <div class="text-xl font-bold">{{ cashFlowData.netCashFlow.total }}</div>
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
</template> 