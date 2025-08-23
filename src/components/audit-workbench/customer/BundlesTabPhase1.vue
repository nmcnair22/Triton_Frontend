<template>
  <div class="bundles-tab-phase1">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Service Bundles</h3>
        <p class="text-surface-600 dark:text-surface-400">
          Create service bundles from billing line items and manage license allocations
        </p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Import from Billing" 
          icon="pi pi-download" 
          severity="info"
          @click="showBillingImportDialog = true"
          :disabled="!hasActiveContract || !hasLocationProfile"
          v-tooltip="'Create bundles from billing line items'"
        />
        <Button 
          label="Import from SOF" 
          icon="pi pi-file-import" 
          outlined
          @click="showImportDialog = true"
          :disabled="!hasActiveContract || sofProducts.length === 0"
        />
        <Button 
          label="Create Bundle" 
          icon="pi pi-plus" 
          @click="openCreateBundle"
          :disabled="!hasActiveContract"
        />
      </div>
    </div>

    <!-- Prerequisites Check -->
    <Card v-if="!hasActiveContract" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Contract Required</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Service bundles require an active contract to manage.
        </p>
        <Button 
          label="Go to Contracts" 
          icon="pi pi-arrow-left"
          @click="$emit('switch-tab', '0')"
        />
      </template>
    </Card>

    <!-- Main Content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">Total Bundles</p>
                <p class="text-2xl font-bold">{{ bundles.length }}</p>
              </div>
              <i class="pi pi-box text-3xl text-primary-300"></i>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">From Billing</p>
                <p class="text-2xl font-bold text-blue-600">{{ bundlesFromBilling.length }}</p>
              </div>
              <i class="pi pi-receipt text-3xl text-blue-300"></i>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">Total Licenses</p>
                <p class="text-2xl font-bold text-green-600">{{ totalLicenses }}</p>
              </div>
              <i class="pi pi-key text-3xl text-green-300"></i>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">Allocated</p>
                <p class="text-2xl font-bold text-orange-600">{{ allocatedLicenses }}</p>
              </div>
              <i class="pi pi-link text-3xl text-orange-300"></i>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">Available</p>
                <p class="text-2xl font-bold text-purple-600">{{ availableLicenses }}</p>
              </div>
              <i class="pi pi-unlock text-3xl text-purple-300"></i>
            </div>
          </template>
        </Card>
      </div>

      <!-- Bundles List -->
      <div class="space-y-4">
        <Card v-for="bundle in bundles" :key="bundle.id" class="bundle-card">
          <template #content>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <!-- Bundle Header -->
                <div class="flex items-center gap-3 mb-3">
                  <h4 class="text-lg font-semibold">{{ bundle.name }}</h4>
                  <Tag :severity="bundle.is_active ? 'success' : 'secondary'">
                    {{ bundle.is_active ? 'Active' : 'Inactive' }}
                  </Tag>
                  <Tag v-if="bundle.source_billing_line" severity="info">
                    <i class="pi pi-receipt mr-1"></i>
                    From Billing
                  </Tag>
                </div>

                <!-- Source Billing Line Item -->
                <div v-if="bundle.source_billing_line" class="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div class="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Source Billing Line Item
                  </div>
                  <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-surface-600">Charge Code:</span>
                      <span class="font-mono font-bold ml-2">{{ bundle.source_billing_line.charge_code }}</span>
                    </div>
                    <div>
                      <span class="text-surface-600">Description:</span>
                      <span class="font-medium ml-2">{{ bundle.source_billing_line.description }}</span>
                    </div>
                    <div>
                      <span class="text-surface-600">Amount:</span>
                      <span class="font-bold text-green-600 ml-2">
                        {{ formatCurrency(bundle.source_billing_line.amount) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Bundle Components -->
                <div class="mb-3">
                  <div class="flex items-center justify-between mb-2">
                    <h5 class="font-medium text-sm">Bundle Components</h5>
                    <Button 
                      v-if="bundle.bundle_components?.length === 0"
                      label="Add Components"
                      icon="pi pi-plus"
                      size="small"
                      text
                      @click="openComponentDialog(bundle)"
                    />
                  </div>
                  
                  <div v-if="bundle.bundle_components && bundle.bundle_components.length > 0">
                    <DataTable :value="bundle.bundle_components" size="small" class="component-table">
                      <Column field="product_name" header="Component">
                        <template #body="{ data }">
                          <div class="flex items-center gap-2">
                            <Tag :severity="getComponentTypeSeverity(data.component_type)" class="text-xs">
                              {{ data.component_type }}
                            </Tag>
                            <span class="font-medium">{{ data.product_name }}</span>
                          </div>
                        </template>
                      </Column>
                      <Column field="quantity" header="Quantity" style="width: 100px">
                        <template #body="{ data }">
                          <span class="font-bold">{{ data.quantity }}</span>
                        </template>
                      </Column>
                      <Column field="unit_price" header="Unit Price" style="width: 120px">
                        <template #body="{ data }">
                          <span class="font-mono">{{ formatCurrency(data.unit_price) }}</span>
                        </template>
                      </Column>
                      <Column header="Total" style="width: 120px">
                        <template #body="{ data }">
                          <span class="font-mono font-bold">
                            {{ formatCurrency(data.quantity * data.unit_price) }}
                          </span>
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                  <div v-else class="text-center py-4 text-surface-500 border-2 border-dashed rounded-lg">
                    No components added yet
                  </div>
                </div>

                <!-- License Summary -->
                <div v-if="bundle.total_licenses > 0" class="flex items-center gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-key text-green-500"></i>
                    <span>Total Licenses: <strong>{{ bundle.total_licenses }}</strong></span>
                  </div>
                  <div v-if="bundle.license_type" class="flex items-center gap-2">
                    <i class="pi pi-tag text-blue-500"></i>
                    <span>Type: <strong>{{ bundle.license_type }}</strong></span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 ml-4">
                <Button 
                  icon="pi pi-plus"
                  size="small"
                  severity="success"
                  v-tooltip="'Add Components'"
                  @click="openComponentDialog(bundle)"
                />
                <Button 
                  icon="pi pi-pencil"
                  size="small"
                  outlined
                  v-tooltip="'Edit Bundle'"
                  @click="editBundle(bundle)"
                />
                <Button 
                  icon="pi pi-trash"
                  size="small"
                  outlined
                  severity="danger"
                  v-tooltip="'Delete Bundle'"
                  @click="confirmDeleteBundle(bundle)"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Empty State -->
        <Card v-if="bundles.length === 0" class="text-center py-12">
          <template #content>
            <i class="pi pi-box text-6xl text-surface-300 mb-4"></i>
            <h4 class="text-xl font-medium text-surface-900 dark:text-surface-0 mb-2">No Service Bundles</h4>
            <p class="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
              Create service bundles from billing line items or build custom bundles with license allocations.
            </p>
            <div class="flex justify-center gap-3">
              <Button 
                label="Import from Billing" 
                icon="pi pi-download"
                severity="info"
                @click="showBillingImportDialog = true"
                :disabled="!hasLocationProfile"
              />
              <Button 
                label="Create Custom Bundle" 
                icon="pi pi-plus"
                @click="openCreateBundle"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Import from Billing Dialog -->
    <Dialog 
      v-model:visible="showBillingImportDialog" 
      header="Create Bundle from Billing Line Item"
      modal 
      class="w-[800px]"
    >
      <div v-if="availableBillingItems.length > 0" class="space-y-4">
        <Message severity="info" :closable="false">
          Select a billing line item to convert into a service bundle. You can then add license components to define what the bundle includes.
        </Message>

        <DataTable 
          v-model:selection="selectedBillingItem"
          :value="availableBillingItems"
          selectionMode="single"
          :paginator="true"
          :rows="10"
          class="billing-items-table"
        >
          <Column selectionMode="single" headerStyle="width: 3rem" />
          
          <Column field="charge_code" header="Code" :sortable="true">
            <template #body="{ data }">
              <code class="text-xs font-bold">{{ data.charge_code }}</code>
            </template>
          </Column>
          
          <Column field="description" header="Description" :sortable="true" />
          
          <Column field="total_amount" header="Amount" :sortable="true">
            <template #body="{ data }">
              <span class="font-mono font-bold">{{ formatCurrency(data.total_amount) }}</span>
            </template>
          </Column>
          
          <Column field="category" header="Category">
            <template #body="{ data }">
              <Tag :severity="getCategorySeverity(data.category)" class="text-xs">
                {{ data.category }}
              </Tag>
            </template>
          </Column>
        </DataTable>

        <div class="mt-4">
          <label class="block text-sm font-medium mb-2">Bundle Name *</label>
          <InputText 
            v-model="billingImportName"
            placeholder="Enter a name for this bundle"
            class="w-full"
          />
        </div>
      </div>

      <div v-else class="text-center py-8">
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <p class="text-surface-600">No billing line items available. Import them in the Location Profiles tab first.</p>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="showBillingImportDialog = false" />
        <Button 
          label="Create Bundle" 
          icon="pi pi-check"
          @click="createBundleFromBilling"
          :disabled="!selectedBillingItem || !billingImportName"
        />
      </template>
    </Dialog>

    <!-- Add Components Dialog -->
    <Dialog 
      v-model:visible="showComponentDialog" 
      header="Manage Bundle Components"
      modal 
      class="w-[900px]"
    >
      <div class="space-y-4">
        <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
          <h5 class="font-medium mb-1">{{ editingBundle?.name }}</h5>
          <p class="text-sm text-surface-600">Add license components to define what this bundle includes</p>
        </div>

        <!-- Add Component Form -->
        <div class="border rounded-lg p-4">
          <h6 class="font-medium mb-3">Add New Component</h6>
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-3">
              <Select 
                v-model="componentForm.component_type"
                :options="componentTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Type"
                class="w-full"
              />
            </div>
            <div class="col-span-5">
              <InputText 
                v-model="componentForm.product_name"
                placeholder="Component name (e.g., Firewall Management License)"
                class="w-full"
              />
            </div>
            <div class="col-span-2">
              <InputNumber 
                v-model="componentForm.quantity"
                :min="1"
                placeholder="Qty"
                class="w-full"
              />
            </div>
            <div class="col-span-2">
              <Button 
                label="Add"
                icon="pi pi-plus"
                class="w-full"
                @click="addComponent"
                :disabled="!componentForm.product_name || !componentForm.quantity"
              />
            </div>
          </div>
        </div>

        <!-- Current Components -->
        <div v-if="tempComponents.length > 0">
          <h6 class="font-medium mb-2">Current Components</h6>
          <DataTable :value="tempComponents" size="small">
            <Column field="component_type" header="Type" style="width: 120px">
              <template #body="{ data }">
                <Tag :severity="getComponentTypeSeverity(data.component_type)" class="text-xs">
                  {{ data.component_type }}
                </Tag>
              </template>
            </Column>
            <Column field="product_name" header="Component Name" />
            <Column field="quantity" header="Quantity" style="width: 100px">
              <template #body="{ data }">
                <InputNumber 
                  v-model="data.quantity"
                  :min="1"
                  size="small"
                  class="w-full"
                />
              </template>
            </Column>
            <Column field="unit_price" header="Unit Price" style="width: 120px">
              <template #body="{ data }">
                <InputNumber 
                  v-model="data.unit_price"
                  mode="currency"
                  currency="USD"
                  size="small"
                  class="w-full"
                />
              </template>
            </Column>
            <Column header="Actions" style="width: 80px">
              <template #body="{ index }">
                <Button 
                  icon="pi pi-trash"
                  size="small"
                  text
                  severity="danger"
                  @click="removeComponent(index)"
                />
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="flex items-center justify-between pt-4 border-t">
          <div class="text-sm">
            <span class="text-surface-600">Total Licenses: </span>
            <span class="font-bold text-lg text-primary">{{ totalTempLicenses }}</span>
          </div>
          <div class="text-sm">
            <span class="text-surface-600">Total Value: </span>
            <span class="font-bold text-lg text-green-600">{{ formatCurrency(totalTempValue) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="closeComponentDialog" />
        <Button 
          label="Save Components" 
          icon="pi pi-check"
          @click="saveComponents"
          :disabled="tempComponents.length === 0"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Message from 'primevue/message';

const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['switch-tab']);

const toast = useToast();
const customerContractsStore = useCustomerContractsStore();

// State
const bundles = ref([]);
const showBillingImportDialog = ref(false);
const showComponentDialog = ref(false);
const selectedBillingItem = ref(null);
const billingImportName = ref('');
const editingBundle = ref(null);
const tempComponents = ref([]);

// Component form
const componentForm = ref({
  component_type: 'LICENSE',
  product_name: '',
  quantity: 1,
  unit_price: 0
});

// Options
const componentTypes = [
  { label: 'License', value: 'LICENSE' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Hardware', value: 'HARDWARE' },
  { label: 'Support', value: 'SUPPORT' }
];

// Computed
const hasActiveContract = computed(() => customerContractsStore.hasActiveContract);
const sofProducts = computed(() => customerContractsStore.sofLines || []);

const hasLocationProfile = computed(() => {
  // Check if there are location profiles with billing line items
  return customerContractsStore.locationProfiles?.some(
    profile => profile.billing_line_items?.length > 0
  );
});

const availableBillingItems = computed(() => {
  // Get billing line items from location profiles that haven't been converted to bundles
  const items = [];
  customerContractsStore.locationProfiles?.forEach(profile => {
    if (profile.billing_line_items) {
      profile.billing_line_items.forEach(item => {
        // Check if this item already has a bundle
        const hasBundle = bundles.value.some(
          b => b.source_billing_line?.charge_code === item.charge_code
        );
        if (!hasBundle) {
          items.push({
            ...item,
            profile_id: profile.id,
            profile_name: profile.name
          });
        }
      });
    }
  });
  return items;
});

const bundlesFromBilling = computed(() => 
  bundles.value.filter(b => b.source_billing_line)
);

const totalLicenses = computed(() => 
  bundles.value.reduce((sum, b) => sum + (b.total_licenses || 0), 0)
);

const allocatedLicenses = computed(() => 0); // Will be implemented in Phase 3

const availableLicenses = computed(() => totalLicenses.value - allocatedLicenses.value);

const totalTempLicenses = computed(() => 
  tempComponents.value
    .filter(c => c.component_type === 'LICENSE')
    .reduce((sum, c) => sum + c.quantity, 0)
);

const totalTempValue = computed(() => 
  tempComponents.value.reduce((sum, c) => sum + (c.quantity * c.unit_price), 0)
);

// Methods
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const getComponentTypeSeverity = (type) => {
  const severityMap = {
    'LICENSE': 'success',
    'SERVICE': 'info',
    'HARDWARE': 'warning',
    'SUPPORT': 'secondary'
  };
  return severityMap[type] || 'secondary';
};

const getCategorySeverity = (category) => {
  const severityMap = {
    'Transport': 'info',
    'Internet Access': 'warning',
    'Managed Services': 'success',
    'Backup Services': 'secondary'
  };
  return severityMap[category] || 'secondary';
};

const openCreateBundle = () => {
  // Standard bundle creation
  toast.add({
    severity: 'info',
    summary: 'Coming Soon',
    detail: 'Standard bundle creation will be implemented',
    life: 3000
  });
};

const openComponentDialog = (bundle) => {
  editingBundle.value = bundle;
  tempComponents.value = bundle.bundle_components ? [...bundle.bundle_components] : [];
  showComponentDialog.value = true;
};

const addComponent = () => {
  if (!componentForm.value.product_name || !componentForm.value.quantity) return;
  
  tempComponents.value.push({
    ...componentForm.value,
    id: null // New component
  });
  
  // Reset form
  componentForm.value = {
    component_type: 'LICENSE',
    product_name: '',
    quantity: 1,
    unit_price: 0
  };
};

const removeComponent = (index) => {
  tempComponents.value.splice(index, 1);
};

const closeComponentDialog = () => {
  showComponentDialog.value = false;
  editingBundle.value = null;
  tempComponents.value = [];
};

const saveComponents = async () => {
  if (!editingBundle.value) return;
  
  try {
    // TODO: Call API to save components
    // POST /api/bundles/{id}/components
    
    // For now, update local state
    const bundleIndex = bundles.value.findIndex(b => b.id === editingBundle.value.id);
    if (bundleIndex !== -1) {
      bundles.value[bundleIndex].bundle_components = [...tempComponents.value];
      bundles.value[bundleIndex].total_licenses = tempComponents.value
        .filter(c => c.component_type === 'LICENSE')
        .reduce((sum, c) => sum + c.quantity, 0);
    }
    
    toast.add({
      severity: 'success',
      summary: 'Components Saved',
      detail: 'Bundle components updated successfully',
      life: 3000
    });
    
    closeComponentDialog();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save components',
      life: 3000
    });
  }
};

const createBundleFromBilling = async () => {
  if (!selectedBillingItem.value || !billingImportName.value) return;
  
  try {
    // TODO: Call API to create bundle from billing line item
    // POST /api/bundles/create-from-billing-line
    
    // For now, create locally
    const newBundle = {
      id: Date.now(), // Temporary ID
      name: billingImportName.value,
      description: `Created from billing line item: ${selectedBillingItem.value.description}`,
      source_billing_line: {
        charge_code: selectedBillingItem.value.charge_code,
        description: selectedBillingItem.value.description,
        amount: selectedBillingItem.value.total_amount
      },
      bundle_components: [],
      total_licenses: 0,
      license_type: determineLicenseType(selectedBillingItem.value.category),
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    bundles.value.push(newBundle);
    
    toast.add({
      severity: 'success',
      summary: 'Bundle Created',
      detail: `${billingImportName.value} created from billing line item`,
      life: 3000
    });
    
    // Reset and close
    selectedBillingItem.value = null;
    billingImportName.value = '';
    showBillingImportDialog.value = false;
    
    // Open component dialog to add licenses
    openComponentDialog(newBundle);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create bundle',
      life: 3000
    });
  }
};

const determineLicenseType = (category) => {
  const typeMap = {
    'Transport': 'NETWORK_MGMT',
    'Internet Access': 'INTERNET_MGMT',
    'Managed Services': 'DEVICE_MGMT',
    'Backup Services': 'BACKUP_MGMT'
  };
  return typeMap[category] || 'GENERAL_MGMT';
};

const editBundle = (bundle) => {
  toast.add({
    severity: 'info',
    summary: 'Edit Bundle',
    detail: 'Bundle editing will be implemented',
    life: 3000
  });
};

const confirmDeleteBundle = (bundle) => {
  toast.add({
    severity: 'warn',
    summary: 'Delete Bundle',
    detail: 'Bundle deletion will be implemented',
    life: 3000
  });
};

// Load initial data
onMounted(async () => {
  // Load bundles if we have a contract
  if (customerContractsStore.currentContract?.id) {
    await customerContractsStore.loadBundles(customerContractsStore.currentContract.id);
    bundles.value = customerContractsStore.bundles || [];
  }
  
  // Load location profiles to get billing line items
  if (props.customerId) {
    await customerContractsStore.loadLocationProfiles(props.customerId);
  }
});
</script>

<style scoped>
.bundle-card {
  transition: all 0.3s ease;
}

.bundle-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.component-table :deep(.p-datatable-header) {
  display: none;
}

.billing-items-table :deep(.p-datatable-row) {
  cursor: pointer;
}

.billing-items-table :deep(.p-datatable-row:hover) {
  background-color: var(--surface-hover);
}
</style>