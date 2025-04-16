<template>
  <Card class="h-full" :pt="{ root: { class: 'shadow-sm border border-surface-200 rounded-lg h-full' }, content: { class: 'p-0' } }">
    <template #content>
      <div class="p-4 flex flex-col h-full">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-surface-500 text-sm font-medium">{{ title }}</h3>
          <button v-if="loading" @click="retry" class="text-primary hover:text-primary-600 text-xs">
            Retry
          </button>
        </div>
        
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".8s" />
        </div>
        
        <div v-else class="flex-1">
          <div class="flex flex-col">
            <div class="text-3xl font-bold mb-1">{{ value }}</div>
            
            <div v-if="hasChange" class="flex items-center">
              <span 
                :class="[
                  'text-sm font-medium flex items-center',
                  changePercentage > 0 ? 'text-green-600' : (changePercentage < 0 ? 'text-red-600' : 'text-surface-500')
                ]"
              >
                <i 
                  :class="[
                    'pi mr-1 text-xs',
                    changePercentage > 0 ? 'pi-arrow-up' : (changePercentage < 0 ? 'pi-arrow-down' : 'pi-minus')
                  ]"
                ></i>
                {{ Math.abs(changePercentage).toFixed(1) }}%
              </span>
              <span class="text-xs text-surface-500 ml-1">vs previous period</span>
            </div>
            
            <p v-if="subtitle" class="text-surface-500 text-xs mt-2">{{ subtitle }}</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { defineProps } from 'vue';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  changePercentage: {
    type: Number,
    default: 0
  },
  hasChange: {
    type: Boolean,
    default: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  retry: {
    type: Function,
    default: () => {}
  }
});
</script> 