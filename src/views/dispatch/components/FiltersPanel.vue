<template>
  <div class="filter-panel-container" :class="{ 'expanded': isExpanded }">
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-4">
        <h3 class="m-0 text-lg font-semibold">Advanced Filters</h3>
        <Button icon="pi pi-times" text rounded @click="closePanel" />
      </div>
      
      <div class="grid grid-cols-12 gap-4">
        <!-- Client Filter -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <span class="p-float-label w-full">
            <Select v-model="filters.clientId" 
              :options="clientOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              filter
              :loading="loadingClients"
              placeholder="Select a client"
              inputId="client-filter" />
            <label for="client-filter">Client</label>
          </span>
        </div>
        
        <!-- Project Filter -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <span class="p-float-label w-full">
            <Select v-model="filters.projectName" 
              :options="projectOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              filter
              :loading="loadingProjects"
              placeholder="Select a project"
              inputId="project-filter" />
            <label for="project-filter">Project</label>
          </span>
        </div>
        
        <!-- Status Filter -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <span class="p-float-label w-full">
            <Select v-model="filters.status" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              placeholder="Select a status"
              inputId="status-filter" />
            <label for="status-filter">Status</label>
          </span>
        </div>
        
        <!-- Technician Filter -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <span class="p-float-label w-full">
            <Select v-model="filters.technicianId" 
              :options="technicianOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              filter
              :loading="loadingTechnicians"
              placeholder="Select a technician"
              inputId="technician-filter" />
            <label for="technician-filter">Technician</label>
          </span>
        </div>
        
        <!-- State Filter -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <span class="p-float-label w-full">
            <Select v-model="filters.state" 
              :options="stateOptions" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
              filter
              placeholder="Select a state"
              inputId="state-filter" />
            <label for="state-filter">State</label>
          </span>
        </div>
        
        <!-- Revenue Range -->
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <div class="flex flex-column gap-2">
            <label class="block mb-1">Revenue Range ($)</label>
            <div class="flex gap-2 w-full">
              <InputText v-model="filters.minRevenue" 
                class="w-full"
                placeholder="Min" />
              <InputText v-model="filters.maxRevenue" 
                class="w-full"
                placeholder="Max" />
            </div>
          </div>
        </div>
        
        <!-- Date Range Filter -->
        <div class="col-span-12">
          <label class="block mb-1">Service Date Range</label>
          <DatePicker v-model="dateRange" 
            selectionMode="range" 
            placeholder="Select date range"
            class="w-full" />
        </div>
        
        <!-- Checkbox filters for specific statuses -->
        <div class="col-span-12">
          <label class="block mb-1">Include Statuses</label>
          <div class="flex flex-wrap gap-3">
            <div v-for="option in statusCheckboxOptions" :key="option.value" 
              class="flex align-items-center">
              <Checkbox v-model="filters.includedStatuses" 
                :value="option.value" 
                :inputId="option.value" />
              <label :for="option.value" class="ml-2 cursor-pointer">
                {{ option.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-content-end gap-2 mt-4">
        <Button label="Reset" icon="pi pi-refresh" outlined 
          @click="resetFilters" />
        <Button label="Apply Filters" icon="pi pi-check" 
          @click="applyFilters" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ApiService } from '@/service/ApiService';
import { useDispatchStore } from '@/stores/dispatchStore';
import Button from 'primevue/button';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';

const props = defineProps({
  isExpanded: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'apply', 'reset']);

// Store
const dispatchStore = useDispatchStore();

// Loading states
const loadingClients = ref(false);
const loadingProjects = ref(false);
const loadingTechnicians = ref(false);

// Filter options
const clientOptions = ref([
  { label: 'All Clients', value: null }
]);

const projectOptions = ref([
  { label: 'All Projects', value: null }
]);

const statusOptions = ref([
  { label: 'All Statuses', value: null },
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Cancelled', value: 'cancelled' }
]);

const statusCheckboxOptions = ref([
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'On Hold', value: 'on_hold' }
]);

const technicianOptions = ref([
  { label: 'All Technicians', value: null }
]);

const stateOptions = ref([
  { label: 'All States', value: null },
  { label: 'California', value: 'CA' },
  { label: 'Texas', value: 'TX' },
  { label: 'Florida', value: 'FL' },
  { label: 'New York', value: 'NY' },
  { label: 'Illinois', value: 'IL' },
  // Additional states can be added here or loaded from an API
]);

// Filter state
const filters = ref({
  clientId: null,
  projectName: null,
  status: null,
  technicianId: null,
  state: null,
  minRevenue: null,
  maxRevenue: null,
  includedStatuses: []
});

// Date range 
const dateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date()
]);

// Initialize filters from store on mount
onMounted(async () => {
  // Initialize filter values from store if available
  if (dispatchStore.selectedCustomerId) {
    filters.value.clientId = dispatchStore.selectedCustomerId;
  }
  
  if (dispatchStore.selectedProjectName) {
    filters.value.projectName = dispatchStore.selectedProjectName;
  }
  
  if (dispatchStore.selectedStatus) {
    filters.value.status = dispatchStore.selectedStatus;
  }
  
  // Initialize date range from store
  if (dispatchStore.dateRange?.start && dispatchStore.dateRange?.end) {
    dateRange.value = [
      new Date(dispatchStore.dateRange.start),
      new Date(dispatchStore.dateRange.end)
    ];
  }
  
  // Load filter options
  await Promise.all([
    loadClients(),
    loadProjects(),
    loadTechnicians()
  ]);
});

// Methods
async function loadClients() {
  loadingClients.value = true;
  
  try {
    const response = await ApiService.get('/dispatch-reports/customers', {
      limit: -1  // Get all customers
    });
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      // Add "All Clients" option
      clientOptions.value = [
        { label: 'All Clients', value: null },
        ...response.data.data.map(client => ({
          label: client.customer_name,
          value: client.customer_id
        }))
      ];
    }
  } catch (error) {
    console.error('Error loading clients:', error);
    // Show error in UI instead of using mock data
    clientOptions.value = [
      { label: 'All Clients', value: null },
      { label: 'Error loading clients', value: 'error', disabled: true }
    ];
  } finally {
    loadingClients.value = false;
  }
}

async function loadProjects() {
  loadingProjects.value = true;
  
  try {
    // Fixed endpoint from "projects" to "project" (singular)
    const response = await ApiService.get('/dispatch-reports/stats/project', {
      limit: -1  // Get all projects
    });
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      // Add "All Projects" option
      projectOptions.value = [
        { label: 'All Projects', value: null },
        ...response.data.data.map(project => ({
          label: project.name,
          value: project.name
        }))
      ];
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    // Show error in UI instead of using mock data
    projectOptions.value = [
      { label: 'All Projects', value: null },
      { label: 'Error loading projects', value: 'error', disabled: true }
    ];
  } finally {
    loadingProjects.value = false;
  }
}

async function loadTechnicians() {
  loadingTechnicians.value = true;
  
  try {
    // Use dispatches endpoint and extract technicians
    const response = await ApiService.get('/dispatch-reports/dispatches', {
      limit: 500  // Get a reasonable number of dispatches to extract technicians
    });
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      // Extract unique technicians from dispatches
      const techSet = new Set();
      const techOptions = [];
      
      response.data.data.forEach(dispatch => {
        if (dispatch.technician_name && !techSet.has(dispatch.technician_name)) {
          techSet.add(dispatch.technician_name);
          techOptions.push({
            label: dispatch.technician_name,
            value: dispatch.technician_name
          });
        }
      });
      
      // Add "All Technicians" option
      technicianOptions.value = [
        { label: 'All Technicians', value: null },
        ...techOptions.sort((a, b) => a.label.localeCompare(b.label))
      ];
    }
  } catch (error) {
    console.error('Error loading technicians:', error);
    // Show error in UI instead of using mock data
    technicianOptions.value = [
      { label: 'All Technicians', value: null },
      { label: 'Error loading technicians', value: 'error', disabled: true }
    ];
  } finally {
    loadingTechnicians.value = false;
  }
}

function closePanel() {
  emit('close');
}

function resetFilters() {
  // Reset all filters to default values
  filters.value = {
    clientId: null,
    projectName: null,
    status: null,
    technicianId: null,
    state: null,
    minRevenue: null,
    maxRevenue: null,
    includedStatuses: []
  };
  
  // Reset date range to last 30 days
  dateRange.value = [
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date()
  ];
  
  emit('reset');
}

function applyFilters() {
  // Convert date range to expected format (YYYY-MM-DD)
  const formattedDateRange = {
    start: dateRange.value[0]?.toISOString().split('T')[0],
    end: dateRange.value[1]?.toISOString().split('T')[0]
  };
  
  // Prepare filter data to emit
  const filterData = {
    ...filters.value,
    dateRange: formattedDateRange
  };
  
  // Emit the apply event with filter data
  emit('apply', filterData);
  
  // Update store with basic filters
  dispatchStore.setFilters(
    filters.value.clientId,
    filters.value.projectName,
    filters.value.status,
    false // don't refresh immediately
  );
  
  // Update date range in store
  dispatchStore.setDateRange(
    formattedDateRange.start,
    formattedDateRange.end,
    true // refresh data
  );
  
  // Close the panel
  closePanel();
}
</script>

<style scoped>
.filter-panel-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.filter-panel-container.expanded {
  max-height: 1000px;
}

.card {
  @apply p-4 rounded-lg bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 mb-4;
}
</style> 