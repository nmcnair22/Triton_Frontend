<script setup>
import { computed, ref } from 'vue';
import SelectButton from 'primevue/selectbutton';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { useEstimatesStore } from '@/stores/estimatesStore';

const emit = defineEmits(['prev','next']);
const store = useEstimatesStore();
const est = computed(() => store.current);

const mode = ref('template');
const templateOptions = [
  { id: 1, name: 'Network Infrastructure Setup', category: 'IT Infrastructure', description: 'Complete network infrastructure setup including switches, routers, cabling, and configuration.' },
  { id: 2, name: 'Security System Installation', category: 'Security', description: 'Comprehensive security system including cameras, access control, and monitoring setup.' },
  { id: 3, name: 'Server Room Setup', category: 'IT Infrastructure', description: 'Complete server room setup with racks, power, cooling, and network infrastructure.' }
];
const selectedTemplate = ref(null);

function applyTemplate() {
  const t = templateOptions.find(x => x.id === selectedTemplate.value);
  if (t && est.value) {
    est.value.tasks = `Template: ${t.name}\n${t.description}`;
    est.value.laborRequirements = 'As per standard implementation checklist.';
    est.value.materialsEquipment = 'As per bill of materials in template.';
  }
}
</script>

<template>
  <div class="step-content">
    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">Step 2: Detailed Scope Definition</h3>

    <div v-if="!est" class="text-surface-500">No estimate selected.</div>
    <template v-else>
      <div class="flex justify-center mb-6">
        <SelectButton v-model="mode" :options="[{label:'Use Template',value:'template'},{label:'Custom',value:'custom'}]" optionLabel="label" optionValue="value" />
      </div>

      <div v-if="mode==='template'" class="mb-6">
        <label class="block text-sm font-medium mb-2">Select Template</label>
        <Select v-model="selectedTemplate" :options="templateOptions" optionLabel="name" optionValue="id" placeholder="Choose a template" class="w-full md:w-1/2" />
        <Button label="Apply Template" class="mt-3" @click="applyTemplate" :disabled="!selectedTemplate" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Tasks</label>
          <Textarea v-model="est.tasks" rows="6" class="w-full" placeholder="Key tasks" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Labor Requirements</label>
          <Textarea v-model="est.laborRequirements" rows="6" class="w-full" placeholder="Labor requirements" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Materials & Equipment</label>
          <Textarea v-model="est.materialsEquipment" rows="6" class="w-full" placeholder="Materials & equipment" />
        </div>
      </div>

      <div class="flex justify-between mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
        <Button label="Previous" icon="pi pi-arrow-left" severity="secondary" @click="$emit('prev')" />
        <Button label="Next" icon="pi pi-arrow-right" iconPos="right" @click="$emit('next')" />
      </div>
    </template>
  </div>
</template>

