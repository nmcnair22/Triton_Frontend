<template>
  <div class="profiles-tab">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Location Profiles</h3>
        <p class="text-surface-600 dark:text-surface-400">Manage location signature profiles for conformance tracking</p>
      </div>
      <Button 
        label="New Profile" 
        icon="pi pi-plus"
        @click="showCreateProfile = true"
        :disabled="customerContractsStore.loading.profiles"
      />
    </div>

    <!-- Loading State -->
    <div v-if="customerContractsStore.loading.profiles" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600 dark:text-surface-400">Loading location profiles...</p>
    </div>

    <!-- No Data State -->
    <Card v-else-if="customerContractsStore.locationProfiles.length === 0" class="text-center py-8">
      <template #content>
        <i class="pi pi-bookmark text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Location Profiles</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Create location profiles to track asset and charge signature conformance.
        </p>
        <Button 
          label="Create First Profile" 
          icon="pi pi-plus"
          @click="showCreateProfile = true"
        />
      </template>
    </Card>

    <!-- Profiles Table -->
    <Card v-else class="shadow-sm">
      <template #content>
        <DataTable 
          :value="customerContractsStore.locationProfiles" 
          responsiveLayout="scroll"
          stripedRows
          class="profiles-table"
        >
          <Column field="profile_name" header="Profile Name" sortable>
            <template #body="{ data }">
              <div class="font-medium">{{ data.profile_name }}</div>
              <div class="text-sm text-surface-500">{{ data.description || 'No description' }}</div>
            </template>
          </Column>
          
          <Column field="asset_signature" header="Asset Signature">
            <template #body="{ data }">
              <Tag 
                :value="truncateSignature(data.asset_signature)" 
                severity="success"
                v-tooltip="data.asset_signature || 'No signature'"
              />
            </template>
          </Column>
          
          <Column field="charge_signature" header="Charge Signature">
            <template #body="{ data }">
              <Tag 
                :value="truncateSignature(data.charge_signature)" 
                severity="warning"
                v-tooltip="data.charge_signature || 'No signature'"
              />
            </template>
          </Column>
          
          <Column field="expected_total_monthly" header="Expected Monthly">
            <template #body="{ data }">
              <span v-if="data.expected_total_monthly">
                ${{ formatCurrency(data.expected_total_monthly) }}
              </span>
              <span v-else class="text-surface-400">Not set</span>
            </template>
          </Column>
          
          <Column field="tolerance_percent" header="Tolerance">
            <template #body="{ data }">
              {{ data.tolerance_percent || 5 }}%
            </template>
          </Column>
          
          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-pencil" 
                  size="small"
                  text
                  @click="editProfile(data)"
                  v-tooltip="'Edit Profile'"
                />
                <Button 
                  icon="pi pi-eye" 
                  size="small"
                  text
                  severity="info"
                  @click="viewProfile(data)"
                  v-tooltip="'View Details'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Create/Edit Profile Dialog -->
    <Dialog 
      v-model:visible="showCreateProfile" 
      header="Create Location Profile"
      modal 
      class="w-[600px]"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Profile Name</label>
          <InputText 
            v-model="profileForm.profile_name" 
            placeholder="Enter profile name"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <Textarea 
            v-model="profileForm.description" 
            placeholder="Describe this profile"
            rows="3"
            class="w-full"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Expected Monthly Total</label>
            <InputNumber 
              v-model="profileForm.expected_total_monthly" 
              mode="currency"
              currency="USD"
              locale="en-US"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Tolerance %</label>
            <InputNumber 
              v-model="profileForm.tolerance_percent" 
              suffix="%" 
              :min="0" 
              :max="100"
              :maxFractionDigits="1"
              class="w-full"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Asset Signature</label>
          <InputText 
            v-model="profileForm.asset_signature" 
            placeholder="Asset signature pattern"
            class="w-full"
            readonly
          />
          <small class="text-surface-500">Will be populated from location data</small>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Charge Signature</label>
          <InputText 
            v-model="profileForm.charge_signature" 
            placeholder="Charge signature pattern"
            class="w-full"
            readonly
          />
          <small class="text-surface-500">Will be populated from location data</small>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showCreateProfile = false" 
          />
          <Button 
            label="Create Profile" 
            @click="saveProfile"
            :loading="customerContractsStore.loading.profiles"
            :disabled="!isFormValid"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';

const props = defineProps({
  customerId: {
    type: [String, Number],
    required: true
  }
});

const toast = useToast();
const customerContractsStore = useCustomerContractsStore();

// State
const showCreateProfile = ref(false);
const profileForm = reactive({
  id: null,
  profile_name: '',
  description: '',
  asset_signature: '',
  charge_signature: '',
  expected_total_monthly: null,
  tolerance_percent: 5
});

// Computed
const isFormValid = computed(() => 
  profileForm.profile_name.trim().length > 0
);

// Methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const truncateSignature = (signature) => {
  if (!signature) return 'None';
  return signature.length > 20 ? `${signature.substring(0, 20)}...` : signature;
};

const editProfile = (profile) => {
  Object.assign(profileForm, {
    id: profile.id,
    profile_name: profile.profile_name,
    description: profile.description || '',
    asset_signature: profile.asset_signature || '',
    charge_signature: profile.charge_signature || '',
    expected_total_monthly: profile.expected_total_monthly,
    tolerance_percent: profile.tolerance_percent || 5
  });
  showCreateProfile.value = true;
};

const viewProfile = (profile) => {
  toast.add({
    severity: 'info',
    summary: 'Profile Details',
    detail: `Viewing details for ${profile.profile_name}`,
    life: 3000
  });
};

const saveProfile = async () => {
  try {
    const success = await customerContractsStore.saveLocationProfile(props.customerId, profileForm);
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Profile Saved',
        detail: profileForm.id ? 'Profile updated successfully' : 'Profile created successfully',
        life: 3000
      });
      showCreateProfile.value = false;
      resetForm();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save profile. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Error',
      detail: 'An error occurred while saving the profile',
      life: 3000
    });
  }
};

const resetForm = () => {
  Object.assign(profileForm, {
    id: null,
    profile_name: '',
    description: '',
    asset_signature: '',
    charge_signature: '',
    expected_total_monthly: null,
    tolerance_percent: 5
  });
};

// Watchers
watch(() => showCreateProfile.value, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

// Lifecycle
onMounted(async () => {
  // Load location profiles when tab is accessed
  if (customerContractsStore.locationProfiles.length === 0 && !customerContractsStore.loading.profiles) {
    await customerContractsStore.loadLocationProfiles(props.customerId);
  }
});
</script>

<style scoped>
.profiles-tab {
  max-width: 1200px;
}

.profiles-table :deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--surface-50);
  font-weight: 600;
  padding: 0.75rem;
}

.profiles-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}
</style>