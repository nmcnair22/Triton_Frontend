<template>
  <div class="card">
    <h3>Multiple Role Support Demo</h3>
    
    <div class="mb-4">
      <h4>Current User Roles:</h4>
      <div v-if="userRoles.length > 0">
        <Tag v-for="role in userRoles" :key="role" :value="role" class="mr-2 mb-1" />
      </div>
      <p v-else class="text-gray-500">No roles assigned</p>
    </div>
    
    <div class="mb-4">
      <h4>Effective Permissions:</h4>
      <div v-if="effectivePermissions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <small v-for="permission in effectivePermissions" :key="permission" 
               class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">
          {{ permission }}
        </small>
      </div>
      <p v-else class="text-gray-500">No permissions available</p>
    </div>
    
    <div class="mb-4">
      <h4>Role Checks:</h4>
      <div class="grid grid-cols-2 gap-2">
        <div v-for="role in allRoles" :key="role" class="flex items-center">
          <i :class="hasRole(role) ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" class="mr-2"></i>
          <span>{{ role }}</span>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4>Multi-Role Checks:</h4>
      <div class="space-y-2">
        <div class="flex items-center">
          <i :class="hasAnyRole(['admin', 'employee']) ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" class="mr-2"></i>
          <span>Has Admin OR Employee: {{ hasAnyRole(['admin', 'employee']) }}</span>
        </div>
        <div class="flex items-center">
          <i :class="hasAllRoles(['admin', 'employee']) ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" class="mr-2"></i>
          <span>Has Admin AND Employee: {{ hasAllRoles(['admin', 'employee']) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AuthService } from '@/auth/AuthService';
import { getAllRoles, getEffectivePermissions } from '@/constants/roleConstants';
import Tag from 'primevue/tag';

const userRoles = computed(() => AuthService.getUserRoles());
const allRoles = computed(() => getAllRoles());
const effectivePermissions = computed(() => {
  const user = AuthService.getUser();
  return getEffectivePermissions(user);
});

const hasRole = (role) => AuthService.hasRole(role);
const hasAnyRole = (roles) => AuthService.hasAnyRole(roles);
const hasAllRoles = (roles) => AuthService.hasAllRoles(roles);
</script> 