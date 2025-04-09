<script setup>
import { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole } from '@/utils/rbac';

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

/**
 * Determines if the user has access based on the provided permissions and roles
 */
function canAccess() {
  // Check single permission
  if (props.permission) {
    return hasPermission(props.permission);
  }
  
  // Check multiple permissions
  if (props.permissions && props.permissions.length > 0) {
    return props.allPermissions 
      ? hasAllPermissions(props.permissions)
      : hasAnyPermission(props.permissions);
  }
  
  // Check single role
  if (props.role) {
    return hasRole(props.role);
  }
  
  // Check multiple roles
  if (props.roles && props.roles.length > 0) {
    return hasAnyRole(props.roles);
  }
  
  // No conditions specified, allow access
  return true;
}
</script>

<template>
  <template v-if="canAccess()">
    <!-- Render default slot when access is allowed -->
    <slot></slot>
  </template>
  <template v-else-if="showFallback">
    <!-- Render fallback slot when access is denied and showFallback is true -->
    <slot name="fallback"></slot>
  </template>
</template> 