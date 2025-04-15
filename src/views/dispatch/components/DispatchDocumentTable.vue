<template>
  <div class="card">
    <div class="flex justify-content-between align-items-center mb-3">
      <h3 class="m-0 text-lg font-semibold">{{ title }}</h3>
      <div class="flex align-items-center">
        <Button v-if="allowUpload" icon="pi pi-upload" label="Upload" 
          severity="secondary" text @click="onUploadClick" class="mr-2" />
        <Button v-if="!hideRefresh" icon="pi pi-refresh" 
          severity="secondary" text @click="loadDocuments" 
          :loading="loading" />
      </div>
    </div>
    
    <DataTable :value="documents" :loading="loading" responsive-layout="scroll"
      :paginator="documents.length > 5" :rows="5" stripedRows
      :empty-message="emptyMessage">
      
      <Column field="template" header="Document Type">
        <template #body="slotProps">
          <div class="flex align-items-center">
            <i :class="getDocumentIcon(slotProps.data.outputs)" class="text-xl mr-2"></i>
            <span>{{ slotProps.data.template }}</span>
          </div>
        </template>
      </Column>
      
      <Column field="created_at" header="Date Created">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.created_at) }}
        </template>
      </Column>
      
      <Column field="dispatch_id" header="Dispatch ID">
        <template #body="slotProps">
          {{ slotProps.data.dispatch_id || 'N/A' }}
        </template>
      </Column>
      
      <Column header="Files" class="w-8rem">
        <template #body="slotProps">
          <span class="text-sm">{{ getFileCount(slotProps.data.outputs) }} files</span>
        </template>
      </Column>
      
      <Column header="Actions" class="w-8rem">
        <template #body="slotProps">
          <div class="flex">
            <Button v-tooltip.top="'Download'" icon="pi pi-download" 
              text rounded severity="info" class="mr-2"
              @click="downloadDocument(slotProps.data)" />
            <Button v-tooltip.top="'Delete'" icon="pi pi-trash" 
              text rounded severity="danger"
              @click="confirmDelete(slotProps.data)" />
          </div>
        </template>
      </Column>
      
      <template #empty>
        <div class="flex flex-column align-items-center justify-content-center py-5">
          <i class="pi pi-folder-open text-xl mb-2 text-surface-400"></i>
          <span class="text-surface-500">{{ emptyMessage }}</span>
        </div>
      </template>
    </DataTable>
    
    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialogVisible" header="Confirm Deletion" 
      :style="{ width: '450px' }" :modal="true">
      <div class="flex align-items-center justify-content-center">
        <i class="pi pi-exclamation-triangle mr-3 text-2xl text-yellow-500"></i>
        <span>Are you sure you want to delete this document?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" outlined @click="deleteDialogVisible = false" />
        <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteDocument" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ApiService } from '@/service/ApiService';

const props = defineProps({
  title: {
    type: String,
    default: 'Dispatch Documents'
  },
  dispatchId: {
    type: [String, Number],
    default: null
  },
  allowUpload: {
    type: Boolean,
    default: true
  },
  hideRefresh: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No documents found for this dispatch'
  }
});

const emit = defineEmits(['upload', 'refresh', 'document-deleted']);

// State
const documents = ref([]);
const loading = ref(false);
const deleteDialogVisible = ref(false);
const documentToDelete = ref(null);

// Utilities
const toast = useToast();

// Methods
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getDocumentIcon(outputs) {
  if (!outputs) return 'pi pi-file text-surface-400';
  
  if (outputs.pdf && outputs.excel) {
    return 'pi pi-file-pdf text-red-500';
  } else if (outputs.pdf) {
    return 'pi pi-file-pdf text-red-500';
  } else if (outputs.excel) {
    return 'pi pi-file-excel text-green-500';
  } else {
    return 'pi pi-file text-surface-400';
  }
}

function getFileCount(outputs) {
  if (!outputs) return 0;
  
  let count = 0;
  if (outputs.pdf) {
    // Count pdf variants (summary, consolidated, etc)
    count += Object.keys(outputs.pdf).length;
  }
  
  if (outputs.excel) {
    // Count excel files (array)
    count += outputs.excel.length;
  }
  
  return count;
}

async function loadDocuments() {
  if (!props.dispatchId) {
    documents.value = [];
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await ApiService.get(`/dispatch-reports/dispatches/${props.dispatchId}/documents`);
    
    if (response.data?.documents) {
      documents.value = response.data.documents;
    } else {
      documents.value = [];
    }
    
    emit('refresh', documents.value);
  } catch (error) {
    console.error('Error loading dispatch documents:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dispatch documents',
      life: 3000
    });
    documents.value = [];
  } finally {
    loading.value = false;
  }
}

function onUploadClick() {
  emit('upload', props.dispatchId);
}

function downloadDocument(document) {
  // Implementation depends on how documents are structured
  // This is a placeholder
  toast.add({
    severity: 'info',
    summary: 'Download Initiated',
    detail: `Downloading document: ${document.template}`,
    life: 3000
  });
  
  // In a real implementation, you would:
  // 1. Call the API to get download URLs for each file
  // 2. Create download links and trigger them
}

function confirmDelete(document) {
  documentToDelete.value = document;
  deleteDialogVisible.value = true;
}

async function deleteDocument() {
  if (!documentToDelete.value) {
    deleteDialogVisible.value = false;
    return;
  }
  
  try {
    // Call API to delete the document
    await ApiService.delete(`/dispatch-reports/documents/${documentToDelete.value.job_id}`);
    
    // Remove from local list
    documents.value = documents.value.filter(doc => doc.job_id !== documentToDelete.value.job_id);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Document deleted successfully',
      life: 3000
    });
    
    emit('document-deleted', documentToDelete.value);
  } catch (error) {
    console.error('Error deleting document:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete document',
      life: 3000
    });
  } finally {
    deleteDialogVisible.value = false;
    documentToDelete.value = null;
  }
}

// Lifecycle hooks
onMounted(() => {
  loadDocuments();
});
</script>

<style scoped>
.card {
  @apply p-4 rounded-lg bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700;
}
</style> 