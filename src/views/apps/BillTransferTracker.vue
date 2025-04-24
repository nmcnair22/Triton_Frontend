<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

// Active tab
const activeTabIndex = ref(0);

// Tab items
const tabs = [
    'Account Information',
    'Service Information',
    'Payment Information',
    'Portal Information',
    'Other'
];

// Dropdown options
const customerOptions = ref([]);
const locationOptions = ref([]);
const providerOptions = ref([]);
const accountOptions = ref([]);

// Selected values
const selectedCustomer = ref(null);
const selectedLocation = ref(null);
const selectedProvider = ref(null);
const selectedAccount = ref(null);
</script>

<template>
    <div>
        <!-- Filter section -->
        <div class="card mb-4">
            <div class="flex flex-wrap gap-4">
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Customer</label>
                    <Dropdown placeholder="Select customer" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Location</label>
                    <Dropdown placeholder="Select customer first" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Provider</label>
                    <Dropdown placeholder="Select provider" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Account</label>
                    <Dropdown placeholder="Select account" class="w-full" />
                </div>
            </div>
        </div>

        <!-- Main content grid -->
        <div class="grid grid-cols-12">
            <!-- Left Column (Main Content) -->
            <div class="col-span-12 lg:col-span-9">
                <div class="card p-0">
                    <!-- Header -->
                    <div class="flex align-items-center p-4 border-b border-surface-200 dark:border-surface-700">
                        <div class="flex-grow-1">
                            <h2 class="text-xl font-medium m-0">Account Details</h2>
                            <p class="text-surface-600 dark:text-surface-300 m-0">No account selected</p>
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0 ml-auto">
                            <Button label="Log Call" icon="pi pi-phone" :pt="{ root: { class: 'bg-blue-500 border-blue-500' } }" />
                            <Button label="Next Account" icon="pi pi-arrow-right" iconPos="right" :pt="{ root: { class: 'bg-blue-500 border-blue-500' } }" />
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="border-b border-surface-200 dark:border-surface-700">
                        <ul class="flex list-none p-0 m-0">
                            <li v-for="(tab, i) in tabs" :key="i">
                                <a @click="activeTabIndex = i" 
                                   class="cursor-pointer no-underline px-4 py-3 inline-block text-surface-600 dark:text-surface-300"
                                   :class="{ 'border-b-2 border-primary text-primary font-medium': activeTabIndex === i }">
                                    {{ tab }}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div class="p-4">
                        <!-- Account Info Tab Content -->
                        <div v-if="activeTabIndex === 0">
                            <div class="grid grid-cols-12 gap-x-4">
                                <!-- Account Details Column -->
                                <div class="col-span-12 md:col-span-6">
                                    <h3 class="text-lg font-medium mb-3">Account Details</h3>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Account Number</label>
                                        <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Customer Name</label>
                                        <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Location Name</label>
                                        <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Vendor Name</label>
                                        <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                </div>
                                
                                <!-- Location Information Column -->
                                <div class="col-span-12 md:col-span-6">
                                    <h3 class="text-lg font-medium mb-3">Location Information</h3>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Location Address 
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2 text-red-500">Currently Billed To</label>
                                        <div class="flex items-center gap-2">
                                            <InputText value="EarthClassMail" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Current Balance</label>
                                        <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Monthly Price</label>
                                        <InputText value="Not specified" readonly class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Record Finalized Button -->
                            <div class="flex justify-end mt-3">
                                <Button label="Record Finalized" icon="pi pi-check" :pt="{ root: { class: 'bg-green-500 border-green-500' } }" />
                            </div>
                        </div>
                        
                        <!-- Placeholder for other tabs -->
                        <div v-else class="py-5 text-center text-surface-600 dark:text-surface-300">
                            This tab is not yet implemented
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Sidebar (Account Status) -->
            <div class="col-span-12 lg:col-span-3">
                <div class="card bg-surface-50 dark:bg-surface-800 border-0 shadow-none">
                    <h3 class="text-lg font-medium mb-4">Account Status</h3>
                    
                    <div class="status-item">
                        <i class="pi pi-phone icon"></i>
                        <div>
                            <div class="label">Total Calls</div>
                            <div class="value">0</div>
                        </div>
                    </div>
                    
                    <div class="status-item">
                        <i class="pi pi-map-marker icon"></i>
                        <div>
                            <div class="label">Billing Address</div>
                            <div class="sub-value">Still using</div>
                            <div class="sub-value">EarthClassMail</div>
                        </div>
                    </div>
                    
                    <div class="status-item">
                        <i class="pi pi-check-circle icon"></i>
                        <div>
                            <div class="label">Fields Verified</div>
                            <div class="sub-value">1 of 22 (5%)</div>
                        </div>
                    </div>
                    
                    <div class="status-item yellow">
                        <i class="pi pi-exclamation-triangle icon"></i>
                        <div>
                            <div class="label">Record Status</div>
                            <div class="sub-value">Incomplete</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    @apply bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700;
    padding: 1.5rem; /* Default padding */
    margin-bottom: 1rem;
}

.card.p-0 {
    padding: 0; /* Remove padding for card containing tabs */
    @apply border-surface-200 dark:border-surface-700;
}

.p-4 {
    padding: 1.5rem; /* Consistent padding for inner content */
}

.field {
    margin-bottom: 1rem;
}

/* Sidebar card specific style - REMOVED due to circular dependency error */
/*
.card.bg-surface-50 {
     @apply bg-surface-50 dark:bg-surface-800; 
}
*/

.status-item {
    /* Use bg-white for the items *inside* the sidebar */
    @apply flex items-center bg-white dark:bg-surface-900 rounded-lg p-3 mb-3 shadow-sm border border-surface-200 dark:border-surface-700;
}

.status-item .icon {
    @apply flex-shrink-0 text-xl mr-3 text-primary;
}

.status-item .label {
    @apply text-sm font-medium text-surface-700 dark:text-surface-200 mb-1;
}

.status-item .value {
    @apply text-xl font-bold text-surface-900 dark:text-surface-0;
}

.status-item .sub-value {
    @apply text-sm text-surface-600 dark:text-surface-300;
}

.status-item.yellow .icon {
    @apply text-yellow-500;
}

.status-item.yellow .sub-value {
    @apply text-yellow-500 font-medium;
}


/* Specific overrides for exact mockup matching */
:deep(.p-inputtext.bg-surface-100) {
    background-color: #f8f9fa !important; /* Match light gray input background */
}

:deep(.dark .p-inputtext.dark\:bg-surface-700) {
    background-color: #1f2937 !important; /* Adjust dark mode input background if needed */
}

/* Styling for the tabs to match mockup */
:deep(.border-b-2.border-primary) {
    border-bottom-width: 2px !important;
}

/* Ensure flex handles wrapping correctly for filters */
.flex-wrap {
    flex-wrap: wrap;
}

.min-w-\[200px\] {
    min-width: 200px;
}

</style> 