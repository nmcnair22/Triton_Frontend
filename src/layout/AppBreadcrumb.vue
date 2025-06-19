<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const breadcrumbRoutes = ref([]);

// Process route parameters for dynamic breadcrumb paths
const replaceRouteParams = (path, params) => {
  let result = path;
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, value);
    });
  }
  return result;
};

// This will process route meta breadcrumb data
// and handle dynamic parameters in the breadcrumb paths
const processedBreadcrumbs = computed(() => {
  // If meta.breadcrumb is provided, use it directly
  if (route.meta.breadcrumb) {
    return route.meta.breadcrumb.map((item) => {
      // If this is an object with both label and path, process its path for params
      if (typeof item === 'object' && item.label) {
        return {
          label: item.label,
          path: replaceRouteParams(item.path, route.params)
        };
      }
      
      // For string breadcrumbs, we need to build the path
      // Find the matched route that corresponds to this breadcrumb
      const matchedRoute = route.matched.find(r => 
        r.path.includes(item.toLowerCase()) || 
        r.name === item.toLowerCase()
      );
      
      let path = '/';
      if (matchedRoute) {
        path = replaceRouteParams(matchedRoute.path, route.params);
      }
      
      return { label: item, path };
    });
  }
  
  // Otherwise build from the path segments
  const segments = route.path.split('/').filter(item => item !== '');
  return segments.map((segment, index) => {
    // Skip numeric segments (likely IDs)
    if (!isNaN(Number(segment))) {
      return null;
    }
    
    // Build the path for this segment
    const path = '/' + segments.slice(0, index + 1).join('/');
    
    // Format the label (capitalize words)
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return { label, path };
  }).filter(item => item !== null);
});

// Set the breadcrumbs based on the processed data
watch(
    processedBreadcrumbs,
    (newBreadcrumbs) => {
        breadcrumbRoutes.value = newBreadcrumbs;
    },
    { immediate: true }
);

// Handle breadcrumb navigation
const navigateTo = (path) => {
  if (path) {
    router.push(path);
  }
};
</script>

<template>
    <nav class="layout-breadcrumb">
        <ol>
            <template v-for="(item, i) in breadcrumbRoutes" :key="i">
                <li class="text-surface-950 dark:text-surface-0 title-h7 text-xl">
                    <a v-if="item.path && i < breadcrumbRoutes.length - 1" 
                       @click="navigateTo(item.path)"
                       class="cursor-pointer hover:text-primary transition-colors duration-200">
                        {{ item.label }}
                    </a>
                    <span v-else>{{ item.label }}</span>
                </li>
                <li v-if="i !== breadcrumbRoutes.length - 1" class="layout-breadcrumb-chevron">/</li>
            </template>
        </ol>
    </nav>
</template>
