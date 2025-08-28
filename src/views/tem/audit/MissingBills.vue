<template>
  <div class="tem-missing-bills">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Missing Bills Detection</h1>
      <p class="text-gray-600 mt-1">Detect accounts missing recent bills based on configurable thresholds</p>
    </div>

    <!-- Day Selector -->
    <Card class="mb-6">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold mb-2">Detection Threshold</h3>
            <p class="text-gray-600">Find accounts without bills for specified number of days</p>
          </div>
          <div class="flex gap-3">
            <Button
              v-for="days in [35, 45, 60, 90]"
              :key="days"
              :label="`${days} days`"
              :severity="selectedDays === days ? 'primary' : 'secondary'"
              :outlined="selectedDays !== days"
              @click="selectedDays = days"
            />
            <Button
              label="Run Detection"
              icon="pi pi-search"
              @click="runDetection"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-2xl font-bold text-red-600">0</div>
              <div class="text-sm text-gray-600">Total Missing Bills</div>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-2xl font-bold text-orange-600">$0</div>
              <div class="text-sm text-gray-600">Estimated Exposure</div>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-dollar text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
      
      <Card>
        <template #content>
          <div class="flex items-center">
            <div class="flex-1">
              <div class="text-2xl font-bold text-blue-600">0</div>
              <div class="text-sm text-gray-600">Providers Affected</div>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-building text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Results Table Placeholder -->
    <Card>
      <template #content>
        <div class="text-center py-16">
          <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h2 class="text-2xl font-semibold mb-2">Missing Bills Detection</h2>
          <p class="text-gray-600 mb-6">Advanced detection algorithm with provider analysis coming soon</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
            <div class="bg-red-50 p-6 rounded-lg">
              <i class="pi pi-search text-red-500 text-3xl mb-3"></i>
              <h3 class="font-semibold mb-2">Smart Detection</h3>
              <ul class="text-sm text-gray-600 text-left">
                <li>• Configurable day thresholds</li>
                <li>• Provider pattern analysis</li>
                <li>• Account status validation</li>
                <li>• Historical billing patterns</li>
              </ul>
            </div>
            <div class="bg-orange-50 p-6 rounded-lg">
              <i class="pi pi-chart-bar text-orange-500 text-3xl mb-3"></i>
              <h3 class="font-semibold mb-2">Risk Assessment</h3>
              <ul class="text-sm text-gray-600 text-left">
                <li>• Estimated exposure calculation</li>
                <li>• Provider impact analysis</li>
                <li>• Priority ranking system</li>
                <li>• Automated alerting</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

// State
const selectedDays = ref(45);

const runDetection = () => {
  toast.add({
    severity: 'info',
    summary: 'Detection Started',
    detail: `Scanning for bills missing > ${selectedDays.value} days`,
    life: 3000
  });
};
</script>

<style scoped>
.tem-missing-bills {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}
</style>