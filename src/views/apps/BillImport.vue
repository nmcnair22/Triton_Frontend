<script setup>
import { ref, computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import TabMenu from 'primevue/tabmenu';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';

// Layout composables for theming
const { layoutConfig, isDarkTheme } = useLayout();

// Stats for KPI cards
const stats = ref({
    totalUploads: { value: 142, change: +12, icon: 'pi pi-cloud-upload', iconClass: 'text-blue-500' },
    processed: { value: 128, rate: 90, icon: 'pi pi-check-circle', iconClass: 'text-green-500' },
    pending: { value: 8, processing: 3, icon: 'pi pi-clock', iconClass: 'text-yellow-500' },
    failed: { value: 6, rate: 4, icon: 'pi pi-times-circle', iconClass: 'text-red-500' }
});

// Upload state
const uploadedFiles = ref([]);
const dragActive = ref(false);

// File Manager
const fileSearchQuery = ref('');
const selectedFiles = ref([]);
const activeFileTabIndex = ref(0);
const fileTabs = ref([
    { label: 'All' },
    { label: 'Processed' },
    { label: 'Unprocessed' },
    { label: 'Archived' }
]);

// Processing Queue
const processingFiles = ref([
    {
        id: 1,
        name: 'ATT-Invoice-May2023.pdf',
        vendor: 'AT&T',
        date: 'May 15, 2023',
        size: '2.4 MB',
        status: 'Completed',
        progress: 100
    },
    {
        id: 2,
        name: 'Verizon-Bill-May2023.pdf',
        vendor: 'Verizon',
        date: 'May 16, 2023',
        size: '3.1 MB',
        status: 'Processing',
        progress: 65
    }
]);

// File list for file manager
const files = ref([
    {
        id: 1,
        name: 'ATT-Invoice-May2023.pdf',
        vendor: 'AT&T',
        date: 'May 15, 2023',
        size: '2.4 MB',
        status: 'processed'
    },
    {
        id: 2,
        name: 'Verizon-Bill-May2023.pdf',
        vendor: 'Verizon',
        date: 'May 16, 2023',
        size: '3.1 MB',
        status: 'processed'
    },
    {
        id: 3,
        name: 'TMobile-Invoice-May2023.pdf',
        vendor: 'T-Mobile',
        date: 'May 17, 2023',
        size: '1.8 MB',
        status: 'unprocessed'
    },
    {
        id: 4,
        name: 'Sprint-Bill-May2023.pdf',
        vendor: 'Sprint',
        date: 'May 14, 2023',
        size: '2.2 MB',
        status: 'archived'
    },
    {
        id: 5,
        name: 'ATT-Invoice-April2023.pdf',
        vendor: 'AT&T',
        date: 'April 15, 2023',
        size: '2.3 MB',
        status: 'archived'
    }
]);

// Filtered files based on active tab
const filteredFiles = computed(() => {
    let filtered = [...files.value];
    
    // Apply tab filter
    if (activeFileTabIndex.value === 1) {
        filtered = filtered.filter(file => file.status === 'processed');
    } else if (activeFileTabIndex.value === 2) {
        filtered = filtered.filter(file => file.status === 'unprocessed');
    } else if (activeFileTabIndex.value === 3) {
        filtered = filtered.filter(file => file.status === 'archived');
    }
    
    // Apply search query
    if (fileSearchQuery.value) {
        const query = fileSearchQuery.value.toLowerCase();
        filtered = filtered.filter(file => 
            file.name.toLowerCase().includes(query) ||
            file.vendor.toLowerCase().includes(query)
        );
    }
    
    return filtered;
});

// Handle file drop
const onDrop = (event) => {
    event.preventDefault();
    dragActive.value = false;
    
    if (event.dataTransfer.files) {
        // Handle files
        const files = event.dataTransfer.files;
        handleFiles(files);
    }
};

// Handle file browse selection
const onFileSelect = (event) => {
    if (event.target.files) {
        handleFiles(event.target.files);
    }
};

// Process selected files
const handleFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // Create object URL for preview if needed
            // const objectUrl = URL.createObjectURL(file);
            
            uploadedFiles.value.push({
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
                // preview: objectUrl,
                status: 'Uploading'
            });
            
            // Simulate upload process
            simulateFileUpload(uploadedFiles.value.length - 1);
        }
    }
};

// Helper function to simulate file upload progress
const simulateFileUpload = (fileIndex) => {
    setTimeout(() => {
        uploadedFiles.value[fileIndex].status = 'Processing';
        
        // Simulate processing delay
        setTimeout(() => {
            uploadedFiles.value[fileIndex].status = 'Completed';
            
            // Add to the file manager list
            const newFile = {
                id: files.value.length + 1,
                name: uploadedFiles.value[fileIndex].name,
                vendor: detectVendor(uploadedFiles.value[fileIndex].name),
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                size: uploadedFiles.value[fileIndex].size,
                status: 'processed'
            };
            
            files.value.unshift(newFile);
            
            // Add to processing queue temporarily
            processingFiles.value.unshift({
                id: processingFiles.value.length + 1,
                name: uploadedFiles.value[fileIndex].name,
                vendor: detectVendor(uploadedFiles.value[fileIndex].name),
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                size: uploadedFiles.value[fileIndex].size,
                status: 'Completed',
                progress: 100
            });
            
            // Update stats
            stats.value.totalUploads.value++;
            stats.value.processed.value++;
            
        }, 2000);
    }, 1000);
};

// Helper function to detect vendor from filename
const detectVendor = (filename) => {
    filename = filename.toLowerCase();
    if (filename.includes('att') || filename.includes('at&t')) return 'AT&T';
    if (filename.includes('verizon')) return 'Verizon';
    if (filename.includes('tmobile') || filename.includes('t-mobile')) return 'T-Mobile';
    if (filename.includes('sprint')) return 'Sprint';
    return 'Unknown';
};

// Format file size to human-readable format
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Get status badge severity
const getStatusSeverity = (status) => {
    status = status.toLowerCase();
    switch (status) {
        case 'processed':
            return 'success';
        case 'unprocessed':
            return 'warning';
        case 'archived':
            return 'info';
        default:
            return null;
    }
};

// Handle browse files button click
const browseBtnClick = () => {
    document.getElementById('fileInput').click();
};

// Handle tab change
const onTabChange = (index) => {
    activeFileTabIndex.value = index;
};
</script>

<template>
    <div class="bill-import">
        <!-- Header section with title and subtitle -->
        <div class="mb-5">
            <h1 class="text-3xl font-bold mb-1">Bill Import</h1>
            <p class="text-surface-600 dark:text-surface-300">Upload and process telecom bills for review and approval</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <!-- Total Uploads -->
            <div class="card shadow-sm border-l-4 border-l-blue-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Total Uploads</p>
                        <h2 class="text-3xl font-bold mb-1">{{ stats.totalUploads.value }}</h2>
                        <div class="text-green-500 font-medium">
                            <i class="pi pi-arrow-up"></i> 12% from last month
                        </div>
                    </div>
                    <div class="bg-blue-100 rounded-full p-3 text-blue-500">
                        <i class="pi pi-cloud-upload text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Processed -->
            <div class="card shadow-sm border-l-4 border-l-green-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Processed</p>
                        <h2 class="text-3xl font-bold mb-1">{{ stats.processed.value }}</h2>
                        <div class="text-green-500 font-medium">
                            <i class="pi pi-check"></i> 90% success rate
                        </div>
                    </div>
                    <div class="bg-green-100 rounded-full p-3 text-green-500">
                        <i class="pi pi-check-circle text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Pending -->
            <div class="card shadow-sm border-l-4 border-l-yellow-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Pending</p>
                        <h2 class="text-3xl font-bold mb-1">{{ stats.pending.value }}</h2>
                        <div class="text-yellow-500 font-medium">
                            <i class="pi pi-spinner pi-spin"></i> 3 in processing
                        </div>
                    </div>
                    <div class="bg-yellow-100 rounded-full p-3 text-yellow-500">
                        <i class="pi pi-clock text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Failed -->
            <div class="card shadow-sm border-l-4 border-l-red-500 p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-surface-600 dark:text-surface-300 mb-2">Failed</p>
                        <h2 class="text-3xl font-bold mb-1">{{ stats.failed.value }}</h2>
                        <div class="text-red-500 font-medium">
                            <i class="pi pi-arrow-down"></i> 4% failure rate
                        </div>
                    </div>
                    <div class="bg-red-100 rounded-full p-3 text-red-500">
                        <i class="pi pi-times-circle text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Upload Bills Section -->
            <div class="card p-5">
                <h2 class="text-xl font-bold mb-3">Upload Bills</h2>
                <p class="text-surface-600 dark:text-surface-400 mb-4">Drag and drop telecom bill PDFs or click to browse</p>
                
                <!-- Drag and Drop Area -->
                <div 
                    class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-8 text-center"
                    :class="{'border-primary': dragActive}"
                    @dragover.prevent="dragActive = true"
                    @dragleave.prevent="dragActive = false"
                    @drop="onDrop"
                >
                    <div class="flex flex-col items-center">
                        <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full p-4 mb-4">
                            <i class="pi pi-cloud-upload text-4xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Drag & Drop Files</h3>
                        <p class="text-surface-600 dark:text-surface-400 mb-6">
                            Drop your telecom bill PDFs here or click to browse
                        </p>
                        <Button 
                            label="Browse Files" 
                            icon="pi pi-folder-open" 
                            @click="browseBtnClick"
                            class="w-full md:w-auto"
                        />
                        <input 
                            type="file" 
                            id="fileInput" 
                            multiple 
                            accept=".pdf,application/pdf" 
                            class="hidden"
                            @change="onFileSelect"
                        >
                    </div>
                </div>
            </div>

            <!-- File Manager Section -->
            <div class="card p-5">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-xl font-bold mb-1">File Manager</h2>
                        <p class="text-surface-600 dark:text-surface-400">Manage your uploaded telecom bills</p>
                    </div>
                    <Button icon="pi pi-filter" text rounded />
                </div>
                
                <!-- Search Box -->
                <div class="mb-4">
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-search" />
                        <InputText v-model="fileSearchQuery" placeholder="Search files..." class="w-full" />
                    </span>
                </div>
                
                <!-- File Status Tabs -->
                <div class="mb-4">
                    <div class="flex border-b border-surface-200 dark:border-surface-700">
                        <div 
                            v-for="(tab, index) in fileTabs" 
                            :key="index"
                            @click="onTabChange(index)" 
                            class="cursor-pointer py-2 px-4" 
                            :class="activeFileTabIndex === index ? 'border-b-2 border-primary font-medium text-primary' : 'text-surface-600 dark:text-surface-300'"
                        >
                            {{ tab.label }}
                        </div>
                    </div>
                </div>
                
                <!-- File List -->
                <DataTable 
                    :value="filteredFiles" 
                    v-model:selection="selectedFiles"
                    stripedRows
                    showGridlines
                    responsiveLayout="stack"
                    class="p-datatable-sm"
                >
                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="name" header="Name">
                        <template #body="{ data }">
                            <div class="flex items-center">
                                <i class="pi pi-file-pdf text-red-500 mr-2"></i>
                                <span>{{ data.name }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="vendor" header="Vendor"></Column>
                    <Column field="date" header="Date"></Column>
                    <Column field="size" header="Size"></Column>
                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body>
                            <div class="flex gap-2">
                                <Button icon="pi pi-download" text rounded aria-label="Download" />
                                <Button icon="pi pi-ellipsis-v" text rounded aria-label="More Options" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        
        <!-- Processing Queue Section -->
        <div class="card p-5 mt-6">
            <h2 class="text-xl font-bold mb-3">Processing Queue</h2>
            <p class="text-surface-600 dark:text-surface-400 mb-4">Status of bill processing and OCR extraction</p>
            
            <div class="space-y-6">
                <div v-for="file in processingFiles" :key="file.id" class="border-b border-surface-200 dark:border-surface-700 pb-4">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center">
                            <i class="pi pi-file-pdf text-red-500 mr-3"></i>
                            <div>
                                <div class="font-medium">{{ file.name }}</div>
                                <div class="text-surface-600 dark:text-surface-400 text-sm">{{ file.vendor }}</div>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <span 
                                class="mr-2 flex items-center gap-1"
                                :class="{ 
                                    'text-green-500': file.status === 'Completed',
                                    'text-blue-500': file.status === 'Processing'
                                }"
                            >
                                <i 
                                    :class="{ 
                                        'pi pi-check-circle': file.status === 'Completed',
                                        'pi pi-spinner pi-spin': file.status === 'Processing'
                                    }"
                                ></i>
                                {{ file.status }}
                            </span>
                            <span class="text-surface-600 dark:text-surface-400 text-sm">{{ file.date }}</span>
                        </div>
                    </div>
                    
                    <ProgressBar 
                        :value="file.progress" 
                        :class="{'bg-green-100': file.status === 'Completed'}" 
                        :pt="{
                            root: { class: 'h-2 bg-surface-200 dark:bg-surface-700' },
                            value: { class: file.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500' }
                        }"
                    ></ProgressBar>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bill-import .p-datatable-sm .p-datatable-tbody > tr > td {
    padding: 0.5rem 1rem;
}

.card {
    @apply bg-white dark:bg-surface-800 rounded-xl shadow-sm;
}

:deep(.p-tag) {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
}
</style> 