<template>
  <Dialog 
    :visible="visible" 
    :header="`Billing Details - ${locationName}`"
    :style="{ width: '1000px' }"
    maximizable
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
      <div class="mt-4 text-gray-600">Loading billing details...</div>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <i class="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
      <div class="text-red-600 font-medium mb-2">Failed to load billing details</div>
      <div class="text-gray-600 text-sm">{{ error }}</div>
      <Button 
        label="Retry" 
        icon="pi pi-refresh" 
        @click="fetchBillingDetails"
        class="mt-4"
      />
    </div>

    <div v-else-if="billingData" class="billing-details space-y-6">
      <!-- Billing Summary -->
      <Card>
        <template #content>
          <div class="flex justify-between items-start mb-4">
            <div>
              <h5 class="font-bold text-lg">Billing Summary</h5>
              <div class="text-sm text-gray-600">{{ locationName }} - Location ID: {{ locationId }}</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-green-600">
                ${{ formatCurrency(billingData.billing_summary?.total_monthly_cost || 0) }}
              </div>
              <div class="text-sm text-gray-600">Monthly Total</div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-blue-50 rounded">
              <div class="text-xl font-bold text-blue-600">{{ billingData.billing_summary?.total_line_items || 0 }}</div>
              <div class="text-xs text-gray-600">Line Items</div>
            </div>
            <div class="text-center p-3 bg-green-50 rounded">
              <div class="text-xl font-bold text-green-600">{{ billingData.billing_summary?.unique_charge_types || 0 }}</div>
              <div class="text-xs text-gray-600">Charge Types</div>
            </div>
            <div class="text-center p-3 bg-purple-50 rounded">
              <div class="text-xl font-bold text-purple-600">{{ billingData.line_items?.length || 0 }}</div>
              <div class="text-xs text-gray-600">Raw Items</div>
            </div>
            <div class="text-center p-3 bg-yellow-50 rounded">
              <div class="text-xl font-bold text-yellow-600">{{ billingData.consolidated_charges?.length || 0 }}</div>
              <div class="text-xs text-gray-600">Consolidated</div>
            </div>
          </div>

          <!-- Charge Signature -->
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <div class="text-sm font-medium text-gray-600 mb-1">Charge Signature:</div>
            <div class="font-mono text-lg text-blue-600">{{ billingData.billing_summary?.charge_signature || 'Unknown' }}</div>
          </div>
        </template>
      </Card>

      <!-- Consolidated Charges -->
      <Card>
        <template #content>
          <div class="flex justify-between items-center mb-4">
            <h6 class="font-bold">Consolidated Charges</h6>
            <Badge :value="`${billingData.consolidated_charges?.length || 0} charge types`" severity="info" />
          </div>

          <DataTable 
            :value="consolidatedChargesArray" 
            class="consolidated-charges-table"
            sortMode="multiple"
          >
            <Column field="chargeType" header="Charge Type" sortable>
              <template #body="{ data }">
                <div class="flex items-center">
                  <Badge :value="data.chargeType" :class="getChargeTypeStyle(data.chargeType)" class="mr-2" />
                  <span class="font-medium">{{ data.chargeType }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="description" header="Description" sortable>
              <template #body="{ data }">
                <div class="text-sm">{{ data.description || 'No description' }}</div>
              </template>
            </Column>
            
            <Column field="quantity" header="Quantity" sortable>
              <template #body="{ data }">
                <span class="font-semibold">{{ data.quantity }}</span>
              </template>
            </Column>
            
            <Column field="unitAmount" header="Unit Amount" sortable>
              <template #body="{ data }">
                <span class="font-medium">${{ formatCurrency(data.unitAmount) }}</span>
              </template>
            </Column>
            
            <Column field="totalAmount" header="Total Amount" sortable>
              <template #body="{ data }">
                <span class="font-bold text-green-600">${{ formatCurrency(data.totalAmount) }}</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Raw Line Items -->
      <Card>
        <template #content>
          <div class="flex justify-between items-center mb-4">
            <h6 class="font-bold">Raw Line Items</h6>
            <div class="flex gap-2">
              <Badge :value="`${billingData.line_items?.length || 0} items`" severity="secondary" />
              <Button 
                :label="showRawItems ? 'Hide Raw Items' : 'Show Raw Items'" 
                :icon="showRawItems ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                size="small" 
                text
                @click="showRawItems = !showRawItems"
              />
            </div>
          </div>

          <div v-if="showRawItems">
            <DataTable 
              :value="billingData.line_items || []" 
              class="raw-items-table"
              :paginator="true"
              :rows="10"
              sortMode="multiple"
            >
              <Column field="description" header="Description" sortable>
                <template #body="{ data }">
                  <div class="text-sm">{{ data.description || 'No description' }}</div>
                </template>
              </Column>
              
              <Column field="raw_amount" header="Raw Amount" sortable>
                <template #body="{ data }">
                  <span class="text-gray-600">${{ formatCurrency(data.raw_amount || 0) }}</span>
                </template>
              </Column>
              
              <Column field="normalized_code" header="Charge Type" sortable>
                <template #body="{ data }">
                  <Badge 
                    :value="data.normalized_code || 'UNKNOWN'" 
                    :class="getChargeTypeStyle(data.normalized_code)"
                    class="text-xs"
                  />
                </template>
              </Column>
              
              <Column field="decoded_amount" header="Decoded Amount" sortable>
                <template #body="{ data }">
                  <span class="font-medium">${{ formatCurrency(data.decoded_amount || 0) }}</span>
                </template>
              </Column>
              
              <Column field="billing_schedule_number" header="Billing Schedule" sortable>
                <template #body="{ data }">
                  <span class="text-xs text-gray-500">{{ data.billing_schedule_number || 'N/A' }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>

      <!-- Location & Billing Info -->
      <Card v-if="billingData.location || billingData.ship_to">
        <template #content>
          <h6 class="font-bold mb-4">Location & Billing Information</h6>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div v-if="billingData.location?.site_number">
              <div class="text-gray-600">Site Number:</div>
              <div class="font-medium">{{ billingData.location.site_number }}</div>
            </div>
            <div v-if="billingData.location?.city && billingData.location?.state">
              <div class="text-gray-600">Location:</div>
              <div class="font-medium">{{ billingData.location.city }}, {{ billingData.location.state }}</div>
            </div>
            <div v-if="billingData.ship_to?.name">
              <div class="text-gray-600">Ship To:</div>
              <div class="font-medium">{{ billingData.ship_to.name }}</div>
            </div>
            <div v-if="billingData.ship_to?.customer_no">
              <div class="text-gray-600">Customer Number:</div>
              <div class="font-medium">{{ billingData.ship_to.customer_no }}</div>
            </div>
            <div v-if="billingData.line_items?.[0]?.billing_schedule_number">
              <div class="text-gray-600">Billing Schedule:</div>
              <div class="font-medium">{{ billingData.line_items[0].billing_schedule_number }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Audit Information -->
      <Card>
        <template #content>
          <h6 class="font-bold mb-4">Audit Information</h6>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Data Retrieved:</span>
              <span class="font-medium">{{ new Date().toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Charge Signature Match:</span>
              <Badge 
                :value="billingData.billing_summary?.charge_signature ? 'Valid' : 'Missing'" 
                :severity="billingData.billing_summary?.charge_signature ? 'success' : 'danger'"
              />
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Data Quality:</span>
              <Badge 
                :value="getDataQualityScore()" 
                :severity="getDataQualitySeverity()"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  locationId: {
    type: [String, Number],
    default: null
  },
  locationName: {
    type: String,
    default: 'Unknown Location'
  }
});

const emit = defineEmits(['update:visible']);

const loading = ref(false);
const error = ref(null);
const billingData = ref(null);
const showRawItems = ref(false);

// Watch for dialog opening to fetch data
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.locationId != null) {
    fetchBillingDetails();
  }
});

const fetchBillingDetails = async () => {
  if (!props.locationId) {
    error.value = 'No location ID provided';
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get(`http://localhost:8000/api/billing/details/${props.locationId}`);
    billingData.value = response.data;
  } catch (err) {
    console.error('Error fetching billing details:', err);
    error.value = err.response?.data?.message || 'Failed to load billing details';
  } finally {
    loading.value = false;
  }
};

const consolidatedChargesArray = computed(() => {
  if (!billingData.value?.consolidated_charges || !Array.isArray(billingData.value.consolidated_charges)) return [];
  
  return billingData.value.consolidated_charges.map(charge => ({
    chargeType: charge.charge_code || charge.display_name || 'Unknown',
    description: charge.description || 'No description',
    quantity: charge.quantity || 0,
    unitAmount: charge.quantity > 0 ? (charge.amount / charge.quantity) : charge.amount || 0,
    totalAmount: charge.amount || 0
  }));
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getChargeTypeStyle = (chargeType) => {
  const styles = {
    'TA': 'bg-blue-100 text-blue-800',
    'TEM': 'bg-green-100 text-green-800',
    'TP': 'bg-purple-100 text-purple-800',
    'VZ1GB': 'bg-orange-100 text-orange-800',
    'LD': 'bg-red-100 text-red-800',
    'TEL5GB': 'bg-yellow-100 text-yellow-800'
  };
  
  // Check if charge type starts with any known prefix
  for (const [prefix, style] of Object.entries(styles)) {
    if (chargeType?.startsWith(prefix)) {
      return style;
    }
  }
  
  return 'bg-gray-100 text-gray-800';
};

const getDataQualityScore = () => {
  if (!billingData.value) return 'Unknown';
  
  let score = 0;
  const maxScore = 5;
  
  if (billingData.value.billing_summary?.charge_signature) score++;
  if (billingData.value.billing_summary?.total_monthly_cost > 0) score++;
  if (billingData.value.line_items?.length > 0) score++;
  if (billingData.value.consolidated_charges?.length > 0) score++;
  if (billingData.value.location || billingData.value.ship_to) score++;
  
  const percentage = Math.round((score / maxScore) * 100);
  return `${percentage}% Complete`;
};

const getDataQualitySeverity = () => {
  const score = getDataQualityScore();
  const percentage = parseInt(score);
  
  if (percentage >= 80) return 'success';
  if (percentage >= 60) return 'warning';
  return 'danger';
};
</script>

<style scoped>
.billing-details {
  @apply space-y-6;
}

.consolidated-charges-table :deep(.p-datatable-tbody tr:hover) {
  @apply bg-gray-50;
}

.raw-items-table :deep(.p-datatable-tbody tr:hover) {
  @apply bg-gray-50;
}

.raw-items-table :deep(.p-datatable-header-cell) {
  @apply bg-gray-100 text-xs;
}
</style>
