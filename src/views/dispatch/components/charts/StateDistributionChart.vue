<template>
  <div>
    <div v-if="loading" class="chart-skeleton flex align-items-center justify-content-center">
      <div class="skeleton-loader w-full h-20rem rounded"></div>
    </div>
    
    <div v-else-if="stateData.length === 0" class="flex flex-column align-items-center justify-content-center py-5">
      <i class="pi pi-map-marker text-2xl mb-2 text-surface-400"></i>
      <span class="text-surface-500">No geographic data available</span>
    </div>
    
    <div v-else class="state-chart">
      <div class="mb-4 text-center">
        <span class="text-sm text-surface-500 dark:text-surface-400">
          Top {{ Math.min(stateData.length, 10) }} States by Dispatch Count
        </span>
      </div>
      
      <ul class="list-none p-0 m-0">
        <li v-for="(state, index) in visibleStates" :key="index" class="mb-3">
          <div class="flex flex-column">
            <div class="flex justify-content-between mb-1">
              <div class="flex align-items-center">
                <div class="state-abbr">{{ state.state }}</div>
                <div class="text-sm ml-2">{{ getStateName(state.state) }}</div>
              </div>
              <div class="text-sm font-semibold">
                {{ state.count }}
              </div>
            </div>
            <div class="relative h-1rem bg-surface-200 dark:bg-surface-800 rounded-lg overflow-hidden">
              <div class="absolute top-0 left-0 h-full bg-blue-500"
                   :style="{ width: `${calculatePercentage(state.count)}%` }"></div>
            </div>
          </div>
        </li>
      </ul>
      
      <div v-if="stateData.length > 10" class="mt-4 text-center">
        <Button label="View All States" text @click="showAllStates = !showAllStates" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDispatchStore } from '@/stores/dispatchStore';

const props = defineProps({
  loadingKey: {
    type: String,
    default: 'dispatchesByState'
  }
});

// Store
const dispatchStore = useDispatchStore();

// State
const showAllStates = ref(false);

// Computed properties
const loading = computed(() => {
  return dispatchStore.loading[props.loadingKey];
});

const stateData = computed(() => {
  return dispatchStore.dispatchesByState || [];
});

const visibleStates = computed(() => {
  if (showAllStates.value) {
    return stateData.value;
  }
  return stateData.value.slice(0, 10);
});

const maxCount = computed(() => {
  if (!stateData.value.length) return 0;
  return Math.max(...stateData.value.map(state => state.count));
});

// State name mapping
const stateNames = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Calculate percentage for progress bar width
function calculatePercentage(count) {
  if (!maxCount.value) return 0;
  return (count / maxCount.value) * 100;
}

// Get full state name from abbreviation
function getStateName(abbr) {
  return stateNames[abbr] || abbr;
}
</script>

<style scoped>
.state-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-skeleton {
  min-height: 20rem;
}

.skeleton-loader {
  @apply bg-surface-200 dark:bg-surface-700 animate-pulse rounded;
}

.state-abbr {
  @apply bg-primary-700 text-white text-xs font-bold px-2 py-1 rounded;
  min-width: 2rem;
  text-align: center;
}
</style> 