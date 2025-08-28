<template>
  <div class="tem-datatable">
    <!-- Table Header with Actions -->
    <div v-if="showHeader" class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <h3 v-if="title" class="text-xl font-semibold">{{ title }}</h3>
        <Badge v-if="totalRecords" :value="totalRecords" class="ml-2" />
      </div>
      <div class="flex items-center gap-2">
        <Button 
          v-if="showRefresh"
          icon="pi pi-refresh" 
          outlined 
          @click="$emit('refresh')"
          :loading="loading"
        />
        <Button 
          v-if="showExport"
          icon="pi pi-download" 
          label="Export" 
          outlined
          @click="$emit('export')"
        />
        <slot name="header-actions"></slot>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :value="data"
      :loading="loading"
      :paginator="paginator"
      :rows="rows"
      :totalRecords="totalRecords"
      :lazy="lazy"
      :scrollable="scrollable"
      :scrollHeight="scrollHeight"
      :virtualScrollerOptions="virtualScrollerOptions"
      :selection="selection"
      :selectionMode="selectionMode"
      :rowHover="true"
      :resizableColumns="resizable"
      dataKey="id"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 25, 50, 100]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
      class="tem-table"
      @page="onPage"
      @sort="onSort"
      @selection-change="onSelectionChange"
      @row-select="onRowSelect"
      @row-unselect="onRowUnselect"
    >
      <!-- Selection column -->
      <Column 
        v-if="selectionMode === 'multiple'" 
        selectionMode="multiple" 
        headerStyle="width: 3rem"
      />
      
      <!-- Dynamic columns -->
      <Column
        v-for="col in columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable !== false"
        :style="col.style"
        :headerStyle="col.headerStyle"
        :bodyStyle="col.bodyStyle"
        :class="col.class"
      >
        <template #body="slotProps" v-if="col.type">
          <!-- Currency formatting -->
          <span v-if="col.type === 'currency'" class="font-medium">
            {{ formatCurrency(slotProps.data[col.field]) }}
          </span>
          
          <!-- Date formatting -->
          <span v-else-if="col.type === 'date'">
            {{ formatDate(slotProps.data[col.field]) }}
          </span>
          
          <!-- Status badge -->
          <Badge 
            v-else-if="col.type === 'status'"
            :value="slotProps.data[col.field]"
            :severity="getStatusSeverity(slotProps.data[col.field], col.statusMap)"
          />
          
          <!-- Progress bar -->
          <ProgressBar 
            v-else-if="col.type === 'progress'"
            :value="slotProps.data[col.field]"
            class="h-2"
          />
          
          <!-- Actions menu -->
          <div v-else-if="col.type === 'actions'" class="flex gap-2">
            <Button
              v-for="action in col.actions"
              :key="action.name"
              :icon="action.icon"
              :label="action.label"
              :severity="action.severity || 'secondary'"
              :outlined="action.outlined !== false"
              size="small"
              @click="$emit('action', { action: action.name, data: slotProps.data })"
            />
          </div>
          
          <!-- Default text -->
          <span v-else>
            {{ slotProps.data[col.field] }}
          </span>
        </template>
        
        <!-- Custom slot content -->
        <template #body="slotProps" v-else-if="col.slot">
          <slot :name="col.slot" :data="slotProps.data" :value="slotProps.data[col.field]"></slot>
        </template>
      </Column>
      
      <!-- Custom column slots -->
      <slot name="columns"></slot>
    </DataTable>

    <!-- Bulk Actions Bar -->
    <div 
      v-if="selectionMode === 'multiple' && selectedRows.length > 0" 
      class="bulk-actions-bar fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4 z-50"
    >
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          {{ selectedRows.length }} item{{ selectedRows.length === 1 ? '' : 's' }} selected
        </span>
        
        <div class="flex gap-2">
          <Button
            v-for="bulkAction in bulkActions"
            :key="bulkAction.name"
            :label="bulkAction.label"
            :icon="bulkAction.icon"
            :severity="bulkAction.severity || 'primary'"
            size="small"
            @click="$emit('bulk-action', { action: bulkAction.name, data: selectedRows })"
          />
        </div>
        
        <Button
          icon="pi pi-times"
          outlined
          rounded
          size="small"
          @click="clearSelection"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import ProgressBar from 'primevue/progressbar';

// Props
const props = defineProps({
  // Data props
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  
  // Pagination props
  paginator: {
    type: Boolean,
    default: true
  },
  rows: {
    type: Number,
    default: 25
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  lazy: {
    type: Boolean,
    default: true
  },
  
  // Selection props
  selection: {
    type: Array,
    default: () => []
  },
  selectionMode: {
    type: String,
    default: null // null, 'single', 'multiple'
  },
  
  // Table styling props
  scrollable: {
    type: Boolean,
    default: false
  },
  scrollHeight: {
    type: String,
    default: '400px'
  },
  resizable: {
    type: Boolean,
    default: true
  },
  
  // Virtual scrolling (for large datasets)
  virtualScrollerOptions: {
    type: Object,
    default: null
  },
  
  // Header props
  showHeader: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showExport: {
    type: Boolean,
    default: true
  },
  
  // Bulk actions
  bulkActions: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits([
  'page',
  'sort', 
  'selection-change',
  'row-select',
  'row-unselect',
  'refresh',
  'export',
  'action',
  'bulk-action'
]);

// State
const selectedRows = ref(props.selection);

// Methods
const onPage = (event) => {
  emit('page', event);
};

const onSort = (event) => {
  emit('sort', event);
};

const onSelectionChange = (event) => {
  selectedRows.value = event.value;
  emit('selection-change', event);
};

const onRowSelect = (event) => {
  emit('row-select', event);
};

const onRowUnselect = (event) => {
  emit('row-unselect', event);
};

const clearSelection = () => {
  selectedRows.value = [];
  emit('selection-change', { value: [] });
};

// Formatters
const formatCurrency = (value) => {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
};

const getStatusSeverity = (status, statusMap) => {
  if (!statusMap) {
    // Default status mappings
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'denied': return 'danger';
      case 'overdue': return 'danger';
      case 'paid': return 'success';
      default: return 'info';
    }
  }
  return statusMap[status] || 'info';
};
</script>

<style scoped>
.tem-datatable {
  position: relative;
}

.tem-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--highlight-bg);
}

.bulk-actions-bar {
  max-width: calc(100vw - 2rem);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* Virtual scrolling optimizations */
.tem-table :deep(.p-datatable-virtual-scrollable-body) {
  height: var(--scroll-height, 400px);
}
</style>