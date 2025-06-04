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
      
      <div class="space-y-3">
        <div class="font-medium text-surface-900 dark:text-surface-0">
          Selected Invoices for Merge:
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="invoice in selectedInvoicesForMerge" :key="invoice.id" 
                class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full text-sm">
            {{ invoice.number }}
          </span>
        </div>
        
        <div class="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
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

defineProps({
  showDuplicateConfirmation: Boolean,
  duplicateDetails: Object,
  selectedInvoicesForMerge: Array
});

defineEmits(['handle-duplicate-confirmation', 'update:showDuplicateConfirmation']);
</script> 