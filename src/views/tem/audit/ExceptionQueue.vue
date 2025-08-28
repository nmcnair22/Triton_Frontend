<template>
  <div class="tem-exception-queue">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Exception Queue</h1>
      <p class="text-gray-600 mt-1">Manage and resolve audit exceptions with drag-and-drop workflow</p>
    </div>

    <!-- Exception Tabs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card 
        v-for="tab in exceptionTabs"
        :key="tab.key"
        :class="['cursor-pointer hover:shadow-lg transition-shadow', { 'ring-2 ring-blue-500': activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold" :class="tab.colorClass">{{ tab.count }}</div>
            <div class="text-sm text-gray-600">{{ tab.label }}</div>
            <Badge v-if="tab.count > 0" :value="tab.count" :severity="tab.severity" class="mt-1" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Kanban Board Placeholder -->
    <Card>
      <template #content>
        <div class="kanban-board-placeholder">
          <div class="text-center py-16">
            <i class="pi pi-flag text-6xl text-purple-500 mb-4"></i>
            <h2 class="text-2xl font-semibold mb-2">Exception Workflow Board</h2>
            <p class="text-gray-600 mb-6">Drag-and-drop Kanban board for exception management coming soon</p>
            
            <!-- Kanban Columns Preview -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8 max-w-6xl mx-auto">
              <div v-for="column in kanbanColumns" :key="column.key" class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold" :class="column.colorClass">{{ column.title }}</h3>
                  <Badge :value="column.count" :severity="column.severity" />
                </div>
                <div class="space-y-2">
                  <div
                    v-for="i in Math.min(column.count, 3)"
                    :key="i"
                    class="bg-white rounded p-3 border-l-4"
                    :class="column.borderClass"
                  >
                    <div class="text-sm font-medium">Exception #{{ i }}</div>
                    <div class="text-xs text-gray-500 mt-1">Sample exception item</div>
                  </div>
                  <div v-if="column.count > 3" class="text-xs text-gray-500 text-center">
                    +{{ column.count - 3 }} more
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Bulk Actions Preview -->
            <div class="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
              <h3 class="font-semibold mb-2">Bulk Actions Available</h3>
              <div class="flex flex-wrap gap-2 justify-center">
                <Button label="Approve All" size="small" severity="success" outlined disabled />
                <Button label="Reject Selected" size="small" severity="danger" outlined disabled />
                <Button label="Assign to User" size="small" outlined disabled />
                <Button label="Export Queue" size="small" outlined disabled />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Badge from 'primevue/badge';

// State
const activeTab = ref('new');

const exceptionTabs = [
  { 
    key: 'new', 
    label: 'New', 
    count: 0, 
    colorClass: 'text-blue-600', 
    severity: 'info' 
  },
  { 
    key: 'review', 
    label: 'In Review', 
    count: 0, 
    colorClass: 'text-orange-600', 
    severity: 'warning' 
  },
  { 
    key: 'disputed', 
    label: 'Disputed', 
    count: 0, 
    colorClass: 'text-red-600', 
    severity: 'danger' 
  },
  { 
    key: 'resolved', 
    label: 'Resolved', 
    count: 0, 
    colorClass: 'text-green-600', 
    severity: 'success' 
  },
  { 
    key: 'closed', 
    label: 'Closed', 
    count: 0, 
    colorClass: 'text-gray-600', 
    severity: 'secondary' 
  }
];

const kanbanColumns = [
  {
    key: 'new',
    title: 'New',
    count: 0,
    colorClass: 'text-blue-600',
    severity: 'info',
    borderClass: 'border-blue-500'
  },
  {
    key: 'review',
    title: 'Review',
    count: 0,
    colorClass: 'text-orange-600',
    severity: 'warning',
    borderClass: 'border-orange-500'
  },
  {
    key: 'approved',
    title: 'Approved',
    count: 0,
    colorClass: 'text-green-600',
    severity: 'success',
    borderClass: 'border-green-500'
  },
  {
    key: 'disputed',
    title: 'Disputed',
    count: 0,
    colorClass: 'text-red-600',
    severity: 'danger',
    borderClass: 'border-red-500'
  },
  {
    key: 'closed',
    title: 'Closed',
    count: 0,
    colorClass: 'text-gray-600',
    severity: 'secondary',
    borderClass: 'border-gray-500'
  }
];
</script>

<style scoped>
.tem-exception-queue {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}

.kanban-board-placeholder {
  min-height: 400px;
}
</style>