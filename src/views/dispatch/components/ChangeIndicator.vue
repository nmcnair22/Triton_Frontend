<template>
  <div 
    :class="[
      'change-indicator', 
      directionClass, 
      size === 'sm' ? 'text-xs' : 'text-sm',
      showBadge ? 'with-badge' : ''
    ]" 
    :title="`${Math.abs(value).toFixed(1)}% ${direction === 'up' ? 'increase' : 'decrease'}`"
  >
    <div v-if="showBadge" class="badge">
      <i :class="[direction === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down']"></i>
    </div>
    <span v-else :class="[direction === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down']"></span>
    <span>{{ displayValue }}{{ suffix }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  suffix: {
    type: String,
    default: '%'
  },
  size: {
    type: String,
    default: 'md' // 'sm' or 'md'
  },
  showBadge: {
    type: Boolean,
    default: false
  },
  invert: {
    type: Boolean,
    default: false
  }
});

// Calculate direction and class
const direction = computed(() => {
  const normalizedValue = props.invert ? -props.value : props.value;
  return normalizedValue >= 0 ? 'up' : 'down';
});

const directionClass = computed(() => {
  return direction.value === 'up' ? 'positive' : 'negative';
});

// Format display value
const displayValue = computed(() => {
  return Math.abs(props.value).toFixed(1);
});
</script>

<style scoped>
.change-indicator {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  line-height: 1;
  gap: 0.25rem;
}

.positive {
  color: #10B981; /* Green */
}

.negative {
  color: #EF4444; /* Red */
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.25rem;
  width: 1.25rem;
  border-radius: 50%;
  color: white;
  font-size: 0.625rem;
}

.positive .badge {
  background-color: #10B981;
}

.negative .badge {
  background-color: #EF4444;
}

.with-badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background-color: #F1F5F9;
}

.with-badge.positive {
  background-color: rgba(16, 185, 129, 0.1);
}

.with-badge.negative {
  background-color: rgba(239, 68, 68, 0.1);
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}
</style> 