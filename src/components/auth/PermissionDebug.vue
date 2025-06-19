<script setup>
import { ref, onMounted, computed } from 'vue';
import { AuthService } from '@/auth/AuthService';
import { useUserStore } from '@/stores/user';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Tag from 'primevue/tag';

// Get the user store for data comparisons
const userStore = useUserStore();

// Authentication status
const authToken = ref(AuthService.getToken());
const isAuthenticated = ref(AuthService.isAuthenticated());
const localStorageToken = ref(localStorage.getItem('token') || localStorage.getItem('auth_token'));

// User data
const storeUser = ref(userStore.user);
const authServiceUser = ref(AuthService.getUser());
const localStorageUser = ref(JSON.parse(localStorage.getItem('user') || 'null'));

// Permissions data
const storePermissions = ref(userStore.permissions);
const authServicePermissions = ref(AuthService.getPermissions());
const localStoragePermissions = ref(JSON.parse(localStorage.getItem('user_permissions') || '[]'));

// Common routes for testing
const testRoutes = [
  { path: '/dashboard', name: 'Dashboard', permissions: [] },
  { path: '/dispatch/dashboard', name: 'Dispatch Dashboard', permissions: ['dispatch:read'] },
  { path: '/user-management', name: 'User Management', permissions: ['users.view'] },
  { path: '/user-management/create', name: 'Create User', permissions: ['users.create'] },
  { path: '/profile', name: 'Profile', permissions: [] }
];

// Check if user data matches across storage locations
const userDataConsistent = computed(() => {
  // Check if user objects have the same ID
  const userId = storeUser.value?.id;
  return userId && 
    (authServiceUser.value?.id === userId) && 
    (localStorageUser.value?.id === userId);
});

// Check if permissions match across storage locations
const permissionsConsistent = computed(() => {
  const storePerms = JSON.stringify(storePermissions.value.sort());
  const authPerms = JSON.stringify(authServicePermissions.value.sort());
  const localPerms = JSON.stringify(localStoragePermissions.value.sort());
  
  return storePerms === authPerms && authPerms === localPerms;
});

// Check if tokens match across storage locations
const tokensConsistent = computed(() => {
  return authToken.value === localStorageToken.value;
});

// Check if a route would be accessible with current permissions
function canAccessRoute(requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No permissions required
  }
  
  // Check if the user has any of the required permissions
  return requiredPermissions.some(permission => 
    authServicePermissions.value.includes(permission)
  );
}

// Refresh user data
async function refreshUserData() {
  try {
    await userStore.fetchCurrentUser();
    
    // Refresh all reactive states
    authToken.value = AuthService.getToken();
    isAuthenticated.value = AuthService.isAuthenticated();
    localStorageToken.value = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    storeUser.value = userStore.user;
    authServiceUser.value = AuthService.getUser();
    localStorageUser.value = JSON.parse(localStorage.getItem('user') || 'null');
    
    storePermissions.value = userStore.permissions;
    authServicePermissions.value = AuthService.getPermissions();
    localStoragePermissions.value = JSON.parse(localStorage.getItem('user_permissions') || '[]');
  } catch (error) {
    console.error('Error refreshing user data:', error);
  }
}

// Initialize component
onMounted(async () => {
  await refreshUserData();
});
</script>

<template>
  <div class="p-4 max-w-5xl mx-auto">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Permission Debugger</h1>
      <Button label="Refresh Data" icon="pi pi-refresh" @click="refreshUserData" />
    </div>
    
    <!-- Authentication Status Summary -->
    <Panel header="Authentication Status" toggleable class="mb-6">
      <div class="flex flex-col gap-3">
        <Message v-if="!isAuthenticated" severity="error" :closable="false">
          <span class="font-bold">Not Authenticated</span> - No valid auth token found
        </Message>
        
        <Message v-else-if="!userDataConsistent || !permissionsConsistent || !tokensConsistent" severity="warn" :closable="false">
          <span class="font-bold">Inconsistent Auth State</span> - Authentication data doesn't match across storage locations
        </Message>
        
        <Message v-else severity="success" :closable="false">
          <span class="font-bold">Authenticated</span> - Authentication data is consistent
        </Message>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-key"></i>
              <span>Token Status</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-2">
              <Tag :severity="isAuthenticated ? 'success' : 'danger'">
                {{ isAuthenticated ? 'Valid Token' : 'No Valid Token' }}
              </Tag>
              <div v-if="!tokensConsistent" class="text-yellow-500 text-sm">
                <i class="pi pi-exclamation-triangle"></i> Token mismatch detected
              </div>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-user"></i>
              <span>User Data</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-2">
              <Tag :severity="userDataConsistent ? 'success' : 'warning'">
                {{ userDataConsistent ? 'Consistent' : 'Inconsistent' }}
              </Tag>
              <div v-if="storeUser">
                <span class="font-medium">{{ storeUser.name }}</span>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ storeUser.email }}</div>
              </div>
              <div v-else class="text-yellow-500 text-sm">
                <i class="pi pi-exclamation-triangle"></i> No user data found
              </div>
            </div>
          </template>
        </Card>
        
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-shield"></i>
              <span>Permissions</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-2">
              <Tag :severity="permissionsConsistent ? 'success' : 'warning'">
                {{ permissionsConsistent ? 'Consistent' : 'Inconsistent' }}
              </Tag>
              <div>
                <span class="text-sm">{{ authServicePermissions.length }} permissions found</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </Panel>
    
    <!-- Route Access Test -->
    <Panel header="Route Access Tests" toggleable class="mb-6">
      <div class="mb-4">
        <p class="text-surface-600 dark:text-surface-400">
          Test if you can access these routes with your current permissions
        </p>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-surface-100 dark:bg-surface-800">
              <th class="p-3 text-left">Route</th>
              <th class="p-3 text-left">Required Permissions</th>
              <th class="p-3 text-left">Access</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in testRoutes" :key="route.path" class="border-b border-surface-200 dark:border-surface-700">
              <td class="p-3">
                <div class="font-medium">{{ route.name }}</div>
                <div class="text-sm text-surface-600 dark:text-surface-400">{{ route.path }}</div>
              </td>
              <td class="p-3">
                <div v-if="route.permissions.length === 0" class="text-surface-500">
                  None required
                </div>
                <div v-else class="flex flex-wrap gap-1">
                  <Tag v-for="perm in route.permissions" :key="perm" severity="info" class="text-xs">
                    {{ perm }}
                  </Tag>
                </div>
              </td>
              <td class="p-3">
                <Tag :severity="canAccessRoute(route.permissions) ? 'success' : 'danger'">
                  {{ canAccessRoute(route.permissions) ? 'Allowed' : 'Denied' }}
                </Tag>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
    
    <!-- Detailed Data -->
    <Panel header="Detailed Data" toggleable>
      <TabView>
        <TabPanel header="Permissions">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 class="font-medium mb-2">Store Permissions</h3>
              <div v-if="storePermissions.length" class="flex flex-wrap gap-1">
                <Tag v-for="perm in storePermissions" :key="perm" class="text-xs">
                  {{ perm }}
                </Tag>
              </div>
              <div v-else class="text-surface-500">No permissions found</div>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">Service Permissions</h3>
              <div v-if="authServicePermissions.length" class="flex flex-wrap gap-1">
                <Tag v-for="perm in authServicePermissions" :key="perm" class="text-xs">
                  {{ perm }}
                </Tag>
              </div>
              <div v-else class="text-surface-500">No permissions found</div>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">LocalStorage Permissions</h3>
              <div v-if="localStoragePermissions.length" class="flex flex-wrap gap-1">
                <Tag v-for="perm in localStoragePermissions" :key="perm" class="text-xs">
                  {{ perm }}
                </Tag>
              </div>
              <div v-else class="text-surface-500">No permissions found</div>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel header="User Data">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium mb-2">Pinia Store User</h3>
              <pre class="bg-surface-100 dark:bg-surface-800 p-3 rounded text-xs overflow-auto">{{ JSON.stringify(storeUser, null, 2) }}</pre>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">Auth Service User</h3>
              <pre class="bg-surface-100 dark:bg-surface-800 p-3 rounded text-xs overflow-auto">{{ JSON.stringify(authServiceUser, null, 2) }}</pre>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">LocalStorage User</h3>
              <pre class="bg-surface-100 dark:bg-surface-800 p-3 rounded text-xs overflow-auto">{{ JSON.stringify(localStorageUser, null, 2) }}</pre>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel header="Tokens">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <h3 class="font-medium mb-2">Auth Service Token</h3>
              <div class="bg-surface-100 dark:bg-surface-800 p-3 rounded">
                <code class="text-sm break-all">{{ authToken || 'No token found' }}</code>
              </div>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">LocalStorage Token</h3>
              <div class="bg-surface-100 dark:bg-surface-800 p-3 rounded">
                <code class="text-sm break-all">{{ localStorageToken || 'No token found' }}</code>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </Panel>
  </div>
</template> 