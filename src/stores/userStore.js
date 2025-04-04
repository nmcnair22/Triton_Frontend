import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '@/service/AuthService';

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(AuthService.getUserData() || null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isLoggedIn = computed(() => !!user.value);
  const username = computed(() => user.value?.name || '');
  const userEmail = computed(() => user.value?.email || '');
  const userAvatar = computed(() => user.value?.avatar || '/layout/images/profile.jpg');

  // Actions
  async function login(email, password) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.login(email, password);
      // The API returns data in format { user: {...}, token: "..." }
      user.value = response.user;
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to login';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    error.value = null;
    
    try {
      await AuthService.logout();
      user.value = null;
    } catch (err) {
      error.value = err.message || 'Failed to logout';
      console.error('Logout error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() {
    if (!AuthService.isLoggedIn()) return null;
    
    loading.value = true;
    error.value = null;
    
    try {
      const userData = await AuthService.getCurrentUser();
      user.value = userData;
      return userData;
    } catch (err) {
      error.value = err.message || 'Failed to fetch user data';
      console.error('Error fetching user data:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    user.value = null;
    error.value = null;
  }

  return {
    // State
    user,
    loading,
    error,
    
    // Getters
    isLoggedIn,
    username,
    userEmail,
    userAvatar,
    
    // Actions
    login,
    logout,
    fetchCurrentUser,
    resetState
  };
}); 