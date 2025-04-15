<template>
  <div class="h-full">
    <div v-if="loading" class="flex flex-column gap-2 h-full justify-content-center">
      <Skeleton height="20rem" />
    </div>
    <div v-else-if="!projectData || projectData.length === 0" class="flex flex-column h-full justify-content-center align-items-center">
      <i class="pi pi-chart-bar text-5xl text-gray-300 mb-3"></i>
      <p class="m-0 text-gray-600">No project data available for this time period</p>
    </div>
    <div v-else class="project-list">
      <div 
        v-for="(project, index) in projectData" 
        :key="project.id || index" 
        class="project-item mb-3"
      >
        <div class="flex justify-content-between mb-1">
          <span class="font-medium">{{ truncateText(project.name, 25) }}</span>
          <span class="font-bold">{{ project.count }} dispatches</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar" :style="{ width: getPercentage(project.count) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  loadingKey: {
    type: String,
    default: 'dispatchesByProject'
  },
  limit: {
    type: Number,
    default: 5
  }
});

// Store
const dispatchStore = useDispatchStore();

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const projectData = computed(() => {
  const projects = dispatchStore.dispatchesByProject || [];
  return projects.slice(0, props.limit);
});

// Calculate maximum count for percentage calculation
const maxCount = computed(() => {
  if (!projectData.value.length) return 0;
  return Math.max(...projectData.value.map(project => project.count || 0));
});

// Helper functions
function getPercentage(value) {
  if (!maxCount.value) return 0;
  return (value / maxCount.value) * 100;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
</script>

<style scoped>
.project-list {
  height: 100%;
  overflow-y: auto;
}

.project-item {
  margin-bottom: 1rem;
}

.progress-container {
  height: 10px;
  background-color: var(--surface-200);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.5s ease;
}
</style> 