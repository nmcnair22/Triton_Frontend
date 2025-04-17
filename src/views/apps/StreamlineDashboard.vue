<script setup>
import { ref, onMounted, computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import Chart from 'primevue/chart';

// Layout composables for theming
const { layoutConfig, isDarkTheme } = useLayout();

// Stats for KPI cards
const stats = ref({
    currentBalance: { value: 42568.00, change: +12.5, icon: 'pi pi-dollar', color: 'bg-blue-100 text-blue-700' },
    billsDue: { value: 8942.50, change: +3.2, icon: 'pi pi-calendar', color: 'bg-yellow-100 text-yellow-700' },
    billsRequiringReview: { value: 14, change: -5, icon: 'pi pi-exclamation-circle', color: 'bg-red-100 text-red-700' },
    missingBills: { value: 8, change: -2, icon: 'pi pi-question-circle', color: 'bg-purple-100 text-purple-700' }
});

// Budget chart data
const budgetData = ref(null);
const budgetOptions = ref(null);
const activeView = ref('monthlyTrend');

// Action items
const actionItems = ref([
    {
        id: 1,
        type: 'review',
        title: 'Review bill variance',
        description: 'AT&T bill exceeds expected amount by $120',
        priority: 'high',
        dueDate: 'Today',
        icon: 'pi pi-exclamation-circle',
        iconColor: 'text-red-500'
    },
    {
        id: 2,
        type: 'approve',
        title: 'Approve pending bills',
        description: '8 bills awaiting your approval',
        priority: 'medium',
        dueDate: 'Tomorrow',
        icon: 'pi pi-check-circle',
        iconColor: 'text-orange-500'
    },
    {
        id: 3,
        type: 'process',
        title: 'Process payment batch',
        description: '12 approved bills ready for payment',
        priority: 'medium',
        dueDate: 'May 15, 2025',
        icon: 'pi pi-credit-card',
        iconColor: 'text-blue-500'
    },
    {
        id: 4,
        type: 'update',
        title: 'Update vendor contract',
        description: 'Verizon contract expires in 30 days',
        priority: 'low',
        dueDate: 'May 30, 2025',
        icon: 'pi pi-pencil',
        iconColor: 'text-purple-500'
    }
]);

// Upcoming payments
const upcomingPayments = ref([
    { 
        id: 1,
        vendor: 'AT&T',
        description: 'Internet - Headquarters',
        amount: 299.99,
        dueDate: 'May 14, 2025',
        status: 'scheduled'
    }
]);

// Recent activity
const recentActivity = ref([
    {
        id: 1,
        type: 'payment',
        description: 'Payment processed for AT&T',
        date: 'May 10',
        time: '7:30 AM',
        amount: -299.99
    }
]);

// Methods for formatting
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
};

// Budget chart initialization
onMounted(() => {
    initBudgetChart();
});

const initBudgetChart = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    // Monthly budget data (Jan to Dec)
    budgetData.value = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Budget',
                data: [12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000],
                borderColor: documentStyle.getPropertyValue('--blue-400'),
                pointBackgroundColor: documentStyle.getPropertyValue('--blue-400'),
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 2,
                tension: 0.4
            },
            {
                label: 'Actual',
                data: [10800, 11200, 11800, 13200, 14000, 13600, 12400, 11800, 12200, 11500, 10800, 11200],
                borderColor: documentStyle.getPropertyValue('--green-400'),
                pointBackgroundColor: documentStyle.getPropertyValue('--green-400'),
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 2,
                tension: 0.4
            }
        ]
    };

    budgetOptions.value = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true
                },
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: 15000,
                ticks: {
                    color: textColorSecondary,
                    callback: function(value) {
                        if (value >= 1000) {
                            return '$' + value / 1000 + 'k';
                        }
                        return '$' + value;
                    }
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            x: {
                ticks: {
                    color: textColorSecondary,
                    autoSkip: true,
                    maxRotation: 0
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
};

// Computed for priority styling
const getPriorityClass = (priority) => {
    switch (priority) {
        case 'high':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
        case 'medium':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
        case 'low':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
};

// Computed for status styling
const getStatusClass = (status) => {
    switch (status) {
        case 'scheduled':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
};
</script>

<template>
    <div class="streamline-dashboard">
        <!-- Header section with title and Add Funds button -->
        <div class="flex justify-between items-center mb-5">
            <div>
                <h1 class="text-3xl font-bold mb-1">Dashboard</h1>
                <p class="text-surface-600 dark:text-surface-300">Welcome back! Here's an overview of your telecom expense management.</p>
            </div>
            <Button icon="pi pi-plus" label="Add Funds" class="font-semibold" />
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <!-- Current Balance -->
            <div class="card shadow-sm border-l-4 border-l-blue-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Current Balance</p>
                        <h2 class="text-3xl font-bold mb-1">{{ formatCurrency(stats.currentBalance.value) }}</h2>
                        <div class="text-green-500 font-medium">{{ formatPercent(stats.currentBalance.change) }}</div>
                    </div>
                    <div class="bg-blue-100 rounded-full p-3 text-blue-500">
                        <i class="pi pi-dollar text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Bills Due This Month -->
            <div class="card shadow-sm border-l-4 border-l-yellow-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Bills Due This Month</p>
                        <h2 class="text-3xl font-bold mb-1">{{ formatCurrency(stats.billsDue.value) }}</h2>
                        <div class="text-green-500 font-medium">{{ formatPercent(stats.billsDue.change) }}</div>
                    </div>
                    <div class="bg-yellow-100 rounded-full p-3 text-yellow-500">
                        <i class="pi pi-calendar text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Bills Requiring Review -->
            <div class="card shadow-sm border-l-4 border-l-red-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Bills Requiring Review</p>
                        <h2 class="text-3xl font-bold mb-1">{{ stats.billsRequiringReview.value }}</h2>
                        <div class="text-red-500 font-medium">{{ formatPercent(stats.billsRequiringReview.change) }}</div>
                    </div>
                    <div class="bg-red-100 rounded-full p-3 text-red-500">
                        <i class="pi pi-exclamation-circle text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Missing Bills -->
            <div class="card shadow-sm border-l-4 border-l-purple-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Missing Bills</p>
                        <h2 class="text-3xl font-bold mb-1">{{ stats.missingBills.value }}</h2>
                        <div class="text-green-500 font-medium">{{ formatPercent(stats.missingBills.change) }}</div>
                    </div>
                    <div class="bg-purple-100 rounded-full p-3 text-purple-500">
                        <i class="pi pi-question-circle text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Budget Overview and Action Items -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
            <!-- Budget Overview -->
            <div class="card xl:col-span-8">
                <div>
                    <h2 class="text-xl font-bold mb-1">Budget Overview</h2>
                    <p class="text-surface-600 dark:text-surface-300 mb-4">Track your telecom expenses against budgeted amounts</p>
                </div>

                <!-- Budget Tab Navigation -->
                <div class="mb-4">
                    <div class="flex border-b border-surface-200 dark:border-surface-700">
                        <div 
                            @click="activeView = 'monthlyTrend'" 
                            class="cursor-pointer py-2 px-4" 
                            :class="activeView === 'monthlyTrend' ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                        >
                            Monthly Trend
                        </div>
                        <div 
                            @click="activeView = 'byCategory'" 
                            class="cursor-pointer py-2 px-4" 
                            :class="activeView === 'byCategory' ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                        >
                            By Category
                        </div>
                        <div 
                            @click="activeView = 'byVendor'" 
                            class="cursor-pointer py-2 px-4" 
                            :class="activeView === 'byVendor' ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                        >
                            By Vendor
                        </div>
                    </div>
                </div>

                <!-- YTD Variance -->
                <div class="flex justify-end mb-2">
                    <div class="text-surface-600 dark:text-surface-300">
                        YTD Variance: <span class="text-green-500 font-medium">$2,400 under budget</span>
                    </div>
                </div>

                <!-- Budget Chart -->
                <div class="chart-container px-2 pb-4">
                    <Chart type="line" :data="budgetData" :options="budgetOptions" class="w-full h-[350px]" />
                </div>
            </div>

            <!-- Action Items -->
            <div class="card xl:col-span-4">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-xl font-bold mb-1">Action Items</h2>
                        <p class="text-surface-600 dark:text-surface-300">Tasks requiring your attention</p>
                    </div>
                    <span class="bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 py-1 px-3 rounded-full text-sm">
                        {{ actionItems.length }} items
                    </span>
                </div>

                <!-- Action Items List -->
                <div class="flex flex-col gap-4">
                    <div v-for="item in actionItems" :key="item.id" class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <div class="flex items-start gap-3">
                            <div :class="item.iconColor" class="mt-1">
                                <i :class="item.icon" class="text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold mb-1">{{ item.title }}</h3>
                                <p class="text-surface-600 dark:text-surface-300 text-sm mb-3">{{ item.description }}</p>
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <span :class="getPriorityClass(item.priority)" class="px-2 py-1 rounded-full text-xs font-medium capitalize">
                                            {{ item.priority }}
                                        </span>
                                        <span class="text-surface-500 dark:text-surface-400 text-xs">Due: {{ item.dueDate }}</span>
                                    </div>
                                    <Button label="View" size="small" text />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upcoming Payments and Recent Activity -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <!-- Upcoming Payments -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-xl font-bold mb-1">Upcoming Payments</h2>
                        <p class="text-surface-600 dark:text-surface-300">Bills due in the next 30 days</p>
                    </div>
                    <span class="bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 py-1 px-3 rounded-full text-sm">
                        {{ upcomingPayments.length }} bills
                    </span>
                </div>

                <!-- Payments List -->
                <div v-if="upcomingPayments.length > 0" class="flex flex-col gap-3">
                    <div v-for="payment in upcomingPayments" :key="payment.id" class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="bg-blue-100 dark:bg-blue-900 rounded-full p-2 text-blue-500 dark:text-blue-300">
                                    <i class="pi pi-building text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold">{{ payment.vendor }}</h3>
                                    <p class="text-surface-500 dark:text-surface-400 text-sm">{{ payment.description }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-lg">{{ formatCurrency(payment.amount) }}</div>
                                <div class="flex items-center gap-2 mt-1">
                                    <span :class="getStatusClass(payment.status)" class="px-2 py-0.5 rounded-full text-xs capitalize">
                                        {{ payment.status }}
                                    </span>
                                    <span class="text-surface-500 dark:text-surface-400 text-xs">{{ payment.dueDate }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center mt-4">
                    <Button label="Pay Now" icon="pi pi-credit-card" />
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-xl font-bold mb-1">Recent Activity</h2>
                        <p class="text-surface-600 dark:text-surface-300">Latest actions in your account</p>
                    </div>
                    <span class="bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 py-1 px-3 rounded-full text-sm">
                        Last 7 days
                    </span>
                </div>

                <!-- Activity List -->
                <div v-if="recentActivity.length > 0" class="flex flex-col gap-3">
                    <div v-for="activity in recentActivity" :key="activity.id" class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <div class="bg-blue-100 dark:bg-blue-900 rounded-full p-2 text-blue-500 dark:text-blue-300">
                                    <i class="pi pi-file-edit text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold">{{ activity.description }}</h3>
                                    <p class="text-surface-500 dark:text-surface-400 text-sm">{{ activity.date }} • {{ activity.time }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-lg text-red-500">{{ formatCurrency(activity.amount) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.streamline-dashboard .p-button.p-button-sm {
    padding: 0.25rem 0.75rem;
}

.card {
    @apply p-6 bg-white dark:bg-surface-800 rounded-xl shadow-sm;
}

.chart-container {
    position: relative;
    height: 350px;
    width: 100%;
    overflow: hidden;
}
</style> 