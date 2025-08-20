<template>
  <div class="service-bundles-view">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h4 class="text-lg font-bold">Service Bundles</h4>
        <p class="text-gray-600">Create and manage service bundles for better pricing</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Create Bundle" 
          icon="pi pi-plus" 
          severity="success"
          @click="showCreateBundleDialog = true"
        />
      </div>
    </div>

    <!-- Service Bundles Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Network Monitoring LAN Bundle -->
      <Card class="bundle-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex justify-between items-start">
              <div class="flex items-center">
                <i class="pi pi-sitemap text-blue-500 mr-2 text-xl"></i>
                <div>
                  <h5 class="font-bold">Network Monitoring LAN Bundle</h5>
                  <p class="text-sm text-gray-600">Complete LAN monitoring package for 5 devices</p>
                </div>
              </div>
              <div class="flex gap-2">
                <Badge value="Single Category" severity="info" class="text-xs" />
                <Badge value="Monitoring" severity="info" class="text-xs" />
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-4">
            <!-- Bundle Pricing -->
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center">
                <div class="text-2xl font-bold">$200</div>
                <div class="text-xs text-gray-600">Bundle Price</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">$75</div>
                <div class="text-xs text-gray-600">Customer Savings</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">2</div>
                <div class="text-xs text-gray-600">Components</div>
              </div>
            </div>

            <!-- Bundle Components -->
            <div class="space-y-2">
              <h6 class="font-medium text-sm flex items-center">
                <i class="pi pi-list mr-2"></i>Bundle Components
              </h6>
              <div class="space-y-2">
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div class="flex items-center">
                    <Badge value="service" severity="secondary" class="mr-2 text-xs" />
                    <span>LAN Device Monitoring</span>
                  </div>
                  <span class="font-semibold">5 × $25 = $125</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div class="flex items-center">
                    <Badge value="service" severity="secondary" class="mr-2 text-xs" />
                    <span>Network Performance Monitoring</span>
                  </div>
                  <span class="font-semibold">1 × $150 = $150</span>
                </div>
              </div>
              
              <div class="flex justify-between items-center pt-2 border-t text-sm">
                <span class="font-medium">Total Component Value: $275</span>
                <div class="text-right">
                  <div class="font-bold text-green-600">Bundle Discount: 27% off</div>
                </div>
              </div>
            </div>

            <!-- Bundle Actions -->
            <div class="flex gap-2 pt-4 border-t">
              <Button 
                label="Edit Bundle" 
                icon="pi pi-pencil" 
                size="small" 
                text
                @click="editBundle('lan-monitoring')"
              />
              <Button 
                label="Duplicate" 
                icon="pi pi-clone" 
                size="small" 
                text
                @click="duplicateBundle('lan-monitoring')"
              />
              <Button 
                label="Delete" 
                icon="pi pi-trash" 
                size="small" 
                text
                severity="danger"
                @click="deleteBundle('lan-monitoring')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Complete Store Management Package -->
      <Card class="bundle-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex justify-between items-start">
              <div class="flex items-center">
                <i class="pi pi-building text-purple-500 mr-2 text-xl"></i>
                <div>
                  <h5 class="font-bold">Complete Store Management Package</h5>
                  <p class="text-sm text-gray-600">Full monitoring and management solution</p>
                </div>
              </div>
              <div class="flex gap-2">
                <Badge value="Mixed Product" severity="warning" class="text-xs" />
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-4">
            <!-- Bundle Pricing -->
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center">
                <div class="text-2xl font-bold">$650</div>
                <div class="text-xs text-gray-600">Bundle Price</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">$150</div>
                <div class="text-xs text-gray-600">Customer Savings</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">3</div>
                <div class="text-xs text-gray-600">Components</div>
              </div>
            </div>

            <!-- Bundle Components -->
            <div class="space-y-2">
              <h6 class="font-medium text-sm flex items-center">
                <i class="pi pi-list mr-2"></i>Bundle Components
              </h6>
              <div class="space-y-2">
                <div class="flex justify-between items-center p-2 bg-blue-50 rounded text-sm border-l-4 border-blue-500">
                  <div class="flex items-center">
                    <Badge value="bundle" severity="info" class="mr-2 text-xs" />
                    <span>Network Monitoring LAN Bundle</span>
                  </div>
                  <span class="font-semibold">1 × $200 = $200</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div class="flex items-center">
                    <Badge value="service" severity="secondary" class="mr-2 text-xs" />
                    <span>24/7 Help Desk Support</span>
                  </div>
                  <span class="font-semibold">1 × $500 = $500</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div class="flex items-center">
                    <Badge value="service" severity="secondary" class="mr-2 text-xs" />
                    <span>Backup Management</span>
                  </div>
                  <span class="font-semibold">1 × $100 = $100</span>
                </div>
              </div>
              
              <div class="flex justify-between items-center pt-2 border-t text-sm">
                <span class="font-medium">Total Component Value: $800</span>
                <div class="text-right">
                  <div class="font-bold text-green-600">Bundle Discount: 19% off</div>
                </div>
              </div>
            </div>

            <!-- Bundle Actions -->
            <div class="flex gap-2 pt-4 border-t">
              <Button 
                label="Edit Bundle" 
                icon="pi pi-pencil" 
                size="small" 
                text
                @click="editBundle('complete-store')"
              />
              <Button 
                label="Duplicate" 
                icon="pi pi-clone" 
                size="small" 
                text
                @click="duplicateBundle('complete-store')"
              />
              <Button 
                label="Delete" 
                icon="pi pi-trash" 
                size="small" 
                text
                severity="danger"
                @click="deleteBundle('complete-store')"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Create Bundle Dialog -->
    <Dialog 
      v-model:visible="showCreateBundleDialog" 
      header="Create Service Bundle"
      :style="{ width: '800px' }"
      maximizable
    >
      <div class="space-y-6">
        <!-- Bundle Basic Info -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Bundle Name:</label>
              <InputText v-model="bundleForm.name" class="w-full" placeholder="e.g., Premium Support Bundle" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Bundle Type:</label>
              <Select 
                v-model="bundleForm.type" 
                :options="bundleTypes" 
                optionLabel="label" 
                placeholder="Select type"
                class="w-full"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Description:</label>
            <Textarea v-model="bundleForm.description" class="w-full" rows="2" />
          </div>
        </div>

        <!-- Bundle Components -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h6 class="font-medium">Bundle Components</h6>
            <Button 
              label="Add Component" 
              icon="pi pi-plus" 
              size="small"
              @click="addComponent"
            />
          </div>
          
          <div class="space-y-2">
            <div 
              v-for="(component, index) in bundleForm.components" 
              :key="index"
              class="flex items-center gap-4 p-3 border rounded"
            >
              <Select 
                v-model="component.type" 
                :options="componentTypes" 
                optionLabel="label" 
                placeholder="Component type"
                class="w-32"
              />
              <Select 
                v-model="component.item" 
                :options="getAvailableItems(component.type?.value)" 
                optionLabel="label" 
                placeholder="Select item"
                class="flex-1"
              />
              <div class="w-20">
                <InputNumber v-model="component.quantity" placeholder="Qty" class="w-full" />
              </div>
              <div class="w-24 text-right font-semibold">
                ${{ calculateComponentPrice(component) }}
              </div>
              <Button 
                icon="pi pi-trash" 
                size="small" 
                text 
                severity="danger"
                @click="removeComponent(index)"
              />
            </div>
          </div>
        </div>

        <!-- Bundle Pricing -->
        <div class="p-4 bg-gray-50 rounded">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Total Component Value:</label>
              <div class="text-xl font-bold">${{ calculateTotalValue() }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Bundle Price:</label>
              <InputNumber 
                v-model="bundleForm.price" 
                mode="currency" 
                currency="USD" 
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Customer Savings:</label>
              <div class="text-xl font-bold text-green-600">
                ${{ calculateTotalValue() - (bundleForm.price || 0) }}
                ({{ calculateDiscountPercent() }}% off)
              </div>
            </div>
          </div>
        </div>

        <!-- Dialog Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button label="Cancel" text @click="cancelBundleForm" />
          <Button label="Create Bundle" severity="success" @click="createBundle" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const showCreateBundleDialog = ref(false);

const bundleForm = reactive({
  name: '',
  type: null,
  description: '',
  price: 0,
  components: []
});

const bundleTypes = ref([
  { label: 'Single Product Bundle', value: 'single' },
  { label: 'Multi-Product Bundle', value: 'multi' }
]);

const componentTypes = ref([
  { label: 'Service', value: 'service' },
  { label: 'Bundle', value: 'bundle' }
]);

const services = ref([
  { label: 'Network Monitoring ($25)', value: 'network-monitoring', price: 25 },
  { label: 'Device Management ($45)', value: 'device-management', price: 45 },
  { label: 'Premium Support ($250)', value: 'premium-support', price: 250 },
  { label: '24/7 Help Desk ($500)', value: 'help-desk', price: 500 },
  { label: 'Backup Management ($100)', value: 'backup-management', price: 100 }
]);

const bundles = ref([
  { label: 'Network Monitoring LAN Bundle ($200)', value: 'lan-monitoring', price: 200 }
]);

const getAvailableItems = (type) => {
  if (type === 'service') return services.value;
  if (type === 'bundle') return bundles.value;
  return [];
};

const addComponent = () => {
  bundleForm.components.push({
    type: null,
    item: null,
    quantity: 1
  });
};

const removeComponent = (index) => {
  bundleForm.components.splice(index, 1);
};

const calculateComponentPrice = (component) => {
  if (!component.item) return 0;
  return (component.item.price || 0) * (component.quantity || 0);
};

const calculateTotalValue = () => {
  return bundleForm.components.reduce((total, component) => {
    return total + calculateComponentPrice(component);
  }, 0);
};

const calculateDiscountPercent = () => {
  const total = calculateTotalValue();
  const price = bundleForm.price || 0;
  if (total === 0) return 0;
  return Math.round(((total - price) / total) * 100);
};

const editBundle = (bundleId) => {
  console.log('Editing bundle:', bundleId);
};

const duplicateBundle = (bundleId) => {
  console.log('Duplicating bundle:', bundleId);
};

const deleteBundle = (bundleId) => {
  if (confirm('Are you sure you want to delete this bundle?')) {
    console.log('Deleting bundle:', bundleId);
  }
};

const createBundle = () => {
  console.log('Creating bundle:', bundleForm);
  cancelBundleForm();
};

const cancelBundleForm = () => {
  showCreateBundleDialog.value = false;
  Object.assign(bundleForm, {
    name: '',
    type: null,
    description: '',
    price: 0,
    components: []
  });
};
</script>

<style scoped>
.service-bundles-view {
  @apply space-y-6;
}

.bundle-card {
  @apply transition-shadow duration-200;
}

.bundle-card:hover {
  @apply shadow-lg;
}
</style>
