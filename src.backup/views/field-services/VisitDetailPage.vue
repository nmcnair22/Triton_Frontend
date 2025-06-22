<template>
  <div class="visit-detail-page p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-96">
      <ProgressSpinner size="50px" stroke-width="4" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
        <div>
          <h3 class="text-lg font-semibold text-red-900 dark:text-red-100">Error Loading Visit</h3>
          <p class="text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Visit Detail Content -->
    <div v-else-if="currentVisit" class="space-y-6">
      <!-- Header Section -->
      <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <div class="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
              <i class="pi pi-clipboard text-primary-600 dark:text-primary-400 text-3xl"></i>
            </div>
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                  Visit #{{ currentVisit.externalId }}
                </h1>
                <Badge 
                  :value="currentVisit.status" 
                  :severity="getStatusSeverity(currentVisit.status)"
                  class="text-sm"
                />
              </div>
              <p class="text-surface-600 dark:text-surface-300 text-lg mb-2">
                {{ currentVisit.visitType?.charAt(0).toUpperCase() + currentVisit.visitType?.slice(1) || 'Unknown Type' }}
              </p>
              <div class="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                <span><i class="pi pi-calendar mr-2"></i>{{ formatDate(currentVisit.serviceDate) }}</span>
                <span><i class="pi pi-clock mr-2"></i>{{ currentVisit.hoursWorked || 0 }} hours</span>
                <span><i class="pi pi-dollar mr-2"></i>${{ (currentVisit.revenue || 0).toLocaleString() }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <Button 
              icon="pi pi-pencil" 
              label="Edit Visit" 
              class="p-button-outlined"
            />
            <Button 
              icon="pi pi-arrow-left" 
              label="Back to Management" 
              @click="$router.push('/field-services/visit-management')"
              class="p-button-text"
            />
          </div>
        </div>
      </div>

      <!-- Key Performance Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Quality Score"
          :value="currentVisit.aiInsights?.qualityRating || 0"
          icon="pi pi-star"
          color="warning"
          :trend="2.1"
        />
        <StatsCard
          title="Efficiency Score"
          :value="`${currentVisit.efficiency || 0}%`"
          icon="pi pi-gauge"
          color="info"
          :trend="5.2"
        />
        <StatsCard
          title="Profit Margin"
          :value="`${currentVisit.profitMargin || 0}%`"
          icon="pi pi-chart-line"
          color="success"
          :trend="1.8"
        />
        <StatsCard
          title="Risk Level"
          :value="currentVisit.aiInsights?.riskLevel || 'Low'"
          icon="pi pi-shield"
          :color="getRiskColor(currentVisit.aiInsights?.riskLevel)"
          :trend="0"
        />
      </div>

      <!-- Main Content Tabs -->
      <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700">
        <Tabs v-model:value="activeTab" class="visit-detail-tabs">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="timeline">Timeline</Tab>
            <Tab value="tasks">Tasks & Issues</Tab>
            <Tab value="materials">Materials</Tab>
            <Tab value="insights">AI Insights</Tab>
          </TabList>

          <TabPanels>
            <!-- Overview Tab -->
            <TabPanel value="overview" class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Customer & Project Info -->
                <div class="space-y-6">
                  <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                      <i class="pi pi-building text-primary-600"></i>
                      Customer Information
                    </h3>
                    <div class="space-y-3">
                      <div class="flex justify-between">
                        <span class="text-surface-600 dark:text-surface-300">Name:</span>
                        <span class="font-medium">{{ currentVisit.customer?.name || 'N/A' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-surface-600 dark:text-surface-300">Email:</span>
                        <span class="font-medium">{{ currentVisit.customer?.email || 'N/A' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-surface-600 dark:text-surface-300">Phone:</span>
                        <span class="font-medium">{{ currentVisit.customer?.phone || 'N/A' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                      <i class="pi pi-briefcase text-primary-600"></i>
                      Project Details
                    </h3>
                    <div class="space-y-3">
                      <div class="flex justify-between">
                        <span class="text-surface-600 dark:text-surface-300">Project:</span>
                        <span class="font-medium">{{ currentVisit.project?.name || 'N/A' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-surface-600 dark:text-surface-300">Status:</span>
                        <Badge :value="currentVisit.project?.status || 'unknown'" />
                      </div>
                      <div class="flex justify-between">
                        <span class="text-surface-600 dark:text-surface-300">Target Completion:</span>
                        <span class="font-medium">{{ formatDate(currentVisit.project?.targetCompletion) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Technicians & Team -->
                <div class="space-y-6">
                  <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                      <i class="pi pi-users text-primary-600"></i>
                      Technician Team
                    </h3>
                    <div class="space-y-3" v-if="currentVisit.technicians?.length">
                      <div 
                        v-for="tech in currentVisit.technicians" 
                        :key="tech.id"
                        class="flex items-center justify-between p-3 bg-white dark:bg-surface-900 rounded border"
                      >
                        <div class="flex items-center gap-3">
                          <Avatar :label="tech.name?.charAt(0)" size="normal" />
                          <div>
                            <div class="font-medium">{{ tech.name }}</div>
                            <div class="text-sm text-surface-500">{{ tech.role }}</div>
                          </div>
                        </div>
                        <div class="text-right text-sm">
                          <div class="font-medium">{{ tech.hoursWorked || 0 }}h worked</div>
                          <div class="text-surface-500">{{ tech.isLead ? 'Lead' : 'Technician' }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center text-surface-500 py-4">
                      No technicians assigned
                    </div>
                  </div>

                  <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                      <i class="pi pi-file-text text-primary-600"></i>
                      Work Summary
                    </h3>
                    <div class="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                      {{ currentVisit.workSummary || 'No work summary available.' }}
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Timeline Tab -->
            <TabPanel value="timeline" class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Visit Timeline</h3>
                  <Button 
                    icon="pi pi-plus" 
                    label="Add Event" 
                    class="p-button-sm"
                  />
                </div>

                <div v-if="timelineLoading" class="flex justify-center py-8">
                  <ProgressSpinner size="30px" />
                </div>

                <Timeline 
                  v-else-if="visitTimeline.length" 
                  :value="visitTimeline" 
                  layout="vertical"
                  class="customized-timeline"
                >
                  <template #marker="slotProps">
                    <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow" 
                          :style="{ backgroundColor: getTimelineMarkerColor(slotProps.item.type) }">
                      <i :class="getTimelineIcon(slotProps.item.type)"></i>
                    </span>
                  </template>
                  <template #content="slotProps">
                    <Card class="mt-3">
                      <template #content>
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h4 class="font-semibold text-surface-900 dark:text-surface-0 mb-2">
                              {{ slotProps.item.title }}
                            </h4>
                            <p class="text-surface-600 dark:text-surface-300 mb-2">
                              {{ slotProps.item.description }}
                            </p>
                            <div class="flex items-center gap-4 text-sm text-surface-500">
                              <span><i class="pi pi-clock mr-1"></i>{{ formatDateTime(slotProps.item.timestamp) }}</span>
                              <span v-if="slotProps.item.user">
                                <i class="pi pi-user mr-1"></i>{{ slotProps.item.user }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>
                  </template>
                </Timeline>

                <div v-else class="text-center text-surface-500 py-8">
                  <i class="pi pi-clock text-4xl mb-4 block"></i>
                  <p>No timeline events recorded yet.</p>
                </div>
              </div>
            </TabPanel>

            <!-- Tasks & Issues Tab -->
            <TabPanel value="tasks" class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Tasks Section -->
                <div>
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-check-circle text-green-600"></i>
                    Tasks ({{ currentVisit.tasks?.length || 0 }})
                  </h3>
                  
                  <div v-if="currentVisit.tasks?.length" class="space-y-3">
                    <div 
                      v-for="task in currentVisit.tasks" 
                      :key="task.id"
                      class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4"
                    >
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="font-medium text-surface-900 dark:text-surface-0">{{ task.task }}</h4>
                        <Badge :value="task.status" :severity="getTaskStatusSeverity(task.status)" />
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                          <span class="text-surface-600">Category:</span>
                          <span>{{ task.category }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-surface-600">Duration:</span>
                          <span>{{ task.actualDuration || task.estimatedDuration || 0 }}min</span>
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-surface-600">Progress:</span>
                          <span>{{ task.completionPercentage || 0 }}%</span>
                        </div>
                        <ProgressBar :value="task.completionPercentage || 0" class="h-2" />
                        <p v-if="task.notes" class="text-sm text-surface-600 dark:text-surface-300 mt-2">
                          {{ task.notes }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center text-surface-500 py-8">
                    No tasks recorded for this visit.
                  </div>
                </div>

                <!-- Issues Section -->
                <div>
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-exclamation-triangle text-orange-600"></i>
                    Issues ({{ currentVisit.issues?.length || 0 }})
                  </h3>
                  
                  <div v-if="currentVisit.issues?.length" class="space-y-3">
                    <div 
                      v-for="issue in currentVisit.issues" 
                      :key="issue.id"
                      class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border-l-4"
                      :class="getIssueBorderClass(issue.severity)"
                    >
                      <div class="flex items-start justify-between mb-2">
                        <h4 class="font-medium text-surface-900 dark:text-surface-0">{{ issue.issue }}</h4>
                        <Badge :value="issue.severity" :severity="getIssueSeverity(issue.severity)" />
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                          <span class="text-surface-600">Category:</span>
                          <span>{{ issue.category }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-surface-600">Status:</span>
                          <Badge :value="issue.status" size="small" />
                        </div>
                        <div class="flex justify-between text-sm">
                          <span class="text-surface-600">Reported:</span>
                          <span>{{ formatDateTime(issue.reportedAt) }}</span>
                        </div>
                        <p v-if="issue.resolution" class="text-sm text-green-700 dark:text-green-300 mt-2 p-2 bg-green-50 dark:bg-green-900 rounded">
                          <strong>Resolution:</strong> {{ issue.resolution }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center text-surface-500 py-8">
                    No issues reported for this visit.
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Materials Tab -->
            <TabPanel value="materials" class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Materials & Inventory</h3>
                  <div class="text-right">
                    <div class="text-sm text-surface-600">Total Cost</div>
                    <div class="text-xl font-bold text-primary-600">
                      ${{ getTotalMaterialCost().toLocaleString() }}
                    </div>
                  </div>
                </div>

                <DataTable 
                  v-if="currentVisit.materials?.length"
                  :value="currentVisit.materials" 
                  class="p-datatable-sm"
                  :paginator="false"
                  responsiveLayout="scroll"
                >
                  <Column field="material" header="Material">
                    <template #body="slotProps">
                      <div class="font-medium">{{ slotProps.data.material }}</div>
                      <div class="text-sm text-surface-500">{{ slotProps.data.category }}</div>
                    </template>
                  </Column>
                  <Column field="quantity" header="Quantity" class="text-center">
                    <template #body="slotProps">
                      <Badge :value="slotProps.data.quantity" class="bg-blue-100 text-blue-800" />
                    </template>
                  </Column>
                  <Column field="unitCost" header="Unit Cost">
                    <template #body="slotProps">
                      ${{ (slotProps.data.unitCost || 0).toFixed(2) }}
                    </template>
                  </Column>
                  <Column field="totalCost" header="Total Cost">
                    <template #body="slotProps">
                      <span class="font-medium">
                        ${{ (slotProps.data.totalCost || 0).toLocaleString() }}
                      </span>
                    </template>
                  </Column>
                  <Column field="supplier" header="Supplier">
                    <template #body="slotProps">
                      {{ slotProps.data.supplier || 'N/A' }}
                    </template>
                  </Column>
                </DataTable>

                <div v-else class="text-center text-surface-500 py-8">
                  <i class="pi pi-box text-4xl mb-4 block"></i>
                  <p>No materials recorded for this visit.</p>
                </div>
              </div>
            </TabPanel>

            <!-- AI Insights Tab -->
            <TabPanel value="insights" class="p-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- AI Analysis Summary -->
                <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-brain text-purple-600"></i>
                    AI Analysis Summary
                  </h3>
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-surface-600 dark:text-surface-300">Outcome Category:</span>
                      <Badge :value="currentVisit.aiInsights?.outcomeCategory || 'Unknown'" severity="info" />
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-surface-600 dark:text-surface-300">Quality Rating:</span>
                      <div class="flex items-center gap-2">
                        <Rating :value="Math.round(currentVisit.aiInsights?.qualityRating || 0)" readonly :cancel="false" />
                        <span class="text-sm">{{ currentVisit.aiInsights?.qualityRating || 0 }}/10</span>
                      </div>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-surface-600 dark:text-surface-300">Efficiency Score:</span>
                      <div class="flex items-center gap-2">
                        <ProgressBar :value="currentVisit.aiInsights?.efficiencyScore || 0" class="w-24 h-3" />
                        <span class="text-sm">{{ currentVisit.aiInsights?.efficiencyScore || 0 }}%</span>
                      </div>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-surface-600 dark:text-surface-300">Customer Satisfaction:</span>
                      <div class="flex items-center gap-2">
                        <ProgressBar :value="(currentVisit.aiInsights?.customerSatisfactionScore || 0) * 10" class="w-24 h-3" />
                        <span class="text-sm">{{ currentVisit.aiInsights?.customerSatisfactionScore || 0 }}/10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recommendations -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-lightbulb text-yellow-600"></i>
                    AI Recommendations
                  </h3>
                  <div v-if="currentVisit.aiInsights?.recommendations?.length" class="space-y-3">
                    <div 
                      v-for="(rec, index) in currentVisit.aiInsights.recommendations" 
                      :key="index"
                      class="flex items-start gap-3 p-3 bg-white dark:bg-surface-900 rounded border-l-4 border-yellow-400"
                    >
                      <i class="pi pi-arrow-right text-yellow-600 mt-1"></i>
                      <span class="text-surface-700 dark:text-surface-300">{{ rec }}</span>
                    </div>
                  </div>
                  <div v-else class="text-center text-surface-500 py-4">
                    No AI recommendations available.
                  </div>
                </div>

                <!-- Risk Indicators -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-shield text-red-600"></i>
                    Risk Indicators
                  </h3>
                  <div v-if="currentVisit.aiInsights?.riskIndicators?.length" class="space-y-2">
                    <Chip 
                      v-for="(risk, index) in currentVisit.aiInsights.riskIndicators" 
                      :key="index"
                      :label="risk.replace('_', ' ').toUpperCase()"
                      class="mr-2 mb-2"
                      :class="getRiskChipClass(risk)"
                    />
                  </div>
                  <div v-else class="text-center text-green-600 py-4">
                    <i class="pi pi-check-circle text-2xl mb-2 block"></i>
                    <p>No risk indicators detected.</p>
                  </div>
                </div>

                <!-- Follow-up Required -->
                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                    <i class="pi pi-calendar-plus text-blue-600"></i>
                    Follow-up Actions
                  </h3>
                  <div v-if="currentVisit.aiInsights?.followUpRequired" class="space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900 rounded border-l-4 border-blue-400">
                      <i class="pi pi-exclamation-circle text-blue-600"></i>
                      <span class="text-blue-800 dark:text-blue-200">Follow-up visit recommended</span>
                    </div>
                    <Button 
                      icon="pi pi-calendar-plus" 
                      label="Schedule Follow-up" 
                      class="p-button-outlined p-button-sm w-full"
                      @click="scheduleFollowUp"
                    />
                  </div>
                  <div v-else class="text-center text-green-600 py-4">
                    <i class="pi pi-check-circle text-2xl mb-2 block"></i>
                    <p>No follow-up required.</p>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>

    <!-- No Visit Found -->
    <div v-else class="text-center text-surface-500 py-12">
      <i class="pi pi-search text-6xl mb-4 block"></i>
      <h2 class="text-2xl font-semibold mb-2">Visit Not Found</h2>
      <p class="mb-4">The requested visit could not be found.</p>
      <Button 
        icon="pi pi-arrow-left" 
        label="Back to Visit Management" 
        @click="$router.push('/field-services/visit-management')"
        class="p-button-outlined"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVisitsStore } from '@/stores/visitsStore';
import StatsCard from '@/components/field-services/StatsCard.vue';

// Router and store
const route = useRoute();
const router = useRouter();
const visitsStore = useVisitsStore();

// Reactive state
const activeTab = ref('overview');

// Computed properties
const visitId = computed(() => route.params.id);
const currentVisit = computed(() => visitsStore.currentVisit);
const visitTimeline = computed(() => visitsStore.visitTimeline);
const loading = computed(() => visitsStore.loading);
const timelineLoading = computed(() => visitsStore.timelineLoading);
const error = computed(() => visitsStore.error);

// Methods
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusSeverity(status) {
  const severityMap = {
    'completed': 'success',
    'in_progress': 'warning',
    'scheduled': 'info',
    'cancelled': 'danger',
    'failed': 'danger'
  };
  return severityMap[status] || 'secondary';
}

function getRiskColor(riskLevel) {
  const colorMap = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger'
  };
  return colorMap[riskLevel?.toLowerCase()] || 'secondary';
}

function getTaskStatusSeverity(status) {
  const severityMap = {
    'completed': 'success',
    'in_progress': 'warning',
    'pending': 'info',
    'cancelled': 'danger'
  };
  return severityMap[status] || 'secondary';
}

function getIssueSeverity(severity) {
  const severityMap = {
    'low': 'info',
    'medium': 'warning',
    'high': 'danger',
    'critical': 'danger'
  };
  return severityMap[severity] || 'secondary';
}

function getIssueBorderClass(severity) {
  const classMap = {
    'low': 'border-blue-400',
    'medium': 'border-yellow-400',
    'high': 'border-orange-400',
    'critical': 'border-red-400'
  };
  return classMap[severity] || 'border-gray-400';
}

function getRiskChipClass(risk) {
  if (risk.includes('weather')) return 'bg-blue-100 text-blue-800';
  if (risk.includes('safety')) return 'bg-red-100 text-red-800';
  if (risk.includes('delay')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

function getTimelineIcon(type) {
  const iconMap = {
    'arrival': 'pi pi-map-marker',
    'start': 'pi pi-play',
    'completion': 'pi pi-check',
    'issue': 'pi pi-exclamation-triangle',
    'departure': 'pi pi-sign-out'
  };
  return iconMap[type] || 'pi pi-circle';
}

function getTimelineMarkerColor(type) {
  const colorMap = {
    'arrival': '#3b82f6',
    'start': '#10b981',
    'completion': '#22c55e',
    'issue': '#f59e0b',
    'departure': '#6b7280'
  };
  return colorMap[type] || '#6b7280';
}

function getTotalMaterialCost() {
  if (!currentVisit.value?.materials) return 0;
  return currentVisit.value.materials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
}

function scheduleFollowUp() {
  // Navigate to create visit form with pre-filled customer data
  router.push({
    path: '/field-services/visit-management',
    query: { 
      action: 'create',
      customer: currentVisit.value?.customer?.id,
      project: currentVisit.value?.project?.id,
      followUp: currentVisit.value?.id
    }
  });
}

// Lifecycle
onMounted(async () => {
  if (visitId.value) {
    await Promise.all([
      visitsStore.fetchVisit(visitId.value),
      visitsStore.fetchVisitTimeline(visitId.value)
    ]);
  }
});

// Watch for route changes
watch(visitId, async (newId) => {
  if (newId) {
    await Promise.all([
      visitsStore.fetchVisit(newId),
      visitsStore.fetchVisitTimeline(newId)
    ]);
  }
});
</script>

<style scoped>
.visit-detail-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.visit-detail-tabs .p-tabview-nav {
  background: transparent;
  border-bottom: 1px solid var(--surface-border);
}

.visit-detail-tabs .p-tabview-header {
  background: transparent;
}

.visit-detail-tabs .p-tabview-header.p-highlight {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

.customized-timeline .p-timeline-event-content {
  min-height: auto;
}

.customized-timeline .p-timeline-event-separator {
  flex: 0;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-rating .p-rating-icon) {
  font-size: 1rem;
}
</style> 