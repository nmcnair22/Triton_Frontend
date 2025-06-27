<template>
    <div class="estimates-page">
        <!-- Page Header -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
                    Estimations
                </h1>
                <p class="text-surface-600 dark:text-surface-400">
                    Manage project estimates, quotes, and proposals
                </p>
            </div>
            <div class="flex gap-2">
                <Button 
                    icon="pi pi-plus" 
                    label="New Estimate" 
                    severity="primary"
                    @click="activeTab = 'builder'"
                />
                <Button 
                    icon="pi pi-calendar" 
                    label="Schedule Site Survey" 
                    severity="info"
                    outlined
                />
            </div>
        </div>

        <!-- Tab Navigation -->
        <TabMenu 
            v-model:activeIndex="activeTabIndex" 
            :model="tabItems" 
            class="mb-6"
        />

        <!-- Tab Content -->
        <div class="tab-content">
            <!-- Dashboard Tab -->
            <div v-if="activeTab === 'dashboard'" class="dashboard-content">
                <!-- Metrics Overview -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Open Estimates Card -->
                    <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <i class="pi pi-file text-2xl text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">12</h3>
                                <p class="text-surface-600 dark:text-surface-400 text-sm">Open Estimates</p>
                            </div>
                        </div>
                    </div>

                    <!-- Site Surveys Scheduled Card -->
                    <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                                <i class="pi pi-calendar text-2xl text-teal-600 dark:text-teal-400"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">5</h3>
                                <p class="text-surface-600 dark:text-surface-400 text-sm">Site Surveys Scheduled</p>
                            </div>
                        </div>
                    </div>

                    <!-- Awaiting Approval Card -->
                    <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <i class="pi pi-clock text-2xl text-orange-600 dark:text-orange-400"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">3</h3>
                                <p class="text-surface-600 dark:text-surface-400 text-sm">Awaiting Approval</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Estimates Table -->
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Recent Estimates</h2>
                        <Button 
                            icon="pi pi-refresh" 
                            text 
                            rounded
                            @click="refreshEstimates"
                        />
                    </div>

                    <DataTable 
                        :value="recentEstimates" 
                        :paginator="true" 
                        :rows="10"
                        :loading="isLoading"
                        dataKey="id"
                        :rowHover="true"
                        stripedRows
                        class="p-datatable-sm"
                    >
                        <Column field="id" header="Estimate ID" sortable style="width: 12%">
                            <template #body="slotProps">
                                <span class="font-medium text-primary">{{ slotProps.data.id }}</span>
                            </template>
                        </Column>
                        
                        <Column field="client" header="Client" sortable style="width: 20%">
                            <template #body="slotProps">
                                <div class="font-medium">{{ slotProps.data.client }}</div>
                            </template>
                        </Column>
                        
                        <Column field="scope" header="Project Scope" sortable style="width: 25%">
                            <template #body="slotProps">
                                <div class="max-w-xs truncate" :title="slotProps.data.scope">
                                    {{ slotProps.data.scope }}
                                </div>
                            </template>
                        </Column>
                        
                        <Column field="status" header="Status" sortable style="width: 12%">
                            <template #body="slotProps">
                                <Tag 
                                    :value="slotProps.data.status" 
                                    :severity="getStatusSeverity(slotProps.data.status)"
                                />
                            </template>
                        </Column>
                        
                        <Column field="cost" header="Estimated Cost" sortable style="width: 15%">
                            <template #body="slotProps">
                                <div class="font-medium text-green-600 dark:text-green-400">
                                    {{ formatCurrency(slotProps.data.cost) }}
                                </div>
                            </template>
                        </Column>
                        
                        <Column header="Actions" style="width: 16%">
                            <template #body="slotProps">
                                <div class="flex gap-2">
                                    <Button 
                                        icon="pi pi-eye" 
                                        text 
                                        rounded
                                        size="small"
                                        @click="viewEstimate(slotProps.data)"
                                        v-tooltip.top="'View Details'"
                                    />
                                    <Button 
                                        icon="pi pi-pencil" 
                                        text 
                                        rounded
                                        size="small"
                                        @click="editEstimate(slotProps.data)"
                                        v-tooltip.top="'Edit'"
                                    />
                                    <Button 
                                        icon="pi pi-download" 
                                        text 
                                        rounded
                                        size="small"
                                        @click="downloadEstimate(slotProps.data)"
                                        v-tooltip.top="'Download PDF'"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Estimate Builder Tab -->
            <div v-else-if="activeTab === 'builder'" class="builder-content">
                <div class="card">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                        Estimate / Quote Builder
                    </h2>
                    <div class="text-center py-12">
                        <i class="pi pi-hammer text-6xl text-surface-400 mb-4"></i>
                        <h3 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Estimate Builder Coming Soon
                        </h3>
                        <p class="text-surface-500 mb-4">
                            Interactive estimate builder with line items, materials, and labor calculations
                        </p>
                        <Button label="Create New Estimate" icon="pi pi-plus" disabled />
                    </div>
                </div>
            </div>

            <!-- Estimate Tracker Tab -->
            <div v-else-if="activeTab === 'tracker'" class="tracker-content">
                <div class="card">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                        Estimate / Quote Tracker
                    </h2>
                    <div class="text-center py-12">
                        <i class="pi pi-chart-line text-6xl text-surface-400 mb-4"></i>
                        <h3 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Estimate Tracker Coming Soon
                        </h3>
                        <p class="text-surface-500 mb-4">
                            Track estimate status, approval workflow, and conversion rates
                        </p>
                        <Button label="View All Estimates" icon="pi pi-list" disabled />
                    </div>
                </div>
            </div>

            <!-- Activity / History Tab -->
            <div v-else-if="activeTab === 'history'" class="history-content">
                <div class="card">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                        Activity / History
                    </h2>
                    <div class="text-center py-12">
                        <i class="pi pi-history text-6xl text-surface-400 mb-4"></i>
                        <h3 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Activity History Coming Soon
                        </h3>
                        <p class="text-surface-500 mb-4">
                            View detailed activity logs and estimate history
                        </p>
                        <Button label="View Activity Log" icon="pi pi-list" disabled />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import TabMenu from 'primevue/tabmenu';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

// Composables
const toast = useToast();

// Reactive data
const activeTabIndex = ref(0);
const isLoading = ref(false);

// Tab configuration - matching the request exactly
const tabItems = ref([
    { label: 'Dashboard', icon: 'pi pi-chart-line' },
    { label: 'Estimate Builder', icon: 'pi pi-calculator' },
    { label: 'Estimate Tracker', icon: 'pi pi-list' },
    { label: 'Activity / History', icon: 'pi pi-history' }
]);

// Computed active tab based on index
const activeTab = computed(() => {
    const tabMap = ['dashboard', 'builder', 'tracker', 'history'];
    return tabMap[activeTabIndex.value] || 'dashboard';
});

// Sample data for recent estimates
const recentEstimates = ref([
    {
        id: 'EST-1001',
        client: 'Acme Corporation',
        scope: 'Network Infrastructure Upgrade',
        status: 'Draft',
        cost: 12450.00
    },
    {
        id: 'EST-1002',
        client: 'TechSolutions Inc.',
        scope: 'Server Room Installation',
        status: 'Submitted',
        cost: 28750.00
    },
    {
        id: 'EST-1003',
        client: 'Global Retail',
        scope: 'POS System Deployment',
        status: 'Approved',
        cost: 45200.00
    },
    {
        id: 'EST-1004',
        client: 'Healthcare Partners',
        scope: 'Security System Installation',
        status: 'Rejected',
        cost: 18900.00
    },
    {
        id: 'EST-1005',
        client: 'Financial Services Group',
        scope: 'Data Center Migration',
        status: 'Awaiting Approval',
        cost: 67500.00
    }
]);

// Methods
function getStatusSeverity(status) {
    const severityMap = {
        'Draft': 'secondary',
        'Submitted': 'info',
        'Approved': 'success',
        'Rejected': 'danger',
        'Awaiting Approval': 'warning'
    };
    return severityMap[status] || 'info';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function refreshEstimates() {
    isLoading.value = true;
    
    // Simulate API call
    setTimeout(() => {
        isLoading.value = false;
        toast.add({
            severity: 'success',
            summary: 'Refreshed',
            detail: 'Estimates data has been refreshed',
            life: 3000
        });
    }, 1000);
}

function viewEstimate(estimate) {
    toast.add({
        severity: 'info',
        summary: 'View Estimate',
        detail: `Viewing estimate ${estimate.id}`,
        life: 3000
    });
}

function editEstimate(estimate) {
    toast.add({
        severity: 'info',
        summary: 'Edit Estimate',
        detail: `Editing estimate ${estimate.id}`,
        life: 3000
    });
}

function downloadEstimate(estimate) {
    toast.add({
        severity: 'success',
        summary: 'Download Started',
        detail: `Downloading PDF for estimate ${estimate.id}`,
        life: 3000
    });
}

// Lifecycle
onMounted(() => {
    // Initialize component
    console.log('EstimatesView mounted');
});
</script>

<style scoped>
.estimates-page {
    padding: 1rem;
}

.tab-content {
    min-height: 60vh;
}

.card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid var(--surface-border);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .card {
    background: var(--surface-900);
    border-color: var(--surface-700);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .estimates-page {
        padding: 0.5rem;
    }
    
    .card {
        padding: 1rem;
    }
}

/* Enhanced table styling */
:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
    padding: 0.75rem 1rem;
}

:deep(.p-tabmenu .p-tabmenu-nav) {
    border-radius: 8px 8px 0 0;
}

:deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link) {
    border-radius: 8px 8px 0 0;
    transition: all 0.2s;
}
</style> 