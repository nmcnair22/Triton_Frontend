<template>
  <div class="integrated-audit-view">
    <!-- Header Section -->
    <Card class="mb-6">
      <template #content>
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="flex items-center mb-2">
              <i class="pi pi-bolt text-yellow-500 mr-2 text-xl"></i>
              <h3 class="text-xl font-bold">Integrated Asset & Charge Profile</h3>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              Profile: {{ selectedProfile?.signature || 'Select a profile below' }}
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span><i class="pi pi-microchip mr-1"></i>Total Devices: {{ getTotalDevices() }}</span>
              <span><i class="pi pi-dollar mr-1"></i>Monthly Charges: ${{ formatCurrency(getTotalCharges()) }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <Button 
              label="Hide Charges" 
              icon="pi pi-eye-slash" 
              size="small" 
              outlined 
              @click="toggleChargesVisibility"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Profile Selection -->
    <Card class="mb-6" v-if="!selectedProfile">
      <template #content>
        <h4 class="text-lg font-bold mb-4">Select Profile for Audit Analysis</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="profile in profiles" 
            :key="profile.signature"
            class="profile-selector border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            @click="selectProfile(profile)"
          >
            <div class="font-mono text-sm mb-2">{{ profile.signature }}</div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">{{ profile.locationCount }} locations</span>
              <Badge :value="`$${formatCurrency(profile.totalCost?.min || 0)}`" severity="info" />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Integrated Profile View -->
    <div v-if="selectedProfile" class="space-y-6">
      <!-- Asset Breakdown with Charges -->
      <Card>
        <template #content>
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-bold">Asset & Charge Breakdown</h4>
            <Button 
              icon="pi pi-times" 
              text 
              rounded 
              @click="selectedProfile = null"
              v-tooltip="'Back to Profile Selection'"
            />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div 
              v-for="(count, type) in selectedProfile.assetBreakdown" 
              :key="type"
              class="asset-charge-card border rounded-lg p-4 hover:shadow-md transition-shadow"
              :class="getAuditStatusClass(type)"
            >
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ count }}</div>
                <div class="text-xs font-medium text-gray-600 mt-1">{{ getAssetTypeName(type) }}</div>
                <Badge :value="type" :class="getAssetTypeStyle(type)" class="mt-2" />
                
                <!-- Charge Information -->
                <div class="mt-3 p-2 bg-gray-50 rounded text-xs">
                  <div class="font-medium text-green-600">${{ getAssetCharges(type) }}</div>
                  <div class="text-gray-500">per device</div>
                </div>

                <!-- Audit Status -->
                <div class="mt-2">
                  <Badge 
                    :value="getAuditStatus(type)" 
                    :severity="getAuditSeverity(type)" 
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Monthly Recurring Revenue Summary with Audit Flags -->
      <Card>
        <template #content>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <i class="pi pi-chart-line text-green-500 mr-2"></i>
              <h5 class="font-bold">Monthly Recurring Revenue Summary</h5>
            </div>
            <div class="flex gap-2">
              <Badge :value="`$${formatCurrency(getTotalMRR())} MRR`" severity="success" />
              <Badge :value="`${getAuditIssueCount()} Issues`" severity="warning" />
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div 
              v-for="category in getRevenueSummaryWithAudit()" 
              :key="category.name"
              class="revenue-category p-4 bg-white rounded border"
              :class="category.auditClass"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="font-bold text-lg">${{ category.amount }}</div>
                <Badge 
                  :value="category.auditStatus" 
                  :severity="category.auditSeverity"
                  class="text-xs"
                />
              </div>
              <div class="text-sm font-medium">{{ category.name }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ category.description }}</div>
              
              <!-- Audit Issues -->
              <div v-if="category.issues?.length" class="mt-2 space-y-1">
                <div 
                  v-for="issue in category.issues" 
                  :key="issue"
                  class="text-xs p-1 bg-red-50 text-red-700 rounded"
                >
                  <i class="pi pi-exclamation-triangle mr-1"></i>{{ issue }}
                </div>
              </div>

              <!-- Correction Actions -->
              <div v-if="category.auditStatus !== 'Correct'" class="mt-3 space-y-2">
                <Button 
                  label="Mark as Correct" 
                  size="small" 
                  text 
                  severity="success"
                  @click="markAsCorrect(category)"
                />
                <Button 
                  label="Assign Different Profile" 
                  size="small" 
                  text 
                  severity="info"
                  @click="showProfileAssignment(category)"
                />
              </div>
            </div>
          </div>

          <!-- Audit Actions -->
          <div class="flex gap-2 pt-4 border-t">
            <Button 
              label="Flag Missing Assets" 
              icon="pi pi-plus" 
              size="small" 
              severity="warning"
              @click="flagMissingAssets"
            />
            <Button 
              label="Correct Overcharges" 
              icon="pi pi-minus" 
              size="small" 
              severity="danger"
              @click="correctOvercharges"
            />
            <Button 
              label="Apply Recommended Profile" 
              icon="pi pi-check" 
              size="small" 
              severity="success"
              @click="applyRecommendedProfile"
            />
          </div>
        </template>
      </Card>

      <!-- Audit Analysis Results -->
      <Card v-if="auditResults.length > 0">
        <template #content>
          <h5 class="font-bold mb-4">Audit Analysis Results</h5>
          <DataTable :value="auditResults" class="audit-results-table">
            <Column field="type" header="Issue Type">
              <template #body="{ data }">
                <Badge :value="data.type" :severity="data.severity" />
              </template>
            </Column>
            <Column field="description" header="Description" />
            <Column field="currentValue" header="Current" />
            <Column field="recommendedValue" header="Recommended" />
            <Column field="impact" header="Financial Impact">
              <template #body="{ data }">
                <span :class="data.impact > 0 ? 'text-red-600' : 'text-green-600'">
                  ${{ formatCurrency(Math.abs(data.impact)) }}
                  {{ data.impact > 0 ? 'overcharge' : 'savings' }}
                </span>
              </template>
            </Column>
            <Column header="Actions">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button 
                    icon="pi pi-check" 
                    size="small" 
                    text 
                    severity="success"
                    @click="acceptRecommendation(data)"
                    v-tooltip="'Accept Recommendation'"
                  />
                  <Button 
                    icon="pi pi-times" 
                    size="small" 
                    text 
                    severity="danger"
                    @click="rejectRecommendation(data)"
                    v-tooltip="'Reject Recommendation'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Profile Assignment Dialog -->
    <Dialog 
      v-model:visible="showProfileDialog" 
      header="Assign Different Charge Profile"
      :style="{ width: '600px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Select Charge Profile:</label>
          <Select 
            v-model="selectedNewProfile" 
            :options="chargeProfiles" 
            optionLabel="signature" 
            placeholder="Choose a charge profile"
            class="w-full"
          />
        </div>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="showProfileDialog = false" />
          <Button label="Assign Profile" severity="success" @click="assignProfile" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  profiles: {
    type: Array,
    default: () => []
  },
  chargeProfiles: {
    type: Array,
    default: () => []
  },
  auditData: {
    type: Object,
    default: () => ({})
  },
  customerId: {
    type: [String, Number],
    default: null
  }
});

const selectedProfile = ref(null);
const showProfileDialog = ref(false);
const selectedNewProfile = ref(null);
const selectedCategory = ref(null);
const auditResults = ref([
  {
    type: 'Overcharge',
    severity: 'danger',
    description: 'TEM devices charged at premium rate',
    currentValue: '$15/device',
    recommendedValue: '$11.50/device',
    impact: 35.00
  },
  {
    type: 'Missing Asset',
    severity: 'warning',
    description: 'Meraki MX64 not in billing profile',
    currentValue: 'Not billed',
    recommendedValue: '$45/device',
    impact: -45.00
  },
  {
    type: 'Undercharge',
    severity: 'info',
    description: 'Support tier should be Level 2',
    currentValue: 'Level 1 - $150',
    recommendedValue: 'Level 2 - $300',
    impact: -150.00
  }
]);

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const selectProfile = (profile) => {
  selectedProfile.value = profile;
};

const getTotalDevices = () => {
  if (!selectedProfile.value?.assetBreakdown) return 0;
  return Object.values(selectedProfile.value.assetBreakdown).reduce((sum, count) => sum + count, 0);
};

const getTotalCharges = () => {
  return selectedProfile.value?.totalCost?.min || 0;
};

const getTotalMRR = () => {
  return selectedProfile.value?.totalCost?.min || 0;
};

const getAssetTypeName = (type) => {
  const names = {
    'CP': 'Cradlepoint',
    'MD': 'Meraki Dev',
    'MN': 'Meraki Net',
    'MU': 'Meraki Uplink',
    'OR': 'Orion Nodes',
    'TEM': 'TEM Acct',
    'VZ': 'Verizon'
  };
  return names[type] || type;
};

const getAssetTypeStyle = (type) => {
  const styles = {
    'CP': 'bg-blue-100 text-blue-800',
    'MD': 'bg-green-100 text-green-800',
    'MN': 'bg-purple-100 text-purple-800',
    'MU': 'bg-yellow-100 text-yellow-800',
    'OR': 'bg-red-100 text-red-800',
    'TEM': 'bg-indigo-100 text-indigo-800',
    'VZ': 'bg-pink-100 text-pink-800'
  };
  return styles[type] || 'bg-gray-100 text-gray-800';
};

const getAssetCharges = (type) => {
  const charges = {
    'CP': '30',
    'MD': '45',
    'MN': '22.5',
    'MU': '22.5',
    'OR': '15',
    'TEM': '15',
    'VZ': '15'
  };
  return charges[type] || '0';
};

const getAuditStatus = (type) => {
  const statuses = {
    'CP': 'Correct',
    'MD': 'Overcharged',
    'MN': 'Correct',
    'MU': 'Correct',
    'OR': 'Correct',
    'TEM': 'Overcharged',
    'VZ': 'Missing'
  };
  return statuses[type] || 'Unknown';
};

const getAuditSeverity = (type) => {
  const status = getAuditStatus(type);
  return {
    'Correct': 'success',
    'Overcharged': 'danger',
    'Undercharged': 'warning',
    'Missing': 'warning',
    'Unknown': 'secondary'
  }[status];
};

const getAuditStatusClass = (type) => {
  const status = getAuditStatus(type);
  return {
    'Correct': 'border-green-200 bg-green-50',
    'Overcharged': 'border-red-200 bg-red-50',
    'Undercharged': 'border-yellow-200 bg-yellow-50',
    'Missing': 'border-orange-200 bg-orange-50'
  }[status] || '';
};

const getAuditIssueCount = () => {
  return auditResults.value.length;
};

const getRevenueSummaryWithAudit = () => {
  return [
    {
      name: 'Advanced Monitoring',
      amount: '100',
      description: '2x MX84, 1x MS220-24, 1x IBR1700',
      auditStatus: 'Correct',
      auditSeverity: 'success',
      auditClass: 'border-green-200',
      issues: []
    },
    {
      name: 'Configuration Management',
      amount: '257',
      description: '2x MX84, 3x MX68, 1x MS220-24, 4x MR46',
      auditStatus: 'Overcharged',
      auditSeverity: 'danger',
      auditClass: 'border-red-200',
      issues: ['TEM devices at premium rate', 'Missing MX64 in profile']
    },
    {
      name: 'Basic Monitoring',
      amount: '303',
      description: '3x MX68, 1x MX64, 4x MR46, 3x MR36',
      auditStatus: 'Undercharged',
      auditSeverity: 'warning',
      auditClass: 'border-yellow-200',
      issues: ['Support tier should be Level 2']
    }
  ];
};

// Audit action functions
const toggleChargesVisibility = () => {
  console.log('Toggling charges visibility...');
};

const refreshCalculations = () => {
  console.log('Refreshing calculations...');
};

const markAsCorrect = (category) => {
  console.log('Marking as correct:', category.name);
};

const showProfileAssignment = (category) => {
  selectedCategory.value = category;
  showProfileDialog.value = true;
};

const flagMissingAssets = () => {
  console.log('Flagging missing assets...');
};

const correctOvercharges = () => {
  console.log('Correcting overcharges...');
};

const applyRecommendedProfile = () => {
  console.log('Applying recommended profile...');
};

const acceptRecommendation = (recommendation) => {
  console.log('Accepting recommendation:', recommendation);
};

const rejectRecommendation = (recommendation) => {
  console.log('Rejecting recommendation:', recommendation);
};

const assignProfile = () => {
  if (selectedNewProfile.value && selectedCategory.value) {
    console.log('Assigning profile:', selectedNewProfile.value.signature, 'to category:', selectedCategory.value.name);
    showProfileDialog.value = false;
  }
};
</script>

<style scoped>
.integrated-audit-view {
  @apply space-y-6;
}

.profile-selector {
  @apply transition-all duration-200;
}

.profile-selector:hover {
  @apply shadow-md transform scale-105;
}

.asset-charge-card {
  @apply transition-all duration-200;
}

.asset-charge-card:hover {
  @apply shadow-md;
}

.revenue-category {
  @apply transition-all duration-200;
}

.audit-results-table :deep(.p-datatable-tbody tr:hover) {
  @apply bg-gray-50;
}
</style>
