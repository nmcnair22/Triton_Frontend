<template>
  <Badge 
    :value="displayText"
    :severity="badgeSeverity"
    :class="[
      'inline-flex items-center gap-1',
      badgeClasses
    ]"
  >
    <i v-if="showIcon" :class="iconClass" class="text-xs"></i>
    {{ displayText }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  text?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
  size: 'md'
})

const statusConfig = {
  'completed': { 
    severity: 'success', 
    icon: 'pi pi-check-circle',
    text: 'Completed'
  },
  'in-progress': { 
    severity: 'info', 
    icon: 'pi pi-clock',
    text: 'In Progress'
  },
  'pending': { 
    severity: 'warning', 
    icon: 'pi pi-exclamation-triangle',
    text: 'Pending'
  },
  'cancelled': { 
    severity: 'danger', 
    icon: 'pi pi-times-circle',
    text: 'Cancelled'
  },
  'scheduled': { 
    severity: 'info', 
    icon: 'pi pi-calendar',
    text: 'Scheduled'
  },
  'overdue': { 
    severity: 'danger', 
    icon: 'pi pi-exclamation-circle',
    text: 'Overdue'
  },
  'draft': { 
    severity: 'secondary', 
    icon: 'pi pi-file-edit',
    text: 'Draft'
  }
}

const config = computed(() => 
  statusConfig[props.status.toLowerCase()] || {
    severity: 'secondary',
    icon: 'pi pi-circle',
    text: props.status
  }
)

const badgeSeverity = computed(() => config.value.severity)
const iconClass = computed(() => config.value.icon)
const displayText = computed(() => props.text || config.value.text)

const badgeClasses = computed(() => ({
  'text-xs px-2 py-1': props.size === 'sm',
  'text-sm px-3 py-1': props.size === 'md',
  'text-base px-4 py-2': props.size === 'lg'
}))
</script> 