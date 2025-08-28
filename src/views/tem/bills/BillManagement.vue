<template>
  <div class="tem-bill-management">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Bill Management</h1>
      <p class="text-gray-600 mt-1">Advanced search, queue management, and workflow processing</p>
    </div>

    <!-- Queue Tabs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card class="cursor-pointer hover:shadow-lg transition-shadow">
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">0</div>
            <div class="text-sm text-gray-600">All Bills</div>
          </div>
        </template>
      </Card>
      
      <Card class="cursor-pointer hover:shadow-lg transition-shadow">
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">0</div>
            <div class="text-sm text-gray-600">Pending Review</div>
          </div>
        </template>
      </Card>
      
      <Card class="cursor-pointer hover:shadow-lg transition-shadow">
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">0</div>
            <div class="text-sm text-gray-600">Overdue</div>
          </div>
        </template>
      </Card>
      
      <Card class="cursor-pointer hover:shadow-lg transition-shadow">
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">0</div>
            <div class="text-sm text-gray-600">High Variance</div>
          </div>
        </template>
      </Card>
      
      <Card class="cursor-pointer hover:shadow-lg transition-shadow">
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-600">0</div>
            <div class="text-sm text-gray-600">Denied</div>
          </div>
        </template>
      </Card>
    </div>

    <Card>
      <template #content>
        <div class="text-center py-16">
          <i class="pi pi-file-text text-6xl text-orange-500 mb-4"></i>
          <h2 class="text-2xl font-semibold mb-2">Bill Queue Management</h2>
          <p class="text-gray-600 mb-6">Split-pane layout with advanced search, queue tabs, and bill detail drawer coming soon</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
            <div class="bg-blue-50 p-6 rounded-lg">
              <i class="pi pi-search text-blue-500 text-3xl mb-3"></i>
              <h3 class="font-semibold mb-2">Advanced Search</h3>
              <ul class="text-sm text-gray-600 text-left">
                <li>• Invoice number search</li>
                <li>• Date range filtering</li>
                <li>• Amount range slider</li>
                <li>• Multi-select status filters</li>
              </ul>
            </div>
            <div class="bg-green-50 p-6 rounded-lg">
              <i class="pi pi-list text-green-500 text-3xl mb-3"></i>
              <h3 class="font-semibold mb-2">Queue Management</h3>
              <ul class="text-sm text-gray-600 text-left">
                <li>• Queue-based workflow</li>
                <li>• Status change tracking</li>
                <li>• Bulk operations</li>
                <li>• Kanban board option</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
</script>

<style scoped>
.tem-bill-management {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}
</style>