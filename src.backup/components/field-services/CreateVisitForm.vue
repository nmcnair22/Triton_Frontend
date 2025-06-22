<template>
  <div class="create-visit-form">
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Customer Selection -->
        <div>
          <label class="block text-sm font-medium mb-2">Customer *</label>
          <Select 
            v-model="formData.customerId"
            :options="customerOptions"
            option-label="name"
            option-value="id"
            placeholder="Select customer"
            class="w-full"
            filter
            showClear
          />
        </div>

        <!-- Visit Type -->
        <div>
          <label class="block text-sm font-medium mb-2">Visit Type *</label>
          <Select 
            v-model="formData.visitType"
            :options="visitTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="Select visit type"
            class="w-full"
          />
        </div>

        <!-- Service Date -->
        <div>
          <label class="block text-sm font-medium mb-2">Service Date *</label>
          <DatePicker 
            v-model="formData.serviceDate"
            :show-icon="true"
            :show-time="true"
            placeholder="Select date and time"
            class="w-full"
          />
        </div>

        <!-- Priority -->
        <div>
          <label class="block text-sm font-medium mb-2">Priority</label>
          <Select 
            v-model="formData.priority"
            :options="priorityOptions"
            option-label="label"
            option-value="value"
            placeholder="Select priority"
            class="w-full"
          />
        </div>
      </div>

      <!-- Address -->
      <div>
        <label class="block text-sm font-medium mb-2">Service Address</label>
        <InputText 
          v-model="formData.serviceAddress"
          placeholder="Enter service address"
          class="w-full"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium mb-2">Description</label>
        <Textarea 
          v-model="formData.description"
          placeholder="Describe the work to be performed"
          class="w-full"
          rows="4"
        />
      </div>

      <!-- Estimated Duration -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Estimated Duration (hours)</label>
          <InputNumber 
            v-model="formData.estimatedDuration"
            placeholder="0"
            :min="0"
            :max="24"
            class="w-full"
          />
        </div>

        <!-- Estimated Cost -->
        <div>
          <label class="block text-sm font-medium mb-2">Estimated Cost</label>
          <InputNumber 
            v-model="formData.estimatedCost"
            placeholder="0.00"
            :min="0"
            mode="currency"
            currency="USD"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-surface-200">
      <Button 
        label="Cancel" 
        @click="$emit('cancel')"
        outlined
      />
      <Button 
        label="Create Visit" 
        @click="createVisit"
        :disabled="!isFormValid"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCustomerStore } from '@/stores/customerStore';

const emit = defineEmits(['visit-created', 'cancel']);

// Store
const customerStore = useCustomerStore();

// Form data
const formData = ref({
  customerId: null,
  visitType: '',
  serviceDate: null,
  priority: 'medium',
  serviceAddress: '',
  description: '',
  estimatedDuration: null,
  estimatedCost: null
});

// Options
const visitTypeOptions = ref([
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Emergency', value: 'emergency' }
]);

const priorityOptions = ref([
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]);

// Computed
const customerOptions = computed(() => customerStore.customers);

const isFormValid = computed(() => {
  return formData.value.customerId && 
         formData.value.visitType && 
         formData.value.serviceDate;
});

// Methods
async function createVisit() {
  try {
    // Here you would call the visits store to create the visit
    // For now, we'll emit the event with the form data
    emit('visit-created', { ...formData.value });
    
    // Reset form
    formData.value = {
      customerId: null,
      visitType: '',
      serviceDate: null,
      priority: 'medium',
      serviceAddress: '',
      description: '',
      estimatedDuration: null,
      estimatedCost: null
    };
  } catch (error) {
    console.error('Error creating visit:', error);
  }
}

// Lifecycle
onMounted(async () => {
  if (customerStore.customers.length === 0) {
    await customerStore.fetchCustomers();
  }
});
</script>

<style scoped>
.create-visit-form {
  min-width: 500px;
}
</style> 