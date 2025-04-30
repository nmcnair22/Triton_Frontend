<script setup>
import { ref, computed, onMounted } from 'vue';
import Chart from 'primevue/chart';

// Component state
const viewMode = ref('detailed'); // 'detailed' or 'summary'
const dateRange = ref({
    start: new Date('2023-01-01'),
    end: new Date('2023-03-31')
});
const isRefreshing = ref(false);

// Filter selections
const filters = ref({
    revenue: {
        sales: true,
        serviceRevenue: true,
        otherRevenue: true
    },
    expenses: {
        costOfGoodsSold: true,
        operatingExpenses: true,
        marketingCosts: true,
        administrativeExpenses: true,
        researchDevelopment: true,
        otherExpenses: true
    }
});

// Income statement data
const incomeStatement = ref({
    period: '1/1/2023 - 3/31/2023',
    totalRevenue: {
        value: '$2M',
        percentage: 100
    },
    totalExpenses: {
        value: '$2M',
        percentage: 47
    },
    netIncome: {
        value: '$200K'
    },
    revenue: {
        total: '$2M',
        percentage: 53,
        items: [
            { name: 'Sales', value: '$1M', percentage: 50 },
            { name: 'Service Revenue', value: '$450K', percentage: 23 },
            { name: 'Other Revenue', value: '$75K', percentage: 4 }
        ]
    },
    expenses: {
        total: '$2M',
        percentage: 47,
        items: [
            { name: 'Cost of Goods Sold', value: '$625K', percentage: 31 },
            { name: 'Operating Expenses', value: '$350K', percentage: 18 },
            { name: 'Marketing Costs', value: '$280K', percentage: 14 },
            { name: 'Administrative Expenses', value: '$220K', percentage: 11 },
            { name: 'Research & Development', value: '$175K', percentage: 9 },
            { name: 'Other Expenses', value: '$150K', percentage: 7 }
        ]
    }
});

// Chart data for income breakdown
const incomeChartData = ref({
    labels: ['Sales', 'Service Revenue', 'Other Revenue', 'Cost of Goods Sold', 'Operating Expenses', 'Marketing Costs', 'Administrative Expenses', 'Research & Development', 'Other Expenses'],
    datasets: [
        {
            label: 'Amount',
            data: [1000, 450, 75, -625, -350, -280, -220, -175, -150],
            backgroundColor: [
                '#10B981', // Green (Sales)
                '#34D399', // Light Green (Service Revenue)
                '#6EE7B7', // Pale Green (Other Revenue)
                '#EF4444', // Red (COGS)
                '#F87171', // Light Red (Operating)
                '#FCA5A5', // Pale Red (Marketing)
                '#FCD34D', // Yellow (Admin)
                '#FBBF24', // Orange (R&D)
                '#F59E0B', // Amber (Other Expenses)
            ]
        }
    ]
});

// Bar chart options
const barChartOptions = ref({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const value = context.raw;
                    return `${value >= 0 ? 'Revenue' : 'Expense'}: $${Math.abs(value)}K`;
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                display: true
            },
            ticks: {
                callback: (value) => {
                    return `$${Math.abs(value)}K`;
                }
            }
        },
        y: {
            grid: {
                display: false
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
    console.log('Exporting income statement');
};

const printReport = () => {
    // Implement print functionality
    window.print();
};

const shareReport = () => {
    // Implement share functionality
    console.log('Sharing income statement');
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
</script>

<template>
    <div class="card">
        <div class="flex flex-column gap-4">
            <!-- Header -->
            <div>
                <h1 class="text-3xl font-bold mb-2">Income Statement</h1>
                <p class="text-color-secondary">View revenues, expenses, and profits over a specific period.</p>
            </div>

            <!-- View Mode Toggle -->
            <div class="flex justify-content-end">
                <div class="p-buttonset">
                    <Button 
                        :class="{ 'p-button-primary': viewMode === 'detailed', 'p-button-secondary': viewMode !== 'detailed' }"
                        label="Detailed" 
                        @click="toggleViewMode('detailed')" 
                    />
                    <Button 
                        :class="{ 'p-button-primary': viewMode === 'summary', 'p-button-secondary': viewMode !== 'summary' }"
                        label="Summary" 
                        @click="toggleViewMode('summary')" 
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
                                
                                <!-- Revenue Filters -->
                                <div class="mb-4">
                                    <h4 class="text-lg font-medium mb-2">Revenue</h4>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="sales" 
                                            v-model="filters.revenue.sales" 
                                            :binary="true"
                                        />
                                        <label for="sales" class="ml-2">Sales</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="serviceRevenue" 
                                            v-model="filters.revenue.serviceRevenue" 
                                            :binary="true"
                                        />
                                        <label for="serviceRevenue" class="ml-2">Service Revenue</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="otherRevenue" 
                                            v-model="filters.revenue.otherRevenue" 
                                            :binary="true"
                                        />
                                        <label for="otherRevenue" class="ml-2">Other Revenue</label>
                                    </div>
                                </div>
                                
                                <!-- Expense Filters -->
                                <div>
                                    <h4 class="text-lg font-medium mb-2">Expenses</h4>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="costOfGoodsSold" 
                                            v-model="filters.expenses.costOfGoodsSold" 
                                            :binary="true"
                                        />
                                        <label for="costOfGoodsSold" class="ml-2">Cost of Goods Sold</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="operatingExpenses" 
                                            v-model="filters.expenses.operatingExpenses" 
                                            :binary="true"
                                        />
                                        <label for="operatingExpenses" class="ml-2">Operating Expenses</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="marketingCosts" 
                                            v-model="filters.expenses.marketingCosts" 
                                            :binary="true"
                                        />
                                        <label for="marketingCosts" class="ml-2">Marketing Costs</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="administrativeExpenses" 
                                            v-model="filters.expenses.administrativeExpenses" 
                                            :binary="true"
                                        />
                                        <label for="administrativeExpenses" class="ml-2">Administrative Expenses</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="researchDevelopment" 
                                            v-model="filters.expenses.researchDevelopment" 
                                            :binary="true"
                                        />
                                        <label for="researchDevelopment" class="ml-2">Research & Development</label>
                                    </div>
                                    
                                    <div class="ml-2 mb-2">
                                        <Checkbox 
                                            id="otherExpenses" 
                                            v-model="filters.expenses.otherExpenses" 
                                            :binary="true"
                                        />
                                        <label for="otherExpenses" class="ml-2">Other Expenses</label>
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
                                    <h2 class="text-2xl font-bold mb-1">Income Statement</h2>
                                    <p class="text-color-secondary">{{ formattedDateRange }}</p>
                                </div>
                                <div class="flex gap-2">
                                    <Button 
                                        icon="pi pi-download" 
                                        @click="exportReport" 
                                        aria-label="Export" 
                                    />
                                    <Button 
                                        icon="pi pi-refresh" 
                                        @click="refresh" 
                                        :loading="isRefreshing"
                                        aria-label="Refresh" 
                                    />
                                </div>
                            </div>
                            
                            <!-- Summary Boxes -->
                            <div class="grid">
                                <div class="col-12 md:col-4">
                                    <div class="bg-blue-50 dark:bg-blue-900 p-3 border-round-lg">
                                        <div class="text-blue-800 dark:text-blue-100 font-medium mb-2">Total Revenue</div>
                                        <div class="text-blue-800 dark:text-blue-100 text-2xl font-bold">{{ incomeStatement.totalRevenue.value }}</div>
                                    </div>
                                </div>
                                
                                <div class="col-12 md:col-4">
                                    <div class="bg-red-50 dark:bg-red-900 p-3 border-round-lg">
                                        <div class="text-red-800 dark:text-red-100 font-medium mb-2">Total Expenses</div>
                                        <div class="text-red-800 dark:text-red-100 text-2xl font-bold">{{ incomeStatement.totalExpenses.value }}</div>
                                    </div>
                                </div>
                                
                                <div class="col-12 md:col-4">
                                    <div class="bg-green-50 dark:bg-green-900 p-3 border-round-lg">
                                        <div class="text-green-800 dark:text-green-100 font-medium mb-2">Net Income</div>
                                        <div class="text-green-800 dark:text-green-100 text-2xl font-bold">{{ incomeStatement.netIncome.value }}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Revenue Section -->
                            <div class="mt-5">
                                <div class="flex justify-content-between align-items-center py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                    <h3 class="text-xl font-semibold m-0 flex align-items-center">
                                        <i class="pi pi-chevron-down mr-2"></i>
                                        Revenue
                                    </h3>
                                    <div class="flex align-items-center">
                                        <Badge :value="incomeStatement.revenue.percentage + '%'" severity="success" class="mr-2" />
                                        <span class="font-semibold">{{ incomeStatement.revenue.total }}</span>
                                    </div>
                                </div>
                                
                                <div v-for="(item, index) in incomeStatement.revenue.items" :key="index" class="py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                    <div class="flex justify-content-between align-items-center">
                                        <span>{{ item.name }}</span>
                                        <div class="flex align-items-center">
                                            <Badge :value="item.percentage + '%'" severity="success" class="mr-2" />
                                            <span>{{ item.value }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex justify-content-between align-items-center py-3 font-semibold">
                                    <span>Total Revenue</span>
                                    <span>{{ incomeStatement.revenue.total }}</span>
                                </div>
                            </div>
                            
                            <!-- Expenses Section -->
                            <div class="mt-5">
                                <div class="flex justify-content-between align-items-center py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                    <h3 class="text-xl font-semibold m-0 flex align-items-center">
                                        <i class="pi pi-chevron-down mr-2"></i>
                                        Expenses
                                    </h3>
                                    <div class="flex align-items-center">
                                        <Badge :value="incomeStatement.expenses.percentage + '%'" severity="danger" class="mr-2" />
                                        <span class="font-semibold">{{ incomeStatement.expenses.total }}</span>
                                    </div>
                                </div>
                                
                                <div v-if="viewMode === 'detailed'">
                                    <div v-for="(item, index) in incomeStatement.expenses.items" :key="index" class="py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                        <div class="flex justify-content-between align-items-center">
                                            <span>{{ item.name }}</span>
                                            <div class="flex align-items-center">
                                                <Badge :value="item.percentage + '%'" severity="danger" class="mr-2" />
                                                <span>{{ item.value }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-else>
                                    <!-- Summary view only shows total -->
                                    <div class="py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                        <div class="flex justify-content-between align-items-center">
                                            <span>Total Operating Expenses</span>
                                            <span>{{ incomeStatement.expenses.total }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex justify-content-between align-items-center py-3 font-semibold">
                                    <span>Total Expenses</span>
                                    <span>{{ incomeStatement.expenses.total }}</span>
                                </div>
                            </div>
                            
                            <!-- Net Income Section -->
                            <div class="mt-3 pt-3 border-top-1 border-gray-300 dark:border-gray-600">
                                <div class="flex justify-content-between align-items-center py-2 font-bold text-xl">
                                    <span>Net Income</span>
                                    <span class="text-green-500 dark:text-green-300">{{ incomeStatement.netIncome.value }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Visualization -->
                    <div class="p-card mt-4">
                        <div class="p-card-body">
                            <h3 class="text-xl font-semibold mb-3">Visualization</h3>
                            <p class="text-color-secondary mb-4">Visual breakdown of income and expenses</p>
                            
                            <div style="height: 400px">
                                <Chart type="bar" :data="incomeChartData" :options="barChartOptions" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template> 