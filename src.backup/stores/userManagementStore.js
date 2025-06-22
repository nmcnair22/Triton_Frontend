import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserManagementService } from '@/service/UserManagementService';

export const useUserManagementStore = defineStore('userManagement', () => {
  // State
  const users = ref([]);
  const roles = ref([]);
  const permissions = ref([]);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  });
  const loading = ref(false);
  const error = ref(null);
  const filters = ref({});
  const sortField = ref('id');
  const sortOrder = ref(1); // 1 for ascending, -1 for descending

  // Getters
  const totalUsers = computed(() => pagination.value.total);
  const currentPage = computed(() => pagination.value.page);
  const totalPages = computed(() => pagination.value.lastPage);
  const itemsPerPage = computed(() => pagination.value.limit);

  // Actions
  async function fetchUsers() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.getUsers({
        page: pagination.value.page,
        limit: pagination.value.limit,
        filters: filters.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value
      });
      
      users.value = response.data;
      
      if (response.meta) {
        pagination.value = {
          page: response.meta.current_page,
          limit: response.meta.per_page,
          total: response.meta.total,
          lastPage: response.meta.last_page
        };
      }
      
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to fetch users';
      console.error('Error fetching users:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.getUser(id);
      return response;
    } catch (err) {
      error.value = err.message || `Failed to fetch user with ID ${id}`;
      console.error(`Error fetching user ID ${id}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createUser(userData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.createUser(userData);
      // Optionally refresh the users list
      await fetchUsers();
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to create user';
      console.error('Error creating user:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(id, userData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.updateUser(id, userData);
      // Update the user in the local array if it exists
      const index = users.value.findIndex(user => user.id === id);
      if (index !== -1) {
        users.value[index] = { ...users.value[index], ...response };
      }
      return response;
    } catch (err) {
      error.value = err.message || `Failed to update user with ID ${id}`;
      console.error(`Error updating user ID ${id}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteUser(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.deleteUser(id);
      // Remove the user from the local array
      users.value = users.value.filter(user => user.id !== id);
      // Update total count
      pagination.value.total--;
      return response;
    } catch (err) {
      error.value = err.message || `Failed to delete user with ID ${id}`;
      console.error(`Error deleting user ID ${id}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoles() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.getRoles();
      roles.value = response;
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to fetch roles';
      console.error('Error fetching roles:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getRole(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.getRole(id);
      return response;
    } catch (err) {
      error.value = err.message || `Failed to fetch role with ID ${id}`;
      console.error(`Error fetching role ID ${id}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPermissions() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.getPermissions();
      permissions.value = response;
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to fetch permissions';
      console.error('Error fetching permissions:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function assignRolesToUser(userId, roleIds) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.assignRoles(userId, roleIds);
      return response;
    } catch (err) {
      error.value = err.message || `Failed to assign roles to user with ID ${userId}`;
      console.error(`Error assigning roles to user ID ${userId}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createRole(roleData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.createRole(roleData);
      // Optionally refresh the roles list
      await fetchRoles();
      return response;
    } catch (err) {
      error.value = err.message || 'Failed to create role';
      console.error('Error creating role:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateRole(id, roleData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.updateRole(id, roleData);
      // Update the role in the local array if it exists
      const index = roles.value.findIndex(role => role.id === id);
      if (index !== -1) {
        roles.value[index] = { ...roles.value[index], ...response };
      }
      return response;
    } catch (err) {
      error.value = err.message || `Failed to update role with ID ${id}`;
      console.error(`Error updating role ID ${id}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteRole(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await UserManagementService.deleteRole(id);
      // Remove the role from the local array
      roles.value = roles.value.filter(role => role.id !== id);
      return response;
    } catch (err) {
      error.value = err.message || `Failed to delete role with ID ${id}`;
      console.error(`Error deleting role ID ${id}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setPage(page) {
    pagination.value.page = page;
  }

  function setLimit(limit) {
    pagination.value.limit = limit;
  }

  function setFilters(newFilters) {
    filters.value = newFilters;
    // Reset to first page when applying new filters
    pagination.value.page = 1;
  }

  function setSorting(field, order) {
    sortField.value = field;
    sortOrder.value = order;
  }

  function resetFilters() {
    filters.value = {};
    pagination.value.page = 1;
  }

  return {
    // State
    users,
    roles,
    permissions,
    pagination,
    loading,
    error,
    filters,
    sortField,
    sortOrder,
    
    // Getters
    totalUsers,
    currentPage,
    totalPages,
    itemsPerPage,
    
    // Actions
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    fetchRoles,
    getRole,
    fetchPermissions,
    assignRolesToUser,
    createRole,
    updateRole,
    deleteRole,
    setPage,
    setLimit,
    setFilters,
    setSorting,
    resetFilters
  };
}); 