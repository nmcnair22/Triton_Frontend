<template>
  <Dialog 
    :visible="visible" 
    :header="modalTitle"
    :style="{ width: '90vw', maxWidth: '1200px' }" 
    modal 
    maximizable
    class="merge-details-modal"
    @update:visible="$emit('update:visible', $event)"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center p-12">
      <div class="text-center">
        <ProgressSpinner class="w-12 h-12 mb-4" />
        <div class="font-medium text-surface-600 dark:text-surface-400">Loading merge details...</div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-12">
      <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
      </div>
      <div class="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Error Loading Details</div>
      <div class="text-sm text-surface-600 dark:text-surface-400 text-center max-w-md mb-4">
        {{ error }}
      </div>
      <Button label="Try Again" icon="pi pi-refresh" @click="$emit('retry')" outlined />
    </div>

    <!-- Merge Details Content -->
    <div v-else-if="mergeDetails" class="space-y-6">
      <!-- Merge Summary Header -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <i class="pi pi-objects-column text-white text-xl"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {{ mergeDetails.merged_invoice_number }}
              </h3>
              <p class="text-surface-600 dark:text-surface-400">Merged Invoice</p>
            </div>
          </div>
          <div class="flex gap-3">
            <Button 
              icon="pi pi-download" 
              label="Download All" 
              severity="success" 
              @click="$emit('download-all-files', mergeDetails)"
            />
            <Button 
              icon="pi pi-refresh" 
              label="Re-merge" 
              severity="warning" 
              outlined
              @click="$emit('re-merge', mergeDetails)"
            />
          </div>
        </div>
        
        <!-- Merge Metadata -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ mergeDetails.invoice_count || mergeDetails.original_invoices?.length || 0 }}
            </div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Source Invoices</div>
          </div>
          <div class="text-center p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ mergeDetails.document_count || mergeDetails.documents?.length || 0 }}
            </div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Generated Files</div>
          </div>
          <div class="text-center p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ formatCurrency(parseFloat(mergeDetails.total_amount) || 0) }}
            </div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Total Amount</div>
          </div>
          <div class="text-center p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {{ formatDate(mergeDetails.created_at || mergeDetails.merge_date) }}
            </div>
            <div class="text-sm text-surface-600 dark:text-surface-400">Created Date</div>
          </div>
        </div>

        <!-- Template Information -->
        <div class="mt-4 flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <i class="pi pi-tag text-orange-500"></i>
            <span class="font-medium">Template:</span>
            <span class="text-surface-700 dark:text-surface-300">{{ mergeDetails.template_used || mergeDetails.template_name }}</span>
            <span v-if="mergeDetails.template_override" class="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded text-xs font-medium uppercase">
              {{ mergeDetails.template_override }}
            </span>
          </div>
          <div v-if="mergeDetails.generated_by" class="flex items-center gap-2">
            <i class="pi pi-user text-green-500"></i>
            <span class="font-medium">Generated by:</span>
            <span class="text-surface-700 dark:text-surface-300">{{ mergeDetails.generated_by }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs for Original Invoices and Generated Documents -->
      <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-1">
        <div class="flex">
          <button 
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200"
            :class="[
              activeTab === 'invoices' 
                ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            ]"
            @click="activeTab = 'invoices'"
          >
            <i class="pi pi-file-invoice text-sm"></i>
            <span>Original Invoices</span>
            <Badge 
              v-if="mergeDetails.original_invoices?.length" 
              :value="mergeDetails.original_invoices.length.toString()" 
              severity="info" 
            />
          </button>
          <button 
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200"
            :class="[
              activeTab === 'documents' 
                ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            ]"
            @click="activeTab = 'documents'"
          >
            <i class="pi pi-file text-sm"></i>
            <span>Generated Documents</span>
            <Badge 
              v-if="mergeDetails.documents?.length" 
              :value="mergeDetails.documents.length.toString()" 
              severity="success" 
            />
          </button>
        </div>
      </div>

      <!-- Original Invoices Tab -->
      <div v-if="activeTab === 'invoices'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Original Invoices</h4>
          <div class="text-sm text-surface-600 dark:text-surface-400">
            {{ mergeDetails.original_invoices?.length || 0 }} invoice(s) merged
          </div>
        </div>

        <!-- Original Invoices Table -->
        <DataTable 
          :value="originalInvoicesData" 
          responsiveLayout="scroll"
          class="compact-invoice-table"
          :paginator="originalInvoicesData.length > 10"
          :rows="10"
        >
          <Column field="number" header="Invoice #" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                  <i class="pi pi-file-invoice text-blue-600 dark:text-blue-400 text-xs"></i>
                </div>
                <span class="font-mono font-medium">{{ slotProps.data.number }}</span>
              </div>
            </template>
          </Column>
          <Column field="date" header="Invoice Date" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.date) }}
            </template>
          </Column>
          <Column field="total" header="Amount" sortable>
            <template #body="slotProps">
              <span class="font-semibold">{{ formatCurrency(slotProps.data.total) }}</span>
            </template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="slotProps">
              <Tag 
                :value="slotProps.data.status" 
                :severity="getStatusSeverity(slotProps.data.status)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Generated Documents Tab -->
      <div v-if="activeTab === 'documents'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Generated Documents</h4>
          <div class="flex items-center gap-3">
            <div class="text-sm text-surface-600 dark:text-surface-400">
              {{ mergeDetails.documents?.length || 0 }} file(s) generated
            </div>
            <Button 
              v-if="mergeDetails.documents?.length > 0"
              icon="pi pi-download" 
              label="Download All" 
              size="small" 
              severity="success"
              @click="$emit('download-all-documents', mergeDetails.documents)"
            />
          </div>
        </div>

        <!-- No Documents State -->
        <div v-if="!mergeDetails.documents || mergeDetails.documents.length === 0" 
             class="text-center p-8">
          <div class="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center mb-4 mx-auto">
            <i class="pi pi-file-plus text-surface-400 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-2">No Documents Generated</h3>
          <p class="text-surface-600 dark:text-surface-400">
            No documents have been generated for this merge yet.
          </p>
        </div>

        <!-- Documents Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(document, index) in mergeDetails.documents"
            :key="document.id || index"
            class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
          >
            <!-- File Icon and Name -->
            <div class="flex items-start gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getFileTypeHeaderClass(document)">
                <i :class="[getFileIcon(document), 'text-white text-lg']"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-surface-900 dark:text-surface-0 text-sm truncate" 
                    :title="document.file_name || document.filename || document.name || 'Unnamed file'">
                  {{ document.file_name || document.filename || document.name || 'Unnamed file' }}
                </h3>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {{ getFileTypeLabel(document) }} • {{ formatFileSize(document.size || document.file_size) }}
                </p>
              </div>
            </div>

            <!-- Document Metadata -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-xs">
                <i class="pi pi-calendar text-surface-400"></i>
                <span class="text-surface-600 dark:text-surface-400">
                  {{ formatDate(document.created_at || document.created_date) }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <i class="pi pi-file-invoice text-surface-400"></i>
                <span class="text-surface-600 dark:text-surface-400">
                  Invoice #{{ document.invoice_number || mergeDetails.merged_invoice_number }}
                </span>
              </div>
                             <div class="flex items-center gap-2 text-xs">
                 <i class="pi pi-tag text-surface-400"></i>
                 <span class="text-surface-600 dark:text-surface-400">
                   {{ document.document_subtype || document.file_category || document.fileCategory || getFileTypeLabel(document) }}
                 </span>
               </div>
              <div class="flex items-center gap-2 text-xs">
                <i class="pi pi-cog text-surface-400"></i>
                <span class="text-surface-600 dark:text-surface-400">
                  {{ document.template_name || mergeDetails.template_used }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <Button 
                icon="pi pi-eye" 
                label="Preview" 
                size="small" 
                text 
                class="flex-1 text-xs"
                @click="$emit('preview-document', document)"
              />
              <Button 
                icon="pi pi-download" 
                label="Download" 
                size="small" 
                text 
                class="flex-1 text-xs"
                @click="$emit('download-document', document)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-surface-600 dark:text-surface-400">
          <span v-if="mergeDetails">
            Merge ID: {{ mergeDetails.group_identifier || mergeDetails.id }}
          </span>
        </div>
        <div class="flex gap-2">
          <Button 
            label="Close" 
            icon="pi pi-times" 
            text 
            @click="$emit('update:visible', false)"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mergeDetails: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  formatDate: {
    type: Function,
    required: true
  },
  formatCurrency: {
    type: Function,
    required: true
  },
  getFileIcon: {
    type: Function,
    required: true
  }
});

defineEmits([
  'update:visible',
  'retry',
  'download-all-files',
  're-merge',
  'preview-document',
  'download-document',
  'download-all-documents'
]);

// Local state
const activeTab = ref('invoices');

// Computed properties
const modalTitle = computed(() => {
  if (props.mergeDetails) {
    return `Merge Details - ${props.mergeDetails.merged_invoice_number}`;
  }
  return 'Merge Details';
});

const originalInvoicesData = computed(() => {
  if (!props.mergeDetails?.original_invoices) return [];
  
  // Handle the actual backend data structure
  return props.mergeDetails.original_invoices.map(invoice => ({
    number: invoice.invoice_number,
    date: invoice.invoice_date,
    total: invoice.total_amount,
    status: 'Merged',
    line_count: invoice.line_count,
    customer_name: invoice.customer_name,
    customer_number: invoice.customer_number
  }));
});

// Helper functions
function getFileTypeHeaderClass(file) {
  // Check file type from various possible fields (including merge document fields)
  let fileType = file?.document_type || file?.file_type || file?.fileType || file?.type;
  
  // If no direct file type, try to determine from filename
  if (!fileType && (file?.file_name || file?.filename || file?.name)) {
    const filename = file.file_name || file.filename || file.name;
    const ext = filename.split('.').pop()?.toLowerCase();
    fileType = ext;
  }
  
  switch (fileType?.toLowerCase()) {
    case 'pdf':
      return 'bg-gradient-to-br from-red-500 to-red-600';
    case 'xlsx':
    case 'xls':
    case 'excel':
      return 'bg-gradient-to-br from-green-500 to-green-600';
    case 'csv':
      return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
    case 'docx':
    case 'doc':
    case 'word':
      return 'bg-gradient-to-br from-blue-500 to-blue-600';
    default:
      return 'bg-gradient-to-br from-surface-500 to-surface-600';
  }
}

function getFileTypeLabel(file) {
  // Check file type from various possible fields (including merge document fields)
  let fileType = file?.document_type || file?.file_type || file?.fileType || file?.type;
  
  // If no direct file type, try to determine from filename
  if (!fileType && (file?.file_name || file?.filename || file?.name)) {
    const filename = file.file_name || file.filename || file.name;
    const ext = filename.split('.').pop()?.toLowerCase();
    fileType = ext;
  }
  
  switch (fileType?.toLowerCase()) {
    case 'pdf':
      return 'PDF Document';
    case 'xlsx':
    case 'excel':
      return 'Excel Spreadsheet';
    case 'xls':
      return 'Excel Legacy';
    case 'csv':
      return 'CSV Data';
    case 'docx':
    case 'word':
      return 'Word Document';
    case 'doc':
      return 'Word Legacy';
    default:
      return fileType ? fileType.toUpperCase() : 'Unknown';
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusSeverity(status) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'overdue':
      return 'danger';
    case 'pending':
      return 'warning';
    case 'merged':
      return 'info';
    default:
      return 'secondary';
  }
}

// Reset tab when modal opens
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    activeTab.value = 'invoices';
  }
});
</script>

<style scoped>
:deep(.merge-details-modal .p-dialog-content) {
  padding: 1.5rem;
}

:deep(.compact-invoice-table) {
  font-size: 0.875rem;
}

:deep(.compact-invoice-table .p-datatable-thead > tr > th) {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-200);
}

:deep(.dark .compact-invoice-table .p-datatable-thead > tr > th) {
  background: var(--surface-800);
  border-bottom: 1px solid var(--surface-700);
}

:deep(.compact-invoice-table .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-100);
}

:deep(.dark .compact-invoice-table .p-datatable-tbody > tr > td) {
  border-bottom: 1px solid var(--surface-700);
}
</style> 