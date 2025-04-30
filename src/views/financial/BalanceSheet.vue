<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'primevue/chart';

// Component data
const balanceSheetDate = ref(new Date('2023-03-31'));
const comparisonMode = ref('none');
const isRefreshing = ref(false);

// Filter selections
const filters = ref({
    assets: {
        currentAssets: true,
        cashEquivalents: true,
        accountsReceivable: true,
        inventory: true,
        prepaidExpenses: true,
        fixedAssets: true,
        propertyEquipment: true,
        intangibleAssets: true
    }
});

// Balance sheet data
const balanceSheet = ref({
    asOf: '3/31/2023',
    assets: {
        total: '$4M',
        currentAssets: {
            total: '$2M',
            items: [
                { name: 'Cash & Equivalents', value: '$850K' },
                { name: 'Accounts Receivable', value: '$450K' },
                { name: 'Inventory', value: '$550K' },
                { name: 'Prepaid Expenses', value: '$150K' }
            ]
        },
        fixedAssets: {
            total: '$2M',
            items: [
                { name: 'Property & Equipment', value: '$1.3M' },
                { name: 'Intangible Assets', value: '$700K' }
            ]
        }
    },
    liabilitiesEquity: {
        total: '$4M',
        items: [
            { name: 'Current Liabilities', value: '$1.2M' },
            { name: 'Long-term Debt', value: '$800K' },
            { name: 'Equity', value: '$2M' }
        ]
    },
    balanceCheck: '$0'
});

// Chart data for asset breakdown
const pieChartData = ref({
    labels: [
        'Cash & Equivalents', 
        'Accounts Receivable', 
        'Inventory', 
        'Prepaid Expenses',
        'Property & Equipment',
        'Intangible Assets'
    ],
    datasets: [
        {
            data: [850, 450, 550, 150, 1300, 700],
            backgroundColor: [
                '#3B82F6', // Blue
                '#6366F1', // Indigo
                '#8B5CF6', // Violet
                '#EC4899', // Pink
                '#10B981', // Green
                '#3B82F6'  // Blue
            ]
        }
    ]
});

// Chart options
const chartOptions = ref({
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true
            }
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    return `${context.label}: $${context.raw}K`;
                }
            }
        }
    },
    responsive: true,
    maintainAspectRatio: false
});

// Methods
const refresh = () => {
    isRefreshing.value = true;
    
    // Simulate API call
    setTimeout(() => {
        isRefreshing.value = false;
    }, 1000);
};

const toggleAssetType = (type) => {
    filters.value.assets[type] = !filters.value.assets[type];
};

const toggleAllAssets = () => {
    const newValue = !Object.values(filters.value.assets).every(v => v);
    
    Object.keys(filters.value.assets).forEach(key => {
        filters.value.assets[key] = newValue;
    });
};

const exportReport = () => {
    // Implement export functionality
    console.log('Exporting balance sheet');
};

const printReport = () => {
    // Implement print functionality
    window.print();
};

const shareReport = () => {
    // Implement share functionality
    console.log('Sharing balance sheet');
};
</script>

<template>
    <div class="card">
        <div class="flex flex-column gap-4">
            <!-- Header -->
            <div>
                <h1 class="text-3xl font-bold mb-2">Balance Sheet</h1>
                <p class="text-color-secondary">View assets, liabilities, and equity at a specific point in time.</p>
            </div>

            <div class="grid">
                <!-- Left Sidebar for Filters -->
                <div class="col-12 md:col-3">
                    <div class="flex flex-column gap-4">
                        <!-- Date Selection -->
                        <div class="p-card">
                            <div class="p-card-body">
                                <h3 class="text-xl font-semibold mb-4">Date Selection</h3>
                                
                                <div class="mb-3">
                                    <label for="balanceDate" class="block text-sm font-medium mb-2">Balance Sheet Date</label>
                                    <Calendar 
                                        id="balanceDate" 
                                        v-model="balanceSheetDate" 
                                        :showIcon="true" 
                                        dateFormat="M d, yy" 
                                        class="w-full"
                                    />
                                </div>
                                
                                <div class="mt-4">
                                    <label for="comparisonMode" class="block text-sm font-medium mb-2">Compare With</label>
                                    <Dropdown 
                                        id="comparisonMode" 
                                        v-model="comparisonMode" 
                                        :options="[
                                            { label: 'No Comparison', value: 'none' },
                                            { label: 'Previous Month', value: 'month' },
                                            { label: 'Previous Quarter', value: 'quarter' },
                                            { label: 'Previous Year', value: 'year' }
                                        ]" 
                                        optionLabel="label" 
                                        optionValue="value"
                                        placeholder="Select a comparison"
                                        class="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <!-- Filters -->
                        <div class="p-card">
                            <div class="p-card-body">
                                <h3 class="text-xl font-semibold mb-4">Filters</h3>
                                <p class="text-sm text-color-secondary mb-3">Select which items to include in the report</p>
                                
                                <div class="mb-3">
                                    <h4 class="text-lg font-medium mb-2">Assets</h4>
                                    
                                    <div class="mb-2">
                                        <Checkbox 
                                            id="currentAssets" 
                                            v-model="filters.assets.currentAssets" 
                                            :binary="true" 
                                            @change="toggleAssetType('currentAssets')"
                                        />
                                        <label for="currentAssets" class="ml-2">Current Assets</label>
                                    </div>
                                    
                                    <div class="ml-4 mb-2">
                                        <Checkbox 
                                            id="cashEquivalents" 
                                            v-model="filters.assets.cashEquivalents" 
                                            :binary="true"
                                        />
                                        <label for="cashEquivalents" class="ml-2">Cash & Equivalents</label>
                                    </div>
                                    
                                    <div class="ml-4 mb-2">
                                        <Checkbox 
                                            id="accountsReceivable" 
                                            v-model="filters.assets.accountsReceivable" 
                                            :binary="true"
                                        />
                                        <label for="accountsReceivable" class="ml-2">Accounts Receivable</label>
                                    </div>
                                    
                                    <div class="ml-4 mb-2">
                                        <Checkbox 
                                            id="inventory" 
                                            v-model="filters.assets.inventory" 
                                            :binary="true"
                                        />
                                        <label for="inventory" class="ml-2">Inventory</label>
                                    </div>
                                    
                                    <div class="ml-4 mb-4">
                                        <Checkbox 
                                            id="prepaidExpenses" 
                                            v-model="filters.assets.prepaidExpenses" 
                                            :binary="true"
                                        />
                                        <label for="prepaidExpenses" class="ml-2">Prepaid Expenses</label>
                                    </div>
                                    
                                    <div class="mb-2">
                                        <Checkbox 
                                            id="fixedAssets" 
                                            v-model="filters.assets.fixedAssets" 
                                            :binary="true"
                                            @change="toggleAssetType('fixedAssets')"
                                        />
                                        <label for="fixedAssets" class="ml-2">Fixed Assets</label>
                                    </div>
                                    
                                    <div class="ml-4 mb-2">
                                        <Checkbox 
                                            id="propertyEquipment" 
                                            v-model="filters.assets.propertyEquipment" 
                                            :binary="true"
                                        />
                                        <label for="propertyEquipment" class="ml-2">Property & Equipment</label>
                                    </div>
                                    
                                    <div class="ml-4 mb-2">
                                        <Checkbox 
                                            id="intangibleAssets" 
                                            v-model="filters.assets.intangibleAssets" 
                                            :binary="true"
                                        />
                                        <label for="intangibleAssets" class="ml-2">Intangible Assets</label>
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
                                    <h2 class="text-2xl font-bold mb-1">Balance Sheet</h2>
                                    <p class="text-color-secondary">As of {{ balanceSheet.asOf }}</p>
                                </div>
                                <Button 
                                    icon="pi pi-refresh" 
                                    @click="refresh" 
                                    :loading="isRefreshing"
                                    aria-label="Refresh" 
                                />
                            </div>
                            
                            <!-- Assets Section -->
                            <div class="mb-4">
                                <div class="flex justify-content-between align-items-center py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                    <h3 class="text-xl font-semibold m-0 flex align-items-center">
                                        <i class="pi pi-chevron-down mr-2"></i>
                                        Assets
                                    </h3>
                                    <span class="font-semibold">{{ balanceSheet.assets.total }}</span>
                                </div>
                                
                                <!-- Current Assets -->
                                <div class="ml-4 mt-3">
                                    <div class="flex justify-content-between align-items-center py-2">
                                        <h4 class="text-lg font-medium m-0">Current Assets</h4>
                                        <span class="font-medium">{{ balanceSheet.assets.currentAssets.total }}</span>
                                    </div>
                                    
                                    <div v-for="(item, index) in balanceSheet.assets.currentAssets.items" :key="index" class="ml-4 py-2 flex justify-content-between">
                                        <span>{{ item.name }}</span>
                                        <span>{{ item.value }}</span>
                                    </div>
                                </div>
                                
                                <!-- Fixed Assets -->
                                <div class="ml-4 mt-3">
                                    <div class="flex justify-content-between align-items-center py-2">
                                        <h4 class="text-lg font-medium m-0">Fixed Assets</h4>
                                        <span class="font-medium">{{ balanceSheet.assets.fixedAssets.total }}</span>
                                    </div>
                                    
                                    <div v-for="(item, index) in balanceSheet.assets.fixedAssets.items" :key="index" class="ml-4 py-2 flex justify-content-between">
                                        <span>{{ item.name }}</span>
                                        <span>{{ item.value }}</span>
                                    </div>
                                </div>
                                
                                <!-- Total Assets -->
                                <div class="flex justify-content-between align-items-center py-3 mt-3 border-top-1 border-bottom-1 border-gray-200 dark:border-gray-800 font-semibold">
                                    <span>Total Assets</span>
                                    <span>{{ balanceSheet.assets.total }}</span>
                                </div>
                            </div>
                            
                            <!-- Liabilities & Equity Section -->
                            <div class="mb-4">
                                <div class="flex justify-content-between align-items-center py-3 border-bottom-1 border-gray-200 dark:border-gray-800">
                                    <h3 class="text-xl font-semibold m-0 flex align-items-center">
                                        <i class="pi pi-chevron-down mr-2"></i>
                                        Total Liabilities & Equity
                                    </h3>
                                    <span class="font-semibold">{{ balanceSheet.liabilitiesEquity.total }}</span>
                                </div>
                                
                                <div v-for="(item, index) in balanceSheet.liabilitiesEquity.items" :key="index" class="ml-4 py-2 flex justify-content-between">
                                    <span>{{ item.name }}</span>
                                    <span>{{ item.value }}</span>
                                </div>
                                
                                <!-- Balance Check -->
                                <div class="flex justify-content-between align-items-center py-3 mt-3 border-top-1 border-gray-200 dark:border-gray-800">
                                    <span>Balance Check</span>
                                    <span class="text-green-500 font-medium">{{ balanceSheet.balanceCheck }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Visualization -->
                    <div class="p-card mt-4">
                        <div class="p-card-body">
                            <h3 class="text-xl font-semibold mb-3">Visualization</h3>
                            <p class="text-color-secondary mb-4">Visual breakdown of assets, liabilities, and equity</p>
                            
                            <div class="flex justify-content-center" style="height: 350px">
                                <Chart type="pie" :data="pieChartData" :options="chartOptions" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template> 