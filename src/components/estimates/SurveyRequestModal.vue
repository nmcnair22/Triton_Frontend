<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import { useEstimatesStore } from '@/stores/estimatesStore';
import { useToast } from 'primevue/usetoast';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const toast = useToast();
const est = computed(() => store.current);

const form = ref({
  clientName: '', projectName: '', contactPerson: '', contactEmail: '',
  locationAddress: '', locationCity: '', locationState: '', locationZip: '',
  surveyVendor: '', estimatedCost: 0, costUnknown: false, surveyDate: null, notes: ''
});
const errors = ref({});

function open() {
  if (est.value) {
    form.value.clientName = est.value.clientName || '';
    form.value.projectName = est.value.projectName || '';
    form.value.contactPerson = est.value.contactPerson || '';
    form.value.contactEmail = est.value.contactEmail || '';
  }
}

function close() { emit('update:visible', false); }

function validate() {
  errors.value = {};
  if (!form.value.locationAddress?.trim()) errors.value.locationAddress = 'Address is required';
  if (!form.value.locationCity?.trim()) errors.value.locationCity = 'City is required';
  if (!form.value.locationState?.trim()) errors.value.locationState = 'State is required';
  if (!form.value.surveyVendor?.trim()) errors.value.surveyVendor = 'Vendor is required';
  return Object.keys(errors.value).length === 0;
}

function submit() {
  if (!validate()) return;
  if (!est.value) return;
  store.addSurvey(est.value.id, {
    vendor: form.value.surveyVendor,
    location: `${form.value.locationAddress}, ${form.value.locationCity}, ${form.value.locationState} ${form.value.locationZip}`,
    status: 'Scheduled',
    scheduledDate: form.value.surveyDate,
    estimatedCost: form.value.costUnknown ? 0 : form.value.estimatedCost,
    actualCost: null,
    notes: form.value.notes
  });
  toast.add({ severity:'success', summary:'Site Survey Requested', detail:`Survey request sent to ${form.value.surveyVendor}`, life:3000 });
  close();
}
</script>

<template>
  <Dialog :visible="visible" header="Request Site Survey" :modal="true" :draggable="false" class="w-full max-w-3xl"
          @update:visible="$emit('update:visible', $event)" @show="open">
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Client Name</label>
          <InputText v-model="form.clientName" class="w-full" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Project Name</label>
          <InputText v-model="form.projectName" class="w-full" />
        </div>
      </div>

      <div>
        <h5 class="font-medium mb-3">Location</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label class="block text-sm font-medium mb-2">Address *</label>
            <InputText v-model="form.locationAddress" class="w-full" :class="{ 'p-invalid': errors.locationAddress }" />
            <small v-if="errors.locationAddress" class="text-red-500">{{ errors.locationAddress }}</small>
          </div>
          <div class="field">
            <label class="block text-sm font-medium mb-2">City *</label>
            <InputText v-model="form.locationCity" class="w-full" :class="{ 'p-invalid': errors.locationCity }" />
            <small v-if="errors.locationCity" class="text-red-500">{{ errors.locationCity }}</small>
          </div>
          <div class="field">
            <label class="block text-sm font-medium mb-2">State *</label>
            <InputText v-model="form.locationState" class="w-full" :class="{ 'p-invalid': errors.locationState }" />
            <small v-if="errors.locationState" class="text-red-500">{{ errors.locationState }}</small>
          </div>
          <div class="field">
            <label class="block text-sm font-medium mb-2">ZIP</label>
            <InputText v-model="form.locationZip" class="w-full" />
          </div>
        </div>
      </div>

      <div>
        <h5 class="font-medium mb-3">Survey Details</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label class="block text-sm font-medium mb-2">Survey Vendor *</label>
            <Select v-model="form.surveyVendor" :options="store.vendors" placeholder="Select vendor" class="w-full" :class="{ 'p-invalid': errors.surveyVendor }" showClear editable />
            <small v-if="errors.surveyVendor" class="text-red-500">{{ errors.surveyVendor }}</small>
          </div>
          <div class="field">
            <label class="block text-sm font-medium mb-2">Preferred Survey Date</label>
            <DatePicker v-model="form.surveyDate" class="w-full" :minDate="new Date()" showIcon />
          </div>
          <div class="field">
            <div class="flex items-center gap-2 mb-2">
              <Checkbox v-model="form.costUnknown" binary />
              <label class="text-sm font-medium">Cost Unknown</label>
            </div>
            <InputNumber v-if="!form.costUnknown" v-model="form.estimatedCost" mode="currency" currency="USD" :min="0" class="w-full" placeholder="Estimated cost" />
          </div>
          <div class="field">
            <label class="block text-sm font-medium mb-2">Notes</label>
            <Textarea v-model="form.notes" rows="3" class="w-full" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="close" />
        <Button label="Request Survey" icon="pi pi-send" @click="submit" />
      </div>
    </template>
  </Dialog>
</template>

