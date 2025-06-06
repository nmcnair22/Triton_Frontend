<script setup>
import { computed } from 'vue';

// Vue 3.5 Reactive Props Destructure - Extract props directly
const { 
  modelValue = [], 
  options = [], 
  multiSelect = false 
} = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  },
  multiSelect: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Toggle selection of a chip
function toggleChip(item) {
  let newValue;
  
  if (multiSelect) {
    // For multi-select, toggle the item in the array
    newValue = [...modelValue];
    
    const index = newValue.indexOf(item.value);
    if (index >= 0) {
      newValue.splice(index, 1);
    } else {
      newValue.push(item.value);
    }
  } else {
    // For single select, replace the whole selection
    if (modelValue.includes(item.value)) {
      newValue = [];
    } else {
      newValue = [item.value];
    }
  }
  
  emit('update:modelValue', newValue);
  emit('change', newValue);
}

// Check if a chip is selected
function isSelected(item) {
  return modelValue.includes(item.value);
}
</script>

<template>
  <div class="filter-chips flex flex-wrap gap-2">
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      @click="toggleChip(item)"
      :class="[
        'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
        isSelected(item) 
          ? `${item.color || 'bg-blue-100 dark:bg-blue-900'} text-blue-800 dark:text-blue-200` 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      ]"
    >
      <i v-if="item.icon" :class="[item.icon, 'mr-1 text-xs']"></i>
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
.bg-primary {
  background-color: var(--primary-color);
}
</style> 