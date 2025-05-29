<template>
  <component 
    :is="iconComponent" 
    :class="iconClasses"
    :style="iconStyles"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: '1rem'
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  category: {
    type: String,
    default: 'warnings' // warnings, notifications, etc.
  }
});

// Dynamically import the icon component
const iconComponent = computed(() => {
  const iconPath = `../../assets/icons/${props.category}/${props.name}.svg`;
  return defineAsyncComponent(() => import(iconPath));
});

const iconClasses = computed(() => [
  'custom-icon',
  `custom-icon--${props.category}`,
  `custom-icon--${props.name}`
]);

const iconStyles = computed(() => ({
  width: typeof props.size === 'number' ? `${props.size}px` : props.size,
  height: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
}));
</script>

<style scoped>
.custom-icon {
  flex-shrink: 0;
}

.custom-icon svg {
  width: 100%;
  height: 100%;
}
</style> 