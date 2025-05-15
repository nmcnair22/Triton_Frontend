<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

/**
 * Guard component for conditionally rendering UI elements based on user permissions and roles
 * 
 * Examples:
 * 
 * <PermissionGuard permission="users.create">
 *   <Button label="Create User" />
 * </PermissionGuard>
 * 
 * <PermissionGuard :permissions="['users.update', 'users.delete']">
 *   <Button label="Manage Users" />
 * </PermissionGuard>
 * 
 * <PermissionGuard role="admin">
 *   <Button label="Admin Panel" />
 * </PermissionGuard>
 * 
 * <PermissionGuard :allPermissions="true" :permissions="['users.create', 'users.update']">
 *   <Button label="User Management" />
 * </PermissionGuard>
 */
const props = defineProps({
  /**
   * A single permission to check for
   */
  permission: {
    type: String,
    default: null
  },
  
  /**
   * A list of permissions to check for
   */
  permissions: {
    type: Array,
    default: () => []
  },
  
  /**
   * If true, checks for ALL permissions; if false (default), checks for ANY permission
   */
  allPermissions: {
    type: Boolean,
    default: false
  },
  
  /**
   * A single role to check for
   */
  role: {
    type: String,
    default: null
  },
  
  /**
   * A list of roles to check for
   */
  roles: {
    type: Array,
    default: () => []
  },
  
  /**
   * If true, renders the fallback slot when access is denied
   */
  showFallback: {
    type: Boolean,
    default: false
  }
});

const userStore = useUserStore();
const { hasPermission, hasRole } = storeToRefs(userStore);

/**
 * Safe wrapper for permission check with error handling
 */
const safeHasPermission = (permission) => {
  try {
    return hasPermission.value(permission);
  } catch (error) {
    console.error(`Error checking permission "${permission}":`, error);
    return false;
  }
};

/**
 * Safe wrapper for role check with error handling
 */
const safeHasRole = (role) => {
  try {
    return hasRole.value(role);
  } catch (error) {
    console.error(`Error checking role "${role}":`, error);
    return false;
  }
};

/**
 * Determines if the user has access based on the provided permissions and roles
 */
const canAccess = computed(() => {
  try {
    // Check single permission
    if (props.permission) {
      return safeHasPermission(props.permission);
    }
    
    // Check multiple permissions
    if (props.permissions && props.permissions.length > 0) {
      if (props.allPermissions) {
        // Must have ALL permissions
        return props.permissions.every(perm => safeHasPermission(perm));
      } else {
        // Only needs ANY permission
        return props.permissions.some(perm => safeHasPermission(perm));
      }
    }
    
    // Check single role
    if (props.role) {
      return safeHasRole(props.role);
    }
    
    // Check multiple roles
    if (props.roles && props.roles.length > 0) {
      return props.roles.some(role => safeHasRole(role));
    }
    
    // No conditions specified, allow access
    return true;
  } catch (error) {
    console.error('Error in PermissionGuard access check:', error);
    return false;
  }
});
</script>

<template>
  <template v-if="canAccess">
    <!-- Render default slot when access is allowed -->
    <slot></slot>
  </template>
  <template v-else-if="showFallback">
    <!-- Render fallback slot when access is denied and showFallback is true -->
    <slot name="fallback"></slot>
  </template>
</template> 