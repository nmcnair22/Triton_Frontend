<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/auth/AuthService';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const error = ref('');
const loading = ref(true);
const debugInfo = ref({});

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
  console.log('Microsoft callback page loaded');
  
  try {
    // Handle authentication using the unified auth service
    const result = AuthService.handleMicrosoftCallback();
    
    // Debug auth result
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Auth Result:', result);
    console.log('Token exists:', !!result.token);
    console.log('User:', result.user);
    console.log('Permissions:', result.permissions);
    
    if (result.success) {
      console.log('Successfully authenticated via Microsoft');
      
      // Debug stored auth data
      console.log('=== STORED AUTH DATA ===');
      console.log('Stored Token:', AuthService.getToken());
      console.log('Stored User:', AuthService.getUser());
      console.log('Stored Permissions:', AuthService.getPermissions());
      console.log('Has admin role:', AuthService.hasRole('admin'));
      console.log('LocalStorage permissions:', JSON.parse(localStorage.getItem('user_permissions') || '[]'));
      
      // After successful auth, fetch the current user with fresh permissions
      console.log('Fetching current user profile with up-to-date permissions...');
      try {
        const currentUser = await AuthService.getCurrentUser();
        console.log('CurrentUser API response:', currentUser);
        console.log('Updated permissions:', AuthService.getPermissions());
      } catch (userErr) {
        console.error('Error fetching current user:', userErr);
      }
      
      // Get user permissions for routing
      const userPermissions = AuthService.getPermissions();
      
      // Find an appropriate route based on permissions and stored redirect
      const redirectTo = findAccessibleRoute(userPermissions);
      
      // Redirect after a short delay (allows console logs to display)
      setTimeout(() => {
        router.push(redirectTo);
      }, 500);
      
      return;
    }
    
    // Handle auth failure
    error.value = result.error || 'Authentication failed';
    loading.value = false;
    
    // Store debug info
    debugInfo.value = {
      urlParams: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)).entries()),
      pathname: window.location.pathname,
      fullUrl: window.location.href
    };
    
    console.log('Auth debug info:', debugInfo.value);
  } catch (err) {
    console.error('Error in Microsoft callback:', err);
    error.value = err.message || 'Failed to authenticate with Microsoft';
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
      
      <!-- Debug information section -->
      <div v-if="Object.keys(debugInfo).length > 0" class="mb-4 p-4 bg-surface-100 dark:bg-surface-800 rounded text-left w-full max-w-lg">
        <h3 class="text-lg font-medium mb-2">Debug Information</h3>
        <pre class="text-xs overflow-auto">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
      </div>
      
      <Button label="Back to Login" @click="goToLogin" />
    </div>
  </div>
</template> 