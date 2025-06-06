<template>
  <BaseCard :variant="variant" :size="size">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <i v-if="icon" :class="[icon, iconColorClass]" class="text-lg"></i>
          <span class="text-sm font-medium text-surface-600">{{ title }}</span>
        </div>
        
        <div class="flex items-baseline gap-2">
          <span :class="valueClasses">{{ formattedValue }}</span>
          <span v-if="unit" class="text-sm text-surface-500">{{ unit }}</span>
        </div>
        
        <div v-if="trend !== undefined" class="flex items-center gap-1 mt-2">
          <i :class="trendIcon" :style="{ color: trendColor }"></i>
          <span :class="trendTextClass">
            {{ Math.abs(trend) }}{{ trendUnit }} {{ trendDirection }}
          </span>
        </div>
        
        <p v-if="description" class="text-xs text-surface-500 mt-1">
          {{ description }}
        </p>
      </div>
      
      <div v-if="$slots.chart" class="ml-4">
        <slot name="chart" />
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'

interface Props {
  title: string
  value: number | string
  unit?: string
  icon?: string
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: number
  trendUnit?: string
  description?: string
  variant?: 'default' | 'elevated' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
  format?: 'number' | 'currency' | 'percentage'
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  trendUnit: '%',
  variant: 'default',
  size: 'md',
  format: 'number'
})

const iconColorClass = computed(() => {
  const colors = {
    primary: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-blue-500'
  }
  return colors[props.iconColor]
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(props.value)
    case 'percentage':
      return `${props.value}%`
    default:
      return new Intl.NumberFormat('en-US').format(props.value)
  }
})

const valueClasses = computed(() => ({
  'text-xl font-bold': props.size === 'sm',
  'text-2xl font-bold': props.size === 'md',
  'text-3xl font-bold': props.size === 'lg'
}))

const trendDirection = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend > 0 ? 'increase' : 'decrease'
})

const trendIcon = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
})

const trendColor = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend > 0 ? '#10b981' : '#ef4444'
})

const trendTextClass = computed(() => ({
  'text-xs': true,
  'text-green-600': props.trend > 0,
  'text-red-600': props.trend < 0,
  'text-surface-500': props.trend === 0
}))
</script> 