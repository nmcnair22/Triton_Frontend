<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';

const props = defineProps({
  /**
   * Array of permissions where user must have at least one to view content
   */
  permissions: {
    type: Array,
    default: () => []
  },
  /**
   * If true, user must have ALL permissions to view content
   * If false (default), user only needs ONE of the permissions
   */
  requireAll: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to render a fallback slot when permissions are missing
   */
  showFallback: {
    type: Boolean,
    default: true
  }
});

const userStore = useUserStore();

/**
 * Determines if the user has the required permissions
 */
const hasPermission = computed(() => {
  // No permissions specified means always allow
  if (!props.permissions || props.permissions.length === 0) {
    return true;
  }
  
  if (props.requireAll) {
    // User must have ALL permissions
    return props.permissions.every(permission => userStore.hasPermission(permission));
  } else {
    // User must have at least ONE permission
    return props.permissions.some(permission => userStore.hasPermission(permission));
  }
});
</script>

<template>
  <div>
    <!-- Show content if user has permissions -->
    <template v-if="hasPermission">
      <slot></slot>
    </template>
    
    <!-- Show fallback content if user lacks permissions -->
    <template v-else-if="showFallback">
      <slot name="fallback">
        <div class="permission-guard-fallback">
          <p class="text-surface-500 dark:text-surface-400 text-sm italic p-4 text-center">
            You don't have permission to view this content
          </p>
        </div>
      </slot>
    </template>
  </div>
</template>

<style scoped>
.permission-guard-fallback {
  border: 1px dashed var(--surface-300);
  border-radius: 4px;
  margin: 8px 0;
}
</style> 