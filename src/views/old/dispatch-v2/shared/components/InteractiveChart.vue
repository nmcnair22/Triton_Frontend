<template>
  <div class="chart-container">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <ProgressSpinner />
    </div>
    
    <Chart 
      v-else
      :type="type"
      :data="props.data"
      :options="mergedOptions"
      :class="chartClasses"
      @select="onChartSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea'
  data: any
  options?: any
  height?: string
  responsive?: boolean
  loading?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  responsive: true,
  loading: false,
  interactive: true
})

const emit = defineEmits<{
  select: [event: any]
  hover: [event: any]
}>()

const chartClasses = computed(() => ({
  [`h-[${props.height}]`]: true,
  'cursor-pointer': props.interactive
}))

const defaultOptions = computed(() => ({
  responsive: props.responsive,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      intersect: false,
      mode: 'index'
    }
  },
  scales: props.type === 'line' || props.type === 'bar' ? {
    x: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    }
  } : {},
  interaction: {
    intersect: false,
    mode: 'index'
  },
  onHover: (event: any, elements: any) => {
    if (props.interactive) {
      emit('hover', { event, elements })
    }
  }
}))

const mergedOptions = computed(() => ({
  ...defaultOptions.value,
  ...props.options
}))

const onChartSelect = (event: any) => {
  if (props.interactive) {
    emit('select', event)
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}
</style> 