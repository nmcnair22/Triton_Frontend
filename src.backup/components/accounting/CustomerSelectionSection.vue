<template>
  <div class="mb-4 p-2" style="display: flex; align-items: center;">
    <!-- Select taking exactly 35% width -->
    <div style="width: 35%;">
      <Select 
        :modelValue="selectedCustomer" 
        @update:modelValue="$emit('update:selectedCustomer', $event)"
        :options="customers" 
        optionLabel="name" 
        placeholder="Select Customer"
        filter
        :disabled="isLoadingCustomers"
        @change="$emit('customer-change')"
        class="w-full" />
    </div>
    
    <!-- Fixed spacing between Select and toggle -->
    <div style="margin-left: 2rem; display: flex; align-items: center;">
      <label style="margin-right: 0.5rem;">Full list / Only active customers</label>
      <ToggleSwitch :modelValue="customerListType" @update:modelValue="$emit('update:customerListType', $event)" @change="$emit('customer-list-type-change')" />
    </div>
  </div>
</template>

<script setup>
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';

defineProps({
  selectedCustomer: Object,
  customers: Array,
  isLoadingCustomers: Boolean,
  customerListType: Boolean
});

defineEmits(['customer-change', 'customer-list-type-change', 'update:selectedCustomer', 'update:customerListType']);
</script> 