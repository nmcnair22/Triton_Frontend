<template>
  <div class="asset-profile-detail-view">
    <!-- Profile Header -->
    <Card class="mb-6">
      <template #content>
        <div class="profile-header">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold mb-2">{{ profile.signature }}</h3>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <span><i class="pi pi-map-marker mr-1"></i>{{ profile.locationCount }} Locations</span>
                <span><i class="pi pi-dollar mr-1"></i>${{ formatCurrency(profile.totalCost.min) }}</span>
                <span v-if="profile.chargeVariations?.length > 1">
                  <i class="pi pi-exclamation-triangle mr-1 text-orange-500"></i>
                  {{ profile.chargeVariations.length }} Billing Variations
                </span>
              </div>
            </div>
          </div>

          <!-- Asset Breakdown Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div 
              v-for="(count, type) in profile.assetBreakdown" 
              :key="type"
              class="asset-card cursor-pointer border rounded-lg p-4 hover:shadow-md transition-shadow"
              @click="showAssetDetails(type, count)"
            >
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ count }}</div>
                <div class="text-xs font-medium text-gray-600 mt-1">{{ getAssetTypeName(type) }}</div>
                <Badge :value="type" :class="getAssetTypeStyle(type)" class="mt-2" />
              </div>
            </div>
          </div>

          <!-- Charge Variations Summary - Removed as requested -->
        </div>
      </template>
    </Card>

    <!-- Expandable Locations List -->
    <Card>
      <template #content>
        <div class="locations-section">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-lg font-semibold">Locations ({{ profile.locationCount }})</h4>
            <Button 
              :label="showLocations ? 'Hide Locations' : 'Show Locations'"
              :icon="showLocations ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              @click="toggleLocations"
              outlined
              size="small"
            />
          </div>

          <div v-if="showLocations" class="locations-list">
            <DataTable 
              :value="locationObjects" 
              selectionMode="single" 
              v-model:selection="selectedLocation"
              @row-select="onLocationSelect"
              paginator 
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
              <Column field="chargeSignature" header="Charge Signature" sortable>
                <template #body="{ data }">
                  <Button
                    :label="getChargeSignature(data.location)"
                    class="p-button-link p-button-sm font-mono text-blue-600 hover:text-blue-800"
                    @click="showBillingDetails(data.location)"
                    v-tooltip="'Click to view billing details'"
                  />
                </template>
              </Column>
              <Column header="Assets" class="w-32">
                <template #body="{ data }">
                  <Badge :value="data.assetCount || 'N/A'" class="bg-blue-100 text-blue-800" />
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
                      icon="pi pi-dollar" 
                      @click="showLocationBilling(data.location)"
                      text
                      size="small"
                      severity="success"
                      v-tooltip="'View billing details'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </Card>

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

    <!-- Billing Details Modal -->
    <BillingDetailsModal
      v-model:visible="showBillingModal"
      :location-id="selectedLocationForBilling?.locationId || null"
      :location-name="selectedLocationForBilling?.location || 'Unknown Location'"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import AssetDetailsPanel from './AssetDetailsPanel.vue';
import LocationDetailsPanel from './LocationDetailsPanel.vue';
import BillingDetailsModal from './billing/BillingDetailsModal.vue';

const props = defineProps({
  profile: Object,
  customerId: Number
});

const showLocations = ref(false);
const selectedLocation = ref(null);
const selectedLocationForDialog = ref(null);
const selectedLocationForBilling = ref(null);
const showAssetDrawer = ref(false);
const showLocationDialog = ref(false);
const showBillingModal = ref(false);
const selectedAssetType = ref(null);

const locationObjects = computed(() => {
  if (!props.profile?.locations) return [];
  return props.profile.locations.map(location => {
    // Find matching charge variation for this location to get cost
    const matchingVariation = props.profile.chargeVariations?.find(variation => 
      variation.locations?.includes(location)
    );
    
    return {
      location: location,
      locationId: extractLocationId(location),
      assetCount: getTotalAssetCount(props.profile.assetBreakdown),
      cost: matchingVariation?.cost?.min || 0
    };
  });
});

const assetDrawerTitle = computed(() => {
  if (!selectedAssetType.value || !selectedLocation.value) return '';
  return `${getAssetTypeName(selectedAssetType.value)} - ${selectedLocation.value.location}`;
});

const locationDialogTitle = computed(() => {
  if (!selectedLocationForDialog.value) return '';
  return `Location Details - ${selectedLocationForDialog.value.location}`;
});

const toggleLocations = () => {
  showLocations.value = !showLocations.value;
};

const onLocationSelect = (event) => {
  selectedLocation.value = event.data;
};

const showAssetDetails = (assetType, count) => {
  if (!selectedLocation.value) {
    // Show message to select a location first
    alert('Please select a location from the locations list first, then click on an asset type to view details.');
    return;
  }
  
  // Convert SIM signature components to correct backend asset types
  let correctedAssetType = assetType;
  if (assetType.startsWith('SIM_')) {
    // Convert SIM_BELL1GB, SIM_TEL1GB, etc. to ALL_SIMS for comprehensive data
    correctedAssetType = 'ALL_SIMS';
  }
  
  selectedAssetType.value = correctedAssetType;
  showAssetDrawer.value = true;
};

const viewLocationDetails = (location) => {
  selectedLocationForDialog.value = location;
  showLocationDialog.value = true;
};

const onAssetClick = (assetType, location) => {
  // Convert SIM signature components to correct backend asset types
  let correctedAssetType = assetType;
  if (assetType.startsWith('SIM_')) {
    // Convert SIM_BELL1GB, SIM_TEL1GB, etc. to ALL_SIMS for comprehensive data
    correctedAssetType = 'ALL_SIMS';
  }
  
  selectedAssetType.value = correctedAssetType;
  selectedLocation.value = location;
  showLocationDialog.value = false;
  showAssetDrawer.value = true;
};

const extractLocationId = (locationName) => {
  // Based on your data, location names are like "CTR_3651_Drummondville_QC"
  // and the location_id in the API response corresponds to these
  // We'll need to map these properly - for now using a lookup approach
  
  // This is a simplified mapping - in a real app you'd want to:
  // 1. Fetch location details from the audit data
  // 2. Create a proper mapping from location names to IDs
  // 3. Or modify the backend to include location IDs in the profile response
  
  const locationMappings = {
    'CTR_3636_Toronto_ON': 22990, // Adding the missing Toronto location
    'CTR_3651_Drummondville_QC': 22991,
    'CTR_3647_Québec_QC': 23083,
    'CTR_3643_Lindsay_ON': 23084,
    'CTR_3006_STRATFORD_ON': 23667,
    'CTR_3424_EDMONTON_AB': 23668,
    'CTR_3436_BELLEVILLE_ON': 23669,
    'CTR_3480_VAUDREUIL-DORION_QC': 23670,
    'CTR_3609_Victoriaville_QC': 23671,
    'CTR_3002_WINDSOR_ON': 23672,
    'CTR_3003_ORILLIA_ON': 23673,
    'CTR_3004_LONDON_ON': 23674,
    'CTR_3007_MISSISSAUGA_ON': 23675,
    'CTR_3008_OAKVILLE_ON': 23676,
    'CTR_3009_SCARBOROUGH_ON': 23677,
    'CTR_3011_Owen Sound_ON': 23678,
    'CTR_3012_BRAMPTON_ON': 23679,
    'CTR_3017_OAKVILLE_ON': 23680,
    'CTR_3018_ST. CATHARINES_ON': 23681,
    'CTR_3019_BARRIE_ON': 23682,
    'CTR_3021_LONDON_ON': 23683,
    'CTR_3024_WOODSTOCK_ON': 23684,
    'CTR_3347_Brantford_ON': 23685,
    'CTR_3026_MILTON_ON': 23686,
    'CTR_3027_BURLINGTON_ON': 23687,
    'CTR_3029_HANNON _ON': 23688,
    'CTR_3031_KINGSTON_ON': 23689,
    'CTR_3032_ORLEANS_ON': 23690,
    'CTR_3033_SARNIA_ON': 23691,
    'CTR_3034_KITCHENER_ON': 23692,
    'CTR_3035_CORNWALL_ON': 23693,
    'CTR_3036_ORANGEVILLE_ON': 23694,
    'CTR_3037_PETERBOROUGH_ON': 23695,
    'CTR_3038_TIMMINS_ON': 23696,
    'CTR_3039_WHITBY_ON': 23697,
    'CTR_3308_GUELPH_ON': 23698,
    'CTR_3315_Cambridge_ON': 23699,
    'CTR_3316_WOODBRIDGE_ON': 23700,
    'CTR_3320_WATERLOO_ON': 23701,
    'CTR_3323_EAST GWILLIMBURY_ON': 23702,
    'CTR_3330_WELLAND_ON': 23703,
    'CTR_3389_BURNABY_BC': 23704,
    'CTR_3401_LASALLE_ON': 23705,
    'CTR_3402_MISSISSAUGA_ON': 23706,
    'CTR_3403_OTTAWA_ON': 23707,
    'CTR_3404_OSHAWA_ON': 23708,
    'CTR_3405_RICHMOND HILL_ON': 23709,
    'CTR_3406_ANCASTER_ON': 23710,
    'CTR_3407_NIAGARA FALLS_ON': 23711,
    'CTR_3409_KINGSTON_ON': 23712
  };
  
  const locationId = locationMappings[locationName];
  if (!locationId) {
    console.warn(`Location mapping not found for: ${locationName}. Using location name as fallback.`);
    return locationName;
  }
  return locationId;
};

const getTotalAssetCount = (assetBreakdown) => {
  if (!assetBreakdown) return 0;
  return Object.values(assetBreakdown).reduce((sum, count) => sum + count, 0);
};

// Billing details functions
const getChargeSignature = (locationName) => {
  // Find the charge signature for this location from the profile's charge variations
  const matchingVariation = props.profile.chargeVariations?.find(variation => 
    variation.locations?.includes(locationName)
  );
  return matchingVariation?.signature || 'Unknown';
};

const showBillingDetails = (locationName) => {
  selectedLocationForBilling.value = {
    location: locationName,
    locationId: extractLocationId(locationName)
  };
  showBillingModal.value = true;
};

const showLocationBilling = (locationName) => {
  selectedLocationForBilling.value = {
    location: locationName,
    locationId: extractLocationId(locationName)
  };
  showBillingModal.value = true;
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
  }).format(value || 0);
};
</script>

<style scoped>
.asset-card {
  transition: all 0.2s ease;
}

.asset-card:hover {
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
