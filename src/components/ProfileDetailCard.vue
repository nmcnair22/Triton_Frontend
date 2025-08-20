<template>
  <div class="profile-detail-card">
    <div class="border border-gray-200 rounded-lg p-4">
      <div class="mb-4">
        <h6 class="text-sm font-medium text-gray-600 mb-2">Profile Details</h6>
        <div class="space-y-2">
          <div>
            <span class="text-xs text-gray-500">Asset Signature:</span>
            <div class="font-mono text-sm mt-1 p-2 bg-gray-50 rounded">{{ profile.signature }}</div>
          </div>
          <div>
            <span class="text-xs text-gray-500">Locations:</span>
            <span class="font-semibold ml-2">{{ profile.locationCount }}</span>
          </div>
        </div>
      </div>

      <!-- Asset Breakdown Table -->
      <div class="mb-4">
        <h6 class="text-sm font-medium text-gray-600 mb-2">Asset Breakdown</h6>
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="font-medium text-gray-600">Asset Type</div>
          <div class="font-medium text-gray-600">Count</div>
          <div class="font-medium text-gray-600">Description</div>
          
          <template v-for="(count, type) in profile.assetBreakdown" :key="type">
            <div class="py-1">
              <Badge :value="type" :class="getAssetTypeStyle(type)" />
            </div>
            <div class="py-1 font-semibold">{{ count }}</div>
            <div class="py-1 text-xs text-gray-500">{{ getAssetDescription(type) }}</div>
          </template>
        </div>
      </div>

      <!-- Charge Variations -->
      <div class="mb-4" v-if="profile.chargeVariations?.length">
        <h6 class="text-sm font-medium text-gray-600 mb-2">Billing Variations</h6>
        <div class="space-y-2">
          <div v-for="(variation, index) in profile.chargeVariations" :key="index" class="border rounded p-2 text-xs">
            <div class="font-mono text-blue-600 mb-1">{{ variation.signature }}</div>
            <div class="text-gray-500">
              {{ variation.locations?.length }} locations - ${{ formatCurrency(variation.cost.min) }}
              <span v-if="variation.cost.min !== variation.cost.max"> - ${{ formatCurrency(variation.cost.max) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cost Information -->
      <div class="mb-4">
        <h6 class="text-sm font-medium text-gray-600 mb-2">Total Cost Range</h6>
        <div class="text-lg font-semibold text-green-600">
          ${{ formatCurrency(profile.totalCost.min) }}
          <span v-if="profile.totalCost.min !== profile.totalCost.max"> - ${{ formatCurrency(profile.totalCost.max) }}</span>
        </div>
      </div>

      <!-- Locations -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h6 class="text-sm font-medium text-gray-600">Locations</h6>
          <Button 
            :label="showLocations ? 'Hide' : 'Show'"
            :icon="showLocations ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            size="small"
            text
            @click="toggleLocations"
          />
        </div>
        
        <div v-if="showLocations" class="max-h-32 overflow-y-auto">
          <div v-for="location in profile.locations" :key="location" class="text-xs py-1 px-2 mb-1 bg-blue-50 rounded">
            {{ location }}
          </div>
        </div>
        <div v-else class="text-xs text-gray-500">
          {{ profile.locationCount }} locations (click Show to expand)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  profile: Object,
  customerId: Number
});

const showLocations = ref(false);

const toggleLocations = () => {
  showLocations.value = !showLocations.value;
};

const getAssetTypeStyle = (type) => {
  const styles = {
    'CP': 'bg-blue-100 text-blue-800',
    'MD': 'bg-green-100 text-green-800', 
    'MN': 'bg-purple-100 text-purple-800',
    'MU': 'bg-yellow-100 text-yellow-800',
    'OR': 'bg-red-100 text-red-800',
    'SIM_BELL1GB': 'bg-orange-100 text-orange-800',
    'SIM_TEL1GB': 'bg-cyan-100 text-cyan-800',
    'SIM_ATT5GB': 'bg-pink-100 text-pink-800',
    'TEM': 'bg-gray-100 text-gray-800',
    'VZ': 'bg-indigo-100 text-indigo-800'
  };
  return styles[type] || 'bg-gray-100 text-gray-800';
};

const getAssetDescription = (type) => {
  const descriptions = {
    'CP': 'Cradlepoint Device',
    'MD': 'Meraki Device',
    'MN': 'Meraki Network',
    'MU': 'Meraki Uplink',
    'OR': 'Orion Node',
    'SIM_BELL1GB': 'Bell 1GB SIM',
    'SIM_TEL1GB': 'Telus 1GB SIM',
    'SIM_ATT5GB': 'AT&T 5GB SIM',
    'TEM': 'TEM Account',
    'VZ': 'Verizon Device'
  };
  return descriptions[type] || 'Unknown Asset';
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
</script>

<style scoped>
.profile-detail-card {
  min-height: 200px;
}
</style>
