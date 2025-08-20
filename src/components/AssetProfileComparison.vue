<template>
  <div class="asset-profile-comparison">
    <!-- Profile Selection Table -->
    <Card class="mb-6">
      <template #content>
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-semibold">Asset Profile Selection</h4>
          <Button 
            :label="showProfileTable ? 'Hide Profiles' : 'Show Profiles'" 
            :icon="showProfileTable ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            @click="toggleProfileTable"
            text
          />
        </div>
        
        <div v-if="showProfileTable" class="profile-selection">
          <DataTable :value="profiles" selectionMode="single" v-model:selection="selectedProfile" @row-select="onProfileSelect">
            <Column field="signature" header="Asset Signature" sortable>
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.signature }}</span>
              </template>
            </Column>
            <Column field="locationCount" header="Locations" sortable>
              <template #body="{ data }">
                <Badge :value="data.locationCount" class="bg-blue-100 text-blue-800" />
              </template>
            </Column>
            <Column header="Assets Breakdown">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-1">
                  <Badge 
                    v-for="(count, type) in data.assetBreakdown" 
                    :key="type"
                    :value="`${type}:${count}`"
                    :class="getAssetTypeStyle(type)"
                  />
                </div>
              </template>
            </Column>
            <Column header="Charge Variations">
              <template #body="{ data }">
                <div class="text-xs max-w-48">
                  <div v-for="(variation, index) in data.chargeVariations?.slice(0, 2)" :key="index" class="mb-1">
                    <span class="font-mono text-blue-600">{{ variation.signature }}</span>
                    <span class="text-gray-500 ml-1">({{ variation.locations?.length }} sites)</span>
                  </div>
                  <div v-if="data.chargeVariations?.length > 2" class="text-gray-500">
                    +{{ data.chargeVariations.length - 2 }} more variations...
                  </div>
                </div>
              </template>
            </Column>
            <Column field="totalCost.min" header="Monthly Cost" sortable>
              <template #body="{ data }">
                <span class="font-semibold">${{ formatCurrency(data.totalCost.min) }}</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Selected Profile Details -->
    <div v-if="selectedProfileForDetails">
      <AssetProfileDetailView 
        :profile="selectedProfileForDetails" 
        :customer-id="customerId"
      />
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center text-gray-500 py-12">
      <i class="pi pi-info-circle text-4xl mb-4 text-gray-400"></i>
      <p class="text-lg mb-2">Select an Asset Profile</p>
      <p class="text-sm">Choose a profile from the table above to view detailed breakdown and locations</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import AssetProfileDetailView from './AssetProfileDetailView.vue';

const props = defineProps({
  profiles: Array,
  customerId: Number
});

const showProfileTable = ref(true);
const selectedProfile = ref(null);
const selectedProfileForDetails = ref(null);

const toggleProfileTable = () => {
  showProfileTable.value = !showProfileTable.value;
};

const onProfileSelect = (event) => {
  selectedProfileForDetails.value = event.data;
  // Auto-hide table after selection
  showProfileTable.value = false;
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
</script>

<style scoped>
.profile-selection {
  max-height: 400px;
  overflow-y: auto;
}

.profile-display {
  min-height: 300px;
}
</style>
