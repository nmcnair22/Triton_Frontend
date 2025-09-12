<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import { useEstimatesStore } from '@/stores/estimatesStore';
import MoneyCell from '@/components/shared/MoneyCell.vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  bidId: { type: String, default: null },
  versionTag: { type: String, default: null }
});
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const est = computed(() => store.current);

const localItems = ref([]);

const version = computed(() => {
  const bt = (est.value?.bidTracks || []).find(b => b.id === props.bidId);
  if (!bt) return null;
  return (bt.versions || []).find(v => v.tag === props.versionTag) || null;
});

watch(() => props.visible, v => {
  if (v && version.value) {
    localItems.value = JSON.parse(JSON.stringify(version.value.items || []));
  }
});

function addItem() {
  localItems.value.push({ id: Date.now() + Math.random(), pricingType:'Fixed', category:'Materials', description:'', vendor:'', unit:'ea', quantity:1, unitCost:0, margin:35 });
}
function removeItem(row) {
  const idx = localItems.value.findIndex(i => i.id === row.id);
  if (idx >= 0) localItems.value.splice(idx, 1);
}
function save() {
  if (!est.value || !props.bidId || !props.versionTag) return;
  store.setBidVersionItems(est.value.id, props.bidId, props.versionTag, localItems.value);
  emit('update:visible', false);
}
function close() { emit('update:visible', false); }
</script>

<template>
  <Dialog :visible="visible" header="Enter Bid Financials" :modal="true" :draggable="false" class="w-full max-w-5xl"
          @update:visible="$emit('update:visible', $event)">
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm text-surface-500">Version: {{ versionTag }}</div>
      <Button label="Add Item" icon="pi pi-plus" size="small" @click="addItem" />
    </div>
    <DataTable :value="localItems" dataKey="id" class="p-datatable-sm" :emptyMessage="'No items. Click Add Item.'">
      <Column field="category" header="Category" style="width:12%">
        <template #body="{data}"><Select v-model="data.category" :options="['Labor','Materials','Travel','Other Fees']" class="w-full" /></template>
      </Column>
      <Column field="description" header="Description" style="width:28%">
        <template #body="{data}"><InputText v-model="data.description" class="w-full" /></template>
      </Column>
      <Column field="quantity" header="Qty" style="width:8%">
        <template #body="{data}"><InputNumber v-model="data.quantity" :min="0" :step="0.01" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" /></template>
      </Column>
      <Column field="unit" header="Unit" style="width:8%">
        <template #body="{data}"><Select v-model="data.unit" :options="['ea','hrs','ft','day','lot']" class="w-full" /></template>
      </Column>
      <Column field="unitCost" header="Unit Cost" style="width:12%">
        <template #body="{data}"><InputNumber v-model="data.unitCost" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full" /></template>
      </Column>
      <Column field="margin" header="Margin %" style="width:10%">
        <template #body="{data}"><InputNumber v-model="data.margin" :min="0" :max="100" :step="0.01" class="w-full" /></template>
      </Column>
      <Column header="Ext. Charge" style="width:12%">
        <template #body="{data}"><MoneyCell :value="((data.quantity||0)*(data.unitCost||0))/(1-(data.margin||0)/100)" /></template>
      </Column>
      <Column header="Actions" style="width:10%">
        <template #body="{data}"><Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="removeItem(data)" /></template>
      </Column>
    </DataTable>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="close" />
        <Button label="Save" @click="save" />
      </div>
    </template>
  </Dialog>
</template>

