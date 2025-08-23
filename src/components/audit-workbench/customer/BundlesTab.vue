<template>
  <div class="bundles-tab">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Service Bundles</h3>
        <p class="text-surface-600 dark:text-surface-400">Create and manage service bundles with license allocations</p>
      </div>
    </div>

    <!-- Contract Required Notice -->
    <Card v-if="!customerContractsStore.hasActiveContract" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Contract Required</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Please select or create a contract first to manage Service Bundles.
        </p>
        <Button 
          label="Go to Contracts" 
          icon="pi pi-arrow-left"
          @click="$emit('switch-tab', '0')"
        />
      </template>
    </Card>

    <!-- Loading State -->
    <div v-else-if="customerContractsStore.loading.bundles" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600 dark:text-surface-400">Loading service bundles...</p>
    </div>

    <!-- Error State -->
    <Message 
      v-else-if="customerContractsStore.errors.bundles" 
      severity="error" 
      class="mb-6"
    >
      Failed to load service bundles. {{ customerContractsStore.errors.bundles.message || 'Unknown error occurred.' }}
    </Message>

    <!-- Bundles Content -->
    <div v-else>
      <!-- Action Buttons -->
      <Card class="mb-6">
        <template #content>
          <div class="flex justify-between items-center">
            <div>
              <h4 class="text-lg font-semibold mb-2">Bundle Management</h4>
              <p class="text-surface-600 dark:text-surface-400">
                Create service bundles or seed from existing audit data
              </p>
            </div>
            <div class="flex gap-2">
              <Button 
                label="Seed from Audit" 
                icon="pi pi-download"
                severity="secondary"
                @click="seedFromAudit"
                :loading="customerContractsStore.loading.bundles"
              />
              <Button 
                label="New Bundle" 
                icon="pi pi-plus"
                @click="showCreateBundle = true"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Empty State -->
      <Card v-if="customerContractsStore.bundles.length === 0" class="text-center py-8">
        <template #content>
          <i class="pi pi-box text-4xl text-surface-400 mb-4"></i>
          <h5 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Service Bundles</h5>
          <p class="text-surface-600 dark:text-surface-400 mb-4">
            Create service bundles to organize license allocations.
          </p>
          <div class="flex justify-center gap-2">
            <Button 
              label="Seed from Audit Data" 
              icon="pi pi-download"
              severity="secondary"
              @click="seedFromAudit"
            />
            <Button 
              label="Create Bundle" 
              icon="pi pi-plus"
              @click="showCreateBundle = true"
            />
          </div>
        </template>
      </Card>

      <!-- Bundles List -->
      <div v-else class="space-y-4">
        <Card v-for="bundle in customerContractsStore.bundles" :key="bundle.id" class="shadow-sm">
          <template #content>
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h5 class="text-lg font-semibold">{{ bundle.name }}</h5>
                  <Badge 
                    :value="bundle.status || 'Active'" 
                    :severity="bundle.status === 'Active' ? 'success' : 'secondary'"
                  />
                </div>
                <p class="text-surface-600 dark:text-surface-400 mb-3">
                  {{ bundle.description || 'No description provided' }}
                </p>
                
                <!-- Bundle Licenses Summary -->
                <div v-if="bundle.bundle_licenses && bundle.bundle_licenses.length > 0" class="mb-3">
                  <h6 class="font-medium mb-2 text-sm">License Allocations:</h6>
                  <div class="flex flex-wrap gap-2">
                    <div 
                      v-for="license in bundle.bundle_licenses" 
                      :key="license.id"
                      class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded"
                    >
                      {{ license.asset_category }}: {{ license.license_count }}
                    </div>
                  </div>
                </div>

                <!-- Bundle Pricing -->
                <div v-if="bundle.bundle_prices && bundle.bundle_prices.length > 0">
                  <h6 class="font-medium mb-2 text-sm">Pricing Tiers:</h6>
                  <div class="flex flex-wrap gap-2">
                    <div 
                      v-for="price in bundle.bundle_prices" 
                      :key="price.id"
                      class="text-xs bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded"
                    >
                      {{ price.tier_name }}: {{ formatCurrency(price.price, price.currency) }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex gap-1 ml-4">
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-sm p-button-text" 
                  @click="editBundle(bundle)"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-sm p-button-text p-button-danger" 
                  @click="deleteBundle(bundle)"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Create/Edit Bundle Dialog -->
      <Dialog 
        v-model:visible="showCreateBundle" 
        :header="bundleForm.id ? 'Edit Service Bundle' : 'Create Service Bundle'"
        modal 
        class="w-[700px]"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Bundle Name</label>
            <InputText 
              v-model="bundleForm.name" 
              placeholder="Enter bundle name"
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Description</label>
            <Textarea 
              v-model="bundleForm.description" 
              placeholder="Describe this service bundle"
              rows="3"
              class="w-full"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Status</label>
              <Select 
                v-model="bundleForm.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select status"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Currency</label>
              <Select 
                v-model="bundleForm.currency"
                :options="currencyOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select currency"
                class="w-full"
              />
            </div>
          </div>
          
          <div v-if="bundleForm.bundle_licenses.length > 0">
            <h6 class="font-medium mb-2">License Allocations</h6>
            <DataTable :value="bundleForm.bundle_licenses" class="p-datatable-sm">
              <Column field="asset_category" header="Asset Category">
                <template #body="{ data }">
                  <InputText v-model="data.asset_category" class="w-full" />
                </template>
              </Column>
              <Column field="license_count" header="License Count">
                <template #body="{ data }">
                  <InputNumber v-model="data.license_count" :min="0" class="w-full" />
                </template>
              </Column>
              <Column header="Actions" style="width: 80px">
                <template #body="{ index }">
                  <Button 
                    icon="pi pi-trash" 
                    size="small"
                    text
                    severity="danger"
                    @click="removeLicenseAllocation(index)"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          
          <div class="flex gap-2">
            <Button 
              label="Add License Allocation" 
              icon="pi pi-plus"
              size="small"
              @click="addLicenseAllocation"
            />
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <Button 
              label="Cancel" 
              severity="secondary" 
              @click="closeBundleDialog" 
            />
            <Button 
              :label="bundleForm.id ? 'Save Changes' : 'Save Bundle'" 
              @click="saveBundle"
              :loading="customerContractsStore.loading.bundles"
              :disabled="!isBundleFormValid"
            />
          </div>
        </template>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog 
        v-model:visible="showDeleteConfirm" 
        header="Confirm Deletion"
        modal 
        class="w-[400px]"
      >
        <div class="p-4 text-center">
          <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
          <h4 class="text-lg font-semibold mb-2">Delete Bundle</h4>
          <p class="text-surface-600 dark:text-surface-400 mb-4">
            Are you sure you want to delete the bundle "{{ bundleToDelete?.name }}"? 
            This action cannot be undone.
          </p>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <Button 
              label="Cancel" 
              severity="secondary" 
              @click="showDeleteConfirm = false" 
            />
            <Button 
              label="Delete" 
              severity="danger"
              @click="confirmDelete"
              :loading="customerContractsStore.loading.bundles"
            />
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, ref, watch, computed, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';

const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true
  }
});

defineEmits(['switch-tab']);

const toast = useToast();
const customerContractsStore = useCustomerContractsStore();

// State
const showCreateBundle = ref(false);
const showDeleteConfirm = ref(false);
const bundleToDelete = ref(null);
const bundleForm = reactive({
  id: null,
  name: '',
  description: '',
  status: 'Active',
  currency: 'USD',
  bundle_licenses: []
});

// Options
const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Draft', value: 'Draft' }
];

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'CAD', value: 'CAD' }
];

// Computed
const isBundleFormValid = computed(() => 
  bundleForm.name.trim().length > 0 && 
  bundleForm.status &&
  bundleForm.currency
);

// Methods
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

const seedFromAudit = async () => {
  if (!customerContractsStore.currentContract?.id) return;
  
  await customerContractsStore.seedBundlesFromAudit(
    customerContractsStore.currentContract.id,
    props.customerId
  );
};

const editBundle = (bundle) => {
  Object.assign(bundleForm, {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description || '',
    status: bundle.status || 'Active',
    currency: bundle.currency || 'USD',
    bundle_licenses: bundle.bundle_licenses ? [...bundle.bundle_licenses] : []
  });
  showCreateBundle.value = true;
};

const deleteBundle = (bundle) => {
  bundleToDelete.value = bundle;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!bundleToDelete.value) return;
  
  try {
    const success = await customerContractsStore.deleteBundle(bundleToDelete.value.id);
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Bundle Deleted',
        detail: `${bundleToDelete.value.name} has been deleted`,
        life: 3000
      });
      showDeleteConfirm.value = false;
      bundleToDelete.value = null;
    } else {
      toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: 'Failed to delete bundle. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error deleting bundle:', error);
    toast.add({
      severity: 'error',
      summary: 'Delete Error',
      detail: 'An error occurred while deleting the bundle',
      life: 3000
    });
  }
};

const saveBundle = async () => {
  if (!customerContractsStore.currentContract?.id) return;
  
  try {
    const success = await customerContractsStore.saveBundle(
      customerContractsStore.currentContract.id,
      { ...bundleForm }
    );
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Bundle Saved',
        detail: bundleForm.id ? 'Bundle updated successfully' : 'Bundle created successfully',
        life: 3000
      });
      
      // Reload bundles to get the latest data from backend
      if (customerContractsStore.currentContract?.id) {
        await customerContractsStore.loadBundles(customerContractsStore.currentContract.id);
      }
      
      closeBundleDialog();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save bundle. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error saving bundle:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Error',
      detail: 'An error occurred while saving the bundle',
      life: 3000
    });
  }
};

const closeBundleDialog = () => {
  showCreateBundle.value = false;
  resetBundleForm();
};

const resetBundleForm = () => {
  Object.assign(bundleForm, {
    id: null,
    name: '',
    description: '',
    status: 'Active',
    currency: 'USD',
    bundle_licenses: []
  });
};

const addLicenseAllocation = () => {
  bundleForm.bundle_licenses.push({
    asset_category: '',
    license_count: 1
  });
};

const removeLicenseAllocation = (index) => {
  bundleForm.bundle_licenses.splice(index, 1);
};

// Load bundles when contract changes
watch(
  () => customerContractsStore.currentContract?.id,
  async (contractId) => {
    if (contractId) {
      await customerContractsStore.loadBundles(contractId);
    }
  },
  { immediate: true }
);
</script>