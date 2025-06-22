<template>
  <div class="timeline-view">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold">Visit Timeline</h3>
      <Button 
        icon="pi pi-plus" 
        label="Add Event" 
        @click="showAddEvent = true"
        size="small"
      />
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="timeline.length === 0" class="text-center py-8">
      <i class="pi pi-clock text-4xl text-surface-300 mb-4"></i>
      <h4 class="text-lg font-semibold text-surface-500 mb-2">No timeline events</h4>
      <p class="text-surface-400">Timeline events will appear here as visits progress</p>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="event in timeline" 
        :key="event.id"
        class="flex items-start gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
      >
        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
          <i :class="getEventIcon(event.type)" class="text-primary-600 dark:text-primary-400"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <h4 class="font-semibold">{{ event.title }}</h4>
            <span class="text-sm text-surface-500">{{ formatTimestamp(event.timestamp) }}</span>
          </div>
          <p class="text-surface-600 mb-2">{{ event.description }}</p>
          <div class="flex items-center gap-2">
            <Tag v-if="event.priority === 'high'" value="High Priority" severity="danger" size="small" />
            <Tag v-else-if="event.priority === 'medium'" value="Medium" severity="warning" size="small" />
            <span v-if="event.user" class="text-xs text-surface-500">by {{ event.user.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Event Dialog -->
    <Dialog 
      v-model:visible="showAddEvent" 
      :modal="true" 
      :style="{ width: '500px' }"
      header="Add Timeline Event"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Event Type</label>
          <Select 
            v-model="newEvent.type"
            :options="eventTypes"
            option-label="label"
            option-value="value"
            placeholder="Select event type"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Title</label>
          <InputText v-model="newEvent.title" placeholder="Event title" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <Textarea v-model="newEvent.description" placeholder="Event description" class="w-full" rows="3" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Priority</label>
          <Select 
            v-model="newEvent.priority"
            :options="priorityOptions"
            option-label="label"
            option-value="value"
            placeholder="Select priority"
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" @click="cancelAddEvent" text />
        <Button label="Add Event" @click="submitEvent" :disabled="!isEventValid" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  timeline: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['add-event']);

// Local state
const showAddEvent = ref(false);
const newEvent = ref({
  type: '',
  title: '',
  description: '',
  priority: 'medium'
});

// Options
const eventTypes = ref([
  { label: 'Status Update', value: 'status_update' },
  { label: 'Note Added', value: 'note' },
  { label: 'Task Completed', value: 'task_completed' },
  { label: 'Issue Reported', value: 'issue_reported' },
  { label: 'Technician Assigned', value: 'technician_assigned' },
  { label: 'Customer Contact', value: 'customer_contact' }
]);

const priorityOptions = ref([
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
]);

// Computed
const isEventValid = computed(() => {
  return newEvent.value.type && newEvent.value.title && newEvent.value.description;
});

// Methods
function getEventIcon(type) {
  const iconMap = {
    status_update: 'pi pi-flag',
    note: 'pi pi-file-edit',
    task_completed: 'pi pi-check',
    issue_reported: 'pi pi-exclamation-triangle',
    technician_assigned: 'pi pi-user',
    customer_contact: 'pi pi-phone'
  };
  return iconMap[type] || 'pi pi-info-circle';
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function submitEvent() {
  emit('add-event', { ...newEvent.value });
  cancelAddEvent();
}

function cancelAddEvent() {
  showAddEvent.value = false;
  newEvent.value = {
    type: '',
    title: '',
    description: '',
    priority: 'medium'
  };
}
</script>

<style scoped>
.timeline-view {
  min-height: 300px;
}
</style> 