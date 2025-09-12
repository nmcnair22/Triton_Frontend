<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useEstimatesStore } from '@/stores/estimatesStore';

const store = useEstimatesStore();
const est = computed(() => store.current);
const activeBucket = ref('client');

function onUpload(event) {
  const files = event.files || [];
  files.forEach(f => {
    store.addDocument(est.value.id, { name: f.name, type: activeBucket.value, source: activeBucket.value, size: f.size });
  });
}

function extractDemo() {
  // Add a couple of demo items based on docs
  if (!est.value) return;
  const items = [
    { id: Date.now(), pricingType:'Fixed', category:'Materials', description:'Extracted cable kit', vendor:'Vendor', unit:'ea', quantity:2, unitCost:150, margin:35 },
    { id: Date.now()+1, pricingType:'Fixed', category:'Labor', description:'Extracted install labor', vendor:'', unit:'hrs', quantity:8, unitCost:85, margin:45 }
  ];
  items.forEach(it => store.addLineItem(est.value.id, it));
}
</script>

<template>
  <div>
    <h4 class="text-lg font-medium mb-3">Documents & Processing</h4>

    <div class="flex items-center gap-2 mb-3">
      <Button :severity="activeBucket==='client' ? 'primary' : 'secondary'" label="Client" text @click="activeBucket='client'" />
      <Button :severity="activeBucket==='vendor' ? 'primary' : 'secondary'" label="Vendor" text @click="activeBucket='vendor'" />
      <Button :severity="activeBucket==='cis' ? 'primary' : 'secondary'" label="CIS" text @click="activeBucket='cis'" />
      <Button label="Extract line items (demo)" icon="pi pi-wrench" severity="secondary" outlined class="ml-auto" @click="extractDemo" />
    </div>

    <FileUpload name="files[]" mode="basic" :auto="true" :customUpload="true" @uploader="onUpload" chooseLabel="Upload" />

    <div class="mt-4">
      <DataTable :value="(est.documents||[]).filter(d=>d.type===activeBucket)" dataKey="id" class="p-datatable-sm">
        <Column field="name" header="Name" />
        <Column field="type" header="Type" />
        <Column field="uploadedAt" header="Uploaded" />
        <Column field="version" header="Version" />
        <Column header="Linked To">
          <template #body="{data}">
            <span v-if="data.linkedTo">{{ data.linkedTo.type }}: {{ data.linkedTo.id }}<span v-if="data.linkedTo.tag">/{{ data.linkedTo.tag }}</span></span>
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="Actions" style="width:12%">
          <template #body="{data}">
            <div class="flex gap-2">
              <Button icon="pi pi-download" text rounded size="small" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="store.deleteDocument(est.id, data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
