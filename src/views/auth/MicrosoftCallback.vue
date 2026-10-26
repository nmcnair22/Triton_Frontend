<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/auth/AuthService';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const error = ref('');
const loading = ref(true);

// Find the best route to redirect to based on permissions
function findAccessibleRoute(permissions) {
  // First check for stored redirect path
  const storedRedirect = localStorage.getItem('auth_redirect');
  if (storedRedirect) {
    localStorage.removeItem('auth_redirect');
    return storedRedirect;
  }
  
  // Define fallback routes in order of preference (these should not require permissions)
  const fallbackRoutes = [
    '/field-services/visit-management',
    '/profile',
    '/'
  ];
  
  // Check if user has specific permissions and return appropriate route
  if (permissions.includes('dispatch:read')) {
    return '/dispatch/dashboard';
  }
  
  if (permissions.includes('inventory.view')) {
    return '/field-services/visit-management';
  }
  
  // Check user roles for routing (prioritize highest privilege role)
  const userData = AuthService.getUser();
  if (userData?.roles) {
    const userRoles = userData.roles.map(r => typeof r === 'string' ? r : r.name);
    
    // Priority order: admin > employee > partner > customer
    if (userRoles.includes('admin')) {
      return '/field-services/visit-management';
    }
    
    if (userRoles.includes('employee')) {
      return '/field-services/visit-management';
    }
    
    if (userRoles.includes('partner')) {
      return '/dashboard';
    }
    
    if (userRoles.includes('customer')) {
      return '/dashboard';
    }
  }
  
  // Return the first fallback route if no matching permissions
  return fallbackRoutes[0];
}

onMounted(async () => {
  try {
    let result;
    try {
      result = AuthService.handleMicrosoftCallback();
    } finally {
      // Remove credentials from the browser URL before fetching or navigating.
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
    
    if (result.success) {
      // After successful auth, fetch the current user with fresh permissions
      try {
        await AuthService.getCurrentUser();
      } catch (userErr) {
        console.error('Unable to refresh the signed-in user profile');
      }
      
      // Get user permissions for routing
      const userPermissions = AuthService.getPermissions();
      
      // Find an appropriate route based on permissions and stored redirect
      const redirectTo = findAccessibleRoute(userPermissions);
      
      // Redirect after completing authentication.
      setTimeout(() => {
        router.push(redirectTo);
      }, 500);
      
      return;
    }
    
    // Handle auth failure
    error.value = result.error || 'Authentication failed';
    loading.value = false;
    
  } catch {
    console.error('Unable to complete Microsoft sign-in');
    error.value = 'Failed to authenticate with Microsoft. Please try again.';
    loading.value = false;
  }
});

// Function to go back to login page
function goToLogin() {
  router.push('/auth/login');
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <div v-if="loading" class="text-center">
      <ProgressSpinner style="width: 50px; height: 50px" class="mb-4" />
      <h2 class="text-xl mb-2">Completing Microsoft Login</h2>
      <p class="text-surface-600 dark:text-surface-400">Please wait while we authenticate you...</p>
    </div>
    
    <div v-if="error" class="text-center">
      <i class="pi pi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
      <h2 class="text-xl mb-2">Authentication Failed</h2>
      <p class="text-red-500 mb-4">{{ error }}</p>
      
      <Button label="Back to Login" @click="goToLogin" />
    </div>
  </div>
</template>
