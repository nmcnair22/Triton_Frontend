<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';

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

const navigateToVisit = (visit) => {
  router.push(`/dispatch/visits/${visit.visit_id}`);
};

const getStatusSeverity = (status) => {
  if (!status) return 'info';
  
  status = status.toLowerCase();
  if (status === 'unresolved') return 'danger';
  if (status === 'in progress') return 'warning';
  if (status === 'resolved') return 'success';
  return 'info';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

// Process data for critical issues
const criticalIssues = computed(() => {
  const issues = [];
  
  props.data.forEach(visit => {
    if (visit.issues_encountered && visit.issues_encountered.length > 0) {
      visit.issues_encountered.forEach(issue => {
        // Skip resolved issues
        if (issue.status?.toLowerCase() === 'resolved') return;
        
        // Consider critical if:
        // 1. Explicitly marked as needing future attention
        // 2. Has unresolved status
        // 3. Has multiple resolution attempts (meaning persistent)
        // 4. Related to previous visit (recurring issue)
        const isCritical = 
          issue.needs_future_attention === true || 
          issue.status?.toLowerCase() === 'unresolved' ||
          (issue.resolution_attempts && issue.resolution_attempts.length > 1) ||
          issue.related_to_previous_visit === true;
        
        if (isCritical) {
          issues.push({
            id: `${visit.visit_id}-${issues.length}`,
            visit_id: visit.visit_id,
            date: formatDate(visit.date),
            customer: visit.customer || 'Unknown',
            location: visit.location || 'Unknown',
            service_type: visit.service_type || 'Service',
            description: issue.description,
            status: issue.status || 'Unresolved',
            resolution_attempts: issue.resolution_attempts || [],
            mitigation: issue.mitigation,
            needs_future_attention: issue.needs_future_attention,
            related_to_previous_visit: issue.related_to_previous_visit,
            visit: visit
          });
        }
      });
    }
  });
  
  // Sort by date (most recent first) and then by status (unresolved first)
  return issues.sort((a, b) => {
    // First by status (unresolved first)
    if (a.status?.toLowerCase() === 'unresolved' && b.status?.toLowerCase() !== 'unresolved') {
      return -1;
    }
    if (a.status?.toLowerCase() !== 'unresolved' && b.status?.toLowerCase() === 'unresolved') {
      return 1;
    }
    
    // Then by date (most recent first)
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
});

// Calculate resolution progress
const getResolutionProgress = (issue) => {
  if (issue.status?.toLowerCase() === 'resolved') {
    return 100;
  }
  
  if (issue.resolution_attempts && issue.resolution_attempts.length > 0) {
    // Consider progress based on number of attempts (max out at 90% if not resolved)
    return Math.min(issue.resolution_attempts.length * 30, 90);
  }
  
  if (issue.mitigation) {
    // Has mitigation but no attempts yet
    return 20;
  }
  
  return 0;
};
</script>

<template>
  <Card class="issues-feed">
    <template #title>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
          <span class="text-xl font-semibold">Critical Issues Tracker</span>
          <Badge v-if="criticalIssues.length > 0" :value="criticalIssues.length" severity="danger" />
        </div>
        <Button icon="pi pi-refresh" class="p-button-text p-button-rounded" />
      </div>
    </template>
    
    <template #content>
      <div v-if="loading" class="flex justify-center p-4">
        <i class="pi pi-spin pi-spinner text-3xl"></i>
      </div>
      <div v-else>
        <Accordion :multiple="true" v-if="criticalIssues.length > 0">
          <AccordionTab v-for="issue in criticalIssues" :key="issue.id">
            <template #header>
              <div class="flex flex-1 items-center justify-between">
                <div class="flex items-center gap-3">
                  <i 
                    class="pi pi-exclamation-circle text-red-500" 
                    v-if="issue.status?.toLowerCase() === 'unresolved'"
                  ></i>
                  <i 
                    class="pi pi-sync text-yellow-500" 
                    v-else-if="issue.status?.toLowerCase() === 'in progress'"
                  ></i>
                  <i 
                    class="pi pi-info-circle text-blue-500" 
                    v-else
                  ></i>
                  <div class="truncate">{{ issue.description }}</div>
                </div>
                <Tag :value="issue.status" :severity="getStatusSeverity(issue.status)" class="ml-auto mr-4" />
              </div>
            </template>
            
            <div class="p-2">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div class="text-sm font-semibold mb-1">Customer & Location</div>
                  <div>{{ issue.customer }} - {{ issue.location }}</div>
                </div>
                
                <div>
                  <div class="text-sm font-semibold mb-1">Service Type</div>
                  <div>{{ issue.service_type }}</div>
                </div>
                
                <div>
                  <div class="text-sm font-semibold mb-1">Date</div>
                  <div>{{ issue.date }}</div>
                </div>
                
                <div>
                  <div class="text-sm font-semibold mb-1">Resolution Status</div>
                  <div class="flex items-center gap-2">
                    <ProgressBar :value="getResolutionProgress(issue)" style="height: 8px" class="flex-1" />
                    <span class="text-sm">{{ getResolutionProgress(issue) }}%</span>
                  </div>
                </div>
              </div>
              
              <Divider />
              
              <div v-if="issue.mitigation" class="mb-3">
                <div class="text-sm font-semibold mb-1">Mitigation Plan</div>
                <div>{{ issue.mitigation }}</div>
              </div>
              
              <div v-if="issue.resolution_attempts && issue.resolution_attempts.length > 0" class="mb-3">
                <div class="text-sm font-semibold mb-1">Resolution Attempts</div>
                <ul class="list-disc pl-5 space-y-2">
                  <li v-for="(attempt, index) in issue.resolution_attempts" :key="`attempt-${index}`">
                    <div>{{ attempt.attempt_description }}</div>
                    <div class="text-sm text-surface-600">
                      Outcome: <Tag :value="attempt.outcome" size="small" :severity="attempt.outcome === 'Successful' ? 'success' : 'warning'" />
                    </div>
                  </li>
                </ul>
              </div>
              
              <div class="flex flex-wrap gap-2 mt-3">
                <Tag 
                  v-if="issue.needs_future_attention" 
                  severity="warning" 
                  value="Needs Future Attention" 
                  icon="pi pi-calendar"
                />
                <Tag 
                  v-if="issue.related_to_previous_visit" 
                  severity="info" 
                  value="Related to Previous Visit" 
                  icon="pi pi-history"
                />
              </div>
              
              <div class="flex justify-end mt-3">
                <Button 
                  label="View Visit Details" 
                  icon="pi pi-eye" 
                  class="p-button-sm" 
                  @click="navigateToVisit(issue.visit)"
                />
              </div>
            </div>
          </AccordionTab>
        </Accordion>
        
        <div v-else class="empty-state p-4 text-center">
          <i class="pi pi-check-circle text-3xl text-surface-400 mb-3"></i>
          <p>No critical issues found</p>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.issues-feed {
  height: 100%;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style> 