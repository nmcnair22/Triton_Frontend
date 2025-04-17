<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import TabMenu from 'primevue/tabmenu';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';

// Tabs
const activeTabIndex = ref(0);
const tabs = ref([
    { label: 'All Bills', count: 248 },
    { label: 'Pending Review', count: 14 },
    { label: 'Approved', count: 32 },
    { label: 'Paid', count: 0 },
    { label: 'Flagged', count: 8 }
]);

// View options
const viewMode = ref('table');

// Table selection
const selectedBills = ref([]);

// Search and filters
const searchQuery = ref('');
const selectedVendor = ref(null);
const selectedServiceType = ref(null);
const selectedLocation = ref(null);
const selectedDateRange = ref(null);
const selectedAmountRange = ref(null);

// Filter options
const vendorOptions = ref([
    { name: 'AT&T', code: 'ATT' },
    { name: 'Verizon', code: 'VZW' },
    { name: 'Comcast', code: 'CMST' },
    { name: 'CenturyLink', code: 'CTL' },
    { name: 'Sprint', code: 'SPRT' }
]);

const serviceTypeOptions = ref([
    { name: 'Internet', code: 'INTERNET' },
    { name: 'Mobile Services', code: 'MOBILE' },
    { name: 'Business Voice', code: 'VOICE' },
    { name: 'Dedicated Line', code: 'DEDICATED' },
    { name: 'Mobile Data', code: 'DATA' }
]);

const locationOptions = ref([
    { name: 'Headquarters', code: 'HQ' },
    { name: 'Company-wide', code: 'COMPANY' },
    { name: 'Branch Office', code: 'BRANCH' },
    { name: 'Data Center', code: 'DATACENTER' },
    { name: 'Remote Office', code: 'REMOTE' }
]);

const amountRangeOptions = ref([
    { name: 'Under $100', code: 'UNDER_100' },
    { name: '$100 - $500', code: '100_500' },
    { name: '$500 - $1000', code: '500_1000' },
    { name: 'Over $1000', code: 'OVER_1000' }
]);

// Mock data for bills
const bills = ref([
    {
        id: 'BILL-1234',
        vendor: 'AT&T',
        service: 'Internet',
        location: 'Headquarters',
        amount: 299.99,
        amountVariance: 10.00,
        dueDate: '2025-05-14',
        status: 'Pending'
    },
    {
        id: 'BILL-1235',
        vendor: 'Verizon',
        service: 'Mobile Services',
        location: 'Company-wide',
        amount: 1250.75,
        amountVariance: 0,
        dueDate: '2025-05-17',
        status: 'Approved'
    },
    {
        id: 'BILL-1236',
        vendor: 'Comcast',
        service: 'Business Voice',
        location: 'Branch Office',
        amount: 189.50,
        amountVariance: 0,
        dueDate: '2025-05-19',
        status: 'Approved'
    },
    {
        id: 'BILL-1237',
        vendor: 'CenturyLink',
        service: 'Dedicated Line',
        location: 'Data Center',
        amount: 899.00,
        amountVariance: 49.01,
        dueDate: '2025-05-24',
        status: 'Pending'
    },
    {
        id: 'BILL-1238',
        vendor: 'Sprint',
        service: 'Mobile Data',
        location: 'Remote Office',
        amount: 450.00,
        amountVariance: 0,
        dueDate: '2025-05-11',
        status: 'Paid'
    },
    {
        id: 'BILL-1239',
        vendor: 'AT&T',
        service: 'Business Internet',
        location: 'Branch Office',
        amount: 199.99,
        amountVariance: 0,
        dueDate: '2025-05-21',
        status: 'Pending'
    }
]);

// Summary metrics
const summaryMetrics = computed(() => {
    const totalBills = bills.value.length;
    const pendingReviewBills = bills.value.filter(bill => bill.status === 'Pending').length;
    const approvedBills = bills.value.filter(bill => bill.status === 'Approved').length;
    const flaggedBills = bills.value.filter(bill => bill.amountVariance > 0).length;
    const totalAmount = bills.value.reduce((sum, bill) => sum + bill.amount, 0);
    
    return {
        totalBills,
        pendingReviewBills,
        approvedBills,
        flaggedBills,
        totalAmount
    };
});

// Filtered bills based on active tab
const filteredBills = computed(() => {
    let filtered = [...bills.value];
    
    // Apply tab filter
    if (activeTabIndex.value === 1) {
        filtered = filtered.filter(bill => bill.status === 'Pending');
    } else if (activeTabIndex.value === 2) {
        filtered = filtered.filter(bill => bill.status === 'Approved');
    } else if (activeTabIndex.value === 3) {
        filtered = filtered.filter(bill => bill.status === 'Paid');
    } else if (activeTabIndex.value === 4) {
        filtered = filtered.filter(bill => bill.amountVariance > 0);
    }
    
    // Apply search query
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(bill => 
            bill.id.toLowerCase().includes(query) ||
            bill.vendor.toLowerCase().includes(query) ||
            bill.service.toLowerCase().includes(query) ||
            bill.location.toLowerCase().includes(query)
        );
    }
    
    // Apply vendor filter
    if (selectedVendor.value) {
        filtered = filtered.filter(bill => 
            bill.vendor === selectedVendor.value.name
        );
    }
    
    // Apply service type filter
    if (selectedServiceType.value) {
        filtered = filtered.filter(bill => 
            bill.service === selectedServiceType.value.name
        );
    }
    
    // Apply location filter
    if (selectedLocation.value) {
        filtered = filtered.filter(bill => 
            bill.location === selectedLocation.value.name
        );
    }
    
    return filtered;
});

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

// Format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).format(date);
};

// Get status severity class
const getStatusSeverity = (status) => {
    switch (status) {
        case 'Pending':
            return 'warning';
        case 'Approved':
            return 'success';
        case 'Paid':
            return 'info';
        default:
            return 'secondary';
    }
};

// Handle tab change
const onTabChange = (index) => {
    activeTabIndex.value = index;
};

// Toggle view mode
const toggleView = (mode) => {
    viewMode.value = mode;
};

// Export data
const exportData = () => {
    // Implementation for export functionality
    console.log('Export data');
};

// Reset filters
const resetFilters = () => {
    selectedVendor.value = null;
    selectedServiceType.value = null;
    selectedLocation.value = null;
    selectedDateRange.value = null;
    selectedAmountRange.value = null;
    searchQuery.value = '';
};
</script>

<template>
    <div class="bill-management">
        <!-- Header section with title and Add Funds button -->
        <div class="flex justify-between items-center mb-5">
            <div>
                <h1 class="text-3xl font-bold mb-1">Bill Management</h1>
                <p class="text-surface-600 dark:text-surface-300">View, manage, and process all your telecom bills in one place.</p>
            </div>
            <div class="flex gap-2">
                <Button icon="pi pi-filter" label="Filters" outlined />
                <Button icon="pi pi-plus" label="Add Funds" severity="primary" />
            </div>
        </div>

        <!-- Tab navigation -->
        <div class="mb-5">
            <div class="flex border-b border-surface-200 dark:border-surface-700">
                <div 
                    v-for="(tab, index) in tabs" 
                    :key="index"
                    @click="onTabChange(index)" 
                    class="cursor-pointer py-3 px-6" 
                    :class="activeTabIndex === index ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                >
                    {{ tab.label }}
                </div>
            </div>
        </div>

        <!-- Summary metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <!-- Total Bills -->
            <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <div>
                    <p class="text-surface-600 dark:text-surface-300 text-sm">Total Bills</p>
                    <p class="text-3xl font-bold">{{ summaryMetrics.totalBills }}</p>
                </div>
                <div class="text-blue-500">
                    <i class="pi pi-file text-2xl"></i>
                </div>
            </div>

            <!-- Pending Review -->
            <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <div>
                    <p class="text-surface-600 dark:text-surface-300 text-sm">Pending Review</p>
                    <p class="text-3xl font-bold">{{ summaryMetrics.pendingReviewBills }}</p>
                </div>
                <div class="text-yellow-500">
                    <i class="pi pi-clock text-2xl"></i>
                </div>
            </div>

            <!-- Approved -->
            <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <div>
                    <p class="text-surface-600 dark:text-surface-300 text-sm">Approved</p>
                    <p class="text-3xl font-bold">{{ summaryMetrics.approvedBills }}</p>
                </div>
                <div class="text-green-500">
                    <i class="pi pi-check-circle text-2xl"></i>
                </div>
            </div>

            <!-- Flagged -->
            <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <div>
                    <p class="text-surface-600 dark:text-surface-300 text-sm">Flagged</p>
                    <p class="text-3xl font-bold">{{ summaryMetrics.flaggedBills }}</p>
                </div>
                <div class="text-red-500">
                    <i class="pi pi-exclamation-circle text-2xl"></i>
                </div>
            </div>

            <!-- Total Amount -->
            <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <div>
                    <p class="text-surface-600 dark:text-surface-300 text-sm">Total Amount</p>
                    <p class="text-3xl font-bold">{{ formatCurrency(summaryMetrics.totalAmount) }}</p>
                </div>
                <div class="text-purple-500">
                    <i class="pi pi-dollar text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- Search and filters -->
        <div class="mb-4">
            <div class="flex flex-col md:flex-row gap-3 mb-4">
                <span class="p-input-icon-left flex-grow">
                    <i class="pi pi-search" />
                    <InputText v-model="searchQuery" placeholder="Search bills by ID, vendor, or service..." class="w-full" />
                </span>
                <div class="flex gap-2">
                    <Button 
                        icon="pi pi-list" 
                        :outlined="viewMode !== 'table'" 
                        :text="viewMode === 'table'" 
                        @click="toggleView('table')" 
                        aria-label="Table View"
                    />
                    <Button 
                        icon="pi pi-th-large" 
                        :outlined="viewMode !== 'cards'" 
                        :text="viewMode === 'cards'" 
                        @click="toggleView('cards')" 
                        aria-label="Card View"
                    />
                    <Button label="Export" icon="pi pi-download" outlined @click="exportData" />
                </div>
            </div>

            <div class="flex flex-wrap gap-3">
                <Dropdown 
                    v-model="selectedVendor" 
                    :options="vendorOptions" 
                    optionLabel="name" 
                    placeholder="Vendor" 
                    class="w-full md:w-auto"
                />
                <Dropdown 
                    v-model="selectedServiceType" 
                    :options="serviceTypeOptions" 
                    optionLabel="name" 
                    placeholder="Service Type" 
                    class="w-full md:w-auto"
                />
                <Dropdown 
                    v-model="selectedLocation" 
                    :options="locationOptions" 
                    optionLabel="name" 
                    placeholder="Location" 
                    class="w-full md:w-auto"
                />
                <Calendar 
                    v-model="selectedDateRange" 
                    selectionMode="range" 
                    placeholder="Due Date" 
                    class="w-full md:w-auto"
                />
                <Dropdown 
                    v-model="selectedAmountRange" 
                    :options="amountRangeOptions" 
                    optionLabel="name" 
                    placeholder="Amount Range" 
                    class="w-full md:w-auto"
                />
            </div>
        </div>

        <!-- Data table -->
        <DataTable 
            v-if="viewMode === 'table'"
            :value="filteredBills" 
            v-model:selection="selectedBills"
            paginator 
            :rows="10" 
            :rowsPerPageOptions="[5, 10, 25, 50]"
            tableStyle="min-width: 50rem"
            stripedRows
            showGridlines
            class="p-datatable-sm"
        >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="id" header="Bill ID" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex items-center">
                        <span class="font-semibold">{{ data.id }}</span>
                        <Button 
                            icon="pi pi-angle-right" 
                            text 
                            rounded 
                            class="ml-2 p-1" 
                            aria-label="View Details"
                        />
                    </div>
                </template>
            </Column>
            <Column field="vendor" header="Vendor" sortable style="min-width: 10rem"></Column>
            <Column field="service" header="Service" sortable style="min-width: 12rem"></Column>
            <Column field="location" header="Location" sortable style="min-width: 10rem"></Column>
            <Column field="amount" header="Amount" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex flex-col">
                        <span :class="data.amountVariance > 0 ? 'text-red-500 font-semibold' : ''">
                            {{ formatCurrency(data.amount) }}
                        </span>
                        <span v-if="data.amountVariance > 0" class="text-red-500 text-xs">
                            +{{ formatCurrency(data.amountVariance) }}
                        </span>
                    </div>
                </template>
            </Column>
            <Column field="dueDate" header="Due Date" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <div class="flex items-center">
                        <i class="pi pi-calendar mr-2 text-surface-400"></i>
                        <span>{{ formatDate(data.dueDate) }}</span>
                    </div>
                </template>
            </Column>
            <Column field="status" header="Status" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    <Tag 
                        :value="data.status" 
                        :severity="getStatusSeverity(data.status)" 
                    />
                </template>
            </Column>
            <Column header="Actions" style="min-width: 8rem">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-eye" 
                            text 
                            rounded 
                            aria-label="View"
                        />
                        <Button 
                            v-if="data.status === 'Pending'" 
                            icon="pi pi-thumbs-up" 
                            text 
                            rounded 
                            severity="success" 
                            aria-label="Approve"
                        />
                        <Button 
                            v-if="data.status === 'Pending'" 
                            icon="pi pi-thumbs-down" 
                            text 
                            rounded 
                            severity="danger" 
                            aria-label="Reject"
                        />
                        <Button 
                            icon="pi pi-ellipsis-v" 
                            text 
                            rounded 
                            aria-label="More Options"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Card view (alternative view) -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="bill in filteredBills" :key="bill.id" class="card p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <div class="flex justify-between mb-3">
                    <div class="flex flex-col">
                        <span class="font-semibold text-lg">{{ bill.id }}</span>
                        <span class="text-surface-600 dark:text-surface-400">{{ bill.vendor }}</span>
                    </div>
                    <Tag :value="bill.status" :severity="getStatusSeverity(bill.status)" />
                </div>
                <div class="grid grid-cols-2 gap-y-2 mb-3">
                    <div>
                        <div class="text-surface-600 dark:text-surface-400 text-sm">Service</div>
                        <div>{{ bill.service }}</div>
                    </div>
                    <div>
                        <div class="text-surface-600 dark:text-surface-400 text-sm">Location</div>
                        <div>{{ bill.location }}</div>
                    </div>
                    <div>
                        <div class="text-surface-600 dark:text-surface-400 text-sm">Due Date</div>
                        <div>{{ formatDate(bill.dueDate) }}</div>
                    </div>
                    <div>
                        <div class="text-surface-600 dark:text-surface-400 text-sm">Amount</div>
                        <div :class="bill.amountVariance > 0 ? 'text-red-500 font-semibold' : ''">
                            {{ formatCurrency(bill.amount) }}
                            <span v-if="bill.amountVariance > 0" class="text-red-500 text-xs block">
                                +{{ formatCurrency(bill.amountVariance) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-3">
                    <Button icon="pi pi-eye" text rounded aria-label="View" />
                    <Button 
                        v-if="bill.status === 'Pending'" 
                        icon="pi pi-thumbs-up" 
                        text 
                        rounded 
                        severity="success" 
                        aria-label="Approve"
                    />
                    <Button 
                        v-if="bill.status === 'Pending'" 
                        icon="pi pi-thumbs-down" 
                        text 
                        rounded 
                        severity="danger" 
                        aria-label="Reject"
                    />
                    <Button icon="pi pi-ellipsis-v" text rounded aria-label="More Options" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bill-management .p-button.p-button-sm {
    padding: 0.25rem 0.75rem;
}

.card {
    @apply bg-white dark:bg-surface-800 shadow-sm;
}

:deep(.p-tag) {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
}
</style> 