<script setup>
import { computed } from 'vue';
import { formatCurrency, formatDate } from '@/lib/utils';

// Components
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  invoiceData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['update:visible']);

// Computed properties
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const invoiceLines = computed(() => {
  // The API returns the data directly as an array, not nested under 'records'
  if (Array.isArray(props.invoiceData)) {
    return props.invoiceData;
  }
  // Fallback for nested structure if needed
  if (props.invoiceData?.records && Array.isArray(props.invoiceData.records)) {
    return props.invoiceData.records;
  }
  return [];
});

const invoiceSummary = computed(() => {
  if (!invoiceLines.value.length) return null;
  
  const firstLine = invoiceLines.value[0];
  const totalAmount = invoiceLines.value.reduce((sum, line) => sum + (line.amount || 0), 0);
  const totalQuantity = invoiceLines.value.reduce((sum, line) => sum + (line.quantity || 0), 0);
  
  return {
    invoiceNumber: firstLine.invoice_number,
    jobNumber: firstLine.job_no,
    cisId: firstLine.cis_id,
    totalAmount,
    totalQuantity,
    lineCount: invoiceLines.value.length,
    createdAt: firstLine.created_at
  };
});

function getTypeColor(type) {
  const typeColors = {
    'Item': 'info',
    'G/L Account': 'success',
    'Resource': 'warn',
    'Fixed Asset': 'secondary',
    'Charge (Item)': 'contrast'
  };
  return typeColors[type] || 'info';
}
</script>

<template>
  <Dialog 
    v-model:visible="isVisible"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    modal
    maximizable
    :closable="true"
    class="invoice-detail-modal">
    
    <template #header>
      <div class="flex items-center gap-3 w-full">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <i class="pi pi-file-text text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
              Customer Invoice Details
            </h3>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
              Dynamics 365 Invoice Information
            </p>
          </div>
        </div>
        <div class="ml-auto">
          <Badge value="Dynamics 365" severity="success" />
        </div>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <div class="mt-4 text-surface-600 dark:text-surface-400">Loading invoice details...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-8">
      <Message severity="error" :closable="false">
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
      </Message>
    </div>

    <!-- Invoice Content -->
    <div v-else-if="invoiceSummary" class="space-y-6">
      <!-- Invoice Header -->
      <Card class="border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Invoice Number -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Invoice Number</div>
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {{ invoiceSummary.invoiceNumber }}
              </div>
            </div>
            
            <!-- Job Number -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Job Number</div>
              <div class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {{ invoiceSummary.jobNumber || 'N/A' }}
              </div>
            </div>
            
            <!-- Total Amount -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Amount</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(invoiceSummary.totalAmount) }}
              </div>
            </div>
            
            <!-- Line Items Count -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Line Items</div>
              <div class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {{ invoiceSummary.lineCount }} items
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Invoice Line Items -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-blue-600"></i>
              <span>Invoice Line Items</span>
            </div>
            <Tag :value="`${invoiceLines.length} items`" severity="info" />
          </div>
        </template>
        
        <template #content>
          <DataTable 
            :value="invoiceLines"
            class="p-datatable-sm"
            responsiveLayout="scroll"
            :paginator="true"
            :rows="10"
            sortMode="multiple"
            removableSort
            stripedRows
            :rowHover="true">
            
            <template #header>
              <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <div class="flex items-center gap-2">
                  <i class="pi pi-database text-blue-600"></i>
                  <span class="font-semibold text-blue-800 dark:text-blue-200">Invoice Line Details</span>
                </div>
                <span class="text-xs text-blue-700 dark:text-blue-300">Dynamics 365 Data</span>
              </div>
            </template>
            
            <Column field="line_no" header="Line #" sortable style="width: 80px">
              <template #body="{ data }">
                <Badge :value="data.line_no" severity="info" />
              </template>
            </Column>
            
            <Column field="type" header="Type" sortable style="width: 120px">
              <template #body="{ data }">
                <Tag :value="data.type" :severity="getTypeColor(data.type)" />
              </template>
            </Column>
            
            <Column field="item_no" header="Item #" sortable style="min-width: 150px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.item_no || 'N/A' }}</span>
              </template>
            </Column>
            
            <Column field="description" header="Description" sortable style="min-width: 250px">
              <template #body="{ data }">
                <div class="max-w-xs">
                  <div class="font-medium">{{ data.description }}</div>
                  <div v-if="data.description_2" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    {{ data.description_2 }}
                  </div>
                </div>
              </template>
            </Column>
            
            <Column field="quantity" header="Qty" sortable style="width: 100px">
              <template #body="{ data }">
                <span class="font-semibold">{{ data.quantity || 0 }}</span>
              </template>
            </Column>
            
            <Column field="unit_price" header="Unit Price" sortable style="width: 120px">
              <template #body="{ data }">
                <span class="font-mono">{{ formatCurrency(data.unit_price) }}</span>
              </template>
            </Column>
            
            <Column field="amount" header="Amount" sortable style="width: 120px">
              <template #body="{ data }">
                <span class="font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(data.amount) }}
                </span>
              </template>
            </Column>
            
            <Column field="job_no" header="Job #" sortable style="width: 100px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.job_no || 'N/A' }}</span>
              </template>
            </Column>
            
            <Column field="cis_id" header="CIS ID" sortable style="width: 100px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.cis_id || 'N/A' }}</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Invoice Summary Footer -->
      <Card class="border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Quantity</div>
              <div class="text-xl font-bold text-surface-900 dark:text-surface-100">
                {{ invoiceSummary.totalQuantity }}
              </div>
            </div>
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Line Items</div>
              <div class="text-xl font-bold text-surface-900 dark:text-surface-100">
                {{ invoiceSummary.lineCount }}
              </div>
            </div>
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Amount</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(invoiceSummary.totalAmount) }}
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-8">
      <i class="pi pi-info-circle text-4xl text-blue-500 mb-4"></i>
      <h4 class="text-lg font-semibold mb-2">No Invoice Data</h4>
      <p class="text-surface-600 dark:text-surface-400">No invoice details available to display.</p>
      <!-- Debug information -->
      <div v-if="props.invoiceData" class="mt-4 p-3 bg-surface-100 dark:bg-surface-800 rounded text-xs text-left">
        <strong>Debug Info:</strong><br>
        Data type: {{ typeof props.invoiceData }}<br>
        Is Array: {{ Array.isArray(props.invoiceData) }}<br>
        Length: {{ Array.isArray(props.invoiceData) ? props.invoiceData.length : 'N/A' }}<br>
        Raw data: {{ JSON.stringify(props.invoiceData).substring(0, 200) }}...
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button 
          label="Close" 
          icon="pi pi-times" 
          outlined 
          @click="isVisible = false" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.invoice-detail-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.dark .invoice-detail-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-bottom: 1px solid #334155;
}

.invoice-detail-modal :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f1f5f9;
  border-color: #e2e8f0;
  font-weight: 600;
}

.dark .invoice-detail-modal :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #334155;
  border-color: #475569;
}
</style> 