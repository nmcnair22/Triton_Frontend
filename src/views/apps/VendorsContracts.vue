<script setup>
import { ref, onMounted, computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Menu from 'primevue/menu';

// Layout composables for theming
const { layoutConfig, isDarkTheme } = useLayout();

// Active tab state
const activeTabIndex = ref(0);

// Search query
const searchQuery = ref('');

// Action menu reference
const actionMenu = ref(null);
const actionMenuItems = ref([
    { label: 'Edit', icon: 'pi pi-pencil' },
    { label: 'View Details', icon: 'pi pi-eye' },
    { label: 'Deactivate', icon: 'pi pi-times' }
]);

// Stats data
const stats = ref([
    { title: 'Active Vendors', value: 12, icon: 'pi pi-building', color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Contracts', value: 24, icon: 'pi pi-file-contract', color: 'bg-purple-100 text-purple-600' },
    { title: 'Contracts Expiring Soon', value: 3, icon: 'pi pi-calendar-times', color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Upcoming Renewals', value: 5, icon: 'pi pi-calendar-plus', color: 'bg-green-100 text-green-600' },
]);

// Vendors data
const vendors = ref([
    {
        id: 1,
        name: 'AT&T',
        type: 'Telecom Provider',
        services: ['Internet', 'Voice', 'Mobile'],
        phone: '(555) 123-4567',
        email: 'john.smith@att.com',
        activeContracts: 5,
        annualSpend: 45000,
        status: 'active'
    },
    {
        id: 2,
        name: 'Verizon',
        type: 'Telecom Provider',
        services: ['Mobile', 'Data'],
        phone: '(555) 234-5678',
        email: 'sarah.j@verizon.com',
        activeContracts: 3,
        annualSpend: 32000,
        status: 'active'
    },
    {
        id: 3,
        name: 'Comcast Business',
        type: 'Internet Service Provider',
        services: ['Internet', 'Voice'],
        phone: '(555) 345-6789',
        email: 'm.brown@comcast.com',
        activeContracts: 2,
        annualSpend: 18500,
        status: 'active'
    },
    {
        id: 4,
        name: 'CenturyLink',
        type: 'Telecom Provider',
        services: ['Internet', 'Voice', 'Data Center'],
        phone: '(555) 456-7890',
        email: 'j.williams@centurylink.com',
        activeContracts: 4,
        annualSpend: 27500,
        status: 'active'
    }
]);

// Contracts data
const contracts = ref([
    {
        id: 1,
        name: 'Master Service Agreement',
        vendor: 'AT&T',
        service: 'Internet - Fiber',
        startDate: '2024-01-14',
        endDate: '2026-01-13',
        value: 24000,
        daysRemaining: 271,
        status: 'active'
    },
    {
        id: 2,
        name: 'Service Contract',
        vendor: 'Verizon',
        service: 'Mobile Services',
        startDate: '2023-07-31',
        endDate: '2025-07-30',
        value: 36000,
        daysRemaining: 104,
        status: 'active'
    },
    {
        id: 3,
        name: 'Service Contract',
        vendor: 'AT&T',
        service: 'Voice Services',
        startDate: '2024-02-29',
        endDate: '2025-02-27',
        value: 12000,
        daysRemaining: -49,
        status: 'active'
    },
    {
        id: 4,
        name: 'Service Contract',
        vendor: 'Comcast Business',
        service: 'Internet - Cable',
        startDate: '2023-11-14',
        endDate: '2025-11-13',
        value: 18000,
        daysRemaining: 210,
        status: 'active'
    },
    {
        id: 5,
        name: 'Master Service Agreement',
        vendor: 'CenturyLink',
        service: 'Data Center Connectivity',
        startDate: '2024-01-31',
        endDate: '2025-01-30',
        value: 30000,
        daysRemaining: -77,
        status: 'active'
    }
]);

// Filter functions for search
const filteredVendors = computed(() => {
    if (!searchQuery.value) return vendors.value;
    
    const query = searchQuery.value.toLowerCase();
    return vendors.value.filter(vendor => 
        vendor.name.toLowerCase().includes(query) ||
        vendor.type.toLowerCase().includes(query) ||
        vendor.email.toLowerCase().includes(query) ||
        vendor.services.some(service => service.toLowerCase().includes(query))
    );
});

const filteredContracts = computed(() => {
    if (!searchQuery.value) return contracts.value;
    
    const query = searchQuery.value.toLowerCase();
    return contracts.value.filter(contract => 
        contract.name.toLowerCase().includes(query) ||
        contract.vendor.toLowerCase().includes(query) ||
        contract.service.toLowerCase().includes(query)
    );
});

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

// Format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};

// Show action menu
const showActionMenu = (event) => {
    actionMenu.value.toggle(event);
};

// Get status class
const getStatusClass = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
};

// Get remaining days class
const getRemainingDaysClass = (days) => {
    if (days < 0) return 'text-red-500';
    if (days < 30) return 'text-yellow-500';
    return 'text-green-500';
};
</script>

<template>
    <div>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
            <div v-for="(stat, index) in stats" :key="index" class="card shadow-sm border-1 border-surface-200 dark:border-surface-700 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 text-sm mb-2">{{ stat.title }}</p>
                        <h2 class="text-4xl font-bold">{{ stat.value }}</h2>
                    </div>
                    <div :class="[stat.color, 'rounded-full p-3']">
                        <i :class="stat.icon + ' text-xl'"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="card">
            <div class="flex flex-col">
                <!-- Header -->
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h1 class="text-2xl font-bold mb-1">Vendors & Contracts</h1>
                        <p class="text-surface-600 dark:text-surface-300">Manage your telecom vendors and service contracts</p>
                    </div>
                    
                    <!-- Search Box -->
                    <div class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="searchQuery" placeholder="Search vendors or contracts..." class="w-full md:w-20rem" />
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex flex-row border-b border-surface-200 dark:border-surface-700">
                    <div 
                        v-for="(tab, index) in ['Vendors', 'Contracts']" 
                        :key="index"
                        @click="activeTabIndex = index" 
                        class="cursor-pointer py-3 px-4" 
                        :class="activeTabIndex === index ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                    >
                        {{ tab }}
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="py-5">
                    <!-- Vendors Tab -->
                    <div v-if="activeTabIndex === 0" class="relative">
                        <div class="absolute top-0 right-0">
                            <Button label="Add Vendor" icon="pi pi-plus" />
                        </div>
                        
                        <div class="pt-12">
                            <!-- Vendors List -->
                            <div v-for="vendor in filteredVendors" :key="vendor.id" class="border-b border-surface-200 dark:border-surface-700 py-4">
                                <div class="flex flex-col md:flex-row justify-between mb-3">
                                    <div class="flex items-start">
                                        <div class="bg-surface-100 dark:bg-surface-800 rounded-full p-3 mr-4">
                                            <i class="pi pi-building text-xl text-primary"></i>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <h3 class="text-lg font-semibold">{{ vendor.name }}</h3>
                                                <span class="text-xs px-2 py-1 rounded-full" :class="getStatusClass(vendor.status)">
                                                    {{ vendor.status }}
                                                </span>
                                            </div>
                                            <p class="text-surface-600 dark:text-surface-300 text-sm">{{ vendor.type }}</p>
                                        </div>
                                    </div>
                                    <div class="flex mt-3 md:mt-0">
                                        <Button label="View Details" class="mr-2" />
                                        <Button icon="pi pi-ellipsis-h" text rounded aria-label="More" @click="showActionMenu" />
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-phone mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span>{{ vendor.phone }}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-envelope mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span>{{ vendor.email }}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-file-contract mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span>{{ vendor.activeContracts }} active contracts</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-dollar mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span>Annual Spend: {{ formatCurrency(vendor.annualSpend) }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-3 flex flex-wrap gap-2">
                                    <span v-for="service in vendor.services" :key="service" class="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-md text-xs">
                                        {{ service }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contracts Tab -->
                    <div v-if="activeTabIndex === 1" class="relative">
                        <div class="absolute top-0 right-0">
                            <Button label="Add Contract" icon="pi pi-plus" />
                        </div>
                        
                        <div class="pt-12">
                            <!-- Contracts List -->
                            <div v-for="contract in filteredContracts" :key="contract.id" class="border-b border-surface-200 dark:border-surface-700 py-4">
                                <div class="flex flex-col md:flex-row justify-between mb-3">
                                    <div class="flex items-start">
                                        <div class="bg-surface-100 dark:bg-surface-800 rounded-full p-3 mr-4">
                                            <i class="pi pi-file-contract text-xl text-purple-500"></i>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <h3 class="text-lg font-semibold">{{ contract.name }}</h3>
                                                <span class="text-xs px-2 py-1 rounded-full" :class="getStatusClass(contract.status)">
                                                    {{ contract.status }}
                                                </span>
                                            </div>
                                            <p class="text-surface-600 dark:text-surface-300 text-sm">{{ contract.vendor }} - {{ contract.service }}</p>
                                        </div>
                                    </div>
                                    <div class="flex mt-3 md:mt-0">
                                        <Button label="View Contract" class="mr-2" />
                                        <Button icon="pi pi-ellipsis-h" text rounded aria-label="More" @click="showActionMenu" />
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-calendar mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span>{{ formatDate(contract.startDate) }} - {{ formatDate(contract.endDate) }}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-dollar mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span>Contract Value: {{ formatCurrency(contract.value) }}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center">
                                            <i class="pi pi-clock mr-2 text-surface-600 dark:text-surface-300"></i>
                                            <span :class="getRemainingDaysClass(contract.daysRemaining)">
                                                {{ contract.daysRemaining }} days remaining
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Popup Menu -->
        <Menu ref="actionMenu" :model="actionMenuItems" :popup="true" />
    </div>
</template>

<style scoped>
.card {
    @apply bg-white dark:bg-surface-800 rounded-lg shadow-sm p-4;
}
</style> 