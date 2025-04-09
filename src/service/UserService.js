import apiClient from '@/api/client';

/**
 * Service for user management operations
 */
export const UserService = {
  /**
   * Get all users with optional pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Optional filter parameters
   * @returns {Promise} Promise with user data
   */
  async getUsers(page = 1, limit = 10, filters = {}) {
    const params = {
      page,
      limit,
      ...filters
    };
    const response = await apiClient.get('/users', params);
    return response.data;
  },
  
  /**
   * Get a specific user by ID
   * @param {number} id - User ID
   * @returns {Promise} Promise with user data
   */
  async getUser(id) {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data including name, email, password, and role
   * @returns {Promise} Promise with created user data
   */
  async createUser(userData) {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },
  
  /**
   * Update an existing user
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Promise with updated user data
   */
  async updateUser(id, userData) {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },
  
  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise} Promise with deletion status
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
  
  /**
   * Get current user profile
   * @returns {Promise} Promise with user profile data
   */
  async getProfile() {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
  
  /**
   * Update current user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} Promise with updated profile data
   */
  async updateProfile(profileData) {
    const response = await apiClient.put('/user/profile', profileData);
    return response.data;
  },
  
  /**
   * Change current user password
   * @param {Object} passwordData - Password data including current_password, password, and password_confirmation
   * @returns {Promise} Promise with status
   */
  async changePassword(passwordData) {
    const response = await apiClient.post('/user/password', passwordData);
    return response.data;
  },
  
  /**
   * Get all available roles
   * @returns {Promise} Promise with roles data
   */
  async getRoles() {
    const response = await apiClient.get('/roles');
    return response.data;
  },
  
  /**
   * Assign roles to a user
   * @param {number} userId - User ID
   * @param {Array} roles - Array of role names or IDs
   * @returns {Promise} Promise with assignment status
   */
  async assignRoles(userId, roles) {
    const response = await apiClient.post(`/users/${userId}/roles`, { roles });
    return response.data;
  },
  
  /**
   * Get permissions for a user
   * @param {number} userId - User ID
   * @returns {Promise} Promise with permissions data
   */
  async getUserPermissions(userId) {
    const response = await apiClient.get(`/users/${userId}/permissions`);
    return response.data;
  }
}; 