<script setup>
import { ref, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';
import Button from 'primevue/button';
import Select from 'primevue/select';
import ProgressSpinner from 'primevue/progressspinner';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps({
  file: Object,
  fileUrl: String
});

const isLoading = ref(true);
const error = ref(null);
const data = ref(null);
const headers = ref([]);
const workbook = ref(null);
const sheets = ref([]);
const selectedSheet = ref(null);
const currentData = ref([]);

// Function to process Excel data
async function processExcelFile() {
  if (!props.file && !props.fileUrl) {
    error.value = 'No file or URL provided';
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    
    let arrayBuffer;
    
    // If a URL is provided, fetch the file
    if (props.fileUrl) {
      const response = await fetch(props.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } 
    // If a File object is provided
    else if (props.file instanceof File) {
      arrayBuffer = await props.file.arrayBuffer();
    }
    // If it's a data structure with filename and URL path
    else if (props.file && (props.file.fullPath || props.file.originalData?.path)) {
      const url = props.file.fullPath || props.file.originalData?.path;
      if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
        }
        arrayBuffer = await response.arrayBuffer();
      } else {
        throw new Error('No valid file path found');
      }
    } else {
      throw new Error('Invalid file format');
    }
    
    // Parse Excel data
    workbook.value = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get all sheet names
    sheets.value = workbook.value.SheetNames.map(name => ({ name, label: name }));
    
    // Select first sheet by default
    if (sheets.value.length > 0) {
      selectedSheet.value = sheets.value[0];
      loadSheet(selectedSheet.value.name);
    } else {
      error.value = 'No sheets found in the workbook';
    }
    
  } catch (err) {
    console.error('Excel processing error:', err);
    error.value = err.message || 'Failed to process Excel file';
  } finally {
    isLoading.value = false;
  }
}

// Function to load a specific sheet
function loadSheet(sheetName) {
  if (!workbook.value || !sheetName) return;
  
  try {
    // Get the worksheet
    const worksheet = workbook.value.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Extract headers and data
    if (jsonData.length > 0) {
      // First row as headers
      headers.value = jsonData[0].map((header, index) => ({
        field: `col${index}`,
        header: header || `Column ${index + 1}`
      }));
      
      // Transform data for DataTable
      currentData.value = jsonData.slice(1).map(row => {
        const rowData = {};
        row.forEach((cell, index) => {
          rowData[`col${index}`] = cell;
        });
        return rowData;
      });
    } else {
      headers.value = [];
      currentData.value = [];
    }
  } catch (err) {
    console.error('Error loading sheet:', err);
    error.value = `Failed to load sheet: ${err.message}`;
  }
}

// Watch for change in selected sheet
watch(selectedSheet, (newSheet) => {
  if (newSheet) {
    loadSheet(newSheet.name);
  }
});

// Process Excel file on component mount
onMounted(() => {
  processExcelFile();
});

// Watch for changes in file prop
watch(() => props.file, () => {
  processExcelFile();
});

watch(() => props.fileUrl, () => {
  processExcelFile();
});
</script>

<template>
  <div class="excel-preview w-full h-full flex flex-col">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex-1 flex justify-center items-center">
      <ProgressSpinner style="width: 50px; height: 50px" />
      <span class="ml-3">Loading Excel data...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex flex-col justify-center items-center">
      <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-3"></i>
      <p class="text-xl mb-2">Failed to load Excel file</p>
      <p class="text-sm text-surface-600 dark:text-surface-400 mb-4 max-w-lg text-center">
        {{ error }}
      </p>
      <Button label="Try downloading instead" icon="pi pi-download" />
    </div>
    
    <!-- Excel preview -->
    <div v-else-if="sheets.length > 0" class="flex-1 flex flex-col overflow-hidden">
      <!-- Sheet selector -->
      <div class="flex items-center mb-3 gap-3">
        <label class="font-medium">Sheet:</label>
        <Select 
          v-model="selectedSheet" 
          :options="sheets" 
          optionLabel="label" 
          placeholder="Select Sheet" 
          class="w-48" />
      </div>
      
      <!-- Data table -->
      <div class="flex-1 overflow-auto">
        <DataTable 
          :value="currentData" 
          :resizableColumns="true" 
          columnResizeMode="expand"
          class="excel-table w-full" 
          stripedRows
          scrollable
          scrollHeight="100%">
          <Column 
            v-for="col in headers" 
            :key="col.field" 
            :field="col.field" 
            :header="col.header"
            style="min-width: 150px"
            class="excel-cell p-2" />
        </DataTable>
      </div>
    </div>
    
    <!-- No data state -->
    <div v-else class="flex-1 flex flex-col justify-center items-center">
      <i class="pi pi-file-excel text-4xl text-green-500 mb-3"></i>
      <p class="text-xl mb-2">No data found</p>
      <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
        The Excel file appears to be empty or contains no valid sheets.
      </p>
    </div>
  </div>
</template>

<style scoped>
.excel-preview {
  height: 100%;
  min-height: 400px;
}

.excel-table :deep(th.p-frozen-column) {
  font-weight: bold;
  background-color: var(--surface-200);
  position: sticky;
  left: 0;
  z-index: 1;
}

.excel-table :deep(tr:nth-child(even)) {
  background-color: var(--surface-100);
}

.excel-table :deep(tr:hover) {
  background-color: var(--surface-200);
}

.excel-table :deep(.p-datatable-wrapper) {
  height: 100%;
}
</style> 