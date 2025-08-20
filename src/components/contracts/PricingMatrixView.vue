<template>
  <div class="pricing-matrix-view">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h4 class="text-lg font-bold">Service Pricing Matrix</h4>
        <p class="text-gray-600">Base pricing for all managed services</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Add Service" 
          icon="pi pi-plus" 
          size="small"
          @click="showAddServiceDialog = true"
        />
        <Button 
          label="Import Pricing" 
          icon="pi pi-upload" 
          size="small" 
          outlined
          @click="importPricing"
        />
      </div>
    </div>

    <!-- Pricing Matrix Table -->
    <Card>
      <template #content>
        <DataTable 
          :value="pricingMatrix" 
          class="pricing-table"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20]"
          sortMode="multiple"
        >
          <Column field="service" header="Service" sortable>
            <template #body="{ data }">
              <div class="font-medium">{{ data.service }}</div>
            </template>
          </Column>
          
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
              <span class="font-semibold">${{ data.basePrice }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ data.unit }}</span>
            </template>
          </Column>
          
          <Column field="bronze" header="Bronze" sortable>
            <template #body="{ data }">
              <span class="font-semibold">${{ data.bronze }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ data.unit }}</span>
            </template>
          </Column>
          
          <Column field="silver" header="Silver (-10%)" sortable>
            <template #body="{ data }">
              <span class="font-semibold text-blue-600">${{ data.silver }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ data.unit }}</span>
            </template>
          </Column>
          
          <Column field="gold" header="Gold (-20%)" sortable>
            <template #body="{ data }">
              <span class="font-semibold text-yellow-600">${{ data.gold }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ data.unit }}</span>
            </template>
          </Column>
          
          <Column field="platinum" header="Platinum (-25%)" sortable>
            <template #body="{ data }">
              <span class="font-semibold text-purple-600">${{ data.platinum }}</span>
              <span class="text-xs text-gray-500 ml-1">{{ data.unit }}</span>
            </template>
          </Column>
          
          <Column header="Actions">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-pencil" 
                  size="small" 
                  text 
                  @click="editService(data)"
                  v-tooltip="'Edit Service'"
                />
                <Button 
                  icon="pi pi-trash" 
                  size="small" 
                  text 
                  severity="danger"
                  @click="deleteService(data)"
                  v-tooltip="'Delete Service'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add/Edit Service Dialog -->
    <Dialog 
      v-model:visible="showAddServiceDialog" 
      :header="editingService ? 'Edit Service' : 'Add New Service'"
      :style="{ width: '600px' }"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Service Name:</label>
            <InputText v-model="serviceForm.service" class="w-full" placeholder="e.g., Network Monitoring" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Category:</label>
            <Select 
              v-model="serviceForm.category" 
              :options="categories" 
              optionLabel="label" 
              placeholder="Select category"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Base Price:</label>
            <InputNumber 
              v-model="serviceForm.basePrice" 
              mode="currency" 
              currency="USD" 
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Unit:</label>
            <Select 
              v-model="serviceForm.unit" 
              :options="units" 
              optionLabel="label" 
              placeholder="Select unit"
              class="w-full"
            />
          </div>
        </div>

        <div class="p-4 bg-gray-50 rounded">
          <h6 class="font-medium mb-3">Tier Pricing (Auto-calculated)</h6>
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-gray-600">Bronze</div>
              <div class="font-semibold">${{ calculateTierPrice(serviceForm.basePrice, 0) }}</div>
            </div>
            <div>
              <div class="text-gray-600">Silver (-10%)</div>
              <div class="font-semibold text-blue-600">${{ calculateTierPrice(serviceForm.basePrice, 10) }}</div>
            </div>
            <div>
              <div class="text-gray-600">Gold (-20%)</div>
              <div class="font-semibold text-yellow-600">${{ calculateTierPrice(serviceForm.basePrice, 20) }}</div>
            </div>
            <div>
              <div class="text-gray-600">Platinum (-25%)</div>
              <div class="font-semibold text-purple-600">${{ calculateTierPrice(serviceForm.basePrice, 25) }}</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <Button label="Cancel" text @click="cancelServiceForm" />
          <Button 
            :label="editingService ? 'Update Service' : 'Add Service'" 
            severity="success" 
            @click="saveService" 
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const showAddServiceDialog = ref(false);
const editingService = ref(null);

const serviceForm = reactive({
  service: '',
  category: null,
  basePrice: 0,
  unit: null
});

const categories = ref([
  { label: 'Monitoring', value: 'monitoring' },
  { label: 'Management', value: 'management' },
  { label: 'Support', value: 'support' },
  { label: 'Connectivity', value: 'connectivity' }
]);

const units = ref([
  { label: 'per device', value: 'per device' },
  { label: 'per location', value: 'per location' },
  { label: 'per hour', value: 'per hour' },
  { label: 'per month', value: 'per month' }
]);

const pricingMatrix = ref([
  {
    service: 'Network Monitoring',
    category: 'Monitoring',
    basePrice: '25',
    bronze: '25',
    silver: '23',
    gold: '20',
    platinum: '19',
    unit: 'per device'
  },
  {
    service: 'Uptime Monitoring',
    category: 'Monitoring',
    basePrice: '15',
    bronze: '15',
    silver: '14',
    gold: '12',
    platinum: '11',
    unit: 'per location'
  },
  {
    service: 'Performance Monitoring',
    category: 'Monitoring',
    basePrice: '35',
    bronze: '35',
    silver: '32',
    gold: '28',
    platinum: '26',
    unit: 'per device'
  },
  {
    service: 'Device Management',
    category: 'Management',
    basePrice: '45',
    bronze: '45',
    silver: '41',
    gold: '36',
    platinum: '34',
    unit: 'per device'
  },
  {
    service: 'Configuration Management',
    category: 'Management',
    basePrice: '30',
    bronze: '30',
    silver: '27',
    gold: '24',
    platinum: '23',
    unit: 'per device'
  },
  {
    service: 'Firmware Management',
    category: 'Management',
    basePrice: '20',
    bronze: '20',
    silver: '18',
    gold: '16',
    platinum: '15',
    unit: 'per device'
  },
  {
    service: 'Basic Support (8x5)',
    category: 'Support',
    basePrice: '100',
    bronze: '100',
    silver: '90',
    gold: '80',
    platinum: '75',
    unit: 'per location'
  },
  {
    service: 'Premium Support (24x7)',
    category: 'Support',
    basePrice: '250',
    bronze: '250',
    silver: '225',
    gold: '200',
    platinum: '188',
    unit: 'per location'
  },
  {
    service: 'On-site Support',
    category: 'Support',
    basePrice: '150',
    bronze: '150',
    silver: '135',
    gold: '120',
    platinum: '113',
    unit: 'per hour'
  },
  {
    service: 'Backup Connectivity',
    category: 'Connectivity',
    basePrice: '75',
    bronze: '75',
    silver: '68',
    gold: '60',
    platinum: '56',
    unit: 'per location'
  },
  {
    service: 'SD-WAN Management',
    category: 'Connectivity',
    basePrice: '125',
    bronze: '125',
    silver: '113',
    gold: '100',
    platinum: '94',
    unit: 'per location'
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

const calculateTierPrice = (basePrice, discountPercent) => {
  if (!basePrice) return '0';
  const price = parseFloat(basePrice);
  const discounted = price * (1 - discountPercent / 100);
  return discounted.toFixed(0);
};

const editService = (service) => {
  editingService.value = service;
  Object.assign(serviceForm, {
    service: service.service,
    category: categories.value.find(c => c.label === service.category),
    basePrice: parseFloat(service.basePrice),
    unit: units.value.find(u => u.value === service.unit)
  });
  showAddServiceDialog.value = true;
};

const deleteService = (service) => {
  if (confirm(`Are you sure you want to delete "${service.service}"?`)) {
    const index = pricingMatrix.value.findIndex(s => s.service === service.service);
    if (index > -1) {
      pricingMatrix.value.splice(index, 1);
    }
  }
};

const saveService = () => {
  const basePrice = serviceForm.basePrice;
  const newService = {
    service: serviceForm.service,
    category: serviceForm.category?.label,
    basePrice: basePrice.toString(),
    bronze: basePrice.toString(),
    silver: calculateTierPrice(basePrice, 10),
    gold: calculateTierPrice(basePrice, 20),
    platinum: calculateTierPrice(basePrice, 25),
    unit: serviceForm.unit?.value
  };

  if (editingService.value) {
    const index = pricingMatrix.value.findIndex(s => s.service === editingService.value.service);
    if (index > -1) {
      pricingMatrix.value[index] = newService;
    }
  } else {
    pricingMatrix.value.push(newService);
  }

  cancelServiceForm();
};

const cancelServiceForm = () => {
  showAddServiceDialog.value = false;
  editingService.value = null;
  Object.assign(serviceForm, {
    service: '',
    category: null,
    basePrice: 0,
    unit: null
  });
};

const importPricing = () => {
  console.log('Importing pricing from accounting platform...');
};
</script>

<style scoped>
.pricing-matrix-view {
  @apply space-y-6;
}

.pricing-table :deep(.p-datatable-tbody tr:hover) {
  @apply bg-gray-50;
}

.pricing-table :deep(.p-datatable-header-cell) {
  @apply bg-gray-100 font-medium;
}
</style>
