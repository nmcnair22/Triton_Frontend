<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useEstimatesStore } from '@/stores/estimatesStore';
import { useToast } from 'primevue/usetoast';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const toast = useToast();
const est = computed(() => store.current);

function download(v) { toast.add({ severity:'success', summary:'Download started', detail:`${v.tag} (mock)`, life:1500 }); }
</script>

<template>
  <Dialog :visible="props.visible" header="Versions" :modal="true" :draggable="false" class="w-full max-w-3xl" @update:visible="$emit('update:visible', $event)">
    <DataTable :value="est?.versions || []" dataKey="tag" class="p-datatable-sm">
      <Column field="tag" header="Version" />
      <Column field="createdAt" header="Date" />
      <Column field="status" header="Status" />
      <Column header="Actions" style="width:18%">
        <template #body="{data}">
          <div class="flex gap-2">
            <Button icon="pi pi-download" size="small" text rounded v-tooltip.top="'Download (mock)'" @click="download(data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>

