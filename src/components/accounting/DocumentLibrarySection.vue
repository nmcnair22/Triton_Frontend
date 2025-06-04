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
  </div>
</template>

<script setup>
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

defineProps({
  activeDocumentTab: String,
  selectedCustomerInvoice: Object,
  isLoadingGeneratedFiles: Boolean,
  isLoadingCustomerDocuments: Boolean,
  generatedFilesError: String,
  customerDocumentsError: String,
  selectedCustomer: Object,
  generatedFiles: Array,
  customerDocuments: Array,
  getFileIcon: Function,
  formatDate: Function
});

defineEmits(['tab-change', 'preview-file', 'download-file']);
</script> 