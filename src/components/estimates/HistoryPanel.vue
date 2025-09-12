<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useEstimatesStore } from '@/stores/estimatesStore';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const est = computed(() => store.current);
</script>

<template>
  <Dialog :visible="props.visible" header="History" :modal="true" :draggable="false" class="w-full max-w-3xl" @update:visible="$emit('update:visible', $event)">
    <div v-if="!(est?.history?.length)">No history yet.</div>
    <DataTable v-else :value="est.history" dataKey="id" class="p-datatable-sm">
      <Column field="at" header="Time" />
      <Column field="type" header="Event" />
      <Column field="detail" header="Details" />
    </DataTable>
  </Dialog>
</template>

