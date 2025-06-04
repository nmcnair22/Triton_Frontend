<template>
  <div class="card">
    <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Available Templates</div>
    
    <!-- Loading templates message -->
    <div v-if="isLoadingTemplates" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <span class="ml-3">Loading templates...</span>
    </div>
    
    <!-- Error loading templates -->
    <div v-else-if="templatesError" class="p-4 flex flex-col items-center justify-center">
      <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-3"></i>
      <div class="text-lg text-yellow-500">{{ templatesError }}</div>
    </div>
    
    <!-- No templates available message -->
    <div v-else-if="!selectedCustomer" class="p-4 flex flex-col items-center justify-center">
      <i class="pi pi-users text-4xl text-primary mb-3"></i>
      <div class="text-lg">Select a customer to see available templates</div>
    </div>
    
    <!-- No templates for selected customer -->
    <div v-else-if="availableTemplates.length === 0" class="p-4 flex flex-col items-center justify-center">
      <i class="pi pi-info-circle text-4xl text-primary mb-3"></i>
      <div class="text-lg">No templates available for this customer</div>
      <div v-if="selectedCustomerInvoice" class="text-sm text-surface-600 dark:text-surface-400 mt-2">
        Try selecting a different invoice or customer
      </div>
    </div>
    
    <!-- Templates list -->
    <div v-else>
      <ul class="list-none p-0 m-0">
        <li v-for="template in availableTemplates" :key="template.id" 
            class="p-3 mb-2 flex items-center justify-between cursor-pointer border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm transition-all hover:shadow hover:bg-surface-50 dark:hover:bg-surface-800"
            :class="{ 'bg-surface-50 dark:bg-surface-800 border-primary-300 dark:border-primary-700': selectedTemplate?.id === template.id }"
            @click="$emit('template-select', template)">
          <div class="flex items-center">
            <i class="pi pi-file-pdf text-2xl mr-3 text-primary-500" v-if="template.output_format === 'pdf'"></i>
            <i class="pi pi-file-excel text-2xl mr-3 text-green-500" v-else-if="template.output_format === 'excel'"></i>
            <i class="pi pi-file text-2xl mr-3 text-blue-500" v-else></i>
            <div>
              <div class="text-surface-900 dark:text-surface-0 font-medium">{{ template.name }}</div>
              <div class="text-surface-600 dark:text-surface-400 text-sm">{{ template.description || 'No description' }}</div>
            </div>
          </div>
          <Tag v-if="template.type" :severity="getTemplateTypeBadge(template.type).severity">
            {{ getTemplateTypeBadge(template.type).label }}
          </Tag>
        </li>
      </ul>
      
      <!-- Invoice Date Override Section -->
      <div class="mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-lg text-primary-500"></i>
            <span class="font-semibold text-surface-900 dark:text-surface-0">Invoice Date Override</span>
          </div>
          <ToggleSwitch 
            :modelValue="useInvoiceDateOverride" 
            @update:modelValue="$emit('update:useInvoiceDateOverride', $event)"
            @change="onOverrideToggle" />
        </div>
        
        <div v-if="useInvoiceDateOverride" class="space-y-3">
          <!-- Date Picker -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
              Override Date <span class="text-red-500">*</span>
            </label>
            <DatePicker 
              :modelValue="invoiceDateOverride" 
              @update:modelValue="$emit('update:invoiceDateOverride', $event)"
              @date-select="onDateSelect"
              dateFormat="yy-mm-dd"
              placeholder="YYYY-MM-DD"
              :minDate="minOverrideDate"
              :maxDate="maxOverrideDate"
              :class="{ 'p-invalid': overrideDateError }"
              showIcon
              iconDisplay="input"
              class="w-full" />
          </div>
          
          <!-- Validation Messages -->
          <div v-if="overrideDateError" class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <i class="pi pi-times-circle"></i>
            <span>{{ overrideDateError }}</span>
          </div>
          
          <div v-else-if="invoiceDateOverride && isValidOverrideDate" class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <i class="pi pi-check-circle"></i>
            <span>Valid override date selected</span>
          </div>
          
          <!-- Preview Information -->
          <div v-if="invoiceDateOverride && isValidOverrideDate" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <div class="font-medium mb-1">File Naming Preview:</div>
              <div>Files will be named with <strong>{{ getOverrideDatePrefix() }}</strong> prefix</div>
              <div class="text-xs mt-1 text-blue-600 dark:text-blue-300">
                Instead of using the original invoice date for file naming
              </div>
            </div>
          </div>
          
          <!-- Help Text -->
          <div class="text-xs text-surface-600 dark:text-surface-400">
            <i class="pi pi-info-circle mr-1"></i>
            Override the invoice date used for PDF display and file naming. Date must be between 2020-01-01 and {{ getCurrentYear() + 1 }}-12-31.
          </div>
        </div>
      </div>
      
      <!-- Generate template button -->
      <div class="mt-4">
        <Button v-if="!isMergeMode"
            label="Generate Template" 
            icon="pi pi-file-export" 
            class="w-full" 
            :disabled="!selectedTemplate || !selectedCustomerInvoice || isGeneratingTemplate" 
            :loading="isGeneratingTemplate"
            @click="$emit('generate-template')" />
        
        <Button v-else
            :label="mergeButtonLabel" 
            icon="pi pi-objects-column" 
            class="w-full" 
            :disabled="!canMerge" 
            :loading="isMergingInvoices"
            severity="success"
            @click="$emit('merge-invoices')" />
      </div>
      
      <!-- Merge validation messages -->
      <div v-if="isMergeMode" class="mt-3">
        <div v-if="selectedInvoicesForMerge.length === 0" class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <i class="pi pi-info-circle"></i>
          <span>Select invoices from the table above to merge</span>
        </div>
        <div v-else-if="selectedInvoicesForMerge.length === 1" class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Select at least one more invoice to merge</span>
        </div>
        <div v-else-if="selectedInvoicesForMerge.length > 50" class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <i class="pi pi-times-circle"></i>
          <span>Maximum 50 invoices allowed for merge</span>
        </div>
        <div v-else-if="!selectedTemplate" class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Select a template to proceed with merge</span>
        </div>
        <div v-else class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <i class="pi pi-check-circle"></i>
          <span>Ready to merge {{ selectedInvoicesForMerge.length }} invoices</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import ToggleSwitch from 'primevue/toggleswitch';
import DatePicker from 'primevue/datepicker';

const props = defineProps({
  selectedTemplate: Object,
  availableTemplates: Array,
  isLoadingTemplates: Boolean,
  templatesError: String,
  selectedCustomer: Object,
  selectedCustomerInvoice: Object,
  isGeneratingTemplate: Boolean,
  isMergeMode: Boolean,
  mergeButtonLabel: String,
  canMerge: Boolean,
  isMergingInvoices: Boolean,
  selectedInvoicesForMerge: Array,
  getTemplateTypeBadge: Function,
  // Invoice Date Override props
  useInvoiceDateOverride: Boolean,
  invoiceDateOverride: [Date, String],
  overrideDateError: String
});

const emit = defineEmits([
  'template-select', 
  'generate-template', 
  'merge-invoices',
  'update:useInvoiceDateOverride',
  'update:invoiceDateOverride',
  'override-toggle',
  'date-select'
]);

// Date validation computed properties
const minOverrideDate = computed(() => new Date('2020-01-01'));
const maxOverrideDate = computed(() => {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  return maxDate;
});

const isValidOverrideDate = computed(() => {
  if (!props.invoiceDateOverride) return false;
  
  const date = new Date(props.invoiceDateOverride);
  return date >= minOverrideDate.value && 
         date <= maxOverrideDate.value && 
         !isNaN(date.getTime());
});

// Helper methods
function getCurrentYear() {
  return new Date().getFullYear();
}

function getOverrideDatePrefix() {
  if (!props.invoiceDateOverride || !isValidOverrideDate.value) return '';
  
  const date = new Date(props.invoiceDateOverride);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  return `${months[date.getMonth()]}_${date.getFullYear()}`;
}

function onOverrideToggle() {
  emit('override-toggle');
}

function onDateSelect(date) {
  emit('date-select', date);
}
</script> 