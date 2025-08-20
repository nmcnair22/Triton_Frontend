<template>
  <div class="active-contracts-view">
    <!-- Active Contracts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Carters Contract -->
      <Card class="contract-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="text-lg font-bold">Carters</h4>
                <div class="text-sm text-gray-600">CTR-2024-001</div>
              </div>
              <div class="flex gap-2">
                <Badge value="Gold" severity="warning" />
                <Badge value="active" severity="success" />
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-4">
            <!-- Contract Details -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-gray-600">Contract Period</div>
                <div class="font-semibold">2024-01-01 - 2026-12-31</div>
              </div>
              <div>
                <div class="text-gray-600">Monthly Value</div>
                <div class="font-semibold text-green-600">$15,750</div>
              </div>
              <div>
                <div class="text-gray-600">Discount</div>
                <div class="font-semibold text-blue-600">20%</div>
              </div>
              <div>
                <div class="text-gray-600">Services</div>
                <div class="font-semibold">11 services</div>
              </div>
            </div>

            <!-- Contract Actions -->
            <div class="flex gap-2 pt-4 border-t">
              <Button 
                label="View Contract" 
                icon="pi pi-eye" 
                size="small" 
                text
                @click="viewContract('carters')"
              />
              <Button 
                label="Modify Terms" 
                icon="pi pi-pencil" 
                size="small" 
                text
                @click="modifyContract('carters')"
              />
              <Button 
                label="Generate Invoice" 
                icon="pi pi-file-pdf" 
                size="small" 
                text
                @click="generateInvoice('carters')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Target Stores Contract -->
      <Card class="contract-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="text-lg font-bold">Target Stores</h4>
                <div class="text-sm text-gray-600">CTR-2024-002</div>
              </div>
              <div class="flex gap-2">
                <Badge value="Platinum" severity="info" />
                <Badge value="active" severity="success" />
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-4">
            <!-- Contract Details -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-gray-600">Contract Period</div>
                <div class="font-semibold">2024-02-01 - 2027-01-31</div>
              </div>
              <div>
                <div class="text-gray-600">Monthly Value</div>
                <div class="font-semibold text-green-600">$22,500</div>
              </div>
              <div>
                <div class="text-gray-600">Discount</div>
                <div class="font-semibold text-purple-600">25%</div>
              </div>
              <div>
                <div class="text-gray-600">Services</div>
                <div class="font-semibold">11 services</div>
              </div>
            </div>

            <!-- Contract Actions -->
            <div class="flex gap-2 pt-4 border-t">
              <Button 
                label="View Contract" 
                icon="pi pi-eye" 
                size="small" 
                text
                @click="viewContract('target')"
              />
              <Button 
                label="Modify Terms" 
                icon="pi pi-pencil" 
                size="small" 
                text
                @click="modifyContract('target')"
              />
              <Button 
                label="Generate Invoice" 
                icon="pi pi-file-pdf" 
                size="small" 
                text
                @click="generateInvoice('target')"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Contract Details Table -->
    <Card class="mt-6">
      <template #content>
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-bold">Contract Services Overview</h5>
          <div class="flex gap-2">
            <Button 
              label="Export Contracts" 
              icon="pi pi-download" 
              size="small" 
              outlined
              @click="exportContracts"
            />
            <Button 
              label="Compare Contracts" 
              icon="pi pi-clone" 
              size="small" 
              outlined
              @click="compareContracts"
            />
          </div>
        </div>

        <DataTable 
          :value="contractServices" 
          class="contract-services-table"
          :paginator="true"
          :rows="10"
          sortMode="multiple"
        >
          <Column field="customer" header="Customer" sortable>
            <template #body="{ data }">
              <div class="flex items-center">
                <Avatar 
                  :label="data.customer.charAt(0)" 
                  class="mr-2" 
                  size="small"
                  :style="{ backgroundColor: data.customer === 'Carters' ? '#f59e0b' : '#8b5cf6' }"
                />
                <span class="font-medium">{{ data.customer }}</span>
              </div>
            </template>
          </Column>
          
          <Column field="service" header="Service" sortable />
          
          <Column field="category" header="Category" sortable>
            <template #body="{ data }">
              <Badge 
                :value="data.category" 
                :severity="getCategorySeverity(data.category)"
                class="text-xs"
              />
            </template>
          </Column>
          
          <Column field="basePrice" header="Base Price" sortable>
            <template #body="{ data }">
              <span class="text-gray-500">${{ data.basePrice }}</span>
            </template>
          </Column>
          
          <Column field="contractPrice" header="Contract Price" sortable>
            <template #body="{ data }">
              <span class="font-semibold text-green-600">${{ data.contractPrice }}</span>
            </template>
          </Column>
          
          <Column field="savings" header="Savings" sortable>
            <template #body="{ data }">
              <span class="font-semibold text-blue-600">${{ data.savings }}</span>
              <span class="text-xs text-gray-500 ml-1">({{ data.discountPercent }}%)</span>
            </template>
          </Column>
          
          <Column field="quantity" header="Quantity" sortable>
            <template #body="{ data }">
              <span class="font-medium">{{ data.quantity }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ data.unit }}</span>
            </template>
          </Column>
          
          <Column field="monthlyTotal" header="Monthly Total" sortable>
            <template #body="{ data }">
              <span class="font-bold text-green-600">${{ data.monthlyTotal }}</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Contract Detail Dialog -->
    <Dialog 
      v-model:visible="showContractDialog" 
      :header="selectedContract ? `Contract Details - ${selectedContract}` : 'Contract Details'"
      :style="{ width: '900px' }"
      maximizable
    >
      <div v-if="selectedContract" class="contract-details">
        <!-- Contract header info will go here -->
        <div class="text-center text-gray-500 py-8">
          Contract details for {{ selectedContract }} will be displayed here
        </div>
      </div>
    </Dialog>

    <!-- Modify Contract Dialog -->
    <Dialog 
      v-model:visible="showModifyDialog" 
      :header="selectedContract ? `Modify Contract - ${selectedContract}` : 'Modify Contract'"
      :style="{ width: '1000px' }"
      maximizable
    >
      <div v-if="selectedContract" class="modify-contract space-y-6">
        <!-- Contract Overview -->
        <Card>
          <template #content>
            <div class="flex justify-between items-start">
              <div>
                <h5 class="font-bold text-lg">{{ selectedContract }}</h5>
                <div class="text-sm text-gray-600">Contract ID: {{ getContractId(selectedContract) }}</div>
              </div>
              <div class="flex gap-2">
                <Badge :value="getContractTier(selectedContract)" :severity="getTierSeverity(selectedContract)" />
                <Badge value="active" severity="success" />
              </div>
            </div>
          </template>
        </Card>

        <!-- Service Pricing Overrides -->
        <Card>
          <template #content>
            <div class="flex justify-between items-center mb-4">
              <h6 class="font-bold">Service Pricing Overrides</h6>
              <Button 
                label="Add Service Override" 
                icon="pi pi-plus" 
                size="small"
                @click="addServiceOverride"
              />
            </div>

            <DataTable 
              :value="contractOverrides" 
              class="contract-overrides-table"
              editMode="row" 
              v-model:editingRows="editingRows"
              @row-edit-save="onRowEditSave"
              @row-edit-cancel="onRowEditCancel"
            >
              <Column field="service" header="Service">
                <template #body="{ data }">
                  <span class="font-medium">{{ data.service }}</span>
                </template>
              </Column>
              
              <Column field="basePrice" header="Matrix Price">
                <template #body="{ data }">
                  <span class="text-gray-500">${{ data.basePrice }}</span>
                </template>
              </Column>
              
              <Column field="tierPrice" header="Tier Price">
                <template #body="{ data }">
                  <span class="font-medium">${{ data.tierPrice }}</span>
                </template>
              </Column>
              
              <Column field="contractPrice" header="Contract Price">
                <template #body="{ data }">
                  <span class="font-semibold text-green-600">${{ data.contractPrice }}</span>
                </template>
                <template #editor="{ data, field }">
                  <InputNumber 
                    v-model="data[field]" 
                    mode="currency" 
                    currency="USD" 
                    class="w-full"
                  />
                </template>
              </Column>
              
              <Column field="overrideReason" header="Override Reason">
                <template #body="{ data }">
                  <span class="text-sm">{{ data.overrideReason || 'Contract negotiation' }}</span>
                </template>
                <template #editor="{ data, field }">
                  <InputText v-model="data[field]" class="w-full" />
                </template>
              </Column>
              
              <Column field="savings" header="Savings">
                <template #body="{ data }">
                  <div class="text-right">
                    <div class="font-semibold" :class="data.savings > 0 ? 'text-green-600' : 'text-red-600'">
                      ${{ Math.abs(data.savings) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ data.savings > 0 ? 'savings' : 'additional cost' }}
                    </div>
                  </div>
                </template>
              </Column>
              
              <Column :rowEditor="true" style="width:10%; min-width:8rem" bodyStyle="text-align:center"></Column>
              
              <Column header="Actions" style="width:10%">
                <template #body="{ data, index }">
                  <Button 
                    icon="pi pi-trash" 
                    size="small" 
                    text 
                    severity="danger"
                    @click="removeServiceOverride(index)"
                    v-tooltip="'Remove Override'"
                  />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Contract Terms -->
        <Card>
          <template #content>
            <h6 class="font-bold mb-4">Contract Terms & Conditions</h6>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Contract Start Date:</label>
                  <DatePicker v-model="contractTerms.startDate" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Contract End Date:</label>
                  <DatePicker v-model="contractTerms.endDate" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Payment Terms:</label>
                  <Select 
                    v-model="contractTerms.paymentTerms" 
                    :options="paymentTermsOptions" 
                    optionLabel="label" 
                    class="w-full"
                  />
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Pricing Tier Override:</label>
                  <Select 
                    v-model="contractTerms.pricingTier" 
                    :options="pricingTierOptions" 
                    optionLabel="label" 
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Auto-Renewal:</label>
                  <ToggleSwitch v-model="contractTerms.autoRenewal" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Notice Period (days):</label>
                  <InputNumber v-model="contractTerms.noticePeriod" class="w-full" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Contract Summary -->
        <Card>
          <template #content>
            <h6 class="font-bold mb-4">Updated Contract Summary</h6>
            <div class="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${{ calculateNewMonthlyValue() }}</div>
                <div class="text-sm text-gray-600">New Monthly Value</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold" :class="calculateTotalSavings() > 0 ? 'text-green-600' : 'text-red-600'">
                  ${{ Math.abs(calculateTotalSavings()) }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ calculateTotalSavings() > 0 ? 'Total Savings' : 'Additional Cost' }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ contractOverrides.length }}</div>
                <div class="text-sm text-gray-600">Service Overrides</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">{{ calculateDiscountPercent() }}%</div>
                <div class="text-sm text-gray-600">Effective Discount</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Dialog Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button label="Cancel" text @click="cancelModifyContract" />
          <Button label="Save Changes" severity="success" @click="saveContractChanges" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  customerId: {
    type: [String, Number],
    default: null
  }
});

const showContractDialog = ref(false);
const showModifyDialog = ref(false);
const selectedContract = ref(null);
const editingRows = ref([]);
const contractOverrides = ref([]);
const contractTerms = ref({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2026-12-31'),
  paymentTerms: { label: 'Net 30', value: 'net30' },
  pricingTier: { label: 'Gold (-20%)', value: 'gold' },
  autoRenewal: true,
  noticePeriod: 60
});

const paymentTermsOptions = ref([
  { label: 'Net 15', value: 'net15' },
  { label: 'Net 30', value: 'net30' },
  { label: 'Net 45', value: 'net45' },
  { label: 'Net 60', value: 'net60' }
]);

const pricingTierOptions = ref([
  { label: 'Bronze - Base Price', value: 'bronze' },
  { label: 'Silver (-10%)', value: 'silver' },
  { label: 'Gold (-20%)', value: 'gold' },
  { label: 'Platinum (-25%)', value: 'platinum' }
]);

const contractServices = ref([
  // Carters services
  {
    customer: 'Carters',
    service: 'Network Monitoring',
    category: 'Monitoring',
    basePrice: '25',
    contractPrice: '20',
    savings: '5',
    discountPercent: '20',
    quantity: '150',
    unit: 'devices',
    monthlyTotal: '3000'
  },
  {
    customer: 'Carters',
    service: 'Device Management',
    category: 'Management',
    basePrice: '45',
    contractPrice: '36',
    savings: '9',
    discountPercent: '20',
    quantity: '150',
    unit: 'devices',
    monthlyTotal: '5400'
  },
  {
    customer: 'Carters',
    service: 'Premium Support (24x7)',
    category: 'Support',
    basePrice: '250',
    contractPrice: '200',
    savings: '50',
    discountPercent: '20',
    quantity: '50',
    unit: 'locations',
    monthlyTotal: '10000'
  },
  // Target services
  {
    customer: 'Target Stores',
    service: 'Network Monitoring',
    category: 'Monitoring',
    basePrice: '25',
    contractPrice: '19',
    savings: '6',
    discountPercent: '25',
    quantity: '200',
    unit: 'devices',
    monthlyTotal: '3800'
  },
  {
    customer: 'Target Stores',
    service: 'Configuration Management',
    category: 'Management',
    basePrice: '30',
    contractPrice: '23',
    savings: '7',
    discountPercent: '25',
    quantity: '200',
    unit: 'devices',
    monthlyTotal: '4600'
  },
  {
    customer: 'Target Stores',
    service: 'Premium Support (24x7)',
    category: 'Support',
    basePrice: '250',
    contractPrice: '188',
    savings: '62',
    discountPercent: '25',
    quantity: '75',
    unit: 'locations',
    monthlyTotal: '14100'
  }
]);

const getCategorySeverity = (category) => {
  const severities = {
    'Monitoring': 'info',
    'Management': 'success',
    'Support': 'warning',
    'Connectivity': 'secondary'
  };
  return severities[category] || 'secondary';
};

const viewContract = (customer) => {
  selectedContract.value = customer;
  showContractDialog.value = true;
};

const modifyContract = (customer) => {
  selectedContract.value = customer;
  loadContractOverrides(customer);
  showModifyDialog.value = true;
};

const generateInvoice = (customer) => {
  console.log('Generating invoice for:', customer);
};

const exportContracts = () => {
  console.log('Exporting contracts...');
};

const compareContracts = () => {
  console.log('Comparing contracts...');
};

// Contract modification functions
const loadContractOverrides = (customer) => {
  // Load existing contract overrides for the customer
  const customerServices = contractServices.value.filter(s => s.customer === customer);
  contractOverrides.value = customerServices.map(service => ({
    service: service.service,
    basePrice: parseInt(service.basePrice),
    tierPrice: parseInt(service.contractPrice) + parseInt(service.savings), // Calculate tier price
    contractPrice: parseInt(service.contractPrice),
    overrideReason: 'Contract negotiation',
    savings: parseInt(service.savings)
  }));
};

const getContractId = (customer) => {
  return customer === 'Carters' ? 'CTR-2024-001' : 'CTR-2024-002';
};

const getContractTier = (customer) => {
  return customer === 'Carters' ? 'Gold' : 'Platinum';
};

const getTierSeverity = (customer) => {
  return customer === 'Carters' ? 'warning' : 'info';
};

const addServiceOverride = () => {
  contractOverrides.value.push({
    service: 'New Service',
    basePrice: 0,
    tierPrice: 0,
    contractPrice: 0,
    overrideReason: '',
    savings: 0
  });
};

const removeServiceOverride = (index) => {
  contractOverrides.value.splice(index, 1);
};

const onRowEditSave = (event) => {
  const { newData, index } = event;
  // Recalculate savings
  newData.savings = newData.tierPrice - newData.contractPrice;
  contractOverrides.value[index] = newData;
};

const onRowEditCancel = (event) => {
  // No action needed for cancel
};

const calculateNewMonthlyValue = () => {
  return contractOverrides.value.reduce((total, override) => {
    return total + (override.contractPrice || 0);
  }, 0);
};

const calculateTotalSavings = () => {
  return contractOverrides.value.reduce((total, override) => {
    return total + (override.savings || 0);
  }, 0);
};

const calculateDiscountPercent = () => {
  const totalTierPrice = contractOverrides.value.reduce((total, override) => {
    return total + (override.tierPrice || 0);
  }, 0);
  const totalContractPrice = calculateNewMonthlyValue();
  
  if (totalTierPrice === 0) return 0;
  return Math.round(((totalTierPrice - totalContractPrice) / totalTierPrice) * 100);
};

const saveContractChanges = () => {
  console.log('Saving contract changes:', {
    customer: selectedContract.value,
    overrides: contractOverrides.value,
    terms: contractTerms.value
  });
  showModifyDialog.value = false;
};

const cancelModifyContract = () => {
  showModifyDialog.value = false;
  contractOverrides.value = [];
};
</script>

<style scoped>
.active-contracts-view {
  @apply space-y-6;
}

.contract-card {
  @apply transition-shadow duration-200;
}

.contract-card:hover {
  @apply shadow-lg;
}

.contract-services-table :deep(.p-datatable-tbody tr:hover) {
  @apply bg-gray-50;
}
</style>
