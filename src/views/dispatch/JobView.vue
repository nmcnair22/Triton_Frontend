<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ProgressBar from 'primevue/progressbar';
import Breadcrumb from 'primevue/breadcrumb';
import Tag from 'primevue/tag';
import Chart from 'primevue/chart';
import Divider from 'primevue/divider';
import Timeline from 'primevue/timeline';

// Router and route
const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId;
const jobId = route.params.jobId;

// Breadcrumb navigation function
const navigateTo = (path) => {
  console.log('Navigating to:', path);
  router.push(path);
};

// Active tab state
const activeTab = ref('visits');

// Breadcrumb items
const breadcrumbItems = computed(() => [
  { label: 'Home', route: '/' },
  { label: 'Projects Dashboard', route: '/dashboard' },
  { label: `Project ${projectId}`, route: `/dashboard/projects/${projectId}` },
  { label: `Job Details` }
]);
const breadcrumbHome = { icon: 'pi pi-home', route: '/' };

// Mock data based on the provided JSON
const jobData = ref({
  job: {
    jobId: "6d815ec56dfb85e2182e01471c31e486",
    customer: "Flynn",
    location: "Hagerstown, MD",
    status: "In Progress",
    completionPct: 27,
    totalVisits: 11,
    revisitCount: 7,
    firstDate: "2025-02-04",
    lastDate: "2025-05-12",
    workSummary: "Network service with 3 completed visits and 5 attempted visits"
  },
  visits: [
    {
      visitId: "VG1",
      phaseName: "Site Survey",
      visitDate: "2025-02-04",
      status: "Completed",
      timeOnSiteMin: 27,
      revisitNeeded: false
    },
    {
      visitId: "VG2",
      phaseName: "Phase 1",
      visitDate: "2025-02-11",
      status: "Failed - Snow Storm",
      timeOnSiteMin: 0,
      revisitNeeded: true
    },
    {
      visitId: "VG3",
      phaseName: "P2",
      visitDate: "2025-02-12",
      status: "Cancelled - CIS",
      timeOnSiteMin: 0,
      revisitNeeded: true
    },
    {
      visitId: "VG4",
      phaseName: "Phase 1",
      visitDate: "2025-03-01",
      status: "Completed",
      timeOnSiteMin: 120,
      revisitNeeded: false
    },
    {
      visitId: "VG5",
      phaseName: "Phase 2",
      visitDate: "2025-03-15",
      status: "Completed",
      timeOnSiteMin: 180,
      revisitNeeded: false
    },
    {
      visitId: "VG6",
      phaseName: "Phase 3",
      visitDate: "2025-04-01",
      status: "Failed - Equipment",
      timeOnSiteMin: 45,
      revisitNeeded: true
    },
    {
      visitId: "VG7",
      phaseName: "Phase 3",
      visitDate: "2025-04-15",
      status: "Scheduled",
      timeOnSiteMin: null,
      revisitNeeded: false
    }
  ]
});

// Add additional mock data for other tabs
const jobIssues = ref([
  {
    issueId: "ISS-1001",
    title: "Site Not Ready",
    description: "Multiple visits impacted by site readiness issues",
    status: "Open",
    impact: "High",
    assignedTo: "Joel",
    createdAt: "2025-02-04T09:30:00Z",
    affectedVisits: ["VG1", "VG2", "VG3"]
  },
  {
    issueId: "ISS-1002",
    title: "Equipment Missing",
    description: "Required network equipment not available on site",
    status: "Open",
    impact: "Medium",
    assignedTo: "Sarah",
    createdAt: "2025-03-01T14:20:00Z",
    affectedVisits: ["VG6"]
  },
  {
    issueId: "ISS-1003",
    title: "Access Issues",
    description: "Technician couldn't access server room",
    status: "Resolved",
    impact: "Low",
    assignedTo: "Mike",
    createdAt: "2025-02-12T11:15:00Z",
    resolvedAt: "2025-02-13T09:45:00Z",
    affectedVisits: ["VG3"]
  }
]);

const timelineEvents = ref([
  {
    date: "2025-02-04",
    event: "Initial site survey completed",
    icon: "pi pi-check",
    color: "#4CAF50",
    details: "Technician Joel performed initial site survey"
  },
  {
    date: "2025-02-11",
    event: "Visit failed due to snow storm",
    icon: "pi pi-times",
    color: "#F44336",
    details: "Weather conditions prevented site access"
  },
  {
    date: "2025-02-12",
    event: "Visit cancelled by customer",
    icon: "pi pi-ban",
    color: "#FF9800",
    details: "Customer requested cancellation"
  },
  {
    date: "2025-03-01",
    event: "Phase 1 implementation completed",
    icon: "pi pi-check",
    color: "#4CAF50",
    details: "Network equipment installed"
  },
  {
    date: "2025-03-15",
    event: "Phase 2 implementation completed",
    icon: "pi pi-check",
    color: "#4CAF50",
    details: "Configuration and testing completed"
  },
  {
    date: "2025-04-01",
    event: "Phase 3 implementation failed",
    icon: "pi pi-times",
    color: "#F44336",
    details: "Missing equipment prevented completion"
  },
  {
    date: "2025-04-15",
    event: "Phase 3 implementation scheduled",
    icon: "pi pi-calendar",
    color: "#2196F3",
    details: "Final installation scheduled"
  }
]);

const materials = ref([
  {
    id: "MAT-001",
    name: "Cat6 Cable (1000ft)",
    quantity: 2,
    visitId: "VG4"
  },
  {
    id: "MAT-002",
    name: "Network Switch (48-port)",
    quantity: 1,
    visitId: "VG4"
  },
  {
    id: "MAT-003",
    name: "Patch Panel",
    quantity: 2,
    visitId: "VG5"
  },
  {
    id: "MAT-004",
    name: "Fiber Optic Cable (500ft)",
    quantity: 1,
    visitId: "VG5"
  }
]);

// Computed properties
const completedVisitsCount = computed(() => {
  return jobData.value.visits.filter(visit => visit.status === 'Completed').length;
});

const scheduledVisitsCount = computed(() => {
  return jobData.value.visits.filter(visit => visit.status === 'Scheduled').length;
});

const failedVisitsCount = computed(() => {
  return jobData.value.visits.filter(visit => visit.status.startsWith('Failed') || visit.status.startsWith('Cancelled')).length;
});

const openIssuesCount = computed(() => {
  return jobIssues.value.filter(issue => issue.status === 'Open').length;
});

const highImpactIssuesCount = computed(() => {
  return jobIssues.value.filter(issue => issue.impact === 'High' && issue.status === 'Open').length;
});

const averageTimeOnSite = computed(() => {
  const completedVisits = jobData.value.visits.filter(visit => visit.status === 'Completed' && visit.timeOnSiteMin > 0);
  if (completedVisits.length === 0) return 0;
  
  const totalTime = completedVisits.reduce((sum, visit) => sum + visit.timeOnSiteMin, 0);
  return Math.round(totalTime / completedVisits.length);
});

// Methods
const navigateToVisit = (visitId) => {
  router.push(`/dashboard/projects/${projectId}/jobs/${jobId}/visits/${visitId}`);
};

const getSeverity = (status) => {
  if (status.startsWith('Completed')) return 'success';
  if (status.startsWith('Failed') || status.startsWith('Cancelled')) return 'danger';
  if (status.startsWith('Scheduled')) return 'info';
  return 'warning';
};

const getImpactSeverity = (impact) => {
  switch (impact) {
    case 'High': return 'danger';
    case 'Medium': return 'warning';
    case 'Low': return 'info';
    default: return 'info';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatMinutes = (minutes) => {
  if (!minutes) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
};

// Initialize data
onMounted(() => {
  console.log('Job view mounted for job ID:', jobId);
  // In a real implementation, this would fetch job data from the API
});
</script>

<template>
  <div class="p-4">
    <!-- Breadcrumbs -->
    <Breadcrumb :model="breadcrumbItems" :home="breadcrumbHome" class="mb-4 border-none surface-ground">
      <template #item="{ item, props }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span v-if="item.icon" :class="[item.icon, 'text-color']"></span>
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else v-bind="props.action">
          <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>
    
    <!-- Job Header -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold">Job #{{ jobData.job.jobId.substring(0, 8) }}</h1>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ jobData.job.customer }}</span>
            <span class="text-gray-500">•</span>
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ jobData.job.location }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <Tag :value="jobData.job.status" :severity="getSeverity(jobData.job.status)" class="text-sm" />
          <Button icon="pi pi-file-pdf" label="Export Report" outlined size="small" />
        </div>
      </div>
      
      <div class="mt-4">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold">Job Completion</span>
          <span class="font-semibold">{{ jobData.job.completionPct }}%</span>
        </div>
        <ProgressBar :value="jobData.job.completionPct" class="h-2" />
      </div>
      
      <p class="mt-4 text-gray-700 dark:text-gray-300">{{ jobData.job.workSummary }}</p>
      
      <div class="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span class="font-medium">First Visit:</span> {{ formatDate(jobData.job.firstDate) }}
        </div>
        <div>
          <span class="font-medium">Last Visit:</span> {{ formatDate(jobData.job.lastDate) }}
        </div>
        <div>
          <span class="font-medium">Total Visits:</span> {{ jobData.job.totalVisits }}
        </div>
        <div>
          <span class="font-medium">Revisit Count:</span> {{ jobData.job.revisitCount }}
        </div>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <!-- Completed Visits -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Completed Visits</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ completedVisitsCount }}</div>
          <div class="text-sm text-gray-600 mt-1">
            of {{ jobData.job.totalVisits }} total visits
          </div>
        </template>
      </Card>
      
      <!-- Scheduled Visits -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-500"></i>
            <span>Scheduled Visits</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ scheduledVisitsCount }}</div>
        </template>
      </Card>
      
      <!-- Failed/Cancelled Visits -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-times-circle text-red-500"></i>
            <span>Failed Visits</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ failedVisitsCount }}</div>
        </template>
      </Card>
      
      <!-- Open Issues -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-circle text-yellow-500"></i>
            <span>Open Issues</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ openIssuesCount }}</div>
          <div class="text-sm text-red-600 mt-1" v-if="highImpactIssuesCount > 0">
            {{ highImpactIssuesCount }} high-impact
          </div>
        </template>
      </Card>
      
      <!-- Average Time on Site -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-clock text-purple-500"></i>
            <span>Avg Time on Site</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ formatMinutes(averageTimeOnSite) }}</div>
          <div class="text-sm text-gray-600 mt-1">
            per completed visit
          </div>
        </template>
      </Card>
      
      <!-- Completion % -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-line text-cyan-500"></i>
            <span>Completion</span>
          </div>
        </template>
        <template #content>
          <div class="text-3xl font-bold">{{ jobData.job.completionPct }}%</div>
          <div class="flex mt-1">
            <ProgressBar :value="jobData.job.completionPct" class="h-2 w-full" />
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Tabbed Content -->
    <div class="bg-white dark:bg-surface-900 rounded-lg shadow">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="visits">Visits</Tab>
          <Tab value="timeline">Timeline</Tab>
          <Tab value="issues">Issues</Tab>
          <Tab value="materials">Materials</Tab>
        </TabList>
        <TabPanels>
          <!-- Visits Tab -->
          <TabPanel value="visits">
            <DataTable 
              :value="jobData.visits" 
              :paginator="true" 
              :rows="10"
              sortField="visitDate"
              :sortOrder="-1"
              stripedRows 
              responsiveLayout="scroll"
              class="p-datatable-sm"
              dataKey="visitId"
              @row-click="event => navigateToVisit(event.data.visitId)"
            >
              <Column field="visitId" header="Visit ID" sortable style="width: 10%"></Column>
              <Column field="phaseName" header="Phase" sortable style="width: 15%"></Column>
              <Column field="visitDate" header="Date" sortable style="width: 15%">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.visitDate) }}
                </template>
              </Column>
              <Column field="status" header="Status" sortable style="width: 20%">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column field="timeOnSiteMin" header="Time on Site" sortable style="width: 15%">
                <template #body="slotProps">
                  {{ formatMinutes(slotProps.data.timeOnSiteMin) }}
                </template>
              </Column>
              <Column field="revisitNeeded" header="Revisit Needed" sortable style="width: 15%">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.revisitNeeded" severity="warning" value="Yes" />
                  <Tag v-else severity="success" value="No" />
                </template>
              </Column>
              <Column style="width: 10%">
                <template #body="slotProps">
                  <Button icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" @click.stop="navigateToVisit(slotProps.data.visitId)" />
                </template>
              </Column>
            </DataTable>
          </TabPanel>
          
          <!-- Timeline Tab -->
          <TabPanel value="timeline">
            <div class="p-4">
              <Timeline :value="timelineEvents" layout="vertical" class="w-full">
                <template #content="slotProps">
                  <div class="flex flex-col">
                    <span class="font-bold mb-1">{{ slotProps.item.event }}</span>
                    <span class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ formatDate(slotProps.item.date) }}</span>
                    <p class="text-sm m-0">{{ slotProps.item.details }}</p>
                  </div>
                </template>
                <template #opposite="slotProps">
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(slotProps.item.date) }}
                  </div>
                </template>
                <template #marker="slotProps">
                  <div class="flex items-center justify-center w-8 h-8 border-2 border-white dark:border-surface-900 rounded-full" :style="{ backgroundColor: slotProps.item.color }">
                    <i :class="[slotProps.item.icon, 'text-white text-lg']"></i>
                  </div>
                </template>
              </Timeline>
            </div>
          </TabPanel>
          
          <!-- Issues Tab -->
          <TabPanel value="issues">
            <DataTable 
              :value="jobIssues" 
              :paginator="true" 
              :rows="10"
              stripedRows 
              responsiveLayout="scroll"
              class="p-datatable-sm"
              dataKey="issueId"
            >
              <Column field="issueId" header="ID" sortable style="width: 10%"></Column>
              <Column field="title" header="Title" sortable style="width: 20%"></Column>
              <Column field="description" header="Description" style="width: 25%"></Column>
              <Column field="status" header="Status" sortable style="width: 10%">
                <template #body="slotProps">
                  <Tag 
                    :value="slotProps.data.status" 
                    :severity="slotProps.data.status === 'Open' ? 'danger' : 'success'" 
                  />
                </template>
              </Column>
              <Column field="impact" header="Impact" sortable style="width: 10%">
                <template #body="slotProps">
                  <Tag 
                    :value="slotProps.data.impact" 
                    :severity="getImpactSeverity(slotProps.data.impact)" 
                  />
                </template>
              </Column>
              <Column field="assignedTo" header="Assigned To" sortable style="width: 15%"></Column>
              <Column field="affectedVisits" header="Affected Visits" style="width: 10%">
                <template #body="slotProps">
                  <div class="flex flex-wrap gap-1">
                    <Tag 
                      v-for="visitId in slotProps.data.affectedVisits" 
                      :key="visitId" 
                      :value="visitId" 
                      severity="info"
                      class="text-xs"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
          
          <!-- Materials Tab -->
          <TabPanel value="materials">
            <DataTable 
              :value="materials" 
              :paginator="true" 
              :rows="10"
              stripedRows 
              responsiveLayout="scroll"
              class="p-datatable-sm"
              dataKey="id"
            >
              <Column field="id" header="ID" sortable style="width: 15%"></Column>
              <Column field="name" header="Material" sortable style="width: 45%"></Column>
              <Column field="quantity" header="Qty" sortable style="width: 15%"></Column>
              <Column field="visitId" header="Used On Visit" sortable style="width: 25%"></Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles if needed */
:deep(.p-card .p-card-title) {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

:deep(.p-card .p-card-content) {
  padding-top: 0;
}

:deep(.p-progress-bar) {
  height: 0.5rem;
}

:deep(.p-tabs-nav) {
  border-bottom: 1px solid var(--surface-200);
}

:deep(.p-tabs-header-action) {
  padding: 1rem 1.25rem;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: var(--surface-100);
}

:deep(.p-timeline) {
  margin-left: 1rem;
}
</style> 