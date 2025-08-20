<template>
  <div class="audit-dashboard">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Audit Dashboard</h1>
        <p class="text-surface-600 dark:text-surface-400 mb-1">Monitor and manage customer audit processes</p>
        <div class="text-sm text-surface-500 dark:text-surface-400">
          Customer ID: <span class="font-medium">{{ customerId }}</span>
          <span v-if="auditStore.customerStatus?.customer_name" class="ml-2">
            ({{ auditStore.customerStatus.customer_name }})
          </span>
        </div>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          v-if="auditStore.lastUpdated"
          label="Refresh"
          icon="pi pi-refresh" 
          outlined
          @click="refreshData"
          :loading="refreshing"
        />
        <Button 
          label="Export Report" 
          icon="pi pi-download" 
          outlined
          @click="exportData"
        />
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card class="shadow-sm border-l-4 border-l-blue-500">
        <template #content>
          <div class="flex items-center justify-between p-4">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Total Locations</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ auditStore.totalLocations }}
              </div>
              <div class="text-blue-500 text-sm font-medium">
                <i class="pi pi-building mr-1"></i>
                Available for audit
              </div>
            </div>
            <div class="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3">
              <i class="pi pi-building text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm border-l-4 border-l-green-500">
        <template #content>
          <div class="flex items-center justify-between p-4">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Audited</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ auditStore.auditedLocations }}
              </div>
              <div class="text-green-500 text-sm font-medium">
                <i class="pi pi-check-circle mr-1"></i>
                Scan completed
              </div>
            </div>
            <div class="bg-green-100 dark:bg-green-900/20 rounded-full p-3">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm border-l-4 border-l-orange-500">
        <template #content>
          <div class="flex items-center justify-between p-4">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">In Progress</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ auditStore.inProgressLocations }}
              </div>
              <div class="text-orange-500 text-sm font-medium">
                <i class="pi pi-clock mr-1"></i>
                Currently scanning
              </div>
            </div>
            <div class="bg-orange-100 dark:bg-orange-900/20 rounded-full p-3">
              <i class="pi pi-clock text-orange-600 dark:text-orange-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-sm border-l-4 border-l-purple-500">
        <template #content>
          <div class="flex items-center justify-between p-4">
            <div>
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-1">Completed</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ auditStore.completedLocations }}
              </div>
              <div class="text-purple-500 text-sm font-medium">
                <i class="pi pi-flag mr-1"></i>
                Fully validated
              </div>
            </div>
            <div class="bg-purple-100 dark:bg-purple-900/20 rounded-full p-3">
              <i class="pi pi-flag text-purple-600 dark:text-purple-400 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Progress Overview -->
    <Card class="shadow-sm mb-8" v-if="auditStore.totalLocations > 0">
      <template #header>
        <div class="p-6 pb-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-1">Audit Progress</h3>
              <p class="text-surface-600 dark:text-surface-400 text-sm">Customer-wide scanning and validation status</p>
            </div>
            <Tag 
              :value="`${auditStore.auditProgress}% Complete`" 
              :severity="auditStore.auditProgress === 100 ? 'success' : 'info'"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <ProgressBar 
            :value="auditStore.auditProgress" 
            class="h-4"
          />
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Coverage</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">{{ auditStore.coveragePercentage }}%</div>
              <div class="text-blue-500 text-sm font-medium">
                <i class="pi pi-chart-pie mr-1"></i>
                Scan coverage
              </div>
            </div>
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Last Scan</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ formatDate(auditStore.lastScanDate) }}
              </div>
              <div class="text-gray-500 text-sm font-medium">
                <i class="pi pi-calendar mr-1"></i>
                Most recent
              </div>
            </div>
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Est. Remaining</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1">
                {{ auditStore.getEstimatedTimeRemaining() || 'N/A' }}
              </div>
              <div class="text-gray-500 text-sm font-medium">
                <i class="pi pi-clock mr-1"></i>
                Time estimate
              </div>
            </div>
            <div class="text-center">
              <div class="text-surface-500 dark:text-surface-400 font-medium text-sm mb-2">Status</div>
              <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl mb-1" :class="auditStore.hasActiveAudit ? 'text-orange-600' : 'text-green-600'">
                {{ auditStore.hasActiveAudit ? 'Running' : 'Idle' }}
              </div>
              <div class="text-gray-500 text-sm font-medium">
                <i :class="auditStore.hasActiveAudit ? 'pi pi-spin pi-spinner' : 'pi pi-check'" class="mr-1"></i>
                Current state
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Quick Actions -->
    <Card class="shadow-sm mb-8">
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Quick Actions</h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm">Available audit operations and management tools</p>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            label="Start Full Audit" 
            icon="pi pi-play" 
            class="w-full"
            :loading="startingAudit"
            :disabled="auditStore.hasActiveAudit"
            @click="startFullAudit"
          />
          <Button 
            label="Quick Audit (Test)" 
            icon="pi pi-bolt" 
            class="w-full"
            outlined
            @click="showQuickAuditDialog = true"
          />
          <Button 
            label="View All Locations" 
            icon="pi pi-list" 
            class="w-full"
            outlined
            @click="goToLocations"
          />
          <Button 
            label="Export Data" 
            icon="pi pi-download" 
            class="w-full"
            outlined
            @click="exportData"
          />
        </div>
      </template>
    </Card>

    <!-- Active Audit Progress (shown when audit running) -->
    <Card v-if="auditStore.hasActiveAudit" class="shadow-sm mb-8 border-l-4 border-l-orange-500">
      <template #header>
        <div class="p-6 pb-0">
          <div class="flex items-center gap-3">
            <div class="bg-orange-100 dark:bg-orange-900/20 rounded-full p-2">
              <i class="pi pi-spin pi-spinner text-orange-600 dark:text-orange-400"></i>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-1">Active Audit in Progress</h3>
              <p class="text-surface-600 dark:text-surface-400 text-sm">Background scanning is currently running</p>
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-surface-900 dark:text-surface-0 font-medium">
              Processing locations: {{ auditStore.auditedLocations }} / {{ auditStore.totalLocations }}
            </span>
            <span class="text-surface-600 dark:text-surface-400 text-sm">
              {{ auditStore.auditProgress }}% complete
            </span>
          </div>
          
          <ProgressBar 
            :value="auditStore.auditProgress" 
            class="h-3"
            :show-value="false"
          />
          
          <div class="text-surface-600 dark:text-surface-400 text-sm">
            <i class="pi pi-clock mr-1"></i>
            Estimated time remaining: {{ auditStore.getEstimatedTimeRemaining() || 'Calculating...' }}
          </div>
          
          <div class="flex gap-2">
            <Button 
              label="Monitor Progress" 
              icon="pi pi-eye" 
              outlined
              size="small"
              @click="goToLocations"
            />
            <Button 
              label="View Details" 
              icon="pi pi-info-circle" 
              outlined
              size="small"
              @click="showAuditDetails = true"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Quick Audit Dialog -->
    <Dialog 
      v-model:visible="showQuickAuditDialog" 
      header="Quick Audit Configuration"
      :modal="true"
      class="w-[500px]"
    >
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Number of Locations</label>
          <InputNumber 
            v-model="quickAuditOptions.limit" 
            :min="1" 
            :max="100" 
            placeholder="Enter limit"
            class="w-full"
          />
          <small class="text-gray-600">Maximum number of locations to audit</small>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Audit Mode</label>
          <Select 
            v-model="quickAuditOptions.audit_mode" 
            :options="auditModeOptions"
            option-label="label"
            option-value="value"
            placeholder="Select audit mode"
            class="w-full"
          />
          <small class="text-gray-600">Choose how the audit should process locations</small>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Skip Recent Scans (Days)</label>
          <InputNumber 
            v-model="quickAuditOptions.skip_days" 
            :min="0" 
            :max="30" 
            placeholder="Days to skip"
            class="w-full"
          />
          <small class="text-gray-600">Skip locations scanned within this many days</small>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showQuickAuditDialog = false" 
          />
          <Button 
            label="Run Quick Audit" 
            severity="primary" 
            @click="runQuickAudit"
            :loading="startingQuickAudit"
          />
        </div>
      </template>
    </Dialog>

    <!-- Audit Details Dialog -->
    <Dialog 
      v-model:visible="showAuditDetails" 
      header="Audit Progress Details"
      :modal="true"
      class="w-[600px]"
    >
      <div class="space-y-4">
        <div v-if="auditStore.customerStatus">
          <h4 class="font-semibold mb-2">Current Status</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Total Locations:</strong> {{ auditStore.customerStatus.total_locations }}
            </div>
            <div>
              <strong>Audited:</strong> {{ auditStore.customerStatus.audited_locations }}
            </div>
            <div>
              <strong>In Progress:</strong> {{ auditStore.customerStatus.audit_in_progress }}
            </div>
            <div>
              <strong>Completed:</strong> {{ auditStore.customerStatus.audit_completed }}
            </div>
          </div>
        </div>
        
        <Divider />
        
        <div>
          <h4 class="font-semibold mb-2">Last Updated</h4>
          <p class="text-sm text-gray-600">
            {{ formatDateTime(auditStore.lastUpdated) }}
          </p>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="Close" 
          severity="secondary" 
          @click="showAuditDetails = false" 
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuditStore } from '@/stores/auditStore';

const router = useRouter();
const toast = useToast();
const auditStore = useAuditStore();

// Component state
const startingAudit = ref(false);
const startingQuickAudit = ref(false);
const refreshing = ref(false);
const showQuickAuditDialog = ref(false);
const showAuditDetails = ref(false);

// Quick audit configuration
const quickAuditOptions = ref({
  limit: 50,
  audit_mode: 'incremental',
  skip_days: 7
});

const auditModeOptions = [
  { label: 'Incremental (Skip Recent)', value: 'incremental' },
  { label: 'Full Override (Re-scan All)', value: 'full-override' },
  { label: 'Full Historical (Include Archives)', value: 'full-historical' }
];

// Computed properties
const customerId = computed(() => router.currentRoute.value.params.customerId);

// Methods

const startFullAudit = async () => {
  if (!customerId.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'No Customer Selected', 
      detail: 'Please select a customer first' 
    });
    return;
  }
  
  startingAudit.value = true;
  try {
    await auditStore.startFullAudit();
    
    toast.add({ 
      severity: 'success', 
      summary: 'Audit Started', 
      detail: `Full customer audit has been initiated for customer ${customerId.value}`,
      life: 5000
    });
  } catch (error) {
    console.error('Failed to start audit:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Failed to Start Audit', 
      detail: error.response?.data?.message || 'Unknown error occurred' 
    });
  } finally {
    startingAudit.value = false;
  }
};

const runQuickAudit = async () => {
  startingQuickAudit.value = true;
  try {
    await auditStore.startFullAudit(quickAuditOptions.value);
    
    showQuickAuditDialog.value = false;
    toast.add({ 
      severity: 'success', 
      summary: 'Quick Audit Started', 
      detail: `Quick audit initiated with ${quickAuditOptions.value.limit} location limit`,
      life: 5000
    });
  } catch (error) {
    console.error('Failed to start quick audit:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Failed to Start Quick Audit', 
      detail: error.response?.data?.message || 'Unknown error occurred' 
    });
  } finally {
    startingQuickAudit.value = false;
  }
};

const goToLocations = () => {
  if (customerId.value) {
    router.push({ 
      name: 'AuditLocations', 
      params: { customerId: customerId.value } 
    });
  }
};

const exportData = () => {
  toast.add({ 
    severity: 'info', 
    summary: 'Export Feature', 
    detail: 'Data export functionality coming soon' 
  });
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    await auditStore.refresh();
    toast.add({ 
      severity: 'success', 
      summary: 'Data Refreshed', 
      detail: 'Customer audit data has been refreshed' 
    });
  } catch (error) {
    console.error('Failed to refresh data:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Refresh Failed', 
      detail: 'Failed to refresh audit data' 
    });
  } finally {
    refreshing.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString();
};

const formatDateTime = (date) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleString();
};

// Initialize once when component mounts or customer changes
const initializeCustomer = async (customerId) => {
  if (!customerId) return;
  
  try {
    await auditStore.initializeFromRoute(customerId);
    
    // Start polling if there's an active audit
    if (auditStore.hasActiveAudit) {
      auditStore.startStatusPolling();
    }
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    toast.add({
      severity: 'error',
      summary: 'Initialization Failed',
      detail: 'Failed to load customer audit data'
    });
  }
};

// Watch for route changes (without immediate to avoid double loading)
watch(() => router.currentRoute.value.params.customerId, async (newCustomerId, oldCustomerId) => {
  if (newCustomerId && newCustomerId !== oldCustomerId) {
    await initializeCustomer(newCustomerId);
  }
});

// Lifecycle - only initialize once on mount
onMounted(async () => {
  const routeCustomerId = customerId.value;
  if (routeCustomerId) {
    await initializeCustomer(routeCustomerId);
  }
});

onUnmounted(() => {
  // Clean up polling when component unmounts
  auditStore.stopStatusPolling();
});
</script>

<style scoped>
.audit-dashboard {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .audit-dashboard {
    padding: 1rem;
  }
}
</style>
