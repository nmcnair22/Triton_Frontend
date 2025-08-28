<template>
  <div class="billing-mapping-table">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600">Loading billing mappings...</p>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" class="mb-4">
      {{ error }}
    </Message>

    <!-- Main Content -->
    <div v-else>
      <!-- Actions Bar -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <h5 class="font-medium">Billing Line Item Mapping</h5>
          <Badge 
            v-if="mappedCount > 0" 
            :value="`${mappedCount}/${billingItems.length} mapped`" 
            :severity="mappedCount === billingItems.length ? 'success' : 'warning'"
          />
        </div>
        
        <div class="flex gap-2">
          <Button 
            label="Get Suggestions" 
            icon="pi pi-magic-wand"
            size="small"
            @click="loadSuggestions"
            :loading="loadingSuggestions"
            :disabled="!contractId"
          />
          <Button 
            v-if="suggestions.length > 0"
            label="Apply All Suggestions" 
            icon="pi pi-check-circle"
            size="small"
            severity="success"
            @click="applyAllSuggestions"
            :disabled="!hasSuggestions || applyingAll"
            :loading="applyingAll"
          />
        </div>
      </div>

      <!-- Mapping Table -->
      <DataTable 
        :value="billingItems" 
        size="small" 
        class="billing-mapping-table"
        responsiveLayout="scroll"
        :loading="saving"
      >
        <Column field="charge_code" header="Code" style="width: 12%">
          <template #body="{ data }">
            <code class="font-bold text-primary bg-primary-50 px-2 py-1 rounded text-sm">
              {{ data.charge_code }}
            </code>
          </template>
        </Column>
        
        <Column field="description" header="Description" style="width: 28%">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.description }}</div>
              <div class="text-xs text-surface-500 mt-1">
                Category: {{ data.category || 'Unknown' }}
              </div>
            </div>
          </template>
        </Column>

        <Column field="total_amount" header="Amount" style="width: 12%">
          <template #body="{ data }">
            <div class="font-mono font-bold text-green-600">
              {{ formatCurrency(data.total_amount) }}
            </div>
          </template>
        </Column>
        
        <Column header="AI Suggestion" style="width: 28%">
          <template #body="{ data }">
            <div v-if="getSuggestion(data.charge_code)" class="suggestion-card p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-sm text-blue-700 dark:text-blue-300">
                    {{ getSuggestion(data.charge_code).suggested_bundle_name }}
                  </div>
                  <div class="text-xs text-surface-600 mt-1">
                    {{ getSuggestion(data.charge_code).reason }}
                  </div>
                </div>
                <div class="flex items-center gap-2 ml-3">
                  <Badge 
                    :value="`${Math.round(getSuggestion(data.charge_code).confidence * 100)}%`" 
                    :severity="getConfidenceSeverity(getSuggestion(data.charge_code).confidence)"
                    class="text-xs"
                  />
                  <Button 
                    icon="pi pi-check"
                    size="small"
                    @click="applySuggestion(data.charge_code)"
                    :disabled="isApplying(data.charge_code)"
                    v-tooltip="'Apply suggestion'"
                  />
                </div>
              </div>
            </div>
            <div v-else-if="loadingSuggestions" class="text-center py-2">
              <i class="pi pi-spin pi-spinner text-surface-400"></i>
            </div>
            <div v-else class="text-sm text-surface-400">
              No suggestion available
            </div>
          </template>
        </Column>
        
        <Column header="Mapped Bundle" style="width: 20%">
          <template #body="{ data }">
            <div class="space-y-2">
              <Select 
                v-model="data.mapped_bundle_id"
                :options="availableBundles"
                optionLabel="name"
                optionValue="id"
                placeholder="Select bundle..."
                @change="updateMapping(data)"
                class="w-full"
                :loading="isSavingMapping(data.charge_code)"
                :disabled="isSavingMapping(data.charge_code)"
              />
              
              <div v-if="data.mapped_bundle_id" class="flex items-center gap-2">
                <Tag 
                  v-if="getMappingInfo(data.charge_code)?.auto_mapped" 
                  value="Auto-mapped" 
                  severity="success" 
                  class="text-xs"
                />
                <Tag 
                  v-else-if="getMappingInfo(data.charge_code)?.mapped_by_user_id" 
                  value="Manual" 
                  severity="info" 
                  class="text-xs"
                />
                <span class="text-xs text-surface-500">
                  Confidence: {{ Math.round((getMappingInfo(data.charge_code)?.mapping_confidence || 1) * 100) }}%
                </span>
              </div>
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Summary -->
      <div class="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div class="text-center">
            <div class="font-bold text-lg text-primary">{{ mappedCount }}</div>
            <div class="text-surface-600">Mapped Items</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-lg text-orange-600">{{ unmappedCount }}</div>
            <div class="text-surface-600">Unmapped Items</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-lg text-green-600">{{ Math.round(mappingProgress) }}%</div>
            <div class="text-surface-600">Mapping Progress</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { auditClient } from '@/services/auditClient';

// Props
const props = defineProps({
  billingItems: {
    type: Array,
    required: true,
    default: () => []
  },
  availableBundles: {
    type: Array,
    required: true,
    default: () => []
  },
  contractId: {
    type: Number,
    required: true
  },
  customerId: {
    type: Number,
    required: true
  }
});

// Emits
const emit = defineEmits(['mapping-updated']);

// Composables
const toast = useToast();

// State
const loading = ref(false);
const loadingSuggestions = ref(false);
const saving = ref(false);
const applyingAll = ref(false);
const savingMappings = ref(new Set()); // Track individual mapping saves
const error = ref(null);

const suggestions = ref([]);
const existingMappings = ref([]);

// Computed
const mappedCount = computed(() => {
  return props.billingItems.filter(item => item.mapped_bundle_id).length;
});

const unmappedCount = computed(() => {
  return props.billingItems.length - mappedCount.value;
});

const mappingProgress = computed(() => {
  return props.billingItems.length > 0 ? (mappedCount.value / props.billingItems.length) * 100 : 0;
});

const hasSuggestions = computed(() => {
  return suggestions.value.length > 0;
});

// Methods
const loadSuggestions = async () => {
  if (!props.contractId) return;

  loadingSuggestions.value = true;
  try {
    const response = await auditClient.http.get(
      `/contracts/${props.contractId}/billing-mappings?include_unmapped=true&include_suggestions=true`
    );

    suggestions.value = response.data.suggestions || [];
    existingMappings.value = response.data.mappings || [];

    // Update billing items with existing mappings
    updateBillingItemsWithMappings(response.data.mappings);

    toast.add({
      severity: 'info',
      summary: 'Suggestions Loaded',
      detail: `Found ${suggestions.value.length} mapping suggestions`,
      life: 4000
    });

  } catch (err) {
    console.error('Failed to load suggestions:', err);
    error.value = err.response?.data?.message || 'Failed to load suggestions';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load mapping suggestions',
      life: 5000
    });
  } finally {
    loadingSuggestions.value = false;
  }
};

const updateBillingItemsWithMappings = (mappings) => {
  mappings.forEach(mapping => {
    const item = props.billingItems.find(item => item.charge_code === mapping.charge_code);
    if (item) {
      item.mapped_bundle_id = mapping.bundle?.id;
    }
  });
};

const getSuggestion = (chargeCode) => {
  return suggestions.value.find(s => s.charge_code === chargeCode);
};

const getMappingInfo = (chargeCode) => {
  return existingMappings.value.find(m => m.charge_code === chargeCode);
};

const applySuggestion = async (chargeCode) => {
  const suggestion = getSuggestion(chargeCode);
  if (!suggestion) return;

  const item = props.billingItems.find(item => item.charge_code === chargeCode);
  if (!item) return;

  // Update local state immediately for UI responsiveness
  item.mapped_bundle_id = suggestion.suggested_bundle_id;

  // Save to backend
  await updateMapping(item, true); // true indicates auto-mapped
};

const applyAllSuggestions = async () => {
  if (!hasSuggestions.value) return;

  applyingAll.value = true;
  const mappingsToApply = [];

  // Prepare all mappings
  suggestions.value.forEach(suggestion => {
    const item = props.billingItems.find(item => item.charge_code === suggestion.charge_code);
    if (item && !item.mapped_bundle_id) { // Only apply if not already mapped
      item.mapped_bundle_id = suggestion.suggested_bundle_id;
      mappingsToApply.push({
        charge_code: suggestion.charge_code,
        bundle_id: suggestion.suggested_bundle_id
      });
    }
  });

  try {
    // Use batch endpoint for efficiency
    const response = await auditClient.http.post(
      `/contracts/${props.contractId}/billing-mappings/batch`,
      {
        mappings: mappingsToApply
      }
    );

    toast.add({
      severity: 'success',
      summary: 'Bulk Mapping Applied',
      detail: `Applied ${mappingsToApply.length} suggestions successfully`,
      life: 5000
    });

    emit('mapping-updated');

  } catch (err) {
    console.error('Failed to apply bulk mappings:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to apply bulk mappings',
      life: 5000
    });
  } finally {
    applyingAll.value = false;
  }
};

const updateMapping = async (item, autoMapped = false) => {
  if (!props.contractId || !item.charge_code) return;

  // Track this mapping as being saved
  savingMappings.value.add(item.charge_code);

  try {
    const response = await auditClient.http.post(
      `/contracts/${props.contractId}/billing-mappings`,
      {
        mappings: [{
          charge_code: item.charge_code,
          bundle_id: item.mapped_bundle_id
        }]
      }
    );

    // Update local mapping info
    const existingIndex = existingMappings.value.findIndex(m => m.charge_code === item.charge_code);
    const mappingInfo = {
      charge_code: item.charge_code,
      bundle: props.availableBundles.find(b => b.id === item.mapped_bundle_id),
      auto_mapped: autoMapped,
      mapping_confidence: autoMapped ? (getSuggestion(item.charge_code)?.confidence || 1) : 1
    };

    if (existingIndex >= 0) {
      existingMappings.value[existingIndex] = mappingInfo;
    } else {
      existingMappings.value.push(mappingInfo);
    }

    emit('mapping-updated');

    if (!autoMapped) { // Don't show toast for individual auto-mappings
      toast.add({
        severity: 'success',
        summary: 'Mapping Saved',
        detail: `${item.charge_code} mapped to bundle`,
        life: 3000
      });
    }

  } catch (err) {
    console.error('Failed to save mapping:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save mapping',
      life: 5000
    });
  } finally {
    savingMappings.value.delete(item.charge_code);
  }
};

const isApplying = (chargeCode) => {
  return savingMappings.value.has(chargeCode);
};

const isSavingMapping = (chargeCode) => {
  return savingMappings.value.has(chargeCode);
};

const getConfidenceSeverity = (confidence) => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'info'; 
  if (confidence >= 0.4) return 'warning';
  return 'danger';
};

const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Lifecycle
onMounted(() => {
  // Auto-load suggestions if we have a contract
  if (props.contractId) {
    loadSuggestions();
  }
});

// Watchers
watch(
  () => props.contractId,
  (newContractId) => {
    if (newContractId) {
      loadSuggestions();
    }
  }
);
</script>

<style scoped>
.billing-mapping-table {
  min-width: 100%;
}

.suggestion-card {
  border: 1px solid #dbeafe;
  transition: all 0.2s ease;
}

.suggestion-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.billing-mapping-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.75rem;
  vertical-align: top;
}

.billing-mapping-table :deep(.p-select) {
  min-width: 200px;
}

@media (max-width: 768px) {
  .billing-mapping-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
  }
  
  .suggestion-card {
    padding: 0.5rem;
  }
}
</style>