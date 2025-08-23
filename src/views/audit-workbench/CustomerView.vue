<template>
  <div class="customer-view p-6">
    <!-- Customer Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Customer Management</h1>
        <p class="text-surface-600 dark:text-surface-400 mb-1">
          Manage contracts, pricing, service bundles, and location profiles for Customer {{ customerId }}
        </p>
      </div>
      
      <div class="flex gap-2 mt-4 md:mt-0">
        <Button 
          label="Back to Dashboard" 
          icon="pi pi-arrow-left" 
          outlined
          @click="goToDashboard"
        />
        <Button 
          label="Location Workbench" 
          icon="pi pi-cog" 
          outlined
          @click="goToOriginalLocations"
        />
      </div>
    </div>

    <!-- Active Contract Selector -->
    <Card class="mb-4 shadow-sm">
      <template #content>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <label class="text-sm font-semibold text-surface-700">Active Contract:</label>
            <Select
              v-model="selectedContractId"
              :options="contractOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select active contract"
              class="w-80"
              @change="onContractChange"
              :disabled="customerContractsStore.loading.contracts || customerContractsStore.contracts.length === 0"
            />
            <Tag 
              v-if="customerContractsStore.currentContract"
              :value="customerContractsStore.currentContract.status" 
              :severity="getStatusSeverity(customerContractsStore.currentContract.status)"
            />
          </div>
          <div v-if="customerContractsStore.currentContract" class="text-sm text-surface-600">
            <span>Term: {{ formatDate(customerContractsStore.currentContract.term_start) }} - {{ formatDate(customerContractsStore.currentContract.term_end) }}</span>
            <span v-if="customerContractsStore.currentContract.global_discount_percent" class="ml-4">
              Global Discount: {{ customerContractsStore.currentContract.global_discount_percent }}%
            </span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Main Tabs -->
    <Card class="shadow-sm">
      <template #content>
        <Tabs v-model:value="activeTab" class="customer-tabs">
          <TabList>
            <Tab value="0">
              <i class="pi pi-file-edit mr-2"></i>
              Contracts
            </Tab>
            <Tab value="1">
              <i class="pi pi-calculator mr-2"></i>
              Schedule of Fees
            </Tab>
            <Tab value="2">
              <i class="pi pi-box mr-2"></i>
              Service Bundles
              <Badge v-if="bundleCount > 0" :value="bundleCount" class="ml-2" severity="info" />
            </Tab>
            <Tab value="3">
              <i class="pi pi-bookmark mr-2"></i>
              Location Profiles
              <Badge v-if="profileCount > 0" :value="profileCount" class="ml-2" severity="success" />
            </Tab>
            <Tab value="4">
              <i class="pi pi-map mr-2"></i>
              Locations
              <Badge v-if="locationsStore?.totalLocations > 0" :value="locationsStore.totalLocations" class="ml-2" />
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel value="0">
              <ContractsTab :customer-id="customerId" @switch-tab="switchToTab" />
            </TabPanel>
            
            <TabPanel value="1">
              <SofTab :customer-id="customerId" @switch-tab="switchToTab" />
            </TabPanel>
            
            <TabPanel value="2">
              <BundlesTab :customer-id="customerId" @switch-tab="switchToTab" />
            </TabPanel>
            
            <TabPanel value="3">
              <ProfilesTab :customer-id="customerId" @switch-tab="switchToTab" />
            </TabPanel>
            
            <TabPanel value="4">
              <!-- Embed existing LocationsList unchanged -->
              <LocationsTab :customer-id="customerId" @switch-tab="switchToTab" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';
import { useLocationsStore } from '@/stores/locationsStore';
// import QueueMonitor from '@/components/audit-workbench/QueueMonitor.vue';

// Import tab components directly instead of lazy loading
import ContractsTab from '@/components/audit-workbench/customer/ContractsTab.vue';
import SofTab from '@/components/audit-workbench/customer/SofTabEnhanced.vue';
import BundlesTab from '@/components/audit-workbench/customer/BundlesTabPhase1.vue';
import ProfilesTab from '@/components/audit-workbench/customer/LocationProfilesTabEnhanced.vue';
import LocationsTab from '@/components/audit-workbench/customer/LocationsTab.vue';

const route = useRoute();
const router = useRouter();
const customerContractsStore = useCustomerContractsStore();
const locationsStore = useLocationsStore();

// State
const activeTab = ref("0"); // Default to Contracts tab for contract-centric workflow
const selectedContractId = ref(null);

// Computed
const customerId = computed(() => route.params.customerId);

const bundleCount = computed(() => customerContractsStore.bundleCount);
const profileCount = computed(() => customerContractsStore.profileCount);

const contractOptions = computed(() => {
  return customerContractsStore.contracts.map(contract => ({
    label: `${contract.name}`,
    value: contract.id
  }));
});

// Methods
const goToDashboard = () => {
  router.push({
    name: 'AuditDashboard',
    params: { customerId: customerId.value }
  });
};

const goToOriginalLocations = () => {
  router.push({
    name: 'AuditLocations',
    params: { customerId: customerId.value }
  });
};

const switchToTab = (tabIndex) => {
  activeTab.value = tabIndex;
};

const onContractChange = async () => {
  if (!selectedContractId.value) return;
  
  const contract = customerContractsStore.contracts.find(c => c.id === selectedContractId.value);
  if (!contract) return;
  
  await customerContractsStore.switchContract(contract);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

const getStatusSeverity = (status) => {
  const severityMap = {
    'Proposed': 'secondary',
    'Signed': 'info',
    'Active': 'success',
    'Suspended': 'warning',
    'Cancelled': 'danger',
    'Expired': 'secondary'
  };
  return severityMap[status] || 'secondary';
};

// Watchers
watch(() => route.params.customerId, async (newCustomerId) => {
  if (newCustomerId) {
    await customerContractsStore.initializeCustomer(newCustomerId);
  }
}, { immediate: true });

// Sync dropdown with current contract
watch(
  () => customerContractsStore.currentContract?.id,
  (newId) => {
    selectedContractId.value = newId;
  },
  { immediate: true }
);

// Lifecycle
onMounted(async () => {
  const routeCustomerId = customerId.value;
  if (routeCustomerId) {
    await customerContractsStore.initializeCustomer(routeCustomerId);
    
    // Initialize selected contract
    if (customerContractsStore.currentContract) {
      selectedContractId.value = customerContractsStore.currentContract.id;
    }
  }
});
</script>

<style scoped>
.customer-view {
  max-width: 1600px;
  margin: 0 auto;
}

.customer-tabs :deep(.p-tablist) {
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 1.5rem;
}

.customer-tabs :deep(.p-tab) {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.customer-tabs :deep(.p-tab[data-p-active="true"]) {
  border-bottom: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.customer-tabs :deep(.p-tabpanels) {
  padding: 0;
  background: transparent;
}

.customer-tabs :deep(.p-tabpanel) {
  padding: 1.5rem 0;
}

@media (max-width: 768px) {
  .customer-view {
    padding: 1rem;
  }
  
  .customer-tabs :deep(.p-tab) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}
</style>