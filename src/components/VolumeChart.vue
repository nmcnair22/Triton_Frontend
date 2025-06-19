<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'primevue/chart';
import { useLayout } from '@/layout/composables/layout';

const props = defineProps({
  title: {
    type: String,
    default: 'Dispatch Volume Over Time'
  },
  subtitle: {
    type: String,
    default: 'Number of dispatches over the selected time period'
  },
  data: {
    type: Array,
    default: () => []
  },
  timeUnit: {
    type: String,
    default: 'Daily'
  }
});

const { isDarkTheme } = useLayout();
const chartData = ref({});
const chartOptions = ref({});

const setupChartData = () => {
  // Generate sample data if none provided
  const sampleData = props.data.length ? props.data : generateSampleData();
  
  chartData.value = {
    labels: sampleData.map(item => item.date),
    datasets: [
      {
        label: 'Dispatches',
        data: sampleData.map(item => item.value),
        backgroundColor: '#60a5fa',
        borderRadius: 4,
        barThickness: 16
      }
    ]
  };
};

const setupChartOptions = () => {
  const textColor = isDarkTheme.value ? '#fff' : '#333';
  
  chartOptions.value = {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: textColor
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkTheme.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: textColor
        }
      }
    }
  };
};

// Generate sample data - will be replaced with real data in production
const generateSampleData = () => {
  const days = ['Apr 1', 'Apr 2', 'Apr 3', 'Apr 4', 'Apr 5', 'Apr 6', 'Apr 7', 'Apr 8', 'Apr 9', 'Apr 10', 
              'Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20',
              'Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27', 'Apr 28', 'Apr 29', 'Apr 30'];
  
  return days.map(day => ({
    date: day,
    value: Math.floor(Math.random() * 40) + 30
  }));
};

watch(() => isDarkTheme.value, () => {
  setupChartData();
  setupChartOptions();
});

onMounted(() => {
  setupChartData();
  setupChartOptions();
});
</script>

<template>
  <div class="bg-white dark:bg-surface-900 rounded-lg p-4">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-xl font-semibold">{{ title }}</h3>
        <p class="text-sm text-gray-500">{{ subtitle }}</p>
      </div>
      <div>
        <span class="text-sm font-medium">{{ timeUnit }}</span>
      </div>
    </div>
    
    <div style="height: 300px;">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template> 