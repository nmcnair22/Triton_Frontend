<template>
  <div class="dashboard p-6">
    <!-- Enhanced Audit Form -->
    <Card class="mb-6">
      <template #content>
        <div class="audit-form-container">
          <!-- Customer and Basic Settings -->
          <div class="flex items-center gap-4 mb-6">
            <label class="font-medium">Customer:</label>
            <Select 
              v-model="selectedCustomer" 
              :options="customers" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Choose a customer"
              class="w-64"
            />
            <div class="ml-auto">
              <Button 
                label="Load Audit Data" 
                icon="pi pi-database"
                @click="loadStoredAuditData"
                :disabled="!selectedCustomer"
                :loading="loading"
                class="mr-2"
              />
              <Button 
                label="Start Scan" 
                icon="pi pi-play"
                @click="startBackgroundScan"
                :disabled="!selectedCustomer"
                :loading="scanLoading"
                class="mr-2"
                outlined
              />
              <Button 
                label="Scan Options" 
                icon="pi pi-cog"
                @click="toggleAdvancedOptions"
                text
                severity="secondary"
              />
            </div>
          </div>

          <!-- Advanced Options Panel -->
          <div v-if="showAdvancedOptions" class="advanced-options border-t pt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Audit Mode Selection -->
              <div class="audit-mode-selection">
                <h4 class="font-semibold mb-3">Audit Mode</h4>
                <div class="space-y-2">
                  <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': auditOptions.audit_mode === 'incremental' }">
                    <input type="radio" v-model="auditOptions.audit_mode" value="incremental" class="mr-3">
                    <div>
                      <div class="font-medium">Incremental (Skip Recent)</div>
                      <div class="text-sm text-gray-600">Skip locations audited within the last few days</div>
                    </div>
                  </label>
                  
                  <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': auditOptions.audit_mode === 'full-override' }">
                    <input type="radio" v-model="auditOptions.audit_mode" value="full-override" class="mr-3">
                    <div>
                      <div class="font-medium">Full Override (Re-audit All)</div>
                      <div class="text-sm text-gray-600">Process all locations, update existing records</div>
                    </div>
                  </label>
                  
                  <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" :class="{ 'border-blue-500 bg-blue-50': auditOptions.audit_mode === 'full-historical' }">
                    <input type="radio" v-model="auditOptions.audit_mode" value="full-historical" class="mr-3">
                    <div>
                      <div class="font-medium">Full Historical (Complete Trail)</div>
                      <div class="text-sm text-gray-600">Process all locations, preserve complete history</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Advanced Settings -->
              <div class="advanced-settings">
                <h4 class="font-semibold mb-3">Advanced Settings</h4>
                <div class="space-y-4">
                  
                  <div class="form-group">
                    <label class="block text-sm font-medium mb-1">Location Limit</label>
                    <InputNumber 
                      v-model="auditOptions.limit" 
                      :min="1" 
                      :max="1000"
                      placeholder="Max locations to process"
                      class="w-full"
                    />
                  </div>
                  
                  <div v-if="auditOptions.audit_mode === 'incremental'" class="form-group">
                    <label class="block text-sm font-medium mb-1">Skip Days</label>
                    <InputNumber 
                      v-model="auditOptions.skip_days" 
                      :min="1" 
                      :max="365"
                      placeholder="Days to skip recently audited"
                      class="w-full"
                    />
                    <small class="text-gray-500">Skip locations audited within this many days</small>
                  </div>
                  
                  <div class="form-group">
                    <label class="flex items-center">
                      <Checkbox v-model="auditOptions.force_reaudit" :binary="true" class="mr-2" />
                      <span class="text-sm font-medium">Force Re-audit All Locations</span>
                    </label>
                    <small class="text-gray-500 block mt-1">Override all skip logic and process every location</small>
                  </div>
                  
                  <div class="form-group">
                    <label class="block text-sm font-medium mb-1">Reset Specific Locations</label>
                    <InputText 
                      v-model="auditOptions.reset_locations" 
                      placeholder="123,456,789"
                      class="w-full"
                    />
                    <small class="text-gray-500">Comma-separated location IDs to force re-audit</small>
                  </div>
                  
                  <div class="form-group">
                    <label class="block text-sm font-medium mb-1">Audit Since Date</label>
                    <DatePicker 
                      v-model="auditOptions.audit_since" 
                      placeholder="Only skip locations audited after this date"
                      dateFormat="yy-mm-dd"
                      class="w-full"
                    />
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Enhanced Scan Summary -->
    <Card v-if="auditData" class="mb-6">
      <template #content>
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-semibold">Audit Results - Customer: {{ selectedCustomerName }} ({{ selectedCustomer }})</h3>
            <div v-if="auditData.audit_run_id" class="text-sm text-gray-600">
              Run #{{ auditData.audit_run_id }} • Mode: {{ auditData.audit_mode || 'unknown' }} • {{ new Date().toLocaleString() }}
            </div>
          </div>
          <div class="flex gap-2">
            <Badge v-if="auditData.audit_mode" :value="auditData.audit_mode" :severity="getAuditModeSeverity(auditData.audit_mode)" />
            <Badge :value="`${auditData.unique_profiles || 0} Profiles`" severity="info" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Processed:</span>
            <span class="font-semibold ml-2 text-green-600">{{ auditData.locations_processed || auditData.locations_analyzed || 0 }}</span>
          </div>
          <div v-if="auditData.locations_skipped !== undefined">
            <span class="text-gray-600">Skipped:</span>
            <span class="font-semibold ml-2 text-orange-600">{{ auditData.locations_skipped }}</span>
          </div>
          <div v-if="auditData.locations_reset !== undefined && auditData.locations_reset > 0">
            <span class="text-gray-600">Force Reset:</span>
            <span class="font-semibold ml-2 text-blue-600">{{ auditData.locations_reset }}</span>
          </div>
          <div>
            <span class="text-gray-600">Asset Signatures:</span>
            <span class="font-semibold ml-2">{{ auditData.unique_profiles || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Charge Signatures:</span>
            <span class="font-semibold ml-2">{{ uniqueChargeSignatures }}</span>
          </div>
          <div>
            <span class="text-gray-600">Total Assets:</span>
            <span class="font-semibold ml-2">{{ auditData.summary?.total_assets || auditData.summary_stats?.total_assets || 0 }}</span>
          </div>
        </div>
        
        <!-- Enhanced Summary Stats -->
        <div v-if="auditData.summary" class="mt-4 pt-4 border-t border-gray-200">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Monthly Cost:</span>
              <span class="font-semibold ml-2 text-green-600">${{ formatCurrency(auditData.summary.total_monthly_cost || 0) }}</span>
            </div>
            <div>
              <span class="text-gray-600">TEM Expected:</span>
              <span class="font-semibold ml-2 text-blue-600">${{ formatCurrency(auditData.summary.total_tem_expected || 0) }}</span>
            </div>
            <div>
              <span class="text-gray-600">With Billing:</span>
              <span class="font-semibold ml-2">{{ auditData.summary.locations_with_billing || 0 }}</span>
            </div>
            <div>
              <span class="text-gray-600">TEM Accounts:</span>
              <span class="font-semibold ml-2">{{ auditData.summary.total_tem_accounts || 0 }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Scan Coverage Statistics -->
    <div class="grid grid-cols-4 gap-4 mb-6" v-if="auditData || auditStatus">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ getTotalLocations() }}</div>
            <div class="text-gray-600">Total Locations</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ getScannedLocations() }}</div>
            <div class="text-gray-600">Scanned</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ getAuditInProgress() }}</div>
            <div class="text-gray-600">In Progress</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ getAuditCompleted() }}</div>
            <div class="text-gray-600">Completed</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Analysis Stats (shown when data is loaded) -->
    <div class="grid grid-cols-3 gap-4 mb-6" v-if="auditData">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ auditData.unique_profiles || 0 }}</div>
            <div class="text-gray-600">Asset Profiles</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ uniqueChargeSignatures }}</div>
            <div class="text-gray-600">Charge Profiles</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${{ formatNumber(totalRevenue) }}</div>
            <div class="text-gray-600">Monthly Revenue</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Navigation Tabs -->
    <Tabs v-if="auditData" value="0" class="audit-tabs">
      <TabList>
        <Tab value="0">Asset Profiles</Tab>
        <Tab value="1">Charge Profiles</Tab>
        <Tab value="2">Integrated View</Tab>
        <Tab value="3">Contracts</Tab>
        <Tab value="4">Mismatches</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <AssetProfileComparison :profiles="assetProfiles" :customer-id="selectedCustomer" />
        </TabPanel>
        <TabPanel value="1">
          <ChargeProfileComparison :profiles="chargeProfiles" :customer-id="selectedCustomer" :audit-data="auditData" />
        </TabPanel>
        <TabPanel value="2">
          <IntegratedAuditView :profiles="assetProfiles" :charge-profiles="chargeProfiles" :audit-data="auditData" :customer-id="selectedCustomer" />
        </TabPanel>
        <TabPanel value="3">
          <ContractManagementView :customer-id="selectedCustomer" />
        </TabPanel>
        <TabPanel value="4">
          <MismatchesView :locations="mismatchedLocations" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { auditService } from '@/services/api';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import AssetProfileComparison from '@/components/AssetProfileComparison.vue';
import ChargeProfileComparison from '@/components/ChargeProfileComparison.vue';
import IntegratedAuditView from '@/components/IntegratedAuditView.vue';
import ContractManagementView from '@/components/ContractManagementView.vue';
import MismatchesView from '@/components/MismatchesView.vue';

const selectedCustomer = ref(291); // Default to Carters
const auditData = ref(null);
const auditStatus = ref(null); // Customer audit coverage statistics
const loading = ref(false); // For loading stored data
const scanLoading = ref(false); // For background scanning
const showAdvancedOptions = ref(false);

// Enhanced audit options
const auditOptions = ref({
  audit_mode: 'incremental',
  limit: 50, // Changed from location_limit to limit to match backend
  skip_days: 7,
  force_reaudit: false,
  reset_locations: '',
  audit_since: null
});

const customers = [
  { id: 291, name: 'Carters' },
  // Add more customers
];

// Load stored audit data automatically when customer changes
const loadStoredAuditData = async () => {
  if (!selectedCustomer.value) return;
  
  loading.value = true;
  try {
    console.log('Loading stored audit data for customer:', selectedCustomer.value);
    
    // Load existing audit data from database
    const response = await auditService.getStoredAuditData(selectedCustomer.value);
    console.log('Stored audit data loaded:', response.data);
    
    auditData.value = response.data;
    
    // Also load customer audit status for scan coverage
    try {
      const statusResponse = await auditService.getCustomerAuditStatus(selectedCustomer.value);
      auditStatus.value = statusResponse.data;
      console.log('Customer audit status:', statusResponse.data);
    } catch (statusError) {
      console.log('Could not load audit status (may not be implemented yet)');
      auditStatus.value = null;
    }
    
  } catch (error) {
    console.error('Failed to load stored audit data:', error);
    console.error('Error response data:', error.response?.data);
    auditData.value = null;
    handleAuditError(error);
  } finally {
    loading.value = false;
  }
};

// Start background scan for unscanned locations
const startBackgroundScan = async () => {
  scanLoading.value = true;
  try {
    // Prepare audit options with date formatting
    const options = { ...auditOptions.value };
    
    // Format date for API
    if (options.audit_since) {
      options.audit_since = options.audit_since instanceof Date 
        ? options.audit_since.toISOString().split('T')[0]
        : options.audit_since;
    }
    
    console.log('Starting background scan with options:', options);
    const response = await auditService.startBackgroundScan(selectedCustomer.value, options);
    console.log('Background scan started:', response.data);
    
    handleScanSuccess(response.data);
    
    // Refresh stored data after scan completes (for now, reload immediately)
    setTimeout(() => {
      loadStoredAuditData();
    }, 2000);
    
  } catch (error) {
    console.error('Background scan failed:', error);
    console.error('Error response data:', error.response?.data);
    handleAuditError(error);
  } finally {
    scanLoading.value = false;
  }
};

// DEPRECATED: Keep for backward compatibility
const runAudit = async () => {
  console.warn('runAudit is deprecated, use startBackgroundScan instead');
  return startBackgroundScan();
};

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
};

const handleAuditSuccess = (result) => {
  console.log('Audit completed successfully!');
  
  // Display enhanced summary
  if (result.locations_processed !== undefined) {
    const message = `
      Processed ${result.locations_processed} locations
      ${result.locations_skipped > 0 ? `(${result.locations_skipped} skipped)` : ''}
      ${result.locations_reset > 0 ? `(${result.locations_reset} force reset)` : ''}
      
      Found ${result.unique_profiles || 0} unique patterns
      Mode: ${result.audit_mode || 'unknown'}
      Total Monthly Cost: $${result.summary?.total_monthly_cost?.toFixed(2) || '0.00'}
    `;
    console.log(message);
  }
};

const handleAuditError = (error) => {
  console.error('Audit error:', error);
  const message = error.response?.data?.error || error.message || 'Unknown error occurred';
  alert(`Audit failed: ${message}`);
};

const assetProfiles = computed(() => {
  if (!auditData.value?.profile_signatures) return [];
  
  // Group by asset signature only
  const grouped = {};
  Object.values(auditData.value.profile_signatures).forEach(profile => {
    const assetSig = profile?.asset_signature || 'Unknown';
    
    if (!grouped[assetSig]) {
      grouped[assetSig] = {
        signature: assetSig,
        chargeSignature: profile?.charge_signature || 'Unknown',
        locationCount: 0,
        locations: [],
        assetBreakdown: profile?.asset_breakdown || {},
        totalCost: { min: 0, max: 0 },
        chargeVariations: []
      };
    }
    
    // Accumulate data for this asset signature
    grouped[assetSig].locationCount += profile?.count || 0;
    if (profile?.locations) {
      grouped[assetSig].locations.push(...profile.locations);
    }
    
    // Track different charge signatures for this asset profile
    const chargeInfo = {
      signature: profile?.charge_signature || 'Unknown',
      locations: profile?.locations || [],
      cost: profile?.total_cost_range || { min: 0, max: 0 }
    };
    grouped[assetSig].chargeVariations.push(chargeInfo);
    
    // Update total cost range
    const currentCost = profile?.total_cost_range || { min: 0, max: 0 };
    grouped[assetSig].totalCost.min += currentCost.min;
    grouped[assetSig].totalCost.max += currentCost.max;
  });
  
  return Object.values(grouped);
});

const chargeProfiles = computed(() => {
  if (!auditData.value?.profile_signatures) return [];
  
  // Group by charge signature
  const grouped = {};
  Object.values(auditData.value.profile_signatures).forEach(profile => {
    const chargeSig = profile?.charge_signature || 'Unknown';
    
    if (!grouped[chargeSig]) {
      grouped[chargeSig] = {
        signature: chargeSig,
        locationCount: 0,
        locations: [],
        serviceBreakdown: {},
        assetVariations: [],
        totalCost: { min: 0, max: 0 }
      };
    }
    
    // Accumulate data for this charge signature
    grouped[chargeSig].locationCount += profile?.count || 0;
    if (profile?.locations) {
      grouped[chargeSig].locations.push(...profile.locations);
    }
    
    // Build service breakdown from charge_breakdown array
    if (profile?.charge_breakdown) {
      profile.charge_breakdown.forEach(service => {
        grouped[chargeSig].serviceBreakdown[service] = (grouped[chargeSig].serviceBreakdown[service] || 0) + (profile?.count || 0);
      });
    }
    
    // Track different asset signatures for this charge profile
    const assetVariation = {
      signature: profile?.asset_signature || 'Unknown',
      locations: profile?.locations || [],
      assetBreakdown: profile?.asset_breakdown || {}
    };
    grouped[chargeSig].assetVariations.push(assetVariation);
    
    // Update total cost range
    const currentCost = profile?.total_cost_range || { min: 0, max: 0 };
    grouped[chargeSig].totalCost.min += currentCost.min * (profile?.count || 1);
    grouped[chargeSig].totalCost.max += currentCost.max * (profile?.count || 1);
  });
  
  return Object.values(grouped);
});

const mismatchedLocations = computed(() => {
  if (!auditData.value?.location_details) return [];
  
  return auditData.value.location_details.filter(loc => {
    // Check for mismatches
    const hasSim = loc.sim_details;
    const simCharged = loc.charges?.some(c => c.item_no.includes('DATA')) || false;
    const hasAssets = loc.total_assets > 0;
    const hasCharges = (loc.charges?.length || 0) > 0;
    
    return (hasSim && !simCharged) || (hasAssets && !hasCharges);
  });
});

const mismatches = computed(() => mismatchedLocations.value.length);

const totalRevenue = computed(() => {
  if (!auditData.value?.location_details) return 0;
  return auditData.value.location_details.reduce((sum, loc) => {
    return sum + (loc.charges?.reduce((chargeSum, charge) => chargeSum + (charge.amount || 0), 0) || 0);
  }, 0);
});

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

const selectedCustomerName = computed(() => {
  const customer = customers.find(c => c.id === selectedCustomer.value);
  return customer?.name || 'Unknown';
});

const uniqueChargeSignatures = computed(() => {
  if (!auditData.value?.profile_signatures) return 0;
  const signatures = new Set();
  Object.values(auditData.value.profile_signatures).forEach(profile => {
    if (profile?.charge_signature && profile.charge_signature !== '') {
      signatures.add(profile.charge_signature);
    }
  });
  return signatures.size;
});

// Helper functions for enhanced audit system
const getAuditModeSeverity = (mode) => {
  switch (mode) {
    case 'incremental': return 'success';
    case 'full-override': return 'warning';
    case 'full-historical': return 'info';
    default: return 'secondary';
  }
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Scan Coverage Helper Functions
const getTotalLocations = () => {
  if (auditStatus.value?.total_locations) {
    return auditStatus.value.total_locations;
  }
  // Fallback: estimate from current data
  return auditData.value?.total_locations || auditData.value?.locations_analyzed || 0;
};

const getScannedLocations = () => {
  if (auditStatus.value?.audited_locations) {
    return auditStatus.value.audited_locations;
  }
  // Fallback: use current loaded data count
  return auditData.value?.locations_analyzed || 0;
};

const getAuditInProgress = () => {
  if (auditStatus.value?.audit_in_progress) {
    return auditStatus.value.audit_in_progress;
  }
  // Fallback: count locations with issues or pending status
  if (auditData.value?.profile_signatures) {
    return Object.values(auditData.value.profile_signatures)
      .reduce((count, profile) => count + (profile.locations?.length || 0), 0);
  }
  return 0;
};

const getAuditCompleted = () => {
  if (auditStatus.value?.audit_completed) {
    return auditStatus.value.audit_completed;
  }
  // Fallback: for now return 0 until we implement completion tracking
  return 0;
};

// Enhanced success handler for background scans
const handleScanSuccess = (result) => {
  console.log('Background scan started successfully!');
  
  if (result.message) {
    console.log('Scan message:', result.message);
  }
  
  if (result.estimated_duration_minutes) {
    console.log(`Estimated completion: ${result.estimated_duration_minutes} minutes`);
  }
  
  // Show user-friendly notification
  // You can integrate with your notification system here
};

// Auto-load stored audit data when customer changes
watch(selectedCustomer, (newCustomerId) => {
  if (newCustomerId) {
    loadStoredAuditData();
  }
});

// Load data on component mount
onMounted(() => {
  if (selectedCustomer.value) {
    loadStoredAuditData();
  }
});
</script>

<style scoped>
.audit-tabs :deep(.p-tablist) {
  @apply border-b border-gray-200 mb-6;
}

.audit-tabs :deep(.p-tab) {
  @apply px-6 py-3 font-medium;
}

.audit-tabs :deep(.p-tab[data-p-active="true"]) {
  @apply border-b-2 border-blue-500 text-blue-600;
}

.audit-tabs :deep(.p-tabpanels) {
  @apply pt-4;
}
</style>