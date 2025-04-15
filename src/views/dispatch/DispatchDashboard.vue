<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

// Initialize toast for notifications
const toast = useToast();

// Placeholder data
const isLoading = ref(true);

onMounted(() => {
  // Simulating data loading
  setTimeout(() => {
    isLoading.value = false;
    toast.add({ severity: 'info', summary: 'Ready', detail: 'Dispatch Dashboard placeholder is ready for implementation', life: 3000 });
  }, 1000);
});
</script>

<template>
  <div class="p-4">
    <div class="card mb-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0">Dispatch Dashboard</h1>
      </div>
      
      <div v-if="isLoading" class="flex justify-center py-8">
        <i class="pi pi-spin pi-spinner text-4xl"></i>
      </div>
      <div v-else class="py-8 text-center">
        <i class="pi pi-truck text-6xl mb-4 text-primary"></i>
        <h2 class="text-xl font-medium text-surface-700 dark:text-surface-300">Dispatch Dashboard Placeholder</h2>
        <p class="mt-2 text-surface-600 dark:text-surface-400">This is a placeholder for the Dispatch Dashboard implementation.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-surface-0 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-lg shadow-sm;
}
</style> 