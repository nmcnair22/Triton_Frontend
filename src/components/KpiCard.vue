<template>
  <Card class="h-full" :pt="{ root: { class: 'shadow-sm border border-surface-200 rounded-lg h-full' }, content: { class: 'p-0' } }">
    <template #content>
      <div class="p-4 flex flex-col h-full">
        <div v-if="loading" class="flex justify-center items-center h-full">
          <ProgressSpinner />
        </div>
        <div v-else class="flex flex-col h-full">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-surface-500 dark:text-surface-300 font-medium mb-2">{{ title }}</span>
              <div class="text-surface-900 dark:text-surface-0 font-bold text-xl">{{ value }}</div>
            </div>
            <div v-if="icon" class="w-10 h-10 flex items-center justify-center rounded-border" :style="iconBgStyle">
              <i :class="['pi', fullIconClass, 'text-xl']" :style="iconColorStyle"></i>
            </div>
          </div>
          <div v-if="subtitle" class="text-surface-500 dark:text-surface-300 text-sm mb-4">
            {{ subtitle }}
          </div>
          <ProgressBar v-if="showProgressBar" :value="progress" class="w-full" />
          <div v-if="showProgressBar" class="text-center text-sm text-surface-500 dark:text-surface-300 mt-2">{{ progress.toFixed(0) }}%</div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import ProgressBar from 'primevue/progressbar';

const props = defineProps({
  title: String,
  value: [String, Number],
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  retry: { type: Function, default: () => {} },
  accentColor: { type: String, default: '#3b82f6' },
  icon: { type: String, default: '' },
  target: { type: Number, default: null }
});

const iconBgStyle = computed(() => ({ backgroundColor: `${props.accentColor}33` }));
const iconColorStyle = computed(() => ({ color: props.accentColor }));
const fullIconClass = computed(() => props.icon.startsWith('pi-') ? props.icon : `pi-${props.icon}`);

const numericValue = computed(() => typeof props.value === 'number' ? props.value : parseFloat(props.value));
const showProgressBar = computed(() => props.target !== null && props.target > 0 && !isNaN(numericValue.value));
const progress = computed(() => showProgressBar.value ? Math.min(Math.max((numericValue.value / props.target) * 100, 0), 100) : 0);
</script>

<style scoped>
.kpi-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  opacity: 0.1;
  pointer-events: none;
}
</style> 