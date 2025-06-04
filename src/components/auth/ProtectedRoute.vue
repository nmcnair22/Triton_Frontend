<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/auth/AuthService';
import { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole } from '@/utils/rbac';
import ProgressSpinner from 'primevue/progressspinner';

/**
 * Protected Route Component
 * Wraps content that requires authentication or specific permissions
 * 
 * Examples:
 * 
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute permission="users.create">
 *   <UserCreateForm />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute :permissions="['users.view', 'users.create']">
 *   <UserManagement />
 * </ProtectedRoute>
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
   * Redirect path if authentication fails
   */
  redirectTo: {
    type: String,
    default: '/auth/login'
  },
  
  /**
   * Redirect path if permission check fails
   */
  permissionDeniedRedirect: {
    type: String,
    default: '/auth/access'
  }
});

const router = useRouter();
const isAuthenticated = ref(false);
const hasAccess = ref(false);
const loading = ref(true);

// Determine if the user has proper permissions
const checkAccess = () => {
  // First check authentication
  const authenticated = AuthService.isAuthenticated();
  isAuthenticated.value = authenticated;
  
  if (!authenticated) {
    return false;
  }
  
  // Check permission requirements
  if (props.permission) {
    return hasPermission(props.permission);
  }
  
  if (props.permissions && props.permissions.length > 0) {
    return props.allPermissions
      ? hasAllPermissions(props.permissions)
      : hasAnyPermission(props.permissions);
  }
  
  // Check role requirements
  if (props.role) {
    return hasRole(props.role);
  }
  
  if (props.roles && props.roles.length > 0) {
    return hasAnyRole(props.roles);
  }
  
  // If we have no specific checks, allow access for authenticated users
  return true;
};

// For computed state, update when dependencies change
const showContent = computed(() => {
  return isAuthenticated.value && hasAccess.value;
});

// On component mount, check permissions and handle redirects
onMounted(async () => {
  try {
    // Add a small delay to prevent immediate flicker
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check access
    hasAccess.value = checkAccess();
    
    if (!isAuthenticated.value) {
      // Store current path for redirect after login
      localStorage.setItem('auth_redirect', router.currentRoute.value.fullPath);
      router.push(props.redirectTo);
    } else if (!hasAccess.value) {
      // Redirect to access denied page if authenticated but missing permissions
      router.push({
        path: props.permissionDeniedRedirect,
        query: { from: router.currentRoute.value.fullPath }
      });
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <!-- Show loading spinner while checking permissions -->
    <div v-if="loading" class="flex justify-center items-center p-4">
      <ProgressSpinner style="width: 50px; height: 50px" class="mb-4" />
      <div class="ml-3">Checking permissions...</div>
    </div>
    
    <!-- Show content when authenticated and authorized -->
    <slot v-else-if="showContent"></slot>
  </div>
</template> 