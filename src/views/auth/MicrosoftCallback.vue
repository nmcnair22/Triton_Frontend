<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/service/AuthService';

const router = useRouter();
const error = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    // Check if authentication data is directly in the URL or hash
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for various ways the auth might be returned
    const code = urlParams.get('code');
    const token = urlParams.get('token') || hashParams.get('token') || hashParams.get('access_token');
    const userId = urlParams.get('user_id') || hashParams.get('user_id');
    
    // Case 1: We have direct token access
    if (token) {
      console.log('Token found directly in URL/hash');
      
      // If user info is also provided, set it
      if (userId) {
        // Try to get user info from URL or make API call to fetch it
        const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/${userId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          AuthService.setUser(userData);
        }
      }
      
      // Store token and redirect
      AuthService.setToken(token);
      router.push({ name: 'dashboard-marketing' });
      return;
    }
    
    // Case 2: We have a code that needs to be exchanged
    else if (code) {
      console.log('Authorization code found, exchanging for token');
      // Exchange the code for a token
      await AuthService.handleMicrosoftCallback(code);
      
      // Redirect to dashboard
      router.push({ name: 'dashboard-marketing' });
      return;
    }
    
    // Case 3: Check if we might have been redirected with user data already set
    // This would happen if the backend set cookies/localstorage and redirected
    else if (AuthService.isLoggedIn()) {
      console.log('Already logged in, redirecting to dashboard');
      router.push({ name: 'dashboard-marketing' });
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
      <Button label="Back to Login" @click="router.push('/auth/login')" />
    </div>
  </div>
</template> 