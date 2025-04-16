<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    required: true
  },
  maxValue: {
    type: Number,
    default: null
  }
});

// Compute the maximum value from the items if not provided
const computedMaxValue = props.maxValue || Math.max(...props.items.map(item => item.value));
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-xl font-semibold mb-2">{{ title }}</h3>
    <p v-if="subtitle" class="text-sm text-gray-500 mb-4">{{ subtitle }}</p>
    
    <div class="space-y-4">
      <div v-for="item in items" :key="item.name" class="w-full">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-medium">{{ item.name }}</span>
          <span class="text-sm font-bold">{{ item.value }}</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2.5">
          <div 
            class="bg-blue-600 h-2.5 rounded-full" 
            :style="{ width: `${(item.value / computedMaxValue) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template> 