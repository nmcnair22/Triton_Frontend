<template>
  <div class="card">
    <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Document Library</div>
    
    <!-- Document Type Tabs -->
    <div class="flex justify-between items-center mb-4 border-b border-surface-200 dark:border-surface-700">
      <div class="flex">
        <div class="pb-3 px-4 cursor-pointer font-medium border-b-2 transition-colors duration-200"
             :class="[activeDocumentTab === 'customer' ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400']"
             @click="$emit('tab-change', 'customer')">
          Customer Documents
        </div>
        <div class="pb-3 px-4 font-medium border-b-2 transition-colors duration-200"
             :class="[
                activeDocumentTab === 'invoice' ? 'border-primary-500 text-primary-500' : 'border-transparent hover:text-primary-400',
                !selectedCustomerInvoice ? 'text-surface-400 cursor-not-allowed' : 'cursor-pointer'
             ]"
             @click="selectedCustomerInvoice && $emit('tab-change', 'invoice')">
          Invoice Documents
        </div>
      </div>
    </div>
    
    <!-- Loading files message -->
    <div v-if="isLoadingGeneratedFiles || isLoadingCustomerDocuments" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <span class="ml-3">Loading documents...</span>
    </div>
    
    <!-- Error loading files -->
    <div v-else-if="generatedFilesError || customerDocumentsError" class="p-4 flex flex-col items-center justify-center">
      <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-3"></i>
      <div class="text-lg text-yellow-500">{{ generatedFilesError || customerDocumentsError }}</div>
    </div>
    
    <!-- No customer selected message -->
    <div v-else-if="!selectedCustomer" class="p-4 flex flex-col items-center justify-center">
      <i class="pi pi-users text-4xl text-primary mb-3"></i>
      <div class="text-lg">Select a customer to see documents</div>
    </div>
    
    <!-- Invoice Documents View -->
    <div v-else-if="activeDocumentTab === 'invoice'">
      <!-- No files generated message -->
      <div v-if="generatedFiles.length === 0" class="p-4 flex flex-col items-center justify-center">
        <i class="pi pi-info-circle text-4xl text-primary mb-3"></i>
        <div class="text-lg">No documents have been generated for this invoice</div>
        <div class="text-sm text-surface-600 dark:text-surface-400 mt-2">
          Select a template and click "Generate Template" to create documents
        </div>
      </div>
      
      <!-- Files grid for invoice documents -->
      <div v-else>
        <div class="mb-3 text-lg font-medium">
          Invoice #{{ selectedCustomerInvoice?.number || 'Unknown' }} Documents
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          <div v-for="(file, index) in generatedFiles" :key="file?.id || index" 
               class="border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
            <div v-if="file" class="flex flex-col h-full">
              <!-- File header with icon and background, color-coded by file type -->
              <div class="py-2 px-3" 
                   :class="[
                      file.fileType === 'excel' || (file.originalData?.type === 'excel') ? 
                          'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800' : 
                      file.fileType === 'pdf' || (file.originalData?.type === 'pdf') ? 
                          'bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800' :
                          'bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700'
                   ]">
                <div class="flex items-center">
                  <i :class="[getFileIcon(file), 'text-xl mr-2']"></i>
                  <span class="font-medium truncate flex-1 text-sm">
                    {{ file.filename || file.fullPath?.split('/').pop() || 'Unnamed file' }}
                  </span>
                </div>
              </div>
              
              <!-- File metadata -->
              <div class="p-3 text-sm text-surface-600 dark:text-surface-400 flex-1">
                <div class="mb-2 flex items-center">
                  <i class="pi pi-calendar text-sm mr-2"></i>
                  <span>{{ file.created_at ? formatDate(file.created_at) : 'No date' }}</span>
                </div>
                <div v-if="file.fileCategory" class="mb-2 flex items-center">
                  <i class="pi pi-file text-sm mr-2"></i>
                  <span class="capitalize">{{ file.fileCategory }} {{ file.fileType?.toUpperCase() }}</span>
                </div>
                <div v-if="file.template_name" class="flex items-center truncate">
                  <i class="pi pi-tag text-sm mr-2"></i>
                  <span>{{ file.template_name }}</span>
                </div>
              </div>
              
              <!-- File actions -->
              <div class="flex border-t border-surface-200 dark:border-surface-700">
                <Button icon="pi pi-eye" label="Preview" text class="flex-1 justify-center border-right" @click="$emit('preview-file', file)" />
                <div class="border-l border-surface-200 dark:border-surface-700"></div>
                <Button icon="pi pi-download" label="Download" text class="flex-1 justify-center" @click="$emit('download-file', file)" />
              </div>
            </div>
            <div v-else class="flex flex-col h-full justify-center items-center text-surface-400 p-6">
              <i class="pi pi-file-excel text-3xl mb-2"></i>
              <span>Invalid file data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Customer Documents View -->
    <div v-else-if="activeDocumentTab === 'customer'">
      <!-- No customer documents message -->
      <div v-if="customerDocuments.length === 0" class="p-4 flex flex-col items-center justify-center">
        <i class="pi pi-info-circle text-4xl text-primary mb-3"></i>
        <div class="text-lg">No documents found for this customer</div>
        <div class="text-sm text-surface-600 dark:text-surface-400 mt-2">
          Select an invoice and generate templates to create documents
        </div>
      </div>
      
      <!-- Files grid for customer documents -->
      <div v-else>
        <div class="mb-3 text-lg font-medium">
          {{ selectedCustomer.name }} Documents
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          <div v-for="(file, index) in customerDocuments" :key="file?.id || index" 
               class="border border-surface-200 dark:border-surface-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
            <div v-if="file" class="flex flex-col h-full">
              <!-- File header with icon and background, color-coded by file type -->
              <div class="py-2 px-3" 
                   :class="[
                      file.fileType === 'excel' || (file.originalData?.type === 'excel') ? 
                          'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800' : 
                      file.fileType === 'pdf' || (file.originalData?.type === 'pdf') ? 
                          'bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800' :
                          'bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700'
                   ]">
                <div class="flex items-center">
                  <i :class="[getFileIcon(file), 'text-xl mr-2']"></i>
                  <span class="font-medium truncate flex-1 text-sm">
                    {{ file.filename || file.fullPath?.split('/').pop() || 'Unnamed file' }}
                  </span>
                </div>
              </div>
              
              <!-- File metadata -->
              <div class="p-3 text-sm text-surface-600 dark:text-surface-400 flex-1">
                <div class="mb-2 flex items-center">
                  <i class="pi pi-calendar text-sm mr-2"></i>
                  <span>{{ file.created_at ? formatDate(file.created_at) : 'No date' }}</span>
                </div>
                <div class="mb-2 flex items-center" v-if="file.invoice_number">
                  <i class="pi pi-file-invoice text-sm mr-2"></i>
                  <span>Invoice #{{ file.invoice_number }}</span>
                </div>
                <div v-if="file.fileCategory" class="mb-2 flex items-center">
                  <i class="pi pi-file text-sm mr-2"></i>
                  <span class="capitalize">{{ file.fileCategory }} {{ file.fileType?.toUpperCase() }}</span>
                </div>
                <div v-if="file.template_name" class="flex items-center truncate">
                  <i class="pi pi-tag text-sm mr-2"></i>
                  <span>{{ file.template_name }}</span>
                </div>
              </div>
              
              <!-- File actions -->
              <div class="flex border-t border-surface-200 dark:border-surface-700">
                <Button icon="pi pi-eye" label="Preview" text class="flex-1 justify-center border-right" @click="$emit('preview-file', file)" />
                <div class="border-l border-surface-200 dark:border-surface-700"></div>
                <Button icon="pi pi-download" label="Download" text class="flex-1 justify-center" @click="$emit('download-file', file)" />
              </div>
            </div>
            <div v-else class="flex flex-col h-full justify-center items-center text-surface-400 p-6">
              <i class="pi pi-file-excel text-3xl mb-2"></i>
              <span>Invalid file data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Merge Preview View (only show when in merge mode) -->
    <div v-else-if="props.isMergeMode && props.selectedInvoicesForMerge.length >= 2" class="merge-preview-view">
      <!-- Loading State -->
      <div v-if="props.isCheckingMergeGroups" class="flex justify-center items-center p-12">
        <div class="text-center">
          <ProgressSpinner class="w-12 h-12 mb-4" />
          <div class="font-medium text-surface-600 dark:text-surface-400">Checking for existing merges...</div>
        </div>
      </div>
      
      <!-- No Existing Merges -->
      <div v-else-if="props.existingMergeGroups.length === 0" class="text-center p-12">
        <div class="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i class="pi pi-check text-green-500 text-2xl"></i>
        </div>
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Ready to Merge</h3>
        <p class="text-surface-600 dark:text-surface-400 mb-4">
          No existing merge groups found for the selected {{ props.selectedInvoicesForMerge.length }} invoices.
        </p>
        <div class="flex flex-wrap gap-2 justify-center mb-6">
          <Chip
            v-for="invoice in props.selectedInvoicesForMerge"
            :key="invoice.id"
            :label="invoice.number"
            class="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
          />
        </div>
        <p class="text-sm text-surface-500 dark:text-surface-500">
          You can proceed with creating a new merge group for these invoices.
        </p>
      </div>
      
      <!-- Existing Merge Groups Found -->
      <div v-else class="space-y-6">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <i class="pi pi-exclamation-triangle text-amber-500 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">Existing Merge Groups Found</h3>
          <p class="text-surface-600 dark:text-surface-400">
            Found {{ props.existingMergeGroups.length }} existing merge group(s) containing some of the selected invoices.
          </p>
        </div>
        
        <!-- Merge Group Cards -->
        <div class="grid gap-4">
          <div
            v-for="mergeGroup in props.existingMergeGroups"
            :key="mergeGroup.merged_invoice_number"
            class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <!-- Merge Group Header -->
            <div class="p-6 border-b border-surface-200 dark:border-surface-700">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 flex items-center gap-3">
                    <span class="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {{ mergeGroup.merged_invoice_number }}
                    </span>
                    <Badge 
                      :value="`${mergeGroup.original_invoices.length} invoices`" 
                      class="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                    />
                  </h4>
                  <div class="flex items-center gap-4 mt-2 text-sm text-surface-600 dark:text-surface-400">
                                       <span class="flex items-center gap-1">
                     <i class="pi pi-calendar"></i>
                     {{ formatDate(mergeGroup.created_date) }}
                   </span>
                   <span class="flex items-center gap-1">
                     <i class="pi pi-tag"></i>
                     {{ mergeGroup.template_used }}{{ mergeGroup.template_override ? ` (${mergeGroup.template_override})` : '' }}
                   </span>
                   <span class="flex items-center gap-1">
                     <i class="pi pi-file"></i>
                     {{ mergeGroup.document_count || 0 }} documents
                   </span>
                   <span v-if="mergeGroup.total_amount" class="flex items-center gap-1">
                     <i class="pi pi-dollar"></i>
                     ${{ mergeGroup.total_amount.toLocaleString() }}
                   </span>
                  </div>
                </div>
                
                <div class="flex gap-2">
                  <Button
                    @click="$emit('view-merge-documents', mergeGroup)"
                    icon="pi pi-eye"
                    label="View Documents"
                    size="small"
                    outlined
                    class="text-primary-600 border-primary-600 hover:bg-primary-50"
                  />
                  <Button
                    @click="$emit('re-merge-group', mergeGroup)"
                    icon="pi pi-refresh"
                    label="Re-merge"
                    size="small"
                    severity="warning"
                    outlined
                  />
                </div>
              </div>
            </div>
            
            <!-- Invoice List -->
            <div class="p-6">
              <div class="mb-3">
                <span class="text-sm font-medium text-surface-700 dark:text-surface-300">Original Invoices:</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <Chip
                  v-for="invoiceNumber in mergeGroup.original_invoices"
                  :key="invoiceNumber"
                  :label="invoiceNumber"
                  :class="[
                    'text-xs font-mono',
                    props.selectedInvoicesForMerge.some(inv => inv.number === invoiceNumber)
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100 ring-2 ring-primary-500'
                      : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
                  ]"
                />
              </div>
              
              <!-- Overlap Indicator -->
              <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div class="text-sm">
                  <span class="font-medium text-blue-800 dark:text-blue-200">
                    {{ getOverlapCount(mergeGroup) }} of {{ props.selectedInvoicesForMerge.length }} selected invoices
                  </span>
                  <span class="text-blue-600 dark:text-blue-300"> are already in this merge group</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Badge from 'primevue/badge';
import Chip from 'primevue/chip';

const props = defineProps({
  customerDocuments: {
    type: Array,
    default: () => []
  },
  selectedCustomer: {
    type: Object,
    default: null
  },
  selectedCustomerInvoice: {
    type: Object,
    default: null
  },
  activeDocumentTab: {
    type: String,
    default: 'customer'
  },
  isLoadingCustomerDocuments: {
    type: Boolean,
    default: false
  },
  customerDocumentsError: {
    type: String,
    default: null
  },
  // Merge-related props
  isMergeMode: {
    type: Boolean,
    default: false
  },
  selectedInvoicesForMerge: {
    type: Array,
    default: () => []
  },
  existingMergeGroups: {
    type: Array,
    default: () => []
  },
  isCheckingMergeGroups: {
    type: Boolean,
    default: false
  },
  showMergePreview: {
    type: Boolean,
    default: false
  },
  isLoadingGeneratedFiles: Boolean,
  generatedFilesError: String,
  generatedFiles: Array,
  getFileIcon: Function,
  formatDate: Function
});

defineEmits(['tab-change', 'preview-file', 'download-file', 'view-merge-documents', 're-merge-group']);

// Helper functions
function getOverlapCount(mergeGroup) {
  if (!mergeGroup.original_invoices || !props.selectedInvoicesForMerge) return 0;
  
  return mergeGroup.original_invoices.filter(invoiceNumber => 
    props.selectedInvoicesForMerge.some(inv => inv.number === invoiceNumber)
  ).length;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeColor(filename) {
  if (!filename) return 'bg-surface-500';
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'bg-red-500';
    case 'xlsx':
    case 'xls':
      return 'bg-green-500';
    case 'csv':
      return 'bg-emerald-500';
    case 'docx':
    case 'doc':
      return 'bg-blue-500';
    default:
      return 'bg-surface-500';
  }
}
</script> 