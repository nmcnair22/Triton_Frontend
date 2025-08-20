<template>
  <div class="charge-profile-detail-view">
    <!-- Profile Header -->
    <Card class="mb-6">
      <template #content>
        <div class="profile-header">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold mb-2">{{ profile.signature }}</h3>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <span><i class="pi pi-map-marker mr-1"></i>{{ profile.locationCount }} Locations</span>
                <span><i class="pi pi-dollar mr-1"></i>${{ formatCurrency(profile.totalCost?.min || 0) }}</span>
                <span v-if="profile.assetVariations?.length > 1">
                  <i class="pi pi-exclamation-triangle mr-1 text-orange-500"></i>
                  {{ profile.assetVariations.length }} Asset Variations
                </span>
              </div>
            </div>
          </div>

          <!-- Service Breakdown Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div 
              v-for="(count, service) in profile.serviceBreakdown" 
              :key="service"
              class="service-card cursor-pointer border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ count }}</div>
                <div class="text-xs font-medium text-gray-600 mt-1">{{ getServiceName(service) }}</div>
                <Badge :value="service" :class="getServiceStyle(service)" class="mt-2" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Expandable Locations List -->
    <Card>
      <template #content>
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-semibold">Locations with this Charge Profile</h4>
          <Button 
            :label="showLocations ? 'Hide Locations' : 'Show Locations'" 
            :icon="showLocations ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            @click="toggleLocations"
            text
          />
        </div>
        
        <div v-if="showLocations" class="locations-list">
          <DataTable 
            :value="locationObjects" 
            :paginator="true" 
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20]"
          >
            <Column field="location" header="Location" sortable>
              <template #body="{ data }">
                <div class="flex items-center">
                  <i class="pi pi-map-marker text-blue-500 mr-2"></i>
                  <span class="font-medium">{{ data.location }}</span>
                </div>
              </template>
            </Column>
            <Column field="assetSignature" header="Asset Signature" sortable>
              <template #body="{ data }">
                <Button
                  :label="getAssetSignature(data.location)"
                  class="p-button-link p-button-sm font-mono text-blue-600 hover:text-blue-800"
                  @click="showAssetDetails(data.location)"
                  v-tooltip="'Click to view asset details'"
                />
              </template>
            </Column>
            <Column header="Devices" class="w-32">
              <template #body="{ data }">
                <Badge :value="data.deviceCount || 'N/A'" class="bg-blue-100 text-blue-800" />
              </template>
            </Column>
            <Column header="Monthly Cost" class="w-32">
              <template #body="{ data }">
                <span class="font-semibold text-green-600">${{ formatCurrency(data.cost || 0) }}</span>
              </template>
            </Column>
            <Column header="Actions" class="w-32">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button 
                    icon="pi pi-eye" 
                    @click="viewLocationDetails(data)"
                    text
                    size="small"
                    v-tooltip="'View Details'"
                  />
                  <Button 
                    icon="pi pi-microchip" 
                    @click="showLocationAssets(data.location)"
                    text
                    size="small"
                    severity="info"
                    v-tooltip="'View assets for this location'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Location Details Dialog -->
    <Dialog 
      v-model:visible="showLocationDialog" 
      :header="locationDialogTitle"
      :style="{ width: '80vw', maxWidth: '1200px' }"
      maximizable
    >
      <LocationDetailsPanel 
        v-if="selectedLocationForDialog"
        :location="selectedLocationForDialog"
        :customer-id="customerId"
        @asset-click="onAssetClick"
      />
    </Dialog>

    <!-- Asset Details Drawer -->
    <Drawer 
      v-model:visible="showAssetDrawer" 
      :header="assetDrawerTitle"
      position="right"
      :style="{ width: '800px' }"
      :modal="true"
      class="asset-drawer"
    >
      <AssetDetailsPanel 
        v-if="selectedAssetType && selectedLocation"
        :location-id="selectedLocation.locationId"
        :asset-type="selectedAssetType"
        :customer-id="customerId"
      />
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import AssetDetailsPanel from './AssetDetailsPanel.vue';
import LocationDetailsPanel from './LocationDetailsPanel.vue';

const props = defineProps({
  profile: Object,
  customerId: Number,
  auditData: Object
});

const showLocations = ref(false);
const selectedLocation = ref(null);
const selectedLocationForDialog = ref(null);
const showAssetDrawer = ref(false);
const showLocationDialog = ref(false);
const selectedAssetType = ref(null);

const locationObjects = computed(() => {
  if (!props.profile?.locations) return [];
  return props.profile.locations.map(locationName => {
    // Find matching asset variation for this location to get device count
    const matchingVariation = props.profile.assetVariations?.find(variation => 
      variation.locations?.includes(locationName)
    );
    
    return {
      location: locationName,
      locationId: extractLocationId(locationName),
      deviceCount: getTotalDeviceCount(matchingVariation?.assetBreakdown),
      cost: calculateLocationCost(locationName)
    };
  });
});

const assetDrawerTitle = computed(() => {
  if (!selectedAssetType.value || !selectedLocation.value) return '';
  return `${getAssetTypeName(selectedAssetType.value)} - ${selectedLocation.value.location || selectedLocation.value}`;
});

const locationDialogTitle = computed(() => {
  if (!selectedLocationForDialog.value) return '';
  return `Location Details - ${selectedLocationForDialog.value.location || selectedLocationForDialog.value}`;
});

const toggleLocations = () => {
  showLocations.value = !showLocations.value;
};

const viewLocationDetails = (location) => {
  selectedLocationForDialog.value = location;
  showLocationDialog.value = true;
};

const showLocationAssets = (locationName) => {
  // This would show a summary of all assets for this location
  selectedLocation.value = {
    location: locationName,
    locationId: extractLocationId(locationName)
  };
  selectedAssetType.value = 'ALL_SIMS'; // Start with a common asset type
  showAssetDrawer.value = true;
};

const showAssetDetails = (locationName) => {
  selectedLocation.value = {
    location: locationName,
    locationId: extractLocationId(locationName)
  };
  selectedAssetType.value = 'ALL_SIMS'; // Default asset type
  showAssetDrawer.value = true;
};

const onAssetClick = (assetType, location) => {
  selectedAssetType.value = assetType;
  selectedLocation.value = location;
  showLocationDialog.value = false;
  showAssetDrawer.value = true;
};

const extractLocationId = (locationName) => {
  // Try to find in the audit data
  if (props.auditData?.location_details) {
    const locationDetail = props.auditData.location_details.find(loc => 
      loc.location_name === locationName
    );
    if (locationDetail) {
      return locationDetail.location_id;
    }
  }
  
  // Fallback: extract site number and hope it matches
  const siteMatch = locationName.match(/CTR_(\d+)_/);
  if (siteMatch) {
    return parseInt(siteMatch[1]);
  }
  
  console.warn(`Location mapping not found for: ${locationName}. Using location name as fallback.`);
  return locationName;
};

const calculateLocationCost = (locationName) => {
  // Try to find the actual cost from audit data
  if (props.auditData?.location_details) {
    const locationDetail = props.auditData.location_details.find(loc => 
      loc.location_name === locationName
    );
    if (locationDetail) {
      return locationDetail.total_monthly_cost || 0;
    }
  }
  
  // Fallback to profile average
  return (props.profile.totalCost?.min || 0) / (props.profile.locationCount || 1);
};

const getTotalDeviceCount = (assetBreakdown) => {
  if (!assetBreakdown) return 0;
  return Object.values(assetBreakdown).reduce((sum, count) => sum + count, 0);
};

const getAssetSignature = (locationName) => {
  // Find the asset signature for this location from the profile's asset variations
  const matchingVariation = props.profile.assetVariations?.find(variation => 
    variation.locations?.includes(locationName)
  );
  return matchingVariation?.signature || 'Unknown';
};

const getServiceName = (service) => {
  const names = {
    'TA': 'TEM Account',
    'TEM': 'TEM Account',
    'TP': 'TelePoint',
    'VZ': 'Verizon',
    'LD': 'Location Data',
    'MD': 'Meraki Device',
    'CP': 'Cradlepoint'
  };
  return names[service] || service;
};

const getServiceStyle = (service) => {
  const styles = {
    'TA': 'bg-green-100 text-green-800',
    'TEM': 'bg-green-100 text-green-800',
    'TP': 'bg-blue-100 text-blue-800',
    'VZ': 'bg-red-100 text-red-800',
    'LD': 'bg-yellow-100 text-yellow-800',
    'MD': 'bg-purple-100 text-purple-800',
    'CP': 'bg-orange-100 text-orange-800'
  };
  return styles[service] || 'bg-gray-100 text-gray-800';
};

const getAssetTypeName = (type) => {
  const names = {
    'CP': 'Cradlepoint Devices',
    'MD': 'Meraki Devices',
    'MN': 'Meraki Networks',
    'MU': 'Meraki Uplinks',
    'OR': 'Orion Nodes',
    'SIM_BELL1GB': 'Bell SIM Cards',
    'SIM_TEL1GB': 'Telus SIM Cards',
    'SIM_ATT5GB': 'AT&T SIM Cards',
    'TEM': 'TEM Accounts',
    'VZ': 'Verizon Devices',
    'ALL_SIMS': 'All SIM Cards',
    'CHOICE': 'ChoiceIOT SIMs'
  };
  return names[type] || type;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
</script>

<style scoped>
.service-card {
  transition: all 0.2s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  border-color: #3b82f6;
}

.locations-list {
  max-height: 500px;
  overflow-y: auto;
}

/* Asset Drawer Full Height Styling */
:deep(.asset-drawer .p-drawer-content) {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.asset-drawer .p-drawer-content > div) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
