<script setup>
import { ref, onMounted } from 'vue';
import { AuthService } from '@/auth/AuthService';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Divider from 'primevue/divider';

// Get current auth state
const token = ref(AuthService.getToken());
const user = ref(AuthService.getUser());
const permissions = ref(AuthService.getPermissions());
const refreshing = ref(false);

async function refreshUserData() {
  refreshing.value = true;
  try {
    // Force refresh from API
    await AuthService.getCurrentUser();
    
    // Update local refs
    token.value = AuthService.getToken();
    user.value = AuthService.getUser();
    permissions.value = AuthService.getPermissions();
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  } finally {
    refreshing.value = false;
  }
}

// Check important permissions
const hasUserView = ref(AuthService.hasPermission('users.view'));
const hasUserCreate = ref(AuthService.hasPermission('users.create'));
const hasRoleView = ref(AuthService.hasPermission('roles.view'));
const hasAdminRole = ref(AuthService.hasRole('admin'));

// Check local storage directly
const localStoragePermissions = ref(JSON.parse(localStorage.getItem('user_permissions') || '[]'));
const localStorageUser = ref(JSON.parse(localStorage.getItem('user') || 'null'));

onMounted(async () => {
  await refreshUserData();
});
</script>

<template>
  <Card class="mb-4">
    <template #title>
      <div class="flex align-items-center justify-content-between">
        <span>Authentication & Permissions Debug</span>
        <Button 
          icon="pi pi-refresh" 
          :loading="refreshing"
          @click="refreshUserData" 
          severity="secondary" 
          text
        />
      </div>
    </template>
    
    <template #content>
      <div class="mb-3">
        <h3 class="text-lg font-semibold">Authentication Status</h3>
        <p>Is Authenticated: <span class="font-bold">{{ !!token ? 'Yes' : 'No' }}</span></p>
        <p v-if="token">Token: <span class="text-xs opacity-50">{{ token.substring(0, 15) }}...</span></p>
      </div>
      
      <Divider />
      
      <div class="mb-3">
        <h3 class="text-lg font-semibold">User Information</h3>
        <p>Name: <span class="font-medium">{{ user?.name || 'Not available' }}</span></p>
        <p>Email: <span class="font-medium">{{ user?.email || 'Not available' }}</span></p>
        <p>ID: <span class="font-medium">{{ user?.id || 'Not available' }}</span></p>
      </div>
      
      <Divider />
      
      <div class="mb-3">
        <h3 class="text-lg font-semibold">Roles</h3>
        <p>Has 'admin' role: <span :class="hasAdminRole ? 'text-green-500 font-bold' : 'text-red-500 font-bold'">{{ hasAdminRole ? 'Yes' : 'No' }}</span></p>
        
        <div v-if="user?.roles && user.roles.length > 0" class="mt-2">
          <p class="mb-1">All roles:</p>
          <ul class="list-disc pl-4">
            <li v-for="(role, index) in user.roles" :key="index">
              {{ typeof role === 'string' ? role : role.name }}
            </li>
          </ul>
        </div>
        <p v-else class="text-yellow-500 font-medium">No roles assigned</p>
      </div>
      
      <Divider />
      
      <div class="mb-3">
        <h3 class="text-lg font-semibold">Key Permissions</h3>
        <p>Has 'users.view': <span :class="hasUserView ? 'text-green-500 font-bold' : 'text-red-500 font-bold'">{{ hasUserView ? 'Yes' : 'No' }}</span></p>
        <p>Has 'users.create': <span :class="hasUserCreate ? 'text-green-500 font-bold' : 'text-red-500 font-bold'">{{ hasUserCreate ? 'Yes' : 'No' }}</span></p>
        <p>Has 'roles.view': <span :class="hasRoleView ? 'text-green-500 font-bold' : 'text-red-500 font-bold'">{{ hasRoleView ? 'Yes' : 'No' }}</span></p>
      </div>
      
      <Divider />
      
      <div class="mb-3">
        <h3 class="text-lg font-semibold">All Permissions</h3>
        <div v-if="permissions && permissions.length > 0" class="mt-2">
          <ul class="list-disc pl-4 grid grid-cols-2 md:grid-cols-3">
            <li v-for="(permission, index) in permissions" :key="index" class="text-sm">
              {{ permission }}
            </li>
          </ul>
        </div>
        <p v-else class="text-yellow-500 font-medium">No permissions found</p>
      </div>
      
      <Divider />
      
      <div class="mb-3">
        <h3 class="text-lg font-semibold">LocalStorage Data</h3>
        <p class="text-sm mb-2">Check if localStorage matches the reactive state:</p>
        
        <div class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-48 mb-2">
          <p class="font-bold">user:</p>
          <pre>{{ JSON.stringify(localStorageUser, null, 2) }}</pre>
        </div>
        
        <div class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-48">
          <p class="font-bold">user_permissions:</p>
          <pre>{{ JSON.stringify(localStoragePermissions, null, 2) }}</pre>
        </div>
      </div>
    </template>
  </Card>
</template> 