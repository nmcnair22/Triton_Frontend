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
              </div>
            </div>
            <div class="flex gap-2">
              <Tag :value="ticketDetail.ticket.status" :severity="getStatusSeverity(ticketDetail.ticket.status)" />
              <Tag :value="ticketDetail.ticket.priority" :severity="getPrioritySeverity(ticketDetail.ticket.priority)" />
            </div>
          </div>
          
          <h5 class="text-surface-900 dark:text-surface-0 mb-3">{{ ticketDetail.ticket.subject }}</h5>
          
          <!-- Ticket Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- Basic Information Row -->
            <div class="metric-card">
              <label class="metric-label">Customer</label>
              <span class="metric-value">{{ ticketDetail.ticket.customer_name || 'Unassigned' }}</span>
            </div>
            <div class="metric-card">
              <label class="metric-label">Owner</label>
              <span class="metric-value">{{ ticketDetail.ticket.owner || 'Unassigned' }}</span>
            </div>
            <div class="metric-card">
              <label class="metric-label">Created</label>
              <span class="metric-value">{{ formatDate(ticketDetail.ticket.dates?.created_at) }}</span>
            </div>
          </div>
          
          <!-- Activity Metrics Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="metric-card">
              <label class="metric-label">Ticket Age</label>
              <div class="metric-value-with-icon">
                <i class="pi pi-clock text-blue-500"></i>
                <span class="metric-value" :class="getTicketAgeClass(ticketDetail.ticket.dates?.created_at)">
                  {{ formatTicketAge(ticketDetail.ticket.dates?.created_at) }}
                </span>
              </div>
            </div>
            <div class="metric-card">
              <label class="metric-label">Last Update</label>
              <div class="metric-value-with-icon">
                <i class="pi pi-refresh text-green-500"></i>
                <span class="metric-value" :class="getLastUpdateClass(ticketDetail.ticket.dates?.updated_at)">
                  {{ formatTimeSinceUpdate(ticketDetail.ticket.dates?.updated_at) }}
                </span>
              </div>
            </div>
            <div class="metric-card">
              <label class="metric-label">Due Date</label>
              <div class="metric-value-with-icon">
                <i class="pi pi-calendar" :class="getDueDateIconClass(ticketDetail.ticket.dates?.due_date)"></i>
                <span class="metric-value" :class="getDueDateClass(ticketDetail.ticket.dates?.due_date)">
                  {{ ticketDetail.ticket.dates?.due_date ? formatDate(ticketDetail.ticket.dates.due_date) : 'No due date' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content-container">
          <!-- Custom Tab Navigation -->
          <div class="bg-surface-0 dark:bg-surface-950 p-6">
            <ul class="bg-surface-0 dark:bg-surface-950 px-2 m-0 list-none flex items-center overflow-x-auto select-none gap-4">
              <template v-for="(tab, index) of availableTabs" :key="index">
                <li>
                  <a
                    class="cursor-pointer p-3 flex items-center justify-center border-b-2 transition-colors duration-150"
                    :class="{
                      'border-primary text-primary dark:text-primary-400 hover:border-primary-emphasis font-semibold': activeTab === index,
                      'text-surface-500 dark:text-surface-400 border-transparent hover:border-surface-300 dark:hover:border-surface-600': activeTab !== index
                    }"
                    @click="activeTab = index"
                  >
                    <i :class="tab.icon" class="mr-2"></i>
                    {{ tab.label }}
                  </a>
                </li>
                <div v-if="index < availableTabs.length - 1" class="w-px h-6 bg-surface-200 dark:bg-surface-700 shrink-0" />
              </template>
            </ul>
          </div>
          
          <!-- Tab Content -->
          <div class="tab-content">
            <!-- AI Analysis Tab -->
            <div v-if="activeTab === 0 && ticketDetail.ai_analysis" class="tab-panel">
              <div class="analysis-content">
                <!-- Top Row: Reason and Actions -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <!-- Reason for Ticket -->
                  <div class="card">
                    <h6 class="section-title">Reason for Ticket</h6>
                    <p class="text-surface-700 dark:text-surface-300 line-height-3">
                      {{ ticketDetail.ai_analysis.reason_for_ticket || 'No analysis available' }}
                    </p>
                  </div>

                  <!-- Actions Taken -->
                  <div class="card">
                    <h6 class="section-title">Actions Taken</h6>
                    <div v-if="ticketDetail.ai_analysis.actions_taken?.length > 0" class="space-y-3">
                      <div v-for="action in ticketDetail.ai_analysis.actions_taken" :key="action.index" 
                           class="action-item">
                        <Badge :value="action.index" severity="info" class="flex-shrink-0" />
                        <span class="text-surface-700 dark:text-surface-300">{{ action.action }}</span>
                      </div>
                    </div>
                    <p v-else class="text-surface-500 dark:text-surface-400">No actions recorded</p>
                  </div>
                </div>

                <!-- Bottom Row: Timeline and Recommendations -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Timeline Events -->
                  <div class="card">
                    <h6 class="section-title">Timeline</h6>
                    <div v-if="ticketDetail.ai_analysis.timeline_events?.length > 0" class="space-y-3">
                      <div v-for="event in ticketDetail.ai_analysis.timeline_events" :key="event.index"
                           class="timeline-item">
                        <div class="timeline-badge">
                          <Badge :value="event.index" severity="primary" class="mb-2" />
                          <small class="text-surface-500 dark:text-surface-400">{{ event.date }}</small>
                        </div>
                        <div class="timeline-content">
                          <p class="text-surface-700 dark:text-surface-300 m-0">{{ event.event }}</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-surface-500 dark:text-surface-400">No timeline events</p>
                  </div>

                  <!-- Recommendations -->
                  <div class="card">
                    <h6 class="section-title">Recommendations</h6>
                    <div v-if="ticketDetail.ai_analysis.recommendations?.length > 0" class="space-y-3">
                      <div v-for="rec in ticketDetail.ai_analysis.recommendations" :key="rec.index"
                           class="recommendation-item">
                        <div class="recommendation-header">
                          <Badge :value="`#${rec.index}`" severity="warning" />
                          <Tag :value="rec.priority_level" :severity="getPriorityTagSeverity(rec.priority_level)" />
                        </div>
                        <p class="recommendation-text">{{ rec.action }}</p>
                        <div class="recommendation-footer">
                          <span>Owner: {{ rec.owner }}</span>
                          <span>Due: {{ rec.timeframe }}</span>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-surface-500 dark:text-surface-400">No recommendations available</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Original Conversation Tab -->
            <div v-if="activeTab === 1 && ticketDetail.original_conversation" class="tab-panel">
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
            </div>

            <!-- Ticket Details Tab -->
            <div v-if="activeTab === 2" class="tab-panel">
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
            </div>
          </div>
        </div>
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
import { formatDate, formatDueDate, formatTicketAge, formatTimeSinceUpdate, calculateAgeInDays } from '@/lib/utils';

// PrimeVue Components
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
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

// Tab configuration
const availableTabs = computed(() => {
  const tabs = [];
  
  if (ticketDetail.value?.ai_analysis) {
    tabs.push({ label: 'AI Analysis', icon: 'pi pi-brain' });
  }
  
  if (ticketDetail.value?.original_conversation) {
    tabs.push({ label: 'Conversation', icon: 'pi pi-comments' });
  }
  
  tabs.push({ label: 'Details', icon: 'pi pi-info-circle' });
  
  return tabs;
});

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

function getDueDateIconClass(dueDate) {
  if (!dueDate) return 'text-surface-400 dark:text-surface-500';
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-red-500'; // Overdue
  } else if (diffDays <= 1) {
    return 'text-orange-500'; // Due soon
  } else if (diffDays <= 3) {
    return 'text-yellow-500'; // Due within 3 days
  } else {
    return 'text-surface-500'; // Normal
  }
}

function getTicketAgeClass(createdDate) {
  if (!createdDate) return 'text-surface-400 dark:text-surface-500';
  
  const ageInDays = calculateAgeInDays(createdDate);
  
  if (ageInDays > 30) {
    return 'text-red-600 dark:text-red-400 font-bold'; // Very old ticket
  } else if (ageInDays > 14) {
    return 'text-orange-600 dark:text-orange-400 font-medium'; // Old ticket
  } else if (ageInDays > 7) {
    return 'text-yellow-600 dark:text-yellow-400 font-medium'; // Week+ old
  } else {
    return 'text-surface-700 dark:text-surface-300'; // Recent
  }
}

function getLastUpdateClass(updatedDate) {
  if (!updatedDate) return 'text-surface-400 dark:text-surface-500';
  
  const updateAgeInDays = calculateAgeInDays(updatedDate);
  
  if (updateAgeInDays > 7) {
    return 'text-red-600 dark:text-red-400 font-bold'; // No updates for a week+
  } else if (updateAgeInDays > 3) {
    return 'text-orange-600 dark:text-orange-400 font-medium'; // No updates for 3+ days
  } else if (updateAgeInDays > 1) {
    return 'text-yellow-600 dark:text-yellow-400 font-medium'; // Updated 1-3 days ago
  } else {
    return 'text-green-600 dark:text-green-400 font-medium'; // Recent update
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
/* Custom tab styling */
.tab-content {
  background: var(--surface-0);
  border-radius: 0 0 12px 12px;
}

.tab-panel {
  padding: 1.5rem;
}

/* Card styling */
.card {
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.12);
}

/* Metric card styling */
.metric-card {
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.05);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.12);
  border-color: var(--primary-color);
}

.metric-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
  line-height: 1.4;
}

.metric-value-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metric-value-with-icon i {
  font-size: 1.1rem;
  flex-shrink: 0;
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

/* Main content container */
.main-content-container {
  background: var(--surface-0);
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

/* Analysis content */
.analysis-content {
  padding: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--surface-border);
}

/* Action items */
.action-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: var(--surface-100);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

/* Timeline items */
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.timeline-item:hover {
  background: var(--surface-50);
  border-color: var(--primary-color);
}

.timeline-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
}

/* Recommendation items */
.recommendation-item {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.recommendation-item:hover {
  background: var(--surface-50);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.recommendation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.recommendation-text {
  color: var(--text-color);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.recommendation-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
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
  .tab-panel {
    padding: 1rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .metric-card {
    padding: 1rem;
  }
  
  .grid {
    gap: 1rem !important;
  }
}
</style> 