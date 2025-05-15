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
    projectId: "3912",
    location: "Hagerstown, MD",
    status: "In Progress",
    completionPct: 27.0,
    startDate: "2025-02-04",
    estimatedEndDate: "2025-06-15",
    assignedManager: "Joel Smith",
    notes: "Client requested expedited installation for main system",
    siteName: "Flynn Store #1242"
  },
  kpis: {
    visitsCompleted: 3,
    visitsScheduled: 1,
    totalVisits: 11,
    issuesOpen: 11,
    issuesHighImpact: 2,
    issuesResolved: 1,
    materialsUsed: 27,
    materialsOrdered: 42
  },
  visits: [
    {
      visitId: "VG1",
      date: "2025-02-04",
      status: "Completed",
      technicianName: "Mike Johnson",
      duration: 4.5,
      tasksCompleted: 3,
      tasksTotal: 3,
      hasIssues: true
    },
    {
      visitId: "VG2",
      date: "2025-02-18",
      status: "Completed",
      technicianName: "Sarah Williams",
      duration: 6.0,
      tasksCompleted: 4,
      tasksTotal: 4,
      hasIssues: true
    },
    {
      visitId: "VG3",
      date: "2025-03-01",
      status: "Completed",
      technicianName: "Mike Johnson",
      duration: 3.0,
      tasksCompleted: 2,
      tasksTotal: 2,
      hasIssues: true
    },
    {
      visitId: "VG4",
      date: "2025-03-15",
      status: "Scheduled",
      technicianName: "David Chen",
      duration: null,
      tasksCompleted: 0,
      tasksTotal: 5,
      hasIssues: false
    },
    {
      visitId: "VG5",
      date: "2025-04-01",
      status: "Not Started",
      technicianName: null,
      duration: null,
      tasksCompleted: 0,
      tasksTotal: 4,
      hasIssues: false
    },
    {
      visitId: "VG6",
      date: "2025-04-15",
      status: "Not Started",
      technicianName: null,
      duration: null,
      tasksCompleted: 0,
      tasksTotal: 3,
      hasIssues: false
    },
    {
      visitId: "VG7",
      date: "2025-05-01",
      status: "Not Started",
      technicianName: null,
      duration: null,
      tasksCompleted: 0,
      tasksTotal: 6,
      hasIssues: false
    }
  ],
  timeline: [
    {
      date: "2025-02-04",
      status: "Visit Completed",
      details: "Initial site assessment completed by Mike Johnson",
      icon: "pi pi-check-circle",
      color: "#4caf50"
    },
    {
      date: "2025-02-04",
      status: "Issue Reported",
      details: "Site not ready for equipment installation",
      icon: "pi pi-exclamation-triangle",
      color: "#ff9800"
    },
    {
      date: "2025-02-18",
      status: "Visit Completed",
      details: "Network cabling installation by Sarah Williams",
      icon: "pi pi-check-circle",
      color: "#4caf50"
    },
    {
      date: "2025-03-01",
      status: "Visit Completed",
      details: "Equipment delivery and initial setup by Mike Johnson",
      icon: "pi pi-check-circle",
      color: "#4caf50"
    },
    {
      date: "2025-03-15",
      status: "Visit Scheduled",
      details: "System configuration and testing by David Chen",
      icon: "pi pi-calendar",
      color: "#2196f3"
    }
  ],
  issues: [
    {
      issueId: "ISS-1001",
      title: "Site Not Ready",
      description: "The site was not prepared according to pre-installation requirements. Missing power outlets and network drops.",
      status: "Open",
      impact: "High",
      reportedDate: "2025-02-04",
      assignedTo: "Joel Smith"
    },
    {
      issueId: "ISS-1002",
      title: "Missing Equipment",
      description: "Network switch model CX-4500 was not delivered with the main equipment shipment.",
      status: "Open",
      impact: "Medium",
      reportedDate: "2025-03-01",
      assignedTo: "Procurement Team"
    },
    {
      issueId: "ISS-1003",
      title: "Incorrect Specifications",
      description: "The provided specifications for the server rack are incorrect. Need updated measurements.",
      status: "Resolved",
      impact: "Low",
      reportedDate: "2025-02-18",
      resolvedDate: "2025-02-25",
      resolvedBy: "Sarah Williams"
    }
  ],
  materials: [
    {
      materialId: "MAT-2001",
      name: "Network Cable Cat6",
      quantity: 500,
      unit: "feet",
      status: "Used",
      dateUsed: "2025-02-18"
    },
    {
      materialId: "MAT-2002",
      name: "Server Rack 42U",
      quantity: 1,
      unit: "piece",
      status: "Delivered",
      dateDelivered: "2025-03-01"
    },
    {
      materialId: "MAT-2003",
      name: "Network Switch CX-4500",
      quantity: 1,
      unit: "piece",
      status: "Ordered",
      dateOrdered: "2025-02-10"
    },
    {
      materialId: "MAT-2004",
      name: "Fiber Optic Cable",
      quantity: 100,
      unit: "feet",
      status: "Ordered",
      dateOrdered: "2025-02-10"
    }
  ]
});

// Chart Data
const progressChartData = computed(() => {
  return {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [jobData.value.job.completionPct, 100 - jobData.value.job.completionPct],
        backgroundColor: ['#4caf50', '#eceff1'],
        hoverBackgroundColor: ['#66bb6a', '#cfd8dc']
      }
    ]
  };
});

const progressChartOptions = {
  cutout: '70%',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.label + ': ' + context.raw + '%';
        }
      }
    }
  }
};

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatHours = (hours) => {
  if (hours === null || hours === undefined) return '-';
  return hours + (hours === 1 ? ' hour' : ' hours');
};

const getSeverity = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'success';
    case 'in progress': return 'info';
    case 'scheduled': return 'info';
    case 'not started': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'info';
  }
};

const getImpactSeverity = (impact) => {
  switch (impact?.toLowerCase()) {
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'info';
  }
};

const getIssueSeverity = (status) => {
  switch (status?.toLowerCase()) {
    case 'resolved': return 'success';
    case 'in progress': return 'info';
    case 'open': return 'danger';
    default: return 'info';
  }
};

const getMaterialStatusSeverity = (status) => {
  switch (status?.toLowerCase()) {
    case 'used': return 'success';
    case 'delivered': return 'info';
    case 'ordered': return 'warning';
    default: return 'info';
  }
};

const navigateToVisit = (visitId) => {
  router.push(`/dashboard/projects/${projectId}/jobs/${jobId}/visits/${visitId}`);
};

// Initialize data
onMounted(() => {
  console.log('Job view mounted for job ID:', jobId);
  // In a real implementation, this would fetch job data from the API using the jobId
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
          <h1 class="text-3xl font-bold mb-1">{{ jobData.job.siteName }}</h1>
          <div class="flex items-center gap-2">
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ jobData.job.location }}</span>
            <span class="text-gray-500">•</span>
            <span class="text-lg text-gray-700 dark:text-gray-300">Job #{{ jobData.job.jobId.substring(0, 8) }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <Tag :value="jobData.job.status" :severity="getSeverity(jobData.job.status)" />
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
    </div>
    
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Visits Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-500"></i>
            <span>Visits</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">{{ jobData.kpis.visitsCompleted }}</div>
              <div class="text-xs text-gray-600">Completed</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">{{ jobData.kpis.visitsScheduled }}</div>
              <div class="text-xs text-gray-600">Scheduled</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-gray-600">{{ jobData.kpis.totalVisits }}</div>
              <div class="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Issues Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-circle text-yellow-500"></i>
            <span>Issues</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center">
              <div class="text-xl font-bold text-red-600">{{ jobData.kpis.issuesOpen }}</div>
              <div class="text-xs text-gray-600">Open</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-red-600">{{ jobData.kpis.issuesHighImpact }}</div>
              <div class="text-xs text-gray-600">High Impact</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">{{ jobData.kpis.issuesResolved }}</div>
              <div class="text-xs text-gray-600">Resolved</div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Materials Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-box text-purple-500"></i>
            <span>Materials</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-2">
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">{{ jobData.kpis.materialsUsed }}</div>
              <div class="text-xs text-gray-600">Used</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">{{ jobData.kpis.materialsOrdered }}</div>
              <div class="text-xs text-gray-600">Ordered</div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Progress Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-pie text-cyan-500"></i>
            <span>Progress</span>
          </div>
        </template>
        <template #content>
          <div class="flex justify-center">
            <div style="width: 100px; height: 100px">
              <Chart type="doughnut" :data="progressChartData" :options="progressChartOptions" />
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Job Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Left Column -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Job Details</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="mb-3">
              <span class="block text-sm text-gray-500">Project ID</span>
              <span class="font-medium">{{ jobData.job.projectId }}</span>
            </div>
            <div class="mb-3">
              <span class="block text-sm text-gray-500">Start Date</span>
              <span class="font-medium">{{ formatDate(jobData.job.startDate) }}</span>
            </div>
            <div class="mb-3">
              <span class="block text-sm text-gray-500">Estimated End Date</span>
              <span class="font-medium">{{ formatDate(jobData.job.estimatedEndDate) }}</span>
            </div>
          </div>
          <div>
            <div class="mb-3">
              <span class="block text-sm text-gray-500">Status</span>
              <Tag :value="jobData.job.status" :severity="getSeverity(jobData.job.status)" />
            </div>
            <div class="mb-3">
              <span class="block text-sm text-gray-500">Assigned Manager</span>
              <span class="font-medium">{{ jobData.job.assignedManager }}</span>
            </div>
            <div class="mb-3">
              <span class="block text-sm text-gray-500">Completion</span>
              <span class="font-medium">{{ jobData.job.completionPct }}%</span>
            </div>
          </div>
        </div>
        
        <Divider />
        
        <div class="mb-3">
          <span class="block text-sm text-gray-500 mb-1">Notes</span>
          <p>{{ jobData.job.notes }}</p>
        </div>
      </div>
      
      <!-- Right Column - Timeline Preview -->
      <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Recent Activity</h2>
        
        <Timeline :value="jobData.timeline.slice(0, 3)" class="customized-timeline">
          <template #content="slotProps">
            <div class="flex flex-col">
              <small class="text-gray-500">{{ formatDate(slotProps.item.date) }}</small>
              <span class="font-medium">{{ slotProps.item.status }}</span>
              <p class="text-sm text-gray-600">{{ slotProps.item.details }}</p>
            </div>
          </template>
          <template #opposite>
            <span></span>
          </template>
          <template #marker="slotProps">
            <span class="flex w-8 h-8 items-center justify-center rounded-full" :style="{ backgroundColor: slotProps.item.color }">
              <i :class="slotProps.item.icon" class="text-white text-sm"></i>
            </span>
          </template>
        </Timeline>
      </div>
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
              :rows="5"
              stripedRows 
              responsiveLayout="scroll"
              class="p-datatable-sm"
              @row-click="event => navigateToVisit(event.data.visitId)"
            >
              <Column field="visitId" header="Visit ID" style="width: 10%"></Column>
              <Column field="date" header="Date" style="width: 15%">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.date) }}
                </template>
              </Column>
              <Column field="status" header="Status" style="width: 15%">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column field="technicianName" header="Technician" style="width: 20%">
                <template #body="slotProps">
                  {{ slotProps.data.technicianName || 'Not assigned' }}
                </template>
              </Column>
              <Column field="duration" header="Duration" style="width: 15%">
                <template #body="slotProps">
                  {{ formatHours(slotProps.data.duration) }}
                </template>
              </Column>
              <Column field="tasksCompleted" header="Tasks" style="width: 15%">
                <template #body="slotProps">
                  {{ slotProps.data.tasksCompleted }}/{{ slotProps.data.tasksTotal }}
                </template>
              </Column>
              <Column field="hasIssues" header="Issues" style="width: 10%">
                <template #body="slotProps">
                  <i v-if="slotProps.data.hasIssues" class="pi pi-exclamation-triangle text-yellow-500"></i>
                  <i v-else class="pi pi-check-circle text-green-500"></i>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
          
          <!-- Timeline Tab -->
          <TabPanel value="timeline">
            <Timeline :value="jobData.timeline" class="customized-timeline">
              <template #content="slotProps">
                <div class="flex flex-col">
                  <small class="text-gray-500">{{ formatDate(slotProps.item.date) }}</small>
                  <span class="font-medium">{{ slotProps.item.status }}</span>
                  <p class="text-sm text-gray-600">{{ slotProps.item.details }}</p>
                </div>
              </template>
              <template #opposite>
                <span></span>
              </template>
              <template #marker="slotProps">
                <span class="flex w-8 h-8 items-center justify-center rounded-full" :style="{ backgroundColor: slotProps.item.color }">
                  <i :class="slotProps.item.icon" class="text-white text-sm"></i>
                </span>
              </template>
            </Timeline>
          </TabPanel>
          
          <!-- Issues Tab -->
          <TabPanel value="issues">
            <div v-for="issue in jobData.issues" :key="issue.issueId" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Tag :value="issue.impact" :severity="getImpactSeverity(issue.impact)" />
                  <h3 class="font-bold text-lg">{{ issue.title }}</h3>
                </div>
                <Tag :value="issue.status" :severity="getIssueSeverity(issue.status)" />
              </div>
              
              <p class="text-gray-700 dark:text-gray-300 mb-3">{{ issue.description }}</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="block text-gray-500">Issue ID</span>
                  <span>{{ issue.issueId }}</span>
                </div>
                <div>
                  <span class="block text-gray-500">Reported Date</span>
                  <span>{{ formatDate(issue.reportedDate) }}</span>
                </div>
                <div>
                  <span class="block text-gray-500">Assigned To</span>
                  <span>{{ issue.assignedTo }}</span>
                </div>
                <div v-if="issue.status === 'Resolved'">
                  <span class="block text-gray-500">Resolved Date</span>
                  <span>{{ formatDate(issue.resolvedDate) }}</span>
                </div>
                <div v-if="issue.status === 'Resolved'">
                  <span class="block text-gray-500">Resolved By</span>
                  <span>{{ issue.resolvedBy }}</span>
                </div>
              </div>
            </div>
          </TabPanel>
          
          <!-- Materials Tab -->
          <TabPanel value="materials">
            <DataTable 
              :value="jobData.materials" 
              :paginator="true" 
              :rows="5"
              stripedRows 
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="materialId" header="Material ID" style="width: 15%"></Column>
              <Column field="name" header="Name" style="width: 25%"></Column>
              <Column field="quantity" header="Quantity" style="width: 15%">
                <template #body="slotProps">
                  {{ slotProps.data.quantity }} {{ slotProps.data.unit }}
                </template>
              </Column>
              <Column field="status" header="Status" style="width: 15%">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="getMaterialStatusSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column field="dateUsed" header="Date" style="width: 20%">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.dateUsed || slotProps.data.dateDelivered || slotProps.data.dateOrdered) }}
                </template>
              </Column>
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