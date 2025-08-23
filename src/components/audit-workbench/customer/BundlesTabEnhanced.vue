<template>
  <div class="bundles-tab-enhanced">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Service Bundles</h3>
        <p class="text-surface-600 dark:text-surface-400">
          Create service bundles from SOF products to simplify billing and location profiles
        </p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Import from Existing" 
          icon="pi pi-download" 
          outlined
          @click="showImportDialog = true"
          :disabled="!hasActiveContract || sofProducts.length === 0"
        />
        <Button 
          label="Create Bundle" 
          icon="pi pi-plus" 
          @click="openCreateBundle"
          :disabled="!hasActiveContract || sofProducts.length === 0"
        />
      </div>
    </div>

    <!-- Prerequisites Check -->
    <Card v-if="!hasActiveContract" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Setup Required</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Service bundles require an active contract with products in the Schedule of Fees.
        </p>
        <Button 
          label="Go to Contracts" 
          icon="pi pi-arrow-left"
          @click="$emit('switch-tab', '0')"
        />
      </template>
    </Card>

    <Card v-else-if="sofProducts.length === 0" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-exclamation-triangle text-4xl text-orange-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Products Available</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Add products to the Schedule of Fees before creating service bundles.
        </p>
        <Button 
          label="Go to Schedule of Fees" 
          icon="pi pi-arrow-left"
          @click="$emit('switch-tab', '1')"
        />
      </template>
    </Card>

    <!-- Bundles Content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p class="text-surface-600 text-sm mb-1">Active Bundles</p>
                <p class="text-2xl font-bold text-green-600">{{ activeBundles.length }}</p>
              </div>
              <i class="pi pi-check-circle text-3xl text-green-300"></i>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">Products in SOF</p>
                <p class="text-2xl font-bold">{{ sofProducts.length }}</p>
              </div>
              <i class="pi pi-list text-3xl text-blue-300"></i>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-surface-600 text-sm mb-1">Unbundled Products</p>
                <p class="text-2xl font-bold text-orange-600">{{ unbundledProducts.length }}</p>
              </div>
              <i class="pi pi-exclamation-triangle text-3xl text-orange-300"></i>
            </div>
          </template>
        </Card>
      </div>

      <!-- Bundles Grid -->
      <div v-if="bundles.length === 0" class="text-center py-12">
        <Card>
          <template #content>
            <i class="pi pi-inbox text-6xl text-surface-300 mb-4"></i>
            <h5 class="text-xl font-medium text-surface-900 dark:text-surface-0 mb-2">No Service Bundles</h5>
            <p class="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
              Create service bundles to group related products together for simplified billing and location profile management.
            </p>
            <Button 
              label="Create Your First Bundle" 
              icon="pi pi-plus"
              @click="openCreateBundle"
              size="large"
            />
          </template>
        </Card>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card 
          v-for="bundle in bundles" 
          :key="bundle.id"
          class="bundle-card"
          :class="{ 'border-2 border-green-500': bundle.is_active }"
        >
          <template #header>
            <div class="px-6 pt-6 pb-2">
              <div class="flex justify-between items-start">
                <div>
                  <h5 class="text-lg font-semibold mb-1">{{ bundle.name }}</h5>
                  <p class="text-sm text-surface-600">{{ bundle.description }}</p>
                </div>
                <Tag 
                  :value="bundle.is_active ? 'Active' : 'Inactive'" 
                  :severity="bundle.is_active ? 'success' : 'secondary'"
                />
              </div>
            </div>
          </template>
          
          <template #content>
            <!-- Bundle Items -->
            <div class="mb-4">
              <h6 class="text-sm font-semibold mb-2 text-surface-700">Bundle Contents ({{ bundle.items?.length || 0 }} items)</h6>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                <div 
                  v-for="item in bundle.items" 
                  :key="item.id"
                  class="flex justify-between items-center text-sm py-1 px-2 bg-surface-50 rounded"
                >
                  <span class="flex items-center gap-2">
                    <i class="pi pi-circle-fill text-xs" :class="getItemTypeColor(item)"></i>
                    {{ item.product_name }}
                  </span>
                  <span class="font-mono text-xs">×{{ item.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- Pricing Tiers -->
            <div class="mb-4">
              <h6 class="text-sm font-semibold mb-2 text-surface-700">Pricing Tiers</h6>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div v-for="tier in bundle.pricing_tiers" :key="tier.tier_name" 
                     class="flex justify-between p-2 bg-surface-50 rounded">
                  <span>{{ tier.tier_name }}:</span>
                  <span class="font-mono font-semibold">{{ formatCurrency(tier.monthly_price) }}</span>
                </div>
              </div>
            </div>

            <!-- Bundle Metrics -->
            <div class="grid grid-cols-2 gap-2 text-xs text-surface-600">
              <div class="flex items-center gap-1">
                <i class="pi pi-calculator"></i>
                <span>Base Cost: {{ formatCurrency(calculateBundleBaseCost(bundle)) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <i class="pi pi-percentage"></i>
                <span>Margin: {{ calculateBundleMargin(bundle) }}%</span>
              </div>
            </div>
          </template>
          
          <template #footer>
            <div class="flex gap-2">
              <Button 
                label="Edit" 
                icon="pi pi-pencil"
                size="small"
                outlined
                class="flex-1"
                @click="editBundle(bundle)"
              />
              <Button 
                label="Clone" 
                icon="pi pi-copy"
                size="small"
                outlined
                class="flex-1"
                @click="cloneBundle(bundle)"
              />
              <Button 
                icon="pi pi-trash"
                size="small"
                outlined
                severity="danger"
                @click="confirmDeleteBundle(bundle)"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Create/Edit Bundle Dialog -->
    <Dialog 
      v-model:visible="showBundleDialog" 
      :header="bundleForm.id ? 'Edit Service Bundle' : 'Create Service Bundle'"
      modal 
      class="w-[900px]"
      :draggable="false"
    >
      <div class="space-y-4">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Bundle Name *</label>
            <InputText 
              v-model="bundleForm.name" 
              placeholder="e.g., Basic Network Package"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Status</label>
            <Select 
              v-model="bundleForm.is_active"
              :options="[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <Textarea 
            v-model="bundleForm.description" 
            rows="2"
            placeholder="Brief description of what this bundle includes..."
            class="w-full"
          />
        </div>

        <!-- Product Selection -->
        <div>
          <label class="block text-sm font-medium mb-2">Bundle Contents *</label>
          <div class="border rounded-lg p-3">
            <div class="flex gap-2 mb-3">
              <Select 
                v-model="selectedProductToAdd"
                :options="availableProducts"
                optionLabel="display"
                optionValue="id"
                placeholder="Select a product from SOF..."
                class="flex-1"
              />
              <InputNumber 
                v-model="quantityToAdd" 
                :min="1"
                :max="99"
                placeholder="Qty"
                class="w-24"
              />
              <Button 
                label="Add" 
                icon="pi pi-plus"
                @click="addProductToBundle"
                :disabled="!selectedProductToAdd || !quantityToAdd"
              />
            </div>
            
            <!-- Bundle Items List -->
            <div v-if="bundleForm.items.length === 0" class="text-center py-4 text-surface-500">
              No products added yet
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="(item, index) in bundleForm.items" 
                :key="index"
                class="flex items-center justify-between p-2 bg-surface-50 rounded"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-bars text-surface-400 cursor-move"></i>
                  <span class="font-medium">{{ item.product_name }}</span>
                  <code class="text-xs text-surface-500">{{ item.product_code }}</code>
                </div>
                <div class="flex items-center gap-2">
                  <InputNumber 
                    v-model="item.quantity" 
                    :min="1"
                    :max="99"
                    class="w-20"
                    @update:modelValue="calculateBundlePricing"
                  />
                  <Button 
                    icon="pi pi-times"
                    size="small"
                    text
                    severity="danger"
                    @click="removeProductFromBundle(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing Tiers -->
        <div>
          <label class="block text-sm font-medium mb-2">Pricing Tiers *</label>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="tier in pricingTiers" :key="tier.name" class="border rounded-lg p-3">
              <h6 class="font-semibold mb-2 text-center">{{ tier.label }}</h6>
              <div class="space-y-2">
                <div>
                  <label class="text-xs text-surface-600">Monthly Price</label>
                  <InputNumber 
                    v-model="bundleForm.pricing[tier.name].monthly" 
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    class="w-full"
                    :placeholder="suggestedPrices[tier.name]?.monthly.toFixed(2)"
                  />
                </div>
                <div>
                  <label class="text-xs text-surface-600">Setup Fee</label>
                  <InputNumber 
                    v-model="bundleForm.pricing[tier.name].setup" 
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    class="w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div class="mt-2 pt-2 border-t">
                <div class="text-xs text-surface-500">
                  Base Cost: {{ formatCurrency(calculateTierBaseCost()) }}
                </div>
                <div class="text-xs" :class="getTierMarginClass(tier.name)">
                  Margin: {{ calculateTierMargin(tier.name) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cost Analysis -->
        <Card class="bg-surface-50">
          <template #content>
            <h6 class="font-semibold mb-3">Bundle Cost Analysis</h6>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p class="text-surface-600 mb-1">Total Base Cost</p>
                <p class="font-mono font-semibold text-lg">{{ formatCurrency(calculateTierBaseCost()) }}</p>
              </div>
              <div>
                <p class="text-surface-600 mb-1">Recommended Price Range</p>
                <p class="font-mono">{{ formatCurrency(calculateTierBaseCost() * 1.3) }} - {{ formatCurrency(calculateTierBaseCost() * 1.8) }}</p>
              </div>
              <div>
                <p class="text-surface-600 mb-1">Average Margin</p>
                <p class="text-lg font-semibold" :class="getAverageMarginClass()">{{ calculateAverageMargin() }}%</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
      
      <template #footer>
        <div class="flex justify-between items-center">
          <Button 
            label="Apply Suggested Pricing" 
            icon="pi pi-sparkles"
            text
            @click="applySuggestedPricing"
            :disabled="bundleForm.items.length === 0"
          />
          <div class="flex gap-3">
            <Button 
              label="Cancel" 
              severity="secondary" 
              @click="closeBundleDialog" 
            />
            <Button 
              :label="bundleForm.id ? 'Save Changes' : 'Create Bundle'" 
              icon="pi pi-check"
              @click="saveBundle"
              :disabled="!isBundleFormValid"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog 
      v-model:visible="showDeleteConfirm" 
      header="Delete Bundle"
      modal 
      class="w-[400px]"
    >
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p>Are you sure you want to delete the bundle <strong>{{ bundleToDelete?.name }}</strong>?</p>
        <p class="text-sm text-surface-600 mt-2">This action cannot be undone.</p>
      </div>
      
      <template #footer>
        <div class="flex justify-center gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showDeleteConfirm = false" 
          />
          <Button 
            label="Delete" 
            severity="danger"
            @click="deleteBundle"
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

defineEmits(['switch-tab']);

const toast = useToast();
const customerContractsStore = useCustomerContractsStore();

// State
const showBundleDialog = ref(false);
const showDeleteConfirm = ref(false);
const showImportDialog = ref(false);
const bundleToDelete = ref(null);
const selectedProductToAdd = ref(null);
const quantityToAdd = ref(1);

// Form State
const bundleForm = reactive({
  id: null,
  name: '',
  description: '',
  is_active: true,
  items: [],
  pricing: {
    bronze: { monthly: null, setup: null },
    silver: { monthly: null, setup: null },
    gold: { monthly: null, setup: null }
  }
});

const suggestedPrices = reactive({
  bronze: { monthly: 0, setup: 0 },
  silver: { monthly: 0, setup: 0 },
  gold: { monthly: 0, setup: 0 }
});

// Pricing Tiers Configuration
const pricingTiers = [
  { name: 'bronze', label: 'Bronze Tier', multiplier: 1.3 },
  { name: 'silver', label: 'Silver Tier', multiplier: 1.5 },
  { name: 'gold', label: 'Gold Tier', multiplier: 1.8 }
];

// Computed
const hasActiveContract = computed(() => customerContractsStore.hasActiveContract);

const bundles = computed(() => customerContractsStore.bundles);

const activeBundles = computed(() => bundles.value.filter(b => b.is_active));

const sofProducts = computed(() => customerContractsStore.sofLines);

const availableProducts = computed(() => {
  return sofProducts.value.map(product => ({
    id: product.id || product.product_id,
    code: product.product_code,
    name: product.product_name,
    price: product.final_price || product.rack_price,
    display: `${product.product_name} (${product.product_code}) - ${formatCurrency(product.final_price || product.rack_price)}`
  }));
});

const unbundledProducts = computed(() => {
  const bundledProductIds = new Set();
  bundles.value.forEach(bundle => {
    bundle.items?.forEach(item => {
      bundledProductIds.add(item.product_id);
    });
  });
  
  return sofProducts.value.filter(product => !bundledProductIds.has(product.id || product.product_id));
});

const isBundleFormValid = computed(() => {
  return bundleForm.name && 
         bundleForm.name.trim().length > 0 && 
         bundleForm.items.length > 0 &&
         Object.values(bundleForm.pricing).some(tier => tier.monthly > 0);
});

// Methods
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const getItemTypeColor = (item) => {
  // You can customize this based on item properties
  return 'text-primary-500';
};

const calculateBundleBaseCost = (bundle) => {
  if (!bundle.items) return 0;
  
  return bundle.items.reduce((total, item) => {
    const product = sofProducts.value.find(p => (p.id || p.product_id) === item.product_id);
    const price = product ? (product.final_price || product.rack_price) : 0;
    return total + (price * item.quantity);
  }, 0);
};

const calculateBundleMargin = (bundle) => {
  const baseCost = calculateBundleBaseCost(bundle);
  if (!baseCost) return 0;
  
  // Use average of pricing tiers for margin calculation
  const avgPrice = bundle.pricing_tiers?.reduce((sum, tier) => sum + tier.monthly_price, 0) / (bundle.pricing_tiers?.length || 1);
  
  if (!avgPrice) return 0;
  return Math.round(((avgPrice - baseCost) / avgPrice) * 100);
};

const calculateTierBaseCost = () => {
  return bundleForm.items.reduce((total, item) => {
    const product = sofProducts.value.find(p => (p.id || p.product_id) === item.product_id);
    const price = product ? (product.final_price || product.rack_price) : 0;
    return total + (price * item.quantity);
  }, 0);
};

const calculateTierMargin = (tierName) => {
  const baseCost = calculateTierBaseCost();
  const tierPrice = bundleForm.pricing[tierName].monthly;
  
  if (!baseCost || !tierPrice) return 0;
  return Math.round(((tierPrice - baseCost) / tierPrice) * 100);
};

const getTierMarginClass = (tierName) => {
  const margin = calculateTierMargin(tierName);
  if (margin < 20) return 'text-red-600';
  if (margin < 30) return 'text-orange-600';
  return 'text-green-600';
};

const calculateAverageMargin = () => {
  const margins = Object.keys(bundleForm.pricing)
    .map(tier => calculateTierMargin(tier))
    .filter(m => m > 0);
  
  if (margins.length === 0) return 0;
  return Math.round(margins.reduce((a, b) => a + b, 0) / margins.length);
};

const getAverageMarginClass = () => {
  const margin = calculateAverageMargin();
  if (margin < 20) return 'text-red-600';
  if (margin < 30) return 'text-orange-600';
  return 'text-green-600';
};

const openCreateBundle = () => {
  resetBundleForm();
  calculateBundlePricing();
  showBundleDialog.value = true;
};

const editBundle = (bundle) => {
  Object.assign(bundleForm, {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    is_active: bundle.is_active,
    items: [...(bundle.items || [])],
    pricing: {
      bronze: {
        monthly: bundle.pricing_tiers?.find(t => t.tier_name === 'Bronze')?.monthly_price || null,
        setup: bundle.pricing_tiers?.find(t => t.tier_name === 'Bronze')?.setup_fee || null
      },
      silver: {
        monthly: bundle.pricing_tiers?.find(t => t.tier_name === 'Silver')?.monthly_price || null,
        setup: bundle.pricing_tiers?.find(t => t.tier_name === 'Silver')?.setup_fee || null
      },
      gold: {
        monthly: bundle.pricing_tiers?.find(t => t.tier_name === 'Gold')?.monthly_price || null,
        setup: bundle.pricing_tiers?.find(t => t.tier_name === 'Gold')?.setup_fee || null
      }
    }
  });
  
  calculateBundlePricing();
  showBundleDialog.value = true;
};

const cloneBundle = (bundle) => {
  Object.assign(bundleForm, {
    id: null,
    name: `${bundle.name} (Copy)`,
    description: bundle.description,
    is_active: false,
    items: [...(bundle.items || [])],
    pricing: {
      bronze: {
        monthly: bundle.pricing_tiers?.find(t => t.tier_name === 'Bronze')?.monthly_price || null,
        setup: bundle.pricing_tiers?.find(t => t.tier_name === 'Bronze')?.setup_fee || null
      },
      silver: {
        monthly: bundle.pricing_tiers?.find(t => t.tier_name === 'Silver')?.monthly_price || null,
        setup: bundle.pricing_tiers?.find(t => t.tier_name === 'Silver')?.setup_fee || null
      },
      gold: {
        monthly: bundle.pricing_tiers?.find(t => t.tier_name === 'Gold')?.monthly_price || null,
        setup: bundle.pricing_tiers?.find(t => t.tier_name === 'Gold')?.setup_fee || null
      }
    }
  });
  
  showBundleDialog.value = true;
};

const addProductToBundle = () => {
  if (!selectedProductToAdd.value || !quantityToAdd.value) return;
  
  const product = availableProducts.value.find(p => p.id === selectedProductToAdd.value);
  if (!product) return;
  
  // Check if product already exists in bundle
  const existingItem = bundleForm.items.find(item => item.product_id === product.id);
  if (existingItem) {
    existingItem.quantity += quantityToAdd.value;
  } else {
    bundleForm.items.push({
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      quantity: quantityToAdd.value,
      unit_price: product.price
    });
  }
  
  // Reset selection
  selectedProductToAdd.value = null;
  quantityToAdd.value = 1;
  
  // Recalculate pricing
  calculateBundlePricing();
};

const removeProductFromBundle = (index) => {
  bundleForm.items.splice(index, 1);
  calculateBundlePricing();
};

const calculateBundlePricing = () => {
  const baseCost = calculateTierBaseCost();
  
  pricingTiers.forEach(tier => {
    suggestedPrices[tier.name].monthly = Math.round(baseCost * tier.multiplier);
    suggestedPrices[tier.name].setup = Math.round(baseCost * 0.5); // 50% of base cost for setup
  });
};

const applySuggestedPricing = () => {
  Object.keys(suggestedPrices).forEach(tier => {
    bundleForm.pricing[tier].monthly = suggestedPrices[tier].monthly;
    bundleForm.pricing[tier].setup = suggestedPrices[tier].setup;
  });
  
  toast.add({
    severity: 'success',
    summary: 'Pricing Applied',
    detail: 'Suggested pricing has been applied to all tiers',
    life: 2000
  });
};

const saveBundle = async () => {
  // Transform form data to API format
  const bundleData = {
    id: bundleForm.id,
    name: bundleForm.name,
    description: bundleForm.description,
    is_active: bundleForm.is_active,
    prices: [
      {
        currency: 'USD',
        unit_price: bundleForm.pricing.bronze.monthly,
        label: 'Standard Rate'
      },
      {
        currency: 'USD',
        unit_price: bundleForm.pricing.silver.monthly,
        label: 'Volume Discount'
      },
      {
        currency: 'USD',
        unit_price: bundleForm.pricing.gold.monthly,
        label: 'Enterprise'
      }
    ],
    licenses: bundleForm.items.map(item => ({
      asset_category_key: item.category || 'GENERAL',
      service_level_key: 'STANDARD',
      term_months: 24,
      quantity: item.quantity
    }))
  };
  
  try {
    const success = await customerContractsStore.saveBundle(
      customerContractsStore.currentContract.id,
      bundleData
    );
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Bundle Saved',
        detail: bundleForm.id ? 'Bundle updated successfully' : 'Bundle created successfully',
        life: 3000
      });
      
      closeBundleDialog();
      
      // Reload bundles
      await customerContractsStore.loadBundles(customerContractsStore.currentContract.id);
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save bundle. Please try again.',
      life: 3000
    });
  }
};

const confirmDeleteBundle = (bundle) => {
  bundleToDelete.value = bundle;
  showDeleteConfirm.value = true;
};

const deleteBundle = async () => {
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
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: 'Failed to delete bundle. Please try again.',
      life: 3000
    });
  } finally {
    showDeleteConfirm.value = false;
    bundleToDelete.value = null;
  }
};

const resetBundleForm = () => {
  Object.assign(bundleForm, {
    id: null,
    name: '',
    description: '',
    is_active: true,
    items: [],
    pricing: {
      bronze: { monthly: null, setup: null },
      silver: { monthly: null, setup: null },
      gold: { monthly: null, setup: null }
    }
  });
};

const closeBundleDialog = () => {
  showBundleDialog.value = false;
  resetBundleForm();
};

// Lifecycle
onMounted(async () => {
  if (customerContractsStore.currentContract?.id) {
    await Promise.all([
      customerContractsStore.loadSofLines(customerContractsStore.currentContract.id),
      customerContractsStore.loadBundles(customerContractsStore.currentContract.id)
    ]);
  }
});

// Watchers
watch(
  () => customerContractsStore.currentContract?.id,
  async (contractId) => {
    if (contractId) {
      await Promise.all([
        customerContractsStore.loadSofLines(contractId),
        customerContractsStore.loadBundles(contractId)
      ]);
    }
  }
);
</script>

<style scoped>
.bundles-tab-enhanced {
  max-width: 1400px;
}

.bundle-card {
  transition: all 0.3s ease;
}

.bundle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>