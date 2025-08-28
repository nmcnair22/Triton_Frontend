<template>
  <div class="location-workbench p-6">
    <!-- Header -->
    <Card class="shadow-sm mb-6">
      <template #header>
        <div class="p-6 pb-0">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
                {{ locationDetail?.location_name || 'Loading...' }}
              </h1>
              <p class="text-surface-600 dark:text-surface-400 mb-1">
                Complete audit workbench for location analysis and validation
              </p>
              <div class="text-sm text-surface-500 dark:text-surface-400">
                <span v-if="locationDetail?.site_number">Site: {{ locationDetail.site_number }}</span>
                <span v-if="locationDetail?.city && locationDetail?.state"> | {{ locationDetail.city }}, {{ locationDetail.state }}</span>
              </div>
            </div>
            
            <div class="flex align-items-center gap-2 mt-4 md:mt-0">
              <Tag :value="locationDetail?.audit_status || 'UNKNOWN'" :severity="getStatusSeverity(locationDetail?.audit_status)" />
              <Select 
                v-model="selectedStatus" 
                :options="auditStatusOptions" 
                option-label="label" 
                option-value="value" 
                placeholder="Update Status" 
                @change="updateStatus" 
                :disabled="loading.location" 
                class="w-44"
              />
              <Button 
                label="Audit Location" 
                icon="pi pi-search" 
                @click="auditLocation" 
                :loading="loading.location" 
                outlined 
              />
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <!-- Signature change warning -->
        <Message v-if="signatureChanged" severity="warn" :closable="false" class="mb-4">
          Asset or Charge signature changed after rescan. Please review allocation.
          <Button label="Review Allocation" class="p-button-link p-0 ml-2" @click="activeTab = '2'" />
        </Message>
      </template>
    </Card>

    <!-- Tab Navigation -->
    <Tabs v-model:value="activeTab" @tab-change="onTabChange">
      <TabList>
        <Tab value="0">
          <span class="flex align-items-center gap-2">
            Raw Assets 
            <Badge v-if="workbenchStore.rawAssetsReviewed" value="✓" severity="success" />
          </span>
        </Tab>
        <Tab value="1">
          <span class="flex align-items-center gap-2">
            Topology & Mapping 
            <Badge v-if="hasUnmappedAssets" value="⚠" severity="warning" />
            <Badge v-else-if="unitCount > 0" value="✓" severity="success" />
          </span>
        </Tab>
        <Tab value="2">
          <span class="flex align-items-center gap-2">
            Licensing & Allocation 
            <Badge v-if="workbenchStore.allocationSaved" value="✓" severity="success" />
          </span>
        </Tab>
        <Tab value="3">
          <span class="flex align-items-center gap-2">
            Issues & Exceptions 
            <Badge v-if="workbenchStore.openIssuesCount > 0" :value="workbenchStore.openIssuesCount" severity="danger" />
          </span>
        </Tab>
        <Tab value="4">History</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="0">
        <RawAssetsTab 
          :location-id="locationId" 
          :audit-run-id="auditRunId" 
          @reviewed-changed="onRawAssetsReviewed" 
          @rescan="auditLocation"
        />
        </TabPanel>
        
        <TabPanel value="1">
          <TopologyMappingTab :location-id="locationId" />
        </TabPanel>
        
        <TabPanel value="2">
          <LicensingTab 
            :location-id="locationId" 
            :customer-id="customerId" 
            @create-issue="handleCreateIssue"
          />
        </TabPanel>
        
        <TabPanel value="3">
          <IssuesExceptionsTab 
            ref="issuesTabRef"
            :location-id="locationId" 
            :customer-id="customerId" 
          />
        </TabPanel>
        
        <TabPanel value="4">
          <HistoryTab 
            :location-id="locationId" 
            :customer-id="customerId"
            @switch-tab="handleTabSwitch"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { useToast } from 'primevue/usetoast';
import { auditClient } from '@/services/auditClient';
import RawAssetsTab from '@/components/audit-workbench/RawAssetsTab.vue';
import TopologyMappingTab from '@/components/audit-workbench/TopologyMappingTab.vue';
import LicensingTab from '@/components/audit-workbench/LicensingTab.vue';
import IssuesExceptionsTab from '@/components/audit-workbench/IssuesExceptionsTab.vue';
import HistoryTab from '@/components/audit-workbench/HistoryTab.vue';

// Composables
const route = useRoute();
const router = useRouter();
const toast = useToast();
const workbenchStore = useWorkbenchStore();

// Reactive state
const activeTab = ref("0");
const selectedStatus = ref('');
const signatureChanged = ref(false);
const issuesTabRef = ref(null);
const loading = ref({
  location: false,
  status: false
});

// Extract route parameters
const customerId = computed(() => parseInt(route.params.customerId));
const locationId = computed(() => parseInt(route.params.locationId));

// Location detail from store
const locationDetail = computed(() => workbenchStore.locationDetail);

// Audit run ID from query params (for historical views)
const auditRunId = computed(() => route.query.audit_run_id || null);

// Computed properties for badge displays
const unitCount = computed(() => workbenchStore.assetUnits?.length || 0);
const hasUnmappedAssets = computed(() => {
  if (!workbenchStore.rawAssets?.raw_assets || !workbenchStore.assetUnits) return false;
  
  // Count all raw assets
  const rawAssets = workbenchStore.rawAssets.raw_assets;
  const totalRawAssets = [
    ...(rawAssets.meraki_devices || []),
    ...(rawAssets.meraki_uplinks || []),
    ...(rawAssets.orion_nodes || []),
    ...(rawAssets.cradlepoint_devices || []),
    ...(rawAssets.sims || [])
    // Excluding meraki_networks (MN) as they're typically not mapped in V1
  ];
  
  // Count linked assets
  const linkedAssetIds = new Set();
  workbenchStore.assetUnits.forEach(unit => {
    (unit.links || []).forEach(link => {
      linkedAssetIds.add(`${link.raw_id}:${link.aspect}`);
    });
  });
  
  // Check if any assets are unlinked
  return totalRawAssets.some(asset => {
    // Check common aspect types (this is display logic, not reference data)
    const commonAspects = ['DEVICE', 'UPLINK', 'MONITOR_NODE', 'SIM'];
    return commonAspects.some(aspect => !linkedAssetIds.has(`${asset.id}:${aspect}`));
  });
});

// Status options - fetched from backend reference API
const auditStatusOptions = ref([]);

// Methods
const getStatusSeverity = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'awaiting_validation': return 'warning';
    case 'pending': return 'secondary';
    default: return 'secondary';
  }
};

const updateStatus = async () => {
  if (!selectedStatus.value || selectedStatus.value === locationDetail.value?.audit_status) {
    return;
  }

  loading.value.status = true;
  
  try {
    await auditClient.updateLocationStatus(customerId.value, locationId.value, selectedStatus.value);
    
    // Refresh location details
    await loadLocationDetail();
    
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Location status updated to ${selectedStatus.value}`,
      life: 3000
    });
  } catch (error) {
    console.error('Failed to update location status:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update location status',
      life: 3000
    });
    
    // Revert to original status
    selectedStatus.value = locationDetail.value?.audit_status || '';
  } finally {
    loading.value.status = false;
  }
};

const auditLocation = async () => {
  loading.value.location = true;
  
  try {
    const response = await auditClient.auditSingleLocation(customerId.value, locationId.value);
    
    toast.add({
      severity: 'success',
      summary: 'Location Audit Complete',
      detail: `Fresh audit completed for run ${response.data.audit_run_id}`,
      life: 5000
    });
    
    // Clear allocation saved badge since data will be fresh
    workbenchStore.setAllocationSaved(false);
    
    // Immediately refresh location details with new data
    await loadLocationDetail();
    await workbenchStore.loadRawAssets(locationId.value);
    
  } catch (error) {
    console.error('Failed to audit location:', error);
    toast.add({
      severity: 'error',
      summary: 'Audit Failed',
      detail: error.response?.data?.message || 'Failed to complete location audit',
      life: 5000
    });
  } finally {
    loading.value.location = false;
  }
};

const loadLocationDetail = async () => {
  try {
    await workbenchStore.loadLocationDetail(customerId.value, locationId.value);
    
    // Set selected status to current status
    selectedStatus.value = locationDetail.value?.audit_status || '';
  } catch (error) {
    console.error('Failed to load location detail:', error);
    toast.add({
      severity: 'error',
      summary: 'Load Failed',
      detail: 'Failed to load location details',
      life: 3000
    });
  }
};

const onTabChange = (event) => {
  // Persist tab selection to localStorage
  const tabKey = `workbench_tab_${locationId.value}`;
  localStorage.setItem(tabKey, activeTab.value); // Save the current tab value
};

const onRawAssetsReviewed = (reviewed) => {
  workbenchStore.setRawAssetsReviewed(reviewed);
};

// Load saved tab preference
const loadTabPreference = () => {
  const tabKey = `workbench_tab_${locationId.value}`;
  const savedTab = localStorage.getItem(tabKey);
  if (savedTab !== null) {
    activeTab.value = savedTab; // Keep as string for new Tabs component
  }
};

// Handle issue creation from Licensing tab
const handleCreateIssue = (issueData) => {
  // Navigate to Issues tab
  activeTab.value = "3";
  
  // Wait for tab to mount/render, then call prefill method
  nextTick(() => {
    if (issuesTabRef.value && issuesTabRef.value.createPreffilledIssue) {
      issuesTabRef.value.createPreffilledIssue(issueData);
    }
  });
};

// Handle tab switch from child components
const handleTabSwitch = (tabValue) => {
  activeTab.value = tabValue;
};

// Watch for route changes (e.g., different audit run ID)
watch(() => route.query.audit_run_id, async (newRunId) => {
  if (newRunId) {
    // Historical view mode
    await workbenchStore.loadRawAssets(locationId.value, newRunId);
  } else {
    // Latest view mode
    await workbenchStore.loadRawAssets(locationId.value);
  }
});

// Lifecycle
onMounted(async () => {
  // Initialize workbench store with location
  workbenchStore.setLocationId(locationId.value);
  
  // Load status options from backend reference API (defensive)
  try {
    const statusResponse = await auditClient.http.get('/audit/ref/audit-statuses');
    auditStatusOptions.value = statusResponse.data?.statuses || [];
  } catch (error) {
    console.warn('Audit statuses endpoint not available, using fallback');
    auditStatusOptions.value = [
      { label: 'Pending', value: 'pending' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Awaiting Validation', value: 'awaiting_validation' },
      { label: 'Completed', value: 'completed' }
    ];
  }
  
  // Load location details
  await loadLocationDetail();
  
  // Load raw assets and asset units (latest or historical based on query param)
  if (auditRunId.value) {
    await workbenchStore.loadRawAssets(locationId.value, auditRunId.value);
  } else {
    await workbenchStore.loadRawAssets(locationId.value);
  }
  
  // Load asset units for topology mapping
  await workbenchStore.loadAssetUnits(locationId.value);
  
  // Load tab preference
  loadTabPreference();
});

onUnmounted(() => {
  // Clean up workbench store
  workbenchStore.clearLocationData();
});
</script>

<style scoped>
.location-workbench {
  min-height: calc(100vh - 200px);
  max-width: 1600px;
  margin: 0 auto;
}

.location-workbench :deep(.p-tabs-nav) {
  border-bottom: 1px solid var(--surface-border);
}

.location-workbench :deep(.p-tabs-panels) {
  padding: 0;
  background: transparent;
}

.location-workbench :deep(.p-tabs-panel) {
  padding: 1.5rem 0;
}

.location-workbench :deep(.p-badge) {
  min-width: 1.5rem;
  height: 1.5rem;
  line-height: 1.5rem;
}

@media (max-width: 768px) {
  .location-workbench {
    padding: 1rem;
  }
}
</style>