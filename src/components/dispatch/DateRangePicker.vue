<script setup>
import { ref, computed, watch } from 'vue';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Menu from 'primevue/menu';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()]
  },
  presets: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Select Date Range'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Local state for calendar value
const dates = ref(props.modelValue);

// Menu for presets
const presetMenu = ref(null);
const presetItems = ref([
  {
    label: 'Today',
    command: () => applyPreset(
      new Date(),
      new Date()
    )
  },
  {
    label: 'Yesterday',
    command: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      applyPreset(yesterday, yesterday);
    }
  },
  {
    label: 'Last 7 Days',
    command: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      applyPreset(start, end);
    }
  },
  {
    label: 'Last 30 Days',
    command: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      applyPreset(start, end);
    }
  },
  {
    label: 'This Month',
    command: () => {
      const date = new Date();
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date();
      applyPreset(start, end);
    }
  },
  {
    label: 'Last Month',
    command: () => {
      const date = new Date();
      const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const end = new Date(date.getFullYear(), date.getMonth(), 0);
      applyPreset(start, end);
    }
  }
]);

// Apply preset and update the model
function applyPreset(start, end) {
  dates.value = [start, end];
  updateModel();
}

// Format date range for display
const formattedDateRange = computed(() => {
  if (!dates.value || dates.value.length !== 2) {
    return props.placeholder;
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return `${formatDate(dates.value[0])} - ${formatDate(dates.value[1])}`;
});

// Show preset menu
function showPresetMenu(event) {
  presetMenu.value.toggle(event);
}

// Update the model when dates change
function updateModel() {
  emit('update:modelValue', dates.value);
  emit('change', dates.value);
}

// Watch for external changes to model value
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.length === 2) {
    dates.value = newValue;
  }
}, { deep: true });
</script>

<template>
  <div class="date-range-picker">
    <div class="flex items-center">
      <Calendar 
        v-model="dates" 
        selectionMode="range" 
        :showIcon="true"
        :showButtonBar="true"
        dateFormat="M/d/yy"
        class="w-full"
        @date-select="updateModel"
      />
      
      <Button 
        v-if="presets" 
        icon="pi pi-calendar" 
        class="p-button-text ml-2"
        @click="showPresetMenu"
        aria-haspopup="true"
        aria-controls="preset_menu"
      />
    </div>
    
    <Menu 
      ref="presetMenu" 
      id="preset_menu" 
      :model="presetItems" 
      :popup="true"
      class="w-48"
    />
  </div>
</template>

<style scoped>
:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-calendar .p-inputtext) {
  width: 100%;
}

:deep(.p-datepicker-buttonbar) {
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
}
</style> 