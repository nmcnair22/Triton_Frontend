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
import Drawer from 'primevue/drawer';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

// Tabs
const activeTabIndex = ref(0);
const tabs = ref([
    { label: 'All Bills', count: 248 },
    { label: 'Pending Review', count: 14 },
    { label: 'Approved', count: 32 },
    { label: 'Flagged', count: 8 },
    { label: 'Paid', count: 0 },
    { label: 'Disputes & Credits', count: 92 }
]);

// Disputes & Credits subtabs
const activeDisputeSubtabIndex = ref(0);
const disputeSubtabs = ref([
    { label: 'Active Disputes', count: 24 },
    { label: 'Credit Tracking', count: 32 },
    { label: 'C&D Resolved', count: 68 }
]);

// View options
const viewMode = ref('table');

// Table selection
const selectedBills = ref([]);
const selectedDisputes = ref([]);
const selectedCredits = ref([]);

// Bill Details Drawer
const drawerVisible = ref(false);
const selectedBill = ref(null);
const drawerActiveTabIndex = ref(0);

// Mock data for active disputes
const activeDisputes = ref([
    {
        id: 'DSP-1001',
        invoice: 'INV-1234',
        vendor: 'AT&T',
        customer: 'Acme Corporation',
        reason: 'Incorrect rate applied',
        amount: 120.50,
        created: '2025-03-31',
        expected: '2025-05-14',
        status: 'Vendor Reviewing'
    },
    {
        id: 'DSP-1002',
        invoice: 'INV-1235',
        vendor: 'Verizon',
        customer: 'Globex Corporation',
        reason: 'Unauthorized charges',
        amount: 350.75,
        created: '2025-04-04',
        expected: '2025-05-19',
        status: 'Pending Response'
    },
    {
        id: 'DSP-1003',
        invoice: 'INV-1236',
        vendor: 'Comcast',
        customer: 'Initech',
        reason: 'Service outage credit',
        amount: 89.99,
        created: '2025-04-09',
        expected: '2025-05-09',
        status: 'Credit Pending'
    },
    {
        id: 'DSP-1004',
        invoice: 'INV-1237',
        vendor: 'CenturyLink',
        customer: 'Umbrella Corporation',
        reason: 'Contract rate mismatch',
        amount: 250.00,
        created: '2025-04-11',
        expected: '2025-05-24',
        status: 'Escalated'
    }
]);

// Mock data for resolved disputes
const resolvedDisputes = ref([
    {
        id: 'DSP-1005',
        invoice: 'INV-1238',
        vendor: 'AT&T',
        customer: 'Stark Industries',
        reason: 'Duplicate charge',
        amount: 175.25,
        created: '2025-03-14',
        resolved: '2025-04-09',
        status: 'Resolved (Credit)'
    },
    {
        id: 'DSP-1006',
        invoice: 'INV-1239',
        vendor: 'Verizon',
        customer: 'Acme Corporation',
        reason: 'Incorrect tax calculation',
        amount: 420.00,
        created: '2025-03-19',
        resolved: '2025-04-14',
        status: 'Resolved (Partial)'
    },
    {
        id: 'DSP-1007',
        invoice: 'INV-1240',
        vendor: 'Sprint',
        customer: 'Globex Corporation',
        reason: 'Service not provided',
        amount: 150.00,
        created: '2025-03-24',
        resolved: '2025-04-19',
        status: 'Resolved (Denied)'
    }
]);

// Mock data for credits received
const creditsReceived = ref([
    {
        id: 'CR-2001',
        vendor: 'AT&T',
        customer: 'Acme Corporation',
        reason: 'Overbilling on data charges',
        amount: 250.00,
        receivedDate: '2025-04-14',
        appliedTo: 'INV-6789'
    },
    {
        id: 'CR-2002',
        vendor: 'Verizon',
        customer: 'Globex Corporation',
        reason: 'Service outage credit',
        amount: 175.50,
        receivedDate: '2025-04-19',
        appliedTo: 'Pending'
    },
    {
        id: 'CR-2003',
        vendor: 'Comcast',
        customer: 'Initech',
        reason: 'Equipment return',
        amount: 50.00,
        receivedDate: '2025-04-24',
        appliedTo: 'INV-6790'
    }
]);

// Open bill details drawer
const openBillDetails = (bill) => {
    selectedBill.value = bill;
    drawerVisible.value = true;
    drawerActiveTabIndex.value = 0;
};

// Close bill details drawer
const closeBillDetails = () => {
    drawerVisible.value = false;
    selectedBill.value = null;
    drawerActiveTabIndex.value = 0;
};

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

// Disputes & Credits metrics
const disputeMetrics = computed(() => {
    const totalActiveAmount = activeDisputes.value.reduce((sum, dispute) => sum + dispute.amount, 0);
    const avgResolutionDays = 15; // Mock static value
    const pendingVendorResponse = activeDisputes.value.filter(d => d.status === 'Vendor Reviewing' || d.status === 'Pending Response').length;
    
    return {
        totalActive: activeDisputes.value.length,
        totalActiveAmount,
        avgResolutionDays,
        pendingVendorResponse
    };
});

const creditMetrics = computed(() => {
    const totalAmount = creditsReceived.value.reduce((sum, credit) => sum + credit.amount, 0);
    const thisMonth = creditsReceived.value.filter(c => {
        const date = new Date(c.receivedDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const pendingApplication = creditsReceived.value.filter(c => c.appliedTo === 'Pending').length;
    
    return {
        total: creditsReceived.value.length,
        totalAmount,
        thisMonth,
        pendingApplication
    };
});

const resolvedMetrics = computed(() => {
    const totalAmount = resolvedDisputes.value.reduce((sum, dispute) => sum + dispute.amount, 0);
    const successRate = 85; // Mock static value
    const avgResolutionDays = 18; // Mock static value
    
    return {
        total: resolvedDisputes.value.length,
        totalAmount,
        successRate,
        avgResolutionDays
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

// Handle dispute subtab change
const onDisputeSubtabChange = (index) => {
    activeDisputeSubtabIndex.value = index;
};

// Format date for disputes/credits
const formatDisputeDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).format(date);
};

// Get appropriate class for dispute status
const getDisputeStatusClass = (status) => {
    if (status.includes('Resolved (Credit)')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    if (status.includes('Resolved (Partial)')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    if (status.includes('Resolved (Denied)')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    if (status.includes('Vendor Reviewing')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    if (status.includes('Pending Response')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    if (status.includes('Credit Pending')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    if (status.includes('Escalated')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
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
            v-if="viewMode === 'table' && activeTabIndex !== 5"
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
                            @click="openBillDetails(data)"
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
                            @click="openBillDetails(data)"
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
        <div v-else-if="viewMode === 'cards' && activeTabIndex !== 5" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Button 
                        icon="pi pi-eye" 
                        text 
                        rounded 
                        aria-label="View"
                        @click="openBillDetails(bill)"
                    />
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

        <!-- Dispute & Credit Management Section (shown when Disputes & Credits tab is active) -->
        <div v-if="activeTabIndex === 5" class="dispute-credit-management">
            <div class="mb-4">
                <h2 class="text-xl font-bold mb-1">Dispute & Credit Management</h2>
                <p class="text-surface-600 dark:text-surface-300">Track and manage disputes, credits, and resolutions</p>
            </div>

            <!-- Dispute & Credit subtabs -->
            <div class="mb-5">
                <div class="flex border-b border-surface-200 dark:border-surface-700">
                    <div 
                        v-for="(tab, index) in disputeSubtabs" 
                        :key="index"
                        @click="onDisputeSubtabChange(index)" 
                        class="cursor-pointer py-3 px-6" 
                        :class="activeDisputeSubtabIndex === index ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                    >
                        {{ tab.label }}
                    </div>
                </div>
            </div>

            <!-- Active Disputes (shown when first subtab is active) -->
            <div v-if="activeDisputeSubtabIndex === 0">
                <!-- Summary metrics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Active Disputes</p>
                            <p class="text-3xl font-bold">{{ disputeMetrics.totalActive }}</p>
                        </div>
                        <div class="text-red-500">
                            <i class="pi pi-exclamation-circle text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Total Amount</p>
                            <p class="text-3xl font-bold">{{ formatCurrency(disputeMetrics.totalActiveAmount) }}</p>
                        </div>
                        <div class="text-blue-500">
                            <i class="pi pi-dollar text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Avg. Resolution Time</p>
                            <p class="text-3xl font-bold">{{ disputeMetrics.avgResolutionDays }} days</p>
                        </div>
                        <div class="text-orange-500">
                            <i class="pi pi-clock text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Pending Vendor Response</p>
                            <p class="text-3xl font-bold">{{ disputeMetrics.pendingVendorResponse }}</p>
                        </div>
                        <div class="text-purple-500">
                            <i class="pi pi-inbox text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Search and filters -->
                <div class="mb-4 flex flex-wrap gap-3">
                    <span class="p-input-icon-left flex-grow">
                        <i class="pi pi-search" />
                        <InputText placeholder="Search disputes..." class="w-full" />
                    </span>
                    <div class="flex gap-2">
                        <Dropdown placeholder="All Vendors" class="w-48" />
                        <Button icon="pi pi-plus" label="Create Dispute" severity="primary" />
                    </div>
                </div>

                <!-- Active Disputes Table -->
                <DataTable 
                    :value="activeDisputes" 
                    v-model:selection="selectedDisputes"
                    paginator 
                    :rows="10" 
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    tableStyle="min-width: 50rem"
                    stripedRows
                    showGridlines
                    class="p-datatable-sm"
                >
                    <Column field="id" header="Dispute ID" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center text-red-600 font-medium">
                                <i class="pi pi-file-excel mr-2"></i>
                                {{ data.id }}
                            </div>
                        </template>
                    </Column>
                    <Column field="invoice" header="Invoice" sortable></Column>
                    <Column field="vendor" header="Vendor" sortable></Column>
                    <Column field="customer" header="Customer" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i class="pi pi-building mr-2 text-blue-500"></i>
                                {{ data.customer }}
                            </div>
                        </template>
                    </Column>
                    <Column field="reason" header="Reason" sortable></Column>
                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.amount) }}
                        </template>
                    </Column>
                    <Column field="created" header="Date" sortable>
                        <template #body="{ data }">
                            <div>
                                <div class="mb-1"><i class="pi pi-calendar mr-1 text-surface-400"></i> Created: {{ formatDisputeDate(data.created) }}</div>
                                <div><i class="pi pi-calendar mr-1 text-surface-400"></i> Expected: {{ formatDisputeDate(data.expected) }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <span :class="getDisputeStatusClass(data.status)" class="px-2 py-1 text-xs rounded-lg">
                                {{ data.status }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body>
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" text rounded />
                                <Button icon="pi pi-ellipsis-v" text rounded />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Credit Tracking (shown when second subtab is active) -->
            <div v-if="activeDisputeSubtabIndex === 1">
                <!-- Summary metrics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Credits Received</p>
                            <p class="text-3xl font-bold">{{ creditMetrics.total }}</p>
                        </div>
                        <div class="text-green-500">
                            <i class="pi pi-check-circle text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Total Amount</p>
                            <p class="text-3xl font-bold">{{ formatCurrency(creditMetrics.totalAmount) }}</p>
                        </div>
                        <div class="text-blue-500">
                            <i class="pi pi-dollar text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">This Month</p>
                            <p class="text-3xl font-bold">{{ creditMetrics.thisMonth }}</p>
                        </div>
                        <div class="text-orange-500">
                            <i class="pi pi-calendar text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Pending Application</p>
                            <p class="text-3xl font-bold">{{ creditMetrics.pendingApplication }}</p>
                        </div>
                        <div class="text-red-500">
                            <i class="pi pi-clock text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Search and filters -->
                <div class="mb-4 flex flex-wrap gap-3">
                    <span class="p-input-icon-left flex-grow">
                        <i class="pi pi-search" />
                        <InputText placeholder="Search credits..." class="w-full" />
                    </span>
                    <div class="flex gap-2">
                        <Dropdown placeholder="All Vendors" class="w-48" />
                        <Button icon="pi pi-plus" label="Add Credit" severity="primary" />
                    </div>
                </div>

                <!-- Credits Table -->
                <DataTable 
                    :value="creditsReceived" 
                    v-model:selection="selectedCredits"
                    paginator 
                    :rows="10" 
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    tableStyle="min-width: 50rem"
                    stripedRows
                    showGridlines
                    class="p-datatable-sm"
                >
                    <Column field="id" header="Credit ID" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center text-green-600 font-medium">
                                <i class="pi pi-file-excel mr-2"></i>
                                {{ data.id }}
                            </div>
                        </template>
                    </Column>
                    <Column field="vendor" header="Vendor" sortable></Column>
                    <Column field="customer" header="Customer" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i class="pi pi-building mr-2 text-blue-500"></i>
                                {{ data.customer }}
                            </div>
                        </template>
                    </Column>
                    <Column field="reason" header="Reason" sortable></Column>
                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.amount) }}
                        </template>
                    </Column>
                    <Column field="receivedDate" header="Received Date" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i class="pi pi-calendar mr-2 text-surface-400"></i>
                                {{ formatDisputeDate(data.receivedDate) }}
                            </div>
                        </template>
                    </Column>
                    <Column field="appliedTo" header="Applied To" sortable>
                        <template #body="{ data }">
                            <span :class="data.appliedTo === 'Pending' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded-lg' : ''">
                                {{ data.appliedTo }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body>
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" text rounded />
                                <Button icon="pi pi-ellipsis-v" text rounded />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Resolved Disputes (shown when third subtab is active) -->
            <div v-if="activeDisputeSubtabIndex === 2">
                <!-- Summary metrics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Resolved Disputes</p>
                            <p class="text-3xl font-bold">{{ resolvedMetrics.total }}</p>
                        </div>
                        <div class="text-green-500">
                            <i class="pi pi-check-circle text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Total Amount</p>
                            <p class="text-3xl font-bold">{{ formatCurrency(resolvedMetrics.totalAmount) }}</p>
                        </div>
                        <div class="text-blue-500">
                            <i class="pi pi-dollar text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Success Rate</p>
                            <p class="text-3xl font-bold">{{ resolvedMetrics.successRate }}%</p>
                        </div>
                        <div class="text-orange-500">
                            <i class="pi pi-chart-pie text-2xl"></i>
                        </div>
                    </div>

                    <div class="card p-4 rounded-lg border border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div>
                            <p class="text-surface-600 dark:text-surface-300 text-sm">Avg. Resolution Time</p>
                            <p class="text-3xl font-bold">{{ resolvedMetrics.avgResolutionDays }} days</p>
                        </div>
                        <div class="text-purple-500">
                            <i class="pi pi-clock text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Search and filters -->
                <div class="mb-4 flex flex-wrap gap-3">
                    <span class="p-input-icon-left flex-grow">
                        <i class="pi pi-search" />
                        <InputText placeholder="Search resolved disputes..." class="w-full" />
                    </span>
                    <Dropdown placeholder="All Vendors" class="w-48" />
                </div>

                <!-- Resolved Disputes Table -->
                <DataTable 
                    :value="resolvedDisputes" 
                    paginator 
                    :rows="10" 
                    :rowsPerPageOptions="[5, 10, 25, 50]"
                    tableStyle="min-width: 50rem"
                    stripedRows
                    showGridlines
                    class="p-datatable-sm"
                >
                    <Column field="id" header="Dispute ID" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center text-red-600 font-medium">
                                <i class="pi pi-file-excel mr-2"></i>
                                {{ data.id }}
                            </div>
                        </template>
                    </Column>
                    <Column field="invoice" header="Invoice" sortable></Column>
                    <Column field="vendor" header="Vendor" sortable></Column>
                    <Column field="customer" header="Customer" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i class="pi pi-building mr-2 text-blue-500"></i>
                                {{ data.customer }}
                            </div>
                        </template>
                    </Column>
                    <Column field="reason" header="Reason" sortable></Column>
                    <Column field="amount" header="Amount" sortable>
                        <template #body="{ data }">
                            {{ formatCurrency(data.amount) }}
                        </template>
                    </Column>
                    <Column field="created" header="Date" sortable>
                        <template #body="{ data }">
                            <div>
                                <div class="mb-1"><i class="pi pi-calendar mr-1 text-surface-400"></i> Created: {{ formatDisputeDate(data.created) }}</div>
                                <div><i class="pi pi-calendar mr-1 text-surface-400"></i> Resolved: {{ formatDisputeDate(data.resolved) }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="{ data }">
                            <span :class="getDisputeStatusClass(data.status)" class="px-2 py-1 text-xs rounded-lg">
                                {{ data.status }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body>
                            <div class="flex gap-2">
                                <Button icon="pi pi-eye" text rounded />
                                <Button icon="pi pi-ellipsis-v" text rounded />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Bill Details Drawer -->
    <Drawer v-model:visible="drawerVisible" :modal="true" position="right" :style="{ width: '500px' }" class="p-0" @hide="closeBillDetails">
        <template #header v-if="selectedBill">
            <div class="flex justify-between items-center w-full">
                <div class="flex flex-col">
                    <h2 class="text-xl font-bold mb-1">{{ selectedBill.id }}</h2>
                    <p class="text-surface-600 dark:text-surface-400">{{ selectedBill.vendor }} - {{ selectedBill.service }}</p>
                </div>
                <Button icon="pi pi-times" text rounded aria-label="Close" @click="closeBillDetails" />
            </div>
        </template>
        
        <div v-if="selectedBill" class="p-4">
            <div class="flex justify-between mb-6">
                <Tag :value="selectedBill.status" :severity="getStatusSeverity(selectedBill.status)" class="text-sm" />
                <span class="font-semibold text-lg" :class="selectedBill.amountVariance > 0 ? 'text-red-500' : ''">
                    {{ formatCurrency(selectedBill.amount) }}
                </span>
            </div>
            
            <TabView v-model:activeIndex="drawerActiveTabIndex" class="bill-details-tabs">
                <!-- Summary Tab -->
                <TabPanel header="Summary">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <p class="text-surface-600 dark:text-surface-400 mb-1 text-sm">Description</p>
                            <p>{{ selectedBill.service }} services for {{ selectedBill.location }}</p>
                        </div>
                        <div>
                            <p class="text-surface-600 dark:text-surface-400 mb-1 text-sm">Location</p>
                            <p>{{ selectedBill.location }}</p>
                        </div>
                        <div>
                            <p class="text-surface-600 dark:text-surface-400 mb-1 text-sm">Due Date</p>
                            <p>{{ formatDate(selectedBill.dueDate) }}</p>
                        </div>
                        <div>
                            <p class="text-surface-600 dark:text-surface-400 mb-1 text-sm">Billing Period</p>
                            <p>May 1 - May 31, 2025</p>
                        </div>
                        <div>
                            <p class="text-surface-600 dark:text-surface-400 mb-1 text-sm">Account Number</p>
                            <p>AC-{{ Math.floor(Math.random() * 10000) }}</p>
                        </div>
                        <div class="col-span-2 mt-4">
                            <h3 class="font-semibold mb-2">Payment Information</h3>
                            <div class="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                                <span>Subtotal</span>
                                <span>{{ formatCurrency(selectedBill.amount - (selectedBill.amount * 0.07)) }}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-surface-200 dark:border-surface-700">
                                <span>Tax (7%)</span>
                                <span>{{ formatCurrency(selectedBill.amount * 0.07) }}</span>
                            </div>
                            <div class="flex justify-between py-2 font-semibold">
                                <span>Total</span>
                                <span>{{ formatCurrency(selectedBill.amount) }}</span>
                            </div>
                        </div>
                    </div>
                </TabPanel>
                
                <!-- Line Items Tab -->
                <TabPanel header="Line Items">
                    <div class="mb-4">
                        <h3 class="font-semibold mb-3">Service Charges</h3>
                        <div v-for="i in 3" :key="i" class="py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="flex justify-between mb-1">
                                <span class="font-medium">{{ ['Base Service', 'Equipment Rental', 'Support'][i-1] }}</span>
                                <span>{{ formatCurrency((selectedBill.amount / 3) * (i === 1 ? 0.6 : i === 2 ? 0.3 : 0.1)) }}</span>
                            </div>
                            <p class="text-surface-600 dark:text-surface-400 text-sm">
                                {{ ['Monthly service charge', 'Hardware and equipment', 'Technical support'][i-1] }}
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold mb-3">Taxes & Fees</h3>
                        <div v-for="i in 2" :key="i" class="py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="flex justify-between">
                                <span>{{ ['State Sales Tax', 'Federal Communications Fee'][i-1] }}</span>
                                <span>{{ formatCurrency(selectedBill.amount * (i === 1 ? 0.05 : 0.02)) }}</span>
                            </div>
                        </div>
                    </div>
                </TabPanel>
                
                <!-- History Tab -->
                <TabPanel header="History">
                    <div class="mb-4">
                        <h3 class="font-semibold mb-3">Previous Bills</h3>
                        <div v-for="i in 3" :key="i" class="py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="flex justify-between mb-1">
                                <div>
                                    <span class="font-medium">{{ ['April', 'March', 'February'][i-1] }} 2025</span>
                                    <Tag 
                                        :value="['Paid', 'Paid', 'Paid'][i-1]" 
                                        severity="success" 
                                        class="ml-2 text-xs"
                                    />
                                </div>
                                <span>{{ formatCurrency(selectedBill.amount * (0.9 + (i * 0.03))) }}</span>
                            </div>
                            <p class="text-surface-600 dark:text-surface-400 text-sm">
                                Paid on {{ ['04/17/2025', '03/15/2025', '02/18/2025'][i-1] }}
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold mb-3">Payment History</h3>
                        <div v-for="i in 3" :key="i" class="py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="flex justify-between mb-1">
                                <div>
                                    <span class="font-medium">Payment - {{ ['April', 'March', 'February'][i-1] }}</span>
                                </div>
                                <span>{{ formatCurrency(selectedBill.amount * (0.9 + (i * 0.03))) }}</span>
                            </div>
                            <p class="text-surface-600 dark:text-surface-400 text-sm">
                                {{ ['Credit Card ending in 4522', 'Bank Transfer', 'Credit Card ending in 4522'][i-1] }}
                            </p>
                        </div>
                    </div>
                </TabPanel>
                
                <!-- Notes Tab -->
                <TabPanel header="Notes">
                    <div class="mb-4">
                        <div class="flex justify-between mb-3">
                            <h3 class="font-semibold">Bill Notes</h3>
                            <Button label="Add Note" icon="pi pi-plus" text size="small" />
                        </div>
                        
                        <div v-for="i in 2" :key="i" class="mb-4 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                            <div class="flex justify-between mb-2">
                                <span class="font-medium">{{ ['Rate increase notice', 'Service coverage'][i-1] }}</span>
                                <span class="text-surface-600 dark:text-surface-400 text-sm">{{ ['05/10/2025', '05/08/2025'][i-1] }}</span>
                            </div>
                            <p class="text-sm mb-2">
                                {{ [
                                    'Vendor has included notice of upcoming rate increase of 5% starting next billing cycle.',
                                    'Confirmed with vendor that service covers all locations including the new branch office.'
                                ][i-1] }}
                            </p>
                            <div class="flex items-center text-sm text-surface-600 dark:text-surface-400">
                                <i class="pi pi-user mr-1"></i>
                                <span>{{ ['John Smith', 'Maria Rodriguez'][i-1] }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold mb-3">Attachments</h3>
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center p-2 border border-surface-200 dark:border-surface-700 rounded-lg">
                                <i class="pi pi-file-pdf text-red-500 mr-2"></i>
                                <span>{{ selectedBill.id }}_Invoice.pdf</span>
                                <Button icon="pi pi-download" text rounded class="ml-auto" aria-label="Download" />
                            </div>
                            <div class="flex items-center p-2 border border-surface-200 dark:border-surface-700 rounded-lg">
                                <i class="pi pi-file-excel text-green-500 mr-2"></i>
                                <span>Service_Breakdown_{{ selectedBill.id }}.xlsx</span>
                                <Button icon="pi pi-download" text rounded class="ml-auto" aria-label="Download" />
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>
        
        <template #footer v-if="selectedBill && selectedBill.status === 'Pending'">
            <div class="flex justify-end gap-2">
                <Button label="Reject" icon="pi pi-times" outlined severity="danger" />
                <Button label="Approve" icon="pi pi-check" severity="success" />
            </div>
        </template>
    </Drawer>
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

/* Bill details drawer styling */
:deep(.bill-details-tabs .p-tabview-nav) {
    @apply border-b border-surface-200 dark:border-surface-700;
}

:deep(.bill-details-tabs .p-tabview-nav li .p-tabview-nav-link) {
    @apply px-4 py-3 text-surface-700 dark:text-surface-300 border-0 bg-transparent font-medium;
}

:deep(.bill-details-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
    @apply text-primary border-b-2 border-primary bg-transparent;
}

:deep(.bill-details-tabs .p-tabview-panels) {
    @apply p-0 py-4;
}

:deep(.p-drawer-content) {
    @apply p-0;
}

:deep(.p-drawer-header) {
    @apply pb-0 border-b border-surface-200 dark:border-surface-700;
}

:deep(.p-drawer-footer) {
    @apply border-t border-surface-200 dark:border-surface-700;
}
</style> 