<template>
  <div class="tem-location-search">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold text-gray-900">TEM Locations</h1>
      <p class="text-gray-600 mt-1">Search and manage telecom locations</p>
    </div>

    <Card>
      <template #content>
        <div class="text-center py-16">
          <i class="pi pi-map-marker text-6xl text-blue-500 mb-4"></i>
          <h2 class="text-2xl font-semibold mb-2">Location Search & Management</h2>
          <p class="text-gray-600 mb-6">Advanced location search with grid, table, and map views coming soon</p>
          
          <div class="flex justify-center gap-4">
            <Button 
              label="Grid View" 
              icon="pi pi-th-large" 
              outlined 
              disabled
            />
            <Button 
              label="Table View" 
              icon="pi pi-table" 
              outlined 
              disabled
            />
            <Button 
              label="Map View" 
              icon="pi pi-map" 
              outlined 
              disabled
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
import Button from 'primevue/button';
</script>

<style scoped>
.tem-location-search {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}
</style>