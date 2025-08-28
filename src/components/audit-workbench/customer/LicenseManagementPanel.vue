<template>
  <div class="license-management-panel">
    <!-- Loading State -->
    <div v-if="loading.licenses" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600 dark:text-surface-400">Loading bundle licenses...</p>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" class="mb-4">
      Failed to load licenses: {{ error }}
    </Message>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Add New License Section -->
      <Card class="add-license-card">
        <template #content>
          <h5 class="font-medium mb-3 flex items-center gap-2">
            <i class="pi pi-plus text-primary"></i>
            Add License Allocation
          </h5>
          
          <div class="grid grid-cols-4 gap-3">
            <div class="field">
              <label class="text-sm font-medium mb-1 block">Asset Category</label>
              <Select 
                v-model="newLicense.asset_category_key"
                :options="props.assetCategories"
                optionLabel="display_name"
                optionValue="key"
                placeholder="Select category..."
                class="w-full"
                :disabled="props.loadingAssetCategories"
                @change="onCategoryChange"
              >
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <Tag 
                      :value="option.layer_key" 
                      :severity="getLayerSeverity(option.layer_key)"
                      class="text-xs"
                    />
                    <span>{{ option.display_name }}</span>
                  </div>
                </template>
              </Select>
            </div>

            <div class="field">
              <label class="text-sm font-medium mb-1 block">Service Level</label>
              <Select 
                v-model="newLicense.service_level_key"
                :options="serviceLevels"
                optionLabel="label"
                optionValue="key"
                placeholder="Select level..."
                class="w-full"
                :disabled="loading.serviceLevels"
              />
            </div>

            <div class="field">
              <label class="text-sm font-medium mb-1 block">Quantity/Location</label>
              <InputNumber 
                v-model="newLicense.quantity"
                :min="1"
                :max="999"
                placeholder="1"
                class="w-full"
              />
            </div>

            <div class="field">
              <label class="text-sm font-medium mb-1 block">Action</label>
              <Button 
                label="Add License"
                icon="pi pi-plus"
                @click="addLicense"
                :disabled="!canAddLicense"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Current Licenses Table -->
      <Card>
        <template #content>
          <div class="flex justify-between items-center mb-4">
            <h5 class="font-medium">Current License Allocations</h5>
            <Button 
              label="Save Changes" 
              icon="pi pi-save"
              @click="saveLicenses"
              :loading="saving"
              :disabled="!hasChanges"
              severity="success"
            />
          </div>

          <div v-if="bundleLicenses.length === 0" class="text-center py-8 text-surface-500">
            <i class="pi pi-key text-4xl mb-4"></i>
            <p class="text-lg">No licenses configured</p>
            <p class="text-sm">Add license allocations above to define what this bundle covers</p>
          </div>

          <DataTable 
            v-else
            :value="bundleLicenses" 
            editMode="cell"
            @cell-edit-complete="onCellEditComplete"
            class="license-table"
            responsiveLayout="scroll"
          >
            <Column field="asset_category_key" header="Asset Category" style="width: 30%">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Tag 
                    :value="getCategoryLayer(data.asset_category_key)" 
                    :severity="getLayerSeverity(getCategoryLayer(data.asset_category_key))"
                    class="text-xs"
                  />
                  <span class="font-medium">{{ getCategoryDisplayName(data.asset_category_key) }}</span>
                  <div class="text-xs text-surface-500">
                    {{ getCategoryDescription(data.asset_category_key) }}
                  </div>
                </div>
              </template>
            </Column>
            
            <Column field="service_level_key" header="Service Level" style="width: 15%">
              <template #body="{ data }">
                <Tag :value="data.service_level_key" severity="info" />
              </template>
            </Column>
            
            <Column field="quantity" header="Licenses/Location" style="width: 15%">
              <template #editor="{ data, field }">
                <InputNumber 
                  v-model="data[field]" 
                  :min="0"
                  :max="999"
                  @blur="markAsChanged"
                />
              </template>
              <template #body="{ data }">
                <div class="font-bold text-primary text-lg">{{ data.quantity }}</div>
              </template>
            </Column>
            
            <Column field="term_months" header="Term" style="width: 12%">
              <template #body="{ data }">
                <span class="text-sm">{{ data.term_months }} months</span>
              </template>
            </Column>
            
            <Column header="Actions" style="width: 12%">
              <template #body="{ data, index }">
                <Button 
                  icon="pi pi-trash"
                  size="small"
                  text
                  severity="danger"
                  @click="removeLicense(index)"
                  v-tooltip="'Remove License'"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- License Summary -->
      <Card class="summary-card">
        <template #content>
          <h6 class="font-medium mb-3">License Summary</h6>
          <div class="grid grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary mb-1">{{ bundleLicenses.length }}</div>
              <div class="text-sm text-surface-600">License Types</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 mb-1">{{ totalLicensesPerLocation }}</div>
              <div class="text-sm text-surface-600">Total/Location</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600 mb-1">{{ uniqueCategories.length }}</div>
              <div class="text-sm text-surface-600">Asset Categories</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600 mb-1">{{ uniqueLayers.length }}</div>
              <div class="text-sm text-surface-600">Network Layers</div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { auditClient } from '@/services/auditClient';

// Props
const props = defineProps({
  bundleId: {
    type: Number,
    required: true
  },
  contractId: {
    type: Number,
    required: true
  },
  assetCategories: {
    type: Array,
    default: () => []
  },
  loadingAssetCategories: {
    type: Boolean,
    default: false
  },
  assetCategoriesError: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['licenses-updated']);

// Composables
const toast = useToast();

// State
const bundleLicenses = ref([]);
const serviceLevels = ref([]);
const hasChanges = ref(false);
const error = ref(null);

const loading = ref({
  licenses: false,
  serviceLevels: false
});

const saving = ref(false);

const newLicense = ref({
  asset_category_key: '',
  service_level_key: 'STANDARD',
  quantity: 1,
  term_months: 12
});

// Computed
const canAddLicense = computed(() => {
  return newLicense.value.asset_category_key && 
         newLicense.value.service_level_key && 
         newLicense.value.quantity > 0 &&
         !isDuplicateLicense();
});

const totalLicensesPerLocation = computed(() => {
  return bundleLicenses.value.reduce((sum, license) => sum + (license.quantity || 0), 0);
});

const uniqueCategories = computed(() => {
  const categories = bundleLicenses.value.map(l => l.asset_category_key);
  return [...new Set(categories)];
});

const uniqueLayers = computed(() => {
  const layers = uniqueCategories.value.map(key => getCategoryLayer(key)).filter(Boolean);
  return [...new Set(layers)];
});

// Methods
const loadBundleLicenses = async () => {
  if (!props.bundleId || !props.contractId) return;

  loading.value.licenses = true;
  error.value = null;

  try {
    const response = await auditClient.http.get(
      `/contracts/${props.contractId}/bundles/${props.bundleId}/licenses`
    );
    
    bundleLicenses.value = response.data.licenses || [];
    hasChanges.value = false;
  } catch (err) {
    console.error('Failed to load bundle licenses:', err);
    // Handle 404 gracefully - bundle exists but has no licenses yet
    if (err.response?.status === 404) {
      bundleLicenses.value = [];
      hasChanges.value = false;
      error.value = null; // Don't show error for empty licenses
    } else {
      error.value = err.response?.data?.message || 'Failed to load licenses';
    }
  } finally {
    loading.value.licenses = false;
  }
};

// Asset categories now provided via props - no need to load them

const loadServiceLevels = async () => {
  // Extract customer ID from contract (you'll need to get this from your store or props)
  const customerId = props.contractId; // Assuming this relationship exists
  
  loading.value.serviceLevels = true;
  try {
    const response = await auditClient.getServiceLevels(customerId);
    // Backend returns { customer_id, levels: Array } - extract the levels array
    serviceLevels.value = response.data?.levels || response.data || [];
  } catch (err) {
    console.error('Failed to load service levels:', err);
    // Fallback service levels
    serviceLevels.value = [
      { key: 'STANDARD', label: 'Standard' },
      { key: 'PREMIUM', label: 'Premium' },
      { key: 'ENTERPRISE', label: 'Enterprise' }
    ];
  } finally {
    loading.value.serviceLevels = false;
  }
};

const addLicense = () => {
  if (!canAddLicense.value) return;

  bundleLicenses.value.push({
    ...newLicense.value
  });

  // Reset form
  newLicense.value = {
    asset_category_key: '',
    service_level_key: 'STANDARD',
    quantity: 1,
    term_months: 12
  };

  markAsChanged();
};

const removeLicense = (index) => {
  bundleLicenses.value.splice(index, 1);
  markAsChanged();
};

const saveLicenses = async () => {
  if (!props.bundleId || !props.contractId) return;

  saving.value = true;
  try {
    const response = await auditClient.http.put(
      `/contracts/${props.contractId}/bundles/${props.bundleId}/licenses`,
      {
        licenses: bundleLicenses.value
      }
    );

    toast.add({
      severity: 'success',
      summary: 'Licenses Saved',
      detail: `${response.data.licenses_updated} licenses updated successfully`,
      life: 5000
    });

    if (response.data.validation_warnings?.length > 0) {
      response.data.validation_warnings.forEach(warning => {
        toast.add({
          severity: 'warn',
          summary: 'Validation Warning',
          detail: warning,
          life: 7000
        });
      });
    }

    hasChanges.value = false;
    emit('licenses-updated', response.data);

  } catch (err) {
    console.error('Failed to save licenses:', err);
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: err.response?.data?.message || 'Failed to save licenses',
      life: 5000
    });
  } finally {
    saving.value = false;
  }
};

const isDuplicateLicense = () => {
  return bundleLicenses.value.some(license => 
    license.asset_category_key === newLicense.value.asset_category_key &&
    license.service_level_key === newLicense.value.service_level_key
  );
};

const markAsChanged = () => {
  hasChanges.value = true;
};

const onCellEditComplete = (event) => {
  markAsChanged();
};

const onCategoryChange = () => {
  // Could add logic here to suggest default service level based on category
};

// Utility functions
const getCategoryDisplayName = (key) => {
  const category = props.assetCategories.find(c => c.key === key);
  return category?.display_name || key;
};

const getCategoryDescription = (key) => {
  const category = props.assetCategories.find(c => c.key === key);
  return category?.description || '';
};

const getCategoryLayer = (key) => {
  const category = props.assetCategories.find(c => c.key === key);
  return category?.layer_key || '';
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

// Watchers
watch(
  () => [props.bundleId, props.contractId], 
  () => {
    if (props.bundleId && props.contractId) {
      loadBundleLicenses();
    }
  },
  { immediate: true }
);

// Lifecycle
onMounted(async () => {
  // Asset categories provided via props, only load service levels
  await loadServiceLevels();
});
</script>

<style scoped>
.license-management-panel {
  max-width: 100%;
}

.add-license-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
}

.license-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  vertical-align: top;
}

.summary-card {
  background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
}

.field label {
  color: #374151;
  font-weight: 500;
}

@media (max-width: 768px) {
  .grid.grid-cols-4 {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>