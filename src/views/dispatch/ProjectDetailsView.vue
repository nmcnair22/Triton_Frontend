<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useDispatchStore } from '@/stores/dispatchStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';

// Components
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Breadcrumb from 'primevue/breadcrumb';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Timeline from 'primevue/timeline';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

// Refs and state
const router = useRouter();
const route = useRoute();
const toast = useToast();
const dispatchStore = useDispatchStore();
const { loading } = storeToRefs(dispatchStore);

// Local state
const projectId = computed(() => route.params.id);
const project = ref(null);
const jobs = ref([]);
const tableLoading = ref(false);
const milestones = ref([]);

// Breadcrumb items
const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/dispatch/projects' },
  { label: project.value?.name || 'Project Details' }
]);
const breadcrumbHome = { icon: 'pi pi-home', to: '/' };

// Computed properties
const completionPercentage = computed(() => project.value?.completion_pct || 0);
const statusSeverity = computed(() => getStatusSeverity(project.value?.status));
const projectMetrics = computed(() => [
  { label: 'Total Jobs', value: jobs.value.length, icon: 'pi pi-briefcase', color: 'bg-blue-100 text-blue-700' },
  { label: 'Completed Jobs', value: jobs.value.filter(j => j.status === 'completed').length, icon: 'pi pi-check-circle', color: 'bg-green-100 text-green-700' },
  { label: 'Active Jobs', value: jobs.value.filter(j => j.status === 'active').length, icon: 'pi pi-sync', color: 'bg-cyan-100 text-cyan-700' },
  { label: 'Delayed Jobs', value: jobs.value.filter(j => j.status === 'delayed').length, icon: 'pi pi-exclamation-triangle', color: 'bg-yellow-100 text-yellow-700' }
]);

// Methods
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}

function getStatusSeverity(status) {
  const statusMap = {
    'active': 'success',
    'completed': 'info',
    'delayed': 'warning',
    'on_hold': 'warning',
    'cancelled': 'danger'
  };
  return statusMap[status] || 'secondary';
}

function navigateToJob(job) {
  router.push(`/dispatch/projects/${projectId.value}/jobs/${job.id}`);
}

async function loadProjectDetails() {
  tableLoading.value = true;
  try {
    // Fetch project details
    const projectResponse = await dispatchStore.fetchProjectById(projectId.value);
    project.value = projectResponse;
    
    // Fetch jobs for this project
    const jobsResponse = await dispatchStore.fetchJobsByProject(projectId.value);
    jobs.value = jobsResponse;
    
    // Create milestones from timeline data
    if (project.value?.timeline?.milestones) {
      milestones.value = project.value.timeline.milestones.map(m => ({
        status: m.completed ? 'success' : m.current ? 'info' : 'secondary',
        date: formatDate(m.date),
        icon: m.completed ? 'pi pi-check-circle' : m.current ? 'pi pi-flag' : 'pi pi-circle',
        color: m.completed ? '#4CAF50' : m.current ? '#2196F3' : '#9E9E9E',
        content: m.name,
        detail: m.description
      }));
    }
  } catch (error) {
    console.error('Error loading project details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load project details',
      life: 3000
    });
  } finally {
    tableLoading.value = false;
  }
}

// Load data on component mount
onMounted(() => {
  loadProjectDetails();
});
</script>

<template>
  <div class="p-4">
    <!-- Breadcrumb -->
    <div class="mb-4">
      <Breadcrumb :model="breadcrumbItems" :home="breadcrumbHome" />
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4" v-if="project">
      <!-- Project Header Card (Spans full width) -->
      <Card class="lg:col-span-4">
        <template #title>
          <div class="flex justify-between">
            <div>
              <h1 class="text-2xl font-bold mb-1">{{ project.name }}</h1>
              <div class="flex items-center gap-2 text-gray-600">
                <span>Project #{{ project.id }}</span>
                <span class="text-gray-400">|</span>
                <span>{{ project.customer?.name }}</span>
                <Tag :value="project.status" :severity="statusSeverity" class="ml-2" />
              </div>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" label="Edit" class="p-button-outlined p-button-sm" />
              <Button icon="pi pi-download" label="Export" class="p-button-outlined p-button-sm" />
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold mb-2">Project Summary</h3>
              <p class="text-gray-700 dark:text-gray-300 mb-4">
                {{ project.description || 'No description available.' }}
              </p>
              
              <div class="mb-3">
                <span class="font-medium">Completion:</span>
                <div class="mt-1">
                  <ProgressBar :value="completionPercentage" class="h-2" />
                  <div class="flex justify-between mt-1 text-sm">
                    <span>{{ completionPercentage }}% Complete</span>
                    <span>Due {{ formatDate(project.due_date) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="font-semibold mb-2">Key Details</h3>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <div class="text-sm text-gray-600">Start Date</div>
                  <div class="font-medium">{{ formatDate(project.start_date) }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-600">Due Date</div>
                  <div class="font-medium">{{ formatDate(project.due_date) }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-600">Project Manager</div>
                  <div class="font-medium">{{ project.project_manager?.name || 'N/A' }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-600">Priority</div>
                  <div class="font-medium">{{ project.priority || 'Normal' }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Metrics row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div 
              v-for="(metric, index) in projectMetrics" 
              :key="index" 
              class="rounded-lg bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 p-3 flex items-center"
            >
              <div :class="[metric.color, 'p-2 rounded-full mr-3']">
                <i :class="[metric.icon, 'text-lg']"></i>
              </div>
              <div>
                <div class="text-2xl font-bold">{{ metric.value }}</div>
                <div class="text-sm text-gray-600">{{ metric.label }}</div>
              </div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Left column: Project timeline -->
      <div class="lg:col-span-1">
        <Card>
          <template #title>Project Timeline</template>
          <template #content v-if="milestones.length > 0">
            <Timeline :value="milestones" align="left">
              <template #content="slotProps">
                <div class="text-sm">
                  <div class="font-bold mb-1">{{ slotProps.item.content }}</div>
                  <div class="text-gray-600 mb-1">{{ slotProps.item.date }}</div>
                  <div>{{ slotProps.item.detail }}</div>
                </div>
              </template>
              <template #opposite>
                <!-- Empty opposite slot to keep alignment -->
              </template>
              <template #marker="slotProps">
                <span :style="`color:${slotProps.item.color}`">
                  <i :class="slotProps.item.icon"></i>
                </span>
              </template>
            </Timeline>
          </template>
          <template #content v-else>
            <div class="text-center p-4 text-gray-500">
              <i class="pi pi-calendar text-3xl mb-3"></i>
              <p>No timeline information available</p>
            </div>
          </template>
        </Card>
      </div>
      
      <!-- Right column: Jobs table -->
      <div class="lg:col-span-3">
        <Card>
          <template #title>Project Jobs</template>
          <template #content>
            <DataTable 
              :value="jobs" 
              :loading="tableLoading"
              dataKey="id"
              stripedRows
              paginator 
              :rows="10" 
              :rowsPerPageOptions="[10, 25, 50]"
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="id" header="ID" sortable style="width: 80px">
                <template #body="{ data }">
                  <span class="font-semibold text-blue-600 dark:text-blue-400">{{ data.id }}</span>
                </template>
              </Column>
              
              <Column field="location.name" header="Location" sortable style="min-width: 200px">
                <template #body="{ data }">
                  <div 
                    class="cursor-pointer hover:text-blue-600" 
                    @click="navigateToJob(data)"
                  >
                    {{ data.location?.name }}
                  </div>
                </template>
              </Column>
              
              <Column field="status" header="Status" sortable style="min-width: 120px">
                <template #body="{ data }">
                  <Tag 
                    :value="data.status" 
                    :severity="getStatusSeverity(data.status)"
                  />
                </template>
              </Column>
              
              <Column field="completion_pct" header="Completion" sortable style="min-width: 150px">
                <template #body="{ data }">
                  <div>
                    <ProgressBar 
                      :value="data.completion_pct || 0" 
                      :showValue="false"
                      class="h-1.5 mb-1"
                    />
                    <span class="text-xs">{{ data.completion_pct || 0 }}%</span>
                  </div>
                </template>
              </Column>
              
              <Column field="visits_total" header="Visits" sortable style="min-width: 100px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <span class="text-green-600 font-medium">{{ data.visits_complete || 0 }}</span>
                    <span class="text-gray-500">/</span>
                    <span>{{ data.visits_total || 0 }}</span>
                  </div>
                </template>
              </Column>
              
              <Column field="scheduled_date" header="Scheduled" sortable style="min-width: 120px">
                <template #body="{ data }">
                  {{ formatDate(data.scheduled_date) }}
                </template>
              </Column>
              
              <Column header="Actions" style="width: 100px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button 
                      icon="pi pi-eye" 
                      class="p-button-text p-button-rounded p-button-sm"
                      @click="navigateToJob(data)"
                      aria-label="View"
                    />
                    <Button 
                      icon="pi pi-pencil" 
                      class="p-button-text p-button-rounded p-button-sm"
                      aria-label="Edit"
                    />
                  </div>
                </template>
              </Column>
              
              <template #empty>
                <div class="text-center p-4">
                  <p>No jobs found for this project.</p>
                </div>
              </template>
            </DataTable>
          </template>
        </Card>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="!project && loading" class="flex justify-center items-center p-8">
      <i class="pi pi-spin pi-spinner text-4xl"></i>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #495057;
}

:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #fcfcfc;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  cursor: default;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f5f7f9;
}

:deep(.dark .p-datatable .p-datatable-thead > tr > th) {
  background: #1e1e2d;
  color: #e0e0e0;
}

:deep(.dark .p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #2a2a3c;
}

:deep(.dark .p-datatable .p-datatable-tbody > tr:hover) {
  background: #31314a;
}
</style> 