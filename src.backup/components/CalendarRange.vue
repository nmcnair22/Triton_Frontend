<script setup>
import { ref, watch, toRefs, defineProps, defineEmits } from 'vue';
import DatePicker from 'primevue/datepicker';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ startDate: null, endDate: null })
  },
  size: {
    type: String,
    default: 'medium'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const { modelValue } = toRefs(props);
const startDate = ref(modelValue.value?.startDate || null);
const endDate = ref(modelValue.value?.endDate || null);

// Watch for changes in the model value
watch(modelValue, (newValue) => {
  startDate.value = newValue?.startDate || null;
  endDate.value = newValue?.endDate || null;
}, { deep: true });

// Watch for changes in the component's state and emit them
watch([startDate, endDate], ([newStartDate, newEndDate]) => {
  const newValue = { startDate: newStartDate, endDate: newEndDate };
  emit('update:modelValue', newValue);
  emit('change', newValue);
}, { deep: true });

const getSizeClass = () => {
  switch (props.size) {
    case 'small':
      return 'p-inputtext-sm';
    case 'large':
      return 'p-inputtext-lg';
    default:
      return '';
  }
};
</script>

<template>
  <div class="flex items-center gap-2">
    <DatePicker 
      v-model="startDate" 
      :placeholder="'Start Date'" 
      :class="getSizeClass()"
      showIcon
    />
    <span class="text-gray-500">to</span>
    <DatePicker 
      v-model="endDate" 
      :placeholder="'End Date'" 
      :class="getSizeClass()"
      showIcon
    />
  </div>
</template> 