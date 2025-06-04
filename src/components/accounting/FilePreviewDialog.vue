<template>
  <!-- File Preview Dialog -->
  <Dialog :visible="showFilePreview" @update:visible="$emit('update:showFilePreview', $event)" :style="{ width: '90vw', height: '80vh' }" modal header="File Preview" :closable="true">
    <div v-if="selectedFile" class="w-full h-full flex flex-col">
      <div class="flex justify-between items-center mb-3">
        <div class="font-medium text-lg flex items-center">
          <i :class="[getFileIcon(selectedFile), 'mr-2']"></i>
          {{ selectedFile.filename || selectedFile.fullPath?.split('/').pop() || 'Unnamed file' }}
          <span class="ml-3 text-sm text-400">{{ formatDate(selectedFile.created_at) }}</span>
        </div>
        <Button icon="pi pi-download" text @click="$emit('download-file', selectedFile)" />
      </div>
      
      <!-- Error display if preview fails -->
      <Message v-if="previewError" severity="error" :closable="false" class="mb-4 w-full">
        <div class="flex flex-col">
          <span class="font-bold">Failed to load preview</span>
          <span>{{ previewErrorMessage }}</span>
          <div class="mt-2">
            <Button label="Try downloading instead" icon="pi pi-download" 
                    @click="$emit('download-file', selectedFile)" class="p-button-sm" />
          </div>
        </div>
      </Message>
      
      <div class="flex-1 overflow-hidden">
        <!-- PDF Preview iframe - only for PDFs -->
        <div v-if="selectedFile && (selectedFile.fileType === 'pdf' || selectedFile.originalData?.type === 'pdf')" 
             class="w-full h-full relative" style="height: calc(70vh - 6rem);">
          <div v-if="!previewError" class="absolute inset-0 flex items-center justify-center bg-surface-50 dark:bg-surface-800 z-0">
            <ProgressSpinner class="w-12 h-12" />
            <span class="ml-2">Loading preview...</span>
          </div>
          
          <iframe 
            v-if="!previewError"
            :src="previewUrl" 
            class="w-full h-full border-0 relative z-10"
            title="PDF Preview"
            @load="$emit('iframe-load')"
            @error="$emit('iframe-error')"
            ref="previewIframe"
            style="height: calc(70vh - 6rem) !important; min-height: 400px !important;"
          ></iframe>
          
          <!-- Fallback if preview fails -->
          <div v-if="previewError" class="flex flex-col items-center justify-center h-full">
            <i :class="[getFileIcon(selectedFile), 'text-7xl mb-4']"></i>
            <p class="text-xl mb-4">Preview failed to load</p>
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-4 max-w-lg text-center">
              The server returned an error while trying to preview this file. 
              You can try downloading it instead.
            </p>
            <Button label="Download File" icon="pi pi-download" @click="$emit('download-file', selectedFile)" />
          </div>
        </div>
        
        <!-- Excel Preview - only for Excel files -->
        <div v-else-if="selectedFile && (selectedFile.fileType === 'excel' || selectedFile.originalData?.type === 'excel')"
             class="w-full h-full">
          <ExcelPreview :file="selectedFile" :fileUrl="previewUrl" />
        </div>
        
        <!-- For other file types, show a download prompt -->
        <div v-else class="flex flex-col items-center justify-center h-full">
          <i :class="[getFileIcon(selectedFile), 'text-7xl mb-4']"></i>
          <p class="text-xl mb-4">This file type cannot be previewed directly</p>
          <Button label="Download File" icon="pi pi-download" @click="$emit('download-file', selectedFile)" />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

defineProps({
  showFilePreview: Boolean,
  selectedFile: Object,
  previewError: Boolean,
  previewErrorMessage: String,
  previewUrl: String,
  getFileIcon: Function,
  formatDate: Function
});

defineEmits(['download-file', 'iframe-load', 'iframe-error', 'update:showFilePreview']);
</script> 