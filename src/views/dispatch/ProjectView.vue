<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tabs from 'primevue/tabs';
import Tab from 'primevue/tab';
import ProgressBar from 'primevue/progressbar';
import Breadcrumb from 'primevue/breadcrumb';
import Tag from 'primevue/tag';
import Chart from 'primevue/chart';
import Divider from 'primevue/divider';
import { useDispatchStore } from '@/stores/dispatchStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';

// Router and route
const route = useRoute();
const router = useRouter();
const toast = useToast();
const projectId = route.params.projectId;

// Initialize the dispatch store
const dispatchStore = useDispatchStore();
const { currentProject, loading, error } = storeToRefs(dispatchStore);

// Loading state
const isLoading = computed(() => loading.value);

// Breadcrumb navigation function
const navigateTo = (path) => {
  console.log('[DEBUG] ProjectView: Navigating to', path);
  router.push(path);
};

// Breadcrumb items
const breadcrumbItems = computed(() => [
  { label: 'Home', route: '/' },
  { label: 'Projects Dashboard', route: '/dashboard' },
  { label: projectData.value.project?.name || `Project ${projectId}` }
]);
const breadcrumbHome = { icon: 'pi pi-home', route: '/' };

// Project data from store
const projectData = computed(() => {
  // If we don't have data yet, return an empty structure
  if (!currentProject.value) {
    return {
      project: {
        projectId: projectId,
        name: `Project ${projectId}`,
        customer: '',
        siteCount: 0,
        completedSites: 0,
        inProgressSites: 0,
        notStartedSites: 0,
        completionPct: 0,
        trend: ''
      },
      kpis: {
        visitsCompleted: 0,
        visitsScheduled: 0,
        totalVisits: 0,
        issuesOpen: 0,
        issuesHighImpact: 0,
        totalIssues: 0,
        last24h: {
          newIssues: 0,
          completedVisits: 0,
          scheduledVisits: 0
        }
      },
      sitesNeedingAttention: [],
      priorityIssues: [],
      projectTrends: [],
      issueAnalysis: {
        byType: [],
        bySiteStatus: []
      }
    };
  }
  
  // Return the store data in the format the template expects
  return {
    project: {
      projectId: currentProject.value.id || projectId,
      name: currentProject.value.name || `Project ${projectId}`,
      customer: currentProject.value.customer_name || '',
      siteCount: currentProject.value.site_count || 0,
      completedSites: currentProject.value.completed_sites || 0,
      inProgressSites: currentProject.value.in_progress_sites || 0,
      notStartedSites: currentProject.value.not_started_sites || 0,
      completionPct: currentProject.value.completion_percentage || 0,
      trend: currentProject.value.trend || ''
    },
    kpis: {
      visitsCompleted: currentProject.value.kpis?.visits_completed || 0,
      visitsScheduled: currentProject.value.kpis?.visits_scheduled || 0,
      totalVisits: currentProject.value.kpis?.total_visits || 0,
      issuesOpen: currentProject.value.kpis?.issues_open || 0,
      issuesHighImpact: currentProject.value.kpis?.issues_high_impact || 0,
      totalIssues: currentProject.value.kpis?.total_issues || 0,
      last24h: {
        newIssues: currentProject.value.kpis?.last_24h?.new_issues || 0,
        completedVisits: currentProject.value.kpis?.last_24h?.completed_visits || 0,
        scheduledVisits: currentProject.value.kpis?.last_24h?.scheduled_visits || 0
      }
    },
    sitesNeedingAttention: currentProject.value.sites_needing_attention || [],
    priorityIssues: currentProject.value.priority_issues || [],
    projectTrends: currentProject.value.project_trends || [],
    issueAnalysis: {
      byType: currentProject.value.issue_analysis?.by_type || [],
      bySiteStatus: currentProject.value.issue_analysis?.by_site_status || []
    }
  };
});

// Chart Data
const trendChartData = computed(() => {
  const dates = projectData.value.projectTrends.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  return {
    labels: dates,
    datasets: [
      {
        label: 'Completion %',
        yAxisID: 'y',
        data: projectData.value.projectTrends.map(item => item.completionPct || item.completion_pct),
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        type: 'line',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Issues',
        yAxisID: 'y1',
        data: projectData.value.projectTrends.map(item => item.issuesCount || item.issues_count),
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderWidth: 1
      },
      {
        label: 'Visits',
        yAxisID: 'y1',
        data: projectData.value.projectTrends.map(item => item.visitsCount || item.visits_count),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderWidth: 1
      }
    ]
  };
});

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Completion %'
      },
      min: 0,
      max: 100
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Count'
      },
      grid: {
        drawOnChartArea: false
      },
      min: 0
    }
  }
};

// Issue Type Chart
const issueTypeChartData = computed(() => {
  return {
    labels: projectData.value.issueAnalysis.byType.map(item => item.type),
    datasets: [
      {
        data: projectData.value.issueAnalysis.byType.map(item => item.count),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }
    ]
  };
});

const issueTypeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right'
    }
  }
};

// Site Status Chart
const siteStatusChartData = computed(() => {
  return {
    labels: projectData.value.issueAnalysis.bySiteStatus.map(item => item.status),
    datasets: [
      {
        data: projectData.value.issueAnalysis.bySiteStatus.map(item => item.count),
        backgroundColor: [
          '#4BC0C0', // Completed - green
          '#FFCE56'  // In Progress - yellow
        ]
      }
    ]
  };
});

const siteStatusChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

// Methods
const navigateToJob = (jobId) => {
  console.log('[DEBUG] ProjectView: Navigating to job', jobId);
  router.push(`/dashboard/projects/${projectId}/jobs/${jobId}`);
};

const fetchProjectData = async () => {
  console.log('[DEBUG] ProjectView: Fetching project data for ID:', projectId);
  try {
    await dispatchStore.fetchProject(projectId);
    console.log('[DEBUG] ProjectView: Project data fetched successfully:', 
      currentProject.value ? currentProject.value.name : 'No data');
  } catch (err) {
    console.error('[DEBUG] ProjectView: Error fetching project data:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load project data',
      life: 3000
    });
  }
};

const getSeverity = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return 'success';
    case 'in progress': return 'info';
    case 'not started': return 'warning';
    case 'at risk': return 'danger';
    case 'improving': return 'success';
    case 'steady': return 'info';
    case 'declining': return 'warning';
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

const formatAgeDays = (days) => {
  if (days === 1) return '1 day';
  return `${days} days`;
};

// Watch for route changes
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId && newProjectId !== projectId) {
    console.log('[DEBUG] ProjectView: Project ID changed, fetching new data:', newProjectId);
    fetchProjectData();
  }
});

// Initialize data
onMounted(() => {
  console.log('[DEBUG] ProjectView: Component mounted for project ID:', projectId);
  fetchProjectData();
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
    
    <!-- Project Header -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold">{{ projectData.project.name }}</h1>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ projectData.project.customer }}</span>
            <span class="text-gray-500">•</span>
            <span class="text-lg text-gray-700 dark:text-gray-300">Project #{{ projectData.project.projectId }}</span>
            <span class="text-gray-500">•</span>
            <span class="text-lg text-gray-700 dark:text-gray-300">{{ projectData.project.siteCount }} {{ projectData.project.siteCount > 1 ? 'Sites' : 'Site' }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <Tag :value="projectData.project.trend" :severity="getSeverity(projectData.project.trend)" class="text-sm" />
          <Button icon="pi pi-file-pdf" label="Export Report" outlined size="small" />
        </div>
      </div>
      
      <div class="mt-4">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold">Project Completion</span>
          <span class="font-semibold">{{ projectData.project.completionPct }}%</span>
        </div>
        <ProgressBar :value="projectData.project.completionPct" class="h-2" />
      </div>
    </div>
    
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Sites Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-map-marker text-blue-500"></i>
            <span>Sites</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">{{ projectData.project.completedSites }}</div>
              <div class="text-xs text-gray-600">Completed</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">{{ projectData.project.inProgressSites }}</div>
              <div class="text-xs text-gray-600">In Progress</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-yellow-600">{{ projectData.project.notStartedSites }}</div>
              <div class="text-xs text-gray-600">Not Started</div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Visits Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-purple-500"></i>
            <span>Visits</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">{{ projectData.kpis.visitsCompleted }}</div>
              <div class="text-xs text-gray-600">Completed</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">{{ projectData.kpis.visitsScheduled }}</div>
              <div class="text-xs text-gray-600">Scheduled</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-gray-600">{{ projectData.kpis.totalVisits }}</div>
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
              <div class="text-xl font-bold text-yellow-600">{{ projectData.kpis.issuesOpen }}</div>
              <div class="text-xs text-gray-600">Open</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-red-600">{{ projectData.kpis.issuesHighImpact }}</div>
              <div class="text-xs text-gray-600">High Impact</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-gray-600">{{ projectData.kpis.totalIssues }}</div>
              <div class="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </template>
      </Card>
      
      <!-- Last 24h Card -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-clock text-cyan-500"></i>
            <span>Last 24 Hours</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center">
              <div class="text-xl font-bold text-red-600">{{ projectData.kpis.last24h.newIssues }}</div>
              <div class="text-xs text-gray-600">New Issues</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">{{ projectData.kpis.last24h.completedVisits }}</div>
              <div class="text-xs text-gray-600">Completed</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-blue-600">{{ projectData.kpis.last24h.scheduledVisits }}</div>
              <div class="text-xs text-gray-600">Scheduled</div>
            </div>
          </div>
        </template>
      </Card>
    </div>
    
    <!-- Mid-row Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Sites Needing Attention -->
      <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Sites Needing Attention</h2>
        
        <div v-for="site in projectData.sitesNeedingAttention" :key="site.jobId" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3 hover:bg-gray-50 dark:hover:bg-surface-700 cursor-pointer" @click="navigateToJob(site.jobId)">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="font-bold">{{ site.location }}</h3>
              <div class="flex items-center mt-1">
                <Tag :value="site.status" :severity="getSeverity(site.status)" class="mr-2" />
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ site.completionPct }}% Complete</span>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-semibold">{{ site.visitsCompleted }}</span> / {{ site.visitsTotal }} Visits
              </div>
              <div class="text-sm text-red-600 dark:text-red-400 mt-1">
                <span class="font-semibold">{{ site.openIssues }}</span> Open Issues
              </div>
            </div>
          </div>
          
          <ProgressBar :value="site.completionPct" class="h-2 mb-2" />
          
          <div class="flex justify-between items-center mt-2">
            <div class="text-sm">
              <span class="text-blue-600 dark:text-blue-400">{{ site.scheduled }}</span> visits scheduled
            </div>
            <div class="text-sm text-red-600 dark:text-red-400" v-if="site.highImpact > 0">
              {{ site.highImpact }} high-impact {{ site.highImpact === 1 ? 'issue' : 'issues' }}
            </div>
          </div>
        </div>
        
        <div v-if="projectData.sitesNeedingAttention.length === 0" class="text-center py-8 text-gray-500">
          No sites currently need attention
        </div>
      </div>
      
      <!-- Priority Issues -->
      <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Priority Issues</h2>
        
        <div v-for="issue in projectData.priorityIssues" :key="issue.issueId" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
          <div class="flex items-start gap-3 mb-2">
            <div class="flex-shrink-0 mt-1">
              <i class="pi pi-exclamation-triangle text-red-500 text-lg"></i>
            </div>
            <div class="flex-grow">
              <div class="flex items-center justify-between">
                <h3 class="font-bold">{{ issue.title }}</h3>
                <Tag :value="issue.impact" :severity="getImpactSeverity(issue.impact)" />
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ issue.description }}</p>
            </div>
          </div>
          
          <Divider class="my-2" />
          
          <div class="flex flex-wrap justify-between items-center">
            <div class="flex items-center gap-2">
              <Tag :value="issue.status" :severity="getSeverity(issue.status)" />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Age: {{ formatAgeDays(issue.ageDays) }}
              </span>
            </div>
            <div>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Assigned to: <span class="font-medium">{{ issue.assignedTo }}</span>
              </span>
            </div>
          </div>
          
          <div v-if="issue.visitIds && issue.visitIds.length > 0" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Affected visits: {{ issue.visitIds.join(', ') }}
          </div>
        </div>
        
        <div v-if="projectData.priorityIssues.length === 0" class="text-center py-8 text-gray-500">
          No priority issues at this time
        </div>
      </div>
    </div>
    
    <!-- Charts and Analytics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Project Trends Chart -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Project Trends</h2>
        <div style="height: 300px">
          <Chart type="bar" :data="trendChartData" :options="trendChartOptions" />
        </div>
      </div>
      
      <!-- Issue Analysis -->
      <div class="bg-white dark:bg-surface-900 p-4 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Issue Analysis</h2>
        
        <h3 class="font-medium text-sm mb-2">Issues by Type</h3>
        <div style="height: 180px">
          <Chart type="pie" :data="issueTypeChartData" :options="issueTypeChartOptions" />
        </div>
        
        <Divider />
        
        <h3 class="font-medium text-sm mb-2">Issues by Site Status</h3>
        <div style="height: 180px">
          <Chart type="doughnut" :data="siteStatusChartData" :options="siteStatusChartOptions" />
        </div>
      </div>
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

:deep(.p-divider.p-divider-horizontal) {
  margin: 0.5rem 0;
}

:deep(.p-tabview-panels) {
  padding: 1.25rem 0 0 0;
}
</style> 