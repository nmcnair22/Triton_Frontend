<template>
  <div class="charge-profile-comparison">
    <!-- Profile Selection Table -->
    <Card class="mb-6">
      <template #content>
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-semibold">Charge Profile Selection</h4>
          <Button 
            :label="showProfileTable ? 'Hide Profiles' : 'Show Profiles'" 
            :icon="showProfileTable ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            @click="toggleProfileTable"
            text
          />
        </div>
        
        <div v-if="showProfileTable" class="profile-selection">
          <DataTable 
            :value="profiles" 
            selectionMode="single" 
            v-model:selection="selectedProfile" 
            @row-select="onProfileSelect"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            sortField="signature"
            :sortOrder="1"
          >
            <Column field="signature" header="Charge Signature" sortable>
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.signature }}</span>
              </template>
            </Column>
            <Column field="locationCount" header="Sites" sortable>
              <template #body="{ data }">
                <Badge :value="data.locationCount" class="bg-blue-100 text-blue-800" />
              </template>
            </Column>
            <Column header="Service Breakdown">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-1">
                  <Badge 
                    v-for="(count, service) in data.serviceBreakdown" 
                    :key="service"
                    :value="`${service}:${count}`"
                    :class="getServiceStyle(service)"
                  />
                </div>
              </template>
            </Column>
            <Column header="Asset Variations">
              <template #body="{ data }">
                <div class="text-xs max-w-48">
                  <div v-for="(variation, index) in data.assetVariations?.slice(0, 2)" :key="index" class="mb-1">
                    <span class="font-mono text-purple-600">{{ variation.signature }}</span>
                    <span class="text-gray-500 ml-1">({{ variation.locations?.length }} sites)</span>
                  </div>
                  <div v-if="data.assetVariations?.length > 2" class="text-gray-500">
                    +{{ data.assetVariations.length - 2 }} more variations...
                  </div>
                </div>
              </template>
            </Column>
            <Column field="totalCost.min" header="Monthly Cost" sortable>
              <template #body="{ data }">
                <span class="font-semibold text-green-600">${{ formatCurrency(data.totalCost?.min || 0) }}</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Selected Profile Details -->
    <div v-if="selectedProfileForDetails">
      <ChargeProfileDetailView 
        :profile="selectedProfileForDetails" 
        :customer-id="customerId"
        :audit-data="auditData"
      />
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center text-gray-500 py-12">
      <i class="pi pi-info-circle text-4xl mb-4 text-gray-400"></i>
      <p class="text-lg mb-2">Select a Charge Profile</p>
      <p class="text-sm">Choose a profile from the table above to view detailed breakdown and locations</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ChargeProfileDetailView from './ChargeProfileDetailView.vue';

const props = defineProps({
  profiles: Array,
  customerId: Number,
  auditData: Object
});

const showProfileTable = ref(true);
const selectedProfile = ref(null);
const selectedProfileForDetails = ref(null);

const toggleProfileTable = () => {
  showProfileTable.value = !showProfileTable.value;
};

const onProfileSelect = (event) => {
  selectedProfileForDetails.value = event.data;
};

const getServiceStyle = (service) => {
  const styles = {
    'TA': 'bg-green-100 text-green-800',
    'TEM': 'bg-green-100 text-green-800',
    'TP': 'bg-blue-100 text-blue-800',
    'VZ': 'bg-red-100 text-red-800',
    'LD': 'bg-yellow-100 text-yellow-800',
    'MD': 'bg-purple-100 text-purple-800',
    'CP': 'bg-orange-100 text-orange-800',
    'TEL5GB': 'bg-cyan-100 text-cyan-800',
    'BELL1GB': 'bg-pink-100 text-pink-800'
  };
  return styles[service] || 'bg-gray-100 text-gray-800';
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
.profile-selection {
  overflow-x: auto;
}
</style>
