<template>
  <div class="dispatch-table">
    <!-- Loading Skeleton -->
    <div v-if="loading" class="skeleton-container">
      <div v-for="i in 5" :key="i" class="skeleton-row">
        <div class="skeleton-cell skeleton-cell-id"></div>
        <div class="skeleton-cell skeleton-cell-status"></div>
        <div class="skeleton-cell skeleton-cell-regular"></div>
        <div class="skeleton-cell skeleton-cell-regular"></div>
        <div class="skeleton-cell skeleton-cell-regular"></div>
        <div class="skeleton-cell skeleton-cell-date"></div>
      </div>
    </div>
    
    <!-- No Data Message -->
    <div v-else-if="!dispatches.length" class="no-data">
      <i class="pi pi-info-circle text-3xl text-gray-400"></i>
      <p class="text-gray-500 mt-2">No dispatch data available for the selected criteria</p>
    </div>
    
    <!-- Data Table -->
    <DataTable 
      v-else
      :value="dispatches" 
      :paginator="true" 
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      tableStyle="min-width: 50rem"
      dataKey="id"
      :filters="filters"
      filterDisplay="menu"
      class="p-datatable-sm"
    >
      <template #header>
        <div class="flex justify-between">
          <span class="text-xl">Dispatches</span>
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText 
              v-model="filters['global'].value" 
              placeholder="Search..." 
              class="p-inputtext-sm"
            />
          </span>
        </div>
      </template>
      
      <Column field="id" header="ID" sortable :style="{ width: '8%' }">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.id }}</span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText 
            v-model="filterModel.value" 
            @input="filterCallback()" 
            placeholder="Search by ID" 
            class="p-column-filter"
            style="width: 100%"
          />
        </template>
      </Column>
      
      <Column field="status" header="Status" sortable :style="{ width: '10%' }">
        <template #body="{ data }">
          <Tag 
            :severity="getStatusSeverity(data.status)" 
            :value="data.status"
          />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown 
            v-model="filterModel.value" 
            @change="filterCallback()"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Any Status"
            class="p-column-filter"
            style="width: 100%"
          />
        </template>
      </Column>
      
      <Column field="client" header="Client" sortable :style="{ width: '20%' }">
        <template #body="{ data }">
          {{ data.client }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText 
            v-model="filterModel.value" 
            @input="filterCallback()" 
            placeholder="Search by Client" 
            class="p-column-filter"
            style="width: 100%"
          />
        </template>
      </Column>
      
      <Column field="project" header="Project" sortable :style="{ width: '20%' }">
        <template #body="{ data }">
          {{ data.project }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText 
            v-model="filterModel.value" 
            @input="filterCallback()" 
            placeholder="Search by Project" 
            class="p-column-filter"
            style="width: 100%"
          />
        </template>
      </Column>
      
      <Column field="technician" header="Technician" sortable :style="{ width: '20%' }">
        <template #body="{ data }">
          {{ data.technician || 'Unassigned' }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText 
            v-model="filterModel.value" 
            @input="filterCallback()" 
            placeholder="Search by Technician" 
            class="p-column-filter"
            style="width: 100%"
          />
        </template>
      </Column>
      
      <Column field="date" header="Date" sortable :style="{ width: '12%' }">
        <template #body="{ data }">
          {{ formatDate(data.date) }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Calendar 
            v-model="filterModel.value" 
            @date-select="filterCallback()" 
            dateFormat="mm/dd/yy" 
            placeholder="Select Date"
            class="p-column-filter"
            style="width: 100%"
          />
        </template>
      </Column>
      
      <Column field="revenue" header="Revenue" sortable :style="{ width: '10%' }">
        <template #body="{ data }">
          {{ formatCurrency(data.revenue) }}
        </template>
      </Column>
      
      <Column :exportable="false" :style="{ width: '8%' }">
        <template #body="{ data }">
          <Button 
            icon="pi pi-eye" 
            rounded 
            outlined 
            severity="info" 
            @click="viewDetails(data)" 
            class="mr-2"
          />
          <Button 
            icon="pi pi-file" 
            rounded 
            outlined 
            severity="secondary" 
            @click="viewDocuments(data)" 
          />
        </template>
      </Column>
    </DataTable>
    
    <!-- Dispatch Detail Dialog -->
    <Dialog 
      v-model:visible="detailsDialog.visible" 
      :header="'Dispatch #' + (detailsDialog.data?.id || '')"
      :style="{ width: '50vw' }" 
      modal
    >
      <div v-if="detailsDialog.data" class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <h3 class="text-lg font-medium mb-2">General Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Status</p>
              <Tag 
                :severity="getStatusSeverity(detailsDialog.data.status)" 
                :value="detailsDialog.data.status"
              />
            </div>
            <div>
              <p class="text-sm text-gray-500">Date</p>
              <p>{{ formatDate(detailsDialog.data.date) }}</p>
            </div>
          </div>
        </div>
        
        <div class="col-span-1">
          <h3 class="text-lg font-medium mb-2">Client</h3>
          <p>{{ detailsDialog.data.client }}</p>
        </div>
        
        <div class="col-span-1">
          <h3 class="text-lg font-medium mb-2">Project</h3>
          <p>{{ detailsDialog.data.project }}</p>
        </div>
        
        <div class="col-span-1">
          <h3 class="text-lg font-medium mb-2">Technician</h3>
          <p>{{ detailsDialog.data.technician || 'Unassigned' }}</p>
        </div>
        
        <div class="col-span-1">
          <h3 class="text-lg font-medium mb-2">Location</h3>
          <p>{{ detailsDialog.data.location || 'Unknown' }}</p>
        </div>
        
        <div class="col-span-1">
          <h3 class="text-lg font-medium mb-2">Revenue</h3>
          <p>{{ formatCurrency(detailsDialog.data.revenue) }}</p>
        </div>
        
        <div class="col-span-1">
          <h3 class="text-lg font-medium mb-2">Margin</h3>
          <p>{{ formatPercent(detailsDialog.data.margin) }}</p>
        </div>
        
        <div class="col-span-2">
          <h3 class="text-lg font-medium mb-2">Description</h3>
          <p class="whitespace-pre-line">{{ detailsDialog.data.description || 'No description available' }}</p>
        </div>
      </div>
    </Dialog>
    
    <!-- Documents Dialog -->
    <Dialog 
      v-model:visible="documentsDialog.visible" 
      :header="'Documents for Dispatch #' + (documentsDialog.data?.id || '')"
      :style="{ width: '50vw' }" 
      modal
    >
      <div v-if="documentsDialog.data">
        <p v-if="!documentsDialog.data.documents?.length" class="text-center text-gray-500 my-4">
          No documents available for this dispatch
        </p>
        <ul v-else class="list-none p-0">
          <li v-for="(doc, index) in documentsDialog.data.documents" :key="index" class="flex items-center p-3 border-b border-gray-200">
            <i class="pi pi-file-pdf text-xl text-red-500 mr-3"></i>
            <div class="flex-grow">
              <div class="font-medium">{{ doc.name }}</div>
              <div class="text-sm text-gray-500">{{ formatDate(doc.date) }}</div>
            </div>
            <Button 
              icon="pi pi-download" 
              outlined
              @click="downloadDocument(doc)" 
            />
          </li>
        </ul>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import { FilterMatchMode } from 'primevue/api';

const props = defineProps({
  dispatches: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

// Filters setup
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  id: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  client: { value: null, matchMode: FilterMatchMode.CONTAINS },
  project: { value: null, matchMode: FilterMatchMode.CONTAINS },
  technician: { value: null, matchMode: FilterMatchMode.CONTAINS },
  date: { value: null, matchMode: FilterMatchMode.DATE_IS },
});

// Status options for filtering
const statusOptions = [
  { label: 'Completed', value: 'Completed' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'Canceled', value: 'Canceled' },
  { label: 'Delayed', value: 'Delayed' },
];

// Dialog state
const detailsDialog = ref({
  visible: false,
  data: null,
});

const documentsDialog = ref({
  visible: false,
  data: null,
});

// Utility functions
const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatPercent = (value) => {
  if (value === undefined || value === null) return '0%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

const getStatusSeverity = (status) => {
  const severityMap = {
    'Completed': 'success',
    'In Progress': 'info',
    'Scheduled': 'warning',
    'Canceled': 'danger',
    'Delayed': 'help',
  };
  
  return severityMap[status] || 'secondary';
};

// Action methods
const viewDetails = (data) => {
  detailsDialog.value = {
    visible: true,
    data: { ...data },
  };
};

const viewDocuments = (data) => {
  documentsDialog.value = {
    visible: true,
    data: {
      ...data,
      documents: data.documents || [
        // Mock documents for now, replace with actual data
      ],
    },
  };
};

const downloadDocument = (doc) => {
  // Implementation for document download
  console.log('Downloading document:', doc.name);
};
</script>

<style scoped>
.dispatch-table {
  width: 100%;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.skeleton-container {
  width: 100%;
}

.skeleton-row {
  display: flex;
  width: 100%;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-cell {
  background-color: #f0f0f0;
  border-radius: 4px;
  height: 1.5rem;
  margin-right: 1rem;
}

.skeleton-cell-id {
  width: 8%;
}

.skeleton-cell-status {
  width: 10%;
}

.skeleton-cell-regular {
  width: 20%;
}

.skeleton-cell-date {
  width: 12%;
}

:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem 1rem;
}

:deep(.p-tag) {
  font-size: 0.85rem;
}
</style> 