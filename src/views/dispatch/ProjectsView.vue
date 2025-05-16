<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
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
import CustomerSelector from '@/components/dispatch/CustomerSelector.vue';
import DateRangePicker from '@/components/dispatch/DateRangePicker.vue';

// Refs and state
const router = useRouter();
const toast = useToast();
const dispatchStore = useDispatchStore();
const { projects, loading } = storeToRefs(dispatchStore);

// Local state
const searchQuery = ref('');
const selectedCustomers = ref([]);
const dateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 30)), 
  new Date()
]);
const tableLoading = ref(false);

// Breadcrumb items
const breadcrumbItems = ref([
  { label: 'Home', to: '/' },
  { label: 'Projects' }
]);
const breadcrumbHome = { icon: 'pi pi-home', to: '/' };

// Methods
function navigateToProject(project) {
  router.push(`/dispatch/projects/${project.id}`);
}

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

async function loadProjects() {
  tableLoading.value = true;
  try {
    await dispatchStore.fetchProjects({
      customer_ids: selectedCustomers.value.map(c => c.code),
      date_from: dateRange.value[0],
      date_to: dateRange.value[1],
      search: searchQuery.value
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load projects',
      life: 3000
    });
  } finally {
    tableLoading.value = false;
  }
}

// Load projects on component mount
onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div class="p-4">
    <!-- Header with breadcrumb and filters -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
      <Breadcrumb :model="breadcrumbItems" :home="breadcrumbHome" class="mb-3 md:mb-0" />
      
      <div class="flex gap-2">
        <CustomerSelector
          v-model="selectedCustomers"
          multiple
          placeholder="All Customers"
          @change="loadProjects"
        />
        
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText 
            v-model="searchQuery" 
            placeholder="Search projects..." 
            @keyup.enter="loadProjects"
            class="p-inputtext-sm"
          />
        </span>
        
        <Button 
          icon="pi pi-refresh" 
          @click="loadProjects"
          :loading="tableLoading"
          class="p-button-outlined p-button-sm"
        />
      </div>
    </div>
    
    <!-- Date range filter -->
    <div class="mb-4">
      <DateRangePicker
        v-model="dateRange"
        :presets="true"
        @change="loadProjects"
      />
    </div>
    
    <!-- Projects table -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">Projects</h2>
          <Button 
            icon="pi pi-download" 
            label="Export" 
            class="p-button-outlined p-button-sm"
          />
        </div>
      </template>
      
      <template #content>
        <DataTable 
          :value="projects" 
          :loading="loading || tableLoading"
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
          
          <Column field="customer.name" header="Customer" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex items-center">
                <img 
                  v-if="data.customer?.logo" 
                  :src="data.customer.logo" 
                  :alt="data.customer.name"
                  class="w-6 h-6 rounded-full mr-2"
                />
                <span>{{ data.customer?.name }}</span>
              </div>
            </template>
          </Column>
          
          <Column field="name" header="Project Name" sortable style="min-width: 200px">
            <template #body="{ data }">
              <div 
                class="cursor-pointer hover:text-blue-600" 
                @click="navigateToProject(data)"
              >
                {{ data.name }}
              </div>
            </template>
          </Column>
          
          <Column field="jobs_count" header="Jobs" sortable style="min-width: 80px" />
          
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
          
          <Column field="start_date" header="Start Date" sortable style="min-width: 120px">
            <template #body="{ data }">
              {{ formatDate(data.start_date) }}
            </template>
          </Column>
          
          <Column field="due_date" header="Due Date" sortable style="min-width: 120px">
            <template #body="{ data }">
              {{ formatDate(data.due_date) }}
            </template>
          </Column>
          
          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-text p-button-rounded p-button-sm"
                  @click="navigateToProject(data)"
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
              <p>No projects found. Try adjusting your filters.</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
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