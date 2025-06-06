<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();

const navigateToVisit = (visit) => {
  router.push(`/dispatch/visits/${visit.visit_id}`);
};

const getStatusSeverity = (status) => {
  if (!status) return 'info';
  
  status = status.toLowerCase();
  if (status === 'unresolved') return 'danger';
  if (status === 'in progress') return 'warning';
  if (status === 'resolved') return 'success';
  return 'info';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

// Process data for parts and materials issues
const partsIssues = computed(() => {
  const issues = [];
  
  props.data.forEach(visit => {
    if (visit.issues_encountered && visit.issues_encountered.length > 0) {
      visit.issues_encountered.forEach(issue => {
        // Check if the issue is related to parts or materials
        const description = issue.description?.toLowerCase() || '';
        
        if (
          description.includes('part') || 
          description.includes('material') || 
          description.includes('missing') || 
          description.includes('cable') || 
          description.includes('equipment') ||
          description.includes('power')
        ) {
          issues.push({
            id: `${visit.visit_id}-${issues.length}`,
            visit_id: visit.visit_id,
            date: formatDate(visit.date),
            customer: visit.customer || 'Unknown',
            location: visit.location || 'Unknown',
            issue: issue.description,
            status: issue.status || 'Unresolved',
            resolution: issue.mitigation || 'None provided',
            servicePerson: visit.turnup_cards && visit.turnup_cards[0]?.technicians && visit.turnup_cards[0].technicians[0]?.name || 'Unassigned',
            visit: visit
          });
        }
      });
    }
  });
  
  return issues;
});
</script>

<template>
  <Card class="parts-feed">
    <template #title>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <i class="pi pi-box text-orange-500 text-xl"></i>
          <span class="text-xl font-semibold">Parts & Material Issues</span>
          <Badge v-if="partsIssues.length > 0" :value="partsIssues.length" severity="danger" />
        </div>
        <Button icon="pi pi-refresh" class="p-button-text p-button-rounded" />
      </div>
    </template>
    
    <template #content>
      <div v-if="loading" class="flex justify-center p-4">
        <i class="pi pi-spin pi-spinner text-3xl"></i>
      </div>
      <div v-else>
        <DataTable 
          :value="partsIssues" 
          :paginator="partsIssues.length > 5" 
          :rows="5" 
          stripedRows 
          tableStyle="min-width: 100%"
          v-if="partsIssues.length > 0"
          class="p-datatable-sm"
        >
          <Column field="date" header="Date" style="width:10%">
            <template #body="{ data }">
              <span class="text-sm">{{ data.date }}</span>
            </template>
          </Column>
          
          <Column field="customer" header="Customer" style="width:15%">
            <template #body="{ data }">
              <div class="truncate max-w-[150px]">{{ data.customer }}</div>
            </template>
          </Column>
          
          <Column field="issue" header="Issue" style="width:35%">
            <template #body="{ data }">
              <div class="truncate max-w-[250px]">{{ data.issue }}</div>
            </template>
          </Column>
          
          <Column field="status" header="Status" style="width:15%">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          
          <Column header="Actions" style="width:10%">
            <template #body="{ data }">
              <Button 
                icon="pi pi-eye" 
                class="p-button-text p-button-rounded p-button-sm" 
                @click="navigateToVisit(data.visit)"
                tooltip="View Details"
                tooltipOptions="{ position: 'top' }"
              />
            </template>
          </Column>
        </DataTable>
        
        <div v-else class="empty-state p-4 text-center">
          <i class="pi pi-check-circle text-3xl text-surface-400 mb-3"></i>
          <p>No parts or material issues found</p>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.parts-feed {
  height: 100%;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style> 