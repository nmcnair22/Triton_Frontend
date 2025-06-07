<template>
  <div class="issues-list">
    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
      <i class="pi pi-exclamation-triangle text-orange-600"></i>
      Issues
      <Badge v-if="issues.length" :value="issues.length" severity="danger" />
    </h3>
    
    <div v-if="issues.length > 0" class="space-y-3">
      <div 
        v-for="issue in issues" 
        :key="issue.id"
        class="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg"
      >
        <div class="flex items-start justify-between mb-2">
          <Badge 
            :value="issue.category" 
            :severity="getCategorySeverity(issue.category)"
            class="text-xs"
          />
          <span class="text-xs text-surface-500">
            {{ formatDate(issue.created_at) }}
          </span>
        </div>
        
        <p class="text-sm text-surface-700 dark:text-surface-300 mb-2">
          {{ issue.issue }}
        </p>
        
        <div class="flex items-center justify-between">
          <span 
            v-if="issue.resolved_by_technician_id"
            class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <i class="pi pi-check-circle"></i>
            Resolved
          </span>
          <span 
            v-else
            class="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1"
          >
            <i class="pi pi-clock"></i>
            Pending
          </span>
          
          <Button 
            icon="pi pi-eye" 
            size="small" 
            text 
            rounded
            @click="$emit('view-issue', issue)"
          />
        </div>
      </div>
    </div>
    
    <div v-else class="text-center text-surface-500 py-6">
      <i class="pi pi-check-circle text-4xl mb-2 block text-green-500"></i>
      <p>No issues reported</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  issues: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['view-issue']);

function getCategorySeverity(category) {
  const severityMap = {
    'Unresolved': 'danger',
    'Resolved': 'success',
    'In Progress': 'warning',
    'Pending': 'info'
  };
  return severityMap[category] || 'secondary';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.issues-list {
  height: 100%;
}
</style> 