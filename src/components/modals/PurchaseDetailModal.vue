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
  purchaseData: {
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

const purchaseLines = computed(() => {
  // The API returns the data directly as an array, not nested under 'records'
  if (Array.isArray(props.purchaseData)) {
    return props.purchaseData;
  }
  // Fallback for nested structure if needed
  if (props.purchaseData?.records && Array.isArray(props.purchaseData.records)) {
    return props.purchaseData.records;
  }
  return [];
});

const purchaseSummary = computed(() => {
  if (!purchaseLines.value.length) return null;
  
  const firstLine = purchaseLines.value[0];
  const totalAmount = purchaseLines.value.reduce((sum, line) => sum + (line.amount || (line.quantity * line.direct_unit_cost) || 0), 0);
  const totalQuantity = purchaseLines.value.reduce((sum, line) => sum + (line.quantity || 0), 0);
  
  return {
    documentNumber: firstLine.document_no,
    vendorNumber: firstLine.vendor_no,
    vendorInvoiceNo: firstLine.vendor_invoice_no,
    jobNumber: firstLine.job_no,
    cisId: firstLine.cis_id,
    totalAmount,
    totalQuantity,
    lineCount: purchaseLines.value.length,
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
  return typeColors[type] || 'warn';
}
</script>

<template>
  <Dialog 
    v-model:visible="isVisible"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    modal
    maximizable
    :closable="true"
    class="purchase-detail-modal">
    
    <template #header>
      <div class="flex items-center gap-3 w-full">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <i class="pi pi-shopping-cart text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
              Purchase Order Details
            </h3>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
              Dynamics 365 Purchase Information
            </p>
          </div>
        </div>
        <div class="ml-auto">
          <Badge value="Dynamics 365" severity="warn" />
        </div>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <div class="mt-4 text-surface-600 dark:text-surface-400">Loading purchase details...</div>
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

    <!-- Purchase Content -->
    <div v-else-if="purchaseSummary" class="space-y-6">
      <!-- Purchase Header -->
      <Card class="border border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Document Number -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Document Number</div>
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
                {{ purchaseSummary.documentNumber }}
              </div>
            </div>
            
            <!-- Vendor Information -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Vendor</div>
              <div class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {{ purchaseSummary.vendorNumber || 'N/A' }}
              </div>
              <div v-if="purchaseSummary.vendorInvoiceNo" class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                Inv: {{ purchaseSummary.vendorInvoiceNo }}
              </div>
            </div>
            
            <!-- Total Cost -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Cost</div>
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ formatCurrency(purchaseSummary.totalAmount) }}
              </div>
            </div>
            
            <!-- Line Items Count -->
            <div class="text-center">
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Line Items</div>
              <div class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {{ purchaseSummary.lineCount }} items
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Purchase Line Items -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-orange-600"></i>
              <span>Purchase Line Items</span>
            </div>
            <Tag :value="`${purchaseLines.length} items`" severity="warn" />
          </div>
        </template>
        
        <template #content>
          <DataTable 
            :value="purchaseLines"
            class="p-datatable-sm"
            responsiveLayout="scroll"
            :paginator="true"
            :rows="10"
            sortMode="multiple"
            removableSort
            stripedRows
            :rowHover="true">
            
            <template #header>
              <div class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                <div class="flex items-center gap-2">
                  <i class="pi pi-database text-orange-600"></i>
                  <span class="font-semibold text-orange-800 dark:text-orange-200">Purchase Line Details</span>
                </div>
                <span class="text-xs text-orange-700 dark:text-orange-300">Dynamics 365 Data</span>
              </div>
            </template>
            
            <Column field="line_no" header="Line #" sortable style="width: 80px">
              <template #body="{ data }">
                <Badge :value="data.line_no" severity="warn" />
              </template>
            </Column>
            
            <Column field="type" header="Type" sortable style="width: 120px">
              <template #body="{ data }">
                <Tag :value="data.type" :severity="getTypeColor(data.type)" />
              </template>
            </Column>
            
            <Column field="no" header="Item #" sortable style="min-width: 150px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.no || 'N/A' }}</span>
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
            
            <Column field="direct_unit_cost" header="Unit Cost" sortable style="width: 120px">
              <template #body="{ data }">
                <span class="font-mono">{{ formatCurrency(data.direct_unit_cost) }}</span>
              </template>
            </Column>
            
            <Column field="amount" header="Total Cost" sortable style="width: 120px">
              <template #body="{ data }">
                <span class="font-bold text-red-600 dark:text-red-400">
                  {{ formatCurrency(data.amount || (data.quantity * data.direct_unit_cost)) }}
                </span>
              </template>
            </Column>
            
            <Column field="vendor_no" header="Vendor #" sortable style="width: 100px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.vendor_no || 'N/A' }}</span>
              </template>
            </Column>
            
            <Column field="vendor_invoice_no" header="Vendor Invoice" sortable style="min-width: 120px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.vendor_invoice_no || 'N/A' }}</span>
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

      <!-- Purchase Summary Footer -->
      <Card class="border border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Quantity</div>
              <div class="text-xl font-bold text-surface-900 dark:text-surface-100">
                {{ purchaseSummary.totalQuantity }}
              </div>
            </div>
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Line Items</div>
              <div class="text-xl font-bold text-surface-900 dark:text-surface-100">
                {{ purchaseSummary.lineCount }}
              </div>
            </div>
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Vendor</div>
              <div class="text-lg font-bold text-surface-900 dark:text-surface-100">
                {{ purchaseSummary.vendorNumber }}
              </div>
            </div>
            <div>
              <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Cost</div>
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ formatCurrency(purchaseSummary.totalAmount) }}
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-8">
      <i class="pi pi-info-circle text-4xl text-orange-500 mb-4"></i>
      <h4 class="text-lg font-semibold mb-2">No Purchase Data</h4>
      <p class="text-surface-600 dark:text-surface-400">No purchase details available to display.</p>
      <!-- Debug information -->
      <div v-if="props.purchaseData" class="mt-4 p-3 bg-surface-100 dark:bg-surface-800 rounded text-xs text-left">
        <strong>Debug Info:</strong><br>
        Data type: {{ typeof props.purchaseData }}<br>
        Is Array: {{ Array.isArray(props.purchaseData) }}<br>
        Length: {{ Array.isArray(props.purchaseData) ? props.purchaseData.length : 'N/A' }}<br>
        Raw data: {{ JSON.stringify(props.purchaseData).substring(0, 200) }}...
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
.purchase-detail-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  border-bottom: 1px solid #fed7aa;
}

.dark .purchase-detail-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #431407 0%, #9a3412 100%);
  border-bottom: 1px solid #9a3412;
}

.purchase-detail-modal :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #fff7ed;
  border-color: #fed7aa;
  font-weight: 600;
}

.dark .purchase-detail-modal :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #9a3412;
  border-color: #c2410c;
}
</style> 