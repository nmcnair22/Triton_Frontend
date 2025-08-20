<template>
  <div class="contract-management-view">
    <!-- Header Section -->
    <Card class="mb-6">
      <template #content>
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-bold mb-2">Contract Management</h3>
            <p class="text-gray-600">Manage customer contracts and pricing</p>
          </div>
          <div class="flex gap-2">
            <Button 
              label="Create Contract" 
              icon="pi pi-plus" 
              severity="success"
              @click="showCreateContractDialog = true"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Contract Management Tabs -->
    <Tabs value="0" class="contract-tabs">
      <TabList>
        <Tab value="0">Active Contracts</Tab>
        <Tab value="1">Contract Templates</Tab>
        <Tab value="2">Pricing Matrix</Tab>
        <Tab value="3">Service Bundles</Tab>
      </TabList>
      <TabPanels>
        <!-- Active Contracts Tab -->
        <TabPanel value="0">
          <ActiveContractsView :customer-id="customerId" />
        </TabPanel>

        <!-- Contract Templates Tab -->
        <TabPanel value="1">
          <ContractTemplatesView />
        </TabPanel>

        <!-- Pricing Matrix Tab -->
        <TabPanel value="2">
          <PricingMatrixView />
        </TabPanel>

        <!-- Service Bundles Tab -->
        <TabPanel value="3">
          <ServiceBundlesView />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Create Contract Dialog -->
    <Dialog 
      v-model:visible="showCreateContractDialog" 
      header="Create New Contract"
      :style="{ width: '800px' }"
      maximizable
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Customer:</label>
            <Select 
              v-model="newContract.customer" 
              :options="customers" 
              optionLabel="name" 
              placeholder="Select customer"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Contract Type:</label>
            <Select 
              v-model="newContract.type" 
              :options="contractTypes" 
              optionLabel="label" 
              placeholder="Select type"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Start Date:</label>
            <DatePicker v-model="newContract.startDate" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date:</label>
            <DatePicker v-model="newContract.endDate" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Pricing Tier:</label>
          <Select 
            v-model="newContract.pricingTier" 
            :options="pricingTiers" 
            optionLabel="label" 
            placeholder="Select pricing tier"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <Button label="Cancel" text @click="showCreateContractDialog = false" />
          <Button label="Create Contract" severity="success" @click="createContract" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ActiveContractsView from '@/components/contracts/ActiveContractsView.vue';
import ContractTemplatesView from '@/components/contracts/ContractTemplatesView.vue';
import PricingMatrixView from '@/components/contracts/PricingMatrixView.vue';
import ServiceBundlesView from '@/components/contracts/ServiceBundlesView.vue';

const props = defineProps({
  customerId: {
    type: [String, Number],
    default: null
  }
});

const showCreateContractDialog = ref(false);
const newContract = ref({
  customer: null,
  type: null,
  startDate: null,
  endDate: null,
  pricingTier: null
});

const customers = ref([
  { name: 'Carters', id: 291 },
  { name: 'Target Stores', id: 292 }
]);

const contractTypes = ref([
  { label: 'Standard Service Agreement', value: 'standard' },
  { label: 'Enterprise Contract', value: 'enterprise' },
  { label: 'Volume Discount Agreement', value: 'volume' }
]);

const pricingTiers = ref([
  { label: 'Bronze - Base Price', value: 'bronze' },
  { label: 'Silver (-10%)', value: 'silver' },
  { label: 'Gold (-20%)', value: 'gold' },
  { label: 'Platinum (-25%)', value: 'platinum' }
]);

const createContract = () => {
  console.log('Creating contract:', newContract.value);
  showCreateContractDialog.value = false;
  // Reset form
  newContract.value = {
    customer: null,
    type: null,
    startDate: null,
    endDate: null,
    pricingTier: null
  };
};
</script>

<style scoped>
.contract-management-view {
  @apply space-y-6;
}

.contract-tabs :deep(.p-tablist) {
  @apply border-b border-gray-200 mb-6;
}

.contract-tabs :deep(.p-tab) {
  @apply px-4 py-3 font-medium;
}

.contract-tabs :deep(.p-tab[data-p-active="true"]) {
  @apply border-b-2 border-blue-500 text-blue-600;
}

.contract-tabs :deep(.p-tabpanels) {
  @apply pt-4;
}
</style>
