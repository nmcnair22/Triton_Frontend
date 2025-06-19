<template>
  <div class="analytics-dashboard">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Performance Charts -->
      <Card>
        <template #header>
          <div class="p-4">
            <h3 class="text-lg font-semibold mb-2">Visit Performance Trends</h3>
            <p class="text-surface-600 text-sm">Weekly completion rates and quality scores</p>
          </div>
        </template>
        <template #content>
          <div class="p-4 pt-0">
            <div class="h-64 flex items-center justify-center bg-surface-50 dark:bg-surface-800 rounded">
              <div class="text-center">
                <i class="pi pi-chart-line text-4xl text-surface-400 mb-3"></i>
                <p class="text-surface-500">Performance chart coming soon</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Quality Metrics -->
      <Card>
        <template #header>
          <div class="p-4">
            <h3 class="text-lg font-semibold mb-2">Quality Distribution</h3>
            <p class="text-surface-600 text-sm">Customer satisfaction by service type</p>
          </div>
        </template>
        <template #content>
          <div class="p-4 pt-0">
            <div class="h-64 flex items-center justify-center bg-surface-50 dark:bg-surface-800 rounded">
              <div class="text-center">
                <i class="pi pi-chart-pie text-4xl text-surface-400 mb-3"></i>
                <p class="text-surface-500">Quality chart coming soon</p>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Key Metrics -->
    <div class="mt-6">
      <Card>
        <template #header>
          <div class="p-4">
            <h3 class="text-lg font-semibold">Key Analytics</h3>
          </div>
        </template>
        <template #content>
          <div class="p-4 pt-0">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-primary-600">{{ visitStats?.overview?.completionRate || 0 }}%</div>
                <div class="text-sm text-surface-600">Completion Rate</div>
              </div>
              <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-green-600">{{ visitStats?.overview?.avgQualityScore || 0 }}</div>
                <div class="text-sm text-surface-600">Avg Quality</div>
              </div>
              <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(visitStats?.overview?.totalRevenue || 0) }}</div>
                <div class="text-sm text-surface-600">Total Revenue</div>
              </div>
              <div class="text-center p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-orange-600">{{ visitStats?.overview?.total || 0 }}</div>
                <div class="text-sm text-surface-600">Total Visits</div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  visitStats: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['refresh']);

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}
</script>

<style scoped>
.analytics-dashboard {
  min-height: 400px;
}
</style> 