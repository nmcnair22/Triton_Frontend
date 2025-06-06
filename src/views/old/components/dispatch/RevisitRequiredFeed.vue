<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Timeline from 'primevue/timeline';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const toast = useToast();

const navigateToVisit = (visit) => {
  router.push(`/dispatch/visits/${visit.visit_id}`);
};

const getStatusSeverity = (status) => {
  if (!status) return 'info';
  
  status = status.toLowerCase();
  if (status.includes('failed') || status.includes('cancelled')) return 'danger';
  if (status.includes('issues')) return 'warning';
  if (status.includes('complet')) return 'success';
  return 'info';
};

const getTimeSince = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

// Format the data for the timeline
const timelineEvents = computed(() => {
  return props.data.map(visit => {
    // Find the primary issue requiring revisit
    let primaryIssue = '';
    if (visit.issues_encountered && visit.issues_encountered.length > 0) {
      primaryIssue = visit.issues_encountered[0].description;
    }

    return {
      visit: visit,
      status: visit.status,
      date: formatDate(visit.date),
      timeSince: getTimeSince(visit.date),
      content: `Visit to ${visit.location || 'site'} - ${visit.service_type || 'Service'}`,
      issue: primaryIssue,
      severity: getStatusSeverity(visit.status),
      icon: visit.status && visit.status.toLowerCase().includes('failed') ? 'pi-exclamation-circle' : 'pi-sync',
      technician: visit.turnup_cards && visit.turnup_cards[0]?.technicians && visit.turnup_cards[0].technicians[0]?.name || 'Unassigned'
    };
  });
});
</script>

<template>
  <Card class="revisit-feed">
    <template #title>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <i class="pi pi-sync text-yellow-500 text-xl"></i>
          <span class="text-xl font-semibold">Revisits Required</span>
        </div>
        <Button icon="pi pi-refresh" class="p-button-text p-button-rounded" />
      </div>
    </template>
    
    <template #content>
      <div v-if="loading" class="flex justify-center p-4">
        <i class="pi pi-spin pi-spinner text-3xl"></i>
      </div>
      <div v-else-if="data && data.length > 0">
        <Timeline :value="timelineEvents" class="custom-timeline">
          <template #content="slotProps">
            <div @click="navigateToVisit(slotProps.item.visit)" 
                 class="timeline-event p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 cursor-pointer hover:shadow-md transition-shadow">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h5 class="m-0 font-semibold">{{ slotProps.item.content }}</h5>
                  <div class="text-sm text-surface-600 dark:text-surface-400">{{ slotProps.item.date }} ({{ slotProps.item.timeSince }})</div>
                </div>
                <Tag :value="slotProps.item.status" :severity="slotProps.item.severity" />
              </div>
              
              <div v-if="slotProps.item.issue" class="mt-2 text-sm">
                <div class="font-semibold">Issue:</div>
                <div>{{ slotProps.item.issue }}</div>
              </div>
              
              <div class="flex justify-between items-center mt-3">
                <div class="flex items-center gap-2">
                  <Avatar icon="pi pi-user" shape="circle" size="small" />
                  <span class="text-sm">{{ slotProps.item.technician }}</span>
                </div>
                <Button icon="pi pi-arrow-right" class="p-button-text p-button-sm" />
              </div>
            </div>
          </template>
          <template #marker="slotProps">
            <span :class="['timeline-marker', `bg-${slotProps.item.severity}`]">
              <i :class="['pi', slotProps.item.icon]"></i>
            </span>
          </template>
        </Timeline>
      </div>
      <div v-else class="empty-state p-4 text-center">
        <i class="pi pi-check-circle text-3xl text-surface-400 mb-3"></i>
        <p>No revisits currently required</p>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.revisit-feed {
  height: 100%;
}

.timeline-event {
  margin-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.custom-timeline :deep(.p-timeline-event-opposite) {
  display: none;
}

.timeline-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: white;
}

.bg-success {
  background-color: var(--green-500);
}

.bg-warning {
  background-color: var(--yellow-500);
}

.bg-danger {
  background-color: var(--red-500);
}

.bg-info {
  background-color: var(--blue-500);
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style> 