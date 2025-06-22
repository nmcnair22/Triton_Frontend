<template>
  <!-- Duplicate Merge Confirmation Dialog -->
  <Dialog :visible="showDuplicateConfirmation" @update:visible="$emit('update:showDuplicateConfirmation', $event)" header="Merge Already Exists" :style="{ width: '600px' }" modal>
    <div v-if="duplicateDetails" class="space-y-4">
      <div class="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-xl mt-1"></i>
        <div class="flex-1">
          <div class="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Duplicate Merge Detected
          </div>
          <div class="text-amber-700 dark:text-amber-300 text-sm">
            A merged invoice already exists for the selected invoices. You can either keep the existing merge or regenerate it with new settings.
          </div>
        </div>
      </div>
      
              <div class="space-y-4">
        <!-- Existing Merge Information -->
        <div v-if="duplicateDetails?.existing_merge" class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            Existing Merge Found
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-blue-700 dark:text-blue-300">Merged Invoice:</span>
              <span class="font-mono font-semibold text-blue-900 dark:text-blue-100">{{ duplicateDetails.existing_merge.merged_invoice_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700 dark:text-blue-300">Created:</span>
              <span class="text-blue-900 dark:text-blue-100">{{ formatDate(duplicateDetails.existing_merge.created_date) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700 dark:text-blue-300">Template:</span>
              <span class="text-blue-900 dark:text-blue-100">{{ duplicateDetails.existing_merge.template_used }}</span>
            </div>
          </div>
        </div>
        
        <!-- Selected Invoices -->
        <div class="space-y-3">
          <div class="font-medium text-surface-900 dark:text-surface-0">
            Selected Invoices for Merge:
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="invoice in getInvoiceNumbers()" :key="invoice" 
                  class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full text-sm font-mono">
              {{ invoice }}
            </span>
          </div>
        </div>
        
        <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
          <div class="font-medium text-surface-900 dark:text-surface-0 mb-2">
            What would you like to do?
          </div>
          <div class="text-sm text-surface-600 dark:text-surface-400">
            • <strong>Keep Existing:</strong> Cancel this merge and use the existing merged invoice<br>
            • <strong>Regenerate:</strong> Create a new merged invoice, replacing the existing one
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Keep Existing" icon="pi pi-check" 
                @click="$emit('handle-duplicate-confirmation', false)" 
                class="p-button-secondary" />
        <Button label="Regenerate" icon="pi pi-refresh" 
                @click="$emit('handle-duplicate-confirmation', true)" 
                class="p-button-warning" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const props = defineProps({
  showDuplicateConfirmation: Boolean,
  duplicateDetails: Object,
  selectedInvoicesForMerge: Array
});

defineEmits(['handle-duplicate-confirmation', 'update:showDuplicateConfirmation']);

// Helper function to get invoice numbers from different sources
const getInvoiceNumbers = () => {
  // First try to get from duplicateDetails (backend response)
  if (props.duplicateDetails?.requested_merge?.invoice_numbers) {
    return props.duplicateDetails.requested_merge.invoice_numbers;
  }
  
  // Fallback to selectedInvoicesForMerge (frontend selection)
  if (props.selectedInvoicesForMerge?.length > 0) {
    return props.selectedInvoicesForMerge.map(invoice => invoice.number || invoice);
  }
  
  return [];
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script> 