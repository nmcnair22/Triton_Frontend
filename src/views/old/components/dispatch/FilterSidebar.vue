<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:collapsed', 'reset', 'apply']);

// Computed property for sidebar class
const sidebarClass = computed(() => {
  return props.collapsed ? 'w-20' : 'w-80';
});

// Methods
function toggleCollapse() {
  emit('update:collapsed', !props.collapsed);
}

function resetFilters() {
  emit('reset');
}

function applyFilters() {
  emit('apply');
}
</script>

<template>
  <div 
    :class="[
      sidebarClass, 
      'bg-white dark:bg-surface-900 rounded-lg shadow border border-gray-200 dark:border-surface-700',
      'transition-all duration-300 ease-in-out h-full'
    ]"
  >
    <div class="p-4 border-b border-gray-200 dark:border-surface-700 flex justify-between items-center">
      <h2 v-if="!collapsed" class="text-xl font-semibold">Filters</h2>
      <div class="flex items-center">
        <Button 
          :icon="collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" 
          @click="toggleCollapse"
          class="p-button-text p-button-rounded"
          aria-label="Toggle Sidebar"
        />
      </div>
    </div>
    
    <div v-if="!collapsed" class="p-4 overflow-y-auto" style="max-height: calc(100vh - 200px);">
      <!-- Filter content provided via slots -->
      <slot></slot>
      
      <!-- Filter actions -->
      <div class="flex gap-2 mt-6">
        <Button
          label="Reset"
          icon="pi pi-refresh"
          outlined
          class="w-full"
          @click="resetFilters"
          :loading="loading"
        />
        <Button
          label="Apply"
          icon="pi pi-check"
          class="w-full"
          @click="applyFilters"
          :loading="loading"
        />
      </div>
    </div>
    
    <!-- Collapsed view just shows icons -->
    <div v-else class="flex flex-col items-center p-2">
      <Button 
        icon="pi pi-filter"
        class="p-button-text p-button-rounded mb-2"
        aria-label="Filters"
      />
      <Button 
        icon="pi pi-refresh"
        class="p-button-text p-button-rounded mb-2"
        @click="resetFilters"
        aria-label="Reset Filters"
      />
      <Button 
        icon="pi pi-check"
        class="p-button-text p-button-rounded"
        @click="applyFilters"
        aria-label="Apply Filters"
      />
    </div>
  </div>
</template>

<style scoped>
.filter-sidebar {
  @apply bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full transition-all duration-300 ease-in-out flex flex-col;
}

.filter-sidebar__header {
  @apply flex items-center justify-between p-3;
}

.filter-sidebar__title {
  @apply text-lg font-semibold;
}

.filter-sidebar__toggle {
  @apply p-2;
}

.filter-sidebar__content {
  @apply flex flex-col overflow-hidden flex-1 opacity-100 transition-opacity duration-200;
}

.filter-sidebar__content--hidden {
  @apply opacity-0;
}

.filter-sidebar__body {
  @apply p-3 flex-1 overflow-y-auto;
}

.filter-sidebar__footer {
  @apply p-3 border-t border-gray-200 dark:border-gray-700;
}
</style> 