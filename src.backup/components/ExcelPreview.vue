<script setup>
import { ref, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';
import Button from 'primevue/button';
import Select from 'primevue/select';
import ProgressSpinner from 'primevue/progressspinner';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tooltip from 'primevue/tooltip';
import Message from 'primevue/message';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  }
});

const toast = useToast();

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

// Excel data
const sheetData = ref([]);
const sheetNames = ref([]);
const isLoadingExcel = ref(true);
const hasErrorExcel = ref(false);
const errorMessageExcel = ref('');

// Load Excel data when component is mounted
onMounted(() => {
  loadExcelData();
});

// Watch for file URL changes
watch(() => props.fileUrl, () => {
  loadExcelData();
});

// Load Excel data from the provided URL
async function loadExcelData() {
  if (!props.fileUrl) {
    hasErrorExcel.value = true;
    errorMessageExcel.value = 'No file URL provided';
    isLoadingExcel.value = false;
    return;
  }
  
  isLoadingExcel.value = true;
  hasErrorExcel.value = false;
  
  try {
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${props.fileUrl}${props.fileUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
    
    // Fetch the Excel file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }
    
    // Parse the Excel data (using a placeholder implementation)
    // In a real implementation, you would use a library like SheetJS/xlsx
    parseExcelData(await response.json());
    
  } catch (error) {
    console.error('Error loading Excel data:', error);
    hasErrorExcel.value = true;
    errorMessageExcel.value = error.message || 'Failed to load Excel data';
    sheetData.value = [];
    sheetNames.value = [];
    selectedSheet.value = null;
  } finally {
    isLoadingExcel.value = false;
  }
}

// Parse Excel data (placeholder implementation)
function parseExcelData(data) {
  // This is a placeholder function - in a real implementation,
  // you would parse the Excel data and extract sheet names and content
  
  if (!data || !data.sheets) {
    throw new Error('Invalid Excel data format');
  }
  
  // Extract sheet names
  sheetNames.value = Object.keys(data.sheets).map(name => ({
    name,
    value: name
  }));
  
  if (sheetNames.value.length > 0) {
    // Select the first sheet by default
    selectedSheet.value = sheetNames.value[0].value;
    
    // Load the selected sheet data
    loadSheetData(selectedSheet.value, data);
  } else {
    sheetData.value = [];
  }
}

// Load data for a specific sheet
function loadSheetData(sheetName, data) {
  if (!data || !data.sheets || !data.sheets[sheetName]) {
    sheetData.value = [];
    return;
  }
  
  // Extract sheet data
  sheetData.value = data.sheets[sheetName];
}

// Handle sheet change
function onSheetChange() {
  loadSheetData(selectedSheet.value, props.file.data);
}

// Download the Excel file
function downloadFile() {
  if (props.file) {
    // Emit download event
    toast.add({
      severity: 'info',
      summary: 'Download Started',
      detail: 'Your file is being downloaded',
      life: 3000
    });
  }
}
</script>

<template>
  <div class="excel-preview">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-column align-items-center p-4">
      <ProgressSpinner />
      <p class="mt-3">Loading Excel file...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="p-4">
      <Message severity="error" :closable="false">
        <div class="flex flex-column">
          <span class="font-bold">Failed to load Excel file</span>
          <p>{{ error }}</p>
        </div>
      </Message>
    </div>
    
    <!-- Excel data display -->
    <div v-else class="excel-content">
      <!-- Sheet selector -->
      <div class="flex justify-content-between align-items-center p-3 border-bottom-1 surface-border mb-3">
        <div class="flex align-items-center">
          <label for="sheet-selector" class="mr-2 font-medium">Sheet:</label>
          <Select v-model="selectedSheet" :options="sheets" optionLabel="label" 
                 class="w-12rem" inputId="sheet-selector" />
        </div>
        <div>
          <Button v-tooltip.top="'Download Excel File'" icon="pi pi-download" text />
        </div>
      </div>
      
      <!-- Excel Data Table -->
      <div class="excel-table-container p-3">
        <DataTable v-if="headers.length > 0" 
                  :value="currentData" 
                  showGridlines
                  stripedRows
                  responsiveLayout="scroll"
                  class="p-datatable-sm excel-data-table">
          <Column v-for="col in headers" :key="col.field" :field="col.field" :header="col.header" />
        </DataTable>
        
        <div v-else class="flex flex-column align-items-center justify-content-center p-5">
          <i class="pi pi-file-excel text-4xl text-primary mb-3"></i>
          <p>No data available in this sheet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.excel-preview {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.excel-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.excel-table-container {
  flex: 1;
  overflow: auto;
}

.excel-data-table {
  width: 100%;
}

:deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

:deep(.p-datatable-thead) th {
  position: sticky;
  top: 0;
  z-index: 1;
}

:deep(.p-datatable-tbody) td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
</style> 