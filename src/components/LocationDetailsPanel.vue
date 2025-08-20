<template>
  <div class="location-details-panel">
    <!-- Location Header -->
    <div class="mb-6 p-4 bg-blue-50 rounded-lg">
      <h4 class="font-bold text-lg mb-2">{{ location.location }}</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Location ID:</span>
          <span class="font-medium ml-1">{{ locationId }}</span>
        </div>
        <div>
          <span class="text-gray-600">Assets:</span>
          <span class="font-medium ml-1">{{ location.assetCount || 'N/A' }}</span>
        </div>
        <div>
          <span class="text-gray-600">Monthly Cost:</span>
          <span class="font-medium ml-1 text-green-600">${{ formatCurrency(location.cost) }}</span>
        </div>
        <div>
          <span class="text-gray-600">Status:</span>
          <Badge value="Active" class="bg-green-100 text-green-800" />
        </div>
      </div>
    </div>

    <!-- Asset Categories -->
    <div class="asset-categories">
      <h5 class="font-semibold mb-4">Asset Categories</h5>
      
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner />
        <p class="mt-4 text-gray-600">Loading location assets...</p>
      </div>

      <!-- Asset Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="(assetType, index) in availableAssetTypes" 
          :key="index"
          class="asset-type-card cursor-pointer border rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
          @click="$emit('asset-click', assetType, location)"
        >
          <div class="text-center">
            <i :class="getAssetIcon(assetType)" class="text-2xl mb-2 text-blue-500"></i>
            <div class="font-medium text-sm">{{ getAssetTypeName(assetType) }}</div>
            <Badge :value="assetType" :class="getAssetTypeStyle(assetType)" class="mt-2" />
            <div class="text-xs text-gray-500 mt-1">Click to view details</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && availableAssetTypes.length === 0" class="text-center py-8 text-gray-500">
        <i class="pi pi-info-circle text-4xl mb-4"></i>
        <p>No assets found for this location</p>
        <p class="text-sm">Asset types will appear here when available</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-6 pt-4 border-t">
      <h6 class="font-medium mb-3">Quick Actions</h6>
      <div class="flex flex-wrap gap-2">
        <Button 
          label="View All SIMs" 
          icon="pi pi-sim-card"
          @click="$emit('asset-click', 'ALL_SIMS', location)"
          outlined
          size="small"
        />
        <Button 
          label="TEM Accounts" 
          icon="pi pi-dollar"
          @click="$emit('asset-click', 'TEM', location)"
          outlined
          size="small"
        />
        <Button 
          label="Network Devices" 
          icon="pi pi-wifi"
          @click="viewNetworkDevices"
          outlined
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  location: Object,
  customerId: Number
});

const emit = defineEmits(['asset-click']);

const loading = ref(false);

// Extract location ID from location name - this is a simplified approach
const locationId = computed(() => {
  // You might need to enhance this based on your actual data structure
  // For now, we'll try to extract from the location name or use a placeholder
  return props.location?.locationId || extractLocationIdFromName(props.location?.location) || 'unknown';
});

// Available asset types - this could be dynamic based on the location's asset profile
const availableAssetTypes = computed(() => {
  // This should ideally come from the location's asset breakdown or be fetched from an API
  // For now, we'll show common asset types
  return ['CP', 'MD', 'MN', 'MU', 'OR', 'TEM', 'ALL_SIMS'];
});

const extractLocationIdFromName = (locationName) => {
  if (!locationName) return null;
  
  // Try to extract location ID from patterns like "CTR_3651_Drummondville_QC"
  const match = locationName.match(/CTR_(\d+)_/);
  if (match) {
    // This is a site number, we might need to map it to actual location ID
    return match[1];
  }
  
  return locationName;
};

const viewNetworkDevices = () => {
  // Emit multiple asset types for network devices
  emit('asset-click', 'MD', props.location); // Start with Meraki devices
};

const getAssetTypeName = (type) => {
  const names = {
    'CP': 'Cradlepoint',
    'MD': 'Meraki Dev',
    'MN': 'Meraki Net',
    'MU': 'Meraki Uplink',
    'OR': 'Orion Nodes',
    'SIM_BELL1GB': 'Bell SIM',
    'SIM_TEL1GB': 'Telus SIM',
    'SIM_ATT5GB': 'AT&T SIM',
    'TEM': 'TEM Accounts',
    'VZ': 'Verizon',
    'ALL_SIMS': 'All SIMs'
  };
  return names[type] || type;
};

const getAssetIcon = (type) => {
  const icons = {
    'CP': 'pi pi-wifi',
    'MD': 'pi pi-desktop',
    'MN': 'pi pi-sitemap',
    'MU': 'pi pi-link',
    'OR': 'pi pi-eye',
    'SIM_BELL1GB': 'pi pi-sim-card',
    'SIM_TEL1GB': 'pi pi-sim-card',
    'SIM_ATT5GB': 'pi pi-sim-card',
    'TEM': 'pi pi-dollar',
    'VZ': 'pi pi-mobile',
    'ALL_SIMS': 'pi pi-sim-card'
  };
  return icons[type] || 'pi pi-box';
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
    'VZ': 'bg-indigo-100 text-indigo-800',
    'ALL_SIMS': 'bg-orange-100 text-orange-800'
  };
  return styles[type] || 'bg-gray-100 text-gray-800';
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

onMounted(() => {
  // Could fetch additional location details here if needed
});
</script>

<style scoped>
.asset-type-card {
  transition: all 0.2s ease;
}

.asset-type-card:hover {
  transform: translateY(-2px);
}
</style>
