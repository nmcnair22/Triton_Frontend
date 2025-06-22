<script setup>
import { ref, watch, computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import Chart from 'primevue/chart';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
  },
  title: {
    type: String,
    default: ''
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  centerText: {
    type: String,
    default: ''
  }
});

const { isDarkTheme } = useLayout();
const chartData = ref(null);
const chartOptions = ref(null);

const totalValue = computed(() => {
  return props.data.reduce((sum, item) => sum + item.value, 0);
});

const setupChartData = () => {
  chartData.value = {
    labels: props.data.map(item => item.label),
    datasets: [
      {
        data: props.data.map(item => item.value),
        backgroundColor: props.colors,
        borderWidth: 0
      }
    ]
  };
};

const setupChartOptions = () => {
  const textColor = isDarkTheme.value ? '#fff' : '#333';
  
  chartOptions.value = {
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'bottom',
        labels: {
          color: textColor,
          font: {
            weight: 500
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / totalValue.value) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: props.showLabels,
        color: '#fff',
        font: {
          weight: 'bold'
        },
        formatter: (value) => {
          const percentage = ((value / totalValue.value) * 100).toFixed(1);
          return percentage > 5 ? `${percentage}%` : '';
        }
      }
    },
    cutout: props.centerText ? '60%' : '0',
    responsive: true,
    maintainAspectRatio: false
  };
};

watch([() => props.data, () => isDarkTheme.value], () => {
  setupChartData();
  setupChartOptions();
}, { immediate: true });
</script>

<template>
  <div class="relative">
    <h3 v-if="title" class="text-xl font-semibold mb-4">{{ title }}</h3>
    <div class="relative" style="height: 300px;">
      <Chart type="doughnut" :data="chartData" :options="chartOptions" />
      <div v-if="centerText" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-4xl font-bold">{{ centerText }}</div>
        </div>
      </div>
    </div>
  </div>
</template> 