<template>
  <div class="charge-profiles-view">
    <!-- Header Section -->
    <Card class="mb-6">
      <template #content>
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-bold mb-2">Location Charge Profiles</h3>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span><i class="pi pi-map-marker mr-1"></i>Total Locations: {{ totalLocations }}</span>
              <span><i class="pi pi-dollar mr-1"></i>Total MRR: ${{ formatCurrency(totalMRR) }}</span>
              <span><i class="pi pi-chart-line mr-1"></i>Average MRR: ${{ formatCurrency(averageMRR) }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <Badge :value="`${profiles.length} Profiles`" class="bg-blue-100 text-blue-800" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Charge Profile Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card 
        v-for="profile in profiles" 
        :key="profile.signature" 
        class="hover:shadow-lg transition-shadow"
      >
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex justify-between items-start">
              <div>
                <i class="pi pi-map-marker text-gray-500 mr-2"></i>
                <span class="font-bold text-lg">{{ getLocationName(profile) }}</span>
              </div>
              <Badge value="Active" severity="success" />
            </div>
            <div class="text-sm text-gray-600 mt-1">
              Profile: {{ profile.signature }}
            </div>
          </div>
        </template>
        
        <template #content>
          <!-- Key Metrics -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ getTotalDevices(profile) }}</div>
              <div class="text-xs text-gray-600">Devices</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ getTotalServices(profile) }}</div>
              <div class="text-xs text-gray-600">Services</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">${{ formatCurrency(profile.totalCost?.min || 0) }}</div>
              <div class="text-xs text-gray-600">Monthly</div>
            </div>
          </div>

                      <!-- Monthly Recurring Revenue -->
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div class="flex items-center">
                <i class="pi pi-chart-line text-green-500 mr-2"></i>
                <span class="text-sm font-medium">Monthly Recurring Revenue</span>
              </div>
              <span class="font-bold text-green-600">${{ formatCurrency(profile.totalCost?.min || 0) }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-4">
              <Button 
                label="Billing Details" 
                icon="pi pi-dollar" 
                size="small"
                text
                severity="success"
                @click="showBillingDetails(profile)"
                v-tooltip="'View monthly billing breakdown'"
              />
            </div>
        </template>
      </Card>
    </div>

    <!-- Selected Profile Detail -->
    <Card v-if="selectedProfile" class="mb-6">
      <template #header>
        <div class="p-4 pb-0">
          <div class="flex justify-between items-center">
            <h4 class="text-lg font-bold">Managed Services Portfolio</h4>
            <div class="flex gap-2">
              <Badge value="Active Portfolio" severity="success" />
              <Button 
                icon="pi pi-times" 
                text 
                rounded 
                @click="selectedProfile = null"
              />
            </div>
          </div>
          <div class="text-sm text-gray-600 mt-1">
            Total Services: {{ getTotalServices(selectedProfile) }} | Average Rate: ${{ formatCurrency(getAverageRate(selectedProfile)) }}
          </div>
        </div>
      </template>

      <template #content>
        <!-- Service Category Tabs -->
        <Tabs value="0" class="service-tabs">
          <TabList>
            <Tab value="0">All Services</Tab>
            <Tab value="1">Monitoring</Tab>
            <Tab value="2">Management</Tab>
            <Tab value="3">Support</Tab>
            <Tab value="4">Maintenance</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div 
                  v-for="service in getAllServices(selectedProfile)" 
                  :key="service.name"
                  class="service-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center">
                      <i :class="service.icon" class="mr-2"></i>
                      <span class="font-medium">{{ service.name }}</span>
                    </div>
                    <Badge :value="service.tier" :severity="service.severity" />
                  </div>
                  <div class="text-right">
                    <span class="text-lg font-bold text-green-600">${{ service.price }}</span>
                  </div>
                </div>
              </div>
            </TabPanel>
            
            <TabPanel value="1">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="service in getServicesByCategory(selectedProfile, 'monitoring')" 
                  :key="service.name"
                  class="service-card border rounded-lg p-4"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <i class="pi pi-eye text-blue-500 mr-2"></i>
                      <span class="font-medium">{{ service.name }}</span>
                    </div>
                    <div class="text-right">
                      <Badge :value="service.tier" severity="info" />
                      <div class="text-lg font-bold text-blue-600">${{ service.price }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="2">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="service in getServicesByCategory(selectedProfile, 'management')" 
                  :key="service.name"
                  class="service-card border rounded-lg p-4"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <i class="pi pi-cog text-green-500 mr-2"></i>
                      <span class="font-medium">{{ service.name }}</span>
                    </div>
                    <div class="text-right">
                      <Badge :value="service.tier" severity="success" />
                      <div class="text-lg font-bold text-green-600">${{ service.price }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="service in getServicesByCategory(selectedProfile, 'support')" 
                  :key="service.name"
                  class="service-card border rounded-lg p-4"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <i class="pi pi-users text-orange-500 mr-2"></i>
                      <span class="font-medium">{{ service.name }}</span>
                    </div>
                    <div class="text-right">
                      <Badge :value="service.tier" severity="warning" />
                      <div class="text-lg font-bold text-orange-600">${{ service.price }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="service in getServicesByCategory(selectedProfile, 'maintenance')" 
                  :key="service.name"
                  class="service-card border rounded-lg p-4"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <i class="pi pi-wrench text-purple-500 mr-2"></i>
                      <span class="font-medium">{{ service.name }}</span>
                    </div>
                    <div class="text-right">
                      <Badge :value="service.tier" severity="info" />
                      <div class="text-lg font-bold text-purple-600">${{ service.price }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <!-- Monthly Recurring Revenue Summary -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center mb-3">
            <i class="pi pi-chart-line text-green-500 mr-2"></i>
            <h5 class="font-bold">Monthly Recurring Revenue Summary</h5>
            <Badge :value="`$${formatCurrency(getTotalMRR(selectedProfile))} MRR`" severity="success" class="ml-auto" />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div 
              v-for="category in getRevenueSummary(selectedProfile)" 
              :key="category.name"
              class="text-center p-3 bg-white rounded border"
            >
              <div class="font-bold text-lg">${{ category.amount }}</div>
              <div class="text-sm text-gray-600">{{ category.name }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ category.description }}</div>
            </div>
          </div>
        </div>
      </template>
    </Card>

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
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import BillingDetailsModal from './billing/BillingDetailsModal.vue';

const props = defineProps({
  profiles: {
    type: Array,
    default: () => []
  },
  auditData: {
    type: Object,
    default: () => ({})
  }
});

const selectedProfile = ref(null);
const showBillingModal = ref(false);
const selectedLocationForBilling = ref(null);

// Computed properties for summary stats
const totalLocations = computed(() => {
  return props.profiles?.reduce((sum, profile) => sum + (profile.locationCount || 0), 0) || 0;
});

const totalMRR = computed(() => {
  return props.profiles?.reduce((sum, profile) => sum + (profile.totalCost?.min || 0), 0) || 0;
});

const averageMRR = computed(() => {
  return totalLocations.value > 0 ? totalMRR.value / totalLocations.value : 0;
});

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const getLocationName = (profile) => {
  // Extract a readable location name from the profile
  if (profile.locations?.length > 0) {
    const location = profile.locations[0];
    // Convert "CTR_3008_OAKVILLE_ON" to "Store #001 - Oakville, ON"
    const parts = location.split('_');
    if (parts.length >= 3) {
      const storeNum = parts[1];
      const city = parts[2];
      const province = parts[3] || '';
      return `Store #${storeNum} - ${city}${province ? ', ' + province : ''}`;
    }
  }
  return profile.signature || 'Unknown Location';
};

const getTotalDevices = (profile) => {
  if (!profile.assetBreakdown) return 0;
  return Object.values(profile.assetBreakdown).reduce((sum, count) => sum + count, 0);
};

const getTotalServices = (profile) => {
  // Mock service count based on charge variations
  return profile.chargeVariations?.length || 3;
};

const getAverageRate = (profile) => {
  const services = getTotalServices(profile);
  return services > 0 ? (profile.totalCost?.min || 0) / services : 0;
};

const getTotalMRR = (profile) => {
  return profile.totalCost?.min || 0;
};

const selectProfile = (profile) => {
  selectedProfile.value = profile;
};

const refreshCalculations = () => {
  // Trigger recalculation
  console.log('Refreshing charge profile calculations...');
};

const showBillingDetails = (profile) => {
  // For charge profiles, we need to pick the first location
  // In a real scenario, you might want to show a location picker
  const firstLocation = profile.locations?.[0];
  if (firstLocation) {
    selectedLocationForBilling.value = {
      location: firstLocation,
      locationId: extractLocationId(firstLocation)
    };
    showBillingModal.value = true;
  }
};

// Helper function to extract location ID (reused from AssetProfileDetailView)
const extractLocationId = (locationName) => {
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

// Service categorization functions
const getAllServices = (profile) => {
  return [
    { name: 'Basic Monitoring', tier: 'BASIC', price: '15', icon: 'pi pi-eye', severity: 'info', category: 'monitoring' },
    { name: 'Advanced Monitoring', tier: 'PREMIUM', price: '25', icon: 'pi pi-eye', severity: 'warning', category: 'monitoring' },
    { name: 'Configuration Management', tier: 'STANDARD', price: '35', icon: 'pi pi-cog', severity: 'success', category: 'management' },
    { name: 'Level 1 Support', tier: 'BASIC', price: '150', icon: 'pi pi-users', severity: 'info', category: 'support' },
    { name: 'Level 2 Support', tier: 'PREMIUM', price: '300', icon: 'pi pi-users', severity: 'warning', category: 'support' },
    { name: 'Preventive Maintenance', tier: 'STANDARD', price: '45', icon: 'pi pi-wrench', severity: 'info', category: 'maintenance' },
    { name: 'Bandwidth Management', tier: 'STANDARD', price: '2.5', icon: 'pi pi-chart-line', severity: 'success', category: 'management' }
  ];
};

const getServicesByCategory = (profile, category) => {
  return getAllServices(profile).filter(service => service.category === category);
};

const getRevenueSummary = (profile) => {
  return [
    { 
      name: 'Advanced Monitoring', 
      amount: '100', 
      description: '2x MX84, 1x MS220-24, 1x IBR1700' 
    },
    { 
      name: 'Configuration Management', 
      amount: '257', 
      description: '2x MX84, 3x MX68, 1x MS220-24, 4x MR46' 
    },
    { 
      name: 'Basic Monitoring', 
      amount: '303', 
      description: '3x MX68, 1x MX64, 4x MR46, 3x MR36, 1x MR33, 3x Node-A, 2x Node-B, 2x Node-C, 1x Primary Account, 1x 1GB Plan' 
    }
  ];
};
</script>

<style scoped>
.charge-profiles-view {
  @apply space-y-6;
}

.service-card {
  @apply transition-all duration-200;
}

.service-card:hover {
  @apply shadow-md transform scale-105;
}

.audit-tabs :deep(.p-tabview-nav) {
  @apply border-b border-gray-200;
}

.service-tabs :deep(.p-tabpanels) {
  @apply pt-4;
}
</style>
