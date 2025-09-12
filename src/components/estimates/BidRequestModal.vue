<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useEstimatesStore } from '@/stores/estimatesStore';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['update:visible']);
const store = useEstimatesStore();
const est = computed(() => store.current);

const form = ref({ vendor_name: '', category: 'Materials', subject: '', expectedAt: null, dueAt: null });
const errors = ref({});

function reset() {
  form.value = { vendor_name: '', category: 'Materials', subject: '', expectedAt: null, dueAt: null };
  errors.value = {};
}

function close() { emit('update:visible', false); }

function validate() {
  errors.value = {};
  if (!form.value.vendor_name?.trim()) errors.value.vendor_name = 'Vendor is required';
  if (!form.value.subject?.trim()) errors.value.subject = 'Subject is required';
  return Object.keys(errors.value).length === 0;
}

function submit() {
  if (!validate() || !est.value) return;
  store.createBidTrack(est.value.id, { ...form.value });
  close();
  reset();
}
</script>

<template>
  <Dialog :visible="visible" header="New Bid Request" :modal="true" :draggable="false" class="w-full max-w-lg"
          @update:visible="$emit('update:visible', $event)" @hide="reset">
    <div class="grid grid-cols-1 gap-4">
      <div class="field">
        <label class="block text-sm font-medium mb-2">Vendor *</label>
        <Select v-model="form.vendor_name" :options="store.vendors" class="w-full" editable showClear :class="{ 'p-invalid': errors.vendor_name }" />
        <small v-if="errors.vendor_name" class="text-red-500">{{ errors.vendor_name }}</small>
      </div>
      <div class="field">
        <label class="block text-sm font-medium mb-2">Category</label>
        <Select v-model="form.category" :options="['Labor','Materials','Travel','Other Fees']" class="w-full" />
      </div>
      <div class="field">
        <label class="block text-sm font-medium mb-2">Subject *</label>
        <InputText v-model="form.subject" class="w-full" :class="{ 'p-invalid': errors.subject }" />
        <small v-if="errors.subject" class="text-red-500">{{ errors.subject }}</small>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Expected Date</label>
          <DatePicker v-model="form.expectedAt" class="w-full" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Due Date</label>
          <DatePicker v-model="form.dueAt" class="w-full" />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="close" />
        <Button label="Create" @click="submit" />
      </div>
    </template>
  </Dialog>
</template>

