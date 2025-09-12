<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { useEstimatesStore } from '@/stores/estimatesStore';
import StepProjectInfo from './StepProjectInfo.vue';
import StepScope from './StepScope.vue';
import StepCosting from './StepCosting.vue';
import StepDocuments from './StepDocuments.vue';
import StepReviewSubmit from './StepReviewSubmit.vue';

const props = defineProps({
  initialStep: { type: Number, default: 1 },
  initialTab: { type: String, default: 'costing' } // used by StepCosting
});

const emit = defineEmits(['close']);
const toast = useToast();
const store = useEstimatesStore();
const current = computed(() => store.current);

const steps = [
  { key: 'info', label: 'Project Info' },
  { key: 'scope', label: 'Scope' },
  { key: 'costing', label: 'Costing & Docs' },
  { key: 'review', label: 'Review' }
];

const currentStep = ref(Math.min(Math.max(props.initialStep, 1), steps.length));
const progressPercent = computed(() => {
  const total = steps.length;
  const idx = Math.max(1, Math.min(currentStep.value, total)) - 1;
  return Math.round((idx / (total - 1)) * 100);
});

function goNext() {
  if (currentStep.value < steps.length) currentStep.value++;
}
function goPrev() {
  if (currentStep.value > 1) currentStep.value--;
}
function close() { emit('close'); }

onMounted(() => {
  // Optional: jump Step 3 tab
});
</script>

<template>
  <div class="estimate-builder-overlay">
    <div class="builder-header">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <Button icon="pi pi-arrow-left" text rounded @click="close" v-tooltip.top="'Back to Estimates'" />
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Estimate Builder</h2>
          <Tag v-if="current?.status" :value="current.status" severity="info" />
        </div>
        <Button icon="pi pi-save" label="Save Draft" severity="secondary" outlined @click="toast.add({severity:'success', summary:'Saved', life:1500})" />
      </div>

      <!-- Progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between relative">
          <div class="absolute top-6 left-0 w-full h-1 bg-surface-200 dark:bg-surface-700 rounded-full">
            <div class="h-full bg-primary rounded-full transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div v-for="(s, i) in steps" :key="s.key" class="flex flex-col items-center relative z-10" :class="{ 'text-primary': i + 1 <= currentStep, 'text-surface-400': i + 1 > currentStep }">
            <div class="w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white dark:bg-surface-900 transition-all"
                 :class="{ 'border-primary bg-primary text-white': i + 1 < currentStep, 'border-primary text-primary': i + 1 === currentStep, 'border-surface-300 dark:border-surface-600': i + 1 > currentStep }">
              <i v-if="i + 1 < currentStep" class="pi pi-check text-sm"></i>
              <span v-else class="text-sm font-medium">{{ i + 1 }}</span>
            </div>
            <span class="text-xs mt-2 text-center max-w-20">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <StepProjectInfo v-if="currentStep === 1" @next="goNext" />
      <StepScope v-else-if="currentStep === 2" @prev="goPrev" @next="goNext" />
      <StepCosting v-else-if="currentStep === 3" :initial-tab="initialTab" @prev="goPrev" @next="goNext" />
      <StepReviewSubmit v-else @prev="goPrev" @close="close" />
    </div>
  </div>
</template>

<style scoped>
.estimate-builder-overlay { min-height: 100vh; padding: 1rem; }
.builder-header { margin-bottom: 2rem; }
</style>

