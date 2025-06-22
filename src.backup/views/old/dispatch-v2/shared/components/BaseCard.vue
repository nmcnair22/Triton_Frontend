<template>
  <Card 
    :class="[
      'transition-all duration-200',
      'hover:shadow-lg',
      cardClasses
    ]"
  >
    <template #header v-if="$slots.header">
      <div class="flex items-center justify-between p-4 border-b border-surface-200">
        <slot name="header" />
      </div>
    </template>
    
    <template #content>
      <div :class="contentClasses">
        <slot />
      </div>
    </template>
    
    <template #footer v-if="$slots.footer">
      <div class="flex items-center justify-end gap-2 p-4 border-t border-surface-200">
        <slot name="footer" />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  loading: false
})

const cardClasses = computed(() => ({
  'border border-surface-200': props.variant === 'outlined',
  'shadow-xl': props.variant === 'elevated',
  'opacity-60 pointer-events-none': props.loading
}))

const contentClasses = computed(() => ({
  'p-3': props.size === 'sm',
  'p-4': props.size === 'md', 
  'p-6': props.size === 'lg'
}))
</script> 