<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/service/AuthService';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const error = ref('');
const loading = ref(true);
const debugInfo = ref({});

onMounted(async () => {
  console.log('Microsoft callback page loaded');
  
  try {
    // First check for auth data in URL hash using the new method
    const result = AuthService.handleAuthFromUrlHash();
    
    // Check if we successfully got auth data from URL hash
    if (result.success) {
      console.log('Successfully authenticated via URL hash');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push({ name: 'dashboard-marketing' });
      }, 500);
      return;
    }
    
    // If we have an error from the hash handler, show it
    if (result.error) {
      error.value = result.error;
      loading.value = false;
      return;
    }
    
    // If we get here, we couldn't find auth data in the URL hash,
    // so we'll try other methods
    
    // Log the full URL for debugging
    console.log('No URL hash auth data found, URL:', window.location.href);
    
    // Check if we have JSON data directly in the page content
    const pageContent = document.body.textContent || '';
    if (pageContent.trim().startsWith('{') && pageContent.includes('"token"')) {
      console.log('Found JSON data in page content');
      try {
        // Try to parse the JSON directly from the page
        const jsonData = JSON.parse(pageContent);
        debugInfo.value = { jsonData };
        
        // Store user and token from the JSON response
        if (jsonData.token && jsonData.user) {
          console.log('Found token and user in JSON data, setting credentials');
          AuthService.setToken(jsonData.token);
          AuthService.setUser(jsonData.user);
          
          // Wait a moment then redirect to dashboard
          setTimeout(() => {
            router.push({ name: 'dashboard-marketing' });
          }, 1000);
          return;
        }
      } catch (jsonError) {
        console.error('Error parsing JSON from page:', jsonError);
      }
    }
    
    // Check if authentication data is directly in the URL or hash
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Save all URL parameters for debugging
    debugInfo.value = {
      pageContent: pageContent.substring(0, 200) + '...',
      urlParams: Object.fromEntries(urlParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
      pathname: window.location.pathname
    };
    
    console.log('Debug info:', debugInfo.value);
    
    // Check for various ways the auth might be returned
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error') || hashParams.get('error');
    
    // Check for error parameter
    if (errorParam) {
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description') || 'Unknown error';
      error.value = `Authentication error: ${errorParam} - ${errorDescription}`;
      loading.value = false;
      return;
    }
    
    // Case 3: Check if we might have been redirected with user data already set
    // This would happen if the backend set cookies/localstorage and redirected
    if (AuthService.isAuthenticated()) {
      console.log('Already authenticated, redirecting to dashboard');
      setTimeout(() => router.push({ name: 'dashboard-marketing' }), 500);
      return;
    }
    
    // No login data found
    error.value = 'No authentication data received from Microsoft';
    loading.value = false;
    
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