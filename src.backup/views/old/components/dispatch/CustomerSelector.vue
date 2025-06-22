<script setup>
import { ref, computed, watch } from 'vue';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import { useCustomerStore } from '@/stores/customerStore';

const props = defineProps({
  modelValue: {
    type: [Object, Array],
    default: null
  },
  multiple: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: 'Customer'
  },
  placeholder: {
    type: String,
    default: 'Select Customer'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Use customerStore to fetch customers
const customerStore = useCustomerStore();
const loading = ref(false);
const customers = ref([]);

// Computed value for v-model binding
const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
    emit('change', value);
  }
});

// Load customers on component mount
const loadCustomers = async () => {
  loading.value = true;
  
  try {
    // Check if we need to fetch customers
    if (customerStore.customers.length === 0) {
      await customerStore.fetchCustomers();
    }
    
    customers.value = customerStore.customers.map(customer => ({
      name: customer.name,
      code: customer.id,
      logo: customer.logo
    }));
  } catch (error) {
    console.error('Error loading customers:', error);
  } finally {
    loading.value = false;
  }
};

// Watch for change in customers from store
watch(() => customerStore.customers, (newCustomers) => {
  if (newCustomers.length > 0) {
    customers.value = newCustomers.map(customer => ({
      name: customer.name,
      code: customer.id,
      logo: customer.logo
    }));
  }
}, { immediate: true });

loadCustomers();
</script>

<template>
  <div class="customer-selector">
    <label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
    
    <MultiSelect
      v-if="multiple"
      v-model="selectedValue"
      :options="customers"
      optionLabel="name"
      :placeholder="placeholder"
      :disabled="disabled || loading"
      :loading="loading"
      display="chip"
      :showToggleAll="true"
      class="w-full"
    >
      <template #value="slotProps">
        <div v-if="slotProps.value && slotProps.value.length" class="flex flex-wrap gap-1">
          <span v-if="slotProps.value.length === 1">
            <span v-if="slotProps.value[0].logo" class="inline-block mr-1">
              <img :src="slotProps.value[0].logo" :alt="slotProps.value[0].name" class="w-4 h-4 rounded-full object-cover" />
            </span>
            {{ slotProps.value[0].name }}
          </span>
          <span v-else>
            {{ slotProps.value.length }} customers selected
          </span>
        </div>
        <span v-else>{{ placeholder }}</span>
      </template>
      
      <template #option="slotProps">
        <div class="flex items-center gap-2">
          <img 
            v-if="slotProps.option.logo" 
            :src="slotProps.option.logo" 
            :alt="slotProps.option.name" 
            class="w-6 h-6 rounded-full object-cover"
          />
          <span>{{ slotProps.option.name }}</span>
        </div>
      </template>
      
      <template #chip="slotProps">
        <div class="inline-flex items-center gap-1">
          <img 
            v-if="slotProps.value.logo" 
            :src="slotProps.value.logo" 
            :alt="slotProps.value.name" 
            class="w-4 h-4 rounded-full object-cover"
          />
          <span>{{ slotProps.value.name }}</span>
        </div>
      </template>
    </MultiSelect>
    
            <Select
      v-else
      v-model="selectedValue"
      :options="customers"
      optionLabel="name"
      :placeholder="placeholder"
      :disabled="disabled || loading"
      :loading="loading"
      class="w-full"
    >
      <template #value="slotProps">
        <div v-if="slotProps.value" class="flex items-center gap-2">
          <img 
            v-if="slotProps.value.logo" 
            :src="slotProps.value.logo" 
            :alt="slotProps.value.name" 
            class="w-6 h-6 rounded-full object-cover"
          />
          <span>{{ slotProps.value.name }}</span>
        </div>
        <span v-else>{{ placeholder }}</span>
      </template>
      
      <template #option="slotProps">
        <div class="flex items-center gap-2">
          <img 
            v-if="slotProps.option.logo" 
            :src="slotProps.option.logo" 
            :alt="slotProps.option.name" 
            class="w-6 h-6 rounded-full object-cover"
          />
          <span>{{ slotProps.option.name }}</span>
        </div>
      </template>
            </Select>
  </div>
</template> 