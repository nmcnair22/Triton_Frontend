<template>
  <div class="location-profiles-tab">
    <!-- Header Section -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Location Profiles</h2>
        <p class="text-gray-600 mt-1">Define location types and their service configurations</p>
      </div>
      <div class="flex gap-3">
        <Button 
          label="Import from Audit" 
          icon="pi pi-download"
          severity="secondary"
          @click="showSignatureImport = true"
          :disabled="!hasActiveContract"
        />
        <Button 
          label="New Profile" 
          icon="pi pi-plus"
          @click="openProfileDialog()"
          :disabled="!hasActiveContract"
        />
      </div>
    </div>

    <!-- No Contract Message -->
    <Message v-if="!hasActiveContract" severity="info" :closable="false" class="mb-4">
      <i class="pi pi-info-circle mr-2"></i>
      Please select an active contract to manage location profiles
    </Message>

    <!-- Profiles Grid -->
    <div v-if="hasActiveContract" class="profiles-grid">
      <Card 
        v-for="profile in profiles"
        :key="profile.id"
        class="profile-card hover:shadow-lg transition-shadow cursor-pointer"
        @click="openProfileDialog(profile)"
      >
        <template #content>
          <div class="profile-header mb-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">{{ profile.name }}</h3>
                <Tag :severity="profile.is_active ? 'success' : 'secondary'" class="mt-1">
                  {{ profile.is_active ? 'Active' : 'Inactive' }}
                </Tag>
              </div>
              <Button 
                icon="pi pi-ellipsis-v"
                text
                rounded
                @click.stop="toggleProfileMenu($event, profile)"
              />
            </div>
          </div>

          <div class="profile-details space-y-3">
            <div class="detail-row">
              <span class="text-gray-600">Type:</span>
              <span class="font-medium">{{ profile.location_type || 'Standard' }}</span>
            </div>
            
            <div class="detail-row">
              <span class="text-gray-600">Service Bundle:</span>
              <span class="font-medium">{{ getBundleName(profile.bundle_id) || 'None' }}</span>
            </div>

            <div v-if="profile.charge_signature" class="detail-row">
              <span class="text-gray-600">Charge Pattern:</span>
              <Tag severity="info" class="text-xs">
                {{ formatChargeSignature(profile.charge_signature) }}
              </Tag>
            </div>

            <div v-if="profile.asset_signature" class="detail-row">
              <span class="text-gray-600">Asset Pattern:</span>
              <Tag severity="warning" class="text-xs">
                {{ profile.asset_signature }}
              </Tag>
            </div>

            <div class="detail-row">
              <span class="text-gray-600">Locations:</span>
              <span class="font-bold text-primary">{{ profile.location_count || 0 }}</span>
            </div>

            <div v-if="profile.monthly_revenue" class="detail-row">
              <span class="text-gray-600">Monthly Revenue:</span>
              <span class="font-bold text-green-600">${{ formatCurrency(profile.monthly_revenue) }}</span>
            </div>

            <div v-if="hasLineItems(profile)" class="detail-row">
              <span class="text-gray-600">Line Items:</span>
              <Tag severity="success" class="text-xs">
                <i class="pi pi-check-circle mr-1"></i>
                {{ getLineItemCount(profile) }} imported
              </Tag>
            </div>
          </div>
        </template>
      </Card>

      <!-- Empty State -->
      <div v-if="profiles.length === 0" class="empty-state">
        <i class="pi pi-map-marker text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No Location Profiles</h3>
        <p class="text-gray-500 mb-4">Create profiles to categorize and configure your locations</p>
        <Button 
          label="Create First Profile" 
          icon="pi pi-plus"
          @click="openProfileDialog()"
        />
      </div>
    </div>

    <!-- Profile Dialog -->
    <Dialog 
      v-model:visible="showProfileDialog"
      :header="editingProfile ? 'Edit Location Profile' : 'New Location Profile'"
      :modal="true"
      :style="{ width: '50rem' }"
      class="profile-dialog"
    >
      <div class="space-y-4">
        <div class="field">
          <label class="block mb-2 font-medium">Profile Name *</label>
          <InputText 
            v-model="profileForm.name"
            placeholder="e.g., Retail Store, Corporate Office"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label class="block mb-2 font-medium">Location Type</label>
            <Select
              v-model="profileForm.location_type"
              :options="locationTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              class="w-full"
            />
          </div>

          <div class="field">
            <label class="block mb-2 font-medium">Service Bundle</label>
            <Select
              v-model="profileForm.bundle_id"
              :options="bundleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select bundle"
              class="w-full"
            />
          </div>
        </div>

        <div class="field">
          <label class="block mb-2 font-medium">Configuration</label>
          <Textarea
            v-model="profileForm.configuration"
            rows="3"
            placeholder="JSON configuration for this profile type"
            class="w-full font-mono text-sm"
          />
        </div>

        <!-- Billing Line Items Section -->
        <div v-if="editingProfile && profileForm.charge_signature" class="field">
          <div class="flex justify-between items-center mb-2">
            <label class="font-medium">Billing Line Items</label>
            <Button
              v-if="!profileForm.billing_line_items || profileForm.billing_line_items.length === 0"
              label="Import Line Items"
              icon="pi pi-download"
              size="small"
              @click="importBillingLineItems"
              :loading="loadingLineItems"
            />
          </div>
          
          <div v-if="profileForm.billing_line_items && profileForm.billing_line_items.length > 0" 
               class="border rounded-lg p-3 bg-surface-50">
            <DataTable 
              :value="profileForm.billing_line_items"
              size="small"
              responsiveLayout="scroll"
            >
              <Column field="charge_code" header="Code" style="width: 15%" />
              <Column field="description" header="Description" style="width: 40%" />
              <Column field="category" header="Category" style="width: 20%">
                <template #body="{ data }">
                  <Tag :value="data.category" severity="info" class="text-xs" />
                </template>
              </Column>
              <Column field="quantity" header="Qty" style="width: 10%" />
              <Column field="total_amount" header="Amount" style="width: 15%">
                <template #body="{ data }">
                  <span class="font-mono">${{ formatCurrency(data.total_amount) }}</span>
                </template>
              </Column>
            </DataTable>
            <div class="mt-2 text-right">
              <span class="text-sm text-surface-600">Total Monthly: </span>
              <span class="font-bold text-primary">${{ formatCurrency(calculateLineItemsTotal()) }}</span>
            </div>
          </div>
          
          <div v-else-if="loadingLineItems" class="text-center py-4">
            <ProgressSpinner size="30" />
            <p class="mt-2 text-sm text-surface-600">Loading billing details...</p>
          </div>
          
          <div v-else class="text-center py-4 text-surface-500">
            <i class="pi pi-info-circle mr-2"></i>
            No billing line items imported yet
          </div>
        </div>

        <div class="field">
          <label class="flex items-center gap-2">
            <Checkbox v-model="profileForm.is_active" binary />
            <span>Active Profile</span>
          </label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="showProfileDialog = false" />
        <Button 
          label="Save" 
          icon="pi pi-check"
          @click="saveProfile"
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Charge Signature Import Dialog -->
    <Dialog
      v-model:visible="showSignatureImport"
      header="Import from Audit Data"
      :modal="true"
      :style="{ width: '60rem' }"
      class="signature-import-dialog"
    >
      <div v-if="loadingSignatures" class="flex justify-center py-8">
        <ProgressSpinner />
      </div>

      <div v-else-if="chargeSignatures.length > 0" class="space-y-4">
        <Message severity="info" :closable="false">
          Found {{ chargeSignatures.length }} unique charge patterns from your latest audit.
          Select patterns to create location profiles.
        </Message>

        <DataTable 
          v-model:selection="selectedSignatures"
          :value="chargeSignatures"
          selectionMode="multiple"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="signature-table"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          
          <Column field="charge_signature" header="Charge Pattern" :sortable="true">
            <template #body="{ data }">
              <Tag severity="info">{{ formatChargeSignature(data.charge_signature) }}</Tag>
            </template>
          </Column>

          <Column field="asset_signature" header="Asset Pattern" :sortable="true">
            <template #body="{ data }">
              <Tag severity="warning">{{ data.asset_signature || 'N/A' }}</Tag>
            </template>
          </Column>

          <Column field="location_count" header="Locations" :sortable="true">
            <template #body="{ data }">
              <span class="font-bold">{{ data.location_count }}</span>
            </template>
          </Column>

          <Column field="avg_monthly_cost" header="Avg Monthly" :sortable="true">
            <template #body="{ data }">
              <span class="font-medium">${{ formatCurrency(data.avg_monthly_cost) }}</span>
            </template>
          </Column>

          <Column header="Suggested Profile">
            <template #body="{ data }">
              <InputText 
                v-model="data.suggested_name"
                placeholder="Enter profile name"
                class="w-full"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        No charge signatures found in audit data
      </div>

      <template #footer>
        <Button label="Cancel" text @click="showSignatureImport = false" />
        <Button 
          label="Create Profiles" 
          icon="pi pi-check"
          @click="importSelectedSignatures"
          :disabled="selectedSignatures.length === 0"
          :loading="importing"
        />
      </template>
    </Dialog>

    <!-- Context Menu -->
    <Menu ref="profileMenu" :model="profileMenuItems" :popup="true" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';
import { chargeSignatureService } from '@/services/chargeSignatureService';
import { billingDetailsService } from '@/services/billingDetailsService';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import Menu from 'primevue/menu';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true
  }
});

// Store & Services
const customerContractsStore = useCustomerContractsStore();
const toast = useToast();

// State
const showProfileDialog = ref(false);
const showSignatureImport = ref(false);
const editingProfile = ref(null);
const saving = ref(false);
const importing = ref(false);
const loadingSignatures = ref(false);
const loadingLineItems = ref(false);
const profileMenu = ref(null);
const selectedSignatures = ref([]);
const chargeSignatures = ref([]);

// Form state
const profileForm = ref({
  name: '',
  location_type: 'RETAIL',
  bundle_id: null,
  charge_signature: '',
  asset_signature: '',
  configuration: '{}',
  billing_line_items: [],
  is_active: true
});

// Computed
const hasActiveContract = computed(() => customerContractsStore.hasActiveContract);
const profiles = computed(() => customerContractsStore.locationProfiles);

const bundleOptions = computed(() => {
  return [
    { label: 'None', value: null },
    ...customerContractsStore.bundles.map(b => ({
      label: b.name,
      value: b.id
    }))
  ];
});

const locationTypes = [
  { label: 'Retail Store', value: 'RETAIL' },
  { label: 'Corporate Office', value: 'OFFICE' },
  { label: 'Warehouse', value: 'WAREHOUSE' },
  { label: 'Distribution Center', value: 'DC' },
  { label: 'Call Center', value: 'CALL_CENTER' },
  { label: 'Data Center', value: 'DATA_CENTER' },
  { label: 'Branch Office', value: 'BRANCH' },
  { label: 'Kiosk', value: 'KIOSK' },
  { label: 'Other', value: 'OTHER' }
];

const profileMenuItems = computed(() => [
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    command: () => {
      const profile = profileMenu.value?.currentTarget;
      if (profile) openProfileDialog(profile);
    }
  },
  {
    label: 'Duplicate',
    icon: 'pi pi-copy',
    command: () => {
      const profile = profileMenu.value?.currentTarget;
      if (profile) duplicateProfile(profile);
    }
  },
  {
    separator: true
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      const profile = profileMenu.value?.currentTarget;
      if (profile) confirmDeleteProfile(profile);
    }
  }
]);

// Methods
const openProfileDialog = (profile = null) => {
  editingProfile.value = profile;
  
  if (profile) {
    // billing_line_items now comes directly from the profile, not from configuration
    let billingLineItems = profile.billing_line_items || [];
    
    // Parse configuration for display
    let configString = profile.configuration || '{}';
    try {
      const config = typeof configString === 'string' ? JSON.parse(configString) : configString;
      configString = JSON.stringify(config, null, 2);
    } catch (e) {
      configString = '{}';
    }
    
    profileForm.value = {
      name: profile.name,
      location_type: profile.location_type || 'RETAIL',
      bundle_id: profile.bundle_id,
      charge_signature: profile.charge_signature || '',
      asset_signature: profile.asset_signature || '',
      configuration: configString,
      billing_line_items: billingLineItems,
      is_active: profile.is_active !== false
    };
  } else {
    profileForm.value = {
      name: '',
      location_type: 'RETAIL',
      bundle_id: null,
      charge_signature: '',
      asset_signature: '',
      configuration: '{}',
      billing_line_items: [],
      is_active: true
    };
  }
  
  showProfileDialog.value = true;
};

const saveProfile = async () => {
  if (!profileForm.value.name) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Profile name is required',
      life: 3000
    });
    return;
  }

  saving.value = true;
  try {
    const profileData = {
      ...profileForm.value,
      id: editingProfile.value?.id
    };

    // Parse configuration JSON (but don't add billing_line_items to it)
    try {
      profileData.configuration = JSON.parse(profileData.configuration || '{}');
    } catch (e) {
      profileData.configuration = {};
    }
    
    // billing_line_items stays as a separate field

    const success = await customerContractsStore.saveLocationProfile(props.customerId, profileData);
    
    if (success) {
      // Reload profiles to ensure consistency
      if (!editingProfile.value) {
        await customerContractsStore.loadLocationProfiles(props.customerId);
      }
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Profile ${editingProfile.value ? 'updated' : 'created'} successfully`,
        life: 3000
      });
      showProfileDialog.value = false;
    } else {
      throw new Error('Failed to save profile');
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save profile',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

const confirmDeleteProfile = (profile) => {
  if (!profile || !profile.id) {
    console.error('Invalid profile for deletion:', profile);
    return;
  }
  
  // Use PrimeVue's confirmation service or simple confirm
  if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
    deleteProfile(profile);
  }
};

const deleteProfile = async (profile) => {
  if (!profile || !profile.id) {
    console.error('Cannot delete profile: invalid profile data', profile);
    return;
  }
  
  try {
    const success = await customerContractsStore.deleteLocationProfile(profile.id);
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Profile "${profile.name}" deleted successfully`,
        life: 3000
      });
    } else {
      throw new Error('Failed to delete profile');
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete profile',
      life: 3000
    });
  }
};

const duplicateProfile = (profile) => {
  openProfileDialog({
    ...profile,
    id: null,
    name: `${profile.name} (Copy)`
  });
};

const toggleProfileMenu = (event, profile) => {
  profileMenu.value.currentTarget = profile;
  profileMenu.value.toggle(event);
};

const getBundleName = (bundleId) => {
  const bundle = customerContractsStore.bundles.find(b => b.id === bundleId);
  return bundle?.name;
};

const formatChargeSignature = (signature) => {
  if (!signature) return 'N/A';
  return chargeSignatureService.formatSignature(signature);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
};

const calculateLineItemsTotal = () => {
  if (!profileForm.value.billing_line_items) return 0;
  return profileForm.value.billing_line_items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
};

const hasLineItems = (profile) => {
  // billing_line_items is now a direct property of the profile
  return profile.billing_line_items && profile.billing_line_items.length > 0;
};

const getLineItemCount = (profile) => {
  // billing_line_items is now a direct property of the profile
  return profile.billing_line_items?.length || 0;
};

const importBillingLineItems = async () => {
  if (!profileForm.value.charge_signature) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'No charge signature available for this profile',
      life: 3000
    });
    return;
  }

  loadingLineItems.value = true;
  try {
    const billingDetails = await billingDetailsService.getBillingDetailsBySignature(
      props.customerId,
      profileForm.value.charge_signature
    );
    
    if (billingDetails.line_items && billingDetails.line_items.length > 0) {
      profileForm.value.billing_line_items = billingDetails.line_items;
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Imported ${billingDetails.line_items.length} billing line items`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'info',
        summary: 'No Data',
        detail: 'No billing line items found for this charge signature',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Failed to import billing line items:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to import billing line items',
      life: 3000
    });
  } finally {
    loadingLineItems.value = false;
  }
};

const loadChargeSignatures = async () => {
  loadingSignatures.value = true;
  try {
    const response = await chargeSignatureService.getChargeSignatures(props.customerId);
    
    // Combine charge and asset signatures
    const signatures = [];
    
    if (response.charge_signatures?.unique_signatures) {
      response.charge_signatures.unique_signatures.forEach(sig => {
        // Find matching asset signature
        const assetSig = response.asset_signatures?.unique_signatures?.find(
          a => a.location_ids?.some(id => sig.location_ids?.includes(id))
        );
        
        signatures.push({
          charge_signature: sig.signature,
          asset_signature: assetSig?.signature || '',
          location_count: sig.location_count,
          avg_monthly_cost: sig.avg_monthly_cost,
          suggested_name: suggestProfileName(sig.signature)
        });
      });
    }
    
    chargeSignatures.value = signatures;
  } catch (error) {
    console.error('Failed to load charge signatures:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load audit data',
      life: 3000
    });
  } finally {
    loadingSignatures.value = false;
  }
};

const suggestProfileName = (signature) => {
  // Generate suggested name based on signature pattern
  const parts = signature.split('-');
  if (parts.includes('TP') && parts.includes('TA')) {
    return 'Full Service Location';
  } else if (parts.includes('TP')) {
    return 'Phone Only Location';
  } else if (parts.includes('TA')) {
    return 'Internet Only Location';
  }
  return 'Standard Location';
};

const importSelectedSignatures = async () => {
  if (selectedSignatures.value.length === 0) return;
  
  importing.value = true;
  try {
    // Create profiles for each selected signature
    const createdProfiles = [];
    for (const sig of selectedSignatures.value) {
      const profileData = {
        name: sig.suggested_name || 'Imported Profile',
        location_type: 'OTHER',
        bundle_id: null,
        charge_signature: sig.charge_signature,
        asset_signature: sig.asset_signature,
        configuration: {
          imported_from_audit: true,
          location_count: sig.location_count,
          avg_monthly_cost: sig.avg_monthly_cost
        },
        location_count: sig.location_count,
        monthly_revenue: sig.avg_monthly_cost,
        is_active: true
      };
      
      const success = await customerContractsStore.saveLocationProfile(props.customerId, profileData);
      if (success) {
        createdProfiles.push(profileData);
      }
    }
    
    // Reload profiles to ensure we have the latest data with IDs
    await customerContractsStore.loadLocationProfiles(props.customerId);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Created ${createdProfiles.length} location profiles`,
      life: 3000
    });
    
    showSignatureImport.value = false;
    selectedSignatures.value = [];
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to import profiles',
      life: 3000
    });
  } finally {
    importing.value = false;
  }
};

// Watch for signature import dialog
watch(showSignatureImport, (newVal) => {
  if (newVal) {
    loadChargeSignatures();
  }
});

// Load profiles on mount
onMounted(async () => {
  if (props.customerId) {
    await customerContractsStore.loadLocationProfiles(props.customerId);
  }
});
</script>

<style scoped>
.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.profile-card {
  border: 1px solid var(--surface-border);
  transition: all 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: var(--surface-50);
  border-radius: 0.5rem;
  border: 2px dashed var(--surface-border);
}

.signature-table :deep(.p-datatable-row) {
  cursor: pointer;
}

.signature-table :deep(.p-datatable-row:hover) {
  background-color: var(--surface-hover);
}
</style>