<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  defaultCollapsed: {
    type: Boolean,
    default: false
  }
});

const isCollapsed = ref(props.defaultCollapsed);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<template>
  <div class="filter-section mb-4">
    <div 
      @click="toggleCollapse" 
      class="flex justify-between items-center cursor-pointer mb-2"
    >
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <i 
        :class="[
          isCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up',
          'text-gray-500'
        ]"
      ></i>
    </div>
    
    <div 
      v-show="!isCollapsed" 
      class="transition-all duration-300"
    >
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.filter-section__header {
  @apply flex justify-between items-center py-1;
}

.filter-section__title {
  @apply text-gray-700 dark:text-gray-300;
}

.filter-section__content {
  @apply animate-fadeIn;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}
</style> 