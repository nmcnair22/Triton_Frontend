<template>
  <div class="dispatch-detail-view">
    <div class="flex flex-column gap-3 mb-3">
      <div v-if="loading" class="flex justify-content-center">
        <ProgressSpinner />
      </div>
      
      <div v-else-if="error" class="flex justify-content-center">
        <Message severity="error" :closable="false">
          <div class="flex flex-column gap-2">
            <div class="font-bold">Failed to load dispatch details</div>
            <div>{{ error }}</div>
            <Button label="Try Again" icon="pi pi-refresh" @click="loadDispatchData" />
          </div>
        </Message>
      </div>
      
      <div v-else-if="!dispatchData" class="flex justify-content-center">
        <Message severity="info" :closable="false">
          <div class="font-bold">No dispatch selected</div>
          <div>Select a dispatch from the table to view its details</div>
        </Message>
      </div>
      
      <div v-else>
        <div class="grid">
          <!-- Dispatch Header -->
          <div class="col-12">
            <div class="flex justify-content-between align-items-center">
              <div class="flex flex-column">
                <h2 class="m-0">{{ dispatchData.id }}</h2>
                <div class="text-lg">{{ dispatchData.customer_name }}</div>
              </div>
              <div>
                <Tag :severity="getStatusSeverity(dispatchData.status)">{{ dispatchData.status }}</Tag>
              </div>
            </div>
            <Divider />
          </div>
          
          <!-- Dispatch Details -->
          <div class="col-12 md:col-6">
            <Card>
              <template #title>Dispatch Information</template>
              <template #content>
                <div class="grid">
                  <div class="col-6">
                    <div class="font-semibold">Project:</div>
                    <div class="mb-3">{{ dispatchData.project_name || 'N/A' }}</div>
                    
                    <div class="font-semibold">Service Date:</div>
                    <div class="mb-3">{{ formatDate(dispatchData.service_date) }}</div>
                    
                    <div class="font-semibold">Technician:</div>
                    <div class="mb-3">{{ dispatchData.technician || 'N/A' }}</div>
                  </div>
                  
                  <div class="col-6">
                    <div class="font-semibold">Location:</div>
                    <div class="mb-3">{{ formatLocation() }}</div>
                    
                    <div class="font-semibold">Created:</div>
                    <div class="mb-3">{{ formatDate(dispatchData.created_at) }}</div>
                    
                    <div class="font-semibold">Updated:</div>
                    <div class="mb-3">{{ formatDate(dispatchData.updated_at) }}</div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
          
          <!-- Financial Information -->
          <div class="col-12 md:col-6">
            <Card>
              <template #title>Financial Information</template>
              <template #content>
                <div v-if="marginLoading" class="flex justify-content-center">
                  <ProgressSpinner style="width:50px;height:50px" />
                </div>
                
                <div v-else-if="marginError" class="bg-red-50 border-round p-3 mb-3">
                  <div class="font-semibold text-red-700">Error loading financial data</div>
                  <div class="text-red-600">{{ marginError }}</div>
                  <Button label="Try Again" icon="pi pi-refresh" 
                    class="p-button-sm p-button-outlined mt-2"
                    @click="loadMarginData" />
                </div>
                
                <div v-else-if="marginData" class="grid">
                  <div class="col-6">
                    <div class="font-semibold">Invoice #:</div>
                    <div class="mb-3">{{ marginData.invoice_number || 'Not invoiced' }}</div>
                    
                    <div class="font-semibold">Total Charged:</div>
                    <div class="mb-3">{{ formatCurrency(marginData.total_charged) }}</div>
                    
                    <div class="font-semibold">Total Cost:</div>
                    <div class="mb-3">{{ formatCurrency(marginData.total_cost) }}</div>
                  </div>
                  
                  <div class="col-6">
                    <div class="font-semibold">Processed Date:</div>
                    <div class="mb-3">{{ formatDate(marginData.accounting_processed_at) }}</div>
                    
                    <div class="font-semibold">Total Profit:</div>
                    <div class="mb-3">{{ formatCurrency(marginData.total_profit) }}</div>
                    
                    <div class="font-semibold">Margin:</div>
                    <div class="mb-3">
                      <span :class="getMarginColorClass(marginData.profit_margin_percent)">
                        {{ marginData.profit_margin_percent.toFixed(2) }}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div v-else class="text-center p-3 border-round bg-gray-50">
                  <i class="pi pi-dollar text-gray-700 text-3xl mb-2"></i>
                  <div class="text-gray-700">No financial data available for this dispatch</div>
                </div>
              </template>
            </Card>
          </div>
          
          <!-- Documents -->
          <div class="col-12">
            <Card>
              <template #title>Documents</template>
              <template #content>
                <DispatchDocumentTable :dispatch-id="dispatchData.id" />
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Message from 'primevue/message';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import DispatchDocumentTable from './DispatchDocumentTable.vue';
import { useDispatchStore } from '@/stores/dispatchStore';

const props = defineProps({
  dispatchId: {
    type: [String, Number],
    default: null
  }
});

const dispatchStore = useDispatchStore();
const dispatchData = ref(null);
const marginData = ref(null);
const loading = ref(false);
const marginLoading = ref(false);
const error = ref(null);
const marginError = ref(null);

watch(() => props.dispatchId, (newId) => {
  if (newId) {
    loadDispatchData();
  } else {
    dispatchData.value = null;
    marginData.value = null;
  }
}, { immediate: true });

const loadDispatchData = async () => {
  if (!props.dispatchId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    // Use the dispatch store's new getDispatchById method
    const fetchedDispatch = await dispatchStore.getDispatchById(props.dispatchId);
    
    if (fetchedDispatch) {
      dispatchData.value = fetchedDispatch;
      // Load margin data once we have the dispatch
      loadMarginData();
    } else {
      dispatchData.value = null;
      error.value = 'Dispatch not found';
    }
  } catch (err) {
    console.error('Error loading dispatch:', err);
    error.value = err.message || 'Failed to load dispatch details';
  } finally {
    loading.value = false;
  }
};

const loadMarginData = async () => {
  if (!props.dispatchId) return;
  
  marginLoading.value = true;
  marginError.value = null;
  
  try {
    const response = await dispatchStore.getDispatchMargin(props.dispatchId);
    
    if (response) {
      marginData.value = response;
    } else {
      marginData.value = null;
    }
  } catch (err) {
    console.error('Error loading margin data:', err);
    marginError.value = err.message || 'Failed to load financial data';
  } finally {
    marginLoading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const formatLocation = () => {
  if (!dispatchData.value) return 'N/A';
  
  const city = dispatchData.value.city || '';
  const state = dispatchData.value.state || '';
  
  if (city && state) {
    return `${city}, ${state}`;
  } else if (city) {
    return city;
  } else if (state) {
    return state;
  } else {
    return 'N/A';
  }
};

const getStatusSeverity = (status) => {
  if (!status) return 'info';
  
  const statusLower = status.toLowerCase();
  if (statusLower === 'completed') return 'success';
  if (statusLower === 'cancelled') return 'danger';
  if (statusLower === 'in progress') return 'warning';
  if (statusLower === 'scheduled') return 'info';
  
  return 'secondary';
};

const getMarginColorClass = (margin) => {
  if (margin === undefined || margin === null) return '';
  
  if (margin >= 40) return 'text-green-600 font-bold';
  if (margin >= 30) return 'text-green-500';
  if (margin >= 20) return 'text-yellow-500';
  if (margin >= 10) return 'text-orange-500';
  return 'text-red-500 font-bold';
};
</script>

<style scoped>
.dispatch-detail-view .p-card {
  height: 100%;
}
</style> 