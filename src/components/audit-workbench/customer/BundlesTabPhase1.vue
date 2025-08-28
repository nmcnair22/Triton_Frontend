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


                <!-- License Summary -->
                <div class="flex items-center gap-4 text-sm mt-3">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-key text-green-500"></i>
                    <span>Licenses: <strong>{{ bundle.license_count || 0 }}</strong></span>
                  </div>
                  <div v-if="bundle.license_categories" class="flex items-center gap-2">
                    <i class="pi pi-tag text-blue-500"></i>
                    <span>Categories: <strong>{{ bundle.license_categories }}</strong></span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 ml-4">
                <Button 
                  icon="pi pi-key"
                  size="small"
                  severity="success"
                  v-tooltip="'Manage Licenses'"
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
          :disabled="!selectedBillingItem || !billingImportName || creatingBundle"
          :loading="creatingBundle"
        />
      </template>
    </Dialog>

    <!-- Add Components Dialog -->
    <Dialog 
      v-model:visible="showComponentDialog" 
      header="Manage Bundle Licenses"
      modal 
      class="w-[1000px]"
    >
      <div class="space-y-4">
        <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
          <h5 class="font-medium mb-1">{{ editingBundle?.name }}</h5>
          <p class="text-sm text-surface-600">Manage license allocations for this bundle</p>
        </div>

        <!-- License Management Panel -->
        <LicenseManagementPanel 
          v-if="editingBundle?.id && customerContractsStore.currentContract?.id"
          :bundle-id="editingBundle.id"
          :contract-id="customerContractsStore.currentContract.id"
          :asset-categories="rawAssetCategories"
          :loading-asset-categories="loadingAssetCategories"
          :asset-categories-error="assetCategoriesError"
          @licenses-updated="onLicensesUpdated"
        />
      </div>

      <template #footer>
        <Button label="Close" text @click="closeComponentDialog" />
      </template>
    </Dialog>

    <!-- Edit Bundle Dialog -->
    <Dialog 
      v-model:visible="showEditBundleDialog" 
      header="Edit Service Bundle"
      modal 
      class="w-[600px]"
    >
      <div class="space-y-4">
        <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
          <h5 class="font-medium mb-1">Bundle Details</h5>
          <p class="text-sm text-surface-600">Update the service bundle information</p>
        </div>

        <div class="grid gap-4">
          <!-- Bundle Name -->
          <div class="field">
            <label for="bundle-name" class="block text-sm font-medium mb-2">Bundle Name</label>
            <InputText 
              id="bundle-name"
              v-model="editBundleForm.name"
              class="w-full"
              placeholder="Enter bundle name"
              :class="{ 'p-invalid': !editBundleForm.name }"
            />
            <small v-if="!editBundleForm.name" class="p-error">Bundle name is required</small>
          </div>

          <!-- Description -->
          <div class="field">
            <label for="bundle-description" class="block text-sm font-medium mb-2">Description</label>
            <Textarea 
              id="bundle-description"
              v-model="editBundleForm.description"
              class="w-full"
              rows="3"
              placeholder="Enter bundle description"
            />
          </div>

          <!-- Asset Category (License Type) -->
          <div class="field">
            <label for="license-type" class="block text-sm font-medium mb-2">Asset Category</label>
            <Select 
              v-if="!assetCategoriesError"
              id="license-type"
              v-model="editBundleForm.license_type"
              :options="assetCategories"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Select asset category"
              :loading="loadingAssetCategories"
              :disabled="loadingAssetCategories || assetCategories.length === 0"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <Tag 
                    :value="option.layer" 
                    :severity="getLayerSeverity(option.layer)"
                    class="text-xs"
                  />
                  <div>
                    <div class="font-medium">{{ option.label }}</div>
                    <div class="text-xs text-surface-500">{{ option.description }}</div>
                  </div>
                </div>
              </template>
            </Select>
            <Message 
              v-else
              severity="error" 
              class="w-full"
              :closable="false"
            >
              {{ assetCategoriesError }}
            </Message>
            <small class="text-surface-600">
              Select the asset category this bundle will provide licenses for
            </small>
          </div>

          <!-- Active Status -->
          <div class="field">
            <div class="flex items-center gap-2">
              <ToggleSwitch v-model="editBundleForm.is_active" />
              <label class="text-sm font-medium">
                {{ editBundleForm.is_active ? 'Active' : 'Inactive' }}
              </label>
            </div>
            <small class="text-surface-600">
              {{ editBundleForm.is_active ? 'This bundle is active and available for use' : 'This bundle is inactive and not available for use' }}
            </small>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="closeEditBundleDialog" />
          <Button 
            label="Update Bundle" 
            icon="pi pi-save"
            @click="updateBundle"
            :loading="updatingBundle"
            :disabled="!editBundleForm.name"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';
import { auditClient } from '@/services/auditClient';
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
import ToggleSwitch from 'primevue/toggleswitch';
// Removed tab imports - no longer needed
import LicenseManagementPanel from './LicenseManagementPanel.vue';

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
const showEditBundleDialog = ref(false);
const selectedBillingItem = ref(null);
const billingImportName = ref('');
const editingBundle = ref(null);
// Removed component-related refs
const creatingBundle = ref(false);
const deletingBundles = ref(new Set());
const updatingBundle = ref(false);

// Edit bundle form
const editBundleForm = ref({
  id: null,
  name: '',
  description: '',
  is_active: true,
  license_type: ''
});

// Removed component form

// Asset categories - loaded from backend (raw data)
const rawAssetCategories = ref([]);
const loadingAssetCategories = ref(false);
const assetCategoriesError = ref(null);

// Computed: formatted asset categories for bundle editing dropdown
const assetCategories = computed(() => {
  return rawAssetCategories.value
    .filter(cat => cat.is_licensable)
    .map(cat => ({
      label: cat.display_name || cat.description || cat.key,
      value: cat.key,
      layer: cat.layer_key,
      description: cat.description
    }));
});

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

// Removed temp component computed properties

// Methods
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Removed getComponentTypeSeverity method

const getCategorySeverity = (category) => {
  const severityMap = {
    'Transport': 'info',
    'Internet Access': 'warning',
    'Managed Services': 'success',
    'Backup Services': 'secondary'
  };
  return severityMap[category] || 'secondary';
};

const getLayerSeverity = (layer) => {
  const severityMap = {
    'TRANSPORT': 'info',
    'WAN_ACCESS': 'primary', 
    'WAN_APPLIANCE': 'success',
    'LAN_ACCESS': 'warning',
    'LAN_DEVICE': 'secondary',
    'APP_PERF': 'danger'
  };
  return severityMap[layer] || 'secondary';
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
  // Removed tempComponents assignment
  showComponentDialog.value = true;
};

// Removed addComponent and removeComponent methods

const closeComponentDialog = () => {
  showComponentDialog.value = false;
  editingBundle.value = null;
  // Removed tempComponents and componentDialogTab references
};

const onLicensesUpdated = async (licenseData) => {
  console.log('Licenses updated:', licenseData);
  
  // Reload license counts for the specific bundle
  if (editingBundle.value) {
    const bundleIndex = bundles.value.findIndex(b => b.id === editingBundle.value.id);
    if (bundleIndex !== -1) {
      // Reload license count for this specific bundle
      try {
        const response = await auditClient.http.get(
          `/contracts/${customerContractsStore.currentContract.id}/bundles/${editingBundle.value.id}/licenses`
        );
        
        const licenses = response.data.licenses || [];
        const licenseCount = licenses.reduce((sum, license) => sum + (license.quantity || 0), 0);
        const categories = [...new Set(licenses.map(l => l.asset_category_key))];
        
        // Update the bundle object
        bundles.value[bundleIndex].license_count = licenseCount;
        bundles.value[bundleIndex].license_categories = categories.length;
        bundles.value[bundleIndex].licenses = licenses;
        
        // Update the editing bundle reference
        editingBundle.value = bundles.value[bundleIndex];
        
        console.log(`Updated bundle ${editingBundle.value.name}: ${licenseCount} licenses, ${categories.length} categories`);
      } catch (error) {
        console.warn('Failed to reload license count after update:', error);
        // Fallback to 0 if error
        bundles.value[bundleIndex].license_count = 0;
        bundles.value[bundleIndex].license_categories = 0;
        bundles.value[bundleIndex].licenses = [];
      }
    }
  }
  
  toast.add({
    severity: 'success',
    summary: 'Bundle Updated',
    detail: `${licenseData.licenses_updated || 0} licenses updated for ${editingBundle.value?.name}`,
    life: 5000
  });
};

const saveComponents = async () => {
  if (!editingBundle.value) return;
  
  try {
    // Save components via API
    const response = await auditClient.http.put(
      `/contracts/${customerContractsStore.currentContract.id}/bundles/${editingBundle.value.id}/components`,
      {
        components: tempComponents.value
      }
    );
    
    // Update local state with API response
    const bundleIndex = bundles.value.findIndex(b => b.id === editingBundle.value.id);
    if (bundleIndex !== -1) {
      bundles.value[bundleIndex] = response.data.bundle;
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
  
  creatingBundle.value = true;
  console.log('Starting bundle creation...');
  
  try {
    // Create bundle via API
    const response = await auditClient.http.post(`/contracts/${customerContractsStore.currentContract.id}/bundles`, {
      name: billingImportName.value,
      description: `Created from billing line item: ${selectedBillingItem.value.description}`,
      license_type: determineLicenseType(selectedBillingItem.value.category),
      is_active: true,
      source_billing_line: {
        charge_code: selectedBillingItem.value.charge_code,
        description: selectedBillingItem.value.description,
        amount: selectedBillingItem.value.total_amount
      }
    });
    
    console.log('Bundle creation response:', response.status, response.data);
    
    // Backend returns { message, data: { id, name, is_active, created_at } }
    const createdBundle = response.data?.data;
    if (!createdBundle) throw new Error('No bundle returned from backend');
    
    console.log('Bundle created with ID:', createdBundle.id);
    
    // Refresh the bundle list from server to get the complete data
    try {
      await customerContractsStore.loadBundles(customerContractsStore.currentContract.id);
      bundles.value = customerContractsStore.bundles || [];
      console.log('Refreshed bundle list, total bundles:', bundles.value.length);
    } catch (storeError) {
      console.warn('Store refresh failed after bundle creation:', storeError);
      // Create a minimal local bundle if server refresh fails
      const localBundle = {
        ...createdBundle,
        bundle_components: [],
        total_licenses: 0,
        description: `Created from billing line item: ${selectedBillingItem.value.description}`,
        source_billing_line: {
          charge_code: selectedBillingItem.value.charge_code,
          description: selectedBillingItem.value.description,
          amount: selectedBillingItem.value.total_amount
        }
      };
      bundles.value.push(localBundle);
    }
    
    // Find the bundle for the dialog (either from server or local)
    const bundleForDialog = bundles.value.find(b => b.id === createdBundle.id) || {
      ...createdBundle,
      bundle_components: [],
      total_licenses: 0
    };
    
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
    openComponentDialog(bundleForDialog);
  } catch (error) {
    console.error('Bundle creation error:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to create bundle';
    
    toast.add({
      severity: 'error',
      summary: 'Bundle Creation Failed',
      detail: errorMessage,
      life: 5000
    });
  } finally {
    creatingBundle.value = false;
  }
};

const determineLicenseType = (category) => {
  // No hardcoded mapping - let backend determine license type
  // Return null to let backend decide based on category
  return null;
};

const editBundle = (bundle) => {
  console.log('Opening edit dialog for bundle:', bundle);
  
  // Populate the edit form with current bundle data
  editBundleForm.value = {
    id: bundle.id,
    name: bundle.name || '',
    description: bundle.description || '',
    is_active: bundle.is_active !== undefined ? bundle.is_active : true,
    license_type: bundle.license_type || ''
  };
  
  editingBundle.value = bundle;
  showEditBundleDialog.value = true;
};

const closeEditBundleDialog = () => {
  showEditBundleDialog.value = false;
  editingBundle.value = null;
  editBundleForm.value = {
    id: null,
    name: '',
    description: '',
    is_active: true,
    license_type: ''
  };
};

const updateBundle = async () => {
  if (!editBundleForm.value.id || !customerContractsStore.currentContract?.id) return;
  
  updatingBundle.value = true;
  
  try {
    const response = await auditClient.http.patch(
      `/contracts/${customerContractsStore.currentContract.id}/bundles/${editBundleForm.value.id}`,
      {
        name: editBundleForm.value.name,
        description: editBundleForm.value.description,
        is_active: editBundleForm.value.is_active,
        license_type: editBundleForm.value.license_type
      }
    );
    
    const updatedBundle = response.data;
    console.log('Bundle updated successfully:', updatedBundle);
    
    // Update the bundle in the local array
    const bundleIndex = bundles.value.findIndex(b => b.id === editBundleForm.value.id);
    if (bundleIndex !== -1) {
      // Preserve existing fields like license counts
      bundles.value[bundleIndex] = {
        ...bundles.value[bundleIndex],
        ...updatedBundle
      };
    }
    
    // Update the store as well
    await customerContractsStore.loadBundles(customerContractsStore.currentContract.id);
    bundles.value = customerContractsStore.bundles || [];
    await loadLicenseCounts();
    
    toast.add({
      severity: 'success',
      summary: 'Bundle Updated',
      detail: `"${editBundleForm.value.name}" has been updated successfully`,
      life: 5000
    });
    
    closeEditBundleDialog();
    
  } catch (error) {
    console.error('Failed to update bundle:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Failed to update bundle';
    
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: errorMessage,
      life: 5000
    });
  } finally {
    updatingBundle.value = false;
  }
};

const confirmDeleteBundle = async (bundle) => {
  if (!bundle?.id) return;
  
  // Prevent multiple calls for the same bundle
  if (deletingBundles.value.has(bundle.id)) {
    console.log('Already deleting bundle:', bundle.id);
    return;
  }
  
  // Show confirmation dialog
  if (!confirm(`Delete "${bundle.name}"?`)) {
    return;
  }
  
  deletingBundles.value.add(bundle.id);
  
  try {
    console.log('Deleting bundle:', bundle.id, bundle.name);
    
    // Call the backend to delete the bundle
    await auditClient.http.delete(`/contracts/${customerContractsStore.currentContract.id}/bundles/${bundle.id}`);
    
    // Remove from local list
    const bundleIndex = bundles.value.findIndex(b => b.id === bundle.id);
    if (bundleIndex !== -1) {
      bundles.value.splice(bundleIndex, 1);
    }
    
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `"${bundle.name}" deleted`,
      life: 3000
    });
    
  } catch (error) {
    console.error('Failed to delete bundle:', error);
    
    // Handle 404 as success (bundle already gone)
    if (error.response?.status === 404) {
      // Remove from local list anyway
      const bundleIndex = bundles.value.findIndex(b => b.id === bundle.id);
      if (bundleIndex !== -1) {
        bundles.value.splice(bundleIndex, 1);
      }
      toast.add({
        severity: 'info',
        summary: 'Removed',
        detail: `"${bundle.name}" was already deleted`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: error.response?.data?.message || 'Failed to delete bundle',
        life: 5000
      });
    }
  } finally {
    deletingBundles.value.delete(bundle.id);
  }
};

// Load license counts for each bundle
const loadLicenseCounts = async () => {
  if (!customerContractsStore.currentContract?.id || !bundles.value.length) return;
  
  console.log('Loading license counts for', bundles.value.length, 'bundles');
  
  // Load license data for each bundle
  const licensePromises = bundles.value.map(async (bundle) => {
    try {
      const response = await auditClient.http.get(
        `/contracts/${customerContractsStore.currentContract.id}/bundles/${bundle.id}/licenses`
      );
      
      const licenses = response.data.licenses || [];
      const licenseCount = licenses.reduce((sum, license) => sum + (license.quantity || 0), 0);
      const categories = [...new Set(licenses.map(l => l.asset_category_key))];
      
      // Update the bundle object directly
      bundle.license_count = licenseCount;
      bundle.license_categories = categories.length;
      bundle.licenses = licenses; // Store full license data for later use
      
      console.log(`Bundle ${bundle.name}: ${licenseCount} licenses, ${categories.length} categories`);
    } catch (error) {
      // Handle 404 gracefully - bundle has no licenses yet
      if (error.response?.status === 404) {
        bundle.license_count = 0;
        bundle.license_categories = 0;
        bundle.licenses = [];
      } else {
        console.warn(`Failed to load licenses for bundle ${bundle.id}:`, error);
        bundle.license_count = 0;
        bundle.license_categories = 0;
        bundle.licenses = [];
      }
    }
  });
  
  await Promise.all(licensePromises);
  console.log('Finished loading license counts');
};

// Load asset categories for license types from backend
const loadAssetCategories = async () => {
  loadingAssetCategories.value = true;
  assetCategoriesError.value = null;
  
  try {
    const response = await auditClient.http.get('/audit/ref/asset-categories');
    rawAssetCategories.value = response.data?.categories || [];
    
    console.log('Loaded asset categories:', rawAssetCategories.value.length);
  } catch (error) {
    console.error('Failed to load asset categories:', error);
    assetCategoriesError.value = error.response?.data?.message || 'Failed to load asset categories from backend';
    rawAssetCategories.value = []; // No fallback data - show error instead
    
    toast.add({
      severity: 'error',
      summary: 'Asset Categories Unavailable', 
      detail: 'Could not load asset categories from backend. Bundle editing may be limited.',
      life: 7000
    });
  } finally {
    loadingAssetCategories.value = false;
  }
};

// Load initial data
onMounted(async () => {
  console.log('BundlesTabPhase1 mounted');
  console.log('Current contract:', customerContractsStore.currentContract?.id);
  
  // Load bundles if we have a contract
  if (customerContractsStore.currentContract?.id) {
    console.log('Loading bundles for contract:', customerContractsStore.currentContract.id);
    try {
      await customerContractsStore.loadBundles(customerContractsStore.currentContract.id);
      bundles.value = customerContractsStore.bundles || [];
      console.log('Loaded bundles from server:', bundles.value.length);
      console.log('Store bundles:', customerContractsStore.bundles?.length);
      // Load license counts for each bundle
      await loadLicenseCounts();
    } catch (error) {
      console.warn('Failed to load bundles from server:', error);
      bundles.value = []; // Start with empty array if server fails
      toast.add({
        severity: 'warn',
        summary: 'Bundle Loading Issue',
        detail: 'Could not load bundles from server.',
        life: 7000
      });
    }
  } else {
    console.log('No current contract - skipping bundle load');
  }
  
  // Load location profiles to get billing line items
  if (props.customerId) {
    await customerContractsStore.loadLocationProfiles(props.customerId);
  }
  
  // Load asset categories for bundle editing
  await loadAssetCategories();
});

// Watch for contract changes and load bundles
watch(
  () => customerContractsStore.currentContract,
  async (newContract, oldContract) => {
    console.log('Contract changed:', oldContract?.id, '=>', newContract?.id);
    if (newContract?.id && newContract.id !== oldContract?.id) {
      console.log('Loading bundles for new contract:', newContract.id);
      try {
        await customerContractsStore.loadBundles(newContract.id);
        bundles.value = customerContractsStore.bundles || [];
        console.log('Loaded bundles via watcher:', bundles.value.length);
        // Load license counts for each bundle
        await loadLicenseCounts();
      } catch (error) {
        console.warn('Failed to load bundles via watcher:', error);
      }
    }
  },
  { immediate: true }
);
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