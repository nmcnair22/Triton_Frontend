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

// Search queries
const customerSearchQuery = ref('');
const locationSearchQuery = ref('');
const serviceAccountSearchQuery = ref('');

// Action menu reference
const actionMenu = ref(null);
const actionMenuItems = ref([
    { label: 'Edit', icon: 'pi pi-pencil' },
    { label: 'View Details', icon: 'pi pi-eye' },
    { label: 'View Invoices', icon: 'pi pi-file' },
    { label: 'Deactivate', icon: 'pi pi-times' }
]);

// Customer data
const customers = ref([
    {
        id: 1,
        name: 'Acme Corp',
        contact: 'John Doe',
        email: 'john@acme.com',
        phone: '555-1234',
        status: 'Active'
    },
    {
        id: 2,
        name: 'Globex',
        contact: 'Jane Smith',
        email: 'jane@globex.com',
        phone: '555-5678',
        status: 'Active'
    },
    {
        id: 3,
        name: 'Initech',
        contact: 'Michael Bolton',
        email: 'michael@initech.com',
        phone: '555-9012',
        status: 'Inactive'
    }
]);

// Location data
const locations = ref([
    {
        id: 1,
        name: 'Acme HQ',
        customer: 'Acme Corp',
        address: '123 Main St',
        city: 'New York',
        state: 'NY'
    },
    {
        id: 2,
        name: 'Acme West',
        customer: 'Acme Corp',
        address: '456 Oak Ave',
        city: 'San Francisco',
        state: 'CA'
    },
    {
        id: 3,
        name: 'Globex Main',
        customer: 'Globex',
        address: '789 Pine St',
        city: 'Chicago',
        state: 'IL'
    }
]);

// Service account data
const serviceAccounts = ref([
    {
        id: 'ACC-12345',
        customer: 'Acme Corp',
        location: 'Acme HQ',
        serviceType: 'Internet',
        vendor: 'AT&T',
        monthlyCharge: 299.99,
        status: 'Active'
    },
    {
        id: 'ACC-12346',
        customer: 'Acme Corp',
        location: 'Acme West',
        serviceType: 'Voice',
        vendor: 'Verizon',
        monthlyCharge: 199.99,
        status: 'Active'
    },
    {
        id: 'ACC-12347',
        customer: 'Globex',
        location: 'Globex Main',
        serviceType: 'Mobile',
        vendor: 'T-Mobile',
        monthlyCharge: 499.99,
        status: 'Active'
    },
    {
        id: 'ACC-12348',
        customer: 'Initech',
        location: 'Initech HQ',
        serviceType: 'Internet',
        vendor: 'Comcast',
        monthlyCharge: 249.99,
        status: 'Inactive'
    }
]);

// Filter functions for search
const filteredCustomers = computed(() => {
    if (!customerSearchQuery.value) return customers.value;
    
    const query = customerSearchQuery.value.toLowerCase();
    return customers.value.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.contact.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
    );
});

const filteredLocations = computed(() => {
    if (!locationSearchQuery.value) return locations.value;
    
    const query = locationSearchQuery.value.toLowerCase();
    return locations.value.filter(location => 
        location.name.toLowerCase().includes(query) ||
        location.customer.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query) ||
        location.city.toLowerCase().includes(query) ||
        location.state.toLowerCase().includes(query)
    );
});

const filteredServiceAccounts = computed(() => {
    if (!serviceAccountSearchQuery.value) return serviceAccounts.value;
    
    const query = serviceAccountSearchQuery.value.toLowerCase();
    return serviceAccounts.value.filter(account => 
        account.id.toLowerCase().includes(query) ||
        account.customer.toLowerCase().includes(query) ||
        account.location.toLowerCase().includes(query) ||
        account.serviceType.toLowerCase().includes(query) ||
        account.vendor.toLowerCase().includes(query)
    );
});

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

// Show action menu
const showActionMenu = (event) => {
    actionMenu.value.toggle(event);
};

// Get status tag severity
const getStatusSeverity = (status) => {
    return status === 'Active' ? 'success' : 'danger';
};

// Get service type icon
const getServiceTypeIcon = (type) => {
    switch (type) {
        case 'Internet':
            return 'pi pi-wifi';
        case 'Voice':
            return 'pi pi-volume-up';
        case 'Mobile':
            return 'pi pi-mobile';
        default:
            return 'pi pi-cog';
    }
};
</script>

<template>
    <div class="card">
        <div class="flex flex-row border-b border-surface-200 dark:border-surface-700">
            <div 
                v-for="(tab, index) in ['Customers', 'Locations', 'Service Accounts']" 
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
            <!-- Customers Tab -->
            <div v-if="activeTabIndex === 0">
                <div class="mb-5">
                    <h1 class="text-3xl font-bold mb-1">Customer Management</h1>
                </div>
                
                <!-- Action bar with search and add button -->
                <div class="flex justify-between items-center mb-6">
                    <div class="p-input-icon-left w-full md:w-30rem">
                        <i class="pi pi-search" />
                        <InputText v-model="customerSearchQuery" placeholder="Search customers..." class="w-full" />
                    </div>
                    <Button label="Add Customer" icon="pi pi-plus" />
                </div>
                
                <!-- Customers DataTable -->
                <DataTable :value="filteredCustomers" stripedRows showGridlines class="p-datatable-sm">
                    <Column field="name" header="Name"></Column>
                    <Column field="contact" header="Contact"></Column>
                    <Column field="email" header="Email"></Column>
                    <Column field="phone" header="Phone"></Column>
                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column header="Actions" style="width: 8rem">
                        <template #body>
                            <Button icon="pi pi-ellipsis-h" text rounded aria-label="Actions" @click="showActionMenu" />
                        </template>
                    </Column>
                </DataTable>
            </div>
            
            <!-- Locations Tab -->
            <div v-if="activeTabIndex === 1">
                <div class="mb-5">
                    <h1 class="text-3xl font-bold mb-1">Location Management</h1>
                </div>
                
                <!-- Action bar with search and add button -->
                <div class="flex justify-between items-center mb-6">
                    <div class="p-input-icon-left w-full md:w-30rem">
                        <i class="pi pi-search" />
                        <InputText v-model="locationSearchQuery" placeholder="Search locations..." class="w-full" />
                    </div>
                    <Button label="Add Location" icon="pi pi-plus" />
                </div>
                
                <!-- Locations DataTable -->
                <DataTable :value="filteredLocations" stripedRows showGridlines class="p-datatable-sm">
                    <Column field="name" header="Name"></Column>
                    <Column field="customer" header="Customer"></Column>
                    <Column field="address" header="Address"></Column>
                    <Column field="city" header="City"></Column>
                    <Column field="state" header="State"></Column>
                    <Column header="Actions" style="width: 8rem">
                        <template #body>
                            <Button icon="pi pi-ellipsis-h" text rounded aria-label="Actions" @click="showActionMenu" />
                        </template>
                    </Column>
                </DataTable>
            </div>
            
            <!-- Service Accounts Tab -->
            <div v-if="activeTabIndex === 2">
                <div class="mb-5">
                    <h1 class="text-3xl font-bold mb-1">Service Account Management</h1>
                </div>
                
                <!-- Action bar with search and add button -->
                <div class="flex justify-between items-center mb-6">
                    <div class="p-input-icon-left w-full md:w-30rem">
                        <i class="pi pi-search" />
                        <InputText v-model="serviceAccountSearchQuery" placeholder="Search service accounts..." class="w-full" />
                    </div>
                    <Button label="Add Service Account" icon="pi pi-plus" />
                </div>
                
                <!-- Service Accounts DataTable -->
                <DataTable :value="filteredServiceAccounts" stripedRows showGridlines class="p-datatable-sm">
                    <Column field="id" header="Account Number"></Column>
                    <Column field="customer" header="Customer">
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i class="pi pi-building mr-2"></i>
                                <span>{{ data.customer }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="location" header="Location"></Column>
                    <Column field="serviceType" header="Service Type">
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i :class="getServiceTypeIcon(data.serviceType)" class="mr-2"></i>
                                <span>{{ data.serviceType }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="vendor" header="Vendor"></Column>
                    <Column field="monthlyCharge" header="Monthly Charge">
                        <template #body="{ data }">
                            {{ formatCurrency(data.monthlyCharge) }}
                        </template>
                    </Column>
                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column header="Actions" style="width: 8rem">
                        <template #body>
                            <Button icon="pi pi-ellipsis-h" text rounded aria-label="Actions" @click="showActionMenu" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        
        <!-- Popup Menu -->
        <Menu ref="actionMenu" :model="actionMenuItems" :popup="true" />
    </div>
</template>

<style scoped>
.p-datatable-sm .p-datatable-tbody > tr > td {
    padding: 0.5rem 1rem;
}

:deep(.p-tag) {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
}
</style> 