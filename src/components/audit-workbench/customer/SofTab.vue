<template>
  <div class="sof-tab">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Schedule of Fees</h3>
        <p class="text-surface-600 dark:text-surface-400">Manage pricing and discount structures</p>
      </div>
    </div>

    <!-- Contract Required Notice -->
    <Card v-if="!customerContractsStore.hasActiveContract" class="text-center py-8 mb-6">
      <template #content>
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-4"></i>
        <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Contract Required</h4>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          Please select or create a contract first to manage Schedule of Fees.
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

    <!-- Error State -->
    <Message 
      v-else-if="customerContractsStore.errors.sof" 
      severity="error" 
      class="mb-6"
    >
      Failed to load Schedule of Fees. {{ customerContractsStore.errors.sof.message || 'Unknown error occurred.' }}
    </Message>

    <!-- SoF Content -->
    <div v-else>
      <!-- Contract Info Header -->
      <Card class="mb-6" v-if="customerContractsStore.currentContract">
        <template #content>
          <div class="flex justify-between items-center">
            <div>
              <h4 class="text-lg font-semibold mb-2">{{ customerContractsStore.currentContract.name }}</h4>
              <p class="text-surface-600 dark:text-surface-400">
                Global Discount: {{ customerContractsStore.currentContract.global_discount_percent || 0 }}%
              </p>
            </div>
            <div class="text-right text-sm text-surface-500">
              <p>Term: {{ formatDate(customerContractsStore.currentContract.term_start) }} - 
                     {{ formatDate(customerContractsStore.currentContract.term_end) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- SoF Lines Table -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-semibold">Pricing Lines</h4>
            <Button 
              label="Add Product Line" 
              icon="pi pi-plus" 
              @click="addNewLine"
            />
          </div>

          <!-- Empty State -->
          <div v-if="customerContractsStore.sofLines.length === 0" class="text-center py-8">
            <i class="pi pi-calculator text-4xl text-surface-400 mb-4"></i>
            <h5 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">No Pricing Lines</h5>
            <p class="text-surface-600 dark:text-surface-400 mb-4">
              Add pricing lines to define your Schedule of Fees.
            </p>
            <Button 
              label="Add First Line" 
              icon="pi pi-plus"
              @click="addNewLine"
            />
          </div>

          <!-- SoF Table -->
          <DataTable 
            v-else
            :value="customerContractsStore.sofLines" 
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <Column field="product_name" header="Product" style="width: 20%">
              <template #body="slotProps">
                <span class="font-medium">{{ slotProps.data.product_name }}</span>
              </template>
            </Column>
            <Column field="rack_price" header="Rack Price" style="width: 15%">
              <template #body="slotProps">
                <span class="font-mono">{{ formatCurrency(slotProps.data.rack_price, slotProps.data.currency) }}</span>
              </template>
            </Column>
            <Column field="line_discount_percent" header="Line Discount %" style="width: 12%">
              <template #body="slotProps">
                <span v-if="slotProps.data.line_discount_percent">{{ slotProps.data.line_discount_percent }}%</span>
                <span v-else class="text-surface-400">-</span>
              </template>
            </Column>
            <Column field="line_price_override" header="Price Override" style="width: 15%">
              <template #body="slotProps">
                <span v-if="slotProps.data.line_price_override" class="font-mono">
                  {{ formatCurrency(slotProps.data.line_price_override, slotProps.data.currency) }}
                </span>
                <span v-else class="text-surface-400">-</span>
              </template>
            </Column>
            <Column field="final_price" header="Final Price" style="width: 15%">
              <template #body="slotProps">
                <span class="font-mono font-semibold text-primary">
                  {{ formatCurrency(slotProps.data.final_price, slotProps.data.currency) }}
                </span>
              </template>
            </Column>
            <Column field="cadence" header="Cadence" style="width: 10%">
              <template #body="slotProps">
                <Badge 
                  :value="slotProps.data.cadence" 
                  :severity="slotProps.data.cadence === 'Annual' ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column header="Actions" style="width: 13%">
              <template #body="slotProps">
                <div class="flex gap-1">
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-sm p-button-text" 
                    @click="editLine(slotProps.data)"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-sm p-button-text p-button-danger" 
                    @click="deleteLine(slotProps.data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>

          <!-- Save Button -->
          <div class="flex justify-end mt-4" v-if="customerContractsStore.sofLines.length > 0">
            <Button 
              label="Save SoF Changes" 
              icon="pi pi-save"
              :loading="customerContractsStore.loading.sof"
              @click="saveSofLines"
            />
          </div>
        </template>
      </Card>

      <!-- Create/Edit SoF Line Dialog -->
      <Dialog 
        v-model:visible="showSofLineDialog" 
        :header="sofLineForm.id ? 'Edit SoF Line' : 'Add SoF Line'"
        modal 
        class="w-[600px]"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Product Name</label>
            <InputText 
              v-model="sofLineForm.product_name" 
              placeholder="Enter product name"
              class="w-full"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Rack Price</label>
              <InputNumber 
                v-model="sofLineForm.rack_price" 
                mode="currency"
                :currency="sofLineForm.currency"
                locale="en-US"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Currency</label>
              <Select 
                v-model="sofLineForm.currency"
                :options="currencyOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select currency"
                class="w-full"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Line Discount %</label>
              <InputNumber 
                v-model="sofLineForm.line_discount_percent" 
                suffix="%" 
                :min="0" 
                :max="100"
                :maxFractionDigits="2"
                class="w-full"
                :disabled="!!sofLineForm.line_price_override"
              />
              <small class="text-surface-500">Disabled if price override is set</small>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Price Override</label>
              <InputNumber 
                v-model="sofLineForm.line_price_override" 
                mode="currency"
                :currency="sofLineForm.currency"
                locale="en-US"
                class="w-full"
                @input="onPriceOverrideChange"
              />
              <small class="text-surface-500">Overrides rack price + discounts</small>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Cadence</label>
            <Select 
              v-model="sofLineForm.cadence"
              :options="cadenceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select billing cadence"
              class="w-full"
            />
          </div>
          
          <div v-if="sofLineForm.final_price !== null" class="p-4 bg-surface-50 dark:bg-surface-800 rounded">
            <h6 class="font-medium mb-2">Final Price Calculation</h6>
            <div class="text-sm space-y-1">
              <div>Rack Price: {{ formatCurrency(sofLineForm.rack_price, sofLineForm.currency) }}</div>
              <div v-if="sofLineForm.line_discount_percent && !sofLineForm.line_price_override">
                Line Discount: {{ sofLineForm.line_discount_percent }}%
              </div>
              <div v-if="sofLineForm.line_price_override">
                Price Override: {{ formatCurrency(sofLineForm.line_price_override, sofLineForm.currency) }}
              </div>
              <div class="font-semibold text-primary border-t pt-1 mt-1">
                Final Price: {{ formatCurrency(sofLineForm.final_price, sofLineForm.currency) }}
              </div>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-3">
            <Button 
              label="Cancel" 
              severity="secondary" 
              @click="closeSofLineDialog" 
            />
                      <Button 
            :label="sofLineForm.id ? 'Save Changes' : 'Save Line'" 
            @click="saveSofLine"
            :loading="customerContractsStore.loading.sof"
            :disabled="!isSofLineFormValid"
          />
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, onMounted, watch, ref, computed, reactive } from 'vue';
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
const showSofLineDialog = ref(false);
const sofLineForm = reactive({
  id: null,
  product_name: '',
  rack_price: null,
  currency: 'USD',
  line_discount_percent: null,
  line_price_override: null,
  cadence: 'Monthly',
  final_price: null
});

// Options
const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'CAD', value: 'CAD' }
];

const cadenceOptions = [
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Annual', value: 'Annual' },
  { label: 'One-time', value: 'One-time' }
];

// Computed
const isSofLineFormValid = computed(() => 
  sofLineForm.product_name.trim().length > 0 && 
  sofLineForm.rack_price > 0 &&
  sofLineForm.currency &&
  sofLineForm.cadence
);

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

const addNewLine = () => {
  resetSofLineForm();
  showSofLineDialog.value = true;
};

const editLine = (line) => {
  Object.assign(sofLineForm, {
    id: line.id,
    product_name: line.product_name,
    rack_price: line.rack_price,
    currency: line.currency || 'USD',
    line_discount_percent: line.line_discount_percent,
    line_price_override: line.line_price_override,
    cadence: line.cadence || 'Monthly',
    final_price: line.final_price
  });
  showSofLineDialog.value = true;
};

const deleteLine = async (line) => {
  if (!customerContractsStore.currentContract?.id) return;
  
  try {
    const success = await customerContractsStore.deleteSofLine(
      customerContractsStore.currentContract.id,
      line.id
    );
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Line Deleted',
        detail: `${line.product_name} has been removed`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: 'Failed to delete SoF line. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error deleting SoF line:', error);
    toast.add({
      severity: 'error',
      summary: 'Delete Error',
      detail: 'An error occurred while deleting the line',
      life: 3000
    });
  }
};

const saveSofLines = async () => {
  if (!customerContractsStore.currentContract?.id) return;
  
  await customerContractsStore.saveSofLines(
    customerContractsStore.currentContract.id,
    customerContractsStore.sofLines
  );
};

const saveSofLine = async () => {
  if (!customerContractsStore.currentContract?.id) return;
  
  try {
    // Calculate final price locally for preview
    calculateFinalPrice();
    
    const success = await customerContractsStore.saveSofLine(
      customerContractsStore.currentContract.id,
      { ...sofLineForm }
    );
    
    if (success) {
      toast.add({
        severity: 'success',
        summary: 'SoF Line Saved',
        detail: sofLineForm.id ? 'Line updated successfully' : 'Line created successfully',
        life: 3000
      });
      
      // Reload SoF lines to get the latest data from backend
      if (customerContractsStore.currentContract?.id) {
        await customerContractsStore.loadSofLines(customerContractsStore.currentContract.id);
      }
      
      closeSofLineDialog();
    } else {
      toast.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save SoF line. Please try again.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error saving SoF line:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Error',
      detail: 'An error occurred while saving the line',
      life: 3000
    });
  }
};

const closeSofLineDialog = () => {
  showSofLineDialog.value = false;
  resetSofLineForm();
};

const resetSofLineForm = () => {
  Object.assign(sofLineForm, {
    id: null,
    product_name: '',
    rack_price: null,
    currency: 'USD',
    line_discount_percent: null,
    line_price_override: null,
    cadence: 'Monthly',
    final_price: null
  });
};

const onPriceOverrideChange = () => {
  // Clear discount if price override is set
  if (sofLineForm.line_price_override) {
    sofLineForm.line_discount_percent = null;
  }
  calculateFinalPrice();
};

const calculateFinalPrice = () => {
  if (!sofLineForm.rack_price) {
    sofLineForm.final_price = null;
    return;
  }
  
  let finalPrice = sofLineForm.rack_price;
  
  // Apply discount precedence: line_price_override > line_discount > rack_price
  if (sofLineForm.line_price_override) {
    finalPrice = sofLineForm.line_price_override;
  } else if (sofLineForm.line_discount_percent) {
    const discountAmount = finalPrice * (sofLineForm.line_discount_percent / 100);
    finalPrice = finalPrice - discountAmount;
  }
  
  sofLineForm.final_price = Math.round(finalPrice * 100) / 100;
};

// Load SoF data when contract changes
watch(
  () => customerContractsStore.currentContract?.id,
  async (contractId) => {
    if (contractId) {
      await customerContractsStore.loadSofLines(contractId);
    }
  },
  { immediate: true }
);
</script>