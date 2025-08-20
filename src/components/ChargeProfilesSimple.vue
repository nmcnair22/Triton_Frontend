<template>
  <div>
    <!-- Profile Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="profile in profiles" :key="profile.signature" class="hover:shadow-lg">
        <template #title>
          <div class="text-sm font-mono">{{ profile.signature }}</div>
        </template>
        <template #content>
          <!-- Charge Breakdown -->
          <div class="mb-3">
            <div class="text-sm text-gray-600 mb-1">Charges:</div>
            <div class="space-y-1">
              <div v-for="(amount, charge) in profile.charges" :key="charge" class="text-sm">
                {{ charge }}: ${{ amount }}
              </div>
            </div>
          </div>
          
          <!-- Locations -->
          <div class="mb-3">
            <div class="text-sm text-gray-600">{{ profile.locations.length }} Locations</div>
          </div>

          <!-- Cost Range -->
          <div>
            <div class="text-sm text-gray-600">Monthly Cost:</div>
            <div class="font-bold">${{ profile.totalCost.min }} - ${{ profile.totalCost.max }}</div>
          </div>
        </template>
        <template #footer>
          <Button 
            label="View Locations" 
            size="small"
            @click="showLocations(profile)"
          />
        </template>
      </Card>
    </div>

    <!-- Locations Dialog -->
    <Dialog v-model:visible="showDialog" :header="selectedProfile?.signature" :style="{width: '50vw'}">
      <DataTable :value="locationObjects">
        <Column field="location" header="Location" />
      </DataTable>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps(['profiles']);
const showDialog = ref(false);
const selectedProfile = ref(null);

const locationObjects = computed(() => {
  if (!selectedProfile.value?.locations) return [];
  return selectedProfile.value.locations.map(location => ({
    location: location
  }));
});

const showLocations = (profile) => {
  selectedProfile.value = profile;
  showDialog.value = true;
};
</script>
