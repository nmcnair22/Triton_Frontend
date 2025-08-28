<template>
  <div class="tem-variance-analysis">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Variance Analysis</h1>
      <p class="text-gray-600 mt-1">Analyze billing variances with interactive heat maps and threshold controls</p>
    </div>

    <!-- Controls -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Percentage Threshold</label>
            <Slider v-model="thresholdPercent" :min="5" :max="50" class="w-full" />
            <div class="text-center mt-2 text-sm text-gray-600">{{ thresholdPercent }}%</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount Threshold</label>
            <InputNumber
              v-model="thresholdAmount"
              mode="currency"
              currency="USD"
              locale="en-US"
              class="w-full"
            />
          </div>
          <div class="flex items-end">
            <div>
              <div class="flex items-center mb-2">
                <Checkbox v-model="includeCredits" inputId="include-credits" />
                <label for="include-credits" class="ml-2 text-sm font-medium text-gray-700">
                  Include Credits
                </label>
              </div>
            </div>
          </div>
          <div class="flex items-end">
            <Button
              label="Run Analysis"
              icon="pi pi-play"
              class="w-full"
              @click="runAnalysis"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Heat Map Placeholder -->
    <Card class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Variance Heat Map</h3>
          <div class="flex items-center gap-2">
            <small class="text-gray-500">Color Scale:</small>
            <div class="flex gap-1">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <div class="w-4 h-4 bg-yellow-500 rounded"></div>
              <div class="w-4 h-4 bg-red-500 rounded"></div>
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <div class="text-center py-16">
          <i class="pi pi-chart-line text-6xl text-blue-500 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">Interactive Heat Map</h3>
          <p class="text-gray-600 mb-4">
            Visualize variance patterns across providers and customers
          </p>
          <div class="text-sm text-gray-500">
            X-axis: Providers (max 20) • Y-axis: Customers (max 30)
          </div>
        </div>
      </template>
    </Card>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">0</div>
            <div class="text-sm text-gray-600">Critical Variances (>50%)</div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">0</div>
            <div class="text-sm text-gray-600">High Variances (20-50%)</div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">0</div>
            <div class="text-sm text-gray-600">Total Analyzed</div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

// State
const thresholdPercent = ref(10);
const thresholdAmount = ref(50);
const includeCredits = ref(false);

const runAnalysis = () => {
  toast.add({
    severity: 'info',
    summary: 'Analysis Started',
    detail: 'Variance analysis functionality coming soon',
    life: 3000
  });
};
</script>

<style scoped>
.tem-variance-analysis {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}
</style>