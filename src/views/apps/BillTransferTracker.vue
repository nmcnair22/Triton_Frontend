<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import { useCustomerStore } from '@/stores/customerStore';
import { useLocationStore } from '@/stores/locationStore';
import { useTemAccountStore } from '@/stores/temAccountStore';

// Initialize the stores
const customerStore = useCustomerStore();
const locationStore = useLocationStore();
const temAccountStore = useTemAccountStore();

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

// Dropdown options - Customers, locations, and accounts will come from the store
const providerOptions = ref([]);

// Selected values
const selectedCustomer = ref(null);
const selectedLocation = ref(null);
const selectedProvider = ref(null);
const selectedAccount = ref(null);

// Selected account data
const selectedAccountData = ref(null);

// Account Information form fields
const accountNumber = ref('Not specified');
const customerName = ref('Not specified');
const locationName = ref('Not specified');
const vendorName = ref('Not specified');
const locationAddress = ref('Not specified');
const billedTo = ref('EarthClassMail');
const currentBalance = ref('Not specified');
const monthlyPrice = ref('Not specified');

// Service Information form fields
const serviceType = ref('Not specified');
const connectionType = ref('Not specified');
const downloadSpeed = ref('Not specified');
const uploadSpeed = ref('Not specified');
const contractStatus = ref('Not specified');
const contractEndDate = ref('Not specified');

// Payment Information form fields
const paymentMethod = ref('Not specified');
const billMethod = ref('Not specified');

// Portal Information form fields
const portalAvailable = ref('Not specified');
const portalUrl = ref('Not specified');
const username = ref('Not specified');
const password = ref('Not specified');

// Portal access tips
const portalAccessTips = [
    'Always verify portal credentials with the account owner',
    'Document any special login requirements or security questions',
    'Check if multi-factor authentication is enabled',
    'Verify if there are different portals for billing vs. service management'
];

// After other ref declarations in the <script setup> section
const accountProcessingStatus = ref('Not Started'); // Possible values: 'Not Started', 'Started', 'Completed'

// Format address from components
function formatAddress(address1, address2, city, state, zip) {
    let formattedAddress = '';
    
    if (address1) {
        formattedAddress += address1;
    }
    
    if (address2) {
        formattedAddress += formattedAddress ? ', ' + address2 : address2;
    }
    
    let cityStateZip = '';
    if (city) cityStateZip += city;
    if (state) cityStateZip += cityStateZip ? ', ' + state : state;
    if (zip) cityStateZip += cityStateZip ? ' ' + zip : zip;
    
    if (cityStateZip) {
        formattedAddress += formattedAddress ? ', ' + cityStateZip : cityStateZip;
    }
    
    return formattedAddress || 'Not specified';
}

// Format currency values
function formatCurrency(value) {
    if (!value || isNaN(parseFloat(value))) return 'Not specified';
    return '$' + parseFloat(value).toFixed(2);
}

// Computed properties for store state
const customers = computed(() => customerStore.customers);
const locations = computed(() => locationStore.locations);
const accounts = computed(() => temAccountStore.accounts);
const isLoadingCustomers = computed(() => customerStore.loading);
const isLoadingLocations = computed(() => locationStore.loading);
const isLoadingAccounts = computed(() => temAccountStore.loading);

// Watch for changes in the selected customer to load locations
watch(selectedCustomer, async (newCustomerId) => {
    if (newCustomerId) {
        // Reset the selected location and account when customer changes
        selectedLocation.value = null;
        selectedAccount.value = null;
        selectedAccountData.value = null;
        
        // Reset accounts
        temAccountStore.resetState();
        
        // Reset form fields to default values
        resetFormFields();
        
        // Fetch locations for the selected customer
        await locationStore.fetchLocations(newCustomerId, {
            archived: false, // Will be converted to "0" in the store
            status: 'Active'
        });
    } else {
        // Reset locations and accounts when no customer is selected
        locationStore.resetState();
        temAccountStore.resetState();
        selectedAccountData.value = null;
        resetFormFields();
    }
});

// Watch for changes in the selected location to load accounts
watch(selectedLocation, async (newLocationId) => {
    if (newLocationId) {
        // Reset the selected account when location changes
        selectedAccount.value = null;
        selectedAccountData.value = null;
        
        // Reset form fields to default values
        resetFormFields();
        
        // Fetch accounts for the selected location
        await temAccountStore.fetchAccountsByLocation(newLocationId);
    } else {
        // Reset accounts when no location is selected
        temAccountStore.resetState();
        selectedAccountData.value = null;
        resetFormFields();
    }
});

// Watch for changes in the selected account to populate form fields
watch(selectedAccount, (newAccountId) => {
    console.log('Account selection changed to:', newAccountId);
    console.log('Available accounts:', accounts.value);
    
    if (newAccountId) {
        // Find the selected account data from the store's accounts array
        const account = accounts.value.find(acc => acc.id === newAccountId);
        
        if (account) {
            selectedAccountData.value = account;
            console.log('Selected account data in detail:', JSON.stringify(account, null, 2)); // More detailed debug log
            populateFormFields(account);
        } else {
            selectedAccountData.value = null;
            resetFormFields();
            console.error('Account not found in accounts list:', newAccountId, accounts.value);
        }
    } else {
        selectedAccountData.value = null;
        resetFormFields();
    }
});

// Populate form fields with account data
function populateFormFields(account) {
    console.log('Populating form fields with:', account); // Debug log
    
    // Account Information Tab - Use exact field names as they appear in the debug logs
    accountNumber.value = account.accountNumber || 'Not specified';
    customerName.value = account.customerName || 'Not specified';
    locationName.value = account.locationName || 'Not specified';
    vendorName.value = account.vendorName || 'Not specified';
    
    // Format and set the location address - handling NULL values from database
    let address2Value = account.address2;
    if (address2Value === 'NULL' || address2Value === null) {
        address2Value = '';
    }
    
    locationAddress.value = formatAddress(
        account.address1, 
        address2Value, 
        account.addressCity, 
        account.addressState, 
        account.addressZip
    );
    
    // Set billing and financial information
    billedTo.value = account.billType || 'EarthClassMail';
    
    // Use vendorBalance for Current Balance
    currentBalance.value = formatCurrency(account.vendorBalance);
    
    // Use expectedAmount for Monthly Price
    monthlyPrice.value = formatCurrency(account.expectedAmount);
    
    // Service Information Tab
    // For service type, prefer to show "Wired Internet" for Comcast
    serviceType.value = account.providerName === 'Comcast' ? 'Wired Internet' : (account.providerName ? `${account.providerName} Service` : 'Not specified');
    connectionType.value = 'Not specified'; // Not in the data
    downloadSpeed.value = 'Not specified'; // Not in the data
    uploadSpeed.value = 'Not specified'; // Not in the data
    contractStatus.value = account.status === 1 || account.status === '1' ? 'Active' : 'Inactive';
    contractEndDate.value = 'Not specified'; // Not in the data
    
    // Payment Information Tab
    paymentMethod.value = account.payType || 'Not specified';
    billMethod.value = account.billType || 'Not specified';
    
    // Portal Information Tab
    portalAvailable.value = account.url ? 'Yes' : 'No';
    portalUrl.value = account.url || 'Not specified';
    username.value = account.username || 'Not specified';
    
    // For password, don't show dots - use actual value or "Not specified"
    password.value = account.password || 'Not specified';
}

// Reset form fields to default values
function resetFormFields() {
    // Account Information Tab
    accountNumber.value = 'Not specified';
    customerName.value = 'Not specified';
    locationName.value = 'Not specified';
    vendorName.value = 'Not specified';
    locationAddress.value = 'Not specified';
    billedTo.value = 'EarthClassMail';
    currentBalance.value = 'Not specified';
    monthlyPrice.value = 'Not specified';
    
    // Service Information Tab
    serviceType.value = 'Not specified';
    connectionType.value = 'Not specified';
    downloadSpeed.value = 'Not specified';
    uploadSpeed.value = 'Not specified';
    contractStatus.value = 'Not specified';
    contractEndDate.value = 'Not specified';
    
    // Payment Information Tab
    paymentMethod.value = 'Not specified';
    billMethod.value = 'Not specified';
    
    // Portal Information Tab
    portalAvailable.value = 'Not specified';
    portalUrl.value = 'Not specified';
    username.value = 'Not specified';
    password.value = 'Not specified';
}

// Fetch active customers on component mount
onMounted(() => {
    customerStore.fetchActiveCustomers();
});

// Add methods to handle button clicks
function handleStartClick() {
    accountProcessingStatus.value = 'Started';
    // Additional logic for starting the processing can be added here
}

function handleMarkCompleteClick() {
    accountProcessingStatus.value = 'Completed';
    // Additional logic for completing the processing can be added here
}
</script>

<template>
    <div>
        <!-- Filter section -->
        <div class="card mb-4">
            <div class="flex flex-wrap gap-4">
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Customer</label>
                    <Select 
                        v-model="selectedCustomer"
                        :options="customers"
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Select customer" 
                        class="w-full" 
                        filter 
                        :loading="isLoadingCustomers"
                        :disabled="isLoadingCustomers"
                    />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Location</label>
                    <Select 
                        v-model="selectedLocation"
                        :options="locations"
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Select customer first" 
                        class="w-full" 
                        filter
                        :loading="isLoadingLocations"
                        :disabled="!selectedCustomer || isLoadingLocations"
                    />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Provider</label>
                    <Select placeholder="Select provider" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block mb-2">Account</label>
                    <Select 
                        v-model="selectedAccount"
                        :options="accounts"
                        optionLabel="accountNumber" 
                        optionValue="id" 
                        placeholder="Select location first" 
                        class="w-full" 
                        filter
                        :loading="isLoadingAccounts"
                        :disabled="!selectedLocation || isLoadingAccounts"
                    />
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
                            <p class="text-surface-600 dark:text-surface-300 m-0">
                                {{ selectedAccountData ? selectedAccountData.accountNumber : 'No account selected' }}
                            </p>
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0 ml-auto">
                            <Button label="Start" icon="pi pi-play" severity="success" @click="handleStartClick" />
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
                                        <InputText v-model="accountNumber" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Customer Name</label>
                                        <InputText v-model="customerName" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Location Name</label>
                                        <InputText v-model="locationName" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Vendor Name</label>
                                        <InputText v-model="vendorName" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
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
                                            <InputText v-model="locationAddress" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2 text-red-500">Currently Billed To</label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="billedTo" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Switch" severity="warning" class="p-button-warning" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Current Balance</label>
                                        <InputText v-model="currentBalance" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Monthly Price</label>
                                        <InputText v-model="monthlyPrice" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Record Finalized Button -->
                            <div class="flex justify-end mt-3">
                                <Button label="Mark Complete" icon="pi pi-check" severity="success" @click="handleMarkCompleteClick" />
                            </div>
                        </div>
                        
                        <!-- Service Information Tab Content -->
                        <div v-else-if="activeTabIndex === 1">
                            <!-- Service Details Section -->
                            <div class="mb-6">
                                <h3 class="text-lg font-medium mb-4">Service Details</h3>
                                <div class="field mb-4">
                                    <label class="block mb-2">
                                        Service Type
                                        <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <InputText v-model="serviceType" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                        <Button label="Validate" severity="info" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Connection Details Section -->
                            <div class="mb-6">
                                <h3 class="text-lg font-medium mb-4">Connection Details</h3>
                                
                                <div class="field mb-4">
                                    <label class="block mb-2">
                                        Type of Connection
                                        <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <InputText v-model="connectionType" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                        <Button label="Validate" severity="info" />
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div class="field">
                                        <label class="block mb-2">
                                            Download Speed (Mbps)
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="downloadSpeed" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                    
                                    <div class="field">
                                        <label class="block mb-2">
                                            Upload Speed (Mbps)
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="uploadSpeed" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contract Information Section -->
                            <div class="mb-6">
                                <h3 class="text-lg font-medium mb-4">Contract Information</h3>
                                
                                <div class="field mb-4">
                                    <label class="block mb-2">
                                        Contract Status
                                        <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <InputText v-model="contractStatus" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                        <Button label="Validate" severity="info" />
                                    </div>
                                </div>
                                
                                <div class="field mb-4">
                                    <label class="block mb-2">
                                        Contract End Date
                                        <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <InputText v-model="contractEndDate" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                        <Button label="Validate" severity="info" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Record Finalized Button -->
                            <div class="flex justify-end mt-3">
                                <Button label="Mark Complete" icon="pi pi-check" severity="success" @click="handleMarkCompleteClick" />
                            </div>
                        </div>
                        
                        <!-- Payment Information Tab Content -->
                        <div v-else-if="activeTabIndex === 2">
                            <h3 class="text-xl font-medium mb-4">Payment Information</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Payment Method Section -->
                                <div>
                                    <h4 class="text-lg font-medium mb-4">Payment Method</h4>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Payment Method
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="paymentMethod" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Bill Method
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="billMethod" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Payment Details Section -->
                                <div>
                                    <h4 class="text-lg font-medium mb-4">Payment Details</h4>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Current Balance</label>
                                        <InputText v-model="currentBalance" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">Monthly Price</label>
                                        <InputText v-model="monthlyPrice" readonly 
                                            class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Record Finalized Button -->
                            <div class="flex justify-end mt-6">
                                <Button label="Mark Complete" icon="pi pi-check" severity="success" @click="handleMarkCompleteClick" />
                            </div>
                        </div>
                        
                        <!-- Portal Information Tab Content -->
                        <div v-else-if="activeTabIndex === 3">
                            <h3 class="text-xl font-medium mb-4">Portal Information</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <!-- Left Column -->
                                <div>
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Portal Available
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="portalAvailable" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Username
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="username" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Right Column -->
                                <div>
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Portal URL
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="portalUrl" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                    
                                    <div class="field mb-4">
                                        <label class="block mb-2">
                                            Password
                                            <i class="pi pi-info-circle text-xs ml-1 text-surface-400 dark:text-surface-500"></i>
                                        </label>
                                        <div class="flex items-center gap-2">
                                            <InputText v-model="password" readonly 
                                                class="w-full bg-surface-100 dark:bg-surface-700 border-surface-300 dark:border-surface-600" />
                                            <Button label="Validate" severity="info" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Portal Access Tips Section -->
                            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                                <h4 class="text-blue-800 dark:text-blue-400 font-medium mb-3">Portal Access Tips</h4>
                                <ul class="list-disc pl-5 m-0 text-blue-700 dark:text-blue-300">
                                    <li v-for="(tip, index) in portalAccessTips" :key="index" class="mb-2">
                                        {{ tip }}
                                    </li>
                                </ul>
                            </div>
                            
                            <!-- Record Finalized Button -->
                            <div class="flex justify-end mt-6">
                                <Button label="Mark Complete" icon="pi pi-check" severity="success" @click="handleMarkCompleteClick" />
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
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium">Account Status</h3>
                        <span :class="{
                            'bg-primary-100 text-primary-700': accountProcessingStatus === 'Not Started',
                            'bg-blue-100 text-blue-700': accountProcessingStatus === 'Started',
                            'bg-green-100 text-green-700': accountProcessingStatus === 'Completed'
                        }" class="px-2 py-1 rounded-md flex items-center text-sm font-medium">
                            <i :class="{
                                'pi pi-clock': accountProcessingStatus === 'Not Started',
                                'pi pi-sync': accountProcessingStatus === 'Started',
                                'pi pi-check-circle': accountProcessingStatus === 'Completed'
                            }" class="mr-1"></i>
                            {{ accountProcessingStatus }}
                        </span>
                    </div>
                    
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
                            <div class="sub-value">{{ billedTo }}</div>
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