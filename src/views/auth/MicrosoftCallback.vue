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
    
    // Log the full URL for debugging
    console.log('Current URL:', window.location.href);
    
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
    const token = urlParams.get('token') || hashParams.get('token') || hashParams.get('access_token');
    const userId = urlParams.get('user_id') || hashParams.get('user_id');
    const errorParam = urlParams.get('error') || hashParams.get('error');
    
    // Check for error parameter
    if (errorParam) {
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description') || 'Unknown error';
      error.value = `Authentication error: ${errorParam} - ${errorDescription}`;
      loading.value = false;
      return;
    }
    
    // Case 1: We have direct token access
    if (token) {
      console.log('Token found directly in URL/hash');
      
      // If user info is also provided, set it
      if (userId) {
        try {
          // Try to get user info from URL or make API call to fetch it
          const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/user/${userId}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            AuthService.setUser(userData);
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          // Continue anyway with the token
        }
      }
      
      // Store token and redirect
      AuthService.setToken(token);
      setTimeout(() => router.push({ name: 'dashboard-marketing' }), 500);
      return;
    }
    
    // Case 2: We have a code that needs to be exchanged
    else if (code) {
      console.log('Authorization code found, exchanging for token');
      try {
        // Exchange the code for a token
        await AuthService.handleMicrosoftCallback(code);
        
        // Redirect to dashboard
        setTimeout(() => router.push({ name: 'dashboard-marketing' }), 500);
        return;
      } catch (codeError) {
        console.error('Error exchanging code:', codeError);
        error.value = codeError.message;
        loading.value = false;
        return;
      }
    }
    
    // Case 3: Check if we might have been redirected with user data already set
    // This would happen if the backend set cookies/localstorage and redirected
    else if (AuthService.isLoggedIn()) {
      console.log('Already logged in, redirecting to dashboard');
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