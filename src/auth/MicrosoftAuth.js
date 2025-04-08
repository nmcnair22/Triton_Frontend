/**
 * Microsoft Authentication Service
 * Handles Microsoft OAuth authentication flow for the application
 */

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const BASE_URL = API_URL.replace('/api', ''); // Base URL without /api for web routes
const SPA_CALLBACK_PATH = '/auth/microsoft-callback'; // Frontend callback route

/**
 * Microsoft Authentication Service
 */
export const MicrosoftAuth = {
  /**
   * Initiates the Microsoft OAuth login flow
   * Redirects the user to the Microsoft login page
   */
  login() {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in localStorage to verify later
    localStorage.setItem('auth_state', state);
    
    // Define the callback URL for our SPA (where we want to be redirected after auth)
    const redirectUri = encodeURIComponent(`${window.location.origin}${SPA_CALLBACK_PATH}`);
    
    // Build the auth URL with SPA-specific parameters
    const authUrl = `${BASE_URL}/auth/azure?state=${state}&redirect_uri=${redirectUri}&from_spa=true`;
    
    console.log(`Redirecting to Microsoft login at: ${authUrl}`);
    
    // Redirect to the auth URL
    window.location.href = authUrl;
  },
  
  /**
   * Handles the Microsoft auth response from URL hash
   * @returns {Object} Result with success flag and user data or error
   */
  handleCallback() {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for errors
      if (hashParams.has('error')) {
        const error = decodeURIComponent(hashParams.get('error'));
        console.error('Authentication error:', error);
        return { success: false, error };
      }
      
      // Look for token
      const token = hashParams.get('token');
      if (!token) {
        return { 
          success: false, 
          error: 'No authentication token received'
        };
      }
      
      // Parse user data if available
      let userData = null;
      if (hashParams.has('user')) {
        try {
          // User data is base64 encoded JSON
          userData = JSON.parse(atob(hashParams.get('user')));
        } catch (e) {
          console.error('Error parsing user data:', e);
          return { 
            success: false, 
            error: 'Error parsing user data from Microsoft login'
          };
        }
      }
      
      // Parse permissions if available
      let permissions = [];
      if (hashParams.has('permissions')) {
        try {
          // Permissions are base64 encoded JSON array
          permissions = JSON.parse(atob(hashParams.get('permissions')));
        } catch (e) {
          console.error('Error parsing permissions data:', e);
        }
      }
      
      // Verify state if provided
      const state = hashParams.get('state');
      const storedState = localStorage.getItem('auth_state');
      
      if (state && storedState && state !== storedState) {
        // State mismatch - possible CSRF attack
        console.error('State mismatch in auth callback');
        return { 
          success: false, 
          error: 'Security validation failed. Please try again.' 
        };
      }
      
      return { 
        success: true, 
        token,
        user: userData,
        permissions
      };
    }
    
    // If we reach here, there's no hash in the URL
    return { 
      success: false, 
      error: 'No authentication data found in URL'
    };
  },
  
  /**
   * Attempt to parse authentication data from page content
   * This is a fallback method for when hash-based auth fails
   * @returns {Object} Result with success flag and user data or error
   */
  parseAuthFromPageContent() {
    const pageContent = document.body.textContent || '';
    if (pageContent.trim().startsWith('{') && pageContent.includes('"token"')) {
      try {
        // Try to parse the JSON directly from the page
        const jsonData = JSON.parse(pageContent);
        
        // Check if we have the necessary authentication data
        if (jsonData.token && jsonData.user) {
          return { 
            success: true, 
            token: jsonData.token,
            user: jsonData.user,
            permissions: jsonData.permissions || []
          };
        }
      } catch (jsonError) {
        console.error('Error parsing JSON from page:', jsonError);
      }
    }
    
    return { 
      success: false, 
      error: 'No valid authentication data found in page content'
    };
  }
};

export default MicrosoftAuth; 