<template>
  <div class="locations-tab">
    <!-- Simple wrapper that embeds existing LocationsList unchanged -->
    <LocationsList />
  </div>
</template>

<script setup>
import LocationsList from '@/views/audit-workbench/LocationsList.vue';

// Props (for consistency with other tabs, but LocationsList handles customer ID from route)
defineProps({
  customerId: {
    type: [String, Number],
    required: true
  }
});

// Note: LocationsList already gets customerId from route.params.customerId
// so we don't need to pass it as a prop. This keeps the existing component unchanged.
</script>

<style scoped>
.locations-tab {
  /* No additional styling needed - LocationsList has its own responsive design */
}
</style>