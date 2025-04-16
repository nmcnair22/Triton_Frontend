<template>
    <Card class="shadow-1 border-round-lg">
        <template #title>
            <div class="flex justify-content-between align-items-center">
                <h3 class="font-semibold text-lg m-0">Dispatch Volume</h3>
                <div class="flex gap-2">
                    <Button 
                        v-if="debug" 
                        icon="pi pi-refresh" 
                        severity="secondary"
                        outlined
                        text 
                        aria-label="Refresh data (Debug)" 
                        title="Refresh data (Debug)"
                        disabled  
                    />
                </div>
            </div>
        </template>
        
        <div class="flex flex-column">
            <!-- Loading state -->
            <div v-if="loading" class="flex flex-column align-items-center justify-content-center gap-2 py-5">
                <ProgressSpinner style="width:50px;height:50px" strokeWidth="3" animationDuration=".5s" />
                <span class="text-sm text-color-secondary">Loading dispatch data...</span>
            </div>
            
            <!-- Error state -->
            <div v-else-if="hasError" class="flex flex-column align-items-center justify-content-center py-5 gap-2">
                <i class="pi pi-exclamation-triangle text-3xl text-red-500"></i>
                <span class="text-red-500">{{ errorMessage }}</span>
                <Button label="Retry" icon="pi pi-refresh" severity="danger" size="small" @click="retryFetch" />
            </div>
            
            <!-- No data state -->
            <div v-else-if="!hasSufficientData" class="flex flex-column align-items-center justify-content-center py-5 gap-2">
                <i class="pi pi-chart-bar text-3xl text-color-secondary"></i>
                <span class="text-color-secondary">No dispatch volume data available</span>
                <span v-if="dataSample" class="text-xs text-color-secondary">Sample: {{ dataSample }}</span>
            </div>
            
            <!-- Data state -->
            <div v-else class="pt-3">
                <div class="flex justify-content-between mb-3">
                    <div class="flex flex-column gap-1">
                        <span class="text-sm text-color-secondary">Total Dispatches</span>
                        <span class="text-xl font-semibold">{{ totalDispatches }}</span>
                    </div>
                    <div class="flex flex-column gap-1">
                        <span class="text-sm text-color-secondary">Average Per Day</span>
                        <span class="text-xl font-semibold">{{ avgPerDay }}</span>
                    </div>
                    <div class="flex flex-column gap-1">
                        <span class="text-sm text-color-secondary">Most Active Day</span>
                        <span class="text-xl font-semibold">{{ mostActiveDay }}</span>
                    </div>
                </div>
                
                <Chart 
                    ref="dispatchChart"
                    type="bar" 
                    :data="chartData" 
                    :options="chartOptions" 
                    class="h-20rem w-full"
                />
            </div>
        </div>
    </Card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';
import Chart from 'primevue/chart';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import { format, parseISO, isValid } from 'date-fns';

const dispatchStore = useDispatchStore();
const dispatchChart = ref(null);
const debug = ref(process.env.NODE_ENV === 'development');
const dataError = ref(null);

// Define loading computed property explicitly 
const loading = computed(() => dispatchStore.loading.volumeStats);

// Add computed properties for error handling
const hasError = computed(() => !!dispatchStore.errors.volumeStats);
const errorMessage = computed(() => dispatchStore.errors.volumeStats || 'An unknown error occurred.');

console.log('DispatchVolumeChart: Component initialized');
console.log('DispatchVolumeChart: volumeData is loaded?', !!dispatchStore.dispatchVolume);
console.log('DispatchVolumeChart: volumeData records:', dispatchStore.dispatchVolume?.length || 0);

onMounted(() => {
    console.log('DispatchVolumeChart: onMounted - chart ready');
    // No data fetch needed here, parent component handles it
});

// Watcher to debug store data changes
watch(() => dispatchStore.dispatchVolume, (newValue, oldValue) => {
  console.log('DispatchVolumeChart: Watcher triggered for dispatchStore.dispatchVolume');
  console.log('DispatchVolumeChart: New value length:', newValue?.length);
  console.log('DispatchVolumeChart: Old value length:', oldValue?.length);
  if (newValue?.length > 0) {
     console.log('DispatchVolumeChart: First new record:', JSON.stringify(newValue[0]));
     // Optionally force chart refresh if needed
     dispatchChart.value?.refresh(); 
  }
}, { deep: true });

// Watch for filter changes to refresh data
// No longer needed, chart reacts to store changes automatically
/*
watch(() => [dispatchStore.dateRange, dispatchStore.selectedCustomerId, dispatchStore.selectedProjectName], 
    () => {
        console.log('DispatchVolumeChart: Filters changed, refreshing data');
        fetchData();
    }, 
    { deep: true }
);
*/

/*
const fetchData = async () => {
    console.log('DispatchVolumeChart: Fetching dispatch volume data');
    try {
        await dispatchStore.fetchDispatchVolume();
        console.log(`DispatchVolumeChart: Fetched ${dispatchStore.dispatchVolume?.length || 0} volume records`);
    } catch (error) {
        console.error('DispatchVolumeChart: Error fetching dispatch volume:', error);
    }
};
*/

const hasData = computed(() => {
    const hasVolume = Array.isArray(dispatchStore.dispatchVolume) && dispatchStore.dispatchVolume.length > 0;
    console.log('DispatchVolumeChart: hasData check -', hasVolume ? 'Data available' : 'No data');
    
    if (hasVolume && debug.value) {
        // Log some sample data to help debugging
        console.log('DispatchVolumeChart: First volume record:', dispatchStore.dispatchVolume[0]);
    }
    
    return hasVolume;
});

const dataSample = computed(() => {
    if (!hasData.value) return null;
    const sample = dispatchStore.dispatchVolume[0];
    return sample ? JSON.stringify(sample).substring(0, 100) + '...' : null;
});

// Helper function to safely parse dates
const safeParseDate = (dateString) => {
    try {
        const parsedDate = parseISO(dateString);
        return isValid(parsedDate) ? parsedDate : null;
    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return null;
    }
};

// Format date for display
const formatDate = (dateString) => {
    try {
        const date = safeParseDate(dateString);
        if (!date) {
            console.warn('DispatchVolumeChart: Invalid date string:', dateString);
            return dateString;
        }
        return format(date, 'MMM d'); // Format as "Jan 1"
    } catch (error) {
        console.error('DispatchVolumeChart: Error formatting date:', error);
        return dateString;
    }
};

const groupedData = computed(() => {
    console.log('DispatchVolumeChart: Recalculating groupedData...');
    if (!hasData.value) {
        console.log('DispatchVolumeChart: No data to group for groupedData');
        return [];
    }

    try {
        // Group by date and sum counts
        const groupedByDate = {};
        
        dispatchStore.dispatchVolume.forEach(item => {
            // Get the date value using the correct property name
            const dateValue = item.dispatch_date;
            
            if (!dateValue) {
                console.warn('DispatchVolumeChart: Record missing dispatch_date property:', item);
                return;
            }
            
            const parsedDate = safeParseDate(dateValue);
            if (!parsedDate) {
                console.warn('DispatchVolumeChart: Invalid date:', dateValue);
                return;
            }
            
            // Format as YYYY-MM-DD for consistent keys
            const dateKey = format(parsedDate, 'yyyy-MM-dd');
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = {
                    date: dateKey,
                    total: 0
                };
            }
            
            // Add the count to the total using the correct property name
            groupedByDate[dateKey].total += Number(item.daily_dispatch_count || 0);
        });
        
        // Convert to array and sort by date
        const result = Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
        console.log(`DispatchVolumeChart: Grouped ${dispatchStore.dispatchVolume.length} records into ${result.length} dates`);
        
        if (debug.value && result.length > 0) {
            console.log('DispatchVolumeChart: Sample grouped data:', result[0]);
        }
        
        console.log('DispatchVolumeChart: Returning groupedData with length:', result.length);
        return result;
    } catch (error) {
        console.error('DispatchVolumeChart: Error grouping data:', error);
        return [];
    }
});

const chartData = computed(() => {
    if (!hasData.value) return { labels: [], datasets: [] };
    
    const labels = groupedData.value.map(item => formatDate(item.date));
    const documentStyle = getComputedStyle(document.documentElement);
    
    // Create a single dataset for dispatch counts
    const totalData = groupedData.value.map(item => item.total);
    
    return {
        labels,
        datasets: [
            {
                type: 'bar',
                label: 'Dispatches',
                backgroundColor: documentStyle.getPropertyValue('--primary-500'),
                data: totalData
            }
        ]
    };
});

const chartOptions = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    
    return {
        maintainAspectRatio: false,
        aspectRatio: 1.5,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    padding: 15
                },
                position: 'bottom'
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    display: false
                },
                border: {
                    color: surfaceBorder
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                },
                border: {
                    color: surfaceBorder
                }
            }
        }
    };
});

const hasSufficientData = computed(() => hasData.value);

const totalDispatches = computed(() => {
    if (!hasData.value) return '0';
    
    const total = groupedData.value.reduce((sum, item) => sum + item.total, 0);
    return total.toLocaleString();
});

const avgPerDay = computed(() => {
    if (!hasData.value) return '0';
    
    const days = groupedData.value.length || 1;
    const total = groupedData.value.reduce((sum, item) => sum + item.total, 0);
    
    const avg = days > 0 ? total / days : 0;
    return Math.round(avg).toLocaleString();
});

const mostActiveDay = computed(() => {
    if (!hasData.value) return 'N/A';
    
    const dates = groupedData.value.map(item => item.date);
    
    if (dates.length === 0) return 'N/A';
    
    let maxIndex = 0;
    let maxValue = 0;
    
    groupedData.value.forEach((item, index) => {
        if (item.total > maxValue) {
            maxValue = item.total;
            maxIndex = index;
        }
    });
    
    return formatDate(groupedData.value[maxIndex].date);
});

// Add method to retry fetching data
const retryFetch = () => {
    console.log('DispatchVolumeChart: Retrying fetchVolumeStats');
    dispatchStore.fetchVolumeStats(); // Call the specific action for this data
};
</script>

<style scoped>
.chart-container {
  min-height: 200px;
}
</style> 