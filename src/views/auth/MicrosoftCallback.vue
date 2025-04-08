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

onMounted(async () => {
  console.log('Microsoft callback page loaded');
  
  try {
    // Handle authentication using the unified auth service
    const result = AuthService.handleMicrosoftCallback();
    
    if (result.success) {
      console.log('Successfully authenticated via Microsoft');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        // Check for redirect path in localStorage
        const redirectPath = localStorage.getItem('auth_redirect');
        if (redirectPath) {
          localStorage.removeItem('auth_redirect');
          router.push(redirectPath);
        } else {
          router.push({ name: 'dashboard-marketing' });
        }
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