import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '@/auth/AuthService';
import { UserService } from '@/service/UserService';

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(AuthService.getUser() || null);
  const permissions = ref(AuthService.getPermissions() || []);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isLoggedIn = computed(() => !!user.value);
  const username = computed(() => user.value?.name || '');
  const userEmail = computed(() => user.value?.email || '');
  const userAvatar = computed(() => user.value?.avatar || '/layout/images/profile.jpg');
  const roles = computed(() => user.value?.roles || []);
  
  const hasPermission = computed(() => (permission) => {
    return AuthService.hasPermission(permission);
  });
  
  const hasRole = computed(() => (role) => {
    return AuthService.hasRole(role);
  });

  // Actions
  async function login(email, password, remember = false) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await AuthService.loginWithCredentials(email, password, remember);
      
      if (!result.success) {
        error.value = result.error || 'Login failed';
        throw new Error(result.error || 'Login failed');
      }
      
      // Update local state
      user.value = AuthService.getUser();
      permissions.value = AuthService.getPermissions();
      
      return result;
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
      permissions.value = [];
    } catch (err) {
      error.value = err.message || 'Failed to logout';
      console.error('Logout error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() {
    if (!AuthService.isAuthenticated()) return null;
    
    loading.value = true;
    error.value = null;
    
    try {
      const userData = await AuthService.getCurrentUser();
      user.value = userData;
      permissions.value = AuthService.getPermissions();
      
      return userData;
    } catch (err) {
      error.value = err.message || 'Failed to fetch user data';
      console.error('Error fetching user data:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  async function updateProfile(profileData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserService.updateProfile(profileData);
      // Update local user data with the returned profile
      user.value = { ...user.value, ...response.user };
      
      // Also update in AuthService
      AuthService.setUser(user.value);
      
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to update profile';
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function changePassword(passwordData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserService.changePassword(passwordData);
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to change password';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function resetState() {
    user.value = null;
    permissions.value = [];
    error.value = null;
  }

  return {
    // State
    user,
    permissions,
    loading,
    error,
    
    // Getters
    isLoggedIn,
    username,
    userEmail,
    userAvatar,
    roles,
    hasPermission,
    hasRole,
    
    // Actions
    login,
    logout,
    fetchCurrentUser,
    updateProfile,
    changePassword,
    resetState
  };
}); 