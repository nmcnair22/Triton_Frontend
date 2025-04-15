<template>
  <div class="project-chart">
    <div v-if="loading" class="chart-skeleton">
      <div v-for="i in 3" :key="i" class="w-full mb-3">
        <Skeleton height="2rem" />
      </div>
    </div>
    
    <div v-else-if="!hasData" class="flex flex-column justify-content-center align-items-center" style="height: 200px;">
      <i class="pi pi-chart-bar text-5xl text-surface-300 mb-3"></i>
      <p class="m-0 text-surface-600 dark:text-surface-400">No project data available</p>
    </div>
    
    <div v-else class="project-list">
      <div 
        v-for="(project, index) in topProjects" 
        :key="getProjectName(project)" 
        class="project-item mb-3"
      >
        <div class="flex justify-content-between mb-1">
          <span class="font-medium text-surface-900 dark:text-surface-0">{{ getProjectName(project) }}</span>
          <span class="font-bold text-surface-900 dark:text-surface-0">{{ getProjectCount(project) }}</span>
        </div>
        <div class="progress-container bg-surface-200 dark:bg-surface-700">
          <div class="progress-bar bg-primary-500 dark:bg-primary-400" :style="{ width: getPercentage(project) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Skeleton from 'primevue/skeleton';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingKey: {
    type: String,
    default: 'projectData'
  },
  limit: {
    type: Number,
    default: 5
  }
});

const dispatchStore = useDispatchStore();

// Computed properties
const loading = computed(() => {
  return props.loading || dispatchStore.loading[props.loadingKey];
});

const projectData = computed(() => {
  return props.data && props.data.length > 0 
    ? props.data 
    : dispatchStore.projectDataForChart;
});

const hasData = computed(() => {
  return projectData.value && projectData.value.length > 0;
});

// Limit to top projects
const topProjects = computed(() => {
  if (!hasData.value) return [];
  
  return [...projectData.value]
    .sort((a, b) => (getProjectCount(b) - getProjectCount(a)))
    .slice(0, props.limit);
});

// Calculate maximum count for percentage calculation
const maxCount = computed(() => {
  if (!hasData.value) return 0;
  
  return Math.max(...projectData.value.map(project => getProjectCount(project)));
});

// Helper functions to extract project data safely from both formats
function getProjectName(project) {
  if (project.project_name) return truncateText(project.project_name, 25);
  if (project.name) return truncateText(project.name, 25);
  return 'Unknown Project';
}

function getProjectCount(project) {
  if (project.dispatch_count !== undefined) return project.dispatch_count;
  if (project.count !== undefined) return project.count;
  return 0;
}

function getPercentage(project) {
  if (!maxCount.value) return 0;
  
  const count = getProjectCount(project);
  return (count / maxCount.value) * 100;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
</script>

<style scoped>
.project-chart {
  height: 100%;
}

.chart-skeleton {
  min-height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.project-list {
  max-height: 100%;
  overflow-y: auto;
}

.project-item {
  margin-bottom: 1rem;
}

.progress-container {
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.5s ease;
}
</style> 