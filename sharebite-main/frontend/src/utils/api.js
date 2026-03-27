import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type here - let it be set per request
  // For JSON requests, interceptor or request will set it
  // For FormData, browser will set it with boundary
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Always get fresh token from localStorage
  const token = localStorage.getItem('token');
  console.log("token sent to backend", token);
  // For FormData (multipart/form-data), don't set Content-Type manually
  // Let the browser set it with the proper boundary
  if (config.data instanceof FormData) {
    // Remove Content-Type to let browser set it with boundary
    // This is critical - browser must set Content-Type with boundary for multipart/form-data
    delete config.headers['Content-Type'];
    delete config.headers.common?.['Content-Type'];
    
    // Explicitly set Authorization header for FormData requests
    // Don't rely on default headers - set it directly
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  } else {
    // For regular requests, set both headers normally
    // Set Content-Type for JSON requests if not already set
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Remove authorization header if no token
      delete config.headers.Authorization;
    }
  }
  
  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasAuthHeader: !!config.headers.Authorization,
      authHeaderValue: config.headers.Authorization ? config.headers.Authorization.substring(0, 20) + '...' : 'none',
      isFormData: config.data instanceof FormData,
      contentType: config.headers['Content-Type']
    });
  }
  
  // Store the original URL for error handling
  config.metadata = { startTime: new Date(), url: config.url };
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                          requestUrl.includes('/auth/register');
    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorType = errorData?.error;
    
    // Don't clear auth for database errors - these are temporary issues
    const isDatabaseError = status === 503 || errorType === 'DATABASE_ERROR';
    const isServerError = status >= 500;
    const isOnAuthPage = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register');
    
    // Handle 401 Unauthorized and 403 Forbidden - token expired, invalid, or missing
    // Only logout if it's clearly an authentication error, not a permission issue
    if ((status === 401 || status === 403) && !isAuthEndpoint && !isDatabaseError && !isServerError) {
      const token = localStorage.getItem('token');
      
      // Only logout if:
      // 1. We have a token (means it was sent but rejected)
      // 2. We're not on auth pages
      // 3. The error message clearly indicates authentication failure (not just permission)
      // 4. It's not a user status issue (PENDING users might get 403 but shouldn't be logged out)
      if (token && !isOnAuthPage) {
        const errorMessage = errorData?.message?.toLowerCase() || '';
        const isAuthError = (errorType === 'UNAUTHORIZED' || errorType === 'FORBIDDEN') &&
                           (errorMessage.includes('token') ||
                            errorMessage.includes('authentication') ||
                            errorMessage.includes('unauthorized') ||
                            errorMessage.includes('forbidden') ||
                            errorMessage.includes('login') ||
                            errorMessage.includes('expired') ||
                            errorMessage.includes('invalid'));
        
        // Don't logout for permission errors (like user not approved yet)
        const isPermissionError = errorMessage.includes('permission') ||
                                  errorMessage.includes('not approved') ||
                                  errorMessage.includes('pending') ||
                                  errorMessage.includes('access denied') ||
                                  requestUrl.includes('/users/pending') ||
                                  requestUrl.includes('/users/');
        
        if (isAuthError && !isPermissionError) {
          console.warn('Authentication failed, clearing session:', {
            status: status,
            url: requestUrl,
            message: errorData?.message,
            errorType: errorType
          });
          
          // Clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userType');
          localStorage.removeItem('userId');
          
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        } else {
          // 401/403 but not clearly an auth error - might be permission issue or user not approved
          console.warn('Got 401/403 but not clearing session - might be permission/user status issue:', {
            status: status,
            url: requestUrl,
            message: errorData?.message
          });
        }
      }
    }
    
    // Log database errors for debugging
    if (isDatabaseError) {
      console.error('Database connection error:', {
        url: requestUrl,
        message: errorData?.message
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;

