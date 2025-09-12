<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { clientChargeFromMargin, round2 } from '@/utils/money';
import Checkbox from 'primevue/checkbox';

const props = defineProps({
  visible: { type: Boolean, default: false },
  vendors: { type: Array, default: () => [] },
  value: { type: Object, default: null }, // editing item
  roles: { type: Array, default: () => [] } // rate card roles for T&M
});
const emit = defineEmits(['update:visible','save']);

const form = ref({ pricingType:'Fixed', category:'', description:'', vendor:'', unit:'ea', quantity:1, unitCost:0, margin:23.08, clientRate:null, role:null, rateOverride:false, clientCharge:null });
const errors = ref({});

watch(() => props.value, v => {
  form.value = v ? { ...v } : { pricingType:'Fixed', category:'', description:'', vendor:'', quantity:1, unitCost:0, margin:23.08, clientRate:null };
}, { immediate: true });

const roleDefaultRate = computed(() => {
  try {
    const role = (props.roles || []).find(r => r.key === form.value.role);
    return role?.clientRate || null;
  } catch { return null; }
});

watch(() => [form.value.pricingType, form.value.role, form.value.rateOverride], () => {
  if (form.value.pricingType === 'T&M' && !form.value.rateOverride) {
    form.value.clientRate = roleDefaultRate.value;
  }
});

function validate() {
  errors.value = {};
  if (!form.value.category) errors.value.category = 'Category is required';
  if (!form.value.description?.trim()) errors.value.description = 'Description is required';
  if (!form.value.quantity || form.value.quantity <= 0) errors.value.quantity = 'Quantity must be > 0';
  if (form.value.pricingType === 'T&M') {
    if (!form.value.role) errors.value.role = 'Role is required';
    // Unit cost used for margin on T&M
    if (form.value.unitCost == null || form.value.unitCost < 0) errors.value.unitCost = 'Unit cost must be >= 0';
    if (form.value.rateOverride && (!form.value.clientRate || form.value.clientRate <= 0)) errors.value.clientRate = 'Client rate required';
  } else {
    if (form.value.unitCost == null || form.value.unitCost < 0) errors.value.unitCost = 'Unit cost must be >= 0';
  }
  return Object.keys(errors.value).length === 0;
}

function onSave() { if (validate()) emit('save', { ...form.value }); }
function close() { emit('update:visible', false); }

function calcClientCharge() {
  const qty = Number(form.value.quantity) || 0;
  if (form.value.pricingType === 'T&M') return round2(qty * (Number(form.value.clientRate) || 0));
  const cost = qty * (Number(form.value.unitCost) || 0);
  return clientChargeFromMargin(cost, Number(form.value.margin) || 0);
}

function backCalcMarginFromClientCharge() {
  if (form.value.pricingType !== 'Fixed') return;
  const qty = Number(form.value.quantity) || 0;
  const cost = qty * (Number(form.value.unitCost) || 0);
  const charge = Number(form.value.clientCharge) || 0;
  if (charge > 0) {
    const m = ((charge - cost) / charge) * 100;
    form.value.margin = round2(m);
  }
}
</script>

<template>
  <Dialog :visible="visible" :modal="true" :closable="true" :draggable="false" class="w-full max-w-2xl"
          :header="(value ? 'Edit' : 'Add') + ' Line Item'" @update:visible="$emit('update:visible', $event)">
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Pricing Type</label>
          <Select v-model="form.pricingType" :options="['Fixed','T&M']" class="w-full" />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Category *</label>
          <Select v-model="form.category" :options="['Labor','Materials','Travel','Other Fees']" class="w-full" :class="{ 'p-invalid': errors.category }" />
          <small v-if="errors.category" class="text-red-500">{{ errors.category }}</small>
        </div>
      </div>

      <div class="field">
        <label class="block text-sm font-medium mb-2">Description *</label>
        <Textarea v-model="form.description" rows="3" maxlength="500" class="w-full" :class="{ 'p-invalid': errors.description }" />
        <div class="flex justify-between">
          <small v-if="errors.description" class="text-red-500">{{ errors.description }}</small>
          <small class="text-surface-500">{{ (form.description || '').length }}/500</small>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Vendor</label>
          <Select v-model="form.vendor" :options="vendors" class="w-full" showClear editable />
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Quantity *</label>
          <InputNumber v-model="form.quantity" :min="0.1" :step="0.1" :minFractionDigits="1" :maxFractionDigits="2" class="w-full" :class="{ 'p-invalid': errors.quantity }" />
          <small v-if="errors.quantity" class="text-red-500">{{ errors.quantity }}</small>
        </div>
        <div class="field">
          <label class="block text-sm font-medium mb-2">Unit</label>
          <Select v-model="form.unit" :options="['ea','hrs','ft','day','lot']" class="w-full" />
        </div>
        <div class="field" v-if="form.pricingType==='Fixed'">
          <label class="block text-sm font-medium mb-2">Unit Cost *</label>
          <InputNumber v-model="form.unitCost" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full" :class="{ 'p-invalid': errors.unitCost }" />
          <small v-if="errors.unitCost" class="text-red-500">{{ errors.unitCost }}</small>
        </div>
        <div class="field" v-else>
          <label class="block text-sm font-medium mb-2">Role *</label>
          <Select v-model="form.role" :options="roles" optionLabel="label" optionValue="key" class="w-full" :class="{ 'p-invalid': errors.role }" />
          <div class="mt-2 flex items-center gap-2">
            <Checkbox v-model="form.rateOverride" binary />
            <span class="text-sm">Override client rate</span>
          </div>
          <InputNumber v-model="form.clientRate" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full mt-2" :disabled="!form.rateOverride" :class="{ 'p-invalid': errors.clientRate }" />
          <small v-if="errors.clientRate" class="text-red-500">{{ errors.clientRate }}</small>
          <div class="field mt-4">
            <label class="block text-sm font-medium mb-2">Unit Cost *</label>
            <InputNumber v-model="form.unitCost" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full" :class="{ 'p-invalid': errors.unitCost }" />
            <small v-if="errors.unitCost" class="text-red-500">{{ errors.unitCost }}</small>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-if="form.pricingType==='Fixed'">
        <div class="field">
          <label class="block text-sm font-medium mb-2">Margin %</label>
          <InputNumber v-model="form.margin" :min="0" :max="100" :step="0.01" class="w-full" />
        </div>
        <div class="field col-span-2">
          <label class="block text-sm font-medium mb-2">Calculated Client Charge</label>
          <div class="text-lg font-semibold">${{ calcClientCharge().toFixed(2) }}</div>
        </div>
      </div>

      <div v-if="form.pricingType==='Fixed'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="field col-span-1">
          <label class="block text-sm font-medium mb-2">Client Charge (edit to back-calc margin)</label>
          <InputNumber v-model="form.clientCharge" mode="currency" currency="USD" :min="0" :step="0.01" :minFractionDigits="2" class="w-full" @update:modelValue="backCalcMarginFromClientCharge" />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="close" />
        <Button :label="value ? 'Update' : 'Add'" @click="onSave" />
      </div>
    </template>
  </Dialog>
</template>
