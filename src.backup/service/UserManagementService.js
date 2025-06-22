import apiClient from '@/api/client';

/**
 * Service for admin user management operations
 */
export const UserManagementService = {
  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Options for the request
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {Object} options.filters - Filter criteria
   * @param {string} options.sortField - Field to sort by
   * @param {number} options.sortOrder - Sort order (1: ascending, -1: descending)
   * @returns {Promise} Promise with paginated users
   */
  async getUsers({ page = 1, limit = 10, filters = {}, sortField, sortOrder } = {}) {
    const params = {
      page,
      limit,
      ...filters
    };
    
    if (sortField) {
      params.sortField = sortField;
      params.sortOrder = sortOrder || 1;
    }
    
    const response = await apiClient.get('/users', params);
    return response.data;
  },
  
  /**
   * Get a specific user by ID
   * @param {number|string} id - User ID
   * @returns {Promise} Promise with user data
   */
  async getUser(id) {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} Promise with created user
   */
  async createUser(userData) {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },
  
  /**
   * Update an existing user
   * @param {number|string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Promise with updated user
   */
  async updateUser(id, userData) {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },
  
  /**
   * Delete a user
   * @param {number|string} id - User ID
   * @returns {Promise} Promise with deletion status
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
  
  /**
   * Get all available roles
   * @returns {Promise} Promise with roles list
   */
  async getRoles() {
    const response = await apiClient.get('/roles');
    return response.data;
  },
  
  /**
   * Get a specific role by ID
   * @param {number|string} id - Role ID
   * @returns {Promise} Promise with role data
   */
  async getRole(id) {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  },
  
  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Promise} Promise with created role
   */
  async createRole(roleData) {
    const response = await apiClient.post('/roles', roleData);
    return response.data;
  },
  
  /**
   * Update an existing role
   * @param {number|string} id - Role ID
   * @param {Object} roleData - Updated role data
   * @returns {Promise} Promise with updated role
   */
  async updateRole(id, roleData) {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response.data;
  },
  
  /**
   * Delete a role
   * @param {number|string} id - Role ID
   * @returns {Promise} Promise with deletion status
   */
  async deleteRole(id) {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },
  
  /**
   * Assign roles to a user
   * @param {number|string} userId - User ID
   * @param {Array} roles - Array of role IDs
   * @returns {Promise} Promise with assignment result
   */
  async assignRoles(userId, roles) {
    const response = await apiClient.post(`/users/${userId}/roles`, { roles });
    return response.data;
  },
  
  /**
   * Get all permissions
   * @returns {Promise} Promise with permissions list
   */
  async getPermissions() {
    const response = await apiClient.get('/permissions');
    return response.data;
  },
  
  /**
   * Get permissions for a specific user
   * @param {number|string} userId - User ID
   * @returns {Promise} Promise with user permissions
   */
  async getUserPermissions(userId) {
    const response = await apiClient.get(`/users/${userId}/permissions`);
    return response.data;
  },
  
  /**
   * Get permissions for a specific role
   * @param {number|string} roleId - Role ID
   * @returns {Promise} Promise with role permissions
   */
  async getRolePermissions(roleId) {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data;
  },
  
  /**
   * Assign permissions to a role
   * @param {number|string} roleId - Role ID
   * @param {Array} permissions - Array of permission IDs
   * @returns {Promise} Promise with assignment result
   */
  async assignPermissionsToRole(roleId, permissions) {
    const response = await apiClient.post(`/roles/${roleId}/permissions`, { permissions });
    return response.data;
  }
}; 