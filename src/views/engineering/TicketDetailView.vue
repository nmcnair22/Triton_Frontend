<template>
  <Toast position="bottom-center" />
  <div class="grid">
    <div class="col-12">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <ProgressSpinner />
        <span class="ml-3">Loading ticket details...</span>
      </div>

      <!-- Error State -->
      <Message v-if="engineeringStore.error" severity="error" :closable="false" class="mb-6">
        {{ engineeringStore.error }}
      </Message>

      <!-- Ticket Content -->
      <div v-if="ticketDetail?.ticket && !isLoading">
        <!-- Header Card -->
        <div class="card mb-4">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <Button icon="pi pi-arrow-left" text @click="goBack" />
              <div>
                <h4 class="text-surface-900 dark:text-surface-0 font-semibold m-0">
                  Ticket #{{ ticketDetail.ticket.ticket_id }}
                </h4>
                <p class="text-surface-600 dark:text-surface-400 m-0 mt-1">
                  {{ ticketDetail.ticket.ticket_mask_id }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Tag :value="ticketDetail.ticket.status" :severity="getStatusSeverity(ticketDetail.ticket.status)" />
              <Tag :value="ticketDetail.ticket.priority" :severity="getPrioritySeverity(ticketDetail.ticket.priority)" />
            </div>
          </div>
          
          <h5 class="text-surface-900 dark:text-surface-0 mb-3">{{ ticketDetail.ticket.subject }}</h5>
          
          <!-- Ticket Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col">
              <label class="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">Customer</label>
              <span class="font-medium">{{ ticketDetail.ticket.customer_name || 'Unassigned' }}</span>
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">Owner</label>
              <span class="font-medium">{{ ticketDetail.ticket.owner || 'Unassigned' }}</span>
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">Created</label>
              <span class="font-medium">{{ formatDate(ticketDetail.ticket.dates?.created_at) }}</span>
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">Due Date</label>
              <span class="font-medium" :class="getDueDateClass(ticketDetail.ticket.dates?.due_date)">
                {{ ticketDetail.ticket.dates?.due_date ? formatDate(ticketDetail.ticket.dates.due_date) : 'No due date' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <TabView>
          <!-- AI Analysis Tab -->
          <TabPanel header="AI Analysis" v-if="ticketDetail.ai_analysis">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Reason for Ticket -->
              <div class="card">
                <h6 class="text-surface-900 dark:text-surface-0 mb-3">Reason for Ticket</h6>
                <p class="text-surface-700 dark:text-surface-300 line-height-3">
                  {{ ticketDetail.ai_analysis.reason_for_ticket || 'No analysis available' }}
                </p>
              </div>

              <!-- Actions Taken -->
              <div class="card">
                <h6 class="text-surface-900 dark:text-surface-0 mb-3">Actions Taken</h6>
                <div v-if="ticketDetail.ai_analysis.actions_taken?.length > 0" class="space-y-2">
                  <div v-for="action in ticketDetail.ai_analysis.actions_taken" :key="action.index" 
                       class="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <Badge :value="action.index" severity="info" class="flex-shrink-0" />
                    <span class="text-surface-700 dark:text-surface-300">{{ action.action }}</span>
                  </div>
                </div>
                <p v-else class="text-surface-500 dark:text-surface-400">No actions recorded</p>
              </div>

              <!-- Timeline Events -->
              <div class="card">
                <h6 class="text-surface-900 dark:text-surface-0 mb-3">Timeline</h6>
                <div v-if="ticketDetail.ai_analysis.timeline_events?.length > 0" class="space-y-3">
                  <div v-for="event in ticketDetail.ai_analysis.timeline_events" :key="event.index"
                       class="flex items-start gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex flex-col items-center">
                      <Badge :value="event.index" severity="primary" class="mb-2" />
                      <small class="text-surface-500 dark:text-surface-400">{{ event.date }}</small>
                    </div>
                    <div class="flex-1">
                      <p class="text-surface-700 dark:text-surface-300 m-0">{{ event.event }}</p>
                    </div>
                  </div>
                </div>
                <p v-else class="text-surface-500 dark:text-surface-400">No timeline events</p>
              </div>

              <!-- Recommendations -->
              <div class="card">
                <h6 class="text-surface-900 dark:text-surface-0 mb-3">Recommendations</h6>
                <div v-if="ticketDetail.ai_analysis.recommendations?.length > 0" class="space-y-3">
                  <div v-for="rec in ticketDetail.ai_analysis.recommendations" :key="rec.index"
                       class="p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                      <Badge :value="`#${rec.index}`" severity="warning" />
                      <Tag :value="rec.priority_level" :severity="getPriorityTagSeverity(rec.priority_level)" />
                    </div>
                    <p class="text-surface-700 dark:text-surface-300 mb-2">{{ rec.action }}</p>
                    <div class="flex items-center justify-between text-sm text-surface-500 dark:text-surface-400">
                      <span>Owner: {{ rec.owner }}</span>
                      <span>Due: {{ rec.timeframe }}</span>
                    </div>
                  </div>
                </div>
                <p v-else class="text-surface-500 dark:text-surface-400">No recommendations available</p>
              </div>
            </div>
          </TabPanel>

          <!-- Original Conversation Tab -->
          <TabPanel header="Conversation" v-if="ticketDetail.original_conversation">
            <div class="card">
              <div class="mb-4">
                <div class="flex items-center justify-between">
                  <h6 class="text-surface-900 dark:text-surface-0 m-0">Original Posts</h6>
                  <Badge :value="ticketDetail.original_conversation.total_posts" severity="info" />
                </div>
                <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">
                  Conversation span: {{ ticketDetail.original_conversation.conversation_span_days }} days
                </p>
              </div>
              
              <div v-if="ticketDetail.original_conversation.posts?.length > 0" class="space-y-4">
                <div v-for="post in ticketDetail.original_conversation.posts" :key="post.id"
                     class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <Avatar :label="getInitials(post.user)" size="small" shape="circle" />
                      <span class="font-medium text-surface-900 dark:text-surface-0">{{ post.user }}</span>
                      <Badge v-if="post.is_initial_post" value="Initial Post" severity="success" />
                    </div>
                    <small class="text-surface-500 dark:text-surface-400">{{ formatDate(post.date) }}</small>
                  </div>
                  <div class="text-surface-700 dark:text-surface-300 line-height-3">
                    {{ post.content }}
                  </div>
                </div>
              </div>
              <p v-else class="text-surface-500 dark:text-surface-400">No conversation posts available</p>
            </div>
          </TabPanel>

          <!-- Ticket Details Tab -->
          <TabPanel header="Details">
            <div class="card">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h6 class="text-surface-900 dark:text-surface-0 mb-3">Basic Information</h6>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Ticket ID:</span>
                      <span class="font-medium">#{{ ticketDetail.ticket.ticket_id }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Mask ID:</span>
                      <span class="font-medium">{{ ticketDetail.ticket.ticket_mask_id }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Status:</span>
                      <Tag :value="ticketDetail.ticket.status" :severity="getStatusSeverity(ticketDetail.ticket.status)" />
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Priority:</span>
                      <Tag :value="ticketDetail.ticket.priority" :severity="getPrioritySeverity(ticketDetail.ticket.priority)" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h6 class="text-surface-900 dark:text-surface-0 mb-3">Assignment & Dates</h6>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Customer:</span>
                      <span class="font-medium">{{ ticketDetail.ticket.customer_name || 'Unassigned' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Owner:</span>
                      <span class="font-medium">{{ ticketDetail.ticket.owner || 'Unassigned' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Created:</span>
                      <span class="font-medium">{{ formatDate(ticketDetail.ticket.dates?.created_at) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-surface-600 dark:text-surface-400">Due Date:</span>
                      <span class="font-medium" :class="getDueDateClass(ticketDetail.ticket.dates?.due_date)">
                        {{ ticketDetail.ticket.dates?.due_date ? formatDate(ticketDetail.ticket.dates.due_date) : 'No due date' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <!-- No Data State -->
      <div v-if="!ticketDetail && !isLoading && !engineeringStore.error" class="flex flex-col items-center justify-center h-64">
        <i class="pi pi-info-circle text-4xl text-surface-400 mb-3"></i>
        <p class="text-surface-600 dark:text-surface-400">No ticket data found</p>
        <Button label="Go Back" icon="pi pi-arrow-left" @click="goBack" class="mt-3" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEngineeringStore } from '@/stores/engineeringStore';
import { useToast } from 'primevue/usetoast';
import { formatDate, formatDueDate } from '@/lib/utils';

// PrimeVue Components
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';

// Composables
const route = useRoute();
const router = useRouter();
const engineeringStore = useEngineeringStore();
const toast = useToast();

// Reactive data
const ticketId = computed(() => route.params.id);
const ticketDetail = computed(() => engineeringStore.currentTicketDetail);
const ticketInsights = computed(() => engineeringStore.currentTicketInsights);
const isLoading = computed(() => engineeringStore.loading);
const activeTab = ref(0);

// Local state
const newPost = ref({
  content: ''
});

// Load ticket data on mount
onMounted(async () => {
  await loadTicketData();
});

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadTicketData();
  }
});

// Methods
async function loadTicketData() {
  if (!ticketId.value) return;
  
  try {
    // Load both detail and insights data
    await Promise.all([
      engineeringStore.fetchTicketDetail(ticketId.value),
      engineeringStore.fetchTicketInsights(ticketId.value)
    ]);
  } catch (error) {
    console.error('Error loading ticket data:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load ticket details',
      life: 3000
    });
  }
}

async function refreshData() {
  await loadTicketData();
  toast.add({
    severity: 'success',
    summary: 'Refreshed',
    detail: 'Ticket data has been refreshed',
    life: 2000
  });
}

function goBack() {
  router.push('/engineering/tickets');
}

// Utility functions for styling
function getStatusSeverity(status) {
  const severityMap = {
    'open': 'info',
    'in_progress': 'primary',
    'pending': 'warning',
    'resolved': 'success',
    'closed': 'secondary'
  };
  return severityMap[status?.toLowerCase()] || 'info';
}

function getPrioritySeverity(priority) {
  const severityMap = {
    'low': 'success',
    'normal': 'info',
    'medium': 'info',
    'high': 'warning',
    'critical': 'danger'
  };
  return severityMap[priority?.toLowerCase()] || 'info';
}

function getPriorityTagSeverity(priority) {
  const severityMap = {
    'low': 'success',
    'medium': 'info',
    'high': 'warning',
    'critical': 'danger'
  };
  return severityMap[priority?.toLowerCase()] || 'info';
}

function getHealthScoreColor(score) {
  if (!score) return 'text-surface-400';
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getDueDateClass(dueDate) {
  if (!dueDate) return 'text-surface-400 dark:text-surface-500';
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-red-600 dark:text-red-400 font-bold'; // Overdue
  } else if (diffDays <= 1) {
    return 'text-orange-600 dark:text-orange-400 font-medium'; // Due today or tomorrow
  } else if (diffDays <= 3) {
    return 'text-yellow-600 dark:text-yellow-400 font-medium'; // Due within 3 days
  } else {
    return 'text-surface-700 dark:text-surface-300'; // Normal
  }
}

function getDataQualitySeverity(level) {
  const severityMap = {
    'excellent': 'success',
    'good': 'info',
    'fair': 'warning',
    'poor': 'danger'
  };
  return severityMap[level?.toLowerCase()] || 'secondary';
}

// Methods
const editTicket = () => {
  router.push(`/engineering/tickets/${ticketId.value}/edit`);
};

const exportTicket = () => {
  // TODO: Implement export functionality
  toast.add({
    severity: 'info',
    summary: 'Export',
    detail: 'Export feature coming soon',
    life: 3000
  });
};

const addPost = async () => {
  try {
    await engineeringStore.addPost(ticketId.value, {
      content: newPost.value.content,
      user: 'Current User' // This should come from auth store
    });
    
    newPost.value.content = '';
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Post added successfully',
      life: 3000
    });
    
    // Refresh ticket data
    await engineeringStore.fetchTicket(ticketId.value);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add post',
      life: 5000
    });
  }
};

// Utility methods
const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name) => {
  if (!name) return '#6366f1';
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
  const index = name.length % colors.length;
  return colors[index];
};

const getTimelineColor = (eventType) => {
  const colorMap = {
    'created': '#3b82f6',
    'updated': '#f59e0b',
    'resolved': '#10b981',
    'escalated': '#ef4444',
    'assigned': '#8b5cf6',
    'commented': '#06b6d4'
  };
  return colorMap[eventType] || '#6b7280';
};

const getTimelineIcon = (eventType) => {
  const iconMap = {
    'created': 'pi pi-plus',
    'updated': 'pi pi-pencil',
    'resolved': 'pi pi-check',
    'escalated': 'pi pi-exclamation-triangle',
    'assigned': 'pi pi-user',
    'commented': 'pi pi-comment'
  };
  return iconMap[eventType] || 'pi pi-circle';
};
</script>

<style scoped>
/* Clean, professional styling for ticket detail view */
:deep(.p-tabview .p-tabview-nav) {
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  background: transparent;
  border: none;
  color: var(--text-color);
  font-weight: 500;
  padding: 1rem 1.5rem;
}

:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

:deep(.p-tabview .p-tabview-panels) {
  background: var(--surface-0);
  padding: 1.5rem;
}

/* Card styling */
.card {
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Avatar styling for conversation posts */
.conversation-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Intelligence card hover effects */
.intelligence-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.intelligence-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

/* Metric cards */
.metric-card {
  background: var(--surface-50);
  border: 1px solid var(--surface-200);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: background-color 0.2s;
}

.metric-card:hover {
  background: var(--surface-100);
}

/* Risk indicators */
.risk-high {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #dc2626;
}

.risk-medium {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #d97706;
}

.risk-low {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #059669;
}

/* Timeline styling */
.timeline-item {
  position: relative;
  padding-left: 2rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--primary-color);
  border-radius: 50%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  :deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  :deep(.p-tabview .p-tabview-panels) {
    padding: 1rem;
  }
  
  .card {
    padding: 1rem;
  }
}
</style> 