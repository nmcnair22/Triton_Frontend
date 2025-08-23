<template>
  <div class="sof-tab-enhanced">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Schedule of Fees</h3>
        <p class="text-surface-600 dark:text-surface-400">
          Select products from the catalog and set negotiated rates for this contract
        </p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Import from Template" 
          icon="pi pi-download" 
          outlined
          @click="showImportDialog = true"
          :disabled="!customerContractsStore.hasActiveContract"
        />
        <Button 
          label="Add Products" 
          icon="pi pi-plus" 
          @click="showProductCatalog = true"
          :disabled="!customerContractsStore.hasActiveContract"
        />
      </div>
    </div>

    <!-- Contract Required Notice -->
    <Card v-if="!customerContractsStore.hasActiveContract" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Contract Required</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          A Schedule of Fees is automatically created with each contract. Please select or create a contract first.
        </p>
        <Button 
          label="Go to Contracts" 
          icon="pi pi-arrow-left"
          @click="$emit('switch-tab', '0')"
        />
      </template>
    </Card>

    <!-- Loading State -->
    <div v-else-if="customerContractsStore.loading.sof" class="text-center py-8">
      <ProgressSpinner size="50" />
      <p class="mt-4 text-surface-600 dark:text-surface-400">Loading Schedule of Fees...</p>
    </div>

    <!-- SoF Content -->
    <div v-else>
      <!-- Contract Info & Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card class="col-span-2">
          <template #content>
            <div class="flex justify-between items-center">
              <div>
                <h4 class="text-lg font-semibold mb-2">{{ customerContractsStore.currentContract.name }}</h4>
                <p class="text-surface-600 dark:text-surface-400">
                  Term: {{ formatDate(customerContractsStore.currentContract.term_start) }} - 
                        {{ formatDate(customerContractsStore.currentContract.term_end) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-surface-500">Contract Status</p>
                <Tag :value="customerContractsStore.currentContract.status" 
                     :severity="getStatusSeverity(customerContractsStore.currentContract.status)" />
              </div>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #content>
            <h5 class="text-md font-semibold mb-3">Pricing Summary</h5>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Monthly Recurring:</span>
                <span class="font-mono font-semibold">{{ formatCurrency(monthlyTotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Annual Services:</span>
                <span class="font-mono">{{ formatCurrency(annualTotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span>One-time Charges:</span>
                <span class="font-mono">{{ formatCurrency(oneTimeTotal) }}</span>
              </div>
              <Divider />
              <div class="flex justify-between text-primary">
                <span class="font-semibold">Est. Annual Value:</span>
                <span class="font-mono font-bold">{{ formatCurrency(estimatedAnnualValue) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Filter and Search Bar -->
      <Card class="mb-4" v-if="customerContractsStore.sofLines.length > 0">
        <template #content>
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex-1">
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-search"></i>
                </InputGroupAddon>
                <InputText 
                  v-model="searchQuery" 
                  placeholder="Search products..."
                  class="w-full"
                />
              </InputGroup>
            </div>
            <Select 
              v-model="filterCategory"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Categories"
              class="w-full md:w-48"
              showClear
            />
            <Select 
              v-model="filterCadence"
              :options="cadenceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Cadences"
              class="w-full md:w-40"
              showClear
            />
          </div>
        </template>
      </Card>

      <!-- SoF Lines Table -->
      <Card class="shadow-sm">
        <template #content>
          <!-- Empty State -->
          <div v-if="customerContractsStore.sofLines.length === 0" class="text-center py-12">
            <i class="pi pi-inbox text-6xl text-surface-300 mb-4"></i>
            <h5 class="text-xl font-medium text-surface-900 dark:text-surface-0 mb-2">No Products in Schedule</h5>
            <p class="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
              Start by adding products from the catalog. You can then customize pricing for this specific contract.
            </p>
            <Button 
              label="Browse Product Catalog" 
              icon="pi pi-shopping-cart"
              @click="showProductCatalog = true"
              size="large"
            />
          </div>

          <!-- SoF Table -->
          <DataTable 
            v-else
            :value="filteredSofLines" 
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            responsiveLayout="scroll"
            stripedRows
            class="sof-lines-table"
            :globalFilterFields="['product_name', 'product_code', 'category']"
            :rowClass="(data) => editingRowId === data.id ? 'editing-row' : ''"
          >
            <Column field="product_code" header="Code" style="min-width: 100px" sortable>
              <template #body="{ data }">
                <code class="text-xs">{{ data.product_code }}</code>
              </template>
            </Column>
            
            <Column field="product_name" header="Product/Service" style="min-width: 200px" sortable>
              <template #body="{ data }">
                <div>
                  <div class="font-medium">{{ data.product_name }}</div>
                  <div class="text-xs text-surface-500">{{ data.category }}</div>
                </div>
              </template>
            </Column>
            
            <Column field="rack_price" header="Rack Price" style="min-width: 120px" sortable>
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ formatCurrency(data.rack_price, data.currency) }}</span>
              </template>
            </Column>
            
            <Column field="negotiated_price" header="Negotiated Price" style="min-width: 150px">
              <template #body="{ data }">
                <div v-if="editingRowId === data.id" class="flex items-center gap-1">
                  <InputNumber 
                    v-model="editingRowData.line_price_override" 
                    mode="currency"
                    :currency="data.currency"
                    locale="en-US"
                    :placeholder="String(data.rack_price)"
                    class="flex-1 max-w-[140px]"
                    :inputClass="'text-sm'"
                  />
                </div>
                <div v-else class="flex items-center justify-between">
                  <span class="font-mono text-sm">
                    {{ data.line_price_override ? formatCurrency(data.line_price_override, data.currency) : '-' }}
                  </span>
                  <Tag v-if="data.line_price_override" severity="info" class="text-xs ml-2">Override</Tag>
                </div>
              </template>
            </Column>
            
            <Column field="line_discount_percent" header="Discount %" style="min-width: 110px">
              <template #body="{ data }">
                <div v-if="editingRowId === data.id">
                  <InputNumber 
                    v-model="editingRowData.line_discount_percent" 
                    suffix="%" 
                    :min="0" 
                    :max="100"
                    :maxFractionDigits="2"
                    class="w-full max-w-[100px]"
                    :disabled="!!editingRowData.line_price_override"
                    :inputClass="'text-sm'"
                  />
                </div>
                <div v-else>
                  <span v-if="data.line_discount_percent" class="font-mono text-sm">
                    {{ data.line_discount_percent }}%
                  </span>
                  <span v-else class="text-surface-400">-</span>
                </div>
              </template>
            </Column>
            
            <Column field="cadence" header="Billing" style="min-width: 100px" sortable>
              <template #body="{ data }">
                <Select
                  v-if="editingRowId === data.id"
                  v-model="editingRowData.cadence"
                  :options="cadenceOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full text-sm"
                />
                <Tag 
                  v-else
                  :value="data.cadence" 
                  :severity="getCadenceSeverity(data.cadence)"
                  class="text-xs"
                />
              </template>
            </Column>
            
            <Column field="final_price" header="Final Price" style="min-width: 130px" sortable>
              <template #body="{ data }">
                <div>
                  <span class="font-mono font-semibold text-primary">
                    {{ formatCurrency(editingRowId === data.id ? calculateFinalPrice(editingRowData) : calculateFinalPrice(data), data.currency) }}
                  </span>
                  <div v-if="(editingRowId === data.id ? editingRowData.line_discount_percent : data.line_discount_percent) && !(editingRowId === data.id ? editingRowData.line_price_override : data.line_price_override)" class="text-xs text-green-600">
                    -{{ editingRowId === data.id ? editingRowData.line_discount_percent : data.line_discount_percent }}%
                  </div>
                </div>
              </template>
            </Column>
            
            <Column header="Actions" style="min-width: 150px" frozen alignFrozen="right">
              <template #body="{ data }">
                <div v-if="editingRowId === data.id" class="flex gap-1">
                  <Button 
                    icon="pi pi-check" 
                    size="small"
                    severity="success"
                    @click="saveRow(data)"
                    v-tooltip="'Save changes'"
                  />
                  <Button 
                    icon="pi pi-times" 
                    size="small"
                    severity="secondary"
                    @click="cancelEdit()"
                    v-tooltip="'Cancel'"
                  />
                </div>
                <div v-else class="flex gap-1">
                  <Button 
                    icon="pi pi-pencil" 
                    size="small"
                    text
                    @click="editRow(data)"
                    v-tooltip="'Edit'"
                  />
                  <Button 
                    icon="pi pi-copy" 
                    size="small"
                    text
                    @click="duplicateLine(data)"
                    v-tooltip="'Duplicate'"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    size="small"
                    text
                    severity="danger"
                    @click="confirmRemoveLine(data)"
                    v-tooltip="'Remove'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>

          <!-- Bulk Actions Bar -->
          <div v-if="customerContractsStore.sofLines.length > 0" class="flex justify-between items-center mt-4 pt-4 border-t">
            <div class="flex gap-2">
              <Button 
                label="Apply Global Discount" 
                icon="pi pi-percentage"
                outlined
                size="small"
                @click="showGlobalDiscountDialog = true"
              />
              <Button 
                label="Export to CSV" 
                icon="pi pi-download"
                outlined
                size="small"
                @click="exportToCSV"
              />
            </div>
            <div class="flex items-center gap-3">
              <span v-if="hasUnsavedChanges" class="text-sm text-orange-600 flex items-center gap-1">
                <i class="pi pi-exclamation-circle"></i>
                Unsaved changes
              </span>
              <Button 
                label="Save All Changes" 
                icon="pi pi-save"
                :loading="customerContractsStore.loading.sof"
                @click="saveAllChanges"
                :disabled="!hasUnsavedChanges"
                :severity="hasUnsavedChanges ? 'warning' : 'secondary'"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Product Catalog Dialog -->
    <Dialog 
      v-model:visible="showProductCatalog" 
      header="Product Catalog"
      modal 
      class="w-[900px]"
      :draggable="false"
    >
      <div class="space-y-4">
        <!-- Catalog Search -->
        <div class="flex gap-3">
          <InputGroup class="flex-1">
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText 
              v-model="catalogSearch" 
              placeholder="Search products by name or code..."
              @keyup.enter="searchCatalog"
            />
          </InputGroup>
          <Select 
            v-model="catalogCategory"
            :options="catalogCategories"
            optionLabel="label"
            optionValue="value"
            placeholder="All Categories"
            class="w-48"
            showClear
            @change="searchCatalog"
          />
        </div>

        <!-- Products Grid -->
        <div v-if="catalogLoading" class="text-center py-8">
          <ProgressSpinner size="40" />
          <p class="mt-2 text-surface-600">Loading products...</p>
        </div>
        
        <div v-else-if="catalogProducts.length === 0" class="text-center py-8">
          <i class="pi pi-search text-4xl text-surface-400"></i>
          <p class="mt-2 text-surface-600">No products found</p>
        </div>

        <div v-else class="max-h-[500px] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card 
              v-for="product in catalogProducts" 
              :key="product.id"
              class="cursor-pointer hover:shadow-md transition-shadow"
              :class="{ 'ring-2 ring-primary': isProductSelected(product.id) }"
              @click="toggleProductSelection(product)"
            >
              <template #content>
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <code class="text-xs text-surface-500">{{ product.code }}</code>
                      <Tag :value="product.category" severity="secondary" class="text-xs" />
                    </div>
                    <h6 class="font-semibold text-sm mb-1">{{ product.name }}</h6>
                    <p class="text-xs text-surface-600">{{ product.description }}</p>
                    <div class="mt-2 flex items-center gap-3">
                      <span class="font-mono font-semibold">{{ formatCurrency(product.rack_price) }}</span>
                      <Tag :value="product.billing_type" :severity="getBillingTypeSeverity(product.billing_type)" class="text-xs" />
                    </div>
                  </div>
                  <Checkbox 
                    :modelValue="isProductSelected(product.id)"
                    :binary="true"
                    @update:modelValue="toggleProductSelection(product)"
                  />
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-between items-center">
          <span class="text-sm text-surface-600">
            {{ selectedProducts.length }} product(s) selected
          </span>
          <div class="flex gap-3">
            <Button 
              label="Cancel" 
              severity="secondary" 
              @click="closeCatalogDialog" 
            />
            <Button 
              label="Add to SOF" 
              icon="pi pi-plus"
              @click="addSelectedProducts"
              :disabled="selectedProducts.length === 0"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Global Discount Dialog -->
    <Dialog 
      v-model:visible="showGlobalDiscountDialog" 
      header="Apply Global Discount"
      modal 
      class="w-[400px]"
    >
      <div class="space-y-4">
        <p class="text-surface-600">
          Apply a discount percentage to all products in the Schedule of Fees. 
          This will override individual line discounts.
        </p>
        <div>
          <label class="block text-sm font-medium mb-2">Discount Percentage</label>
          <InputNumber 
            v-model="globalDiscountPercent" 
            suffix="%" 
            :min="0" 
            :max="100"
            :maxFractionDigits="2"
            class="w-full"
            placeholder="Enter discount percentage"
          />
        </div>
        <Message severity="info" :closable="false">
          <small>This will apply to all {{ customerContractsStore.sofLines.length }} products in the schedule</small>
        </Message>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showGlobalDiscountDialog = false" 
          />
          <Button 
            label="Apply Discount" 
            icon="pi pi-check"
            @click="applyGlobalDiscount"
            :disabled="!globalDiscountPercent || globalDiscountPercent <= 0"
          />
        </div>
      </template>
    </Dialog>

    <!-- Remove Confirmation Dialog -->
    <Dialog 
      v-model:visible="showRemoveConfirm" 
      header="Remove Product"
      modal 
      class="w-[400px]"
    >
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
        <p>Are you sure you want to remove <strong>{{ lineToRemove?.product_name }}</strong> from the Schedule of Fees?</p>
      </div>
      
      <template #footer>
        <div class="flex justify-center gap-3">
          <Button 
            label="Cancel" 
            severity="secondary" 
            @click="showRemoveConfirm = false" 
          />
          <Button 
            label="Remove" 
            severity="danger"
            @click="removeLine"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCustomerContractsStore } from '@/stores/customerContractsStore';
import { productCatalogService } from '@/services/productCatalogService';

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
const searchQuery = ref('');
const filterCategory = ref(null);
const filterCadence = ref(null);
const showProductCatalog = ref(false);
const showGlobalDiscountDialog = ref(false);
const showRemoveConfirm = ref(false);
const showImportDialog = ref(false);
const lineToRemove = ref(null);
const globalDiscountPercent = ref(null);
const hasUnsavedChanges = ref(false);

// Row editing state
const editingRowId = ref(null);
const editingRowData = ref({});
const originalRowData = ref({});

// Catalog State
const catalogSearch = ref('');
const catalogCategory = ref(null);
const catalogProducts = ref([]);
const catalogCategories = ref([]);
const catalogLoading = ref(false);
const selectedProducts = ref([]);

// Options
const cadenceOptions = [
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Annual', value: 'Annual' },
  { label: 'One-time', value: 'One-time' }
];

// Computed
const filteredSofLines = computed(() => {
  let lines = [...customerContractsStore.sofLines];
  
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    lines = lines.filter(line => 
      line.product_name.toLowerCase().includes(search) ||
      line.product_code?.toLowerCase().includes(search) ||
      line.category?.toLowerCase().includes(search)
    );
  }
  
  if (filterCategory.value) {
    lines = lines.filter(line => line.category === filterCategory.value);
  }
  
  if (filterCadence.value) {
    lines = lines.filter(line => line.cadence === filterCadence.value);
  }
  
  return lines;
});

const categoryOptions = computed(() => {
  const categories = [...new Set(customerContractsStore.sofLines.map(line => line.category).filter(Boolean))];
  return categories.map(cat => ({ label: cat, value: cat }));
});

const monthlyTotal = computed(() => {
  return customerContractsStore.sofLines
    .filter(line => line.cadence === 'Monthly')
    .reduce((sum, line) => sum + calculateFinalPrice(line), 0);
});

const annualTotal = computed(() => {
  return customerContractsStore.sofLines
    .filter(line => line.cadence === 'Annual')
    .reduce((sum, line) => sum + calculateFinalPrice(line), 0);
});

const oneTimeTotal = computed(() => {
  return customerContractsStore.sofLines
    .filter(line => line.cadence === 'One-time')
    .reduce((sum, line) => sum + calculateFinalPrice(line), 0);
});

const estimatedAnnualValue = computed(() => {
  return (monthlyTotal.value * 12) + annualTotal.value;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

const getStatusSeverity = (status) => {
  const severityMap = {
    'Proposed': 'secondary',
    'Signed': 'info',
    'Active': 'success',
    'Suspended': 'warning',
    'Cancelled': 'danger',
    'Expired': 'secondary'
  };
  return severityMap[status] || 'secondary';
};

const getCadenceSeverity = (cadence) => {
  const severityMap = {
    'Monthly': 'info',
    'Annual': 'success',
    'One-time': 'secondary'
  };
  return severityMap[cadence] || 'secondary';
};

const getBillingTypeSeverity = (type) => {
  const severityMap = {
    'monthly': 'info',
    'annual': 'success',
    'one-time': 'secondary'
  };
  return severityMap[type] || 'secondary';
};

const calculateFinalPrice = (line) => {
  if (!line.rack_price) return 0;
  
  let finalPrice = line.rack_price;
  
  // Apply discount precedence: line_price_override > line_discount > rack_price
  if (line.line_price_override) {
    finalPrice = line.line_price_override;
  } else if (line.line_discount_percent) {
    const discountAmount = finalPrice * (line.line_discount_percent / 100);
    finalPrice = finalPrice - discountAmount;
  }
  
  return Math.round(finalPrice * 100) / 100;
};

const updateSofLine = (line) => {
  hasUnsavedChanges.value = true;
  line.final_price = calculateFinalPrice(line);
  
  // Mark as modified if not new
  if (!line._isNew) {
    line._modified = true;
  }
  
  // Force reactivity update
  const index = customerContractsStore.sofLines.findIndex(l => l.id === line.id || l === line);
  if (index !== -1) {
    customerContractsStore.sofLines[index] = { ...line };
  }
};

const clearOverride = (line) => {
  line.line_price_override = null;
  updateSofLine(line);
};

// Row editing methods
const editRow = (row) => {
  // Save original data for cancel
  originalRowData.value = { ...row };
  editingRowData.value = { ...row };
  editingRowId.value = row.id || row;
};

const saveRow = (row) => {
  // Apply changes from editingRowData to the actual row
  Object.assign(row, editingRowData.value);
  
  // Update the line with new values
  updateSofLine(row);
  
  // Clear editing state
  editingRowId.value = null;
  editingRowData.value = {};
  originalRowData.value = {};
  
  toast.add({
    severity: 'success',
    summary: 'Row Updated',
    detail: 'Changes saved successfully',
    life: 2000
  });
};

const cancelEdit = () => {
  // Reset to original values if needed
  editingRowId.value = null;
  editingRowData.value = {};
  originalRowData.value = {};
};

const duplicateLine = (line) => {
  const duplicate = {
    ...line,
    id: null,
    product_name: `${line.product_name} (Copy)`,
    _isNew: true
  };
  customerContractsStore.sofLines.push(duplicate);
  hasUnsavedChanges.value = true;
  
  toast.add({
    severity: 'success',
    summary: 'Line Duplicated',
    detail: 'Product line has been duplicated',
    life: 2000
  });
};

const confirmRemoveLine = (line) => {
  lineToRemove.value = line;
  showRemoveConfirm.value = true;
};

const removeLine = () => {
  if (!lineToRemove.value) return;
  
  // Find by id or by reference
  const index = customerContractsStore.sofLines.findIndex(l => 
    (l.id && l.id === lineToRemove.value.id) || l === lineToRemove.value
  );
  
  if (index !== -1) {
    // If this is a saved line (has an id), mark it for deletion
    const removedLine = customerContractsStore.sofLines[index];
    if (removedLine.id && !removedLine._isNew) {
      // Store the id for deletion on save
      if (!customerContractsStore.deletedSofLineIds) {
        customerContractsStore.deletedSofLineIds = [];
      }
      customerContractsStore.deletedSofLineIds.push(removedLine.id);
    }
    
    // Remove from the array
    customerContractsStore.sofLines.splice(index, 1);
    hasUnsavedChanges.value = true;
    
    toast.add({
      severity: 'success',
      summary: 'Product Removed',
      detail: `${removedLine.product_name} has been removed from the schedule`,
      life: 2000
    });
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Not Found',
      detail: 'Could not find the product to remove',
      life: 2000
    });
  }
  
  showRemoveConfirm.value = false;
  lineToRemove.value = null;
};

// Catalog Methods
const loadCatalog = async () => {
  catalogLoading.value = true;
  try {
    const [products, categories] = await Promise.all([
      productCatalogService.getAllProducts(),
      productCatalogService.getCategories()
    ]);
    
    catalogProducts.value = products;
    catalogCategories.value = categories.map(cat => ({ label: cat, value: cat }));
  } catch (error) {
    console.error('Failed to load catalog:', error);
    toast.add({
      severity: 'error',
      summary: 'Catalog Error',
      detail: 'Failed to load product catalog',
      life: 3000
    });
  } finally {
    catalogLoading.value = false;
  }
};

const searchCatalog = async () => {
  catalogLoading.value = true;
  try {
    const products = await productCatalogService.searchProducts(catalogSearch.value, catalogCategory.value);
    catalogProducts.value = products;
  } finally {
    catalogLoading.value = false;
  }
};

const isProductSelected = (productId) => {
  return selectedProducts.value.some(p => p.id === productId);
};

const toggleProductSelection = (product) => {
  const index = selectedProducts.value.findIndex(p => p.id === product.id);
  if (index === -1) {
    selectedProducts.value.push(product);
  } else {
    selectedProducts.value.splice(index, 1);
  }
};

const addSelectedProducts = () => {
  const newLines = selectedProducts.value.map(product => ({
    id: null,
    product_id: product.id,
    product_name: product.name,
    category_key: product.category_key,
    cadence: 'Monthly', // Default to monthly, user can change
    currency: product.currency || 'USD',
    rack_price: product.rack_price,
    no_discount: product.no_discount || false,
    line_discount_percent: null,
    line_price_override: null,
    notes: '',
    final_price: product.rack_price,
    _isNew: true
  }));
  
  // Use reactive push to ensure Vue tracks the changes
  newLines.forEach(line => {
    customerContractsStore.sofLines.push(line);
  });
  hasUnsavedChanges.value = true;
  
  toast.add({
    severity: 'success',
    summary: 'Products Added',
    detail: `${newLines.length} product(s) added to the schedule`,
    life: 3000
  });
  
  closeCatalogDialog();
};

const closeCatalogDialog = () => {
  showProductCatalog.value = false;
  selectedProducts.value = [];
  catalogSearch.value = '';
  catalogCategory.value = null;
};

const applyGlobalDiscount = () => {
  customerContractsStore.sofLines.forEach(line => {
    line.line_discount_percent = globalDiscountPercent.value;
    line.line_price_override = null;
    line.final_price = calculateFinalPrice(line);
  });
  
  hasUnsavedChanges.value = true;
  showGlobalDiscountDialog.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Discount Applied',
    detail: `${globalDiscountPercent.value}% discount applied to all products`,
    life: 3000
  });
  
  globalDiscountPercent.value = null;
};

const saveAllChanges = async () => {
  if (!customerContractsStore.currentContract?.id) return;
  
  try {
    // Filter lines that need saving
    const linesToSave = customerContractsStore.sofLines.filter(line => 
      line._isNew || line._modified
    );
    
    // Check if there are deletions to process
    const hasDeletes = customerContractsStore.deletedSofLineIds && 
                       customerContractsStore.deletedSofLineIds.length > 0;
    
    if (linesToSave.length === 0 && !hasDeletes) {
      toast.add({
        severity: 'info',
        summary: 'No Changes',
        detail: 'No changes to save',
        life: 2000
      });
      return;
    }
    
    // Save changes and process deletions
    await customerContractsStore.saveSofLines(
      customerContractsStore.currentContract.id,
      linesToSave,
      customerContractsStore.deletedSofLineIds || []
    );
    
    hasUnsavedChanges.value = false;
    
    // Clear deletion tracking
    customerContractsStore.deletedSofLineIds = [];
    
    // Mark all lines as saved
    customerContractsStore.sofLines.forEach(line => {
      delete line._isNew;
      delete line._modified;
    });
    
    const changeCount = linesToSave.length + (customerContractsStore.deletedSofLineIds?.length || 0);
    toast.add({
      severity: 'success',
      summary: 'Changes Saved',
      detail: `${changeCount} change(s) saved successfully`,
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: error.response?.data?.message || 'Failed to save changes. Please try again.',
      life: 3000
    });
  }
};

const exportToCSV = () => {
  const headers = ['Product Code', 'Product Name', 'Category', 'Rack Price', 'Discount %', 'Override Price', 'Final Price', 'Billing'];
  const rows = customerContractsStore.sofLines.map(line => [
    line.product_code,
    line.product_name,
    line.category,
    line.rack_price,
    line.line_discount_percent || '',
    line.line_price_override || '',
    calculateFinalPrice(line),
    line.cadence
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SOF_${customerContractsStore.currentContract.name}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  toast.add({
    severity: 'success',
    summary: 'Export Complete',
    detail: 'Schedule of Fees exported to CSV',
    life: 2000
  });
};

// Lifecycle
onMounted(async () => {
  if (showProductCatalog.value) {
    await loadCatalog();
  }
});

// Watchers
watch(showProductCatalog, async (newVal) => {
  if (newVal) {
    await loadCatalog();
  }
});

watch(
  () => customerContractsStore.currentContract?.id,
  async (contractId) => {
    if (contractId) {
      await customerContractsStore.loadSofLines(contractId);
      hasUnsavedChanges.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.sof-tab-enhanced {
  max-width: 1400px;
}

.sof-lines-table :deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--surface-50);
  font-weight: 600;
  padding: 0.75rem;
  white-space: nowrap;
}

.sof-lines-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  vertical-align: middle;
}

/* Row editing styles */
.sof-lines-table :deep(.editing-row) {
  background-color: var(--primary-50) !important;
  border: 1px solid var(--primary-300);
}

.sof-lines-table :deep(.editing-row:hover) {
  background-color: var(--primary-50) !important;
}

/* Input field containment */
.sof-lines-table :deep(.p-inputnumber) {
  width: 100%;
  max-width: 100%;
}

.sof-lines-table :deep(.p-inputnumber input) {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  width: 100%;
}

.sof-lines-table :deep(.p-select) {
  width: 100%;
  font-size: 0.875rem;
}

.sof-lines-table :deep(.p-select .p-select-label) {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* Prevent overflow */
.sof-lines-table :deep(.p-column-header-content) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sof-lines-table :deep(.p-datatable .p-datatable-tbody > tr > td) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action buttons */
.sof-lines-table :deep(.p-button-sm) {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.sof-lines-table :deep(.p-datatable-row-expansion) {
  background-color: var(--surface-50);
}

/* Frozen column styling */
.sof-lines-table :deep(.p-frozen-column) {
  background-color: var(--surface-0);
  border-left: 1px solid var(--surface-border);
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
}
</style>