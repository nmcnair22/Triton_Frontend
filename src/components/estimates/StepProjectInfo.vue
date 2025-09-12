<script setup>
import { computed, ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import SelectButton from 'primevue/selectbutton';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useEstimatesStore } from '@/stores/estimatesStore';
import SurveyRequestModal from './SurveyRequestModal.vue';

const emit = defineEmits(['next']);
const store = useEstimatesStore();
const est = computed(() => store.current);

const pricingOptions = [
  { label: 'Fixed', value: 'Fixed' },
  { label: 'T&M', value: 'T&M' },
  { label: 'Hybrid', value: 'Hybrid' }
];

// Simple validation
const errors = ref({});
const siteMode = ref('count'); // 'count' or 'list'
const showSiteDialog = ref(false);
const editingSite = ref(null);
const siteForm = ref({ name: '', address: '', contactName: '', contactPhone: '' });
const showSurvey = ref(false);

const rateCards = computed(() => store.rateCards);
const selectedRateCardId = computed({
  get() { return est.value?.rateCardId || null; },
  set(v) { if (est.value) est.value.rateCardId = v; }
});
function validate() {
  errors.value = {};
  if (!est.value?.clientName?.trim()) errors.value.clientName = 'Client is required';
  if (!est.value?.projectName?.trim()) errors.value.projectName = 'Project is required';
  const email = est.value?.contactEmail?.trim();
  if (!email) errors.value.contactEmail = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.value.contactEmail = 'Invalid email';
  const mode = est.value?.pricingMode;
  if ((mode === 'T&M' || mode === 'Hybrid') && !selectedRateCardId.value) errors.value.rateCardId = 'Rate card is required for T&M/Hybrid';
  return Object.keys(errors.value).length === 0;
}

function next() { if (validate()) emit('next'); }

function openAddSite() { editingSite.value = null; siteForm.value = { name:'', address:'', contactName:'', contactPhone:'' }; showSiteDialog.value = true; }
function editSite(site) { editingSite.value = site; siteForm.value = { ...site }; showSiteDialog.value = true; }
function saveSite() {
  if (!siteForm.value.name?.trim()) return;
  if (editingSite.value?.id) {
    store.updateSite(est.value.id, editingSite.value.id, { ...siteForm.value });
  } else {
    store.addSite(est.value.id, { ...siteForm.value });
  }
  showSiteDialog.value = false;
}
function deleteSite(site) { store.deleteSite(est.value.id, site.id); }
</script>

<template>
  <div class="step-content">
    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">Step 1: Basic Project Information</h3>

    <div v-if="!est" class="text-surface-500">No estimate selected.</div>
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Client Name</label>
          <InputText v-model="est.clientName" class="w-full" :class="{ 'p-invalid': errors.clientName }" placeholder="Enter client name" />
          <small v-if="errors.clientName" class="text-red-500">{{ errors.clientName }}</small>
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Project Name</label>
          <InputText v-model="est.projectName" class="w-full" :class="{ 'p-invalid': errors.projectName }" placeholder="Enter project name" />
          <small v-if="errors.projectName" class="text-red-500">{{ errors.projectName }}</small>
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Contact Person</label>
          <InputText v-model="est.contactPerson" class="w-full" placeholder="Enter contact name" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Contact Email</label>
          <InputText v-model="est.contactEmail" class="w-full" :class="{ 'p-invalid': errors.contactEmail }" placeholder="Enter contact email" />
          <small v-if="errors.contactEmail" class="text-red-500">{{ errors.contactEmail }}</small>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Pricing Mode</label>
          <SelectButton v-model="est.pricingMode" :options="pricingOptions" optionLabel="label" optionValue="value" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Target Margin %</label>
          <InputNumber v-model="est.targetMarginPct" :min="0" :max="95" :step="0.1"/>
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Sites (count)</label>
          <InputNumber v-model="est.siteCount" :min="1" :step="1" />
        </div>
      </div>

      <!-- Rate Card selection (only when T&M/Hybrid) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" v-if="est.pricingMode==='T&M' || est.pricingMode==='Hybrid'">
        <div class="field md:col-span-2">
          <label class="block text-sm font-medium mb-2">Rate Card *</label>
          <Select v-model="selectedRateCardId" :options="rateCards" optionLabel="name" optionValue="id" placeholder="Select rate card" class="w-full" :class="{ 'p-invalid': errors.rateCardId }" />
          <small v-if="errors.rateCardId" class="text-red-500">{{ errors.rateCardId }}</small>
        </div>
      </div>

      <!-- Sites: Count vs List -->
      <div class="mt-6">
        <div class="flex items-center gap-3 mb-3">
          <SelectButton v-model="siteMode" :options="[{label:'Use Site Count', value:'count'},{label:'Sites List', value:'list'}]" optionLabel="label" optionValue="value" />
          <Button v-if="siteMode==='list'" label="Add Site" icon="pi pi-plus" size="small" @click="openAddSite" />
          <Button v-if="siteMode==='list'" label="Request Survey" icon="pi pi-send" size="small" outlined @click="showSurvey=true" />
        </div>
        <div v-if="siteMode==='list'">
          <DataTable :value="est.sites || []" dataKey="id" class="p-datatable-sm">
            <Column field="name" header="Site Name" />
            <Column field="address" header="Address" />
            <Column field="contactName" header="On-site Contact" />
            <Column field="contactPhone" header="Phone" />
            <Column header="Actions" style="width:12%">
              <template #body="{data}">
                <div class="flex gap-2">
                  <Button icon="pi pi-pencil" text rounded size="small" @click="editSite(data)" />
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deleteSite(data)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <div class="field mt-6">
        <label class="block text-sm font-medium mb-2">Project Overview</label>
        <Textarea v-model="est.projectOverview" rows="4" class="w-full" placeholder="Enter a brief description of the project" />
      </div>

      <div class="flex justify-between mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <div />
        <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="next" />
      </div>

      <!-- Site add/edit dialog -->
      <Dialog v-model:visible="showSiteDialog" header="Site" :modal="true" :draggable="false" class="w-full max-w-lg">
        <div class="grid grid-cols-1 gap-3">
          <div class="field">
            <label class="block text-sm font-medium mb-1">Site Name</label>
            <InputText v-model="siteForm.name" class="w-full" />
          </div>
          <div class="field">
            <label class="block text-sm font-medium mb-1">Address</label>
            <InputText v-model="siteForm.address" class="w-full" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="field">
              <label class="block text-sm font-medium mb-1">On-site Contact</label>
              <InputText v-model="siteForm.contactName" class="w-full" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium mb-1">Phone</label>
              <InputText v-model="siteForm.contactPhone" class="w-full" />
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" outlined @click="showSiteDialog=false" />
            <Button label="Save" @click="saveSite" />
          </div>
        </template>
      </Dialog>

      <SurveyRequestModal v-model:visible="showSurvey" />
    </template>
  </div>
</template>
