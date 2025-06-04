<template>
  <!-- Merge History Dialog -->
  <Dialog :visible="showMergeHistory" @update:visible="$emit('update:showMergeHistory', $event)" header="Merge History" :style="{ width: '80vw', maxWidth: '1000px' }" modal>
    <div v-if="isLoadingMergeHistory" class="flex justify-center items-center p-6">
      <ProgressSpinner />
      <span class="ml-3">Loading merge history...</span>
    </div>
    
    <div v-else-if="mergeHistoryData.length === 0" class="text-center p-6">
      <i class="pi pi-info-circle text-4xl text-surface-400 mb-3"></i>
      <div class="text-lg text-surface-600 dark:text-surface-400">No merge history found</div>
      <div class="text-sm text-surface-500 dark:text-surface-500 mt-2">
        {{ selectedCustomer?.name || 'This customer' }} has not performed any invoice merges yet
      </div>
    </div>
    
    <div v-else>
      <DataTable :value="mergeHistoryData" responsiveLayout="scroll" :paginator="true" :rows="10">
        <Column field="merged_invoice" header="Merged Invoice" sortable>
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <i class="pi pi-objects-column text-primary-500"></i>
              <span class="font-medium">{{ slotProps.data.merged_invoice }}</span>
            </div>
          </template>
        </Column>
        <Column field="original_count" header="Invoices Merged" sortable>
          <template #body="slotProps">
            <Tag :value="`${slotProps.data.original_count} invoices`" severity="info" />
          </template>
        </Column>
        <Column field="total_amount" header="Total Amount" sortable>
          <template #body="slotProps">
            <span class="font-semibold">{{ formatCurrency(slotProps.data.total_amount) }}</span>
          </template>
        </Column>
        <Column field="merge_date" header="Merge Date" sortable>
          <template #body="slotProps">
            {{ formatDate(slotProps.data.merge_date) }}
          </template>
        </Column>
        <Column field="template_used" header="Template" sortable>
          <template #body="slotProps">
            <div class="flex flex-col">
              <span class="font-medium">{{ slotProps.data.template_used }}</span>
              <span v-if="slotProps.data.template_override" class="text-xs text-surface-500 uppercase">
                {{ slotProps.data.template_override }}
              </span>
            </div>
          </template>
        </Column>
        <Column header="Actions" style="width: 8rem">
          <template #body="slotProps">
            <div class="flex gap-1">
              <Button icon="pi pi-eye" size="small" text rounded 
                      v-tooltip.top="'View Original Invoices'"
                      @click="$emit('view-merge-details', slotProps.data)" />
              <Button icon="pi pi-download" size="small" text rounded 
                      v-tooltip.top="'Download Merged Files'"
                      @click="$emit('download-merged-files', slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';

defineProps({
  showMergeHistory: Boolean,
  isLoadingMergeHistory: Boolean,
  mergeHistoryData: Array,
  selectedCustomer: Object,
  formatCurrency: Function,
  formatDate: Function
});

defineEmits(['view-merge-details', 'download-merged-files', 'update:showMergeHistory']);
</script> 