<template>
  <div class="license-coverage-panel space-y-6">
    <!-- Bundle Coverage Cards -->
    <div v-if="bundleCoverage?.length > 0">
      <div class="flex items-center justify-between mb-4">
        <h6 class="text-lg font-medium">Service Bundle Coverage</h6>
        <Badge :value="`${bundleCoverage.length} bundles`" severity="info" />
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card 
          v-for="coverage in bundleCoverage" 
          :key="coverage.bundle_name" 
          class="bundle-coverage-card hover:shadow-lg transition-shadow"
        >
          <template #content>
            <div class="space-y-4">
              <!-- Bundle Header -->
              <div class="flex items-center justify-between">
                <h6 class="font-semibold text-primary text-lg">{{ coverage.bundle_name }}</h6>
                <Badge 
                  :value="`${coverage.licenses_provided} licenses`" 
                  severity="success"
                  class="text-sm font-medium"
                />
              </div>
              
              <!-- Asset Categories Covered -->
              <div class="space-y-2">
                <div class="text-sm font-medium text-surface-700">Asset Categories Covered:</div>
                <div class="flex flex-wrap gap-2">
                  <Tag 
                    v-for="category in coverage.covers" 
                    :key="category"
                    :value="getCategoryDisplayName(category)" 
                    severity="info"
                    class="text-xs"
                  >
                    <template #default>
                      <div class="flex items-center gap-1">
                        <i class="pi pi-cog"></i>
                        <span>{{ getCategoryDisplayName(category) }}</span>
                      </div>
                    </template>
                  </Tag>
                </div>
                
                <div v-if="coverage.covers.length === 0" class="text-sm text-surface-500 italic">
                  No asset categories specified
                </div>
              </div>
              
              <!-- Sample Assets Covered -->
              <div v-if="coverage.assets_covered?.length > 0" class="space-y-2">
                <div class="text-sm font-medium text-surface-700">Sample Assets:</div>
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                  <div class="text-xs font-mono text-surface-600 leading-relaxed">
                    {{ coverage.assets_covered.slice(0, 3).join(', ') }}
                    <span v-if="coverage.assets_covered.length > 3" class="text-primary">
                      ... +{{ coverage.assets_covered.length - 3 }} more
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Coverage Status -->
              <div class="pt-3 border-t border-surface-200 dark:border-surface-700">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-surface-600">Coverage Status:</span>
                  <Tag 
                    :value="getCoverageStatus(coverage)" 
                    :severity="getCoverageStatusSeverity(coverage)"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- No Bundle Coverage -->
    <Card v-else-if="bundleCoverage?.length === 0" class="text-center py-8">
      <template #content>
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <h5 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Bundle Coverage</h5>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          No service bundles are providing license coverage for the assets at this location.
        </p>
        <Button 
          label="Configure Bundles" 
          icon="pi pi-cog"
          outlined
          @click="$emit('navigate-to-bundles')"
        />
      </template>
    </Card>

    <!-- Unmapped Charges Alert -->
    <Card v-if="unmappedCharges?.length > 0" class="unmapped-charges-card">
      <template #content>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center">
                <i class="pi pi-exclamation-triangle text-warning-600 text-sm"></i>
              </div>
            </div>
            <div class="flex-1">
              <h6 class="font-medium text-warning-700 dark:text-warning-300 mb-2">
                Unmapped Billing Codes Found
              </h6>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-3">
                These charges appear in billing but aren't mapped to service bundles. 
                This may indicate missing license coverage or unbundled services.
              </p>
              
              <!-- Unmapped Charges List -->
              <div class="space-y-2">
                <div class="text-sm font-medium text-surface-700">Unmapped Codes:</div>
                <div class="flex flex-wrap gap-2">
                  <Tag 
                    v-for="charge in unmappedCharges" 
                    :key="charge"
                    :value="charge" 
                    severity="warning"
                    class="text-xs font-mono"
                  />
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-2 mt-4">
                <Button 
                  label="Map Charges to Bundles" 
                  icon="pi pi-link"
                  size="small"
                  @click="$emit('navigate-to-mapping')"
                />
                <Button 
                  label="Create New Bundle" 
                  icon="pi pi-plus"
                  size="small"
                  outlined
                  @click="$emit('navigate-to-bundles')"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- License Coverage Summary -->
    <Card v-if="bundleCoverage?.length > 0" class="coverage-summary-card">
      <template #content>
        <div class="space-y-4">
          <h6 class="font-medium text-surface-900 dark:text-surface-0">License Coverage Summary</h6>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary mb-1">{{ totalLicensesProvided }}</div>
              <div class="text-sm text-surface-600">Total Licenses</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 mb-1">{{ uniqueCategoriesCovered }}</div>
              <div class="text-sm text-surface-600">Categories Covered</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 mb-1">{{ totalAssetsCovered }}</div>
              <div class="text-sm text-surface-600">Assets Covered</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold" :class="unmappedCharges?.length > 0 ? 'text-orange-600' : 'text-green-600'">
                {{ unmappedCharges?.length || 0 }}
              </div>
              <div class="text-sm text-surface-600">Unmapped Charges</div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600 dark:text-surface-400">Loading license coverage analysis...</p>
    </div>

    <!-- Error State -->
    <Message v-if="error" severity="error" class="mb-4">
      {{ error }}
    </Message>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { auditClient } from '@/services/auditClient';

// Props
const props = defineProps({
  bundleCoverage: {
    type: Array,
    default: () => []
  },
  unmappedCharges: {
    type: Array,
    default: () => []
  },
  locationId: {
    type: [String, Number],
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['navigate-to-mapping', 'navigate-to-bundles', 'refresh-coverage']);

// State
const assetCategories = ref([]);
const loadingCategories = ref(false);

// Computed
const totalLicensesProvided = computed(() => {
  return props.bundleCoverage?.reduce((sum, bundle) => sum + (bundle.licenses_provided || 0), 0) || 0;
});

const uniqueCategoriesCovered = computed(() => {
  const categories = new Set();
  props.bundleCoverage?.forEach(bundle => {
    bundle.covers?.forEach(category => categories.add(category));
  });
  return categories.size;
});

const totalAssetsCovered = computed(() => {
  const assets = new Set();
  props.bundleCoverage?.forEach(bundle => {
    bundle.assets_covered?.forEach(asset => assets.add(asset));
  });
  return assets.size;
});

// Methods
const loadAssetCategories = async () => {
  loadingCategories.value = true;
  try {
    const response = await auditClient.http.get('/audit/ref/asset-categories');
    assetCategories.value = response.data.asset_categories || [];
  } catch (err) {
    console.error('Failed to load asset categories:', err);
  } finally {
    loadingCategories.value = false;
  }
};

const getCategoryDisplayName = (categoryKey) => {
  const category = assetCategories.value.find(c => c.key === categoryKey);
  return category?.display_name || categoryKey;
};

const getCoverageStatus = (coverage) => {
  if (!coverage.assets_covered || coverage.assets_covered.length === 0) {
    return 'No Assets';
  }
  if (coverage.licenses_provided === 0) {
    return 'No Licenses';
  }
  if (coverage.licenses_provided >= coverage.assets_covered.length) {
    return 'Fully Covered';
  }
  return 'Partial Coverage';
};

const getCoverageStatusSeverity = (coverage) => {
  const status = getCoverageStatus(coverage);
  switch (status) {
    case 'Fully Covered': return 'success';
    case 'Partial Coverage': return 'warning';
    case 'No Licenses': return 'danger';
    case 'No Assets': return 'secondary';
    default: return 'info';
  }
};

// Lifecycle
onMounted(() => {
  loadAssetCategories();
});

// Watchers
watch(
  () => props.bundleCoverage,
  (newCoverage) => {
    // Could add logic here to analyze coverage changes
    if (newCoverage?.length > 0) {
      console.log('Bundle coverage updated:', newCoverage);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.license-coverage-panel {
  max-width: 100%;
}

.bundle-coverage-card {
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.bundle-coverage-card:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.unmapped-charges-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #f59e0b;
}

.coverage-summary-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #0ea5e9;
}

.bundle-coverage-card :deep(.p-card-content) {
  padding: 1.25rem;
}

.unmapped-charges-card :deep(.p-card-content) {
  padding: 1.25rem;
}

.coverage-summary-card :deep(.p-card-content) {
  padding: 1.25rem;
}

@media (max-width: 768px) {
  .grid.grid-cols-1.lg\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid.grid-cols-2.md\\:grid-cols-4 {
    grid-template-columns: 1fr 1fr;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .bundle-coverage-card {
    border-color: #374151;
  }
  
  .bundle-coverage-card:hover {
    border-color: #60a5fa;
  }
  
  .unmapped-charges-card {
    background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
    border-color: #d97706;
  }
  
  .coverage-summary-card {
    background: linear-gradient(135deg, #0c1629 0%, #1e3a8a 100%);
    border-color: #3b82f6;
  }
}
</style>